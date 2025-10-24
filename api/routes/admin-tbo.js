/**
 * Admin TBO Routes
 * Manage TBO location data syncs and statistics
 */

const express = require("express");
const db = require("../database/connection.js");
const { syncTboLocations } = require("../jobs/tboSyncLocations.js");
const router = express.Router();

/**
 * POST /api/admin/tbo/sync
 * Manually trigger a full TBO locations sync
 */
router.post("/sync", async (req, res) => {
  try {
    console.log("📡 Admin triggered TBO sync...");

    const result = await syncTboLocations();

    // Store sync result in audit log
    if (result.success) {
      await db.query(
        `INSERT INTO admin_sync_logs (sync_type, status, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        ["tbo_locations", "success", JSON.stringify(result)],
      ).catch(() => {
        // Log table may not exist, ignore
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Sync error:", error.message);
    res.status(500).json({
      success: false,
      error: "Sync failed",
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/tbo/stats
 * Get current TBO data statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const [countriesRes, citiesRes, hotelsRes] = await Promise.all([
      db.query(
        "SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM tbo_countries",
      ),
      db.query(
        "SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM tbo_cities",
      ),
      db.query(
        "SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM tbo_hotels",
      ),
    ]);

    const stats = {
      countries: {
        count: parseInt(countriesRes.rows[0]?.count || 0),
        last_updated: countriesRes.rows[0]?.last_updated,
      },
      cities: {
        count: parseInt(citiesRes.rows[0]?.count || 0),
        last_updated: citiesRes.rows[0]?.last_updated,
      },
      hotels: {
        count: parseInt(hotelsRes.rows[0]?.count || 0),
        last_updated: hotelsRes.rows[0]?.last_updated,
      },
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
 * GET /api/admin/tbo/sync-status
 * Get last sync status from logs
 */
router.get("/sync-status", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM admin_sync_logs 
       WHERE sync_type = 'tbo_locations' 
       ORDER BY created_at DESC 
       LIMIT 5`,
    ).catch(() => {
      // Log table may not exist
      return { rows: [] };
    });

    res.json({
      recent_syncs: result.rows || [],
    });
  } catch (error) {
    console.error("Sync status error:", error.message);
    res.status(500).json({
      error: "Failed to fetch sync status",
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/tbo/clear
 * Clear all TBO location data (dangerous - admin only)
 */
router.post("/clear", async (req, res) => {
  try {
    const confirmToken = req.body.confirm;
    if (confirmToken !== "CLEAR_ALL_TBO_DATA") {
      return res.status(400).json({
        error: "Confirmation token required",
        message: "Pass { confirm: 'CLEAR_ALL_TBO_DATA' } to proceed",
      });
    }

    console.warn("⚠️  Clearing all TBO data...");

    await Promise.all([
      db.query("DELETE FROM tbo_hotels"),
      db.query("DELETE FROM tbo_cities"),
      db.query("DELETE FROM tbo_countries"),
    ]);

    res.json({
      success: true,
      message: "All TBO data cleared",
    });
  } catch (error) {
    console.error("Clear error:", error.message);
    res.status(500).json({
      error: "Clear failed",
      message: error.message,
    });
  }
});

module.exports = router;
