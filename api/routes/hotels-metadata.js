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
 * Mock hotel data for fallback (when TBO API unavailable)
 */
const MOCK_HOTELS = {
  DXB: [
    {
      hotelId: "mock_taj_beachfront",
      name: "Taj Beachfront Dubai",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
      ],
      amenities: [
        "WiFi",
        "Pool",
        "Spa",
        "Restaurant",
        "Bar",
        "Gym",
        "Concierge",
      ],
      price: 450,
      currency: "INR",
      rates: [
        { price: 450, description: "Deluxe Room" },
        { price: 550, description: "Suite" },
      ],
    },
    {
      hotelId: "mock_burj_luxury",
      name: "Burj Luxury Hotel",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1570129477492-45ec003e2e7f?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Pool", "Spa", "Fine Dining", "Lounge", "Gym"],
      price: 520,
      currency: "INR",
      rates: [
        { price: 520, description: "Deluxe Room" },
        { price: 650, description: "Presidential Suite" },
      ],
    },
    {
      hotelId: "mock_marina_resort",
      name: "Marina Bay Resort",
      starRating: 4,
      images: [
        "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1618038706269-c1f59e72ccc2?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Pool", "Restaurant", "Beach Access", "Gym"],
      price: 320,
      currency: "INR",
      rates: [
        { price: 320, description: "Standard Room" },
        { price: 420, description: "Deluxe Room" },
      ],
    },
    {
      hotelId: "mock_downtown_plaza",
      name: "Downtown Plaza Hotel",
      starRating: 4,
      images: [
        "https://images.unsplash.com/photo-1595576508898-eae0dff5d285?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1619641740950-c8dbe4c13081?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Restaurant", "Bar", "Business Center", "Gym"],
      price: 280,
      currency: "INR",
      rates: [
        { price: 280, description: "Standard Room" },
        { price: 380, description: "Deluxe Room" },
      ],
    },
    {
      hotelId: "mock_palm_jumeirah",
      name: "Palm Jumeirah Oasis",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1568084308940-d50b8e6655ec?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1559233056-16ba83b85fda?w=600&h=400&fit=crop",
      ],
      amenities: [
        "WiFi",
        "Private Beach",
        "Pool",
        "Spa",
        "Michelin Restaurant",
        "Concierge",
      ],
      price: 680,
      currency: "INR",
      rates: [
        { price: 680, description: "Beachfront Suite" },
        { price: 850, description: "Penthouse" },
      ],
    },
    {
      hotelId: "mock_deira_heritage",
      name: "Deira Heritage Hotel",
      starRating: 3,
      images: [
        "https://images.unsplash.com/photo-1578899413026-4b5800b87fcb?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Restaurant", "Bar", "Gym"],
      price: 180,
      currency: "INR",
      rates: [{ price: 180, description: "Standard Room" }],
    },
  ],
  BOM: [
    {
      hotelId: "mock_taj_mumbai",
      name: "Taj Palace Mumbai",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Pool", "Spa", "Fine Dining", "Concierge"],
      price: 350,
      currency: "INR",
      rates: [{ price: 350, description: "Deluxe Room" }],
    },
    {
      hotelId: "mock_oberoi_mumbai",
      name: "Oberoi Mumbai",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Pool", "Spa", "Restaurant"],
      price: 380,
      currency: "INR",
      rates: [{ price: 380, description: "Suite" }],
    },
  ],
  DEL: [
    {
      hotelId: "mock_itc_delhi",
      name: "ITC Delhi Grand",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1570129477492-45ec003e2e7f?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Pool", "Spa", "Restaurant"],
      price: 320,
      currency: "INR",
      rates: [{ price: 320, description: "Deluxe Room" }],
    },
    {
      hotelId: "mock_hilton_delhi",
      name: "Hilton New Delhi",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Pool", "Restaurant", "Gym"],
      price: 300,
      currency: "INR",
      rates: [{ price: 300, description: "Standard Room" }],
    },
  ],
  SIN: [
    {
      hotelId: "mock_marina_bay",
      name: "Marina Bay Sands",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Pool", "Spa", "Fine Dining"],
      price: 400,
      currency: "INR",
      rates: [{ price: 400, description: "Deluxe Room" }],
    },
  ],
  PAR: [
    {
      hotelId: "mock_ritz_paris",
      name: "Hotel Ritz Paris",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1570129477492-45ec003e2e7f?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Spa", "Fine Dining", "Concierge"],
      price: 850,
      currency: "INR",
      rates: [{ price: 850, description: "Deluxe Suite" }],
    },
    {
      hotelId: "mock_louvre_paris",
      name: "Le Louvre Paris",
      starRating: 4,
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Restaurant", "Bar"],
      price: 450,
      currency: "INR",
      rates: [{ price: 450, description: "Standard Room" }],
    },
  ],
  LDN: [
    {
      hotelId: "mock_savoy_london",
      name: "The Savoy London",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Spa", "River View", "Fine Dining"],
      price: 800,
      currency: "INR",
      rates: [{ price: 800, description: "Deluxe Suite" }],
    },
  ],
  NYC: [
    {
      hotelId: "mock_plaza_nyc",
      name: "The Plaza New York",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1570129477492-45ec003e2e7f?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Spa", "Rooftop Bar", "Fine Dining"],
      price: 750,
      currency: "INR",
      rates: [{ price: 750, description: "Deluxe Room" }],
    },
  ],
  AUH: [
    {
      hotelId: "mock_emirates_palace",
      name: "Emirates Palace Abu Dhabi",
      starRating: 5,
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",
      ],
      amenities: ["WiFi", "Private Beach", "Spa", "Fine Dining"],
      price: 550,
      currency: "INR",
      rates: [{ price: 550, description: "Beachfront Suite" }],
    },
  ],
};

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
      countryCode, // Include country code for city lookup
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

    // Use fallback mock data if TBO returns 0 results
    let finalHotels = hotels;
    let source = "tbo_live";
    if (hotels.length === 0 && MOCK_HOTELS[cityId]) {
      console.log(
        `📦 TBO returned 0 results, using fallback mock data for ${cityId}`,
      );
      finalHotels = MOCK_HOTELS[cityId].map((h) => {
        let minPrice = Infinity;
        let maxPrice = 0;

        if (Array.isArray(h.rates) && h.rates.length > 0) {
          for (const rate of h.rates) {
            const price = rate.price || 0;
            if (price > 0) {
              minPrice = Math.min(minPrice, price);
              maxPrice = Math.max(maxPrice, price);
            }
          }
        }

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
          supplier: "MOCK",
          isLiveData: false,
          rates: h.rates || [],
          amenities: h.amenities || [],
        };
      });
      source = "fallback_mock";
      console.log(`✅ Loaded ${finalHotels.length} fallback mock hotels`);
    }

    console.log(
      `📊 Returning ${finalHotels.length} formatted hotels (source: ${source})`,
    );
    console.log(`🏨 === HOTEL SEARCH END ===\n`);

    return res.json({
      success: true,
      hotels: finalHotels,
      totalResults: finalHotels.length,
      source: source,
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
