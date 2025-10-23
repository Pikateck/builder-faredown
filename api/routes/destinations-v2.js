const express = require("express");
/**
 * Destinations API v2
 * Uses materialized view and search function for fast, comprehensive search
 * Implements the complete specification for destination master
 */

const router = express.Router();
const { Pool } = require("pg");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// In-memory LRU cache for search results
class LRUCache {
  constructor(maxSize = 200, ttl = 60000) { // 200 items, 60 second TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

const searchCache = new LRUCache(200, 60000); // Cache for 60 seconds

/**
 * GET /api/destinations/search
 * Smart search with alias resolution, materialized view, and caching
 * Query params: q (required), limit=20, types=city,country,region, only_active=true
 */
router.get("/search", async (req, res) => {
  const timings = {
    start: Date.now(),
    cache: 0,
    parse: 0,
    query: 0,
    rank: 0,
    respond: 0
  };

  try {
    const { q, limit = 20, types = 'city,country,region', only_active = 'true' } = req.query;

    // Return empty for no query
    if (!q || q.trim().length === 0) {
      // Return popular destinations instead of empty
      return await getPopularDestinations(res, parseInt(limit));
    }

    // PHASE 1: Check cache first
    const cacheStart = Date.now();
    const cacheKey = `${q.toLowerCase().trim()}_${limit}_${types}_${only_active}`;
    const cached = searchCache.get(cacheKey);
    timings.cache = Date.now() - cacheStart;

    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('X-Response-Time', `${Date.now() - timings.start}ms`);
      res.set('X-Cache-Time', `${timings.cache}ms`);
      return res.json(cached);
    }

    // PHASE 2: Parse and prepare
    const parseStart = Date.now();
    const queryText = q.trim();
    const resultLimit = Math.min(parseInt(limit) || 20, 50); // Cap at 50
    const typesFilter = types.split(',').map(t => t.trim()).filter(t => ['city', 'country', 'region'].includes(t));
    const onlyActive = only_active === 'true';
    timings.parse = Date.now() - parseStart;

    // PHASE 3: Execute search using the stored function
    const queryStart = Date.now();
    
    const searchQuery = `
      SELECT 
        type,
        entity_id,
        label,
        label_with_country,
        country,
        region,
        code,
        score,
        source
      FROM search_destinations($1, $2, $3, $4)
    `;

    const result = await pool.query(searchQuery, [
      queryText,
      resultLimit,
      typesFilter,
      onlyActive
    ]);
    
    timings.query = Date.now() - queryStart;

    // PHASE 4: Format results
    const rankStart = Date.now();
    const formattedResults = result.rows.map(row => ({
      type: row.type,
      id: row.entity_id,
      label: row.label_with_country || row.label,
      display_name: row.label,
      region: row.region,
      country: row.country,
      code: row.code,
      score: parseFloat(row.score),
      source: row.source // 'alias' or 'direct'
    }));
    timings.rank = Date.now() - rankStart;

    // PHASE 5: Cache and respond
    const respondStart = Date.now();
    searchCache.set(cacheKey, formattedResults);
    
    const totalTime = Date.now() - timings.start;
    timings.respond = Date.now() - respondStart;

    // Enhanced logging with performance breakdown
    if (totalTime > 300) {
      console.warn(`ðŸŒ SLOW SEARCH v2: "${queryText}" took ${totalTime}ms`);
      console.warn(`   ðŸ“Š Breakdown: cache=${timings.cache}ms | parse=${timings.parse}ms | query=${timings.query}ms | rank=${timings.rank}ms | respond=${timings.respond}ms`);
      console.warn(`   ðŸ“‹ Results: ${formattedResults.length} items, types: ${typesFilter.join(',')}`);
    } else {
      console.log(`âš¡ Fast search v2: "${queryText}" = ${totalTime}ms (${formattedResults.length} results)`);
    }

    // Set optimized cache headers
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=60');
    res.set('X-Response-Time', `${totalTime}ms`);
    res.set('X-Query-Time', `${timings.query}ms`);
    res.set('X-Search-Phase-Times', JSON.stringify(timings));
    res.set('X-Cache', 'MISS');

    res.json(formattedResults);

  } catch (error) {
    const totalTime = Date.now() - timings.start;
    console.error(`âŒ SEARCH ERROR v2: "${q}" failed after ${totalTime}ms`);
    console.error(`   ðŸ“Š Breakdown: cache=${timings.cache}ms | parse=${timings.parse}ms | query=${timings.query}ms`);
    console.error("   ðŸ”¥ Error:", error.message);

    res.status(500).json({
      success: false,
      error: "Search failed",
      message: error.message,
      response_time: `${totalTime}ms`,
      phase_timings: timings
    });
  }
});

/**
 * Get popular destinations for empty search or homepage
 */
async function getPopularDestinations(res, limit = 20) {
  try {
    const query = `
      SELECT 
        type,
        entity_id as id,
        label_with_country as label,
        label as display_name,
        region,
        country,
        code,
        1.0 as score,
        'popular' as source
      FROM destinations_search_mv
      WHERE is_active = true 
        AND is_package_destination = true
        AND type IN ('city', 'country', 'region')
      ORDER BY 
        CASE type 
          WHEN 'city' THEN 1 
          WHEN 'country' THEN 2 
          WHEN 'region' THEN 3 
        END,
        sort_order ASC,
        label ASC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    
    const popularResults = result.rows.map(row => ({
      type: row.type,
      id: row.id,
      label: row.label,
      display_name: row.display_name,
      region: row.region,
      country: row.country,
      code: row.code,
      score: 1.0,
      source: 'popular'
    }));

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // Cache popular destinations longer
    res.set('X-Response-Time', '0ms');
    res.set('X-Cache', 'POPULAR');
    
    res.json(popularResults);
  } catch (error) {
    console.error("Error getting popular destinations:", error);
    res.json([]); // Return empty array on error
  }
}

/**
 * GET /api/destinations/regions
 * Get all regions with optional filtering
 * Query params: level, parent_id, active_only=true
 */
router.get("/regions", async (req, res) => {
  try {
    const { level, parent_id, active_only = 'true' } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (active_only === 'true') {
      whereConditions.push('is_active = true');
    }

    if (level) {
      paramCount++;
      whereConditions.push(`level = $${paramCount}`);
      queryParams.push(level);
    }

    if (parent_id) {
      paramCount++;
      if (parent_id === 'null') {
        whereConditions.push(`parent_id IS NULL`);
      } else {
        whereConditions.push(`parent_id = $${paramCount}`);
        queryParams.push(parent_id);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        id,
        code,
        name,
        level,
        sort_order,
        is_active,
        created_at
      FROM regions
      ${whereClause}
      ORDER BY sort_order ASC, name ASC
    `;

    const result = await pool.query(query, queryParams);

    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch regions",
      message: error.message,
    });
  }
});

