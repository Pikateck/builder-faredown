import express from "express";
/**
 * Feature Flags API Routes
 * For AI Chat Analytics and Bargain Engine Feature Control
 */

const router = express.Router();
const { requirePermission, PERMISSIONS } = require("../middleware/auth");

// Default feature flag values with fallbacks
const DEFAULT_FLAGS = {
  AI_TRAFFIC: parseFloat(process.env.AI_TRAFFIC || "0.0"),
  AI_SHADOW:
    process.env.AI_SHADOW === "true" || process.env.AI_SHADOW === undefined, // Default true if not set
  AI_KILL_SWITCH: process.env.AI_KILL_SWITCH === "true" || false,
  AI_AUTO_SCALE: process.env.AI_AUTO_SCALE === "true" || false,
  ENABLE_CHAT_ANALYTICS: process.env.ENABLE_CHAT_ANALYTICS === "true" || true, // Default enabled
  MAX_BARGAIN_ROUNDS: parseInt(process.env.MAX_BARGAIN_ROUNDS || "3"),
  BARGAIN_TIMEOUT_SECONDS: parseInt(
    process.env.BARGAIN_TIMEOUT_SECONDS || "30",
  ),
};

// In-memory flag overrides (in production, use Redis or database)
let flagOverrides = {};

/**
 * @api {get} /api/feature-flags Get Feature Flags
 * @apiName GetFeatureFlags
 * @apiGroup FeatureFlags
 * @apiVersion 1.0.0
 *
 * @apiDescription Get current feature flag values for AI chat analytics and bargain engine
 *
 * @apiSuccess {Number} AI_TRAFFIC Traffic percentage for AI features (0.0-1.0)
 * @apiSuccess {Boolean} AI_SHADOW Enable shadow mode logging
 * @apiSuccess {Boolean} AI_KILL_SWITCH Emergency disable switch
 * @apiSuccess {Boolean} AI_AUTO_SCALE Auto-scaling enabled
 * @apiSuccess {Boolean} ENABLE_CHAT_ANALYTICS Chat analytics tracking
 * @apiSuccess {Number} MAX_BARGAIN_ROUNDS Maximum bargaining rounds
 * @apiSuccess {Number} BARGAIN_TIMEOUT_SECONDS Bargain offer timeout
 *
 * @apiSuccessExample {json} Success Response:
 * {
 *   "AI_TRAFFIC": 0.0,
 *   "AI_SHADOW": true,
 *   "AI_KILL_SWITCH": false,
 *   "AI_AUTO_SCALE": false,
 *   "ENABLE_CHAT_ANALYTICS": true,
 *   "MAX_BARGAIN_ROUNDS": 3,
 *   "BARGAIN_TIMEOUT_SECONDS": 30
 * }
 */
router.get("/", (req, res) => {
  try {
    // Merge defaults with any runtime overrides
    const currentFlags = {
      ...DEFAULT_FLAGS,
      ...flagOverrides,
    };

    console.log("[FEATURE-FLAGS] GET request:", {
      requestId: req.headers["x-request-id"] || "no-request-id",
      userAgent: req.headers["user-agent"] || "unknown",
      flags: currentFlags,
      source: "api/routes/feature-flags.js",
    });

    res.json(currentFlags);
  } catch (error) {
    console.error("[FEATURE-FLAGS] Error getting flags:", error);
    res.status(500).json({
      error: "Failed to get feature flags",
      message: error.message,
    });
  }
});

/**
 * @api {post} /api/feature-flags Update Feature Flags
 * @apiName UpdateFeatureFlags
 * @apiGroup FeatureFlags
 * @apiVersion 1.0.0
 *
 * @apiDescription Update feature flag values (Admin only)
 *
 * @apiHeader {String} Authorization Bearer token required
 * @apiPermission admin
 *
 * @apiParam {Number} [AI_TRAFFIC] Traffic percentage (0.0-1.0)
 * @apiParam {Boolean} [AI_SHADOW] Shadow mode
 * @apiParam {Boolean} [AI_KILL_SWITCH] Kill switch
 * @apiParam {Boolean} [AI_AUTO_SCALE] Auto-scaling
 * @apiParam {Boolean} [ENABLE_CHAT_ANALYTICS] Chat analytics
 * @apiParam {Number} [MAX_BARGAIN_ROUNDS] Max rounds (1-5)
 * @apiParam {Number} [BARGAIN_TIMEOUT_SECONDS] Timeout (10-120)
 *
 * @apiParamExample {json} Request Example:
 * {
 *   "AI_TRAFFIC": 0.1,
 *   "AI_SHADOW": true,
 *   "AI_KILL_SWITCH": false
 * }
 *
 * @apiSuccess {Object} flags Updated flag values
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} updatedAt Update timestamp
 */
