#!/usr/bin/env node
const axios = require("axios");
require("dotenv").config();
const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";

// Add axios interceptor to log requests
axios.interceptors.request.use(request => {
  console.log('Request:', request.method.toUpperCase(), request.url);
  return request;
});

async function testScenario1() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 1: Domestic (Mumbai, 1 Adult)");
  console.log("=".repeat(80));
  try {
    console.log("Step 1: Searching hotels...");
    const searchRes = await axios.post(
      `${API_BASE}/api/tbo/search`,
      {
        destination: "Mumbai",
        countryCode: "IN",
        checkIn: "2025-12-20",
        checkOut: "2025-12-22",
        rooms: [{ adults: 1, children: 0, childAges: [] }],
        currency: "INR",
        guestNationality: "IN",
      },
      { timeout: 60000 },
    );
    if (!searchRes.data.success) throw new Error("Search failed");
    if (!searchRes.data.hotels || searchRes.data.hotels.length === 0) {
      throw new Error("No hotels found");
    }
    const hotel = searchRes.data.hotels[0];
    console.log(`✅ Found ${searchRes.data.hotels.length} hotels. Selected: ${hotel.HotelName}`);

    console.log("Step 2: Getting room details...");
    const roomRes = await axios.post(
      `${API_BASE}/api/tbo/room`,
      {
        traceId: searchRes.data.traceId,
        resultIndex: hotel.ResultIndex,
        hotelCode: hotel.HotelCode,
        hotelName: hotel.HotelName,
        checkInDate: "2025-12-20",
        checkOutDate: "2025-12-22",
        noOfRooms: 1,
      },
      { timeout: 60000 },
    );
    if (!roomRes.data.success) throw new Error("Room failed");
    console.log("✅ Room details retrieved");
    console.log("Room response keys:", Object.keys(roomRes.data));

    console.log("Step 3: Blocking room...");
    const blockRes = await axios.post(
      `${API_BASE}/api/tbo/block`,
      {
        traceId: searchRes.data.traceId,
        resultIndex: hotel.ResultIndex,
        hotelCode: hotel.HotelCode,
        hotelName: hotel.HotelName,
        guestNationality: "IN",
        noOfRooms: 1,
        isVoucherBooking: true,
        hotelRoomDetails: [roomRes.data.rooms[0]],
      },
      { timeout: 60000 },
    );
    if (!blockRes.data.success) throw new Error("Block failed");
    console.log("✅ Room blocked successfully");
    console.log("Block response keys:", Object.keys(blockRes.data));
    console.log("Block hotelRoomDetails exists:", !!blockRes.data.hotelRoomDetails);

    console.log("Step 4: Booking...");
    const bookRes = await axios.post(
      `${API_BASE}/api/tbo/book`,
      {
        traceId: searchRes.data.traceId,
        resultIndex: hotel.ResultIndex,
        hotelCode: hotel.HotelCode,
        hotelName: hotel.HotelName,
        bookingId: blockRes.data.bookingId,
        guestNationality: "IN",
        noOfRooms: 1,
        isVoucherBooking: true,
        hotelRoomDetails: blockRes.data.hotelRoomDetails,
        hotelPassenger: [
          {
            Title: "Mr",
            FirstName: "Rajesh",
            LastName: "Kumar",
            PaxType: 1,
            Nationality: "IN",
            Email: "rajesh@example.com",
            Phoneno: "+919876543210",
          },
        ],
      },
      { timeout: 30000 },
    );
    if (!bookRes.data.success) throw new Error("Book failed");
    console.log(`✅ PASSED | Confirmation: ${bookRes.data.confirmationNo}`);
    return {
      scenario: 1,
      status: "PASSED",
      confirmationNo: bookRes.data.confirmationNo,
    };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    if (error.response?.data) {
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    return {
      scenario: 1,
      status: "FAILED",
      error: error.message,
      details: error.response?.data
    };
  }
}
testScenario1().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
