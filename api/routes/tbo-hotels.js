/**
 * TBO Hotels Routes (Live)
 * Search → PreBook → Book → Voucher ��� BookingDetails/Change
 */

const express = require("express");
const router = express.Router();
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");
const { resolveGuestNationality } = require("../utils/nationalityResolver");

function getTboAdapter() {
  const adapter = supplierAdapterManager.getAdapter("TBO");
  if (!adapter) throw new Error("TBO adapter not initialized");
  return adapter;
}

function statusFromErrorCode(code) {
  switch (code) {
    case "TBO_AUTH_FAILED":
      return 401;
    case "TBO_PRICE_CHANGED":
      return 409;
    case "TBO_BOOKING_NOT_FOUND":
      return 404;
    case "TBO_RATE_LIMITED":
      return 429;
    case "TBO_BAD_REQUEST":
      return 400;
    default:
      return 500;
  }
}

// Health
router.get("/health", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    const status = await adapter.performHealthCheck();
    res.json({ success: true, data: status });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Diagnostics: last auth attempts
router.get("/diagnostics/auth", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    const attempts = Array.isArray(adapter._authAttempts)
      ? adapter._authAttempts.slice(-20)
      : [];
    const egressIp = await adapter._getEgressIp().catch(() => null);
    res.json({ success: true, data: { egressIp, attempts } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Egress IP helper (for TBO whitelist)
router.get("/egress-ip", async (req, res) => {
  try {
    const axios = require("axios");
    const r = await axios.get("https://api.ipify.org?format=json", {
      timeout: 5000,
    });
    res.json({ success: true, ip: r.data?.ip });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Reset circuit breaker (diagnostics)
router.post("/circuit/reset", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.resetCircuitBreaker === "function")
      adapter.resetCircuitBreaker();
    res.json({ success: true, data: { reset: true } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Cities typeahead (cached, searchable)
router.get("/cities", async (req, res) => {
  // Set timeout for cities endpoint
  const responseTimeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error("⏱️ Cities endpoint timeout");
      res.status(200).json({
        success: false,
        error: "Request timeout",
        data: [],
      });
    }
  }, 30000);

  res.on("finish", () => {
    clearTimeout(responseTimeout);
  });

  try {
    const adapter = getTboAdapter();
    const { q = "", limit = 15, country = null } = req.query;

    console.log(`🔍 Cities search - Query: "${q}", Limit: ${limit}`);

    // Call searchCities with timeout
    const citiesPromise = adapter.searchCities(
      q,
      Math.min(parseInt(limit, 10) || 15, 100),
      country,
    );

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Cities search timeout")), 20000);
    });

    const cities = await Promise.race([citiesPromise, timeoutPromise]);

    console.log(`✅ Found ${cities.length} cities matching "${q}"`);

    clearTimeout(responseTimeout);
    res.json({ success: true, data: cities });
  } catch (e) {
    clearTimeout(responseTimeout);
    console.error(`❌ Cities search error:`, e.message);
    // Return success with empty data instead of error
    res.status(200).json({
      success: false,
      error: e.message,
      data: [],
    });
  }
});

// Hotel details (snapshot-first, optional fresh)
router.get("/hotel/:supplierHotelId", async (req, res) => {
  try {
    const { supplierHotelId } = req.params;
    const { searchId, fresh = false } = req.query;
    const db = require("../database/connection");

    // Load from snapshot (search cache)
    let hotel = null;
    if (searchId) {
      const snapshotResult = await db.query(
        `SELECT h.*,
                json_agg(json_build_object(
                  'roomId', r.offer_id,
                  'roomName', r.room_name,
                  'board', r.board_basis,
                  'occupants', json_build_object('adults', r.occupancy_adults, 'children', r.occupancy_children),
                  'price', json_build_object('base', r.price_base, 'taxes', r.price_taxes, 'total', r.price_total, 'currency', r.currency),
                  'rateKey', r.rate_key_or_token
                )) as rooms
         FROM hotel_unified h
         LEFT JOIN room_offer_unified r ON h.property_id = r.property_id
         WHERE h.supplier_code = $1 AND h.supplier_hotel_id = $2
         GROUP BY h.property_id`,
        ["TBO", supplierHotelId],
      );

      if (snapshotResult.rows.length > 0) {
        const row = snapshotResult.rows[0];
        hotel = {
          supplier: "TBO",
          supplierHotelId: row.supplier_hotel_id,
          name: row.hotel_name,
          address: row.address,
          city: row.city,
          countryCode: row.country,
          location: {
            lat: row.lat,
            lng: row.lng,
          },
          rating: parseFloat(row.star_rating) || 0,
          amenities: row.amenities_json || [],
          images: [],
          minTotal: 0,
          currency: "INR",
          taxesAndFees: { included: true, excluded: false },
          refundable: true,
          rooms: row.rooms?.filter((r) => r.rateKey) || [],
        };

        if (hotel.rooms.length > 0) {
          hotel.minTotal = Math.min(...hotel.rooms.map((r) => r.price.total));
        }
      }
    }

    // If fresh=true or not found in snapshot, fetch from TBO static data
    if (fresh || !hotel) {
      const adapter = getTboAdapter();
      const rawHotel = await adapter.getHotelDetails(supplierHotelId);
      if (rawHotel) {
        const unifiedHotel =
          require("../services/adapters/tboAdapter").toUnifiedHotel(rawHotel, {
            destination: hotel?.city,
            currency: "INR",
          });
        if (unifiedHotel && hotel) {
          // Merge: keep pricing from snapshot, add description/images from fresh
          hotel.images = unifiedHotel.images || hotel.images;
        } else if (unifiedHotel) {
          hotel = unifiedHotel;
        }
      }
    }

    if (!hotel) {
      return res.status(404).json({ success: false, error: "Hotel not found" });
    }

    res.json({ success: true, data: hotel });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Search (POST)
router.post("/search", async (req, res) => {
  // Set response timeout to 60 seconds to prevent hanging connections
  const responseTimeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error("⏱️ Response timeout on POST /search - sending fallback");
      res.status(200).json({
        success: false,
        error: "Request timeout",
        data: [],
        via: "fixie_timeout",
      });
    }
  }, 60000);

  // Ensure timeout is cleared when response is sent
  res.on("finish", () => {
    clearTimeout(responseTimeout);
  });

  const start = Date.now();
  try {
    const adapter = getTboAdapter();
    const TBOAdapter = require("../services/adapters/tboAdapter");
    const { v4: uuidv4 } = require("uuid");
    const { resolveGuestNationality } = require("../utils/nationalityResolver");

    // Resolve guest nationality (explicit > user profile > default IN)
    const guestNationality = await resolveGuestNationality(req, req.user);

    // Merge nationality into search request
    const searchRequest = {
      ...req.body,
      guestNationality: req.body.guestNationality || guestNationality
    };

    // Execute raw search with 90-second timeout (large result sets via proxy)
    const searchPromise = adapter.searchHotels(searchRequest);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("TBO search timeout after 90 seconds")),
        90000,
      );
    });

    const rawResults = await Promise.race([searchPromise, timeoutPromise]);
    const duration = Date.now() - start;

    // Convert to UnifiedHotel format
    const searchContext = {
      destination: req.body.destination || req.body.City,
      checkIn: req.body.checkIn || req.body.CheckIn,
      checkOut: req.body.checkOut || req.body.CheckOut,
      adults: Number(req.body.adults || req.body.Adults || 2),
      children: Number(req.body.children || req.body.Children || 0),
      currency: req.body.currency || req.body.Currency || "INR",
      guestNationality: guestNationality,
    };

    const unifiedResults = rawResults
      .map((h) => TBOAdapter.toUnifiedHotel(h, searchContext))
      .filter(Boolean);

      // Cache search results
try {
  const hotelCacheService = require("../services/hotelCacheService");
  await hotelCacheService.cacheSearchResults(
    unifiedResults,
    searchRequest,
    "tbo_search",
    {} // sessionMetadata (if available from adapter)
  );
  console.log(`✅ Cached ${unifiedResults.length} hotels for TBO search`);
} catch (cacheErr) {
  console.warn("⚠️ Failed to cache TBO search results:", cacheErr.message);
}
    // Generate searchId for tracking
    const searchId = uuidv4();

    // Note: persistSearchSnapshot not yet implemented in TBO adapter
    // Search logging happens via search_logs table below

    // Log search (best-effort)
    try {
      const db = require("../database/connection");
      const b = req.body || {};
      await db.query(
        `INSERT INTO search_logs (search_type, destination, adults, children, result_count, response_time_ms, supplier, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [
          "hotel",
          b.destination || b.City || b.city || null,
          Number(b.adults || b.Adults || 0),
          Number(b.children || b.Children || 0),
          unifiedResults.length,
          duration,
          "TBO",
        ],
      );
    } catch (logErr) {
      console.warn("search_logs insert skipped (tbo-hotels):", logErr.message);
    }

    clearTimeout(responseTimeout);
    res.json({
      success: true,
      data: unifiedResults,
      searchId,
      via: "fixie",
    });
  } catch (e) {
    clearTimeout(responseTimeout);
    console.error("❌ TBO search error:", e.message);

    // Return safe fallback instead of error status
    // This prevents "Failed to fetch" on client
    res.status(200).json({
      success: false,
      error: e.message,
      code: e.code,
      data: [],
      via: "error_fallback",
    });
  }
});

// Search (GET convenience for diagnostics)
router.get("/search", async (req, res) => {
  // Set response timeout
  const responseTimeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error("���️ Response timeout on GET /search");
      res.status(200).json({
        success: false,
        error: "Request timeout",
        data: [],
      });
    }
  }, 60000);

  res.on("finish", () => {
    clearTimeout(responseTimeout);
  });

  try {
    const adapter = getTboAdapter();
    const {
      destination,
      checkin,
      checkout,
      adults = 2,
      children = 0,
      rooms = 1,
      currency = "INR",
    } = req.query;

    // Add timeout to search
    const searchPromise = adapter.searchHotels({
      destination,
      checkIn: checkin,
      checkOut: checkout,
      adults: Number(adults),
      children: Number(children),
      rooms: Number(rooms),
      currency,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Search timeout")), 90000);
    });

    const data = await Promise.race([searchPromise, timeoutPromise]);
    clearTimeout(responseTimeout);
    res.json({ success: true, data });
  } catch (e) {
    clearTimeout(responseTimeout);
    console.error("❌ GET /search error:", e.message);
    res.status(200).json({
      success: false,
      error: e.message,
      data: [],
    });
  }
});

// PreBook
router.post("/prebook", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.preBookHotel !== "function") {
      return res
        .status(501)
        .json({ success: false, error: "PreBook not implemented" });
    }

    // Idempotency for prebook
    const redis = require("../services/redisService");
    const idemKey = req.header("Idempotency-Key");
    const idemCacheKey = idemKey ? `idem:tbo:prebook:${idemKey}` : null;
    if (idemCacheKey) {
      const existing = await redis.get(idemCacheKey);
      if (existing?.data) {
        return res.json({ success: true, data: existing.data });
      }
    }

    const data = await adapter.preBookHotel(req.body || {});

    if (idemCacheKey) {
      await redis.setIfNotExists(idemCacheKey, { data }, 600);
    }

    res.json({ success: true, data });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Book
router.post("/book", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.bookHotel !== "function") {
      return res
        .status(501)
        .json({ success: false, error: "Book not implemented" });
    }

    // Idempotency
    const redis = require("../services/redisService");
    const idemKey = req.header("Idempotency-Key");
    const idemCacheKey = idemKey ? `idem:tbo:book:${idemKey}` : null;
    if (idemCacheKey) {
      const existing = await redis.get(idemCacheKey);
      if (existing?.bookingRef && existing?.booking) {
        return res.json({ success: true, data: existing });
      }
    }

    const bookingRes = await adapter.bookHotel(req.body || {});

    // Persist booking (best-effort mapping)
    const db = require("../database/connection");
    const HotelBooking = require("../models/HotelBooking");

    // supplier_id lookup (public.suppliers)
    const sup = await db.query(
      "SELECT id FROM suppliers WHERE LOWER(code) = 'tbo' OR LOWER(name) = 'tbo' LIMIT 1",
    );
    const supplierId = sup.rows?.[0]?.id || null;

    // Generate our booking ref
    const bookingRef = HotelBooking.generateBookingRef();

    // Extract fields defensively from TBO response
    const h = bookingRes.Hotel || bookingRes.Result || {};
    const stay = bookingRes.Stay || {}; // CheckIn/CheckOut if present
    const price = bookingRes.Price || {};

    // Compute nights if possible
    const checkInVal =
      stay.CheckIn || req.body.CheckIn || req.body.checkIn || null;
    const checkOutVal =
      stay.CheckOut || req.body.CheckOut || req.body.checkOut || null;
    let nights = null;
    if (checkInVal && checkOutVal) {
      const inD = new Date(checkInVal);
      const outD = new Date(checkOutVal);
      const diffMs = outD - inD;
      if (!isNaN(diffMs) && diffMs > 0)
        nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    }

    const childrenAges = Array.isArray(req.body.RoomGuests)
      ? req.body.RoomGuests.flatMap((rg) =>
          Array.isArray(rg.ChildAge) ? rg.ChildAge : [],
        )
      : Array.isArray(req.body.childrenAges)
        ? req.body.childrenAges
        : [];

    const payload = {
      booking_ref: bookingRef,
      supplier_id: supplierId,
      supplier_code: "tbo",
      user_id: null,
      hotel_code: String(h.HotelCode || h.Id || req.body.HotelCode || ""),
      hotel_name: h.HotelName || h.Name || "",
      hotel_address: h.Address || "",
      hotel_city: h.CityName || "",
      hotel_country: h.CountryCode || "",
      hotel_rating: h.StarRating || null,
      room_type: h.RoomType || "",
      room_name: h.RoomName || "",
      room_code: h.RoomTypeCode || req.body.RoomTypeCode || "",
      giata_room_type: null,
      max_occupancy: null,
      guest_details: req.body.GuestDetails || {
        primaryGuest: req.body.PassengerDetails || {},
      },
      check_in_date: checkInVal,
      check_out_date: checkOutVal,
      nights,
      rooms_count: Array.isArray(req.body.RoomGuests)
        ? req.body.RoomGuests.length
        : 1,
      adults_count:
        (req.body.RoomGuests || []).reduce(
          (s, r) => s + (r.NoOfAdults || 0),
          0,
        ) ||
        req.body.adults ||
        0 ||
        null,
      children_count:
        (req.body.RoomGuests || []).reduce(
          (s, r) => s + (r.NoOfChild || 0),
          0,
        ) ||
        req.body.children ||
        0 ||
        0,
      children_ages: childrenAges,
      base_price: price.NetFare || price.BasePrice || null,
      markup_amount: null,
      markup_percentage: null,
      taxes: price.Taxes || null,
      fees: null,
      total_amount:
        price.PublishedPrice ||
        price.TotalPrice ||
        req.body.TotalAmount ||
        null,
      currency: price.Currency || req.body.Currency || "INR",
      status: "confirmed",
      supplier_booking_ref:
        bookingRes.BookingId || bookingRes.ConfirmationNo || null,
      supplier_response: bookingRes,
      special_requests: req.body.SpecialRequests || null,
      internal_notes: null,
    };

    const created = await HotelBooking.create(payload);

    // Write booking audit log
    if (created.success && created.data?.id) {
      try {
        await db.query(
          `INSERT INTO booking_audit_log (booking_id, action, changed_by, change_reason)
           VALUES ($1, $2, $3, $4)`,
          [created.data.id, "created", "system", "TBO booking confirmed"],
        );
      } catch (e) {
        console.warn("Booking audit log insert failed", e.message);
      }
    }

    // Cache idempotent response for 10 minutes
    const responsePayload = {
      bookingRef,
      supplier: "TBO",
      booking: created.success ? created.data : null,
      supplierResponse: bookingRes,
    };

    if (idemCacheKey) {
      await redis.setIfNotExists(idemCacheKey, responsePayload, 600);
    }

    if (!created.success) {
      return res.status(500).json({
        success: false,
        error: created.error || "Failed to persist booking",
        data: responsePayload,
      });
    }

    res.json({ success: true, data: responsePayload });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Voucher
router.post("/voucher", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.generateHotelVoucher !== "function") {
      return res
        .status(501)
        .json({ success: false, error: "Voucher not implemented" });
    }

    // Idempotency for voucher generation
    const redis = require("../services/redisService");
    const idemKey = req.header("Idempotency-Key");
    const idemCacheKey = idemKey ? `idem:tbo:voucher:${idemKey}` : null;
    if (idemCacheKey) {
      const existing = await redis.get(idemCacheKey);
      if (existing?.persistedVoucher || existing?.supplierResponse) {
        return res.json({ success: true, data: existing });
      }
    }

    const db = require("../database/connection");
    const Voucher = require("../models/Voucher");
    const HotelBooking = require("../models/HotelBooking");

    // Try to locate booking by booking_ref from body or supplier ref
    let bookingRow = null;
    if (req.body?.booking_ref) {
      const found = await HotelBooking.findByReference(req.body.booking_ref);
      if (found.success) bookingRow = found.data;
    }

    // If not provided by ref, attempt lookup by supplier reference on request
    if (!bookingRow && (req.body?.BookingId || req.body?.ConfirmationNo)) {
      const supplierRef = req.body.BookingId || req.body.ConfirmationNo;
      const result = await db.query(
        "SELECT * FROM hotel_bookings WHERE supplier_booking_ref = $1 ORDER BY created_at DESC LIMIT 1",
        [String(supplierRef)],
      );
      bookingRow = result.rows?.[0] || null;
    }

    // Idempotency: if we already have a latest voucher for this booking, return it
    if (bookingRow) {
      const latest = await Voucher.findLatestByBookingId(bookingRow.id);
      if (latest.success && latest.data) {
        return res.json({
          success: true,
          data: { supplierResponse: null, persistedVoucher: latest.data },
        });
      }
    }

    // Generate supplier voucher now
    const data = await adapter.generateHotelVoucher(req.body || {});

    let voucherSaved = null;
    if (bookingRow) {
      const voucherNumber = new Voucher().generateVoucherNumber(
        bookingRow.booking_ref,
        "hotel",
      );
      voucherSaved = await Voucher.create({
        booking_id: bookingRow.id,
        voucher_type: "hotel",
        voucher_number: voucherNumber,
        pdf_path: null,
        pdf_size_bytes: null,
        email_address: bookingRow.guest_details?.contactInfo?.email || null,
      });
      // Audit: voucher created
      try {
        await db.query(
          `INSERT INTO booking_audit_log (booking_id, action, changed_by, change_reason)
           VALUES ($1, $2, $3, $4)`,
          [bookingRow.id, "updated", "system", "TBO voucher generated"],
        );
      } catch {}
    }

    const payload = {
      supplierResponse: data,
      persistedVoucher: voucherSaved?.data || null,
    };
    if (idemCacheKey) {
      await redis.setIfNotExists(idemCacheKey, payload, 600);
    }

    res.json({ success: true, data: payload });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Get booking by booking_ref (with optional live supplier details)
router.get("/booking/:bookingRef", async (req, res) => {
  try {
    const HotelBooking = require("../models/HotelBooking");
    const Voucher = require("../models/Voucher");
    const adapter = getTboAdapter();

    const bookingRef = req.params.bookingRef;
    const includeLive = req.query.live !== "0";

    const bookingResult = await HotelBooking.findByReference(bookingRef);
    if (!bookingResult.success || !bookingResult.data) {
      return res
        .status(404)
        .json({ success: false, error: "Booking not found" });
    }

    const booking = bookingResult.data;

    // Latest voucher if any
    let latestVoucher = null;
    try {
      const v = await Voucher.findLatestByBookingId(booking.id);
      if (v.success) latestVoucher = v.data;
    } catch {}

    // Optional live details from supplier
    let liveDetails = null;
    if (includeLive && booking.supplier_booking_ref) {
      try {
        // Prefer BookingId; if not numeric, try ConfirmationNo
        const ref = booking.supplier_booking_ref;
        const params = /^\d+$/.test(String(ref))
          ? { BookingId: ref }
          : { ConfirmationNo: ref };
        liveDetails = await adapter.getHotelBookingDetails(params);
      } catch (e) {
        liveDetails = { error: e.message };
      }
    }

    res.json({ success: true, data: { booking, latestVoucher, liveDetails } });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Booking cancel
router.post("/booking/cancel", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.cancelHotelBooking !== "function") {
      return res
        .status(501)
        .json({ success: false, error: "Cancel not implemented" });
    }

    const db = require("../database/connection");
    const HotelBooking = require("../models/HotelBooking");

    // Idempotency for cancel
    const redis = require("../services/redisService");
    const idemKey = req.header("Idempotency-Key");
    const idemCacheKey = idemKey ? `idem:tbo:cancel:${idemKey}` : null;
    if (idemCacheKey) {
      const existing = await redis.get(idemCacheKey);
      if (existing?.data) {
        return res.json({ success: true, data: existing.data });
      }
    }

    const supplierRes = await adapter.cancelHotelBooking(req.body || {});

    // If booking_ref provided, update DB status to cancelled
    if (req.body?.booking_ref) {
      const upd = await HotelBooking.updateStatus(
        req.body.booking_ref,
        "cancelled",
        {
          supplier_response: supplierRes,
        },
      );
      if (!upd.success) {
        console.warn("Cancel status update failed", upd.error);
      } else if (upd.data?.id) {
        try {
          await db.query(
            `INSERT INTO booking_audit_log (booking_id, action, changed_by, change_reason)
             VALUES ($1, $2, $3, $4)`,
            [upd.data.id, "cancelled", "system", "TBO cancellation requested"],
          );
        } catch {}
      }
    }

    // Cache idempotent response for 10 minutes
    if (idemCacheKey) {
      await redis.setIfNotExists(idemCacheKey, { data: supplierRes }, 600);
    }

    res.json({ success: true, data: supplierRes });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Booking details
router.post("/booking/details", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.getHotelBookingDetails !== "function") {
      return res
        .status(501)
        .json({ success: false, error: "Booking details not implemented" });
    }
    const data = await adapter.getHotelBookingDetails(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// QA: list unified hotels for TBO by city
router.get("/unified/hotels", async (req, res) => {
  try {
    const db = require("../database/connection");
    const { city } = req.query;
    const params = [];
    let where = "WHERE supplier_code = 'TBO'";
    if (city) {
      params.push(String(city));
      where += ` AND LOWER(city) = LOWER($${params.length})`;
    }
    const rows = (
      await db.query(
        `SELECT property_id, supplier_hotel_id, hotel_name, city, country, star_rating
         FROM hotel_unified ${where} ORDER BY hotel_name LIMIT 200`,
        params,
      )
    ).rows;
    res.json({ success: true, data: rows });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// QA: list unified room offers for TBO filtered by city and dates
router.get("/unified/offers", async (req, res) => {
  try {
    const db = require("../database/connection");
    const { city, checkin, checkout } = req.query;
    const params = [];
    let where = "WHERE supplier_code = 'TBO'";
    if (city) {
      params.push(String(city));
      where += ` AND LOWER(city) = LOWER($${params.length})`;
    }
    if (checkin) {
      params.push(String(checkin));
      where += ` AND search_checkin = $${params.length}`;
    }
    if (checkout) {
      params.push(String(checkout));
      where += ` AND search_checkout = $${params.length}`;
    }
    const rows = (
      await db.query(
        `SELECT offer_id, property_id, room_name, board_basis, refundable, cancellable_until,
                currency, price_total, price_per_night, availability_count, city, search_checkin, search_checkout
         FROM room_offer_unified ${where}
         ORDER BY price_total ASC
         LIMIT 200`,
        params,
      )
    ).rows;
    res.json({ success: true, data: rows });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Hotel Info
router.post("/info", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.getHotelInfo !== "function") {
      return res
        .status(501)
        .json({ success: false, error: "HotelInfo not implemented" });
    }
    const data = await adapter.getHotelInfo(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Hotel Room
router.post("/room", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.getHotelRoom !== "function") {
      return res
        .status(501)
        .json({ success: false, error: "HotelRoom not implemented" });
    }
    const data = await adapter.getHotelRoom(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Change Request Status
router.post("/change/status", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.getChangeRequestStatus !== "function") {
      return res
        .status(501)
        .json({ success: false, error: "Change status not implemented" });
    }
    const data = await adapter.getChangeRequestStatus(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// Logout (best-effort)
router.post("/logout", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.logoutAll !== "function") {
      return res
        .status(501)
        .json({ success: false, error: "Logout not implemented" });
    }
    const data = await adapter.logoutAll();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get Agency Balance (dedicated)
router.get("/balance", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.resetCircuitBreaker === "function")
      adapter.resetCircuitBreaker();
    const data = await adapter.getAgencyBalance();
    res.json({ success: true, data });
  } catch (e) {
    res
      .status(statusFromErrorCode(e.code))
      .json({ success: false, error: e.message, code: e.code });
  }
});

// HOTEL VALIDATION (server-side request validation)
router.post("/validate", async (req, res) => {
  try {
    const { type = "prebook" } = req.query;
    const body = req.body || {};
    const errors = [];

    const has = (k) =>
      body[k] !== undefined && body[k] !== null && String(body[k]).length > 0;

    if (type === "prebook") {
      if (!has("HotelCode")) errors.push("HotelCode is required");
      if (!(has("RateKey") || has("RatePlanCode")))
        errors.push("RateKey or RatePlanCode is required");
      if (!has("RoomTypeCode") && !has("RoomType"))
        errors.push("RoomTypeCode or RoomType is required");
    } else if (type === "book") {
      if (!(has("BookingId") || has("PreBookId") || has("ConfirmationNo")))
        errors.push("BookingId/PreBookId/ConfirmationNo required");
      if (!has("PassengerDetails") && !has("GuestDetails"))
        errors.push("PassengerDetails or GuestDetails required");
    } else if (type === "voucher") {
      if (!(has("BookingId") || has("ConfirmationNo")))
        errors.push("BookingId or ConfirmationNo required");
    } else if (type === "cancel") {
      if (!(has("BookingId") || has("ConfirmationNo")))
        errors.push("BookingId or ConfirmationNo required");
    } else if (type === "info") {
      if (!has("HotelCode")) errors.push("HotelCode is required");
    } else if (type === "room") {
      if (
        !(
          has("RateKey") ||
          (has("HotelCode") && (has("RoomTypeCode") || has("RoomType")))
        )
      ) {
        errors.push(
          "RateKey or (HotelCode and RoomTypeCode/RoomType) required",
        );
      }
    } else if (type === "change_status") {
      if (
        !has("ChangeRequestId") &&
        !(has("BookingId") || has("ConfirmationNo"))
      ) {
        errors.push("ChangeRequestId or BookingId/ConfirmationNo required");
      }
    }

    res.json({ success: errors.length === 0, errors });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
