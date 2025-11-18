#!/usr/bin/env node
const axios = require("axios");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const API_BASE = process.env.API_BASE_URL || "http://localhost:3000/api";

async function testScenario5() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 5: International (Paris, 1A, US)");
  console.log("=".repeat(80));
  try {
    const searchRes = await axios.post(
      `${API_BASE}/tbo/search`,
      {
        destination: "Paris",
        cityId: 3,
        countryCode: "FR",
        checkIn: "2026-01-05",
        checkOut: "2026-01-07",
        rooms: [{ adults: 1, children: 0, childAges: [] }],
        currency: "EUR",
        guestNationality: "US",
      },
      { timeout: 30000 },
    );
    if (!searchRes.data.success) throw new Error("Search failed");
    const hotel = searchRes.data.hotels[0];
    const roomRes = await axios.post(
      `${API_BASE}/tbo/room`,
      {
        traceId: searchRes.data.traceId,
        resultIndex: hotel.resultIndex,
        hotelCode: hotel.hotelCode,
        hotelName: hotel.hotelName,
        checkInDate: "2026-01-05",
        checkOutDate: "2026-01-07",
        noOfRooms: 1,
      },
      { timeout: 30000 },
    );
    if (!roomRes.data.success) throw new Error("Room details failed");
    const blockRes = await axios.post(
      `${API_BASE}/tbo/block`,
      {
        traceId: searchRes.data.traceId,
        resultIndex: hotel.resultIndex,
        hotelCode: hotel.hotelCode,
        hotelName: hotel.hotelName,
        guestNationality: "US",
        noOfRooms: 1,
        isVoucherBooking: true,
        hotelRoomDetails: roomRes.data.hotelRoomDetails,
      },
      { timeout: 30000 },
    );
    if (!blockRes.data.success) throw new Error("Block failed");
    const bookRes = await axios.post(
      `${API_BASE}/tbo/book`,
      {
        traceId: searchRes.data.traceId,
        resultIndex: hotel.resultIndex,
        hotelCode: hotel.hotelCode,
        hotelName: hotel.hotelName,
        bookingId: blockRes.data.bookingId,
        guestNationality: "US",
        noOfRooms: 1,
        isVoucherBooking: true,
        hotelRoomDetails: blockRes.data.hotelRoomDetails,
        hotelPassenger: [
          {
            Title: "Mr",
            FirstName: "John",
            LastName: "Smith",
            PaxType: 1,
            Nationality: "US",
            Email: "john@example.com",
            Phoneno: "+12025551234",
          },
        ],
      },
      { timeout: 30000 },
    );
    if (!bookRes.data.success) throw new Error("Book failed");
    console.log(`✅ Booked! Confirmation: ${bookRes.data.confirmationNo}`);
    return {
      scenario: 5,
      status: "PASSED",
      confirmationNo: bookRes.data.confirmationNo,
    };
  } catch (error) {
    console.error("❌ FAILED:", error.message);
    return { scenario: 5, status: "FAILED", error: error.message };
  }
}
testScenario5().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
