#!/usr/bin/env node
const axios = require("axios");
require("dotenv").config({ path: "./src/api/.env" });

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000/api";

async function testScenario8() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 8: International Booking (2 Rooms, Mixed occupancy)");
  console.log("Room 1: 1 Adult + 2 Children | Room 2: 2 Adults");
  console.log(
    "Destination: Paris | Dates: 2026-01-14 to 2026-01-16 | Nationality: CA",
  );
  console.log("=".repeat(80));

  try {
    console.log("\n[Step 1/4] Searching for hotels...");
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

    if (!searchRes.data.success)
      throw new Error("Search failed: " + searchRes.data.error);
    const hotel = searchRes.data.hotels[0];
    const traceId = searchRes.data.traceId;
    console.log(
      `✅ Found ${searchRes.data.hotels.length} hotels | Hotel: ${hotel.hotelName}`,
    );

    console.log("\n[Step 2/4] Getting room details...");
    const roomRes = await axios.post(
      `${API_BASE}/tbo/room`,
      {
        traceId,
        resultIndex: hotel.resultIndex,
        hotelCode: hotel.hotelCode,
        hotelName: hotel.hotelName,
        checkInDate: "2026-01-14",
        checkOutDate: "2026-01-16",
        noOfRooms: 2,
      },
      { timeout: 30000 },
    );

    if (!roomRes.data.success)
      throw new Error("Room details failed: " + roomRes.data.error);
    console.log(`✅ Room details retrieved for 2 rooms`);

    console.log("\n[Step 3/4] Blocking rooms...");
    const blockRes = await axios.post(
      `${API_BASE}/tbo/block`,
      {
        traceId,
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

    if (!blockRes.data.success)
      throw new Error("Block failed: " + blockRes.data.error);
    const bookingId = blockRes.data.bookingId;
    console.log(`✅ Rooms blocked | Booking ID: ${bookingId}`);

    console.log("\n[Step 4/4] Booking hotel...");
    const bookRes = await axios.post(
      `${API_BASE}/tbo/book`,
      {
        traceId,
        resultIndex: hotel.resultIndex,
        hotelCode: hotel.hotelCode,
        hotelName: hotel.hotelName,
        bookingId,
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
            Email: "robert.johnson@example.ca",
            Phoneno: "+14165551234",
          },
          {
            Title: "Master",
            FirstName: "Tyler",
            LastName: "Johnson",
            PaxType: 2,
            Age: 5,
            Nationality: "CA",
            Email: "robert.johnson@example.ca",
            Phoneno: "+14165551234",
          },
          {
            Title: "Miss",
            FirstName: "Jessica",
            LastName: "Johnson",
            PaxType: 2,
            Age: 9,
            Nationality: "CA",
            Email: "robert.johnson@example.ca",
            Phoneno: "+14165551234",
          },
          {
            Title: "Mr",
            FirstName: "Christopher",
            LastName: "Brown",
            PaxType: 1,
            Nationality: "CA",
            Email: "christopher.brown@example.ca",
            Phoneno: "+14165551235",
          },
          {
            Title: "Mrs",
            FirstName: "Jennifer",
            LastName: "Brown",
            PaxType: 1,
            Nationality: "CA",
            Email: "jennifer.brown@example.ca",
            Phoneno: "+14165551236",
          },
        ],
      },
      { timeout: 30000 },
    );

    if (!bookRes.data.success)
      throw new Error("Book failed: " + bookRes.data.error);
    console.log(`✅ Hotel booked successfully!`);
    console.log(`   Confirmation #: ${bookRes.data.confirmationNo}`);

    console.log("\n✅ SCENARIO 8 PASSED\n");
    return {
      scenario: 8,
      status: "PASSED",
      confirmationNo: bookRes.data.confirmationNo,
    };
  } catch (error) {
    console.error("\n❌ SCENARIO 8 FAILED");
    console.error("Error:", error.response?.data || error.message);
    return { scenario: 8, status: "FAILED", error: error.message };
  }
}

testScenario8().then((result) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "PASSED" ? 0 : 1);
});
