/**
 * Bargain Hold Management API
 * Handles price holds for negotiated bargain prices
 */

const express = require("express");
const router = express.Router();

// Database connection (using existing pool)
let pool;

// Initialize with database pool
function initializeBargainHolds(dbPool) {
  pool = dbPool;
  console.log("✅ Bargain Holds API initialized");
}

/**
 * POST /api/bargain/create-hold
 * Create a price hold for a negotiated bargain price
 */
router.post("/create-hold", async (req, res) => {
  try {
    const {
      sessionId,
      module,
      productRef,
      originalPrice,
      negotiatedPrice,
      currency,
      orderRef,
      holdDurationMinutes = 15,
      userData = {},
    } = req.body;

    // Validation
    if (
      !sessionId ||
      !module ||
      !productRef ||
      !negotiatedPrice ||
      !currency ||
      !orderRef
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: [
          "sessionId",
          "module",
          "productRef",
          "negotiatedPrice",
          "currency",
          "orderRef",
        ],
      });
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);
    const holdId = `HOLD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create hold record
    const holdQuery = `
      INSERT INTO bargain_price_holds (
        hold_id, session_id, module, product_ref, original_price, 
        negotiated_price, currency, order_ref, expires_at, status,
        user_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const holdValues = [
      holdId,
      sessionId,
      module,
      productRef,
      originalPrice,
      negotiatedPrice,
      currency,
      orderRef,
      expiresAt,
      "active",
      JSON.stringify(userData),
    ];

    let holdResult;

    if (pool) {
      holdResult = await pool.query(holdQuery, holdValues);
    } else {
      // Fallback: Store in memory (for development)
      console.warn("⚠️ No database pool - storing hold in memory only");
      global.bargainHolds = global.bargainHolds || new Map();
      global.bargainHolds.set(holdId, {
        hold_id: holdId,
        session_id: sessionId,
        module,
        product_ref: productRef,
        original_price: originalPrice,
        negotiated_price: negotiatedPrice,
        currency,
        order_ref: orderRef,
        expires_at: expiresAt,
        status: "active",
        user_data: userData,
        created_at: new Date(),
      });
      holdResult = { rows: [global.bargainHolds.get(holdId)] };
    }

    console.log(
      `🔒 Price hold created: ${holdId} - ${currency} ${negotiatedPrice} (expires ${expiresAt})`,
    );

    res.json({
      success: true,
      holdId,
      orderRef,
      expiresAt,
      durationMinutes: holdDurationMinutes,
      pricing: {
        originalPrice,
        negotiatedPrice,
        savings: originalPrice - negotiatedPrice,
        currency,
      },
      message: `Price held for ${holdDurationMinutes} minutes`,
    });
  } catch (error) {
    console.error("❌ Create hold error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create price hold",
      details: error.message,
    });
  }
});

/**
 * GET /api/bargain/verify-hold/:holdId
 * Verify if a price hold is still valid
 */
router.get("/verify-hold/:holdId", async (req, res) => {
  try {
    const { holdId } = req.params;

    let holdResult;

    if (pool) {
      holdResult = await pool.query(
        "SELECT * FROM bargain_price_holds WHERE hold_id = $1 AND status = $2",
        [holdId, "active"],
      );
    } else {
      // Fallback: Check memory storage
      global.bargainHolds = global.bargainHolds || new Map();
      const hold = global.bargainHolds.get(holdId);
      holdResult = { rows: hold ? [hold] : [] };
    }

    if (holdResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Hold not found or expired",
      });
    }

    const hold = holdResult.rows[0];
    const now = new Date();
    const expiresAt = new Date(hold.expires_at);

    if (now > expiresAt) {
      // Mark as expired
      if (pool) {
        await pool.query(
          "UPDATE bargain_price_holds SET status = $1 WHERE hold_id = $2",
          ["expired", holdId],
        );
      } else {
        hold.status = "expired";
      }

      return res.status(410).json({
        success: false,
        error: "Hold has expired",
        expiredAt: expiresAt,
      });
    }

    const remainingMinutes = Math.ceil((expiresAt - now) / (1000 * 60));

    res.json({
      success: true,
      hold: {
        holdId: hold.hold_id,
        orderRef: hold.order_ref,
        module: hold.module,
        productRef: hold.product_ref,
        pricing: {
          originalPrice: hold.original_price,
          negotiatedPrice: hold.negotiated_price,
          savings: hold.original_price - hold.negotiated_price,
          currency: hold.currency,
        },
        expiresAt,
        remainingMinutes,
        status: hold.status,
      },
    });
  } catch (error) {
    console.error("❌ Verify hold error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify hold",
      details: error.message,
    });
  }
});

