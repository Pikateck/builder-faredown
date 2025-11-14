/**
 * TBO Static Data Routes
 *
 * Handles destination search and city lookup
 * Uses GetDestinationSearchStaticData with TokenId
 */

const express = require("express");
const router = express.Router();
const {
  getDestinationSearchStaticData,
  getCityId,
  searchCities,
} = require("../../tbo/static");

/**
 * GET /api/tbo/static/destinations
 * Get all destinations for a country
 *
 * Query params:
 * - countryCode: string (default: "AE")
 *
 * Response:
 * {
 *   success: true,
 *   countryCode: string,
 *   destinations: [{
 *     cityName: string,
 *     destinationId: number,
 *     countryCode: string,
 *     countryName: string,
 *     stateProvince: string,
 *     type: string
 *   }]
 * }
 */
router.get("/destinations", async (req, res) => {
  try {
    const { countryCode = "AE" } = req.query;

    const result = await getDestinationSearchStaticData(countryCode);

    res.json({
      success: true,
      countryCode,
      traceId: result.traceId,
      destinations: result.destinations,
    });
  } catch (error) {
    console.error("TBO Static Data Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tbo/static/city/:cityName
 * Get CityId (DestinationId) for a specific city
 *
 * Path params:
 * - cityName: string
 *
 * Query params:
 * - countryCode: string (default: "AE")
 *
 * Response:
 * {
 *   success: true,
 *   cityName: string,
 *   cityId: number,
 *   countryCode: string
 * }
 */
router.get("/city/:cityName", async (req, res) => {
  try {
    const { cityName } = req.params;
    const { countryCode = "AE" } = req.query;

    const cityId = await getCityId(cityName, countryCode);

    if (!cityId) {
      return res.status(404).json({
        success: false,
        error: "City not found",
        cityName,
        countryCode,
      });
    }

    res.json({
      success: true,
      cityName,
      cityId,
      countryCode,
    });
  } catch (error) {
    console.error("TBO City Lookup Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tbo/static/search
 * Search cities by query string
 *
 * Query params:
 * - q: string (search query)
 * - countryCode: string (optional, searches multiple countries if not provided)
 *
 * Response:
 * {
 *   success: true,
 *   query: string,
 *   results: [{
 *     cityName: string,
 *     destinationId: number,
 *     countryCode: string,
 *     countryName: string
 *   }]
 * }
 */
router.get("/search", async (req, res) => {
  try {
    const { q, countryCode } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Query must be at least 2 characters",
      });
    }

    const results = await searchCities(q, countryCode);

    res.json({
      success: true,
      query: q,
      countryCode: countryCode || "multiple",
      results,
    });
  } catch (error) {
    console.error("TBO City Search Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
