#!/usr/bin/env node
const { authenticateTBO } = require("../tbo/auth");
const { getCityId } = require("../tbo/static");
const { searchHotels } = require("../tbo/search");
const { getHotelRoom } = require("../tbo/room");
const { blockRoom, bookHotel } = require("../tbo/book");

async function testScenario2() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 2: Domestic (Mumbai, 2 Adults + 2 Children [8, 12])");
  console.log("=".repeat(80));

  try {
    const tokenId = (await authenticateTBO()).TokenId;
    const cityId = await getCityId("Mumbai", "IN", tokenId);
    if (!cityId) throw new Error("Mumbai not found");

    const searchResult = await searchHotels({
      destination: "Mumbai",
      countryCode: "IN",
      checkIn: "2025-12-23",
      checkOut: "2025-12-25",
      guestNationality: "IN",
      rooms: [{ adults: 2, children: 2, childAges: [8, 12] }],
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
      noOfRooms: 1,
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
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelRoomDetails: blockResult.hotelRoomDetails,
      hotelPassenger: [
        {
          Title: "Mr",
          FirstName: "Amit",
          LastName: "Singh",
          PaxType: 1,
          Nationality: "IN",
          Email: "amit@example.com",
          Phoneno: "+919876543211",
          AddressLine1: "Test Address",
          City: "Mumbai",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mrs",
          FirstName: "Priya",
          LastName: "Singh",
          PaxType: 1,
          Nationality: "IN",
          Email: "priya@example.com",
          Phoneno: "+919876543211",
          AddressLine1: "Test Address",
          City: "Mumbai",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Master",
          FirstName: "Arjun",
          LastName: "Singh",
          PaxType: 2,
          Age: 8,
          Nationality: "IN",
          Email: "amit@example.com",
          Phoneno: "+919876543211",
          AddressLine1: "Test Address",
          City: "Mumbai",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Miss",
          FirstName: "Aisha",
          LastName: "Singh",
          PaxType: 2,
          Age: 12,
          Nationality: "IN",
          Email: "amit@example.com",
          Phoneno: "+919876543211",
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
    return { scenario: 2, status: "PASSED", confirmationNo };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return { scenario: 2, status: "FAILED", error: error.message };
  }
}

testScenario2().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