router.post("/", requirePermission(PERMISSIONS.ADMIN_MANAGE), (req, res) => {
  try {
    const updates = req.body;
    const allowedFlags = Object.keys(DEFAULT_FLAGS);
    const validUpdates = {};

    // Validate and filter updates
    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFlags.includes(key)) {
        return res.status(400).json({
          error: "Invalid flag",
          message: `Flag '${key}' is not recognized. Allowed flags: ${allowedFlags.join(", ")}`,
        });
      }

      // Type validation
      if (key === "AI_TRAFFIC") {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 1) {
          return res.status(400).json({
            error: "Invalid AI_TRAFFIC value",
            message: "AI_TRAFFIC must be a number between 0.0 and 1.0",
          });
        }
        validUpdates[key] = numValue;
      } else if (key.includes("TIMEOUT") || key.includes("ROUNDS")) {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1) {
          return res.status(400).json({
            error: `Invalid ${key} value`,
            message: `${key} must be a positive integer`,
          });
        }
        validUpdates[key] = numValue;
      } else {
        // Boolean flags
        validUpdates[key] = Boolean(value);
      }
    }

    // Apply updates
    flagOverrides = { ...flagOverrides, ...validUpdates };

    const updatedFlags = {
      ...DEFAULT_FLAGS,
      ...flagOverrides,
    };

    console.log("[FEATURE-FLAGS] POST update:", {
      requestId: req.headers["x-request-id"] || "no-request-id",
      userId: req.user?.id || "anonymous",
      updates: validUpdates,
      newFlags: updatedFlags,
      timestamp: new Date().toISOString(),
    });

    res.json({
      flags: updatedFlags,
      message: "Feature flags updated successfully",
      updatedAt: new Date().toISOString(),
      updatedFlags: Object.keys(validUpdates),
    });
  } catch (error) {
    console.error("[FEATURE-FLAGS] Error updating flags:", error);
    res.status(500).json({
      error: "Failed to update feature flags",
      message: error.message,
    });
  }
});

/**
 * @api {get} /api/feature-flags/status Get Feature Flag Status
 * @apiName GetFeatureFlagStatus
 * @apiGroup FeatureFlags
 * @apiVersion 1.0.0
 *
 * @apiDescription Get detailed status of feature flags including source
 *
 * @apiSuccess {Object} flags Current flag values
 * @apiSuccess {Object} sources Flag value sources (env, override, default)
 * @apiSuccess {String} environment Current environment
 * @apiSuccess {String} timestamp Current timestamp
 */
router.get("/status", (req, res) => {
  try {
    const flagSources = {};
    const currentFlags = {};

    for (const key of Object.keys(DEFAULT_FLAGS)) {
      if (flagOverrides.hasOwnProperty(key)) {
        flagSources[key] = "runtime_override";
        currentFlags[key] = flagOverrides[key];
      } else if (process.env[key] !== undefined) {
        flagSources[key] = "environment";
        currentFlags[key] = DEFAULT_FLAGS[key];
      } else {
        flagSources[key] = "default";
        currentFlags[key] = DEFAULT_FLAGS[key];
      }
    }

    res.json({
      flags: currentFlags,
      sources: flagSources,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      overrideCount: Object.keys(flagOverrides).length,
    });
  } catch (error) {
    console.error("[FEATURE-FLAGS] Error getting status:", error);
    res.status(500).json({
      error: "Failed to get feature flag status",
      message: error.message,
    });
  }
});
export default router;