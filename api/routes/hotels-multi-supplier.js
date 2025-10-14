/**
 * Multi-Supplier Hotel Search API
 * Aggregates results from Hotelbeds, RateHawk, and other hotel suppliers
 */

const express = require("express");
const db = require("../database/connection");
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");

const router = express.Router();

/**
 * Get supplier-scoped markup for a hotel
 */
async function getSupplierMarkup(
  supplierCode,
  productType,
  market = "ALL",
  currency = "ALL",
  hotelId = "ALL",
  destination = "ALL",
  channel = "ALL",
) {
  try {
    const result = await db.query(
      `SELECT * FROM get_effective_supplier_markup($1, $2, $3, $4, $5, $6, $7)`,
      [
        supplierCode,
        productType,
        market,
        currency,
        hotelId,
        destination,
        channel,
      ],
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Default markup if none found
    return {
      value_type: "PERCENT",
      value: supplierCode === "ratehawk" ? 18.0 : 20.0,
      priority: 999,
    };
  } catch (error) {
    console.error("Error getting supplier markup:", error);
    return {
      value_type: "PERCENT",
      value: 20.0,
      priority: 999,
    };
  }
}

/**
 * Apply markup to hotel price
 */
function applyMarkup(basePrice, markup) {
  if (markup.value_type === "PERCENT") {
    return basePrice * (1 + markup.value / 100);
  } else if (markup.value_type === "FLAT") {
    return basePrice + markup.value;
  }
  return basePrice;
}

/**
 * Apply promo code discount for hotels
 */
async function applyPromoCode(
  price,
  promoCode,
  userId = null,
  supplier = null,
) {
  if (!promoCode)
    return { finalPrice: price, discount: 0, promoApplied: false };

  try {
    const query = `
      SELECT * FROM promo_codes
      WHERE code = $1
      AND is_active = true
      AND (applicable_to = 'hotels' OR applicable_to = 'all')
      AND (expiry_date IS NULL OR expiry_date > NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit)
      AND (supplier_scope = $2 OR supplier_scope = 'all')
    `;

    const result = await db.query(query, [
      promoCode,
      (supplier || "all").toLowerCase(),
    ]);

    if (result.rows && result.rows.length > 0) {
      const promo = result.rows[0];
      let discount = 0;

      if (promo.discount_type === "percentage") {
        discount = price * (promo.discount_value / 100);
        if (promo.max_discount && discount > promo.max_discount) {
          discount = promo.max_discount;
        }
      } else if (promo.discount_type === "fixed") {
        discount = promo.discount_value;
      }

      if (promo.min_order_value && price < promo.min_order_value) {
        return {
          finalPrice: price,
          discount: 0,
          promoApplied: false,
          error: "Minimum order value not met",
        };
      }

      const finalPrice = Math.max(0, price - discount);

      await db.query(
        "UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = $1",
        [promo.id],
      );

      return { finalPrice, discount, promoApplied: true, promoDetails: promo };
    }

    return {
      finalPrice: price,
      discount: 0,
      promoApplied: false,
      error: "Invalid promo code",
    };
  } catch (error) {
    console.error("Error applying promo code:", error);
    return {
      finalPrice: price,
      discount: 0,
      promoApplied: false,
      error: "Promo code application failed",
    };
  }
}

function calculateStayNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }

  const diff = end.getTime() - start.getTime();
  const nights = Math.round(diff / (1000 * 60 * 60 * 24));

  return Math.max(1, nights);
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function extractImageUrls(hotel) {
  const urls = new Set();

  if (Array.isArray(hotel.images)) {
    hotel.images.forEach((img) => {
      if (!img) return;
      if (typeof img === "string") {
        const normalized = img.startsWith("http")
          ? img
          : `https://photos.hotelbeds.com/giata/original/${img}`;
        urls.add(normalized);
      } else if (img.url) {
        urls.add(img.url);
      } else if (img.thumbnail) {
        urls.add(img.thumbnail);
      } else if (img.path) {
        urls.add(`https://photos.hotelbeds.com/giata/original/${img.path}`);
      } else if (img.full) {
        urls.add(img.full);
      }
    });
  }

  if (urls.size === 0 && hotel.media?.images) {
    hotel.media.images.forEach((img) => {
      if (img?.url) urls.add(img.url);
    });
  }

  if (urls.size === 0) {
    urls.add("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format");
    urls.add("https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&auto=format");
  }

  return Array.from(urls).slice(0, 6);
}

