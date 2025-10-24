/**
 * Locations Autocomplete API
 * Searches TBO cities, hotels, and countries with ranking
 * Hybrid approach: Redis cache → DB → Lazy TBO sync
 */

const express = require("express");
const db = require("../database/connection.js");
const redis = require("../lib/redisClient.js");
const router = express.Router();

const REDIS_TTL = 1800; // 30 minutes

/**
 * Helper function to build search query with proper ranking
 * Exact prefix match > contains > fuzzy
 */
function buildSearchQuery(type, searchText, limit) {
  const queryLower = searchText.toLowerCase().replace(/\s+/g, "");

  if (type === "city") {
    return {
      sql: `
        SELECT 
          'city' AS kind,
          supplier_id AS id,
          name,
          country_supplier_id AS country_id,
          NULL::VARCHAR AS hotel_name,
          NULL::VARCHAR AS city_name
        FROM tbo_cities
        WHERE normalized_name LIKE $1 OR normalized_name LIKE $2
        ORDER BY 
          CASE 
            WHEN normalized_name = $3 THEN 0
            WHEN normalized_name LIKE $4 THEN 1
            ELSE 2
          END,
          popularity DESC,
          name ASC
        LIMIT $5
      `,
      params: [
        `${queryLower}%`,
        `%${queryLower}%`,
        queryLower,
        `${queryLower}%`,
        limit,
      ],
    };
  }

  if (type === "hotel") {
    return {
      sql: `
        SELECT 
          'hotel' AS kind,
          supplier_id AS id,
          name,
          city_supplier_id AS city_id,
          name AS hotel_name,
          NULL::VARCHAR AS city_name
        FROM tbo_hotels
        WHERE normalized_name LIKE $1 OR normalized_name LIKE $2
        ORDER BY 
          CASE 
            WHEN normalized_name = $3 THEN 0
            WHEN normalized_name LIKE $4 THEN 1
            ELSE 2
          END,
          popularity DESC,
          name ASC
        LIMIT $5
      `,
      params: [
        `${queryLower}%`,
        `%${queryLower}%`,
        queryLower,
        `${queryLower}%`,
        limit,
      ],
    };
  }

  if (type === "country") {
    return {
      sql: `
        SELECT 
          'country' AS kind,
          supplier_id AS id,
          name,
          NULL::VARCHAR AS country_id,
          NULL::VARCHAR AS hotel_name,
          NULL::VARCHAR AS city_name
        FROM tbo_countries
        WHERE normalized_name LIKE $1 OR normalized_name LIKE $2
        ORDER BY 
          CASE 
            WHEN normalized_name = $3 THEN 0
            WHEN normalized_name LIKE $4 THEN 1
            ELSE 2
          END,
          name ASC
        LIMIT $5
      `,
      params: [
        `${queryLower}%`,
        `%${queryLower}%`,
        queryLower,
        `${queryLower}%`,
        limit,
      ],
    };
  }

  return null;
}

/**
 * GET /api/locations/search
 * Hybrid caching: Redis → DB → Lazy TBO Sync
 * Query params:
 *   - q (required): search text
 *   - type (optional): "all" | "city" | "hotel" | "country" (default: "all")
 *   - limit (optional): max results per type (default: 10, max: 25)
 *
 * Returns:
 *   {
 *     items: [
 *       { kind: "city", id: "1", name: "Paris", country_id: "250" },
 *       { kind: "hotel", id: "123", name: "Hotel Paris", city_id: "1" },
 *       ...
 *     ],
 *     cached: boolean,
 *     syncing: boolean (if lazy sync triggered)
 *   }
 */
