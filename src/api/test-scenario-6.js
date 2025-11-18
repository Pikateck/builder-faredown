#!/usr/bin/env node
const { authenticateTBO } = require("../tbo/auth");
const { getCityId } = require("../tbo/static");
const { searchHotels } = require("../tbo/search");
const { getHotelRoom } = require("../tbo/room");
const { blockRoom, bookHotel } = require("../tbo/book");

async function testScenario6() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 6: Domestic (Bangalore, 2 Adults)");
  console.log("=".repeat(80));

  try {
    const tokenId = (await authenticateTBO()).TokenId;
    const cityId = await getCityId("Bangalore", "IN", tokenId);
    if (!cityId) throw new Error("Bangalore not found");

    const searchResult = await searchHotels({
      destination: "Bangalore",
      countryCode: "IN",
      checkIn: "2025-12-10",
      checkOut: "2025-12-12",
      guestNationality: "IN",
      rooms: [{ adults: 2, children: 0, childAges: [] }],
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
          FirstName: "Karan",
          LastName: "Malhotra",
          PaxType: 1,
          Nationality: "IN",
          Email: "karan@example.com",
          Phoneno: "+919876543220",
          AddressLine1: "Test Address",
          City: "Bangalore",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mrs",
          FirstName: "Divya",
          LastName: "Malhotra",
          PaxType: 1,
          Nationality: "IN",
          Email: "divya@example.com",
          Phoneno: "+919876543221",
          AddressLine1: "Test Address",
          City: "Bangalore",
          CountryCode: "IN",
          CountryName: "India",
        },
      ],
    });
    if (!bookResult?.bookingId) throw new Error("Book failed");
    const confirmationNo = bookResult.confirmationNo || bookResult.bookingId;
    console.log(`✅ PASSED | Confirmation: ${confirmationNo}`);
    return { scenario: 6, status: "PASSED", confirmationNo };
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
