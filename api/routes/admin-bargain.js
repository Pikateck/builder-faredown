/**
 * Admin Bargain API Routes
 * Bargain settings management (admin-only)
 */

const express = require("express");
const router = express.Router();
const db = require("../lib/db");

/**
 * GET /admin/bargain/settings
 * List all module settings
 */
router.get("/settings", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, module, enabled, attempts, 
        r1_timer_sec, r2_timer_sec,
        discount_min_pct, discount_max_pct,
        show_recommended_badge, recommended_label,
        show_standard_price_on_expiry, price_match_enabled,
        copy_json, experiment_flags,
        updated_at, updated_by
      FROM bargain_settings
      ORDER BY 
        CASE module
          WHEN 'hotels' THEN 1
          WHEN 'flights' THEN 2
          WHEN 'sightseeing' THEN 3
          WHEN 'transfers' THEN 4
          WHEN 'packages' THEN 5
          WHEN 'addons' THEN 6
        END
    `);

    res.json({
      success: true,
      settings: result.rows,
    });
  } catch (error) {
    console.error("Error fetching admin bargain settings:", error);
    res.status(500).json({
      error: "Failed to fetch settings",
      message: error.message,
    });
  }
});

/**
 * GET /admin/bargain/settings/:module
 * Get settings for specific module
 */
router.get("/settings/:module", async (req, res) => {
  try {
    const { module } = req.params;

    const result = await db.query(
      "SELECT * FROM bargain_settings WHERE module = $1",
      [module],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `Settings not found for module: ${module}`,
      });
    }

    res.json({
      success: true,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching module settings:", error);
    res.status(500).json({
      error: "Failed to fetch settings",
      message: error.message,
    });
  }
});

/**
 * PUT /admin/bargain/settings/:module
 * Update settings for specific module
 *
 * Body: {
 *   enabled?: boolean,
 *   attempts?: number,
 *   r1_timer_sec?: number,
 *   r2_timer_sec?: number,
 *   discount_min_pct?: number,
 *   discount_max_pct?: number,
 *   show_recommended_badge?: boolean,
 *   recommended_label?: string,
 *   show_standard_price_on_expiry?: boolean,
 *   price_match_enabled?: boolean,
 *   copy_json?: object,
 *   experiment_flags?: object,
 *   updated_by?: string
 * }
 */
router.put("/settings/:module", async (req, res) => {
  try {
    const { module } = req.params;
    const {
      enabled,
      attempts,
      r1_timer_sec,
      r2_timer_sec,
      discount_min_pct,
      discount_max_pct,
      show_recommended_badge,
      recommended_label,
      show_standard_price_on_expiry,
      price_match_enabled,
      copy_json,
      experiment_flags,
      updated_by,
    } = req.body;

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(enabled);
    }

    if (attempts !== undefined) {
      updates.push(`attempts = $${paramIndex++}`);
      values.push(attempts);
    }

    if (r1_timer_sec !== undefined) {
      updates.push(`r1_timer_sec = $${paramIndex++}`);
      values.push(r1_timer_sec);
    }

    if (r2_timer_sec !== undefined) {
      updates.push(`r2_timer_sec = $${paramIndex++}`);
      values.push(r2_timer_sec);
    }

    if (discount_min_pct !== undefined) {
      updates.push(`discount_min_pct = $${paramIndex++}`);
      values.push(discount_min_pct);
    }

    if (discount_max_pct !== undefined) {
      updates.push(`discount_max_pct = $${paramIndex++}`);
      values.push(discount_max_pct);
    }

    if (show_recommended_badge !== undefined) {
      updates.push(`show_recommended_badge = $${paramIndex++}`);
      values.push(show_recommended_badge);
    }

    if (recommended_label !== undefined) {
      updates.push(`recommended_label = $${paramIndex++}`);
      values.push(recommended_label);
    }

    if (show_standard_price_on_expiry !== undefined) {
      updates.push(`show_standard_price_on_expiry = $${paramIndex++}`);
      values.push(show_standard_price_on_expiry);
    }

    if (price_match_enabled !== undefined) {
      updates.push(`price_match_enabled = $${paramIndex++}`);
      values.push(price_match_enabled);
    }

    if (copy_json !== undefined) {
      updates.push(`copy_json = $${paramIndex++}`);
      values.push(JSON.stringify(copy_json));
    }

    if (experiment_flags !== undefined) {
      updates.push(`experiment_flags = $${paramIndex++}`);
      values.push(JSON.stringify(experiment_flags));
    }

    if (updated_by !== undefined) {
      updates.push(`updated_by = $${paramIndex++}`);
      values.push(updated_by);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    // Add module to values
    values.push(module);

    const query = `
      UPDATE bargain_settings 
      SET ${updates.join(", ")}, updated_at = now()
      WHERE module = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `Settings not found for module: ${module}`,
      });
    }

    res.json({
      success: true,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating bargain settings:", error);
    res.status(500).json({
      error: "Failed to update settings",
      message: error.message,
    });
  }
});

