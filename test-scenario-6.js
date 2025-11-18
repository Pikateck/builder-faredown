#!/usr/bin/env node
const axios = require("axios");
require("dotenv").config();
const API_BASE = process.env.API_BASE_URL || "http://localhost:3000/api";

async function testScenario6() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 6: International (Paris, 2 Adults + 2 Children, GB)");
  console.log("=".repeat(80));
  try {
    const searchRes = await axios.post(
      `${API_BASE}/tbo/search`,
      {
        destination: "Paris",
        cityId: 3,
        countryCode: "FR",
        checkIn: "2026-01-08",
        checkOut: "2026-01-10",
        rooms: [{ adults: 2, children: 2, childAges: [7, 11] }],
        currency: "EUR",
        guestNationality: "GB",
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
        checkInDate: "2026-01-08",
        checkOutDate: "2026-01-10",
        noOfRooms: 1,
      },
      { timeout: 30000 },
    );
    if (!roomRes.data.success) throw new Error("Room failed");
    const blockRes = await axios.post(
      `${API_BASE}/tbo/block`,
      {
        traceId: searchRes.data.traceId,
        resultIndex: hotel.resultIndex,
        hotelCode: hotel.hotelCode,
        hotelName: hotel.hotelName,
        guestNationality: "GB",
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
        guestNationality: "GB",
        noOfRooms: 1,
        isVoucherBooking: true,
        hotelRoomDetails: blockRes.data.hotelRoomDetails,
        hotelPassenger: [
          {
            Title: "Mr",
            FirstName: "James",
            LastName: "Wilson",
            PaxType: 1,
            Nationality: "GB",
            Email: "james@example.co.uk",
            Phoneno: "+442071838750",
          },
          {
            Title: "Mrs",
            FirstName: "Sarah",
            LastName: "Wilson",
            PaxType: 1,
            Nationality: "GB",
            Email: "sarah@example.co.uk",
            Phoneno: "+442071838750",
          },
          {
            Title: "Master",
            FirstName: "Oliver",
            LastName: "Wilson",
            PaxType: 2,
            Age: 7,
            Nationality: "GB",
            Email: "james@example.co.uk",
            Phoneno: "+442071838750",
          },
          {
            Title: "Miss",
            FirstName: "Emma",
            LastName: "Wilson",
            PaxType: 2,
            Age: 11,
            Nationality: "GB",
            Email: "james@example.co.uk",
            Phoneno: "+442071838750",
          },
        ],
      },
      { timeout: 30000 },
    );
    if (!bookRes.data.success) throw new Error("Book failed");
    console.log(`✅ PASSED | Confirmation: ${bookRes.data.confirmationNo}`);
    return {
      scenario: 6,
      status: "PASSED",
      confirmationNo: bookRes.data.confirmationNo,
    };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return { scenario: 6, status: "FAILED", error: error.message };
  }
}
testScenario6().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
