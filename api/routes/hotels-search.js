const express = require("express");
const router = express.Router();

/**
 * POST /api/hotels/search
 * Hotel search with cache and TBO integration
 */
router.post(["", "/"], async (req, res) => {
  const requestStart = Date.now();
  const traceId = require("uuid").v4();

  try {
    // Validate required fields
    const { cityId, destination, cityName, checkIn, checkOut } = req.body;
    const cityIdentifier = cityId || destination || cityName;

    if (!cityIdentifier || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        traceId,
      });
    }

    // Try to load and use cache service
    let hotels = [];
    let source = "test";

    try {
      const hotelCacheService = require("../services/hotelCacheService");
      const searchParams = {
        ...req.body,
        traceId,
      };

      // Try cache first
      const searchHash = hotelCacheService.generateSearchHash(searchParams);
      const cachedSearch = await hotelCacheService.getCachedSearch(searchHash);

      if (cachedSearch && cachedSearch.is_fresh) {
        const cachedHotels =
          await hotelCacheService.getCachedHotels(searchHash);
        hotels = cachedHotels.map((h) => ({
          hotelId: h.tbo_hotel_code,
          name: h.name,
          city: h.city_name,
          price: {
            offered: parseFloat(h.price_offered_per_night) || 0,
            published: parseFloat(h.price_published_per_night) || 0,
          },
        }));
        source = "cache";
      }
    } catch (cacheErr) {
      console.warn(
        `Cache service unavailable [${traceId}]: ${cacheErr.message}`,
      );
    }

    // Try TBO adapter if no cache hit
    if (hotels.length === 0) {
      try {
        const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");
        const adapter = supplierAdapterManager.getAdapter("TBO");

        if (adapter) {
          const tboParams = {
            destination: destination || "Dubai",
            checkIn,
            checkOut,
            countryCode: req.body.countryCode || "AE",
            guestNationality: req.body.guestNationality || "IN",
            rooms: req.body.rooms || "1",
            adults: req.body.adults || "2",
            children: req.body.children || "0",
            currency: req.body.currency || "INR",
            childAges: req.body.childAges || [],
          };

          const tboResponse = await adapter.searchHotels(tboParams);
          const tboHotels = tboResponse.hotels || [];

          hotels = tboHotels.map((h) => ({
            hotelId: String(h.hotelId || h.HotelCode || h.HotelId),
            name: h.name || h.HotelName || "Hotel",
            city: destination || "Dubai",
            price: {
              offered: h.price || h.OfferedPrice || 0,
              published: h.originalPrice || h.PublishedPrice || 0,
              currency: h.currency || req.body.currency || "INR",
            },
          }));

          source = "tbo";
        }
      } catch (tboErr) {
        console.warn(`TBO service unavailable [${traceId}]: ${tboErr.message}`);
      }
    }

    // Try mock fallback if still no hotels
    if (hotels.length === 0) {
      try {
        const { MOCK_HOTELS } = require("../routes/hotels-metadata");
        const cityId = destination || "DXB";
        const mockHotels = MOCK_HOTELS[cityId] || [];

        if (mockHotels.length > 0) {
          hotels = mockHotels;
          source = "mock";
        }
      } catch (mockErr) {
        console.warn(`Mock hotels unavailable [${traceId}]: ${mockErr.message}`);
      }
    }

    const duration = Date.now() - requestStart;

    return res.json({
      success: true,
      source,
      hotels,
      totalResults: hotels.length,
      duration: `${duration}ms`,
      traceId,
    });
  } catch (error) {
    console.error(`Hotel search error [${traceId}]:`, error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
      hotels: [],
      source: "error",
      duration: `${Date.now() - requestStart}ms`,
      traceId,
    });
  }
});

module.exports = router;
