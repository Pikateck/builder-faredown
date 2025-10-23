import express from "express";
/**
 * Enhanced Health Check Route
 * Provides detailed information about API server status
 * Helps debug "Failed to fetch" errors
 */

const { Pool } = require("pg");
const router = express.Router();

// Get database connection
const pool = require("../database/connection");

// Enhanced health check with database and table verification
router.get("/", async (req, res) => {
  const checks = {
    server: { status: "healthy", details: "API server is running" },
    database: { status: "unknown", details: "Not checked" },
    recent_searches_table: { status: "unknown", details: "Not checked" },
    recent_searches_api: { status: "unknown", details: "Not checked" },
  };

  let overallStatus = "healthy";

  try {
    // Check database connection
    const dbResult = await pool.query("SELECT NOW() as current_time");
    checks.database = {
      status: "healthy",
      details: `Connected - Current time: ${dbResult.rows[0].current_time}`,
    };

    // Check if recent_searches table exists
    const tableCheck = await pool.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM recent_searches) as record_count
      FROM information_schema.tables 
      WHERE table_name = 'recent_searches' 
      AND table_schema = 'public'
    `);

    if (tableCheck.rows.length > 0) {
      checks.recent_searches_table = {
        status: "healthy",
        details: `Table exists with ${tableCheck.rows[0].record_count} records`,
      };

      // Test recent searches API functionality
      try {
        const testModule = "flights";
        const testQuery = `
          SELECT COUNT(*) as count 
          FROM recent_searches 
          WHERE module = $1 
          LIMIT 1
        `;
        const testResult = await pool.query(testQuery, [testModule]);

        checks.recent_searches_api = {
          status: "healthy",
          details: `API functionality verified - can query ${testModule} module`,
        };
      } catch (apiError) {
        checks.recent_searches_api = {
          status: "error",
          details: `API test failed: ${apiError.message}`,
        };
        overallStatus = "degraded";
      }
    } else {
      checks.recent_searches_table = {
        status: "error",
        details: "Table does not exist - migration needed",
      };
      checks.recent_searches_api = {
        status: "error",
        details: "Cannot function without table",
      };
      overallStatus = "degraded";
    }
  } catch (dbError) {
    checks.database = {
      status: "error",
      details: `Database connection failed: ${dbError.message}`,
    };
    checks.recent_searches_table = {
      status: "error",
      details: "Cannot check - database offline",
    };
    checks.recent_searches_api = {
      status: "error",
      details: "Cannot function - database offline",
    };
    overallStatus = "unhealthy";
  }

  // Response with appropriate status code
  const statusCode =
    overallStatus === "healthy"
      ? 200
      : overallStatus === "degraded"
        ? 206
        : 500;

  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: Math.floor(process.uptime()),
    checks,
    suggestions: generateSuggestions(checks),
    endpoints: {
      recent_searches: "/api/recent-searches",
      health: "/api/health-check",
      main_health: "/health",
    },
  });
});

// Generate helpful suggestions based on check results
function generateSuggestions(checks) {
  const suggestions = [];

  if (checks.database.status === "error") {
    suggestions.push("Check DATABASE_URL environment variable");
    suggestions.push("Ensure PostgreSQL database is running");
    suggestions.push("Verify network connectivity to database");
  }

  if (checks.recent_searches_table.status === "error") {
    suggestions.push("Run: node api/database/run-recent-searches-migration.js");
    suggestions.push(
      "Or manually execute: api/database/create-recent-searches-table.sql",
    );
  }

  if (checks.recent_searches_api.status === "error") {
    suggestions.push("Check recent-searches route registration in server.js");
    suggestions.push("Verify table permissions for the database user");
  }

  if (suggestions.length === 0) {
    suggestions.push("All systems operational - no action needed");
  }

  return suggestions;
}
export default router;