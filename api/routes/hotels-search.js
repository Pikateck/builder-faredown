const express = require("express");
const router = express.Router();

router.post(["", "/"], async (req, res) => {
  const traceId = require("uuid").v4();
  console.log(`[${traceId}] Hotels search called`);
  
  try {
    // Validate required fields
    const { cityId, destination, cityName, checkIn, checkOut } = req.body;
    const cityIdentifier = cityId || destination || cityName;

    if (!cityIdentifier || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields`,
        traceId,
      });
    }

    console.log(`[${traceId}] Validation passed`);

    // Try to load cache service
    let hotelCacheService;
    try {
      hotelCacheService = require("../services/hotelCacheService");
      console.log(`[${traceId}] hotelCacheService loaded`);
    } catch (err) {
      console.error(`[${traceId}] Error loading hotelCacheService:`, err.message);
      throw err;
    }

    // Try to load adapter manager
    let supplierAdapterManager;
    try {
      supplierAdapterManager = require("../services/adapters/supplierAdapterManager");
      console.log(`[${traceId}] supplierAdapterManager loaded`);
    } catch (err) {
      console.error(`[${traceId}] Error loading supplierAdapterManager:`, err.message);
      throw err;
    }

    // Try to load database
    let db;
    try {
      db = require("../database/connection");
      console.log(`[${traceId}] database loaded`);
    } catch (err) {
      console.error(`[${traceId}] Error loading database:`, err.message);
      throw err;
    }

    console.log(`[${traceId}] All modules loaded successfully`);

    // Return success response
    return res.json({
      success: true,
      source: "test",
      hotels: [],
      totalResults: 0,
      traceId,
    });
  } catch (error) {
    console.error(`[hotels-search] Route error:`, {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      hotels: [],
      source: "error",
      traceId: "unknown",
    });
  }
});

module.exports = router;
