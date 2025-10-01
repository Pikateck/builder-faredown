/**
 * Admin Airports Diagnostics API
 * Provides diagnostic information for staging verification
 *
 * SECURITY: Admin-only, rate-limited, env-flag gated
 * Only enabled in staging with AIRPORTS_DIAGNOSTICS_ENABLED=true
 */

const express = require("express");
const router = express.Router();
const db = require("../database/connection");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Environment flag - MUST be explicitly enabled (staging only)
const DIAGNOSTICS_ENABLED = process.env.AIRPORTS_DIAGNOSTICS_ENABLED === "true";

// Apply authentication middleware (admin JWT required)
router.use(authenticateToken);
router.use(requireAdmin);

// Rate limiting for diagnostics (stricter than main API)
const diagnosticsRateLimitStore = new Map();
const DIAGNOSTICS_RATE_LIMIT = 10; // 10 requests per minute
const DIAGNOSTICS_WINDOW = 60000; // 1 minute

const diagnosticsRateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  let ipData = diagnosticsRateLimitStore.get(ip);

  if (!ipData || now - ipData.firstRequest > DIAGNOSTICS_WINDOW) {
    ipData = { count: 1, firstRequest: now };
    diagnosticsRateLimitStore.set(ip, ipData);
    return next();
  }

  ipData.count++;

  if (ipData.count > DIAGNOSTICS_RATE_LIMIT) {
    const retryAfterSeconds = Math.ceil(
      (DIAGNOSTICS_WINDOW - (now - ipData.firstRequest)) / 1000,
    );
    res.set("Retry-After", retryAfterSeconds.toString());
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: `Maximum ${DIAGNOSTICS_RATE_LIMIT} diagnostics requests per minute allowed`,
      retryAfter: retryAfterSeconds,
    });
  }

  next();
};

/**
 * GET /api/admin/airports/diagnostics
 * Returns comprehensive diagnostic information for staging verification
 *
 * REQUIRES: AIRPORTS_DIAGNOSTICS_ENABLED=true environment variable
 * Returns 404 if not enabled (production safety)
 */
router.get("/", diagnosticsRateLimitMiddleware, async (req, res) => {
  // Security gate: Return 404 if not explicitly enabled
  if (!DIAGNOSTICS_ENABLED) {
    return res.status(404).json({
      error: "Not Found",
      message: "Diagnostics endpoint is disabled",
    });
  }
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

    // Extract database connection info (credentials fully redacted)
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        diagnostics.database.host = url.hostname;
        diagnostics.database.port = url.port || "5432";
        diagnostics.database.database = url.pathname.slice(1);
        // Never expose username or password
        diagnostics.database.username = "[REDACTED]";
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