/**
 * GET /admin/bargain/market-rules
 * List all market-specific rules
 */
router.get("/market-rules", async (req, res) => {
  try {
    const { module } = req.query;

    let query = "SELECT * FROM bargain_market_rules";
    const values = [];

    if (module) {
      query += " WHERE module = $1";
      values.push(module);
    }

    query += " ORDER BY module, country_code, city";

    const result = await db.query(query, values);

    res.json({
      success: true,
      rules: result.rows,
    });
  } catch (error) {
    console.error("Error fetching market rules:", error);
    res.status(500).json({
      error: "Failed to fetch rules",
      message: error.message,
    });
  }
});

/**
 * POST /admin/bargain/market-rules
 * Create or update market-specific rule
 *
 * Body: {
 *   module: 'hotels' | ...,
 *   country_code?: string,
 *   city?: string,
 *   attempts?: number,
 *   r1_timer_sec?: number,
 *   r2_timer_sec?: number,
 *   discount_min_pct?: number,
 *   discount_max_pct?: number,
 *   copy_json?: object
 * }
 */
router.post("/market-rules", async (req, res) => {
  try {
    const {
      module,
      country_code,
      city,
      attempts,
      r1_timer_sec,
      r2_timer_sec,
      discount_min_pct,
      discount_max_pct,
      copy_json,
    } = req.body;

    if (!module) {
      return res.status(400).json({
        error: "Module is required",
      });
    }

    const result = await db.query(
      `INSERT INTO bargain_market_rules 
       (module, country_code, city, attempts, r1_timer_sec, r2_timer_sec, 
        discount_min_pct, discount_max_pct, copy_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (module, COALESCE(country_code,''), COALESCE(city,''))
       DO UPDATE SET
         attempts = EXCLUDED.attempts,
         r1_timer_sec = EXCLUDED.r1_timer_sec,
         r2_timer_sec = EXCLUDED.r2_timer_sec,
         discount_min_pct = EXCLUDED.discount_min_pct,
         discount_max_pct = EXCLUDED.discount_max_pct,
         copy_json = EXCLUDED.copy_json,
         updated_at = now()
       RETURNING *`,
      [
        module,
        country_code || null,
        city || null,
        attempts,
        r1_timer_sec,
        r2_timer_sec,
        discount_min_pct,
        discount_max_pct,
        copy_json ? JSON.stringify(copy_json) : null,
      ],
    );

    res.json({
      success: true,
      rule: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating/updating market rule:", error);
    res.status(500).json({
      error: "Failed to save rule",
      message: error.message,
    });
  }
});

/**
 * DELETE /admin/bargain/market-rules/:id
 * Delete a market rule
 */
router.delete("/market-rules/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM bargain_market_rules WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Rule not found",
      });
    }

    res.json({
      success: true,
      deleted: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting market rule:", error);
    res.status(500).json({
      error: "Failed to delete rule",
      message: error.message,
    });
  }
});

/**
 * GET /admin/bargain/analytics/summary
 * Get bargain analytics summary
 */
router.get("/analytics/summary", async (req, res) => {
  try {
    const { module, days } = req.query;
    const daysBack = parseInt(days) || 7;

    let whereClause = `WHERE created_at >= now() - interval '${daysBack} days'`;
    const values = [];

    if (module) {
      whereClause += " AND module = $1";
      values.push(module);
    }

    const query = `
      SELECT 
        module,
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN outcome = 'booked' THEN 1 END) as booked,
        COUNT(CASE WHEN outcome = 'expired' THEN 1 END) as expired,
        COUNT(CASE WHEN outcome = 'abandoned' THEN 1 END) as abandoned,
        AVG(CASE 
          WHEN selected_price_cents IS NOT NULL AND base_price_cents > 0 
          THEN ((base_price_cents - selected_price_cents)::float / base_price_cents * 100)
        END) as avg_discount_pct,
        AVG(CASE 
          WHEN r1_bid_cents IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (updated_at - created_at))
        END) as avg_time_to_r1_sec
      FROM bargain_sessions
      ${whereClause}
      GROUP BY module
      ORDER BY total_sessions DESC
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      summary: result.rows,
      period_days: daysBack,
    });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    res.status(500).json({
      error: "Failed to fetch analytics",
      message: error.message,
    });
  }
});

module.exports = router;
