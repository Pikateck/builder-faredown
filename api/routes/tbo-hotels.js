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

// Health
router.get("/health", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    const status = await adapter.performHealthCheck();
    res.json({ success: true, data: status });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Search
router.post("/search", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    const results = await adapter.searchHotels(req.body || {});
    res.json({ success: true, data: results });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
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
    res.status(500).json({ success: false, error: e.message });
  }
});

// Book
router.post("/book", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.bookHotel !== "function") {
      return res.status(501).json({ success: false, error: "Book not implemented" });
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
      check_in_date: stay.CheckIn || req.body.CheckIn || req.body.checkIn || null,
      check_out_date: stay.CheckOut || req.body.CheckOut || req.body.checkOut || null,
      nights: null,
      rooms_count: Array.isArray(req.body.RoomGuests) ? req.body.RoomGuests.length : 1,
      adults_count: (req.body.RoomGuests || []).reduce((s,r)=>s+(r.NoOfAdults||0),0) || (req.body.adults||0) || null,
      children_count: (req.body.RoomGuests || []).reduce((s,r)=>s+(r.NoOfChild||0),0) || (req.body.children||0) || 0,
      children_ages: [],
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

    res.json({ success: true, data: { bookingRef, supplier: "TBO", booking: created.data, supplierResponse: bookingRes } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Voucher
router.post("/voucher", async (req, res) => {
  try {
    const adapter = getTboAdapter();
    if (typeof adapter.generateHotelVoucher !== "function") {
      return res.status(501).json({ success: false, error: "Voucher not implemented" });
    }
    const data = await adapter.generateHotelVoucher(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
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
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
