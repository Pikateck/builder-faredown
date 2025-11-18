#!/usr/bin/env node

/**
 * Scenario 6: UAE Hotel Booking
 * - Destination: Dubai, UAE
 * - Guests: 2 Adults
 * - Duration: 3 nights (Dec 18-21, 2025)
 * - Focus: Different country code (AE instead of IN)
 */

const fs = require("fs");
const path = require("path");

const { authenticateTBO } = require("../tbo/auth");
const { getCityId } = require("../tbo/static");
const { searchHotels } = require("../tbo/search");
const { getHotelRoom } = require("../tbo/room");
const { blockRoom, bookHotel } = require("../tbo/book");

const SCENARIO_ID = 6;
const SCENARIO_NAME = "UAE Hotel Booking (2 Adults, 3 Nights)";

const TEST_PARAMS = {
  destination: "Dubai",
  countryCode: "AE",
  checkInDate: "2025-12-18",
  checkOutDate: "2025-12-21",
  nationality: "AE",
  adults: 2,
  children: 0,
  rooms: 1,
  passengers: [
    {
      Title: "Mr",
      FirstName: "Ahmed",
      LastName: "Al-Mansouri",
      PaxType: 1,
      Age: 35,
      PassportNo: "KL1234567",
      PassportIssueDate: "2018-01-01",
      PassportExpDate: "2028-01-01",
      Email: "ahmed.almansouri@test.com",
      Phoneno: "+971501234567",
      AddressLine1: "Dubai Address",
      City: "Dubai",
      CountryCode: "AE",
      CountryName: "United Arab Emirates",
      Nationality: "AE",
    },
    {
      Title: "Mrs",
      FirstName: "Fatima",
      LastName: "Al-Mansouri",
      PaxType: 1,
      Age: 32,
      PassportNo: "KL7654321",
      PassportIssueDate: "2018-01-01",
      PassportExpDate: "2028-01-01",
      Email: "fatima.almansouri@test.com",
      Phoneno: "+971501234568",
      AddressLine1: "Dubai Address",
      City: "Dubai",
      CountryCode: "AE",
      CountryName: "United Arab Emirates",
      Nationality: "AE",
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
          adults: TEST_PARAMS.adults,
          children: TEST_PARAMS.children,
          childAges: [],
        },
      ],
      currency: "AED",
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
        currency: "AED",
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

    logStep(5, "Block Room");
    const blockResult = await blockRoom({
      traceId,
      resultIndex,
      hotelCode,
      hotelName: selectedHotel.HotelName || "",
      guestNationality: TEST_PARAMS.nationality,
      numberOfRooms: 1,
      hotelRoomsDetails: roomResult.rooms,
      categoryId,
    });

    if (!blockResult || blockResult.ResponseStatus !== 1) {
      logError("Block room failed", blockResult);
      results.status = "FAILED";
      results.steps.blockRoom = { success: false };
      return results;
    }

    logSuccess("Room blocked successfully");
    results.steps.blockRoom = { success: true };

    logStep(6, "Book Hotel");
    const bookResult = await bookHotel({
      traceId,
      resultIndex,
      hotelCode,
      hotelName: selectedHotel.HotelName || "",
      guestNationality: TEST_PARAMS.nationality,
      numberOfRooms: 1,
      hotelRoomsDetails: roomResult.rooms,
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
