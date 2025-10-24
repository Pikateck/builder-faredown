/**
 * Hotels Metadata API
 * Metadata-first response with parallel TBO pricing
 * Returns hotel data instantly from DB, fetches live prices asynchronously
 */

const express = require("express");
const db = require("../database/connection.js");
const redis = require("../lib/redisClient.js");
const router = express.Router();

const REDIS_TTL = 1800; // 30 minutes

/**
 * GET /api/hotels?cityId=X[&hotelId=Y]
 * Returns hotel metadata instantly from DB
 * Optionally fetches live prices in background
 */
router.get("/", async (req, res) => {
  try {
    const cityId = req.query.cityId || req.query.city || req.query.destination;
    const hotelId = req.query.hotelId || req.query.hotel;
    const checkIn = req.query.checkIn || req.query.checkin;
    const checkOut = req.query.checkOut || req.query.checkout;
    const adults = parseInt(req.query.adults || "2");
    const children = parseInt(req.query.children || "0");

    if (!cityId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "cityId is required",
      });
    }

    // Check Redis cache first (simplified - don't use date-specific cache key)
    const cacheKey = `city:${cityId}:hotels`;
    const cached = await redis.getJSON(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        cached: true,
        source: "redis",
        pricing_status: "ready",
      });
    }

    // Fetch REAL hotels from TBO API
    let hotels = [];
    let source = "tbo";

    try {
      const adapterModule = require("../services/adapters/tboAdapter.js");
      const adapter = adapterModule.getTboAdapter?.() || adapterModule;

      // Call TBO searchHotels to get actual hotel data
      const tboResults = await adapter.searchHotels({
        destination: cityId,
        checkIn: checkIn || new Date().toISOString().split("T")[0],
        checkOut:
          checkOut ||
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        adults,
        children,
        currency: "INR",
      });

      // Map TBO results to our hotel format
      if (Array.isArray(tboResults) && tboResults.length > 0) {
        hotels = tboResults.slice(0, 50).map((h) => {
          // Get min/max prices from rates array
          let minTotal = Infinity;
          let maxTotal = 0;

          if (Array.isArray(h.rates) && h.rates.length > 0) {
            for (const rate of h.rates) {
              const price = rate.price || rate.originalPrice || 0;
              if (price > 0) {
                minTotal = Math.min(minTotal, price);
                maxTotal = Math.max(maxTotal, price);
              }
            }
          }

          // Fallback to single price if no rates
          if (minTotal === Infinity) {
            minTotal = h.price || 0;
            maxTotal = h.price || 0;
          }

          return {
            id: h.hotelId || h.id,
            supplier_id: h.hotelId || h.id,
            name: h.name || "",
            address: h.address || "",
            lat: h.latitude || 0,
            lng: h.longitude || 0,
            stars: h.starRating || 0,
            image: h.images && h.images[0] ? h.images[0] : null,
            minTotal: minTotal === Infinity ? h.price || 0 : minTotal,
            maxTotal: maxTotal || h.price || 0,
            currency: h.currency || "INR",
          };
        });
      }
    } catch (e) {
      console.warn("TBO search failed, falling back to DB:", e.message);
      // Fallback to DB if TBO fails
      const hotelsRes = await db.query(
        `SELECT id, supplier_id, name, address, lat, lng, stars
         FROM tbo_hotels
         WHERE city_code = $1
         ORDER BY popularity DESC, name ASC
         LIMIT 50`,
        [cityId],
      );

      hotels = (hotelsRes.rows || []).map((h) => ({
        id: h.id || h.supplier_id,
        supplier_id: h.supplier_id,
        name: h.name,
        address: h.address || "",
        lat: h.lat,
        lng: h.lng,
        stars: h.stars,
      }));
      source = "database_fallback";
    }

    if (hotels.length === 0) {
      return res.json({
        hotels: [],
        cached: false,
        source: "empty",
        pricing_status: "empty",
        message: `No hotels found for city ${cityId}`,
      });
    }

    // Cache metadata
    const responseData = {
      hotels,
      count: hotels.length,
      cityId,
    };

    await redis.setJSON(cacheKey, responseData, REDIS_TTL);

    // Return instantly with metadata
    res.json({
      ...responseData,
      cached: false,
      source: source,
      pricing_status: "loading",
      message: "Fetching live prices in parallel...",
    });

    // Kick off async price fetch (fire-and-forget) with actual dates
    queuePriceFetch(cityId, hotels, checkIn, checkOut, adults, children).catch(
      (e) => {
        console.warn("Price fetch queue failed:", e.message);
      },
    );
  } catch (error) {
    console.error("Hotels metadata error:", error.message);
    res.status(500).json({
      error: "Failed to fetch hotels",
      message: error.message,
    });
  }
});

