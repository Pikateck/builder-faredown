const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

/**
 * Transform raw hotel data to HotelSummary (frontend contract)
 */
function transformToHotelSummary(hotel, context = {}) {
  const {
    destination = "Dubai",
    currency = "INR",
    nights = 1,
  } = context;

  // Handle TBO format
  if (hotel.hotelId || hotel.HotelCode || hotel.HotelId) {
    const total = (hotel.price?.total) || (hotel.TotalPrice) || 0;
    const perNight = nights > 0 ? total / nights : total;

    return {
      hotelId: String(hotel.hotelId || hotel.HotelCode || hotel.HotelId),
      supplierHotelCode: String(
        hotel.hotelCode || hotel.HotelCode || hotel.hotelId || hotel.HotelId
      ),
      name: hotel.name || hotel.HotelName || "Hotel",
      starRating: hotel.starRating || hotel.StarRating || 3,
      reviewScore: hotel.reviewScore || hotel.ReviewScore,
      reviewCount: hotel.reviewCount || hotel.ReviewCount,
      city: hotel.city || destination,
      address: hotel.address || hotel.Address,
      latitude: hotel.latitude || hotel.Latitude,
      longitude: hotel.longitude || hotel.Longitude,
      thumbnail:
        hotel.thumbnail ||
        hotel.image ||
        hotel.Image ||
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80",
      images: hotel.images || hotel.Images || [],
      tags: hotel.tags || hotel.Tags || [],
      totalPrice: total,
      perNightPrice: perNight,
      currency: hotel.currency || currency,
      boardType: hotel.boardType || hotel.BoardBasis || "Room Only",
      roomName: hotel.roomName || hotel.RoomName,
      isBreakfastIncluded: hotel.isBreakfastIncluded ?? true,
      isRefundable: hotel.isRefundable ?? true,
      cancellationSummary: hotel.cancellationSummary || "Non-refundable",
      distanceToCentreKm: hotel.distanceToCentreKm || 0,
    };
  }

  // Handle mock format
  if (hotel.name) {
    const total = hotel.totalPrice || hotel.price || 0;
    const perNight = nights > 0 ? total / nights : total;

    return {
      hotelId: hotel.hotelId || hotel.id || uuidv4(),
      supplierHotelCode: hotel.supplierHotelCode || hotel.id,
      name: hotel.name,
      starRating: hotel.starRating || hotel.rating || 3,
      reviewScore: hotel.reviewScore,
      reviewCount: hotel.reviewCount,
      city: hotel.city || destination,
      address: hotel.address,
      latitude: hotel.latitude || hotel.lat,
      longitude: hotel.longitude || hotel.lng,
      thumbnail: hotel.thumbnail || hotel.image || hotel.images?.[0],
      images: hotel.images || [],
      tags: hotel.tags || [],
      totalPrice: total,
      perNightPrice: perNight,
      currency: hotel.currency || currency,
      boardType: hotel.boardType || "Room Only",
      roomName: hotel.roomName,
      isBreakfastIncluded: hotel.isBreakfastIncluded ?? true,
      isRefundable: hotel.isRefundable ?? true,
      cancellationSummary: hotel.cancellationSummary,
      distanceToCentreKm: hotel.distanceToCentreKm || 0,
    };
  }

  return null;
}

/**
 * Calculate filter metadata
 */
function calculateFilterMetadata(hotels) {
  if (!Array.isArray(hotels) || hotels.length === 0) {
    return {
      minPrice: 0,
      maxPrice: 10000,
      availableStarRatings: [5, 4, 3, 2, 1],
    };
  }

  const prices = hotels
    .map((h) => h.totalPrice)
    .filter((p) => typeof p === "number");
  const ratings = [...new Set(hotels.map((h) => h.starRating || 3).sort())];

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    availableStarRatings: ratings.sort((a, b) => b - a),
  };
}

/**
 * POST /api/hotels/search
 * Hotel search with cache-first logic and multi-supplier support
 *
 * Request body:
 * {
 *   cityId: string,
 *   checkInDate: string (ISO),
 *   checkOutDate: string (ISO),
 *   guestNationality?: string,
 *   currency?: string,
 *   rooms?: Array<{ adults: number, children: number, childAges: number[] }>,
 *   sortBy?: string,
 *   minPrice?: number,
 *   maxPrice?: number,
 *   starRatings?: number[]
 * }
 *
 * Response:
 * {
 *   meta: { source: "cache" | "live", traceId: string, ... },
 *   filters: { minPrice, maxPrice, availableStarRatings },
 *   currency: string,
 *   hotels: HotelSummary[]
 * }
 */
