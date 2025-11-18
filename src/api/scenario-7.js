#!/usr/bin/env node

/**
 * Scenario 7: Multiple Rooms Booking
 * - Destination: Jaipur, India
 * - Guests: 4 Adults (2 rooms)
 * - Duration: 2 nights (Dec 22-24, 2025)
 * - Focus: Multiple room booking scenario
 */

const fs = require("fs");
const path = require("path");

const { authenticateTBO } = require("../tbo/auth");
const { getCityId } = require("../tbo/static");
const { searchHotels } = require("../tbo/search");
const { getHotelRoom } = require("../tbo/room");
const { blockRoom, bookHotel } = require("../tbo/book");

const SCENARIO_ID = 7;
const SCENARIO_NAME = "Multiple Rooms Booking (4 Adults in 2 Rooms, 2 Nights)";

const TEST_PARAMS = {
  destination: "Jaipur",
  countryCode: "IN",
  checkInDate: "2025-12-22",
  checkOutDate: "2025-12-24",
  nationality: "IN",
  adults: 4,
  children: 0,
  rooms: 2,
  passengers: [
    {
      Title: "Mr",
      FirstName: "Arjun",
      LastName: "Reddy",
      PaxType: 1,
      Age: 42,
      PassportNo: "MN1234567",
      PassportIssueDate: "2016-01-01",
      PassportExpDate: "2026-01-01",
      Email: "arjun.reddy@test.com",
      Phoneno: "+919876543260",
      AddressLine1: "Residential Address",
      City: "Jaipur",
      CountryCode: "IN",
      CountryName: "India",
      Nationality: "IN",
    },
    {
      Title: "Mrs",
      FirstName: "Deepa",
      LastName: "Reddy",
      PaxType: 1,
      Age: 40,
      PassportNo: "MN7654321",
      PassportIssueDate: "2016-01-01",
      PassportExpDate: "2026-01-01",
      Email: "deepa.reddy@test.com",
      Phoneno: "+919876543261",
      AddressLine1: "Residential Address",
      City: "Jaipur",
      CountryCode: "IN",
      CountryName: "India",
      Nationality: "IN",
    },
    {
      Title: "Mr",
      FirstName: "Nikhil",
      LastName: "Verma",
      PaxType: 1,
      Age: 38,
      PassportNo: "OP1234567",
      PassportIssueDate: "2017-01-01",
      PassportExpDate: "2027-01-01",
      Email: "nikhil.verma@test.com",
      Phoneno: "+919876543262",
      AddressLine1: "Work Address",
      City: "Jaipur",
      CountryCode: "IN",
      CountryName: "India",
      Nationality: "IN",
    },
    {
      Title: "Mrs",
      FirstName: "Meera",
      LastName: "Verma",
      PaxType: 1,
      Age: 36,
      PassportNo: "OP7654321",
      PassportIssueDate: "2017-01-01",
      PassportExpDate: "2027-01-01",
      Email: "meera.verma@test.com",
      Phoneno: "+919876543263",
      AddressLine1: "Work Address",
      City: "Jaipur",
      CountryCode: "IN",
      CountryName: "India",
      Nationality: "IN",
    },
  ],
};

