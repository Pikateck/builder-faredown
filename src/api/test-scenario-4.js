#!/usr/bin/env node
const { authenticateTBO } = require("../../api/tbo/auth");
const { getCityId } = require("../../api/tbo/static");
const { searchHotels } = require("../../api/tbo/search");
const { getHotelRoom } = require("../../api/tbo/room");
const { blockRoom, bookHotel } = require("../../api/tbo/book");

async function testScenario4() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 4: Domestic (Mumbai, 2 Rooms Mixed: 1A+2C + 2A)");
  console.log("=".repeat(80));

  try {
    const tokenId = (await authenticateTBO()).TokenId;
    const cityId = await getCityId("Mumbai", "IN", tokenId);
    if (!cityId) throw new Error("Mumbai not found");

    const searchResult = await searchHotels({
      destination: "Mumbai",
      countryCode: "IN",
      checkIn: "2025-12-29",
      checkOut: "2025-12-31",
      guestNationality: "IN",
      rooms: [
        { adults: 1, children: 2, childAges: [6, 10] },
        { adults: 2, children: 0, childAges: [] },
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
          FirstName: "Suresh",
          LastName: "Verma",
          PaxType: 1,
          Nationality: "IN",
          Email: "suresh@example.com",
          Phoneno: "+919876543214",
          AddressLine1: "Test Address",
          City: "Mumbai",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Master",
          FirstName: "Aman",
          LastName: "Verma",
          PaxType: 2,
          Age: 6,
          Nationality: "IN",
          Email: "suresh@example.com",
          Phoneno: "+919876543214",
          AddressLine1: "Test Address",
          City: "Mumbai",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Miss",
          FirstName: "Ananya",
          LastName: "Verma",
          PaxType: 2,
          Age: 10,
          Nationality: "IN",
          Email: "suresh@example.com",
          Phoneno: "+919876543214",
          AddressLine1: "Test Address",
          City: "Mumbai",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mr",
          FirstName: "Anil",
          LastName: "Gupta",
          PaxType: 1,
          Nationality: "IN",
          Email: "anil@example.com",
          Phoneno: "+919876543215",
          AddressLine1: "Test Address",
          City: "Mumbai",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mrs",
          FirstName: "Sunita",
          LastName: "Gupta",
          PaxType: 1,
          Nationality: "IN",
          Email: "sunita@example.com",
          Phoneno: "+919876543216",
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
    return { scenario: 4, status: "PASSED", confirmationNo };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return { scenario: 4, status: "FAILED", error: error.message };
  }
}

testScenario4().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