function normalizeAmenitiesList(rawAmenities, fallback = []) {
  const normalized = new Set();
  const source = Array.isArray(rawAmenities) && rawAmenities.length > 0 ? rawAmenities : fallback;

  source.forEach((amenity) => {
    if (!amenity) return;
    if (typeof amenity === "string") {
      normalized.add(amenity);
    } else if (amenity.name) {
      normalized.add(amenity.name);
    } else if (amenity.description) {
      normalized.add(amenity.description);
    }
  });

  return Array.from(normalized).slice(0, 12);
}

function buildRatesWithMarkup(hotel, markup) {
  const rawRates = Array.isArray(hotel.rates) ? hotel.rates : [];

  if (rawRates.length === 0) {
    const fallbackPrice =
      hotel.price?.amount ??
      hotel.price?.final ??
      hotel.price?.markedUp ??
      hotel.price ??
      hotel.totalPrice ??
      hotel.currentPrice ??
      hotel.netPrice ??
      0;

    const fallbackCurrency =
      hotel.price?.currency || hotel.currency || "USD";

    const markedUpPrice = applyMarkup(fallbackPrice, markup);

    return [
      {
        rateKey:
          hotel.rateKey || `${hotel.hotelId || hotel.id || "hotel"}_default`,
        roomType: hotel.roomName || hotel.room_type || "Standard Room",
        boardType: hotel.boardType || hotel.board_type || "Room Only",
        originalPrice: fallbackPrice,
        price: fallbackPrice,
        markedUpPrice,
        currency: fallbackCurrency,
        cancellationPolicy: hotel.cancellationPolicy || [],
        isRefundable:
          hotel.policyFlags?.refundable !== undefined
            ? hotel.policyFlags.refundable
            : true,
        extras: hotel.features || [],
      },
    ];
  }

  return rawRates.map((rate, index) => {
    const paymentType =
      rate.payment_options?.payment_types?.[0] || rate.paymentType || {};

    const basePrice =
      rate.price ??
      rate.amount ??
      rate.netPrice ??
      rate.originalPrice ??
      paymentType.amount ??
      0;

    const originalPrice =
      typeof rate.originalPrice === "number" ? rate.originalPrice : basePrice;

    const currency =
      rate.currency ||
      rate.currencyCode ||
      rate.currency_code ||
      paymentType.currency_code ||
      hotel.price?.currency ||
      hotel.currency ||
      "USD";

    const cancellationPolicies =
      rate.cancellationPolicy ||
      rate.cancellationPolicies ||
      paymentType.cancellation_policies ||
      [];

    const markedUpPrice = applyMarkup(basePrice, markup);

    const isRefundable =
      typeof rate.isRefundable === "boolean"
        ? rate.isRefundable
        : !toArray(cancellationPolicies).some(
            (policy) =>
              policy &&
              typeof policy.amount === "number" &&
              policy.amount > 0,
          );

    return {
      rateKey:
        rate.rateKey ||
        rate.book_hash ||
        rate.id ||
        `${hotel.hotelId || hotel.id || "hotel"}_${index}`,
      roomType: rate.roomType || rate.room_name || rate.name || "Standard Room",
      boardType:
        rate.boardType ||
        rate.board_type ||
        rate.boardName ||
        rate.board ||
        rate.meal ||
        "Room Only",
      originalPrice,
      price: basePrice,
      markedUpPrice,
      currency,
      cancellationPolicy: toArray(cancellationPolicies),
      isRefundable,
      extras: rate.includedBoard || rate.inclusions || [],
    };
  });
}

function selectBestRate(rates) {
  if (!rates.length) {
    return {
      originalPrice: 0,
      markedUpPrice: 0,
      currency: "USD",
      rateKey: null,
      roomType: "Standard Room",
    };
  }

  return rates.reduce((best, rate) =>
    rate.markedUpPrice < (best.markedUpPrice ?? Infinity) ? rate : best,
  );
}

function buildRoomTypes(rates, nights, fallbackCurrency) {
  return rates.map((rate) => {
    const currency = rate.currency || fallbackCurrency;
    const perNight = rate.markedUpPrice / nights;

    return {
      name: rate.roomType || "Standard Room",
      price: perNight,
      pricePerNight: perNight,
      totalPrice: rate.markedUpPrice,
      board: rate.boardType || "Room Only",
      boardType: rate.boardType || "Room Only",
      cancellationPolicy: rate.cancellationPolicy,
      refundable: rate.isRefundable,
      rateKey: rate.rateKey,
      currency,
      markup: rate.markedUpPrice - rate.originalPrice,
      supplierNetRate: rate.originalPrice,
    };
  });
}

