/**
 * Hotels Search API - Cache-Backed with TBO Integration
 *
 * Flow:
 * 1. Check cache for matching search hash
 * 2. If cache hit & fresh → return from DB
 * 3. If cache miss → call TBO, normalize, store, return
 * 4. Fallback to mock hotels on error
 */

const express = require("express");
const router = express.Router();

let hotelCacheService, supplierAdapterManager, resolveGuestNationality, db;

// Load dependencies with error handling
try {
  hotelCacheService = require("../services/hotelCacheService");
} catch (err) {
  console.error("Failed to load hotelCacheService:", err.message);
}

try {
  supplierAdapterManager = require("../services/adapters/supplierAdapterManager");
} catch (err) {
  console.error("Failed to load supplierAdapterManager:", err.message);
}

try {
  const nationalityResolver = require("../utils/nationalityResolver");
  resolveGuestNationality = nationalityResolver.resolveGuestNationality;
} catch (err) {
  console.error("Failed to load resolveGuestNationality:", err.message);
}

try {
  db = require("../database/connection");
} catch (err) {
  console.error("Failed to load database connection:", err.message);
}

/**
 * POST /api/hotels/search
 * Cache-first hotel search
 */
router.post(["", "/"], async (req, res) => {
  const requestStart = Date.now();
  const traceId = require("uuid").v4();

  try {
    console.log(`�� POST /api/hotels/search [${traceId}]`, {
      bodyKeys: Object.keys(req.body || {}),
    });

    // Validate required fields
    const { cityId, destination, cityName, checkIn, checkOut } = req.body;
    const cityIdentifier = cityId || destination || cityName;

    if (!cityIdentifier || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields. Need: (cityId OR destination OR cityName) AND checkIn AND checkOut`,
        traceId,
      });
    }

    // ============================================================
    // Step 1: Resolve guest nationality
    // ============================================================
    const guestNationality = await resolveGuestNationality(req, req.user);

    // ============================================================
    // Step 1.5: Normalize rooms parameter
    // ============================================================
    let roomArray;
    const { rooms, adults, children } = req.body;

    if (Array.isArray(rooms) && rooms.length > 0) {
      roomArray = rooms;
    } else {
      const roomCount = Number(rooms || 1);
      const totalAdults = Number(adults || 1);
      const totalChildren = Number(children || 0);

      const adultsPerRoom = Math.floor(totalAdults / roomCount);
      const childrenPerRoom = Math.floor(totalChildren / roomCount);

      roomArray = Array.from({ length: roomCount }, (_, i) => ({
        adults: adultsPerRoom + (i === 0 ? totalAdults % roomCount : 0),
        children: childrenPerRoom + (i === 0 ? totalChildren % roomCount : 0),
        childAges: [],
      }));
    }

    // Merge into request
    const searchParams = {
      ...req.body,
      rooms: roomArray,
      guestNationality: req.body.guestNationality || guestNationality,
      traceId,
    };

    // ============================================================
    // Step 2: Generate search hash
    // ============================================================
    const searchHash = hotelCacheService.generateSearchHash(searchParams);
    console.log(
      `🔍 Hotel search [${traceId}] - Hash: ${searchHash.substring(0, 16)}...`,
    );

    // ============================================================
    // Step 3: Check cache for fresh results
    // ============================================================
    const cachedSearch = await hotelCacheService.getCachedSearch(searchHash);

    if (cachedSearch && cachedSearch.is_fresh) {
      console.log(
        `✅ CACHE HIT [${traceId}] - ${cachedSearch.hotel_count} hotels cached`,
      );

      const cachedHotels = await hotelCacheService.getCachedHotels(searchHash);

      const hotels = cachedHotels.map((hotel) => ({
        hotelId: hotel.tbo_hotel_code,
        name: hotel.name,
        city: hotel.city_name,
        countryCode: hotel.country_code,
        starRating: parseFloat(hotel.star_rating) || 3,
        address: hotel.address,
        location: hotel.address || "",
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        amenities: hotel.amenities ? JSON.parse(hotel.amenities) : [],
        facilities: hotel.facilities ? JSON.parse(hotel.facilities) : [],
        images: hotel.images ? JSON.parse(hotel.images) : [],
        mainImage: hotel.main_image_url,
        phone: hotel.phone,
        email: hotel.email,
        website: hotel.website,
        price: {
          offered: parseFloat(hotel.price_offered_per_night) || 0,
          published: parseFloat(hotel.price_published_per_night) || 0,
        },
        source: "cache",
      }));

      const duration = Date.now() - requestStart;
      return res.json({
        success: true,
        source: "cache_tbo",
        hotels,
        totalResults: hotels.length,
        cacheHit: true,
        duration: `${duration}ms`,
        traceId,
      });
    }

    console.log(`⚠️ CACHE MISS [${traceId}] - Calling TBO API`);

    // ============================================================
    // Step 4: Cache miss - call TBO OR return mock hotels
    // ============================================================
    console.log(
      `⏳ Attempting to call TBO adapter for [${traceId}]... (will fallback to mock if fails)`,
    );

    let tboResponse = { hotels: [], sessionMetadata: {} };
    let usedMockFallback = false;

    try {
      if (!supplierAdapterManager) {
        throw new Error("Adapter manager not loaded - using mock fallback");
      }

      const adapter = supplierAdapterManager.getAdapter("TBO");
      if (!adapter) {
        throw new Error("TBO adapter not initialized - using mock fallback");
      }

      const tboSearchParams = {
        destination: searchParams.destination || searchParams.cityName || "Dubai",
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        countryCode: searchParams.countryCode || "AE",
        guestNationality: searchParams.guestNationality || "IN",
        rooms: searchParams.rooms || "1",
        adults: searchParams.adults || "2",
        children: searchParams.children || "0",
        currency: searchParams.currency || "INR",
        childAges: searchParams.childAges || [],
      };

      const searchPromise = adapter.searchHotels(tboSearchParams);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("TBO search timeout after 90 seconds")),
          90000,
        );
      });

      tboResponse = await Promise.race([searchPromise, timeoutPromise]);
      console.log(`✅ TBO call succeeded for [${traceId}]`);
    } catch (adapterError) {
      console.warn(
        `⚠️ TBO adapter error [${traceId}]: ${adapterError.message}, using mock fallback`,
      );

      // FALLBACK: Return mock hotels
      usedMockFallback = true;
      const cityId = searchParams.destination || "DXB";

      try {
        const mockHotels =
          require("../routes/hotels-metadata").MOCK_HOTELS[cityId] || [];

        if (mockHotels.length > 0) {
          console.log(
            `✅ Returning ${mockHotels.length} mock hotels for ${cityId} [${traceId}]`,
          );
          return res.json({
            success: true,
            source: "mock_fallback",
            hotels: mockHotels,
            totalResults: mockHotels.length,
            duration: `${Date.now() - requestStart}ms`,
            traceId,
          });
        }
      } catch (mockErr) {
        console.error(`❌ Error loading mock hotels [${traceId}]:`, mockErr.message);
      }

      // If no mock hotels, return error
      return res.status(500).json({
        success: false,
        error: `TBO API failed and no mock hotels available: ${adapterError.message}`,
        hotels: [],
        source: "error",
        duration: `${Date.now() - requestStart}ms`,
        traceId,
      });
    }

    // Extract hotels from response
    let tboHotels, sessionMetadata;

    if (Array.isArray(tboResponse)) {
      tboHotels = tboResponse;
      sessionMetadata = {};
    } else if (tboResponse.results && typeof tboResponse.results === "object") {
      tboHotels = tboResponse.results.hotels || [];
      sessionMetadata = tboResponse.results.sessionMetadata || {};
    } else {
      tboHotels = Array.isArray(tboResponse.hotels)
        ? tboResponse.hotels
        : [];
      sessionMetadata = tboResponse.sessionMetadata || {};
    }

    if (!Array.isArray(tboHotels)) {
      tboHotels = [];
    }

    console.log(`✅ TBO returned ${tboHotels.length} hotels [${traceId}]`);

    if (tboHotels.length === 0) {
      return res.json({
        success: true,
        source: "tbo_empty",
        hotels: [],
        totalResults: 0,
        duration: `${Date.now() - requestStart}ms`,
        traceId,
      });
    }

    // ============================================================
    // Step 5: Normalize and cache
    // ============================================================
    const hotelIds = [];

    for (const tboHotel of tboHotels) {
      try {
        const hotelCode = String(
          tboHotel.hotelId || tboHotel.HotelCode || tboHotel.HotelId,
        );

        await hotelCacheService.storeNormalizedHotel({
          tboHotelCode: hotelCode,
          cityId: sessionMetadata.destinationId,
          cityName: searchParams.destination || searchParams.City,
          countryCode: searchParams.countryCode || "AE",
          name: tboHotel.name || tboHotel.HotelName || "Hotel",
          description: tboHotel.description,
          address: tboHotel.location || tboHotel.HotelAddress,
          latitude: tboHotel.latitude,
          longitude: tboHotel.longitude,
          starRating: parseFloat(tboHotel.starRating) || 3,
          amenities: tboHotel.amenities || [],
          facilities: tboHotel.facilities || [],
          images: tboHotel.images || [],
          mainImageUrl: tboHotel.mainImage,
          tboResponseBlob: tboHotel,
        });

        hotelIds.push(hotelCode);
      } catch (error) {
        console.error(
          `❌ Error normalizing hotel ${tboHotel.hotelId}:`,
          error.message,
        );
      }
    }

    // Cache the search
    const cacheParams = {
      ...searchParams,
      rooms: Array.isArray(searchParams.rooms)
        ? searchParams.rooms.length
        : searchParams.rooms || 1,
    };

    await hotelCacheService.cacheSearchResults(
      searchHash,
      cacheParams,
      hotelIds,
      "tbo",
      sessionMetadata,
    );

    // ============================================================
    // Step 6: Return results
    // ============================================================
    const responseHotels = tboHotels.map((h) => ({
      hotelId: String(h.hotelId || h.HotelCode || h.HotelId),
      name: h.name || h.HotelName || "Hotel",
      city: searchParams.destination || searchParams.City,
      countryCode: searchParams.countryCode || "AE",
      starRating: parseFloat(h.starRating) || 3,
      address: h.location || h.HotelAddress || "",
      location: h.location || h.HotelAddress || "",
      latitude: h.latitude,
      longitude: h.longitude,
      amenities: h.amenities || [],
      facilities: h.facilities || [],
      images: h.images || [],
      mainImage: h.mainImage,
      phone: h.phone,
      email: h.email,
      website: h.website,
      price: {
        offered: h.price || h.OfferedPrice || 0,
        published: h.originalPrice || h.PublishedPrice || 0,
        currency: h.currency || searchParams.currency || "INR",
      },
      source: "tbo",
    }));

    const duration = Date.now() - requestStart;
    console.log(`✅ Search completed in ${duration}ms [${traceId}]`);

    res.json({
      success: true,
      source: "tbo_live",
      hotels: responseHotels,
      totalResults: responseHotels.length,
      cacheHit: false,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      traceId,
    });
  } catch (error) {
    console.error(`❌ Hotel search error [${traceId}]:`, {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message,
      hotels: [],
      source: "error",
      duration: `${Date.now() - requestStart}ms`,
      traceId,
    });
  }
});

/**
 * POST /api/hotels/rooms/:hotelId
 * Fetch room details for a hotel
 */
router.post("/rooms/:hotelId", async (req, res) => {
  const traceId = require("uuid").v4();

  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut, roomConfig, currency = "INR" } = req.body;

    console.log(`🏨 Fetching room details for hotel ${hotelId} [${traceId}]`);

    // Get cached hotel details
    const cachedHotelResult = await db.query(
      `SELECT * FROM public.tbo_hotels_normalized WHERE tbo_hotel_code = $1`,
      [hotelId],
    );

    if (cachedHotelResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found in cache",
        traceId,
      });
    }

    const cachedHotel = cachedHotelResult.rows[0];
    const rooms = await hotelCacheService.getHotelRooms(hotelId);

    const responseRooms = rooms.map((room) => ({
      roomTypeId: room.room_type_id,
      roomTypeName: room.room_type_name,
      description: room.room_description,
      maxOccupancy: room.max_occupancy,
      adultsMax: room.adults_max,
      childrenMax: room.children_max,
      roomSize: room.room_size_sqm ? `${room.room_size_sqm} sq m` : null,
      bedTypes: room.bed_types ? JSON.parse(room.bed_types) : [],
      features: room.room_features ? JSON.parse(room.room_features) : [],
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      images: room.images ? JSON.parse(room.images) : [],
      price: {
        base: parseFloat(room.base_price_per_night) || 0,
        currency: room.currency || currency,
      },
      mealPlan: room.meal_plan,
      breakfastIncluded: room.breakfast_included,
      cancellationPolicy: room.cancellation_policy
        ? JSON.parse(room.cancellation_policy)
        : {},
    }));

    res.json({
      success: true,
      hotelId,
      hotel: {
        name: cachedHotel.name,
        address: cachedHotel.address,
        images: cachedHotel.images ? JSON.parse(cachedHotel.images) : [],
      },
      rooms: responseRooms,
      source: "cache",
      timestamp: new Date().toISOString(),
      traceId,
    });
  } catch (error) {
    console.error(`❌ Room details error [${traceId}]:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      traceId,
    });
  }
});

module.exports = router;
