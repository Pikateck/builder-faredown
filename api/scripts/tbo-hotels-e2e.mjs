#!/usr/bin/env node
/**
 * TBO Hotels E2E QA Runner
 * Covers: Health, Static Data (countries/cities/hotel codes/details/top destinations),
 * Search → PreBook → (optional Book/Voucher/Cancel) → Booking Details → Change Status
 *
 * Usage:
 *   node api/scripts/tbo-hotels-e2e.mjs
 * Env:
 *   API_BASE: override API base (default from .env or fallback)
 *   CITY=DXB CHECKIN=2026-01-12 CHECKOUT=2026-01-15 CURRENCY=INR NATIONALITY=IN
 *   ALLOW_LIVE_BOOK=true to run book/voucher/cancel
 */

import fetch from "node-fetch";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const API_BASE = process.env.API_BASE || process.env.API_SERVER_URL || "https://builder-faredown-pricing.onrender.com";
let BASE = `${API_BASE}/api`;
const CITY = process.env.CITY || "DXB";
const CHECKIN = process.env.CHECKIN || "2026-01-12";
const CHECKOUT = process.env.CHECKOUT || "2026-01-15";
const CURRENCY = process.env.CURRENCY || "INR";
const NATIONALITY = process.env.NATIONALITY || "IN";
const ALLOW_LIVE_BOOK = String(process.env.ALLOW_LIVE_BOOK || "false").toLowerCase() === "true";

function log(section, ok, extra = {}) {
  const ts = new Date().toISOString();
  console.log(JSON.stringify({ ts, section, ok, ...extra }));
}

async function post(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(`POST ${url} failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json.data ?? json;
}

async function get(url) {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(`GET ${url} failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json.data ?? json;
}

async function run() {
  log("config", true, { BASE, CITY, CHECKIN, CHECKOUT, CURRENCY, NATIONALITY, ALLOW_LIVE_BOOK });

  // 1. Health (with fallback to localhost API if necessary)
  try {
    await get(`${BASE}/tbo-hotels/health`);
  } catch (e) {
    // Fallback to localhost api if production proxy doesn't have new routes yet
    BASE = `http://localhost:${process.env.PORT || 3001}/api`;
    await get(`${BASE}/tbo-hotels/health`);
  }
  log("health", true, { base: BASE });

  // 2. Static: countries, cities, hotel codes, hotel details, top destinations
  const countries = await get(`${BASE}/tbo-hotels-static/countries`);
  log("static:countries", Array.isArray(countries), { count: countries.length });

  const cities = await get(`${BASE}/tbo-hotels-static/cities/AE`);
  log("static:cities", Array.isArray(cities), { count: cities.length });

  const codes = await get(`${BASE}/tbo-hotels-static/hotels/${CITY}`);
  log("static:hotelcodes", Array.isArray(codes), { count: codes.length });

  if (codes[0]?.HotelCode || codes[0]?.Code) {
    const code = String(codes[0].HotelCode || codes[0].Code);
    const hotel = await get(`${BASE}/tbo-hotels-static/hotel/${code}`);
    log("static:hotelDetails", !!hotel);
  } else {
    log("static:hotelDetails", true, { note: "no codes to test details" });
  }

  const topDest = await get(`${BASE}/tbo-hotels-static/top-destinations`);
  log("static:topdestinations", Array.isArray(topDest));

  // 3. Search
  const searchRes = await post(`${BASE}/tbo-hotels/search`, {
    destination: CITY,
    checkIn: CHECKIN,
    checkOut: CHECKOUT,
    currency: CURRENCY,
    guestNationality: NATIONALITY,
    rooms: [{ adults: 2, children: 0, childAges: [] }],
  });
  log("search", Array.isArray(searchRes), { hotels: searchRes.length });

  // 4. HotelInfo/Room if possible
  if (searchRes[0]) {
    const sample = searchRes[0];
    if (sample.hotelId) {
      await post(`${BASE}/tbo-hotels/info`, { HotelCode: sample.hotelId });
      log("info", true);
    } else {
      log("info", true, { note: "missing hotelId" });
    }

    const firstRate = sample.rates?.[0];
    if (firstRate?.rateKey) {
      await post(`${BASE}/tbo-hotels/room`, { RateKey: firstRate.rateKey });
      log("room", true);
    } else {
      log("room", true, { note: "no rateKey in sample" });
    }
  }

  // 5. PreBook
  let preBookData = null;
  if (searchRes[0]?.rates?.[0]) {
    const r = searchRes[0].rates[0];
    preBookData = await post(`${BASE}/tbo-hotels/prebook`, {
      HotelCode: searchRes[0].hotelId,
      RateKey: r.rateKey,
      RoomTypeCode: searchRes[0].roomCode || r.roomType,
    }, { "Idempotency-Key": `qa-prebook-${Date.now()}` });
    log("prebook", !!preBookData);
  }

  // 6. Book/Voucher/Cancel (optional)
  let bookingRef = null; let bookingId = null; let confirmationNo = null;
  if (ALLOW_LIVE_BOOK && preBookData) {
    const bookRes = await post(`${BASE}/tbo-hotels/book`, {
      BookingId: preBookData.BookingId || preBookData.PreBookId || preBookData.Id,
      PassengerDetails: { Title: "Mr", FirstName: "QA", LastName: "Runner" }
    }, { "Idempotency-Key": `qa-book-${Date.now()}` });
    log("book", !!bookRes?.booking);

    bookingRef = bookRes?.booking?.booking_ref || null;
    bookingId = bookRes?.supplierResponse?.BookingId || null;
    confirmationNo = bookRes?.supplierResponse?.ConfirmationNo || null;

    const voucherRes = await post(`${BASE}/tbo-hotels/voucher`, {
      BookingId: bookingId, ConfirmationNo: confirmationNo, booking_ref: bookingRef
    }, { "Idempotency-Key": `qa-voucher-${Date.now()}` });
    log("voucher", !!voucherRes);

    const details = await post(`${BASE}/tbo-hotels/booking/details`, {
      BookingId: bookingId, ConfirmationNo: confirmationNo
    });
    log("booking:details", !!details);

    const cancel = await post(`${BASE}/tbo-hotels/booking/cancel`, {
      BookingId: bookingId, ConfirmationNo: confirmationNo, booking_ref: bookingRef
    }, { "Idempotency-Key": `qa-cancel-${Date.now()}` });
    log("booking:cancel", !!cancel);

    // Change status if id present
    const changeId = cancel?.Response?.ChangeRequestId || cancel?.ChangeRequestId;
    if (changeId) {
      const ch = await post(`${BASE}/tbo-hotels/change/status`, { ChangeRequestId: changeId, BookingId: bookingId });
      log("change:status", !!ch);
    } else {
      log("change:status", true, { note: "no change id returned" });
    }
  } else {
    log("book|voucher|cancel", true, { skipped: true });
  }

  // 7. Validation
  const valid = await post(`${BASE}/tbo-hotels/validate?type=prebook`, { HotelCode: "123", RateKey: "abc" });
  log("validation", valid.success === true);

  // 8. Balance
  const bal = await get(`${BASE}/tbo-hotels/balance`);
  log("balance", !!bal);

  console.log("E2E QA finished");
}

run().catch((e) => {
  console.error("QA failed:", e.message);
  process.exit(1);
});