router.get("/search", async (req, res) => {
  try {
    const qtext = String(req.query.q || "").trim();
    const type = (req.query.type || "all").toLowerCase();
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 25);

    // Validation
    if (!qtext || qtext.length < 1) {
      return res.json({ items: [], cached: false });
    }

    if (qtext.length < 2) {
      return res.json({ items: [], cached: false });
    }

    const normalized = redis.normalize(qtext);
    const cacheKey = `loc:search:${normalized}:${type}:${limit}`;

    // STEP 1: Check Redis cache first (< 10ms)
    console.log(`🔍 Redis cache check for: ${cacheKey}`);
    const cachedResults = await redis.getJSON(cacheKey);
    if (cachedResults) {
      console.log(`✅ Cache hit for "${qtext}" (${cachedResults.items.length} results)`);
      return res.json({
        ...cachedResults,
        cached: true,
        source: "redis",
      });
    }

    console.log(`❌ Cache miss for "${qtext}", checking DB...`);

    // STEP 2: Determine which types to search
    const typesToSearch = [];
    if (type === "all" || type === "city") typesToSearch.push("city");
    if (type === "all" || type === "hotel") typesToSearch.push("hotel");
    if (type === "all" || type === "country") typesToSearch.push("country");

    // STEP 3: Query database in parallel
    const promises = typesToSearch.map(async (t) => {
      const query = buildSearchQuery(t, qtext, limit);
      if (!query) return [];

      try {
        const result = await db.query(query.sql, query.params);
        return result.rows;
      } catch (error) {
        console.error(`Search error for type ${t}:`, error.message);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const items = results.flat();

    // STEP 4: Check if we have results
    if (items.length > 0) {
      // Cache and return results
      console.log(`✅ DB hit for "${qtext}" (${items.length} results)`);
      const responseData = {
        items,
        count: items.length,
        query: qtext,
        types: typesToSearch,
      };
      await redis.setJSON(cacheKey, responseData, REDIS_TTL);

      return res.json({
        ...responseData,
        cached: false,
        source: "database",
      });
    }

    // STEP 5: No results in DB, trigger lazy sync for this city
    console.log(`⚠️  No results in DB for "${qtext}", triggering lazy sync...`);

    // Fire-and-forget lazy sync (city-specific)
    queueTargetedCityFetch(qtext).catch((e) => {
      console.warn(`Lazy sync failed for "${qtext}":`, e.message);
    });

    res.json({
      items: [],
      count: 0,
      query: qtext,
      types: typesToSearch,
      cached: false,
      source: "none",
      syncing: true,
      message: `Fetching "${qtext}" from TBO in background. Please retry in a moment.`,
    });
  } catch (error) {
    console.error("Locations search error:", error.message);
    res.status(500).json({
      error: "Search failed",
      message: error.message,
    });
  }
});

/**
 * Queue a targeted city fetch from TBO (async, non-blocking)
 * Fetches city metadata and hotels, stores in DB, warms cache
 */
async function queueTargetedCityFetch(cityName) {
  try {
    const adapter = require("../services/adapters/tboAdapter.js").getTboAdapter?.()
      || require("../services/adapters/tboAdapter.js");

    if (!adapter || typeof adapter.getCityList !== "function") {
      console.warn("TBO adapter not available for targeted fetch");
      return;
    }

    // Get countries from DB
    const countriesRes = await db.query(
      "SELECT supplier_id FROM tbo_countries LIMIT 100",
    );
    const countries = countriesRes.rows || [];

    if (countries.length === 0) {
      console.warn(
        `No countries in DB, cannot fetch cities for "${cityName}"`,
      );
      return;
    }

    console.log(
      `🔄 Fetching cities for "${cityName}" from ${countries.length} countries...`,
    );

    const normalized = redis.normalize(cityName);
    let found = false;

    for (const country of countries) {
      try {
        const cities = await adapter.getCityList(country.supplier_id, true);
        if (!Array.isArray(cities)) continue;

        for (const city of cities) {
          const cityName_tbo = city.CityName || city.name;
          const cityCode = city.CityCode || city.code;

          if (!cityName_tbo || !cityCode) continue;

          const normalizedCity = redis.normalize(cityName_tbo);

          if (normalizedCity.includes(normalized) || normalized.includes(normalizedCity)) {
            // Match found! Insert into DB
            await db.query(
              `INSERT INTO tbo_cities (supplier_id, country_supplier_id, name, normalized_name, lat, lng, popularity, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
               ON CONFLICT (supplier_id) DO UPDATE SET updated_at = NOW()`,
              [
                cityCode,
                country.supplier_id,
                cityName_tbo,
                normalizedCity,
                city.Latitude || null,
                city.Longitude || null,
                0,
              ],
            );

            // Fetch hotels for this city
            try {
              const hotelCodes = await adapter.getHotelCodes(cityCode, true);
              if (Array.isArray(hotelCodes)) {
                for (const hotelCode of hotelCodes) {
                  const hotelId = typeof hotelCode === "string" ? hotelCode : hotelCode.HotelCode || hotelCode.code;
                  if (!hotelId) continue;

                  // Insert hotel placeholder
                  await db.query(
                    `INSERT INTO tbo_hotels (supplier_id, city_supplier_id, country_supplier_id, name, normalized_name, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                     ON CONFLICT (supplier_id) DO UPDATE SET updated_at = NOW()`,
                    [hotelId, cityCode, country.supplier_id, `Hotel ${cityCode}`, redis.normalize(`Hotel ${cityCode}`)],
                  );
                }
              }
            } catch (e) {
              console.warn(`Hotel fetch failed for city ${cityCode}:`, e.message);
            }

            found = true;
            console.log(`✅ Lazy sync completed for "${cityName}"`);
            break;
          }
        }

        if (found) break;
      } catch (e) {
        console.warn(
          `Failed to fetch cities for country ${country.supplier_id}:`,
          e.message,
        );
      }
    }

    if (!found) {
      console.warn(`City "${cityName}" not found in TBO`);
    }
  } catch (error) {
    console.error("Targeted city fetch error:", error.message);
  }
}

/**
 * GET /api/locations/stats
 * Returns sync statistics and warm cache
 */
router.get("/stats", async (req, res) => {
  try {
    const [countriesRes, citiesRes, hotelsRes] = await Promise.all([
      db.query("SELECT COUNT(*) as count FROM tbo_countries"),
      db.query("SELECT COUNT(*) as count FROM tbo_cities"),
      db.query("SELECT COUNT(*) as count FROM tbo_hotels"),
    ]);

    const stats = {
      countries: parseInt(countriesRes.rows[0]?.count || 0),
      cities: parseInt(citiesRes.rows[0]?.count || 0),
      hotels: parseInt(hotelsRes.rows[0]?.count || 0),
    };

    // Warm cache with stats
    await redis.setJSON("loc:stats", stats, REDIS_TTL);

    res.json({
      ...stats,
      cached: false,
    });
  } catch (error) {
    console.error("Stats error:", error.message);
    res.status(500).json({
      error: "Failed to fetch stats",
      message: error.message,
    });
  }
});

/**
 * GET /api/locations/sync-status
 * Check if sync is needed and trigger sync if data is empty
 */
router.get("/sync-status", async (req, res) => {
  try {
    const citiesResult = await db.query(
      "SELECT COUNT(*) as count FROM tbo_cities",
    );
    const cityCount = parseInt(citiesResult.rows[0]?.count || 0);

    if (cityCount === 0) {
      console.log("🔄 Auto-triggering TBO top destinations sync (no cities found)...");
      const { syncTopDestinations } = require("../jobs/tboSyncTopDestinations.js");

      // Fire-and-forget async sync
      syncTopDestinations()
        .then((result) => {
          console.log("✅ Top destinations sync completed:", result);
        })
        .catch((error) => {
          console.warn("⚠️  Top destinations sync failed:", error.message);
        });

      return res.json({
        synced: false,
        syncing: true,
        message: "Seeding top destinations in background",
        cityCount: 0,
      });
    }

    res.json({
      synced: true,
      syncing: false,
      cityCount,
    });
  } catch (error) {
    console.error("Sync status error:", error.message);
    res.status(500).json({
      error: "Failed to check sync status",
      message: error.message,
    });
  }
});

module.exports = router;
