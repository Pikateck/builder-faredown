/**
 * Faredown Pricing API Routes
 * Handles all pricing calculation endpoints
 */

import express from "express";
import PricingEngine from "../services/pricing/PricingEngine.js";

const router = express.Router();

/**
 * POST /api/pricing/quote
 * Get a pricing quote for a booking
 */
router.post("/quote", async (req, res) => {
  try {
    const { searchId, product, passengers, markup } = req.body;

    if (!searchId || !product) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: searchId, product",
      });
    }

    // Initialize pricing engine
    const engine = new PricingEngine();

    // Calculate quote
    const quote = engine.calculateQuote({
      searchId,
      product,
      passengers: passengers || 1,
      markup: markup || {},
    });

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error("🔴 Quote error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/pricing/test-quote
 * Test quote endpoint (for development)
 */
router.post("/test-quote", (req, res) => {
  try {
    const engine = new PricingEngine();

    const testQuote = {
      baseFare: 5000,
      taxes: 500,
      discount: 0,
      markup: 1000,
      totalFare: 6500,
      currency: "INR",
    };

    res.json({
      success: true,
      data: testQuote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/pricing/markup-rules
 * Get all markup rules
 */
router.get("/markup-rules", async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/pricing/promo-codes
 * Get available promo codes
 */
router.get("/promo-codes", async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Factory function to create pricing routes
 */
function createPricingRoutes() {
  return router;
}

export default createPricingRoutes;