/**
 * GET /api/destinations/countries
 * Get countries with optional region filtering
 * Query params: region_id, active_only=true, limit=50
 */
router.get("/countries", async (req, res) => {
  try {
    const { region_id, active_only = 'true', limit = 50 } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (active_only === 'true') {
      whereConditions.push('co.is_active = true');
    }

    if (region_id) {
      paramCount++;
      whereConditions.push(`co.region_id = $${paramCount}`);
      queryParams.push(region_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        co.id,
        co.name,
        co.iso2,
        co.iso3,
        co.sort_order,
        co.is_active,
        r.name as region_name,
        r.code as region_code
      FROM countries co
      LEFT JOIN regions r ON co.region_id = r.id
      ${whereClause}
      ORDER BY co.sort_order ASC, co.name ASC
      LIMIT $${paramCount + 1}
    `;

    queryParams.push(parseInt(limit));

    const result = await pool.query(query, queryParams);

    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch countries",
      message: error.message,
    });
  }
});

/**
 * GET /api/destinations/cities
 * Get cities with optional country/region filtering
 * Query params: country_id, region_id, active_only=true, package_destinations_only=false, limit=100
 */
router.get("/cities", async (req, res) => {
  try {
    const { 
      country_id, 
      region_id, 
      active_only = 'true', 
      package_destinations_only = 'false',
      limit = 100 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (active_only === 'true') {
      whereConditions.push('ci.is_active = true');
    }

    if (package_destinations_only === 'true') {
      whereConditions.push('ci.is_package_destination = true');
    }

    if (country_id) {
      paramCount++;
      whereConditions.push(`ci.country_id = $${paramCount}`);
      queryParams.push(country_id);
    }

    if (region_id) {
      paramCount++;
      whereConditions.push(`ci.region_id = $${paramCount}`);
      queryParams.push(region_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        ci.id,
        ci.name,
        ci.sort_order,
        ci.is_active,
        ci.is_package_destination,
        co.name as country_name,
        co.iso2 as country_code,
        r.name as region_name,
        r.code as region_code
      FROM cities ci
      JOIN countries co ON ci.country_id = co.id
      LEFT JOIN regions r ON ci.region_id = r.id
      ${whereClause}
      ORDER BY ci.sort_order ASC, ci.name ASC
      LIMIT $${paramCount + 1}
    `;

    queryParams.push(parseInt(limit));

    const result = await pool.query(query, queryParams);

    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cities",
      message: error.message,
    });
  }
});