/**
 * GET /api/hotels/prices?cityId=X
 * Returns live TBO prices for a city (async endpoint)
 */
router.get("/prices", async (req, res) => {
  try {
    const cityId = req.query.cityId || req.query.city;
    const checkIn = req.query.checkIn || req.query.checkin;
    const checkOut = req.query.checkOut || req.query.checkout;
    const adults = parseInt(req.query.adults || "2");
    const children = parseInt(req.query.children || "0");

    if (!cityId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "cityId is required",
      });
    }

    // Get TBO adapter
    let adapter;
    try {
      const adapterModule = require("../services/adapters/tboAdapter.js");
      adapter = adapterModule.getTboAdapter?.() || adapterModule;
    } catch (e) {
      console.error("TBO adapter not available:", e.message);
      return res.status(503).json({
        error: "Pricing service unavailable",
        prices: {},
      });
    }

    // Fetch live prices from TBO
    const searchParams = {
      destination: cityId,
      checkIn: checkIn || new Date().toISOString().split("T")[0],
      checkOut:
        checkOut ||
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      adults,
      children,
      currency: req.query.currency || "INR",
    };

    const tboResults = await adapter.searchHotels(searchParams);
    const prices = {};

    // Map TBO results to hotel ID -> price
    if (Array.isArray(tboResults)) {
      for (const hotel of tboResults) {
        const hotelId = hotel.supplierHotelId || hotel.code;
        if (hotelId) {
          prices[hotelId] = {
            minTotal: hotel.minTotal || 0,
            maxTotal: hotel.maxTotal || 0,
            currency: hotel.currency || "INR",
            rateKey: hotel.rateKey || hotel.token,
          };
        }
      }
    }

    // Cache prices
    const pricesCacheKey = `city:${cityId}:prices`;
    await redis.setJSON(pricesCacheKey, prices, 300); // 5 min cache for prices

    res.json({
      cityId,
      prices,
      currency: searchParams.currency,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      cached: false,
      count: Object.keys(prices).length,
    });
  } catch (error) {
    console.error("Hotels prices error:", error.message);
    res.status(500).json({
      error: "Failed to fetch prices",
      message: error.message,
      prices: {},
    });
  }
});

/**
 * Queue price fetch in background (fire-and-forget)
 */
async function queuePriceFetch(
  cityId,
  hotels,
  checkIn,
  checkOut,
  adults = 2,
  children = 0,
) {
  try {
    if (!Array.isArray(hotels) || hotels.length === 0) {
      return;
    }

    console.log(
      `💰 Queuing price fetch for city ${cityId} (${hotels.length} hotels)`,
    );

    // Get TBO adapter
    let adapter;
    try {
      const adapterModule = require("../services/adapters/tboAdapter.js");
      adapter = adapterModule.getTboAdapter?.() || adapterModule;
    } catch (e) {
      console.warn("TBO adapter not available for price fetch");
      return;
    }

    // Fetch live prices with actual dates
    const searchParams = {
      destination: cityId,
      checkIn: checkIn || new Date().toISOString().split("T")[0],
      checkOut:
        checkOut ||
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      adults: adults || 2,
      children: children || 0,
      currency: "INR",
    };

    const tboResults = await adapter.searchHotels(searchParams);
    const prices = {};

    if (Array.isArray(tboResults)) {
      for (const hotel of tboResults) {
        const hotelId = hotel.supplierHotelId || hotel.code;
        if (hotelId) {
          prices[hotelId] = {
            minTotal: hotel.minTotal || 0,
            maxTotal: hotel.maxTotal || 0,
            currency: hotel.currency || "INR",
          };
        }
      }

      // Cache prices
      const pricesCacheKey = `city:${cityId}:prices`;
      await redis.setJSON(pricesCacheKey, prices, 300); // 5 min cache

      console.log(
        `✅ Price fetch completed for city ${cityId} (${Object.keys(prices).length} prices)`,
      );
    }
  } catch (error) {
    console.warn("Background price fetch failed:", error.message);
  }
}

module.exports = router;
