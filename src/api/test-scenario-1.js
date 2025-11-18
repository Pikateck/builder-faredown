#!/usr/bin/env node
const { authenticateTBO } = require("../tbo/auth");
const { getCityId } = require("../tbo/static");
const { searchHotels } = require("../tbo/search");
const { getHotelRoom } = require("../tbo/room");
const { blockRoom, bookHotel } = require("../tbo/book");

async function testScenario1() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 1: Domestic (Mumbai, 1 Adult)");
  console.log("=".repeat(80));

  try {
    console.log("\nStep 1: Authenticating...");
    const authResult = await authenticateTBO();
    if (!authResult?.TokenId) throw new Error("Auth failed");
    const tokenId = authResult.TokenId;
    console.log("✅ Authenticated");

    console.log("Step 2: Getting CityId for Mumbai...");
    const cityId = await getCityId("Mumbai", "IN", tokenId);
    if (!cityId) throw new Error("Mumbai not found");
    console.log("✅ CityId:", cityId);

    console.log("Step 3: Searching hotels...");
    const searchResult = await searchHotels({
      destination: "Mumbai",
      countryCode: "IN",
      checkIn: "2025-12-20",
      checkOut: "2025-12-22",
      guestNationality: "IN",
      rooms: [{ adults: 1, children: 0, childAges: [] }],
      currency: "INR",
    });
    if (!searchResult?.hotels?.length) throw new Error("No hotels found");
    const hotel = searchResult.hotels[0];
    console.log(`✅ Found ${searchResult.hotels.length} hotels`);

    console.log("Step 4: Getting room details...");
    const roomResult = await getHotelRoom({
      traceId: searchResult.traceId,
      resultIndex: hotel.ResultIndex,
      hotelCode: hotel.HotelCode,
    });
    if (!roomResult?.rooms?.length) throw new Error("No rooms found");
    console.log("✅ Room details retrieved");

    console.log("Step 5: Blocking room...");
    const blockResult = await blockRoom({
      traceId: searchResult.traceId,
      resultIndex: hotel.ResultIndex,
      hotelCode: hotel.HotelCode,
      hotelName: hotel.HotelName,
      guestNationality: "IN",
      noOfRooms: 1,
      hotelRoomDetails: roomResult.rooms,
      isVoucherBooking: true,
    });
    if (!blockResult?.responseStatus) throw new Error("Block failed");
    console.log("✅ Room blocked");

    console.log("Step 6: Booking...");
    const bookResult = await bookHotel({
      traceId: searchResult.traceId,
      resultIndex: hotel.ResultIndex,
      hotelCode: hotel.HotelCode,
      hotelName: hotel.HotelName,
      guestNationality: "IN",
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelRoomDetails: blockResult.hotelRoomDetails,
      hotelPassenger: [
        {
          Title: "Mr",
          FirstName: "Rajesh",
          LastName: "Kumar",
          PaxType: 1,
          Nationality: "IN",
          Email: "rajesh@example.com",
          Phoneno: "+919876543210",
          AddressLine1: "Test Address",
          City: "Mumbai",
          CountryCode: "IN",
          CountryName: "India",
        },
      ],
    });
    if (!bookResult?.bookingId) throw new Error("Book failed");
    const confirmationNo = bookResult.confirmationNo || bookResult.bookingId;
    console.log(`✅ PASSED | Confirmation: ${confirmationNo}`);

    return { scenario: 1, status: "PASSED", confirmationNo };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return { scenario: 1, status: "FAILED", error: error.message };
  }
}

testScenario1().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
