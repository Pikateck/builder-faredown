#!/usr/bin/env node

/**
 * Scenario 4: Premium Hotel Booking
 * - Destination: Goa, India
 * - Guests: 1 Adult
 * - Duration: 5 nights (Dec 15-20, 2025)
 * - Focus: Premium hotel selection (highest star rating or mid-to-high price)
 */

const fs = require("fs");
const path = require("path");

const { authenticateTBO } = require("./api/tbo/auth");
const { getCityId } = require("./api/tbo/static");
const { searchHotels } = require("./api/tbo/search");
const { getHotelRoom } = require("./api/tbo/room");
const { blockRoom, bookHotel } = require("./api/tbo/book");

const SCENARIO_ID = 4;
const SCENARIO_NAME = "Premium Hotel Booking (1 Adult, 5 Nights)";

const TEST_PARAMS = {
  destination: "Goa",
  countryCode: "IN",
  checkInDate: "2025-12-15",
  checkOutDate: "2025-12-20",
  nationality: "IN",
  adults: 1,
  children: 0,
  rooms: 1,
  passengers: [
    {
      Title: "Mr",
      FirstName: "Suresh",
      LastName: "Patel",
      PaxType: 1,
      Age: 45,
      PassportNo: "GH1234567",
      PassportIssueDate: "2017-01-01",
      PassportExpDate: "2027-01-01",
      Email: "suresh.patel@test.com",
      Phoneno: "+919876543240",
      AddressLine1: "Executive Address",
      City: "Goa",
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
          adults: TEST_PARAMS.adults,
          children: TEST_PARAMS.children,
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

    // Select PREMIUM hotel (highest star rating, then by price)
    const sortedHotels = [...hotels].sort((a, b) => {
      const starsA = a.StarRating || 0;
      const starsB = b.StarRating || 0;
      if (starsB !== starsA) return starsB - starsA;
      const priceA = a.Price?.OfferedPrice || a.OfferedPrice || 0;
      const priceB = b.Price?.OfferedPrice || b.OfferedPrice || 0;
      return priceB - priceA;
    });

    const selectedHotel = sortedHotels[0];
    const resultIndex = selectedHotel.ResultIndex;
    const hotelCode = selectedHotel.HotelCode;

    results.steps.hotelSearch = {
      success: true,
      totalHotels: hotels.length,
      selectedHotel: {
        code: hotelCode,
        starRating: selectedHotel.StarRating,
        price: selectedHotel.Price?.OfferedPrice,
        note: "Premium hotel selected (highest stars)",
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