function logStep(stepNumber, title, data = null) {
  console.log("\n" + "=".repeat(80));
  console.log(`SCENARIO ${SCENARIO_ID} - STEP ${stepNumber}: ${title}`);
  console.log("=".repeat(80));
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSuccess(message) {
  console.log("\n✅ SUCCESS:", message);
}

function logError(message, error = null) {
  console.log("\n❌ ERROR:", message);
  if (error) {
    console.error(error);
  }
}

async function runScenario() {
  console.log("\n" + "=".repeat(80));
  console.log(`SCENARIO ${SCENARIO_ID}: ${SCENARIO_NAME}`);
  console.log("=".repeat(80));

  const results = {
    scenario: SCENARIO_ID,
    name: SCENARIO_NAME,
    status: "PENDING",
    timestamp: new Date().toISOString(),
    testParams: TEST_PARAMS,
    steps: {},
  };

  try {
    logStep(1, "Authentication");
    const authResult = await authenticateTBO();

    if (!authResult || !authResult.TokenId) {
      logError("Authentication failed", authResult);
      results.status = "FAILED";
      results.steps.authentication = { success: false, error: authResult };
      return results;
    }

    const tokenId = authResult.TokenId;
    logSuccess(`TokenId obtained`);
    results.steps.authentication = { success: true };

    logStep(2, "Get Static Data - CityId for " + TEST_PARAMS.destination);
    const cityId = await getCityId(
      TEST_PARAMS.destination,
      TEST_PARAMS.countryCode,
      tokenId,
    );

    if (!cityId) {
      logError("Failed to retrieve CityId");
      results.status = "FAILED";
      results.steps.staticData = { success: false };
      return results;
    }

    logSuccess(`CityId retrieved: ${cityId}`);
    results.steps.staticData = { success: true, cityId: Number(cityId) };

    logStep(3, "Hotel Search");
    const searchRequest = {
      destination: TEST_PARAMS.destination,
      countryCode: TEST_PARAMS.countryCode,
      checkIn: TEST_PARAMS.checkInDate,
      checkOut: TEST_PARAMS.checkOutDate,
      guestNationality: TEST_PARAMS.nationality,
      rooms: [
        {
          adults: 2,
          children: 0,
          childAges: [],
        },
        {
          adults: 2,
          children: 0,
          childAges: [],
        },
      ],
      currency: "INR",
    };

    const searchResult = await searchHotels(searchRequest);

    if (!searchResult || !searchResult.traceId) {
      logError("Hotel search failed", searchResult);
      results.status = "FAILED";
      results.steps.hotelSearch = { success: false };
      return results;
    }

    const traceId = searchResult.traceId;
    const hotels = searchResult.hotels || [];

    if (hotels.length === 0) {
      logError("No hotels found");
      results.status = "FAILED";
      results.steps.hotelSearch = { success: false, error: "No hotels found" };
      return results;
    }

    logSuccess(`Hotel search successful. Hotels found: ${hotels.length}`);

    const sortedHotels = [...hotels].sort((a, b) => {
      const priceA = a.Price?.OfferedPrice || a.OfferedPrice || Infinity;
      const priceB = b.Price?.OfferedPrice || b.OfferedPrice || Infinity;
      return priceA - priceB;
    });

    const selectedHotel = sortedHotels[0];
    const resultIndex = selectedHotel.ResultIndex;
    const hotelCode = selectedHotel.HotelCode;

    results.steps.hotelSearch = {
      success: true,
      totalHotels: hotels.length,
      selectedHotel: {
        code: hotelCode,
        price: selectedHotel.Price?.OfferedPrice,
        note: "Multiple room booking (2 rooms for 4 adults)",
      },
    };

    logStep(4, "Get Hotel Room Details");
    const roomResult = await getHotelRoom({
      traceId,
      resultIndex,
      hotelCode,
    });

    if (!roomResult || !roomResult.rooms || roomResult.rooms.length === 0) {
      logError("Failed to get room details", roomResult);
      results.status = "FAILED";
      results.steps.roomDetails = { success: false };
      return results;
    }

    logSuccess(
      `Room details retrieved. Rooms available: ${roomResult.rooms.length}`,
    );

    const selectedRoom = roomResult.rooms[0];
    const categoryId = roomResult.categoryId;

    results.steps.roomDetails = {
      success: true,
      roomCount: roomResult.rooms.length,
      selectedRoom: {
        name: selectedRoom.RoomDescription,
        price: selectedRoom.Price?.OfferedPrice,
      },
    };

    logStep(5, "Block Rooms");
    const hotelRoomsDetails = [
      roomResult.rooms[0],
      roomResult.rooms[Math.min(1, roomResult.rooms.length - 1)],
    ];

    const blockResult = await blockRoom({
      traceId,
      resultIndex,
      hotelCode,
      hotelName: selectedHotel.HotelName || "",
      guestNationality: TEST_PARAMS.nationality,
      numberOfRooms: 2,
      hotelRoomsDetails,
      categoryId,
    });

    if (!blockResult || blockResult.ResponseStatus !== 1) {
      logError("Block rooms failed", blockResult);
      results.status = "FAILED";
      results.steps.blockRoom = { success: false };
      return results;
    }

    logSuccess("Rooms blocked successfully");
    results.steps.blockRoom = { success: true, roomsBlocked: 2 };

    logStep(6, "Book Hotel");
    const bookResult = await bookHotel({
      traceId,
      resultIndex,
      hotelCode,
      hotelName: selectedHotel.HotelName || "",
      guestNationality: TEST_PARAMS.nationality,
      numberOfRooms: 2,
      hotelRoomsDetails,
      passengers: TEST_PARAMS.passengers,
      categoryId,
    });

    if (!bookResult) {
      logError("Book hotel returned null", bookResult);
      results.status = "FAILED";
      results.steps.book = { success: false, error: "No response" };
      return results;
    }

    if (
      bookResult.responseStatus === 2 &&
      bookResult.error?.ErrorMessage === "Agency do not have enough balance."
    ) {
      logSuccess(
        "Booking request successful (agency balance error is expected for test account)",
      );
      results.status = "SUCCESS_WITH_BALANCE_ERROR";
      results.steps.book = {
        success: true,
        note: "Balance error is expected for test agency account",
        responseStatus: bookResult.responseStatus,
      };
    } else if (bookResult.responseStatus === 1) {
      logSuccess("Hotel booked successfully!");
      results.status = "SUCCESS";
      results.steps.book = {
        success: true,
        bookingRefNo: bookResult.bookingRefNo,
        confirmationNo: bookResult.confirmationNo,
      };
    } else {
      logError("Booking failed", bookResult);
      results.status = "FAILED";
      results.steps.book = { success: false, error: bookResult.error };
      return results;
    }

    return results;
  } catch (error) {
    logError("Scenario execution failed", error);
    results.status = "FAILED";
    results.error = error.message;
    return results;
  }
}

runScenario().then((results) => {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO RESULTS");
  console.log("=".repeat(80));
  console.log(JSON.stringify(results, null, 2));

  const outputFile = `scenario-${SCENARIO_ID}-results.json`;
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to ${outputFile}`);

  process.exit(results.status === "FAILED" ? 1 : 0);
});
