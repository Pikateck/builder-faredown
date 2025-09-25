/**
 * Comprehensive Destinations API Routes
 * Implements the full specification with hierarchical regions, countries, cities
 * Supports India subregions + World destinations with UUID-based schema
 */

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const csvParser = require("csv-parser");
const multer = require("multer");
const fs = require("fs");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Multer setup for CSV uploads
const upload = multer({ dest: "uploads/" });

// Basic admin authentication middleware
const requireAdmin = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"] || req.query.admin_key;
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Admin authentication required",
    });
  }
  next();
};

/**
 * GET /api/destinations/regions
 * Get all regions with optional filtering and search (typeahead)
 * Query params: q, level, parent_id
 */
router.get("/regions", async (req, res) => {
  try {
    const { parent_id, level, q } = req.query;

    let whereConditions = ["r.is_active = TRUE"];
    let queryParams = [];
    let paramCount = 0;

    if (parent_id) {
      paramCount++;
      whereConditions.push(`r.parent_id = $${paramCount}`);
      queryParams.push(parent_id === "null" ? null : parent_id);
    }

    if (level) {
      paramCount++;
      whereConditions.push(`r.level = $${paramCount}`);
      queryParams.push(level);
    }

    if (q) {
      paramCount++;
      whereConditions.push(`r.name ILIKE $${paramCount}`);
      queryParams.push(`%${q}%`);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const query = `
      SELECT 
        r.id,
        r.name,
        r.level,
        r.parent_id,
        r.sort_order
      FROM regions r
      ${whereClause}
      ORDER BY r.sort_order, r.name
    `;

    const result = await pool.query(query, queryParams);

    // Set cache headers
    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes

    res.json({
      success: true,
      data: {
        items: result.rows
      },
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
 * GET /api/destinations/regions/:regionId/countries
 * Get countries in a specific region
 * Query params: q, limit
 */
router.get("/regions/:regionId/countries", async (req, res) => {
  try {
    const { regionId } = req.params;
    const { q, limit = 50 } = req.query;

    let whereConditions = ["co.is_active = TRUE", "co.region_id = $1"];
    let queryParams = [regionId];
    let paramCount = 1;

    if (q) {
      paramCount++;
      whereConditions.push(`co.name ILIKE $${paramCount}`);
      queryParams.push(`%${q}%`);
    }

    const query = `
      SELECT 
        co.id,
        co.name,
        co.iso_code
      FROM countries co
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY co.name
      LIMIT $${paramCount + 1}
    `;

    queryParams.push(parseInt(limit));

    const result = await pool.query(query, queryParams);

    // Set cache headers
    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes

    res.json({
      success: true,
      region_id: regionId,
      data: {
        items: result.rows
      },
    });
  } catch (error) {
    console.error("Error fetching countries for region:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch countries for region",
      message: error.message,
    });
  }
});

/**
 * GET /api/destinations/regions/:regionId/cities
 * Get cities for a specific region (via countries OR direct region mapping for India)
 * This is the main endpoint the frontend uses for the City dropdown
 * Query params: q, limit
 */
router.get("/regions/:regionId/cities", async (req, res) => {
  try {
    const { regionId } = req.params;
    const { q, limit = 50 } = req.query;

    let whereConditions = ["ci.is_active = TRUE"];
    let queryParams = [regionId];
    let paramCount = 1;

    // Add search filter if provided
    if (q) {
      paramCount++;
      whereConditions.push(`ci.name ILIKE $${paramCount}`);
      queryParams.push(`%${q}%`);
    }

    // Include cities that belong to countries under this region OR cities directly attached to this region
    whereConditions.push(`(co.region_id = $1 OR ci.region_id = $1)`);

    const query = `
      SELECT
        ci.id, 
        ci.name, 
        ci.code,
        jsonb_build_object(
          'id', co.id,
          'name', co.name,
          'iso', co.iso_code
        ) as country
      FROM cities ci
      JOIN countries co ON co.id = ci.country_id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY ci.name
      LIMIT $${paramCount + 1}
    `;

    queryParams.push(parseInt(limit));

    const result = await pool.query(query, queryParams);

    // Set cache headers
    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes

    res.json({
      success: true,
      region_id: regionId,
      data: {
        items: result.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching cities for region:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cities for region",
      message: error.message,
    });
  }
});

/**
 * GET /api/destinations/countries/:countryId/cities
 * Get cities for a specific country
 * Query params: q, limit
 */
router.get("/countries/:countryId/cities", async (req, res) => {
  try {
    const { countryId } = req.params;
    const { q, limit = 50 } = req.query;

    let whereConditions = ["ci.is_active = TRUE", "ci.country_id = $1"];
    let queryParams = [countryId];
    let paramCount = 1;

    if (q) {
      paramCount++;
      whereConditions.push(`ci.name ILIKE $${paramCount}`);
      queryParams.push(`%${q}%`);
    }

    const query = `
      SELECT 
        ci.id,
        ci.name,
        ci.code,
        jsonb_build_object(
          'id', co.id,
          'name', co.name,
          'iso', co.iso_code
        ) as country
      FROM cities ci
      JOIN countries co ON co.id = ci.country_id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY ci.name
      LIMIT $${paramCount + 1}
    `;

    queryParams.push(parseInt(limit));

    const result = await pool.query(query, queryParams);

    // Set cache headers
    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes

    res.json({
      success: true,
      country_id: countryId,
      data: {
        items: result.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching cities for country:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cities for country",
      message: error.message,
    });
  }
});

/**
 * GET /api/destinations/search
 * Fast smart search with aliases support
 * This is the main endpoint for the single smart search box
 * Query params: q (required), limit (default: 20)
 */
router.get("/search", async (req, res) => {
  const timings = {
    start: Date.now(),
    parse: 0,
    query: 0,
    rank: 0,
    respond: 0
  };

  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    // PHASE 1: Parse and prepare
    const parseStart = Date.now();
    const searchTerm = q.toLowerCase().trim();
    const searchPattern = `%${searchTerm}%`;
    timings.parse = Date.now() - parseStart;

    // PHASE 2: Execute database query
    const queryStart = Date.now();

    // Optimized query: prioritize cities, then countries, then regions
    // Separate queries with limits to reduce UNION overhead
    let allResults = [];

    // Search cities first (most common searches)
    const cityQuery = `
      SELECT
        'city' as type,
        ci.id,
        ci.name || ', ' || co.name as label,
        r.name as region_name,
        co.name as country_name,
        CASE
          WHEN ci.name ILIKE $2 THEN 1
          WHEN ci.name ILIKE $1 THEN 2
          ELSE 3
        END as search_priority
      FROM cities ci
      JOIN countries co ON ci.country_id = co.id
      JOIN regions r ON co.region_id = r.id
      WHERE ci.is_active = TRUE
        AND co.is_active = TRUE
        AND r.is_active = TRUE
        AND (
          ci.name ILIKE $1
          OR ci.search_text ILIKE $1
          OR COALESCE($3 = ANY(ci.search_tokens), false)
        )
      ORDER BY search_priority, ci.name
      LIMIT 8
    `;

    const exactPattern = `${searchTerm}%`; // For prefix matching
    const cityResult = await pool.query(cityQuery, [searchPattern, exactPattern, searchTerm]);
    allResults = [...cityResult.rows];

    // Only search countries if we have room for more results
    if (allResults.length < parseInt(limit)) {
      const countryQuery = `
        SELECT
          'country' as type,
          co.id,
          co.name as label,
          r.name as region_name,
          co.name as country_name,
          CASE
            WHEN co.name ILIKE $2 THEN 1
            WHEN co.name ILIKE $1 THEN 2
            ELSE 3
          END as search_priority
        FROM countries co
        JOIN regions r ON co.region_id = r.id
        WHERE co.is_active = TRUE
          AND r.is_active = TRUE
          AND (
            co.name ILIKE $1
            OR co.search_text ILIKE $1
            OR COALESCE($3 = ANY(co.search_tokens), false)
          )
        ORDER BY search_priority, co.name
        LIMIT $4
      `;

      const countryResult = await pool.query(countryQuery, [searchPattern, exactPattern, searchTerm, Math.max(4, parseInt(limit) - allResults.length)]);
      allResults = [...allResults, ...countryResult.rows];
    }

    // Only search regions if we still have room
    if (allResults.length < parseInt(limit)) {
      const regionQuery = `
        SELECT
          'region' as type,
          r.id,
          r.name as label,
          r.name as region_name,
          NULL as country_name,
          CASE
            WHEN r.name ILIKE $2 THEN 1
            WHEN r.name ILIKE $1 THEN 2
            ELSE 3
          END as search_priority
        FROM regions r
        WHERE r.is_active = TRUE
          AND (
            r.name ILIKE $1
            OR r.search_text ILIKE $1
            OR COALESCE($3 = ANY(r.search_tokens), false)
          )
        ORDER BY search_priority, r.name
        LIMIT $4
      `;

      const regionResult = await pool.query(regionQuery, [searchPattern, exactPattern, searchTerm, Math.max(3, parseInt(limit) - allResults.length)]);
      allResults = [...allResults, ...regionResult.rows];
    }

    // Sort final results: cities first, then countries, then regions
    allResults.sort((a, b) => {
      const typeOrder = { city: 1, country: 2, region: 3 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.search_priority - b.search_priority;
    });

    // Limit final results
    allResults = allResults.slice(0, parseInt(limit));

    const result = { rows: allResults };
    timings.query = Date.now() - queryStart;

    // PHASE 3: Rank and format results
    const rankStart = Date.now();
    const formattedResults = result.rows.map(r => ({
      type: r.type,
      id: r.id,
      label: r.label,
      region: r.region_name,
      country: r.country_name
    }));
    timings.rank = Date.now() - rankStart;

    // PHASE 4: Respond
    const respondStart = Date.now();
    const totalTime = Date.now() - timings.start;
    timings.respond = Date.now() - respondStart;

    // Enhanced logging with phase breakdown
    if (totalTime > 300) {
      console.warn(`🐌 SLOW SEARCH: "${searchTerm}" took ${totalTime}ms`);
      console.warn(`   📊 Breakdown: parse=${timings.parse}ms | query=${timings.query}ms | rank=${timings.rank}ms | respond=${timings.respond}ms`);
      console.warn(`   📋 Results: ${formattedResults.length} items returned`);
    } else {
      console.log(`⚡ Fast search: "${searchTerm}" = ${totalTime}ms (${formattedResults.length} results)`);
    }

    // Set optimized cache headers
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=300');
    res.set('X-Response-Time', `${totalTime}ms`);
    res.set('X-Query-Time', `${timings.query}ms`);
    res.set('X-Search-Phase-Times', JSON.stringify(timings));

    res.json(formattedResults);

  } catch (error) {
    const totalTime = Date.now() - timings.start;
    console.error(`❌ SEARCH ERROR: "${q}" failed after ${totalTime}ms`);
    console.error(`   📊 Breakdown: parse=${timings.parse}ms | query=${timings.query}ms | rank=${timings.rank}ms`);
    console.error("   🔥 Error:", error.message);

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
 * GET /api/destinations/tree
 * Get destination tree for mega menu (hierarchical structure)
 * Query params: region_slug (default: 'world')
 */
router.get("/tree", async (req, res) => {
  try {
    const { region_slug = 'world' } = req.query;

    const query = `
      SELECT get_destination_hierarchy($1) as hierarchy
    `;

    const result = await pool.query(query, [region_slug]);
    const hierarchy = result.rows[0].hierarchy;

    // Set cache headers
    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes

    res.json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    console.error("Error fetching destination tree:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch destination tree",
      message: error.message,
    });
  }
});

/**
 * GET /api/destinations/health
 * Health check endpoint with destination counts
 */
router.get("/health", async (req, res) => {
  try {
    const query = `SELECT get_destination_stats() as stats`;
    const result = await pool.query(query);
    const stats = result.rows[0].stats;

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      counts: stats,
    });
  } catch (error) {
    console.error("Error in health check:", error);
    res.status(500).json({
      status: "error",
      error: "Health check failed",
      message: error.message,
    });
  }
});

// ====================
// ADMIN ROUTES
// ====================

/**
 * GET /api/destinations/admin/regions
 * Admin view of all regions with hierarchy info
 */
router.get("/admin/regions", requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.name,
        r.level,
        r.parent_id,
        pr.name as parent_name,
        r.slug,
        r.sort_order,
        r.is_active,
        r.created_at,
        r.updated_at,
        (
          SELECT COUNT(*)
          FROM regions cr
          WHERE cr.parent_id = r.id
        ) as children_count,
        (
          SELECT COUNT(*)
          FROM countries c
          WHERE c.region_id = r.id
        ) as countries_count
      FROM regions r
      LEFT JOIN regions pr ON r.parent_id = pr.id
      ORDER BY r.level, r.sort_order, r.name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching admin regions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin regions",
      message: error.message,
    });
  }
});

/**
 * POST /api/destinations/admin/regions
 * Create a new region
 */
router.post("/admin/regions", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      level,
      parent_id,
      slug,
      sort_order = 0,
      is_active = true,
    } = req.body;

    if (!name || !level) {
      return res.status(400).json({
        success: false,
        error: "name and level are required",
      });
    }

    const query = `
      INSERT INTO regions (name, level, parent_id, slug, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const values = [name, level, parent_id || null, autoSlug, sort_order, is_active];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Region created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating region:", error);

    if (error.code === "23505") {
      res.status(400).json({
        success: false,
        error: "Region with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create region",
        message: error.message,
      });
    }
  }
});

/**
 * GET /api/destinations/admin/countries
 * Admin view of all countries
 */
router.get("/admin/countries", requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        co.id,
        co.name,
        co.iso_code,
        co.region_id,
        r.name as region_name,
        co.currency,
        co.slug,
        co.sort_order,
        co.is_active,
        co.created_at,
        co.updated_at,
        (
          SELECT COUNT(*)
          FROM cities ci
          WHERE ci.country_id = co.id
        ) as cities_count
      FROM countries co
      LEFT JOIN regions r ON co.region_id = r.id
      ORDER BY r.name, co.name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching admin countries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin countries",
      message: error.message,
    });
  }
});

/**
 * POST /api/destinations/admin/countries
 * Create a new country
 */
router.post("/admin/countries", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      iso_code,
      region_id,
      currency = "USD",
      slug,
      sort_order = 0,
      is_active = true,
    } = req.body;

    if (!name || !region_id) {
      return res.status(400).json({
        success: false,
        error: "name and region_id are required",
      });
    }

    const query = `
      INSERT INTO countries (name, iso_code, region_id, currency, slug, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const values = [name, iso_code, region_id, currency, autoSlug, sort_order, is_active];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Country created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating country:", error);

    if (error.code === "23505") {
      res.status(400).json({
        success: false,
        error: "Country with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create country",
        message: error.message,
      });
    }
  }
});

/**
 * GET /api/destinations/admin/cities
 * Admin view of all cities
 */
router.get("/admin/cities", requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        ci.id,
        ci.name,
        ci.code,
        ci.country_id,
        co.name as country_name,
        ci.region_id,
        r.name as region_name,
        ci.slug,
        ci.sort_order,
        ci.is_active,
        ci.created_at,
        ci.updated_at
      FROM cities ci
      LEFT JOIN countries co ON ci.country_id = co.id
      LEFT JOIN regions r ON ci.region_id = r.id
      ORDER BY co.name, ci.name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching admin cities:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin cities",
      message: error.message,
    });
  }
});

