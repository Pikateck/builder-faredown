/**
 * TBO Agency Balance Route
 *
 * Handles agency balance inquiry
 * Endpoint: GET /api/tbo/balance/agency-balance
 */

const express = require("express");
const router = express.Router();
const { getAgencyBalance } = require("../../tbo/balance");

/**
 * GET /api/tbo/balance/agency-balance
 * Get current agency balance from TBO
 *
 * Response:
 * {
 *   status: 1,
 *   balance: number,
 *   currency: string,
 *   supplier: "TBO",
 *   timestamp: string (ISO date),
 *   raw: object
 * }
 */
router.get("/agency-balance", async (req, res) => {
  try {
    const result = await getAgencyBalance();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("TBO GetAgencyBalance Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/tbo/balance/check
 * Simplified balance check endpoint (alias)
 *
 * Response:
 * {
 *   success: true,
 *   balance: number,
 *   currency: string,
 *   status: number
 * }
 */
router.get("/check", async (req, res) => {
  try {
    const result = await getAgencyBalance();

    res.json({
      success: true,
      balance: result.balance,
      currency: result.currency,
      status: result.status,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("TBO Balance Check Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
