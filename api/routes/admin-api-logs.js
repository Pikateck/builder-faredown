/**
 * Admin Routes for Third-Party API Logs
 * Provides endpoints to query and monitor third-party supplier API calls
 */

const express = require("express");
const router = express.Router();
const thirdPartyLogger = require("../services/thirdPartyLogger");
const pool = require("../database/connection");

/**
 * GET /api/admin/api-logs
 * Query API logs with filters
 */
router.get("/", async (req, res) => {
  try {
    const {
      supplier,
      status,
      limit = 100,
      offset = 0,
      from_date,
      to_date,
      trace_id,
      correlation_id,
      errors_only,
    } = req.query;

    let query = `
      SELECT 
        id,
        supplier_name,
        endpoint,
        method,
        status_code,
        duration_ms,
        error_message,
        request_timestamp,
        response_timestamp,
        trace_id,
        correlation_id,
        environment,
        created_at
      FROM public.third_party_api_logs
      WHERE 1=1
    `;

    const params = [];

    // Filter by supplier
    if (supplier) {
      params.push(supplier);
      query += ` AND supplier_name = $${params.length}`;
    }

    // Filter by status code
    if (status) {
      params.push(parseInt(status));
      query += ` AND status_code = $${params.length}`;
    }

    // Filter by date range
    if (from_date) {
      params.push(from_date);
      query += ` AND created_at >= $${params.length}`;
    }

    if (to_date) {
      params.push(to_date);
      query += ` AND created_at <= $${params.length}`;
    }

    // Filter by trace ID
    if (trace_id) {
      params.push(trace_id);
      query += ` AND trace_id = $${params.length}`;
    }

    // Filter by correlation ID
    if (correlation_id) {
      params.push(correlation_id);
      query += ` AND correlation_id = $${params.length}`;
    }

    // Filter errors only
    if (errors_only === "true") {
      query += ` AND error_message IS NOT NULL`;
    }

    // Order and pagination
    query += ` ORDER BY created_at DESC`;

    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;

    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM public.third_party_api_logs
      WHERE 1=1
    `;
    const countParams = [];

    if (supplier) {
      countParams.push(supplier);
      countQuery += ` AND supplier_name = $${countParams.length}`;
    }

    if (errors_only === "true") {
      countQuery += ` AND error_message IS NOT NULL`;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("❌ Failed to query API logs:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/api-logs/:id
 * Get full details of a specific log entry
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT * FROM public.third_party_api_logs
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Log entry not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Failed to fetch log details:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/api-logs/stats/:supplier
 * Get statistics for a specific supplier
 */
router.get("/stats/:supplier", async (req, res) => {
  try {
    const { supplier } = req.params;
    const { from_date } = req.query;

    const stats = await thirdPartyLogger.getSupplierStats(supplier, from_date);

    if (!stats) {
      return res.json({
        success: true,
        data: {
          supplier_name: supplier,
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          error_requests: 0,
          avg_duration_ms: null,
          max_duration_ms: null,
          min_duration_ms: null,
        },
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Failed to fetch supplier stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/api-logs/errors/recent
 * Get recent error logs
 */
router.get("/errors/recent", async (req, res) => {
  try {
    const { supplier, limit = 50 } = req.query;

    const errors = await thirdPartyLogger.getErrorLogs(
      supplier,
      parseInt(limit),
    );

    res.json({
      success: true,
      data: errors,
      total: errors.length,
    });
  } catch (error) {
    console.error("❌ Failed to fetch error logs:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/api-logs/trace/:trace_id
 * Get all logs for a specific trace ID (for request correlation)
 */
router.get("/trace/:trace_id", async (req, res) => {
  try {
    const { trace_id } = req.params;

    const logs = await thirdPartyLogger.getLogsByTraceId(trace_id);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error) {
    console.error("❌ Failed to fetch logs by trace ID:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/api-logs/cleanup
 * Clean up old logs (older than 90 days)
 */
router.post("/cleanup", async (req, res) => {
  try {
    const query = `SELECT cleanup_old_api_logs() as deleted_count`;
    const result = await pool.query(query);

    res.json({
      success: true,
      deleted_count: result.rows[0].deleted_count,
      message: `Deleted ${result.rows[0].deleted_count} old log entries`,
    });
  } catch (error) {
    console.error("❌ Failed to cleanup logs:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