/**
 * POST /api/destinations/admin/cities
 * Create a new city
 */
router.post("/admin/cities", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      code,
      country_id,
      region_id,
      slug,
      sort_order = 0,
      is_active = true,
    } = req.body;

    if (!name || !country_id) {
      return res.status(400).json({
        success: false,
        error: "name and country_id are required",
      });
    }

    const query = `
      INSERT INTO cities (name, code, country_id, region_id, slug, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const values = [name, code, country_id, region_id || null, autoSlug, sort_order, is_active];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "City created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating city:", error);

    if (error.code === "23505") {
      res.status(400).json({
        success: false,
        error: "City with this name already exists in the selected country",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create city",
        message: error.message,
      });
    }
  }
});

/**
 * POST /api/destinations/admin/upload
 * Bulk upload destinations from CSV using upsert functions
 */
router.post(
  "/admin/upload",
  requireAdmin,
  upload.single("csv"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "CSV file is required",
        });
      }

      const { type } = req.body; // 'regions', 'countries', or 'cities'

      if (!type || !['regions', 'countries', 'cities'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: "type must be one of: regions, countries, cities",
        });
      }

      const results = [];
      const errors = [];
      let processedCount = 0;

      await client.query("BEGIN");

      // Parse CSV file
      const csvData = await new Promise((resolve, reject) => {
        const data = [];
        fs.createReadStream(req.file.path)
          .pipe(csvParser())
          .on("data", (row) => data.push(row))
          .on("end", () => resolve(data))
          .on("error", reject);
      });

      console.log(`Processing ${csvData.length} rows from ${type} CSV`);

      for (const row of csvData) {
        try {
          processedCount++;

          if (type === 'regions') {
            const { name, level, parent_slug, slug, sort_order, is_active } = row;
            await client.query(
              'SELECT upsert_region($1, $2, $3, $4, $5, $6)',
              [name, level, parent_slug || null, slug, parseInt(sort_order || 0), is_active !== 'false']
            );
          } else if (type === 'countries') {
            const { name, iso_code, region_slug, slug, currency, sort_order, is_active } = row;
            await client.query(
              'SELECT upsert_country($1, $2, $3, $4, $5, $6, $7)',
              [name, iso_code, region_slug, slug, currency || 'USD', parseInt(sort_order || 0), is_active !== 'false']
            );
          } else if (type === 'cities') {
            const { name, code, country_slug, slug, region_slug, sort_order, is_active } = row;
            await client.query(
              'SELECT upsert_city($1, $2, $3, $4, $5, $6, $7)',
              [name, code || null, country_slug, slug, region_slug || null, parseInt(sort_order || 0), is_active !== 'false']
            );
          }

          results.push({
            row: processedCount,
            status: "success",
            data: row,
          });
        } catch (error) {
          console.error(`Error processing row ${processedCount}:`, error);
          errors.push({
            row: processedCount,
            error: error.message,
            data: row,
          });
        }
      }

      await client.query("COMMIT");

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: `${type} CSV upload completed`,
        data: {
          type,
          total_rows: csvData.length,
          processed_successfully: results.length,
          errors: errors.length,
          success_rate: `${Math.round((results.length / csvData.length) * 100)}%`,
          error_details: errors.slice(0, 10), // Show first 10 errors
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");

      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Error processing CSV upload:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process CSV upload",
        message: error.message,
      });
    } finally {
      client.release();
    }
  },
);

/**
 * GET /api/destinations/admin/stats
 * Get comprehensive destination statistics for admin dashboard
 */
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const query = `SELECT get_destination_stats() as stats`;
    const result = await pool.query(query);
    const stats = result.rows[0].stats;

    // Get additional breakdown
    const breakdownQuery = `
      SELECT 
        'Global Regions' as category,
        COUNT(*) as count
      FROM regions 
      WHERE level = 'global' AND is_active = TRUE
      
      UNION ALL
      
      SELECT 
        'World Regions' as category,
        COUNT(*) as count
      FROM regions 
      WHERE level = 'region' AND parent_id = (SELECT id FROM regions WHERE slug = 'world') AND is_active = TRUE
      
      UNION ALL
      
      SELECT 
        'India Subregions' as category,
        COUNT(*) as count
      FROM regions 
      WHERE level IN ('subregion', 'state') AND is_active = TRUE
      
      UNION ALL
      
      SELECT 
        'Countries' as category,
        COUNT(*) as count
      FROM countries 
      WHERE is_active = TRUE
      
      UNION ALL
      
      SELECT 
        'Cities' as category,
        COUNT(*) as count
      FROM cities 
      WHERE is_active = TRUE
    `;

    const breakdownResult = await pool.query(breakdownQuery);

    res.json({
      success: true,
      data: {
        summary: stats,
        breakdown: breakdownResult.rows,
      },
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

module.exports = router;
