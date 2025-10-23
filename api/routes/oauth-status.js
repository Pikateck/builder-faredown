import express from "express";
/**
 * OAuth Status Routes
 * Provides information about OAuth service availability
 */

const router = express.Router();

// OAuth environment validation
const isGoogleConfigured = !!(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
const isFacebookConfigured = !!(
  process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
);
const isAppleConfigured = !!(
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_SERVICE_ID
);

/**
 * @api {get} /api/oauth/status Get OAuth Configuration Status
 * @apiName GetOAuthStatus
 * @apiGroup OAuth
 * @apiVersion 1.0.0
 *
 * @apiSuccess {Boolean} google Google OAuth availability
 * @apiSuccess {Boolean} facebook Facebook OAuth availability
 * @apiSuccess {Boolean} apple Apple OAuth availability
 */
router.get("/status", (req, res) => {
  res.json({
    success: true,
    oauth: {
      google: isGoogleConfigured,
      facebook: isFacebookConfigured,
      apple: isAppleConfigured,
    },
    message: "OAuth configuration status retrieved successfully",
  });
});
export default router;