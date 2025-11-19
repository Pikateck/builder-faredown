/**
 * Hotel Admin Routes
 * Endpoints for hotel caching, sync, monitoring, and diagnostics
 */

const express = require("express");
const router = express.Router();
const adminKeyMiddleware = require("../middleware/adminKey");
const hotelApiCachingService = require("../services/hotelApiCachingService");
const tboStaticDataService = require("../services/tboStaticDataService");
const pool = require("../database/connection");

// Apply admin key middleware to all routes
router.use(adminKeyMiddleware);

// ============================================================
// CACHING DIAGNOSTICS
// ============================================================

/**
 * GET /api/admin/hotels/cache/status
 * Get current caching status and metrics
 */
router.get("/cache/status", async (req, res) => {
  try {
    const metrics = {
      ongoingRequests: hotelApiCachingService.ongoingRequests.size,
      redisConnected: true, // Will be updated if redis check is needed
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/cache/clear-coalescing
 * Clear in-memory coalescing requests
 */
router.get("/cache/clear-coalescing", async (req, res) => {
  try {
    const cleared = hotelApiCachingService.clearCoalescingRequests();

    res.json({
      success: true,
      message: `Cleared ${cleared} coalescing requests`,
      cleared,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/metrics/:supplier
 * Get performance metrics for a supplier
 */
router.get("/metrics/:supplier", async (req, res) => {
  try {
    const { supplier } = req.params;
    const { days = 7 } = req.query;

    const metrics = await hotelApiCachingService.getSupplierMetrics(
      supplier,
      days,
    );

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: "No metrics found for this supplier",
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// LOGGING & AUDIT
// ============================================================

/**
 * GET /api/admin/hotels/logs
 * Get recent API logs with filtering
 */
router.get("/logs", async (req, res) => {
  try {
    const {
      supplier,
      limit = 100,
      offset = 0,
      errorOnly = false,
      traceId,
    } = req.query;

    let query = "SELECT * FROM public.hotel_supplier_api_logs WHERE 1=1";
    const params = [];

    if (supplier) {
      params.push(supplier);
      query += ` AND supplier_code = $${params.length}`;
    }

    if (errorOnly === "true") {
      query += " AND error_message IS NOT NULL";
    }

    if (traceId) {
      params.push(traceId);
      query += ` AND trace_id = $${params.length}`;
    }

    query += ` ORDER BY request_timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        logs: result.rows,
        count: result.rows.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/logs/trace/:traceId
 * Get all logs for a specific trace ID
 */
router.get("/logs/trace/:traceId", async (req, res) => {
  try {
    const { traceId } = req.params;

    const result = await pool.query(
      "SELECT * FROM public.hotel_supplier_api_logs WHERE trace_id = $1 ORDER BY request_timestamp ASC",
      [traceId],
    );

    res.json({
      success: true,
      data: {
        logs: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/logs/errors
 * Get error logs with analytics
 */
router.get("/logs/errors", async (req, res) => {
  try {
    const { supplier, limit = 50 } = req.query;

    let query = `
      SELECT 
        error_code,
        COUNT(*) as count,
        MAX(request_timestamp) as last_occurred,
        ARRAY_AGG(DISTINCT supplier_code) as suppliers
      FROM public.hotel_supplier_api_logs
      WHERE error_message IS NOT NULL
    `;

    const params = [];

    if (supplier) {
      params.push(supplier);
      query += ` AND supplier_code = $${params.length}`;
    }

    query += ` GROUP BY error_code ORDER BY count DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        errors: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/logs/stats
 * Get aggregated statistics
 */
router.get("/logs/stats", async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const result = await pool.query(
      `
      SELECT 
        supplier_code,
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE success = TRUE) as successful,
        COUNT(*) FILTER (WHERE success = FALSE) as failed,
        COUNT(*) FILTER (WHERE cache_hit = TRUE) as cache_hits,
        ROUND(100.0 * COUNT(*) FILTER (WHERE cache_hit = TRUE) / COUNT(*), 2) as cache_hit_rate,
        ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_ms,
        MAX(response_time_ms) as max_response_ms
      FROM public.hotel_supplier_api_logs
      WHERE request_timestamp >= NOW() - INTERVAL '1 day' * $1
      GROUP BY supplier_code
      ORDER BY total_requests DESC
    `,
      [days],
    );

    res.json({
      success: true,
      data: {
        stats: result.rows,
        period_days: days,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// SYNC & INVENTORY MANAGEMENT
// ============================================================

/**
 * POST /api/admin/hotels/sync/full
 * Trigger full TBO static data sync
 */
router.post("/sync/full", async (req, res) => {
  try {
    const { countryCodes, countryLimit = 5, cityLimit } = req.body;

    // Run sync asynchronously but return immediately
    const syncPromise = tboStaticDataService.fullSync({
      countryCodes,
      countryLimit,
      cityLimit,
    });

    // Return job ID immediately
    const jobId = require("uuid").v4();
    res.json({
      success: true,
      message: "Sync job started",
      jobId,
      data: {
        status: "started",
        jobId,
        timestamp: new Date().toISOString(),
      },
    });

    // Execute sync in background
    syncPromise
      .then((result) => {
        console.log("✅ Sync job completed:", jobId, result);
      })
      .catch((error) => {
        console.error("❌ Sync job failed:", jobId, error);
      });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/hotels/sync/cities
 * Sync specific cities
 */
router.post("/sync/cities", async (req, res) => {
  try {
    const { countryCodes, cityIds } = req.body;

    if (!countryCodes || countryCodes.length === 0) {
      return res.status(400).json({
        success: false,
        error: "countryCodes array is required",
      });
    }

    // Run sync asynchronously
    const jobId = require("uuid").v4();
    res.json({
      success: true,
      message: "City sync job started",
      jobId,
      data: {
        status: "started",
        jobId,
        timestamp: new Date().toISOString(),
      },
    });

    // Execute sync in background
    tboStaticDataService
      .syncSpecificCities(countryCodes, cityIds)
      .then((result) => {
        console.log("✅ City sync completed:", jobId, result);
      })
      .catch((error) => {
        console.error("❌ City sync failed:", jobId, error);
      });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/sync/status
 * Get current sync status and statistics
 */
router.get("/sync/status", async (req, res) => {
  try {
    const syncStatus = await tboStaticDataService.getSyncStatus();

    res.json({
      success: true,
      data: syncStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/inventory
 * Browse hotel master inventory
 */
router.get("/inventory", async (req, res) => {
  try {
    const {
      supplier = "TBO",
      cityId,
      limit = 50,
      offset = 0,
      active = true,
    } = req.query;

    let query =
      "SELECT * FROM public.hotels_master_inventory WHERE supplier_code = $1";
    const params = [supplier];

    if (cityId) {
      params.push(cityId);
      query += ` AND city_id = $${params.length}`;
    }

    if (active === "true") {
      query += " AND is_active = TRUE";
    }

    query += ` ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery =
      "SELECT COUNT(*) as count FROM public.hotels_master_inventory WHERE supplier_code = $1";
    const countParams = [supplier];

    if (cityId) {
      countParams.push(cityId);
      countQuery += ` AND city_id = $${countParams.length}`;
    }

    if (active === "true") {
      countQuery += " AND is_active = TRUE";
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        hotels: result.rows,
        count: result.rows.length,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/inventory/cities
 * Get unique cities in inventory
 */
router.get("/inventory/cities", async (req, res) => {
  try {
    const { supplier = "TBO", countryCode } = req.query;

    let query = `
      SELECT DISTINCT 
        city_id,
        city_name,
        country_code,
        COUNT(*) as hotel_count
      FROM public.hotels_master_inventory
      WHERE supplier_code = $1 AND is_active = TRUE
    `;

    const params = [supplier];

    if (countryCode) {
      params.push(countryCode);
      query += ` AND country_code = $${params.length}`;
    }

    query +=
      " GROUP BY city_id, city_name, country_code ORDER BY hotel_count DESC";

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        cities: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/inventory/countries
 * Get unique countries in inventory
 */
router.get("/inventory/countries", async (req, res) => {
  try {
    const { supplier = "TBO" } = req.query;

    const result = await pool.query(
      `
      SELECT DISTINCT 
        country_code,
        country_name,
        COUNT(*) as hotel_count,
        COUNT(DISTINCT city_id) as city_count
      FROM public.hotels_master_inventory
      WHERE supplier_code = $1 AND is_active = TRUE
      GROUP BY country_code, country_name
      ORDER BY hotel_count DESC
    `,
      [supplier],
    );

    res.json({
      success: true,
      data: {
        countries: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/hotels/inventory/:hotelCode
 * Get specific hotel details
 */
router.get("/inventory/:hotelCode", async (req, res) => {
  try {
    const { hotelCode } = req.params;
    const { supplier = "TBO" } = req.query;

    const result = await pool.query(
      "SELECT * FROM public.hotels_master_inventory WHERE supplier_code = $1 AND supplier_hotel_code = $2",
      [supplier, hotelCode],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
