#!/usr/bin/env node
const { authenticateTBO } = require("../../api/tbo/auth");
const { getCityId } = require("../../api/tbo/static");
const { searchHotels } = require("../../api/tbo/search");
const { getHotelRoom } = require("../../api/tbo/room");
const { blockRoom, bookHotel } = require("../../api/tbo/book");

async function testScenario8() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 8: Domestic (Pune, 1 Adult, Extended Stay 5 nights)");
  console.log("=".repeat(80));

  try {
    const tokenId = (await authenticateTBO()).TokenId;
    const cityId = await getCityId("Pune", "IN", tokenId);
    if (!cityId) throw new Error("Pune not found");

    const searchResult = await searchHotels({
      destination: "Pune",
      countryCode: "IN",
      checkIn: "2025-12-01",
      checkOut: "2025-12-06",
      guestNationality: "IN",
      rooms: [{ adults: 1, children: 0, childAges: [] }],
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
          FirstName: "Arjun",
          LastName: "Desai",
          PaxType: 1,
          Nationality: "IN",
          Email: "arjun@example.com",
          Phoneno: "+919876543228",
          AddressLine1: "Test Address",
          City: "Pune",
          CountryCode: "IN",
          CountryName: "India",
        },
      ],
    });
    if (!bookResult?.bookingId) throw new Error("Book failed");
    const confirmationNo = bookResult.confirmationNo || bookResult.bookingId;
    console.log(`✅ PASSED | Confirmation: ${confirmationNo}`);
    return { scenario: 8, status: "PASSED", confirmationNo };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return { scenario: 8, status: "FAILED", error: error.message };
  }
}

testScenario8().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