function buildAvailableRoom(roomTypes, hotel) {
  const primaryRoom = roomTypes[0];

  return {
    type: primaryRoom?.name || hotel.roomName || "Standard Room",
    bedType: hotel.bedType || "Double bed",
    rateType: primaryRoom?.board || primaryRoom?.boardType || "Flexible Rate",
    paymentTerms:
      hotel.paymentTerms ||
      (primaryRoom?.refundable ? "Pay at property" : "Prepayment required"),
    cancellationPolicy:
      primaryRoom?.refundable ? "Free cancellation" : "Non refundable",
  };
}

function buildPriceBreakdown(bestRate, finalPrice, nights, promoResult) {
  const base = bestRate.originalPrice ?? finalPrice;
  const markupAmount = finalPrice - base;
  const perNight = finalPrice / nights;

  return {
    base,
    markup: markupAmount,
    taxes: bestRate.taxes || 0,
    fees: bestRate.fees || 0,
    discount: promoResult?.discount || 0,
    perNight,
    total: finalPrice,
  };
}

function buildAddress(hotel, fallbackDestination) {
  if (hotel.address && typeof hotel.address === "object") {
    return {
      street:
        hotel.address.street ||
        hotel.address.address ||
        hotel.address.line1 ||
        fallbackDestination ||
        "",
      city: hotel.address.city || hotel.city || fallbackDestination || "",
      country: hotel.address.country || hotel.country || "United Arab Emirates",
      postalCode: hotel.address.postalCode || hotel.address.zip || "",
    };
  }

  return {
    street: hotel.location?.address || fallbackDestination || "",
    city: hotel.location?.city || fallbackDestination || "",
    country: hotel.location?.country || "United Arab Emirates",
    postalCode: "",
  };
}

function transformHotelForFrontend({
  hotel,
  supplier,
  markup,
  promoResult,
  ratesWithMarkup,
  bestRate,
  destination,
  checkIn,
  checkOut,
  currency,
  market,
  channel,
}) {
  const nights = calculateStayNights(checkIn, checkOut);
  const finalPrice = bestRate.markedUpPrice ?? 0;
  const perNightPrice = finalPrice / nights;
  const currencyCode = bestRate.currency || currency || "USD";

  const roomTypes = buildRoomTypes(ratesWithMarkup, nights, currencyCode);
  const availableRoom = buildAvailableRoom(roomTypes, hotel);
  const images = extractImageUrls(hotel);
  const amenities = normalizeAmenitiesList(
    hotel.amenities || hotel.facilities,
    ["WiFi", "Parking", "Restaurant", "Pool"],
  );
  const features = normalizeAmenitiesList(
    hotel.features,
    amenities.slice(0, 4),
  );
  const address = buildAddress(hotel, destination);
  const priceBreakdown = buildPriceBreakdown(
    bestRate,
    finalPrice,
    nights,
    promoResult,
  );

  const supplierHotelId =
    hotel.hotelId || hotel.hotelCode || hotel.id || hotel.code || null;

  return {
    id: supplierHotelId || `${supplier}_${Date.now()}`,
    code: supplierHotelId,
    name: hotel.name || hotel.hotelName || "Hotel",
    description:
      hotel.description ||
      `Experience ${hotel.name || "this hotel"} in ${destination || "Dubai"}.`,
    destinationName: hotel.destination || destination,
    location: address.street
      ? `${address.street}, ${address.city}`
      : `${address.city}, ${address.country}`,
    address,
    images,
    amenities,
    features,
    currentPrice: Number(perNightPrice.toFixed(2)),
    originalPrice: Number(
      ((bestRate.originalPrice || finalPrice) / nights).toFixed(2),
    ),
    totalPrice: Number(finalPrice.toFixed(2)),
    currency: currencyCode,
    rating: hotel.rating || hotel.starRating || 4.2,
    starRating: hotel.starRating || hotel.rating || 4,
    reviews: hotel.reviewCount || hotel.reviews || 0,
    reviewScore: hotel.reviewScore || null,
    available: true,
    lastRoom: hotel.lastRoom || false,
    rateKey: bestRate.rateKey,
    supplier: supplier,
    supplierCode: supplier,
    supplierHotelId,
    supplierRateKey: bestRate.rateKey,
    markupApplied: markup,
    promoApplied: promoResult?.promoApplied || false,
    promoDetails: promoResult?.promoApplied ? promoResult?.promoDetails : undefined,
    priceBreakdown,
    roomTypes,
    availableRoom,
    policyFlags: hotel.policyFlags || {},
    cancellationPolicy:
      bestRate.cancellationPolicy || hotel.cancellationPolicy || [],
    extras: hotel.extras || [],
    isLiveData: true,
    channel,
    market,
    supplierMeta: {
      responseTimeMs: hotel.responseTime,
    },
  };
}

