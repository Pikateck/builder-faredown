/**
 * Admin Suppliers Management API
 * Manage supplier integrations, health, markups, and documents
 */

const express = require("express");
const db = require("../database/connection");
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");
const adminAuth = require("../middleware/adminKey");

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * Get all suppliers
 */
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        s.*,
        0 as total_bookings,
        0 as bookings_24h
      FROM supplier_master s
      ORDER BY s.enabled DESC, s.weight DESC, s.name
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get supplier health status
 */
router.get("/health", async (req, res) => {
  try {
    const healthStatus = await supplierAdapterManager.getAdapterHealthStatus();

    res.json({
      success: true,
      data: healthStatus,
    });
  } catch (error) {
    console.error("Error fetching supplier health:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get adapter metrics snapshot
 */
router.get("/metrics", async (req, res) => {
  try {
    const metrics = supplierAdapterManager.getAdapterMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching supplier metrics:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Reset supplier circuit breaker
 */
router.post("/:code/circuit/reset", async (req, res) => {
  try {
    const normalizedCode = String(req.params.code || "").toUpperCase();

    const reset = supplierAdapterManager.resetAdapterCircuitBreaker(
      normalizedCode,
    );

    if (!reset) {
      return res.status(404).json({
        success: false,
        error: `Adapter not found for supplier: ${normalizedCode}`,
      });
    }

    const metrics =
      supplierAdapterManager.getAdapterMetrics().adapters[normalizedCode] ||
      null;

    res.json({
      success: true,
      data: {
        supplier: normalizedCode,
        circuitBreaker: metrics?.circuit_breaker || {
          state: "CLOSED",
          failures: 0,
          last_failure: null,
        },
      },
    });
  } catch (error) {
    console.error("Error resetting circuit breaker:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update supplier circuit breaker configuration
 */
router.post("/:code/circuit/config", async (req, res) => {
  try {
    const normalizedCode = String(req.params.code || "").toUpperCase();
    const {
      failureThreshold,
      recoveryTimeout,
      requestsPerSecond,
      maxRetries,
      retryDelay,
    } = req.body || {};

    const configUpdates = {};

    if (failureThreshold !== undefined) {
      const value = Number(failureThreshold);
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({
          success: false,
          error: "failureThreshold must be a positive number",
        });
      }
      configUpdates.failureThreshold = value;
    }

    if (recoveryTimeout !== undefined) {
      const value = Number(recoveryTimeout);
      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          error: "recoveryTimeout must be zero or a positive number",
        });
      }
      configUpdates.recoveryTimeout = value;
    }

    if (requestsPerSecond !== undefined) {
      const value = Number(requestsPerSecond);
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({
          success: false,
          error: "requestsPerSecond must be a positive number",
        });
      }
      configUpdates.requestsPerSecond = value;
    }

    if (maxRetries !== undefined) {
      const value = Number(maxRetries);
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({
          success: false,
          error: "maxRetries must be a positive number",
        });
      }
      configUpdates.maxRetries = value;
    }

    if (retryDelay !== undefined) {
      const value = Number(retryDelay);
      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          error: "retryDelay must be zero or a positive number",
        });
      }
      configUpdates.retryDelay = value;
    }

    if (Object.keys(configUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No configuration values provided",
      });
    }

    const updated = supplierAdapterManager.updateAdapterConfig(
      normalizedCode,
      configUpdates,
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Adapter not found for supplier: ${normalizedCode}`,
      });
    }

    const metrics =
      supplierAdapterManager.getAdapterMetrics().adapters[normalizedCode];

    res.json({
      success: true,
      data: {
        supplier: normalizedCode,
        circuitBreaker: metrics.circuit_breaker,
        rateLimit: metrics.rate_limit,
        configuration: metrics.configuration,
      },
    });
  } catch (error) {
    console.error("Error updating circuit configuration:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get supplier by code
 */
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      `
      SELECT
        s.*,
        0 as total_bookings,
        0 as bookings_24h
      FROM supplier_master s
      WHERE s.code = $1
    `,
      [code],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update supplier
 */
router.put("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { is_enabled, environment, weight } = req.body || {};

    const result = await db.query(
      `
      UPDATE supplier_master
      SET
        enabled = COALESCE($2, enabled),
        weight = COALESCE($3, weight),
        updated_at = NOW()
      WHERE code = $1
      RETURNING *
    `,
      [code, is_enabled, weight],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Test supplier search
 */
router.post("/:code/test/search", async (req, res) => {
  try {
    const { code } = req.params;
    const { productType, searchParams } = req.body;

    const adapter = supplierAdapterManager.getAdapter(code);
    if (!adapter) {
      return res.status(404).json({
        success: false,
        error: `Adapter not found for supplier: ${code}`,
      });
    }

    let results;
    const startTime = Date.now();

    switch (productType) {
      case "flights":
        results = await adapter.searchFlights(searchParams);
        break;
      case "hotels":
        results = await adapter.searchHotels(searchParams);
        break;
      case "sightseeing":
        results = await adapter.searchSightseeing(searchParams);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid product type",
        });
    }

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        supplier: code,
        productType,
        resultCount: results.length,
        responseTime,
        results: results.slice(0, 5), // Return first 5 for preview
      },
    });
  } catch (error) {
    console.error("Error testing supplier search:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get supplier markups
 */
router.get("/:code/markups", async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      `
      SELECT * FROM supplier_markups
      WHERE supplier_code = $1
      ORDER BY priority ASC, created_at DESC
    `,
      [code],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching supplier markups:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Create supplier markup
 */
router.post("/:code/markups", async (req, res) => {
  try {
    const { code } = req.params;
    const {
      product_type,
      market = "ALL",
      currency = "ALL",
      hotel_id = "ALL",
      destination = "ALL",
      channel = "ALL",
      value_type,
      value,
      priority = 100,
      valid_from,
      valid_to,
    } = req.body;

    const result = await db.query(
      `
      INSERT INTO supplier_markups (
        supplier_code, product_type, market, currency, hotel_id, destination, channel,
        value_type, value, priority, valid_from, valid_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `,
      [
        code,
        product_type,
        market,
        currency,
        hotel_id,
        destination,
        channel,
        value_type,
        value,
        priority,
        valid_from,
        valid_to,
      ],
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating supplier markup:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update supplier markup
 */
router.put("/:code/markups/:markupId", async (req, res) => {
  try {
    const { code, markupId } = req.params;
    const {
      market,
      currency,
      hotel_id,
      destination,
      channel,
      value_type,
      value,
      priority,
      is_active,
      valid_from,
      valid_to,
    } = req.body;

    const result = await db.query(
      `
      UPDATE supplier_markups 
      SET 
        market = COALESCE($3, market),
        currency = COALESCE($4, currency),
        hotel_id = COALESCE($5, hotel_id),
        destination = COALESCE($6, destination),
        channel = COALESCE($7, channel),
        value_type = COALESCE($8, value_type),
        value = COALESCE($9, value),
        priority = COALESCE($10, priority),
        is_active = COALESCE($11, is_active),
        valid_from = COALESCE($12, valid_from),
        valid_to = COALESCE($13, valid_to),
        updated_at = NOW()
      WHERE supplier_code = $1 AND id = $2
      RETURNING *
    `,
      [
        code,
        markupId,
        market,
        currency,
        hotel_id,
        destination,
        channel,
        value_type,
        value,
        priority,
        is_active,
        valid_from,
        valid_to,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Markup not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating supplier markup:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Delete supplier markup
 */
router.delete("/:code/markups/:markupId", async (req, res) => {
  try {
    const { code, markupId } = req.params;

    const result = await db.query(
      `DELETE FROM supplier_markups WHERE supplier_code = $1 AND id = $2 RETURNING *`,
      [code, markupId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Markup not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting supplier markup:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get effective markup preview
 */
router.post("/:code/markups/preview", async (req, res) => {
  try {
    const { code } = req.params;
    const {
      product_type,
      market = "ALL",
      currency = "ALL",
      hotel_id = "ALL",
      destination = "ALL",
      channel = "ALL",
      base_price,
    } = req.body;

    const result = await db.query(
      `
      SELECT * FROM get_effective_supplier_markup($1, $2, $3, $4, $5, $6, $7)
    `,
      [code, product_type, market, currency, hotel_id, destination, channel],
    );

    let finalPrice = base_price;
    let appliedMarkup = null;

    if (result.rows.length > 0) {
      appliedMarkup = result.rows[0];
      if (appliedMarkup.value_type === "PERCENT") {
        finalPrice = base_price * (1 + appliedMarkup.value / 100);
      } else if (appliedMarkup.value_type === "FLAT") {
        finalPrice = base_price + appliedMarkup.value;
      }
    }

    res.json({
      success: true,
      data: {
        basePrice: base_price,
        finalPrice,
        markup: appliedMarkup,
        increase: finalPrice - base_price,
        increasePercent:
          base_price > 0 ? ((finalPrice - base_price) / base_price) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Error previewing markup:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get supplier sync jobs
 */
router.get("/:code/sync-jobs", async (req, res) => {
  try {
    const { code } = req.params;
    const { limit = 20 } = req.query;

    const result = await db.query(
      `
      SELECT * FROM supplier_sync_jobs
      WHERE supplier_code = $1
      ORDER BY started_at DESC
      LIMIT $2
    `,
      [code, limit],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching sync jobs:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Trigger content sync
 */
router.post("/:code/sync", async (req, res) => {
  try {
    const { code } = req.params;
    const { jobType = "static" } = req.body;

    // Create sync job record
    const jobResult = await db.query(
      `
      INSERT INTO supplier_sync_jobs (supplier_code, job_type, status)
      VALUES ($1, $2, 'running')
      RETURNING *
    `,
      [code, jobType],
    );

    const job = jobResult.rows[0];

    // Trigger async sync (in production, use a queue)
    // For now, return job ID immediately
    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: "running",
        message: "Sync job started",
      },
    });

    // Note: Actual sync logic would run in background
  } catch (error) {
    console.error("Error triggering sync:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
