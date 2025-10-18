/**
 * Multi-Supplier Hotel Search API
 * Aggregates results from Hotelbeds, RateHawk, and other hotel suppliers
 */

const express = require("express");
const crypto = require("crypto");
const db = require("../database/connection");
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");
const {
  resolveSupplierMarkup,
  applyMarkupToAmount,
  buildPricingBreakdown,
  buildPricingHash,
} = require("../services/pricing/supplierMarkupService");

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
  return resolveSupplierMarkup({
    supplierCode,
    module: productType,
    market,
    currency,
    hotelId,
    destination,
    channel,
  });
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
    urls.add(
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&auto=format",
    );
    urls.add(
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&auto=format",
    );
  }

  return Array.from(urls).slice(0, 6);
}

function normalizeAmenitiesList(rawAmenities, fallback = []) {
  const normalized = new Set();
  const source =
    Array.isArray(rawAmenities) && rawAmenities.length > 0
      ? rawAmenities
      : fallback;

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

    const fallbackCurrency = hotel.price?.currency || hotel.currency || "USD";

    const { finalAmount, markupAmount } = applyMarkupToAmount(
      fallbackPrice,
      markup,
    );

    return [
      {
        rateKey:
          hotel.rateKey || `${hotel.hotelId || hotel.id || "hotel"}_default`,
        roomType: hotel.roomName || hotel.room_type || "Standard Room",
        boardType: hotel.boardType || hotel.board_type || "Room Only",
        originalPrice: fallbackPrice,
        price: fallbackPrice,
        markedUpPrice: finalAmount,
        markupAmount,
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

    const { finalAmount: markedUpPrice, markupAmount } = applyMarkupToAmount(
      basePrice,
      markup,
    );

    const isRefundable =
      typeof rate.isRefundable === "boolean"
        ? rate.isRefundable
        : !toArray(cancellationPolicies).some(
            (policy) =>
              policy && typeof policy.amount === "number" && policy.amount > 0,
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
      markupAmount,
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
    cancellationPolicy: primaryRoom?.refundable
      ? "Free cancellation"
      : "Non refundable",
  };
}

function buildPriceBreakdown(
  bestRate,
  finalPrice,
  nights,
  promoResult,
  currency,
) {
  const base = Number(bestRate.originalPrice ?? bestRate.price ?? finalPrice);
  const taxes = Number(bestRate.taxes || 0);
  const fees = Number(bestRate.fees || 0);
  const rawMarkup = finalPrice - (base + taxes + fees);
  const discount = Number(promoResult?.discount || 0);
  const pricing = buildPricingBreakdown({
    base,
    taxes,
    fees,
    markup: rawMarkup,
    discount,
    currency,
  });

  const perNight =
    nights > 0
      ? pricing.final_price.amount / nights
      : pricing.final_price.amount;

  return {
    ...pricing.breakdown,
    perNight,
    total: pricing.final_price.amount,
    currency: pricing.final_price.currency,
    pricing,
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
  const priceSummary = buildPriceBreakdown(
    bestRate,
    finalPrice,
    nights,
    promoResult,
    currencyCode,
  );
  const perNightPrice = priceSummary.perNight;
  const pricingBreakdown = priceSummary.pricing;

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
    promoDetails: promoResult?.promoApplied
      ? promoResult?.promoDetails
      : undefined,
    priceBreakdown: {
      base: priceSummary.base,
      markup: priceSummary.markup,
      taxes: priceSummary.taxes,
      fees: priceSummary.fees,
      discount: priceSummary.discount,
      perNight: priceSummary.perNight,
      total: priceSummary.total,
      currency: priceSummary.currency,
    },
    pricingBreakdown,
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
      page = "1",
      pageSize = "20",
      maxResults: maxResultsQuery,
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
      const value = parseInt(
        Array.isArray(children) ? children[0] : children,
        10,
      );
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
      const roomsLeft = parsedRoomsCount - index || 1;
      const adultsForRoom = Math.max(
        1,
        Math.ceil(remainingAdults / roomsLeft) || 1,
      );
      remainingAdults = Math.max(0, remainingAdults - adultsForRoom);

      const childrenForRoom = Math.max(
        0,
        Math.floor(remainingChildren / roomsLeft),
      );
      remainingChildren = Math.max(0, remainingChildren - childrenForRoom);

      return {
        adults: adultsForRoom,
        children: childrenForRoom,
        childAges: parsedChildAges.slice(0, childrenForRoom),
      };
    });

    const resolvedDestination = destinationCode || destination;

    // Pagination math
    const parsedPage = Math.max(1, parseInt(String(page), 10) || 1);
    const parsedPageSize = Math.max(
      1,
      Math.min(100, parseInt(String(pageSize), 10) || 20),
    );
    const requestedMax = Math.min(
      parseInt(String(maxResultsQuery || "200"), 10) || 200,
      500,
    );
    const supplierMax = Math.min(requestedMax, parsedPage * parsedPageSize);

    // Build search params
    const searchParams = {
      destination: resolvedDestination,
      destinationName: destination,
      checkIn,
      checkOut,
      rooms: roomsArray,
      currency,
      maxResults: supplierMax,
      adults: totalAdults,
      children: totalChildren,
      roomsCount: parsedRoomsCount,
      childAges: parsedChildAges,
      destinationCode: destinationCode || null,
      rawDestination: destination,
    };

    // Get enabled hotel suppliers from database (supplier_master)
    const suppliersResult = await db.query(`
    SELECT COALESCE(code, supplier_code) AS code, weight FROM supplier_master
    WHERE enabled = TRUE
      AND LOWER(COALESCE(code, supplier_code)) IN ('hotelbeds','ratehawk','tbo')
    ORDER BY weight DESC, COALESCE(code, supplier_code) ASC
  `);

    const enabledSuppliers = suppliersResult.rows.map((row) =>
      String(row.code || "").toUpperCase(),
    );

    // Fallback to env if no DB suppliers
    let suppliersToUse =
      enabledSuppliers.length > 0
        ? enabledSuppliers
        : (process.env.HOTELS_SUPPLIERS || "HOTELBEDS,RATEHAWK,TBO")
            .split(",")
            .map((s) => s.trim().toUpperCase());

    // Prioritize TBO inventory when available
    suppliersToUse = suppliersToUse.sort((a, b) =>
      a === "TBO" ? -1 : b === "TBO" ? 1 : 0,
    );

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
          suppliersUsed: suppliersToUse,
          supplierWeights: (
            await db.query(
              `SELECT COALESCE(code, supplier_code) AS code, weight FROM supplier_master WHERE COALESCE(code, supplier_code) = ANY($1)`,
              [suppliersToUse.map((s) => s.toLowerCase())],
            )
          ).rows,
          warning: "All suppliers unavailable",
          supplierErrors: aggregatedResults.supplierMetrics,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const searchId = crypto.randomUUID();

    const searchRecord = {
      id: searchId,
      destination: {
        code: resolvedDestination,
        name: destination,
      },
      check_in: checkIn,
      check_out: checkOut,
      rooms: roomsArray,
      currency,
      channel,
      locale: req.query.locale || "en",
    };

    const processedHotels = await Promise.all(
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
          : {
              finalPrice: bestRate.markedUpPrice,
              discount: 0,
              promoApplied: false,
            };

        const bestRateWithPromo = {
          ...bestRate,
          markedUpPrice: promoResult.finalPrice ?? bestRate.markedUpPrice,
        };

        const ratesForFrontend = ratesWithMarkup.map((rate) =>
          rate.rateKey === bestRate.rateKey
            ? { ...rate, markedUpPrice: bestRateWithPromo.markedUpPrice }
            : rate,
        );

        const frontend = transformHotelForFrontend({
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

        const priceBreakdown = frontend.priceBreakdown || {
          base: 0,
          taxes: 0,
          fees: 0,
          markup: 0,
          discount: 0,
          total: frontend.totalPrice || 0,
          currency: frontend.currency || currency,
        };

        const pricingPayload =
          frontend.pricingBreakdown ||
          buildPricingBreakdown({
            base: priceBreakdown.base,
            taxes: priceBreakdown.taxes,
            fees: priceBreakdown.fees,
            markup: priceBreakdown.markup,
            discount: priceBreakdown.discount,
            currency: priceBreakdown.currency || currency,
          });

        const supplierHotelId =
          frontend.supplierHotelId || frontend.code || frontend.id;

        const canonicalHotelId = `canon:hotel:${(
          supplierHotelId || `${supplier}_${frontend.id}`
        )
          .toString()
          .toLowerCase()}`;

        const locationSource = hotel.location || hotel.geo || {};
        const coordinates =
          locationSource.coordinates || locationSource.geo || {};

        const normalizedRecord = {
          id: crypto.randomUUID(),
          search_id: searchId,
          canonical_hotel_id: canonicalHotelId,
          name: frontend.name,
          location: {
            address: frontend.address,
            destination: frontend.destinationName || destination,
            geo: {
              lat:
                locationSource.latitude ||
                locationSource.lat ||
                coordinates.lat ||
                null,
              lng:
                locationSource.longitude ||
                locationSource.lon ||
                coordinates.lon ||
                coordinates.lng ||
                null,
            },
          },
          stars: frontend.starRating || null,
          supplier_code: supplier,
          supplier_hotel_id: supplierHotelId,
          room: {
            rate_key: frontend.rateKey,
            room_types: frontend.roomTypes,
            available_room: frontend.availableRoom,
            nights: calculateStayNights(checkIn, checkOut),
            promo_applied: frontend.promoApplied,
          },
          raw_price: Number(
            (
              Number(priceBreakdown.base || 0) +
              Number(priceBreakdown.taxes || 0) +
              Number(priceBreakdown.fees || 0)
            ).toFixed(2),
          ),
          raw_currency: frontend.currency || currency,
          priced: pricingPayload,
          pricing_hash: buildPricingHash({
            supplier,
            supplier_hotel_id: supplierHotelId,
            rate_key: frontend.rateKey,
            check_in: checkIn,
            check_out: checkOut,
            total: pricingPayload.final_price.amount,
            currency: pricingPayload.final_price.currency,
          }),
          ttl_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };

        return {
          frontend,
          normalized: normalizedRecord,
        };
      }),
    );

    const standardizedHotels = processedHotels.map((item) => item.frontend);
    const normalizedRows = processedHotels.map((item) => item.normalized);

    // Sort by total price for consistent ordering
    standardizedHotels.sort(
      (a, b) => (a.totalPrice || 0) - (b.totalPrice || 0),
    );

    // Best-effort persistence: never block results due to schema mismatches
    try {
      await db.transaction(async (client) => {
        await client.query(
          `INSERT INTO hotel_searches (id, destination, check_in, check_out, rooms, currency, channel, locale)
           VALUES ($1, $2::jsonb, $3, $4, $5::jsonb, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            searchRecord.id,
            JSON.stringify(searchRecord.destination),
            searchRecord.check_in,
            searchRecord.check_out,
            JSON.stringify(searchRecord.rooms),
            searchRecord.currency,
            searchRecord.channel,
            searchRecord.locale,
          ],
        );

        for (const row of normalizedRows) {
          await client.query(
            `INSERT INTO hotels_inventory_master (
              id,
              search_id,
              canonical_hotel_id,
              name,
              location,
              stars,
              supplier_code,
              supplier_hotel_id,
              room,
              raw_price,
              raw_currency,
              priced,
              pricing_hash,
              ttl_expires_at
            ) VALUES (
              $1,
              $2,
              $3,
              $4,
              $5::jsonb,
              $6,
              $7,
              $8,
              $9::jsonb,
              $10,
              $11,
              $12::jsonb,
              $13,
              $14
            )
            ON CONFLICT (pricing_hash) DO UPDATE SET
              search_id = EXCLUDED.search_id,
              name = EXCLUDED.name,
              location = EXCLUDED.location,
              stars = EXCLUDED.stars,
              raw_price = EXCLUDED.raw_price,
              raw_currency = EXCLUDED.raw_currency,
              priced = EXCLUDED.priced,
              ttl_expires_at = EXCLUDED.ttl_expires_at;`,
            [
              row.id,
              row.search_id,
              row.canonical_hotel_id,
              row.name,
              JSON.stringify(row.location),
              row.stars,
              row.supplier_code,
              row.supplier_hotel_id,
              JSON.stringify(row.room),
              row.raw_price,
              row.raw_currency,
              JSON.stringify(row.priced),
              row.pricing_hash,
              row.ttl_expires_at,
            ],
          );
        }
      });
    } catch (persistErr) {
      console.warn(
        "⚠️ Hotel search persistence skipped:",
        persistErr?.message || persistErr,
      );
    }

    console.log(
      `��️ Stored ${normalizedRows.length} hotel rows for search ${searchId} (currency: ${searchRecord.currency})`,
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

    // Apply pagination to standardized list
    const totalCount = standardizedHotels.length;
    const start = (parsedPage - 1) * parsedPageSize;
    const end = Math.min(start + parsedPageSize, totalCount);
    const pageItems = standardizedHotels.slice(start, end);

    res.json({
      success: true,
      data: pageItems,
      meta: {
        searchId,
        totalResults: totalCount,
        page: parsedPage,
        pageSize: parsedPageSize,
        hasMore: end < totalCount,
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
        suppliersUsed: suppliersToUse,
        supplierWeights: (
          await db.query(
            `SELECT COALESCE(code, supplier_code) AS code, weight FROM supplier_master WHERE COALESCE(code, supplier_code) = ANY($1)`,
            [suppliersToUse.map((s) => s.toLowerCase())],
          )
        ).rows,
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

/**
 * Supplier-aware booking for non-Hotelbeds (e.g., RateHawk)
 * POST /api/hotels/book
 */
router.post("/booking/form", async (req, res) => {
  try {
    const { supplier = "ratehawk", rateKey, language = "en" } = req.body || {};
    if (!rateKey) {
      return res
        .status(400)
        .json({ success: false, error: "rateKey is required" });
    }
    const supplierCode = String(supplier).toUpperCase();
    if (supplierCode === "HOTELBEDS") {
      return res
        .status(400)
        .json({
          success: false,
          error: "Use /api/hotels-live/checkrate for Hotelbeds",
        });
    }
    const adapter = supplierAdapterManager.getAdapter(supplierCode);
    if (!adapter?.getBookingForm) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }
    const form = await adapter.getBookingForm(rateKey, language);
    return res.json({ success: true, data: form });
  } catch (error) {
    console.error("Booking form error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/book", async (req, res) => {
  try {
    const {
      supplier,
      rateKey,
      partnerOrderId,
      language = "en",
      user,
      guests = [],
      bookingData = {},
    } = req.body || {};

    if (!supplier || !rateKey) {
      return res.status(400).json({
        success: false,
        error: "supplier and rateKey are required",
      });
    }

    const supplierCode = String(supplier).toUpperCase();

    // Route non-Hotelbeds bookings via supplier adapters
    if (supplierCode === "HOTELBEDS") {
      return res.status(400).json({
        success: false,
        error: "Use /api/hotels-live/book for Hotelbeds bookings",
      });
    }

    const adapter = supplierAdapterManager.getAdapter(supplierCode);
    if (!adapter) {
      return res.status(404).json({
        success: false,
        error: `Supplier ${supplier} not found`,
      });
    }

    // Normalize booking payload for RateHawk bookHotel()
    const payload = {
      rateKey,
      partnerOrderId: partnerOrderId || `fd_${Date.now()}`,
      language,
      user: user || bookingData.user || {},
      guests: Array.isArray(guests) ? guests : bookingData.guests || [],
    };

    const result = await supplierAdapterManager.bookProduct(
      "hotel",
      supplierCode,
      payload,
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Supplier-aware booking error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get order info
 * GET /api/hotels/order/:orderId
 */
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { supplier = "ratehawk", language = "en" } = req.query;
    const supplierCode = String(supplier).toUpperCase();

    if (supplierCode === "HOTELBEDS") {
      return res.status(400).json({
        success: false,
        error: "Order info via Hotelbeds not supported on this route",
      });
    }

    const adapter = supplierAdapterManager.getAdapter(supplierCode);
    if (!adapter?.getOrderInfo) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }

    const info = await adapter.getOrderInfo(orderId, language);
    return res.json({ success: true, data: info });
  } catch (error) {
    console.error("Get order info error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get booking status
 * GET /api/hotels/order/:orderId/status
 */
router.get("/order/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { supplier = "ratehawk" } = req.query;
    const supplierCode = String(supplier).toUpperCase();

    if (supplierCode === "HOTELBEDS") {
      return res.status(400).json({
        success: false,
        error: "Booking status via Hotelbeds not supported on this route",
      });
    }

    const adapter = supplierAdapterManager.getAdapter(supplierCode);
    if (!adapter?.getBookingStatus) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }

    const status = await adapter.getBookingStatus(orderId);
    return res.json({ success: true, data: status });
  } catch (error) {
    console.error("Get booking status error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Cancel booking
 * POST /api/hotels/order/:orderId/cancel
 */
router.post("/order/:orderId/cancel", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { supplier = "ratehawk" } = req.query;
    const supplierCode = String(supplier).toUpperCase();

    if (supplierCode === "HOTELBEDS") {
      return res.status(400).json({
        success: false,
        error: "Booking cancellation via Hotelbeds not supported on this route",
      });
    }

    const adapter = supplierAdapterManager.getAdapter(supplierCode);
    if (!adapter?.cancelBooking) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }

    const result = await adapter.cancelBooking(orderId);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Download voucher PDF
 * GET /api/hotels/order/:orderId/voucher
 */
router.get("/order/:orderId/voucher", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { supplier = "ratehawk" } = req.query;
    const supplierCode = String(supplier).toUpperCase();

    const adapter = supplierAdapterManager.getAdapter(supplierCode);
    if (!adapter?.downloadVoucher) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }

    const file = await adapter.downloadVoucher(orderId);
    res.setHeader("Content-Type", file.contentType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName || `voucher_${orderId}.pdf`}"`,
    );
    return res.send(file.data);
  } catch (error) {
    console.error("Download voucher error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Download invoice PDF
 * GET /api/hotels/order/:orderId/invoice
 */
router.get("/order/:orderId/invoice", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { supplier = "ratehawk" } = req.query;
    const supplierCode = String(supplier).toUpperCase();

    const adapter = supplierAdapterManager.getAdapter(supplierCode);
    if (!adapter?.downloadInvoice) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }

    const file = await adapter.downloadInvoice(orderId);
    res.setHeader("Content-Type", file.contentType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName || `invoice_${orderId}.pdf`}"`,
    );
    return res.send(file.data);
  } catch (error) {
    console.error("Download invoice error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Region search (supplier-aware for RateHawk)
 * GET /api/hotels/regions/search?q=Dubai&supplier=ratehawk
 */
router.get("/regions/search", async (req, res) => {
  try {
    const { q, query, supplier = "ratehawk", language = "en" } = req.query;
    const term = String(q || query || "").trim();
    if (term.length < 2) {
      return res.json({ success: true, data: [] });
    }
    const adapter = supplierAdapterManager.getAdapter(
      String(supplier).toUpperCase(),
    );
    if (!adapter?.searchRegions) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }
    const regions = await adapter.searchRegions(term, language);
    return res.json({ success: true, data: regions });
  } catch (error) {
    console.error("Region search error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Static hotels list (paginated)
 * GET /api/hotels/static/hotels?limit=1000&offset=0&supplier=ratehawk
 */
router.get("/static/hotels", async (req, res) => {
  try {
    const { limit = "1000", offset = "0", supplier = "ratehawk" } = req.query;
    const adapter = supplierAdapterManager.getAdapter(
      String(supplier).toUpperCase(),
    );
    if (!adapter?.getHotelStatic) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }
    const data = await adapter.getHotelStatic(
      parseInt(String(limit), 10),
      parseInt(String(offset), 10),
    );
    return res.json({
      success: true,
      count: Array.isArray(data) ? data.length : 0,
      data,
    });
  } catch (error) {
    console.error("Static hotels error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Region dump (paginated)
 * GET /api/hotels/static/regions?limit=1000&offset=0&supplier=ratehawk
 */
router.get("/static/regions", async (req, res) => {
  try {
    const { limit = "1000", offset = "0", supplier = "ratehawk" } = req.query;
    const adapter = supplierAdapterManager.getAdapter(
      String(supplier).toUpperCase(),
    );
    if (!adapter?.getRegionDump) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }
    const data = await adapter.getRegionDump(
      parseInt(String(limit), 10),
      parseInt(String(offset), 10),
    );
    return res.json({
      success: true,
      count: Array.isArray(data) ? data.length : 0,
      data,
    });
  } catch (error) {
    console.error("Region dump error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Hotel info dump (paginated)
 * GET /api/hotels/static/hotel-info?limit=1000&offset=0&supplier=ratehawk
 */
router.get("/static/hotel-info", async (req, res) => {
  try {
    const { limit = "1000", offset = "0", supplier = "ratehawk" } = req.query;
    const adapter = supplierAdapterManager.getAdapter(
      String(supplier).toUpperCase(),
    );
    if (!adapter?.getHotelInfoDump) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }
    const data = await adapter.getHotelInfoDump(
      parseInt(String(limit), 10),
      parseInt(String(offset), 10),
    );
    return res.json({
      success: true,
      count: Array.isArray(data) ? data.length : 0,
      data,
    });
  } catch (error) {
    console.error("Hotel info dump error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Hotel info incremental dump
 * GET /api/hotels/static/hotel-info-incremental?from=2025-01-01T00:00:00Z&limit=1000&offset=0&supplier=ratehawk
 */
router.get("/static/hotel-info-incremental", async (req, res) => {
  try {
    const {
      from,
      limit = "1000",
      offset = "0",
      supplier = "ratehawk",
    } = req.query;
    if (!from) {
      return res
        .status(400)
        .json({ success: false, error: "from is required (ISO timestamp)" });
    }
    const adapter = supplierAdapterManager.getAdapter(
      String(supplier).toUpperCase(),
    );
    if (!adapter?.getHotelInfoIncrementalDump) {
      return res
        .status(404)
        .json({ success: false, error: "Supplier not found or unsupported" });
    }
    const data = await adapter.getHotelInfoIncrementalDump(
      String(from),
      parseInt(String(limit), 10),
      parseInt(String(offset), 10),
    );
    return res.json({
      success: true,
      count: Array.isArray(data) ? data.length : 0,
      data,
    });
  } catch (error) {
    console.error("Hotel info incremental dump error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
