/**
 * Hotels API - TBO Live Data
 * Returns live TBO hotel results with pricing
 */

const express = require("express");
const db = require("../database/connection.js");
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");
const router = express.Router();

/**
 * Initialize tbo_cities table if not exists
 */
async function ensureCitiesTableExists() {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tbo_cities'
      ) as table_exists;
    `);

    if (!result.rows[0].table_exists) {
      console.log("📦 Creating tbo_cities table...");
      await db.query(`
        CREATE TABLE IF NOT EXISTS tbo_cities (
          id SERIAL PRIMARY KEY,
          city_code VARCHAR(50) NOT NULL UNIQUE,
          city_name VARCHAR(255) NOT NULL,
          country_code VARCHAR(10),
          country_name VARCHAR(255),
          region_code VARCHAR(50),
          region_name VARCHAR(255),
          type VARCHAR(50) DEFAULT 'CITY',
          latitude NUMERIC(10, 8),
          longitude NUMERIC(11, 8),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      console.log("📑 Creating indexes...");
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_tbo_cities_code ON tbo_cities(city_code);
        CREATE INDEX IF NOT EXISTS idx_tbo_cities_name ON tbo_cities(city_name);
        CREATE INDEX IF NOT EXISTS idx_tbo_cities_country ON tbo_cities(country_code);
      `);

      console.log("✅ tbo_cities table created");
    }
  } catch (e) {
    console.warn("⚠️ Failed to ensure tbo_cities table:", e.message);
  }
}

// Initialize table on startup
ensureCitiesTableExists().catch(console.error);

/**
 * GET /api/hotels
 * Returns live TBO hotels for a city
 */
router.get("/", async (req, res) => {
  try {
    const cityId = req.query.cityId || req.query.city || req.query.destination;
    const checkIn = req.query.checkIn || req.query.checkin;
    const checkOut = req.query.checkOut || req.query.checkout;
    const adults = parseInt(req.query.adults || "2");
    const children = parseInt(req.query.children || "0");
    const countryCode = req.query.countryCode || "IN"; // Default to India

    if (!cityId) {
      console.warn("❌ /api/hotels called without cityId");
      return res.status(400).json({
        error: "Missing parameter",
        message: "cityId is required",
      });
    }

    console.log(`\n🏨 === HOTEL SEARCH START ===`);
    console.log(
      `   City: ${cityId} | Country: ${countryCode} | CheckIn: ${checkIn} | CheckOut: ${checkOut}`,
    );
    console.log(`   Guests: ${adults} adults, ${children} children`);

    // Get TBO adapter
    const adapter = supplierAdapterManager.getAdapter("TBO");
    if (!adapter) {
      console.error("❌ TBO adapter not found in supplierAdapterManager");
      return res.status(503).json({
        error: "TBO adapter not available",
        hotels: [],
        source: "error",
      });
    }

    console.log("✅ TBO adapter found");

    // Prepare search parameters
    const finalCheckIn = checkIn || new Date().toISOString().split("T")[0];
    const finalCheckOut =
      checkOut ||
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const searchParams = {
      destination: cityId,
      checkIn: finalCheckIn,
      checkOut: finalCheckOut,
      adults,
      children,
      currency: "INR",
      maxResults: 50,
    };

    console.log(
      `📍 Calling adapter.searchHotels with:`,
      JSON.stringify(searchParams, null, 2),
    );

    // Fetch live TBO hotel results
    let tboResults = [];
    try {
      tboResults = await adapter.searchHotels(searchParams);
      console.log(
        `✅ adapter.searchHotels returned ${tboResults.length} hotels`,
      );

      if (tboResults.length === 0) {
        console.warn(`⚠️ TBO returned 0 hotels for ${cityId}`);
      }
    } catch (searchError) {
      console.error(`❌ adapter.searchHotels FAILED:`, {
        message: searchError.message,
        code: searchError.code,
        status: searchError.response?.status,
        destination: cityId,
        stack: searchError.stack?.split("\n").slice(0, 3).join(" | "),
      });

      if (searchError.response?.data) {
        console.error(
          `   Response data:`,
          JSON.stringify(searchError.response.data).slice(0, 500),
        );
      }

      tboResults = [];
    }

    // Transform TBO results to display format
    const hotels = (tboResults || []).map((h) => {
      // Get min/max prices from rates array
      let minPrice = Infinity;
      let maxPrice = 0;

      if (Array.isArray(h.rates) && h.rates.length > 0) {
        for (const rate of h.rates) {
          const price = rate.price || rate.originalPrice || 0;
          if (price > 0) {
            minPrice = Math.min(minPrice, price);
            maxPrice = Math.max(maxPrice, price);
          }
        }
      }

      // Fallback to single price
      if (minPrice === Infinity) {
        minPrice = h.price || 0;
        maxPrice = h.price || 0;
      }

      return {
        id: h.hotelId,
        name: h.name || "Hotel",
        stars: h.starRating || 0,
        image: h.images?.[0] || null,
        currentPrice: minPrice === Infinity ? h.price || 0 : minPrice,
        originalPrice: maxPrice || h.price || 0,
        currency: h.currency || "INR",
        supplier: "TBO",
        isLiveData: true,
        rates: h.rates || [],
        amenities: h.amenities || [],
      };
    });

    console.log(`📊 Returning ${hotels.length} formatted hotels`);
    console.log(`🏨 === HOTEL SEARCH END ===\n`);

    return res.json({
      success: true,
      hotels,
      totalResults: hotels.length,
      source: "tbo_live",
      pricing_status: "ready",
    });
  } catch (error) {
    console.error("❌ /api/hotels ENDPOINT ERROR:", {
      message: error.message,
      stack: error.stack?.split("\n")[0],
    });

    return res.status(500).json({
      error: "Failed to fetch hotels",
      message: error.message,
      hotels: [],
      source: "error",
    });
  }
});

/**
 * GET /api/hotels/prices
 * Returns live TBO prices (can be called asynchronously)
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
    const adapter = supplierAdapterManager.getAdapter("TBO");
    if (!adapter) {
      return res.status(503).json({
        error: "Pricing service unavailable",
        prices: {},
      });
    }

    // Fetch live prices from TBO
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
      maxResults: 50,
    });

    const prices = {};

    // Extract prices from TBO results
    if (Array.isArray(tboResults)) {
      for (const hotel of tboResults) {
        const hotelId = hotel.hotelId;
        if (!hotelId) continue;

        // Calculate min/max from rates
        let minTotal = Infinity;
        let maxTotal = 0;

        if (Array.isArray(hotel.rates) && hotel.rates.length > 0) {
          for (const rate of hotel.rates) {
            const price = rate.price || rate.originalPrice || 0;
            if (price > 0) {
              minTotal = Math.min(minTotal, price);
              maxTotal = Math.max(maxTotal, price);
            }
          }
        }

        // Fallback to single price
        if (minTotal === Infinity) {
          minTotal = hotel.price || 0;
          maxTotal = hotel.price || 0;
        }

        prices[hotelId] = {
          minTotal: minTotal === Infinity ? hotel.price || 0 : minTotal,
          maxTotal: maxTotal || hotel.price || 0,
          currency: hotel.currency || "INR",
        };
      }
    }

    return res.json({
      success: true,
      cityId,
      prices,
      count: Object.keys(prices).length,
      source: "tbo_live",
    });
  } catch (error) {
    console.error("❌ /api/hotels/prices ENDPOINT ERROR:", error.message);
    return res.status(500).json({
      error: "Failed to fetch prices",
      message: error.message,
      prices: {},
    });
  }
});

module.exports = router;
