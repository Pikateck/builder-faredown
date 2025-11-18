#!/usr/bin/env node
const axios = require("axios");
require("dotenv").config();
const API_BASE = process.env.API_BASE_URL || "http://localhost:3000/api";

async function testScenario7() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 7: International (Paris, 2 Rooms, 1A each, AU)");
  console.log("=".repeat(80));
  try {
    const searchRes = await axios.post(
      `${API_BASE}/tbo/search`,
      {
        destination: "Paris",
        cityId: 3,
        countryCode: "FR",
        checkIn: "2026-01-11",
        checkOut: "2026-01-13",
        rooms: [
          { adults: 1, children: 0, childAges: [] },
          { adults: 1, children: 0, childAges: [] },
        ],
        currency: "EUR",
        guestNationality: "AU",
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
        checkInDate: "2026-01-11",
        checkOutDate: "2026-01-13",
        noOfRooms: 2,
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
        guestNationality: "AU",
        noOfRooms: 2,
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
        guestNationality: "AU",
        noOfRooms: 2,
        isVoucherBooking: true,
        hotelRoomDetails: blockRes.data.hotelRoomDetails,
        hotelPassenger: [
          {
            Title: "Mr",
            FirstName: "Michael",
            LastName: "Thompson",
            PaxType: 1,
            Nationality: "AU",
            Email: "michael@example.com.au",
            Phoneno: "+61291234567",
          },
          {
            Title: "Mr",
            FirstName: "David",
            LastName: "Miller",
            PaxType: 1,
            Nationality: "AU",
            Email: "david@example.com.au",
            Phoneno: "+61291234568",
          },
        ],
      },
      { timeout: 30000 },
    );
    if (!bookRes.data.success) throw new Error("Book failed");
    console.log(`✅ Booked! Confirmation: ${bookRes.data.confirmationNo}`);
    console.log("\n✅ SCENARIO 7 PASSED\n");
    return {
      scenario: 7,
      status: "PASSED",
      confirmationNo: bookRes.data.confirmationNo,
    };
  } catch (error) {
    console.error("❌ SCENARIO 7 FAILED:", error.message);
    return { scenario: 7, status: "FAILED", error: error.message };
  }
}
testScenario7().then((result) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "PASSED" ? 0 : 1);
});
