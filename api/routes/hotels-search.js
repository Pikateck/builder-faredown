/**
 * Hotels Search API - Cache-Backed
 *
 * Flow:
 * 1. Check cache for matching search hash
 * 2. If cache hit & fresh → return from DB
 * 3. If cache miss ��� call TBO, normalize, store, return
 */

const express = require("express");
const router = express.Router();
const hotelCacheService = require("../services/hotelCacheService");
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");
const { resolveGuestNationality } = require("../utils/nationalityResolver");
const db = require("../database/connection");

/**
 * POST /api/hotels/search
 * Cache-first hotel search
 */
router.post("/", async (req, res) => {
  const requestStart = Date.now();
  const traceId = require("uuid").v4();

  try {
    // Log incoming request for debugging
    console.log(`🔍 POST /api/hotels/search [${traceId}]`, {
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.headers["content-type"],
      body: req.body,
    });

    // Validate required fields
    const { cityId, destination, cityName, checkIn, checkOut } = req.body;
    const cityIdentifier = cityId || destination || cityName;

    if (!cityIdentifier || !checkIn || !checkOut) {
      console.error(`❌ Missing required fields [${traceId}]:`, {
        cityId: !!cityId,
        destination: !!destination,
        cityName: !!cityName,
        checkIn: !!checkIn,
        checkOut: !!checkOut,
      });
      return res.status(400).json({
        success: false,
        error: `Missing required fields. Need: (cityId OR destination OR cityName) AND checkIn AND checkOut`,
        received: {
          cityId: cityId || "missing",
          destination: destination || "missing",
          cityName: cityName || "missing",
          checkIn: checkIn || "missing",
          checkOut: checkOut || "missing",
        },
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
      // Frontend already sent detailed rooms array
      roomArray = rooms;
    } else {
      // Convert string/number to array of room objects
      const roomCount = Number(rooms || 1);
      const totalAdults = Number(adults || 1);
      const totalChildren = Number(children || 0);

      // Simple split: distribute adults/children evenly across rooms
      const adultsPerRoom = Math.floor(totalAdults / roomCount);
      const childrenPerRoom = Math.floor(totalChildren / roomCount);

      roomArray = Array.from({ length: roomCount }, (_, i) => ({
        adults: adultsPerRoom + (i === 0 ? totalAdults % roomCount : 0),
        children: childrenPerRoom + (i === 0 ? totalChildren % roomCount : 0),
        childAges: [],
      }));
    }

    console.log(`🏨 Normalized rooms [${traceId}]:`, {
      original: rooms,
      normalized: roomArray,
    });

    // Merge into request
    const searchParams = {
      ...req.body,
      rooms: roomArray, // ✅ Always an array now
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

      // Fetch hotels from cache
      const cachedHotels = await hotelCacheService.getCachedHotels(searchHash);

      // Transform to API response format
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

      // Build session metadata from cached search
      const tboSessionConfig = require("../config/tbo-session.config");
      const sessionData = {
        sessionStartedAt: cachedSearch.session_started_at,
        sessionExpiresAt: cachedSearch.session_expires_at,
        sessionTtlSeconds:
          cachedSearch.session_ttl_seconds ||
          tboSessionConfig.SESSION_TTL_SECONDS,
        sessionStatus: cachedSearch.session_status || "active",
        supplier: cachedSearch.supplier || "TBO",
      };

      return res.json({
        success: true,
        source: "cache_tbo",
        hotels,
        totalResults: hotels.length,
        cacheHit: true,
        cachedAt: cachedSearch.cached_at,
        ttlExpiresAt: cachedSearch.ttl_expires_at,
        duration: `${duration}ms`,
        traceId: cachedSearch.tbo_trace_id || traceId,
        session: sessionData,
      });
    }

    console.log(`⚠️ CACHE MISS [${traceId}] - Calling TBO API`);

    // ============================================================
    // Step 4: Cache miss - call TBO
    // ============================================================
    const adapter = supplierAdapterManager.getAdapter("TBO");
    if (!adapter) {
      console.error("❌ TBO adapter not initialized [${traceId}]");
      throw new Error("TBO adapter not initialized");
    }

    // Call TBO search with timeout
    // Map parameters to TBO adapter format
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

    console.log(`📤 Calling TBO search with params [${traceId}]:`, {
      destination: tboSearchParams.destination,
      checkIn: tboSearchParams.checkIn,
      checkOut: tboSearchParams.checkOut,
      rooms: tboSearchParams.rooms,
    });

    let tboResponse = { hotels: [], sessionMetadata: {} };
    try {
      const searchPromise = adapter.searchHotels(tboSearchParams);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("TBO search timeout after 90 seconds")),
          90000,
        );
      });

      tboResponse = await Promise.race([searchPromise, timeoutPromise]);
    } catch (adapterError) {
      console.error(`❌ TBO adapter error [${traceId}]:`, {
        message: adapterError.message,
        stack: adapterError.stack,
      });
      throw adapterError;
    }

    // Extract hotels and session metadata from response
    console.log("[ROUTE] TBO Response received", {
      isArray: Array.isArray(tboResponse),
      hasHotels: !!tboResponse.hotels,
      hasResults: !!tboResponse.results,
      hotelsLength: tboResponse.hotels?.length,
      resultsLength: tboResponse.results?.length,
      hasSessionMetadata: !!tboResponse.sessionMetadata,
      responseKeys: Object.keys(tboResponse || {}),
    });

    // ✅ Handle both cache format (results) and adapter format (hotels)
    const tboHotels = Array.isArray(tboResponse)
      ? tboResponse // Backwards compatibility
      : tboResponse.hotels || tboResponse.results || [];
    const sessionMetadata = tboResponse.sessionMetadata || {};

    console.log("[ROUTE] Extracted hotels", {
      count: tboHotels.length,
      source: tboResponse.cacheHit ? 'cache' : 'adapter',
      firstHotelKeys: tboHotels[0] ? Object.keys(tboHotels[0]) : [],
    });

    if (tboHotels.length === 0) {
      console.log(`ℹ️ TBO returned 0 hotels [${traceId}]`, {
        searchParams: {
          destination: tboSearchParams.destination,
          countryCode: tboSearchParams.countryCode,
          checkIn: tboSearchParams.checkIn,
          checkOut: tboSearchParams.checkOut,
        },
        sessionMetadata,
      });
      return res.json({
        success: true,
        source: "tbo_empty",
        hotels: [],
        totalResults: 0,
        cacheHit: false,
        duration: `${Date.now() - requestStart}ms`,
        traceId,
        debug: {
          destination: tboSearchParams.destination,
          countryCode: tboSearchParams.countryCode,
          destinationId: sessionMetadata.destinationId,
          traceIdFromTBO: sessionMetadata.traceId,
          message: sessionMetadata.destinationId
            ? "TBO search completed but returned 0 hotels"
            : "City lookup failed - destinationId not found",
        },
      });
    }

    console.log(`✅ TBO returned ${tboHotels.length} hotels [${traceId}]`);

    // ============================================================
    // Step 5: Normalize and store hotel data
    // ============================================================
    const hotelIds = [];

    for (const tboHotel of tboHotels) {
      try {
        // Extract hotel code
        const hotelCode = String(
          tboHotel.hotelId || tboHotel.HotelCode || tboHotel.HotelId,
        );

        // Store normalized hotel
        await hotelCacheService.storeNormalizedHotel({
          tboHotelCode: hotelCode,
          cityId: searchParams.cityId,
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

    // ============================================================
    // Step 6: Cache the search with session metadata
    // ============================================================
    await hotelCacheService.cacheSearchResults(
      searchHash,
      searchParams,
      hotelIds,
      "tbo",
      sessionMetadata,
    );

    // ============================================================
    // Step 7: Return results
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

    // Build session metadata for response
    const tboSessionConfig = require("../config/tbo-session.config");
    const sessionStartedAt = new Date();
    const sessionExpiresAt =
      tboSessionConfig.calculateSessionExpiry(sessionStartedAt);
    const sessionStatus = tboSessionConfig.getSessionStatus(sessionExpiresAt);

    res.json({
      success: true,
      source: "tbo_live",
      hotels: responseHotels,
      totalResults: responseHotels.length,
      cacheHit: false,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      traceId,
      session: {
        sessionStartedAt: sessionStartedAt.toISOString(),
        sessionExpiresAt: sessionExpiresAt.toISOString(),
        sessionTtlSeconds: tboSessionConfig.SESSION_TTL_SECONDS,
        sessionStatus: sessionStatus,
        supplier: "TBO",
      },
    });
  } catch (error) {
    console.error(`❌ Hotel search error [${traceId}]:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Fallback: return error response
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Unknown error occurred";

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      hotels: [],
      source: "error",
      duration: `${Date.now() - requestStart}ms`,
      traceId,
    });
  }
});

/**
 * POST /api/hotels/rooms/:hotelId
 * Fetch room details + live prices for a hotel
 * (Called when user expands a hotel or goes to details)
 */
router.post("/rooms/:hotelId", async (req, res) => {
  const traceId = require("uuid").v4();

  try {
    const { hotelId } = req.params;
    const {
      checkIn,
      checkOut,
      roomConfig,
      currency = "INR",
      guestNationality,
    } = req.body;

    console.log(`🏨 Fetching room details for hotel ${hotelId} [${traceId}]`);

    // ============================================================
    // Step 1: Get cached hotel details
    // ============================================================
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

    // ============================================================
    // Step 2: Get cached room details
    // ============================================================
    const rooms = await hotelCacheService.getHotelRooms(hotelId);

    // ============================================================
    // Step 3: Call TBO for live prices + policies (optional)
    // ============================================================
    // For now, we'll serve from cache
    // In a future enhancement, we could call TBO's GetHotelRoom here
    // to refresh prices if needed

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
        total:
          ((parseFloat(room.base_price_per_night) || 0) *
            (new Date(checkOut) - new Date(checkIn))) /
          (1000 * 60 * 60 * 24),
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

/**
 * GET /api/hotels/cache/stats
 * Cache statistics (for monitoring)
 */
router.get("/cache/stats", async (req, res) => {
  try {
    const stats = await hotelCacheService.getCacheStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/hotels/cache/invalidate
 * Invalidate a specific search (admin only)
 */
router.post("/invalidate", async (req, res) => {
  try {
    const { searchHash } = req.body;

    if (!searchHash) {
      return res.status(400).json({
        success: false,
        error: "searchHash required",
      });
    }

    await hotelCacheService.invalidateSearch(searchHash);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