/**
 * GET /api/destinations/stats
 * Get destination statistics for admin dashboard
 */
router.get("/stats", async (req, res) => {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM regions WHERE is_active = true) as active_regions,
        (SELECT COUNT(*) FROM regions) as total_regions,
        (SELECT COUNT(*) FROM countries WHERE is_active = true) as active_countries,
        (SELECT COUNT(*) FROM countries) as total_countries,
        (SELECT COUNT(*) FROM cities WHERE is_active = true) as active_cities,
        (SELECT COUNT(*) FROM cities) as total_cities,
        (SELECT COUNT(*) FROM cities WHERE is_active = true AND is_package_destination = true) as package_cities,
        (SELECT COUNT(*) FROM destination_aliases WHERE is_active = true) as active_aliases,
        (SELECT COUNT(*) FROM destinations_search_mv WHERE is_active = true) as searchable_items
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    // Get breakdown by region
    const regionBreakdown = await pool.query(`
      SELECT 
        r.name as region_name,
        r.code as region_code,
        COUNT(DISTINCT co.id) as countries_count,
        COUNT(DISTINCT ci.id) as cities_count
      FROM regions r
      LEFT JOIN countries co ON co.region_id = r.id AND co.is_active = true
      LEFT JOIN cities ci ON ci.region_id = r.id AND ci.is_active = true
      WHERE r.is_active = true
      GROUP BY r.id, r.name, r.code, r.sort_order
      ORDER BY r.sort_order
    `);

    res.set('Cache-Control', 'public, max-age=60'); // 1 minute cache for stats
    res.json({
      success: true,
      data: {
        summary: stats,
        by_region: regionBreakdown.rows
      }
    });
  } catch (error) {
    console.error("Error fetching destination stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch destination statistics",
      message: error.message,
    });
  }
});

/**
 * GET /api/destinations/health
 * Health check with performance metrics
 */
router.get("/health", async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test the search function
    const testResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM search_destinations('test', 5)
    `);
    
    const responseTime = Date.now() - startTime;
    
    // Get cache stats
    const cacheStats = {
      size: searchCache.cache.size,
      maxSize: searchCache.maxSize,
      ttl: searchCache.ttl
    };

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      response_time: `${responseTime}ms`,
      search_function: testResult.rows[0].count > 0 ? "working" : "empty_results",
      cache: cacheStats,
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      database: "error"
    });
  }
});

/**
 * POST /api/destinations/cache/clear
 * Clear the search cache (for admin use)
 */
router.post("/cache/clear", (req, res) => {
  try {
    searchCache.clear();
    console.log("ðŸ—‘ï¸  Search cache cleared");
    
    res.json({
      success: true,
      message: "Search cache cleared",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to clear cache",
      message: error.message
    });
  }
});
module.exports = router;