router.post(["", "/"], async (req, res) => {
  const requestStart = Date.now();
  const traceId = req.body.traceId || uuidv4();

  try {
    // Normalize request parameters
    const {
      cityId,
      destination,
      cityName,
      checkIn,
      checkInDate,
      checkOut,
      checkOutDate,
      guestNationality = "IN",
      currency = "INR",
      rooms,
      adults = 2,
      children = 0,
      childAges = [],
    } = req.body;

    // Determine date range
    const checkInStr = checkIn || checkInDate;
    const checkOutStr = checkOut || checkOutDate;
    const cityIdentifier = cityId || destination || cityName;

    if (!cityIdentifier || !checkInStr || !checkOutStr) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields (cityId/destination, checkIn, checkOut)",
        traceId,
      });
    }

    // Calculate nights for price per night calculation
    const checkInDate_obj = new Date(checkInStr);
    const checkOutDate_obj = new Date(checkOutStr);
    const nights = Math.max(
      1,
      Math.floor(
        (checkOutDate_obj - checkInDate_obj) / (1000 * 60 * 60 * 24)
      )
    );

    let hotels = [];
    let source = "none";
    let cachedSearch = null;

    // STEP 1: Try hotelCacheService first (cache-first pattern)
    try {
      const hotelCacheService = require("../services/hotelCacheService");
      const searchParams = {
        cityId: cityIdentifier,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        currency,
        guestNationality,
      };

      const searchHash = hotelCacheService.generateSearchHash(searchParams);
      cachedSearch = await hotelCacheService.getCachedSearch(searchHash);

      if (cachedSearch && cachedSearch.is_fresh) {
        const cachedHotels =
          await hotelCacheService.getCachedHotels(searchHash);
        console.log(
          `✅ Cache hit: ${cachedHotels.length} hotels from cache [${traceId}]`
        );

        hotels = cachedHotels
          .map((h) => transformToHotelSummary(h, { destination: cityIdentifier, currency, nights }))
          .filter(Boolean);

        source = "cache";
      }
    } catch (cacheErr) {
      console.warn(
        `⚠️  Cache service unavailable [${traceId}]: ${cacheErr.message}`
      );
    }

    // STEP 2: Try TBO adapter if no cache hit
    if (hotels.length === 0) {
      try {
        const supplierAdapterManager =
          require("../services/adapters/supplierAdapterManager");
        const adapter = supplierAdapterManager.getAdapter("TBO");

        if (adapter) {
          const tboParams = {
            destination: cityIdentifier,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            countryCode: req.body.countryCode || "AE",
            guestNationality: guestNationality,
            rooms: rooms || "1",
            adults: adults || "2",
            children: children || "0",
            childAges: childAges || [],
            currency,
          };

          console.log(`🔍 Calling TBO search [${traceId}]...`);
          const tboResponse = await adapter.searchHotels(tboParams);
          const tboHotels = tboResponse.hotels || [];

          console.log(
            `✅ TBO returned ${tboHotels.length} hotels [${traceId}]`
          );

          hotels = tboHotels
            .map((h) => transformToHotelSummary(h, { destination: cityIdentifier, currency, nights }))
            .filter(Boolean);

          source = "live";
        }
      } catch (tboErr) {
        console.warn(
          `⚠️  TBO service unavailable [${traceId}]: ${tboErr.message}`
        );
      }
    }

    // STEP 3: Try mock fallback if still no hotels
    if (hotels.length === 0) {
      try {
        const { MOCK_HOTELS } = require("../routes/hotels-metadata");
        const mockKey = cityIdentifier.toUpperCase();
        const mockHotels = MOCK_HOTELS[mockKey] || [];

        if (mockHotels.length > 0) {
          console.log(
            `🔄 Using mock fallback: ${mockHotels.length} hotels [${traceId}]`
          );
          hotels = mockHotels
            .map((h) => transformToHotelSummary(h, { destination: cityIdentifier, currency, nights }))
            .filter(Boolean);

          source = "mock";
        }
      } catch (mockErr) {
        console.warn(
          `⚠️  Mock hotels unavailable [${traceId}]: ${mockErr.message}`
        );
      }
    }

    // STEP 4: Calculate filters and duration
    const filters = calculateFilterMetadata(hotels);
    const duration = Date.now() - requestStart;

    return res.json({
      meta: {
        source,
        traceId,
        searchedAt: new Date(requestStart).toISOString(),
        processedAt: new Date().toISOString(),
      },
      filters,
      currency,
      hotels: hotels || [],
      totalResults: hotels.length,
      durationMs: duration,
      success: true,
    });
  } catch (error) {
    console.error(`Hotel search error [${traceId}]:`, error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
      meta: { source: "error", traceId },
      hotels: [],
      filters: {
        minPrice: 0,
        maxPrice: 10000,
        availableStarRatings: [5, 4, 3, 2, 1],
      },
    });
  }
});

module.exports = router;
