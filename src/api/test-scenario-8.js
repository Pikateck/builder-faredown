#!/usr/bin/env node
const axios = require("axios");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const API_BASE = process.env.API_BASE_URL || "http://localhost:3000/api";

async function testScenario8() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 8: International (Paris, 2R mixed 1A+2C+2A, CA)");
  console.log("=".repeat(80));
  try {
    const searchRes = await axios.post(
      `${API_BASE}/tbo/search`,
      {
        destination: "Paris",
        cityId: 3,
        countryCode: "FR",
        checkIn: "2026-01-14",
        checkOut: "2026-01-16",
        rooms: [
          { adults: 1, children: 2, childAges: [5, 9] },
          { adults: 2, children: 0, childAges: [] },
        ],
        currency: "EUR",
        guestNationality: "CA",
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
        checkInDate: "2026-01-14",
        checkOutDate: "2026-01-16",
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
        guestNationality: "CA",
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
        guestNationality: "CA",
        noOfRooms: 2,
        isVoucherBooking: true,
        hotelRoomDetails: blockRes.data.hotelRoomDetails,
        hotelPassenger: [
          {
            Title: "Mr",
            FirstName: "Robert",
            LastName: "Johnson",
            PaxType: 1,
            Nationality: "CA",
            Email: "robert@example.ca",
            Phoneno: "+14165551234",
          },
          {
            Title: "Master",
            FirstName: "Tyler",
            LastName: "Johnson",
            PaxType: 2,
            Age: 5,
            Nationality: "CA",
            Email: "robert@example.ca",
            Phoneno: "+14165551234",
          },
          {
            Title: "Miss",
            FirstName: "Jessica",
            LastName: "Johnson",
            PaxType: 2,
            Age: 9,
            Nationality: "CA",
            Email: "robert@example.ca",
            Phoneno: "+14165551234",
          },
          {
            Title: "Mr",
            FirstName: "Christopher",
            LastName: "Brown",
            PaxType: 1,
            Nationality: "CA",
            Email: "christopher@example.ca",
            Phoneno: "+14165551235",
          },
          {
            Title: "Mrs",
            FirstName: "Jennifer",
            LastName: "Brown",
            PaxType: 1,
            Nationality: "CA",
            Email: "jennifer@example.ca",
            Phoneno: "+14165551236",
          },
        ],
      },
      { timeout: 30000 },
    );
    if (!bookRes.data.success) throw new Error("Book failed");
    console.log(`✅ Booked! Confirmation: ${bookRes.data.confirmationNo}`);
    return {
      scenario: 8,
      status: "PASSED",
      confirmationNo: bookRes.data.confirmationNo,
    };
  } catch (error) {
    console.error("❌ FAILED:", error.message);
    return { scenario: 8, status: "FAILED", error: error.message };
  }
}
testScenario8().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