/**
 * POST /api/bargain/consume-hold
 * Consume a hold during booking (marking it as used)
 */
router.post("/consume-hold", async (req, res) => {
  try {
    const { holdId, bookingRef } = req.body;

    if (!holdId || !bookingRef) {
      return res.status(400).json({
        success: false,
        error: "Missing holdId or bookingRef",
      });
    }

    let updateResult;

    if (pool) {
      updateResult = await pool.query(
        `
        UPDATE bargain_price_holds 
        SET status = 'consumed', consumed_at = NOW(), booking_ref = $1
        WHERE hold_id = $2 AND status = 'active' AND expires_at > NOW()
        RETURNING *
      `,
        [bookingRef, holdId],
      );
    } else {
      // Fallback: Update memory storage
      global.bargainHolds = global.bargainHolds || new Map();
      const hold = global.bargainHolds.get(holdId);
      if (
        hold &&
        hold.status === "active" &&
        new Date() < new Date(hold.expires_at)
      ) {
        hold.status = "consumed";
        hold.consumed_at = new Date();
        hold.booking_ref = bookingRef;
        updateResult = { rows: [hold] };
      } else {
        updateResult = { rows: [] };
      }
    }

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Hold not found, expired, or already consumed",
      });
    }

    const hold = updateResult.rows[0];

    console.log(`✅ Hold consumed: ${holdId} -> Booking: ${bookingRef}`);

    res.json({
      success: true,
      message: "Hold successfully consumed",
      bookingRef,
      finalPrice: hold.negotiated_price,
      savings: hold.original_price - hold.negotiated_price,
      consumedAt: hold.consumed_at || new Date(),
    });
  } catch (error) {
    console.error("❌ Consume hold error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to consume hold",
      details: error.message,
    });
  }
});

/**
 * POST /api/bargain/release-hold
 * Release a hold (user cancelled or didn't proceed)
 */
router.post("/release-hold", async (req, res) => {
  try {
    const { holdId, reason = "user_cancelled" } = req.body;

    if (!holdId) {
      return res.status(400).json({
        success: false,
        error: "Missing holdId",
      });
    }

    let updateResult;

    if (pool) {
      updateResult = await pool.query(
        `
        UPDATE bargain_price_holds 
        SET status = 'released', released_at = NOW(), release_reason = $1
        WHERE hold_id = $2 AND status = 'active'
        RETURNING *
      `,
        [reason, holdId],
      );
    } else {
      // Fallback: Update memory storage
      global.bargainHolds = global.bargainHolds || new Map();
      const hold = global.bargainHolds.get(holdId);
      if (hold && hold.status === "active") {
        hold.status = "released";
        hold.released_at = new Date();
        hold.release_reason = reason;
        updateResult = { rows: [hold] };
      } else {
        updateResult = { rows: [] };
      }
    }

    res.json({
      success: true,
      message: "Hold released",
      released: updateResult.rows.length > 0,
    });
  } catch (error) {
    console.error("❌ Release hold error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to release hold",
      details: error.message,
    });
  }
});

/**
 * GET /api/bargain/holds/cleanup
 * Cleanup expired holds (maintenance endpoint)
 */
router.get("/holds/cleanup", async (req, res) => {
  try {
    let cleanupResult;

    if (pool) {
      cleanupResult = await pool.query(`
        UPDATE bargain_price_holds 
        SET status = 'expired' 
        WHERE status = 'active' AND expires_at < NOW()
        RETURNING count(*)
      `);
    } else {
      // Fallback: Cleanup memory storage
      global.bargainHolds = global.bargainHolds || new Map();
      let expiredCount = 0;
      const now = new Date();

      for (const [holdId, hold] of global.bargainHolds.entries()) {
        if (hold.status === "active" && new Date(hold.expires_at) < now) {
          hold.status = "expired";
          expiredCount++;
        }
      }

      cleanupResult = { rows: [{ count: expiredCount }] };
    }

    const expiredCount = cleanupResult.rows[0]?.count || 0;

    res.json({
      success: true,
      message: `Cleaned up ${expiredCount} expired holds`,
      expiredCount,
    });
  } catch (error) {
    console.error("❌ Cleanup holds error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup holds",
      details: error.message,
    });
  }
});

module.exports = { router, initializeBargainHolds };
