/**
 * TBO Authentication Route
 *
 * Handles TokenId generation and management
 * Endpoint: POST /api/tbo/auth/token
 */

const express = require("express");
const router = express.Router();
const { authenticateTBO } = require("../../tbo/auth");

/**
 * POST /api/tbo/auth/token
 * Generate or refresh TBO TokenId
 *
 * Response:
 * {
 *   success: true,
 *   tokenId: string,
 *   expiresAt: string (ISO date),
 *   memberId: string,
 *   agencyId: string
 * }
 */
router.post("/token", async (req, res) => {
  try {
    const result = await authenticateTBO();

    if (!result || !result.TokenId) {
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        details: result,
      });
    }

    res.json({
      success: true,
      tokenId: result.TokenId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      memberId: result.Member?.MemberId,
      agencyId: result.Member?.AgencyId,
    });
  } catch (error) {
    console.error("TBO Auth Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/tbo/auth/status
 * Check authentication status (for debugging)
 */
router.get("/status", async (req, res) => {
  try {
    const result = await authenticateTBO();

    res.json({
      success: !!result.TokenId,
      authenticated: !!result.TokenId,
      tokenLength: result.TokenId?.length || 0,
      memberId: result.Member?.MemberId,
      agencyId: result.Member?.AgencyId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      authenticated: false,
      error: error.message,
    });
  }
});

module.exports = router;
