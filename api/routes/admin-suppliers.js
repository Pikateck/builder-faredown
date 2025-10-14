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
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.created_at > NOW() - INTERVAL '24 hours' THEN b.id END) as bookings_24h,
        (
          SELECT SUM(success_count) 
          FROM supplier_health_metrics 
          WHERE supplier_code = s.code 
          AND metric_hour > NOW() - INTERVAL '24 hours'
        ) as success_calls_24h,
        (
          SELECT SUM(error_count) 
          FROM supplier_health_metrics 
          WHERE supplier_code = s.code 
          AND metric_hour > NOW() - INTERVAL '24 hours'
        ) as error_calls_24h
      FROM suppliers s
      LEFT JOIN bookings b ON b.supplier_code = s.code
      GROUP BY s.id
      ORDER BY s.product_type, s.name
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
 * Get supplier by code
 */
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      `
      SELECT 
        s.*,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.created_at > NOW() - INTERVAL '24 hours' THEN b.id END) as bookings_24h
      FROM suppliers s
      LEFT JOIN bookings b ON b.supplier_code = s.code
      WHERE s.code = $1
      GROUP BY s.id
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
    const { is_enabled, environment } = req.body;

    const result = await db.query(
      `
      UPDATE suppliers 
      SET 
        is_enabled = COALESCE($2, is_enabled),
        environment = COALESCE($3, environment),
        updated_at = NOW()
      WHERE code = $1
      RETURNING *
    `,
      [code, is_enabled, environment],
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
