/**
 * TBO Hotels Routes (Live)
 * Search → PreBook → Book → Voucher → BookingDetails/Change
 */

const express = require("express");
const router = express.Router();
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");

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
    res.status(statusFromErrorCode(e.code)).json({ success: false, error: e.message, code: e.code });
  }
});

// Search
router.post("/search", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    const results = await adapter.searchHotels(req.body || {});
    res.json({ success: true, data: results });
  } catch (e) {
    res.status(statusFromErrorCode(e.code)).json({ success: false, error: e.message, code: e.code });
  }
});

// PreBook
router.post("/prebook", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.preBookHotel !== "function") {
      return res.status(501).json({ success: false, error: "PreBook not implemented" });
    }
    const data = await adapter.preBookHotel(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res.status(statusFromErrorCode(e.code)).json({ success: false, error: e.message, code: e.code });
  }
});

// Book
router.post("/book", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.bookHotel !== "function") {
      return res.status(501).json({ success: false, error: "Book not implemented" });
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
    const checkInVal = stay.CheckIn || req.body.CheckIn || req.body.checkIn || null;
    const checkOutVal = stay.CheckOut || req.body.CheckOut || req.body.checkOut || null;
    let nights = null;
    if (checkInVal && checkOutVal) {
      const inD = new Date(checkInVal);
      const outD = new Date(checkOutVal);
      const diffMs = outD - inD;
      if (!isNaN(diffMs) && diffMs > 0) nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    }

    const childrenAges = Array.isArray(req.body.RoomGuests)
      ? req.body.RoomGuests.flatMap((rg) => Array.isArray(rg.ChildAge) ? rg.ChildAge : [])
      : Array.isArray(req.body.childrenAges) ? req.body.childrenAges : [];

    const payload = {
      booking_ref: bookingRef,
      supplier_id: supplierId,
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
      guest_details: req.body.GuestDetails || { primaryGuest: req.body.PassengerDetails || {} },
      check_in_date: checkInVal,
      check_out_date: checkOutVal,
      nights,
      rooms_count: Array.isArray(req.body.RoomGuests) ? req.body.RoomGuests.length : 1,
      adults_count: (req.body.RoomGuests || []).reduce((s,r)=>s+(r.NoOfAdults||0),0) || (req.body.adults||0) || null,
      children_count: (req.body.RoomGuests || []).reduce((s,r)=>s+(r.NoOfChild||0),0) || (req.body.children||0) || 0,
      children_ages: childrenAges,
      base_price: price.NetFare || price.BasePrice || null,
      markup_amount: null,
      markup_percentage: null,
      taxes: price.Taxes || null,
      fees: null,
      total_amount: price.PublishedPrice || price.TotalPrice || req.body.TotalAmount || null,
      currency: price.Currency || req.body.Currency || "INR",
      status: "confirmed",
      supplier_booking_ref: bookingRes.BookingId || bookingRes.ConfirmationNo || null,
      supplier_response: bookingRes,
      special_requests: req.body.SpecialRequests || null,
      internal_notes: null,
    };

    const created = await HotelBooking.create(payload);

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
      return res.status(500).json({ success: false, error: created.error || "Failed to persist booking", data: responsePayload });
    }

    res.json({ success: true, data: responsePayload });
  } catch (e) {
    res.status(statusFromErrorCode(e.code)).json({ success: false, error: e.message, code: e.code });
  }
});

// Voucher
router.post("/voucher", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.generateHotelVoucher !== "function") {
      return res.status(501).json({ success: false, error: "Voucher not implemented" });
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
        return res.json({ success: true, data: { supplierResponse: null, persistedVoucher: latest.data } });
      }
    }

    // Generate supplier voucher now
    const data = await adapter.generateHotelVoucher(req.body || {});

    let voucherSaved = null;
    if (bookingRow) {
      const voucherNumber = new Voucher().generateVoucherNumber(bookingRow.booking_ref, "hotel");
      voucherSaved = await Voucher.create({
        booking_id: bookingRow.id,
        voucher_type: "hotel",
        voucher_number: voucherNumber,
        pdf_path: null,
        pdf_size_bytes: null,
        email_address: bookingRow.guest_details?.contactInfo?.email || null,
      });
    }

    res.json({ success: true, data: { supplierResponse: data, persistedVoucher: voucherSaved?.data || null } });
  } catch (e) {
    res.status(statusFromErrorCode(e.code)).json({ success: false, error: e.message, code: e.code });
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
      return res.status(404).json({ success: false, error: "Booking not found" });
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
        const params = /^\d+$/.test(String(ref)) ? { BookingId: ref } : { ConfirmationNo: ref };
        liveDetails = await adapter.getHotelBookingDetails(params);
      } catch (e) {
        liveDetails = { error: e.message };
      }
    }

    res.json({ success: true, data: { booking, latestVoucher, liveDetails } });
  } catch (e) {
    res.status(statusFromErrorCode(e.code)).json({ success: false, error: e.message, code: e.code });
  }
});

// Booking details
router.post("/booking/details", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.getHotelBookingDetails !== "function") {
      return res.status(501).json({ success: false, error: "Booking details not implemented" });
    }
    const data = await adapter.getHotelBookingDetails(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res.status(statusFromErrorCode(e.code)).json({ success: false, error: e.message, code: e.code });
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
    res.status(statusFromErrorCode(e.code)).json({ success: false, error: e.message, code: e.code });
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
    res.status(statusFromErrorCode(e.code)).json({ success: false, error: e.message, code: e.code });
  }
});

module.exports = router;
