#!/usr/bin/env node
const { authenticateTBO } = require("../tbo/auth");
const { getCityId } = require("../tbo/static");
const { searchHotels } = require("../tbo/search");
const { getHotelRoom } = require("../tbo/room");
const { blockRoom, bookHotel } = require("../tbo/book");

async function testScenario7() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 7: Domestic (Hyderabad, 3 Rooms: 2A, 1A+1C, 2A)");
  console.log("=".repeat(80));

  try {
    const tokenId = (await authenticateTBO()).TokenId;
    const cityId = await getCityId("Hyderabad", "IN", tokenId);
    if (!cityId) throw new Error("Hyderabad not found");

    const searchResult = await searchHotels({
      destination: "Hyderabad",
      countryCode: "IN",
      checkIn: "2025-12-05",
      checkOut: "2025-12-07",
      guestNationality: "IN",
      rooms: [
        { adults: 2, children: 0, childAges: [] },
        { adults: 1, children: 1, childAges: [5] },
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
      noOfRooms: 3,
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
      noOfRooms: 3,
      isVoucherBooking: true,
      hotelRoomDetails: blockResult.hotelRoomDetails,
      hotelPassenger: [
        {
          Title: "Mr",
          FirstName: "Ramesh",
          LastName: "Reddy",
          PaxType: 1,
          Nationality: "IN",
          Email: "ramesh@example.com",
          Phoneno: "+919876543222",
          AddressLine1: "Test Address",
          City: "Hyderabad",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mrs",
          FirstName: "Lakshmi",
          LastName: "Reddy",
          PaxType: 1,
          Nationality: "IN",
          Email: "lakshmi@example.com",
          Phoneno: "+919876543223",
          AddressLine1: "Test Address",
          City: "Hyderabad",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mr",
          FirstName: "Sanjay",
          LastName: "Rao",
          PaxType: 1,
          Nationality: "IN",
          Email: "sanjay@example.com",
          Phoneno: "+919876543224",
          AddressLine1: "Test Address",
          City: "Hyderabad",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mrs",
          FirstName: "Meena",
          LastName: "Rao",
          PaxType: 1,
          Nationality: "IN",
          Email: "meena@example.com",
          Phoneno: "+919876543225",
          AddressLine1: "Test Address",
          City: "Hyderabad",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Master",
          FirstName: "Rohit",
          LastName: "Rao",
          PaxType: 2,
          Age: 5,
          Nationality: "IN",
          Email: "sanjay@example.com",
          Phoneno: "+919876543224",
          AddressLine1: "Test Address",
          City: "Hyderabad",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mr",
          FirstName: "Rajesh",
          LastName: "Kumar",
          PaxType: 1,
          Nationality: "IN",
          Email: "rajesh@example.com",
          Phoneno: "+919876543226",
          AddressLine1: "Test Address",
          City: "Hyderabad",
          CountryCode: "IN",
          CountryName: "India",
        },
        {
          Title: "Mrs",
          FirstName: "Neha",
          LastName: "Kumar",
          PaxType: 1,
          Nationality: "IN",
          Email: "neha@example.com",
          Phoneno: "+919876543227",
          AddressLine1: "Test Address",
          City: "Hyderabad",
          CountryCode: "IN",
          CountryName: "India",
        },
      ],
    });
    if (!bookResult?.bookingId) throw new Error("Book failed");
    const confirmationNo = bookResult.confirmationNo || bookResult.bookingId;
    console.log(`✅ PASSED | Confirmation: ${confirmationNo}`);
    return { scenario: 7, status: "PASSED", confirmationNo };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return { scenario: 7, status: "FAILED", error: error.message };
  }
}

testScenario7().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
