#!/usr/bin/env node
const { authenticateTBO } = require("../tbo/auth");
const { getCityId } = require("../tbo/static");
const { searchHotels } = require("../tbo/search");
const { getHotelRoom } = require("../tbo/room");
const { blockRoom, bookHotel } = require("../tbo/book");

async function testScenario3() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 3: Domestic (Mumbai, 2 Rooms 1 Adult each)");
  console.log("=".repeat(80));

  try {
    const tokenId = (await authenticateTBO()).TokenId;
    const cityId = await getCityId("Mumbai", "IN", tokenId);
    if (!cityId) throw new Error("Mumbai not found");

    const searchResult = await searchHotels({
      destination: "Mumbai",
      countryCode: "IN",
      checkIn: "2025-12-26",
      checkOut: "2025-12-28",
      guestNationality: "IN",
      rooms: [
        { adults: 1, children: 0, childAges: [] },
        { adults: 1, children: 0, childAges: [] },
      ],
      currency: "INR",
    });
    if (!searchResult?.hotels?.length) throw new Error("No hotels found");
    const hotel = searchResult.hotels[0];

    const roomResult = await getHotelRoom({
      traceId: searchResult.traceId,
      resultIndex: hotel.ResultIndex,
      hotelCode: hotel.HotelCode,
    });
    if (!roomResult?.rooms?.length) throw new Error("No rooms found");

    const blockResult = await blockRoom({
      traceId: searchResult.traceId,
      resultIndex: hotel.ResultIndex,
      hotelCode: hotel.HotelCode,
      hotelName: hotel.HotelName,
      guestNationality: "IN",
      noOfRooms: 2,
      hotelRoomDetails: roomResult.rooms,
      isVoucherBooking: true,
    });
    if (!blockResult?.responseStatus) throw new Error("Block failed");

    const bookResult = await bookHotel({
      traceId: searchResult.traceId,
      resultIndex: hotel.ResultIndex,
      hotelCode: hotel.HotelCode,
      hotelName: hotel.HotelName,
      guestNationality: "IN",
      noOfRooms: 2,
      isVoucherBooking: true,
      hotelRoomDetails: blockResult.hotelRoomDetails,
      hotelPassenger: [
        {
          Title: "Mr",
          FirstName: "Vikram",
          LastName: "Patel",
          PaxType: 1,
          Nationality: "IN",
          Email: "vikram@example.com",
          Phoneno: "+919876543212",
          AddressLine1: "Test Address",
          City: "Mumbai",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mr",
          FirstName: "Rohan",
          LastName: "Sharma",
          PaxType: 1,
          Nationality: "IN",
          Email: "rohan@example.com",
          Phoneno: "+919876543213",
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
    return { scenario: 3, status: "PASSED", confirmationNo };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return { scenario: 3, status: "FAILED", error: error.message };
  }
}

testScenario3().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
