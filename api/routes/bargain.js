/**
 * Public Bargain API Routes
 * Session-based bargaining endpoints
 */

const express = require("express");
const router = express.Router();
const bargainEngine = require("../services/bargainEngine");

/**
 * GET /bargain/settings
 * Get effective settings for a module
 */
router.get("/settings", async (req, res) => {
  try {
    const { module, country_code, city } = req.query;

    if (!module) {
      return res.status(400).json({
        error: "Module parameter is required",
      });
    }

    const validModules = [
      "hotels",
      "flights",
      "sightseeing",
      "transfers",
      "packages",
      "addons",
    ];
    if (!validModules.includes(module)) {
      return res.status(400).json({
        error: `Invalid module. Must be one of: ${validModules.join(", ")}`,
      });
    }

    const settings = await bargainEngine.getSettings(module, {
      country_code,
      city,
    });

    // Return only public-facing settings
    res.json({
      enabled: settings.enabled,
      attempts: settings.attempts,
      r1_timer_sec: settings.r1_timer_sec,
      r2_timer_sec: settings.r2_timer_sec,
      show_recommended_badge: settings.show_recommended_badge,
      recommended_label: settings.recommended_label,
      show_standard_price_on_expiry: settings.show_standard_price_on_expiry,
      copy: settings.copy_json,
      // Don't expose discount ranges or internal flags
    });
  } catch (error) {
    console.error("Error fetching bargain settings:", error);
    res.status(500).json({
      error: "Failed to fetch settings",
      message: error.message,
    });
  }
});

/**
 * POST /bargain/start
 * Start a new bargain session
 *
 * Body: {
 *   module: 'hotels' | 'flights' | ...,
 *   productId: string,
 *   basePrice: number (in minor units),
 *   userId?: string,
 *   metadata?: object (device, browser, etc.)
 * }
 */
router.post("/start", async (req, res) => {
  try {
    const { module, productId, basePrice, userId, metadata } = req.body;

    // Validation
    if (!module || !productId || !basePrice) {
      return res.status(400).json({
        error: "Missing required fields: module, productId, basePrice",
      });
    }

    if (typeof basePrice !== "number" || basePrice <= 0) {
      return res.status(400).json({
        error: "basePrice must be a positive number",
      });
    }

    const session = await bargainEngine.startSession({
      module,
      productId,
      basePrice,
      userId: userId || null,
      metadata: metadata || {},
    });

    res.json({
      success: true,
      ...session,
    });
  } catch (error) {
    console.error("Error starting bargain session:", error);
    res.status(500).json({
      error: "Failed to start session",
      message: error.message,
    });
  }
});

/**
 * POST /bargain/submit-r1
 * Submit Round 1 bid
 *
 * Body: {
 *   sessionId: uuid,
 *   bid: number (in minor units)
 * }
 */
router.post("/submit-r1", async (req, res) => {
  try {
    const { sessionId, bid } = req.body;

    if (!sessionId || !bid) {
      return res.status(400).json({
        error: "Missing required fields: sessionId, bid",
      });
    }

    if (typeof bid !== "number" || bid <= 0) {
      return res.status(400).json({
        error: "bid must be a positive number",
      });
    }

    const result = await bargainEngine.submitRound1(sessionId, bid);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error submitting Round 1 bid:", error);
    res.status(500).json({
      error: "Failed to submit bid",
      message: error.message,
    });
  }
});

/**
 * POST /bargain/submit-r2
 * Submit Round 2 bid (hotels only)
 *
 * Body: {
 *   sessionId: uuid,
 *   bid: number (in minor units)
 * }
 */
router.post("/submit-r2", async (req, res) => {
  try {
    const { sessionId, bid } = req.body;

    if (!sessionId || !bid) {
      return res.status(400).json({
        error: "Missing required fields: sessionId, bid",
      });
    }

    if (typeof bid !== "number" || bid <= 0) {
      return res.status(400).json({
        error: "bid must be a positive number",
      });
    }

    const result = await bargainEngine.submitRound2(sessionId, bid);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error submitting Round 2 bid:", error);
    res.status(500).json({
      error: "Failed to submit bid",
      message: error.message,
    });
  }
});

/**
 * POST /bargain/action-r1
 * Record Round 1 action
 *
 * Body: {
 *   sessionId: uuid,
 *   action: 'book' | 'try_final' | 'skip' | 'close' | 'timeout'
 * }
 */
router.post("/action-r1", async (req, res) => {
  try {
    const { sessionId, action } = req.body;

    if (!sessionId || !action) {
      return res.status(400).json({
        error: "Missing required fields: sessionId, action",
      });
    }

    const validActions = ["book", "try_final", "skip", "close", "timeout"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
      });
    }

    await bargainEngine.recordRound1Action(sessionId, action);

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Error recording Round 1 action:", error);
    res.status(500).json({
      error: "Failed to record action",
      message: error.message,
    });
  }
});

/**
 * POST /bargain/select
 * Select final price (r1 or r2)
 *
 * Body: {
 *   sessionId: uuid,
 *   selected: 'r1' | 'r2'
 * }
 */
router.post("/select", async (req, res) => {
  try {
    const { sessionId, selected } = req.body;

    if (!sessionId || !selected) {
      return res.status(400).json({
        error: "Missing required fields: sessionId, selected",
      });
    }

    if (selected !== "r1" && selected !== "r2") {
      return res.status(400).json({
        error: 'selected must be either "r1" or "r2"',
      });
    }

    const result = await bargainEngine.selectPrice(sessionId, selected);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error selecting price:", error);
    res.status(500).json({
      error: "Failed to select price",
      message: error.message,
    });
  }
});

/**
 * POST /bargain/hold
 * Create price hold
 *
 * Body: {
 *   sessionId: uuid,
 *   holdDurationMinutes?: number (default: 15)
 * }
 */
router.post("/hold", async (req, res) => {
  try {
    const { sessionId, holdDurationMinutes } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: "Missing required field: sessionId",
      });
    }

    const result = await bargainEngine.createHold(
      sessionId,
      holdDurationMinutes || 15,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error creating price hold:", error);
    res.status(500).json({
      error: "Failed to create hold",
      message: error.message,
    });
  }
});

/**
 * POST /bargain/abandon
 * Mark session as abandoned
 *
 * Body: {
 *   sessionId: uuid,
 *   reason?: string
 * }
 */
router.post("/abandon", async (req, res) => {
  try {
    const { sessionId, reason } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: "Missing required field: sessionId",
      });
    }

    await bargainEngine.abandonSession(sessionId, reason || "user_closed");

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Error abandoning session:", error);
    res.status(500).json({
      error: "Failed to abandon session",
      message: error.message,
    });
  }
});

module.exports = router;
