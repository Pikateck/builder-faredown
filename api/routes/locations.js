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
 *     ]
 *   }
 */
router.get("/search", async (req, res) => {
  try {
    const qtext = String(req.query.q || "").trim();
    const type = (req.query.type || "all").toLowerCase();
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 25);

    // Validation
    if (!qtext || qtext.length < 1) {
      return res.json({ items: [] });
    }

    if (qtext.length < 2) {
      return res.json({ items: [] });
    }

    // Check if tables have data, auto-sync if empty
    const citiesCountResult = await db.query(
      "SELECT COUNT(*) as count FROM tbo_cities",
    );
    const citiesCount = parseInt(citiesCountResult.rows[0]?.count || 0);

    if (citiesCount === 0) {
      console.log("⚠️  No cities data found, auto-triggering sync...");
      const { syncTboLocations } = require("../jobs/tboSyncLocations.js");

      // Fire-and-forget async sync
      syncTboLocations()
        .then((result) => {
          console.log("✅ Background sync completed:", result);
        })
        .catch((error) => {
          console.warn(
            "⚠️  Background sync failed (search will proceed):",
            error.message,
          );
        });

      // Return a message to the user about syncing
      return res.json({
        items: [],
        count: 0,
        query: qtext,
        message:
          "Sync in progress - data will be available shortly. Please try again in a moment.",
        syncing: true,
      });
    }

    // Determine which types to search
    const typesToSearch = [];
    if (type === "all" || type === "city") typesToSearch.push("city");
    if (type === "all" || type === "hotel") typesToSearch.push("hotel");
    if (type === "all" || type === "country") typesToSearch.push("country");

    // Execute searches in parallel
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

    res.json({
      items,
      count: items.length,
      query: qtext,
      types: typesToSearch,
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
 * GET /api/locations/stats
 * Returns sync statistics
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

    res.json(stats);
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
 * Check if sync is needed and trigger auto-sync if data is empty
 */
router.get("/sync-status", async (req, res) => {
  try {
    const citiesResult = await db.query(
      "SELECT COUNT(*) as count FROM tbo_cities",
    );
    const cityCount = parseInt(citiesResult.rows[0]?.count || 0);

    if (cityCount === 0) {
      // Auto-trigger sync if no data
      console.log("🔄 Auto-triggering TBO locations sync (no cities found)...");
      const { syncTboLocations } = require("../jobs/tboSyncLocations.js");

      // Fire-and-forget async sync
      syncTboLocations()
        .then((result) => {
          console.log("✅ Auto-sync completed:", result);
        })
        .catch((error) => {
          console.error("❌ Auto-sync failed:", error.message);
        });

      return res.json({
        synced: false,
        syncing: true,
        message: "Data is empty, auto-sync triggered in background",
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
