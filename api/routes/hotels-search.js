const express = require("express");
const router = express.Router();

router.post(["", "/"], (req, res) => {
  try {
    const { cityId, destination, cityName, checkIn, checkOut } = req.body;
    const cityIdentifier = cityId || destination || cityName;

    if (!cityIdentifier || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Return empty search (mock fallback)
    return res.json({
      success: true,
      source: "mock",
      hotels: [],
      totalResults: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
