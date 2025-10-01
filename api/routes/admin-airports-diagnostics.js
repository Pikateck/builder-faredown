/**
 * Admin Airports Diagnostics API
 * Provides diagnostic information for staging verification
 */

const express = require("express");
const router = express.Router();
const db = require("../database/connection");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Apply authentication middleware
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/airports/diagnostics
 * Returns comprehensive diagnostic information for staging verification
 */
router.get("/", async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        useMockAirports: process.env.USE_MOCK_AIRPORTS,
        airportsMaxLimit: process.env.AIRPORTS_MAX_LIMIT,
        airportsMinQuery: process.env.AIRPORTS_MIN_QUERY,
      },
      database: {
        connected: db.isConnected,
        host: null,
        port: null,
        database: null,
      },
      performance: {
        explainAnalyze: null,
        sampleQueries: [],
      },
      sampleData: {
        dublinSearch: null,
        allAirports: null,
      },
    };

    // Extract database connection info (redact credentials)
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        diagnostics.database.host = url.hostname;
        diagnostics.database.port = url.port || "5432";
        diagnostics.database.database = url.pathname.slice(1);
      } catch (err) {
        diagnostics.database.error = "Failed to parse DATABASE_URL";
      }
    }

    // Test database connectivity
    if (db.isConnected) {
      try {
        // Test basic query
        const healthCheck = await db.query("SELECT NOW() as current_time");
        diagnostics.database.currentTime = healthCheck.rows[0].current_time;
        diagnostics.database.status = "connected";

        // Check if airport_master table exists
        const tableCheck = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'airport_master'
          ) as table_exists
        `);
        diagnostics.database.airportMasterExists =
          tableCheck.rows[0].table_exists;

        if (tableCheck.rows[0].table_exists) {
          // Get row count
          const countResult = await db.query(
            "SELECT COUNT(*) as total FROM airport_master WHERE is_active = true",
          );
          diagnostics.database.activeAirportsCount = parseInt(
            countResult.rows[0].total,
          );

          // Check if search_airports function exists
          const functionCheck = await db.query(`
            SELECT EXISTS (
              SELECT FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'public' AND p.proname = 'search_airports'
            ) as function_exists
          `);
          diagnostics.database.searchFunctionExists =
            functionCheck.rows[0].function_exists;

          // Run sample search for 'dub'
          try {
            let searchResult;
            if (functionCheck.rows[0].function_exists) {
              searchResult = await db.query(
                "SELECT iata, name, city, country, iso_country FROM search_airports($1, $2, $3)",
                ["dub", 10, 0],
              );
            } else {
              searchResult = await db.query(
                `SELECT iata, name, city, country, 
                        COALESCE(iso_country, country_code) as iso_country
                 FROM airport_master 
                 WHERE is_active = true 
                   AND (name ILIKE $1 OR iata ILIKE $1 OR city ILIKE $1 OR country ILIKE $1)
                 ORDER BY 
                   CASE WHEN iata ILIKE $1 THEN 1 ELSE 2 END,
                   name
                 LIMIT $2 OFFSET $3`,
                ["%dub%", 10, 0],
              );
            }
            diagnostics.sampleData.dublinSearch = {
              total: searchResult.rows.length,
              items: searchResult.rows,
            };
          } catch (searchError) {
            diagnostics.sampleData.dublinSearch = {
              error: searchError.message,
            };
          }

          // Run EXPLAIN ANALYZE for performance testing
          if (functionCheck.rows[0].function_exists) {
            try {
              const explainResult = await db.query(
                "EXPLAIN ANALYZE SELECT iata, name, city, country FROM search_airports('dub', 50, 0)",
              );
              diagnostics.performance.explainAnalyze = explainResult.rows.map(
                (row) => row["QUERY PLAN"],
              );
            } catch (explainError) {
              diagnostics.performance.explainAnalyze = {
                error: explainError.message,
              };
            }
          } else {
            try {
              const explainResult = await db.query(`
                EXPLAIN ANALYZE
                SELECT iata, name, city, country, 
                       COALESCE(iso_country, country_code) as iso_country
                FROM airport_master
                WHERE is_active = true
                  AND (name ILIKE '%dub%' OR iata ILIKE '%dub%' OR city ILIKE '%dub%' OR country ILIKE '%dub%')
                ORDER BY 
                  CASE WHEN iata ILIKE '%dub%' THEN 1 ELSE 2 END,
                  name
                LIMIT 50 OFFSET 0
              `);
              diagnostics.performance.explainAnalyze = explainResult.rows.map(
                (row) => row["QUERY PLAN"],
              );
            } catch (explainError) {
              diagnostics.performance.explainAnalyze = {
                error: explainError.message,
              };
            }
          }

          // Get top 5 airports for validation
          const topAirports = await db.query(`
            SELECT iata, name, city, country, 
                   COALESCE(iso_country, country_code) as iso_country
            FROM airport_master 
            WHERE is_active = true 
            ORDER BY 
              CASE 
                WHEN iata IN ('BOM', 'DEL', 'DXB', 'LHR', 'JFK') THEN 1 
                ELSE 2 
              END,
              name
            LIMIT 5
          `);
          diagnostics.sampleData.allAirports = {
            total: 5,
            items: topAirports.rows,
          };
        }
      } catch (dbError) {
        diagnostics.database.error = dbError.message;
        diagnostics.database.status = "error";
      }
    } else {
      diagnostics.database.status = "not connected";
    }

    res.json({
      success: true,
      diagnostics,
    });
  } catch (error) {
    console.error("Diagnostics error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