/**
 * Multi-Supplier Hotel Search
 */
router.get("/search", async (req, res) => {
  try {
    console.log("🏨 Multi-supplier hotel search request:", req.query);

    const {
      destination,
      destinationCode,
      checkIn,
      checkOut,
      rooms = "1",
      roomCount,
      adults,
      children,
      childAges,
      currency = "USD",
      promoCode,
      userId,
      market = "IN",
      channel = "web",
    } = req.query;

    // Validate required parameters
    if (!destination && !destinationCode) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: destination",
      });
    }

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: checkIn, checkOut",
      });
    }

    const parsedRoomsCount = (() => {
      const value = parseInt(roomCount || rooms, 10);
      return Number.isFinite(value) && value > 0 ? value : 1;
    })();

    const totalAdults = (() => {
      const value = parseInt(Array.isArray(adults) ? adults[0] : adults, 10);
      return Number.isFinite(value) && value > 0 ? value : 2;
    })();

    const totalChildren = (() => {
      const value = parseInt(Array.isArray(children) ? children[0] : children, 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    })();

    const parsedChildAges = (() => {
      if (Array.isArray(childAges)) {
        return childAges
          .map((age) => parseInt(age, 10))
          .filter((age) => Number.isFinite(age) && age >= 0);
      }

      if (typeof childAges === "string" && childAges.trim().length > 0) {
        return childAges
          .split(/[;,]/)
          .map((age) => parseInt(age.trim(), 10))
          .filter((age) => Number.isFinite(age) && age >= 0);
      }

      return [];
    })();

    let remainingAdults = totalAdults;
    let remainingChildren = totalChildren;

    const roomsArray = Array.from({ length: parsedRoomsCount }, (_, index) => {
      const roomsLeft = parsedRoomsCount - index;
      const adultsForRoom = Math.max(
        1,
        Math.round(remainingAdults / roomsLeft) || 1,
      );
      remainingAdults -= adultsForRoom;

      const childrenForRoom = Math.max(
        0,
        Math.floor(remainingChildren / roomsLeft),
      );
      remainingChildren -= childrenForRoom;

      return {
        adults: adultsForRoom,
        children: childrenForRoom,
        childAges: parsedChildAges.slice(0, childrenForRoom) || parsedChildAges,
      };
    });

    const resolvedDestination = destinationCode || destination;

    // Build search params
    const searchParams = {
      destination: resolvedDestination,
      destinationName: destination,
      checkIn,
      checkOut,
      rooms: roomsArray,
      currency,
      maxResults: 50,
      adults: totalAdults,
      children: totalChildren,
      roomsCount: parsedRoomsCount,
      childAges: parsedChildAges,
      destinationCode: destinationCode || null,
      rawDestination: destination,
    };

    // Get enabled hotel suppliers from database
    const suppliersResult = await db.query(`
      SELECT code FROM suppliers 
      WHERE product_type = 'hotels' 
      AND is_enabled = TRUE
      ORDER BY code
    `);

    const enabledSuppliers = suppliersResult.rows.map((row) =>
      row.code.toUpperCase(),
    );

    // Fallback to env if no DB suppliers
    const suppliersToUse =
      enabledSuppliers.length > 0
        ? enabledSuppliers
        : (process.env.HOTELS_SUPPLIERS || "HOTELBEDS,RATEHAWK")
            .split(",")
            .map((s) => s.trim().toUpperCase());

    console.log(
      `📡 Searching across hotel suppliers: ${suppliersToUse.join(", ")}`,
    );

    // Execute parallel search across all enabled suppliers
    const aggregatedResults = await supplierAdapterManager.searchAllHotels(
      searchParams,
      suppliersToUse,
    );

    console.log(
      `✅ Aggregated ${aggregatedResults.totalResults} hotel results from ${Object.keys(aggregatedResults.supplierMetrics).length} suppliers`,
    );

    // Log supplier metrics
    console.log(
      "📊 Supplier Metrics:",
      JSON.stringify(aggregatedResults.supplierMetrics, null, 2),
    );

    // Check if all suppliers failed
    const allSuppliersFailed = Object.values(
      aggregatedResults.supplierMetrics,
    ).every((metric) => !metric.success);

    if (allSuppliersFailed) {
      console.error(
        "❌ All hotel suppliers failed:",
        aggregatedResults.supplierMetrics,
      );
      return res.json({
        success: true,
        data: [],
        meta: {
          totalResults: 0,
          searchParams: req.query,
          source: "multi_supplier",
          warning: "All suppliers unavailable",
          supplierErrors: aggregatedResults.supplierMetrics,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Apply supplier-scoped markup, promo, and normalize structure
    const standardizedHotels = await Promise.all(
      aggregatedResults.products.map(async (hotel) => {
        const supplier = (
          hotel.supplier ||
          hotel.supplierCode ||
          "HOTELBEDS"
        ).toLowerCase();

        const markup = await getSupplierMarkup(
          supplier,
          "hotels",
          market,
          currency,
          hotel.hotelId || hotel.id,
          hotel.destinationCode || destination,
          channel,
        );

        const ratesWithMarkup = buildRatesWithMarkup(hotel, markup);
        const bestRate = selectBestRate(ratesWithMarkup);

        const promoResult = promoCode
          ? await applyPromoCode(
              bestRate.markedUpPrice,
              promoCode,
              userId,
              supplier,
            )
          : { finalPrice: bestRate.markedUpPrice, discount: 0, promoApplied: false };

        const bestRateWithPromo = {
          ...bestRate,
          markedUpPrice: promoResult.finalPrice ?? bestRate.markedUpPrice,
        };

        const ratesForFrontend = ratesWithMarkup.map((rate) =>
          rate.rateKey === bestRate.rateKey
            ? { ...rate, markedUpPrice: bestRateWithPromo.markedUpPrice }
            : rate,
        );

        return transformHotelForFrontend({
          hotel,
          supplier,
          markup,
          promoResult,
          ratesWithMarkup: ratesForFrontend,
          bestRate: bestRateWithPromo,
          destination: resolvedDestination,
          checkIn,
          checkOut,
          currency,
          market,
          channel,
        });
      }),
    );

    // Sort by total price for consistent ordering
    standardizedHotels.sort(
      (a, b) => (a.totalPrice || 0) - (b.totalPrice || 0),
    );

    // Update supplier metrics
    for (const [supplier, metrics] of Object.entries(
      aggregatedResults.supplierMetrics,
    )) {
      if (metrics.success) {
        await db.query(
          `UPDATE suppliers SET
            last_success_at = NOW(),
            total_calls_24h = total_calls_24h + 1,
            updated_at = NOW()
          WHERE code = $1`,
          [supplier.toLowerCase()],
        );
      } else {
        await db.query(
          `UPDATE suppliers SET
            last_error_at = NOW(),
            last_error_msg = $2,
            total_calls_24h = total_calls_24h + 1,
            updated_at = NOW()
          WHERE code = $1`,
          [supplier.toLowerCase(), metrics.error || "Unknown error"],
        );
      }
    }

    res.json({
      success: true,
      data: standardizedHotels,
      meta: {
        totalResults: standardizedHotels.length,
        searchParams: {
          destination: resolvedDestination,
          destinationCode: destinationCode || null,
          destinationName: destination,
          checkIn,
          checkOut,
          rooms: roomsArray,
          adults: totalAdults,
          children: totalChildren,
          currency,
        },
        suppliers: aggregatedResults.supplierMetrics,
        source: "multi_supplier",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Multi-supplier hotel search error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
      meta: {
        searchParams: req.query,
        source: "multi_supplier",
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get hotel details (supplier-aware)
 */
router.get("/:hotelId", async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { supplier = "hotelbeds" } = req.query;

    const adapter = supplierAdapterManager.getAdapter(supplier.toUpperCase());
    if (!adapter) {
      return res.status(404).json({
        success: false,
        error: `Supplier ${supplier} not found`,
      });
    }

    // Extract actual hotel ID (remove supplier prefix if present)
    const actualHotelId = hotelId.replace(/^(hb_|rh_)/, "");

    const hotelDetails = await adapter.getHotelDetails(actualHotelId);

    res.json({
      success: true,
      data: {
        ...hotelDetails,
        supplier: supplier.toLowerCase(),
      },
    });
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
