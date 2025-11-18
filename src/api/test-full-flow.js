#!/usr/bin/env node

/**
 * TBO Complete Hotel Booking Flow Test
 *
 * CANONICAL end-to-end test for TBO hotel integration.
 *
 * ⚠️  IMPORTANT: This test REQUIRES Fixie proxy access (whitelisted IP for TBO)
 *
 * WHERE TO RUN:
 *   ✅ Render/Production environment (has Fixie proxy access)
 *   ❌ Local machine (Fixie proxy usually times out)
 *
 * Pipeline:
 * 1. Authenticate → Get TokenId
 * 2. GetDestinationSearchStaticData → Get real CityId (DestinationId)
 * 3. SearchHotels → Get hotel results with TraceId
 * 4. GetHotelRoom �� Get room details using TraceId + ResultIndex
 * 5. BlockRoom → Hold the room temporarily
 * 6. Book → Confirm the booking
 * 7. GenerateVoucher → Get booking voucher
 *
 * OUTPUTS:
 *   Console: Real-time progress and logging
 *   File: tbo-full-booking-flow-results.json (complete results)
 */

// NO dotenv here on Render

// Proxy configuration
const USE_PROXY = process.env.USE_SUPPLIER_PROXY === "true";
const FIXIE_URL = process.env.FIXIE_URL;

console.log("\n" + "=".repeat(80));
console.log("TBO COMPLETE BOOKING FLOW TEST");
console.log("=".repeat(80));
console.log("\n🔧 ENVIRONMENT CHECK:");
console.log("  USE_SUPPLIER_PROXY:", USE_PROXY ? "✅ true" : "❌ false");
console.log("  FIXIE_URL:", FIXIE_URL ? "✅ configured" : "❌ missing");

if (USE_PROXY && !FIXIE_URL) {
  console.log("\n⚠️  WARNING: Proxy enabled but FIXIE_URL not set");
  console.log("   TBO requires Fixie proxy with whitelisted IP");
  console.log("   This test will likely fail.\n");
}

if (!USE_PROXY) {
  console.log(
    "\n⚠️  WARNING: Running WITHOUT proxy (USE_SUPPLIER_PROXY=false)",
  );
  console.log("   TBO will reject requests from non-whitelisted IPs");
  console.log("   This test WILL FAIL at authentication.");
  console.log("   This mode is only for testing request structure.\n");
}

console.log("\n📍 RECOMMENDED ENVIRONMENT:");
console.log("   Run this test on Render/Production where Fixie proxy works");
console.log("   Local testing will timeout at Fixie proxy connection\n");

const fs = require("fs");
const path = require("path");

// Import TBO modules (existing project modules)
const { authenticateTBO } = require("../../api/tbo/auth");
const { getCityId } = require("../../api/tbo/static");
const { searchHotels } = require("../../api/tbo/search");
const { getHotelRoom } = require("../../api/tbo/room");
const { blockRoom, bookHotel } = require("../../api/tbo/book");
const { generateVoucher, getBookingDetails } = require("../../api/tbo/voucher");

// Currency mapping by country code
const CURRENCY_BY_COUNTRY = {
  IN: "INR", // India
  AE: "AED", // UAE
  US: "USD", // USA
  GB: "GBP", // UK
  EU: "EUR", // Europe
  SG: "SGD", // Singapore
  MY: "MYR", // Malaysia
  TH: "THB", // Thailand
};

// Helper: choose safe future dates (static for now, but in future can be dynamic)
const TEST_PARAMS = {
  destination: "Delhi",
  countryCode: "IN",
  checkInDate: "2025-12-15", // must be > today
  checkOutDate: "2025-12-16", // 1 night only (cheaper for testing)
  nationality: "IN", // TBO agency restriction: only Indian nationality allowed
  adults: 2,
  children: 0,
  rooms: 1,
  passengers: [
    {
      Title: "Mr",
      FirstName: "John",
      LastName: "Doe",
      PaxType: 1, // Adult
      Age: 30,
      PassportNo: "AB1234567",
      PassportIssueDate: "2020-01-01",
      PassportExpDate: "2030-01-01",
      Email: "john.doe@test.com",
      Phoneno: "+919876543210",
      AddressLine1: "Test Address",
      City: "Mumbai",
      CountryCode: "IN",
      CountryName: "India",
      Nationality: "IN",
    },
    {
      Title: "Mrs",
      FirstName: "Jane",
      LastName: "Doe",
      PaxType: 1, // Adult
      Age: 28,
      PassportNo: "AB7654321",
      PassportIssueDate: "2020-01-01",
      PassportExpDate: "2030-01-01",
      Email: "jane.doe@test.com",
      Phoneno: "+919876543211",
      AddressLine1: "Test Address",
      City: "Mumbai",
      CountryCode: "IN",
      CountryName: "India",
      Nationality: "IN",
    },
  ],
};

// Logging helpers
function logStep(stepNumber, title, data = null) {
  console.log("\n" + "=".repeat(80));
  console.log(`STEP ${stepNumber}: ${title}`);
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

async function runCompleteFlow() {
  const results = {
    timestamp: new Date().toISOString(),
    testParams: TEST_PARAMS,
    steps: {},
  };

  try {
    // STEP 1: Authentication
    logStep(1, "Authentication - Get TokenId");
    const authResult = await authenticateTBO();

    if (!authResult || !authResult.TokenId) {
      logError("Authentication failed", authResult);
      results.steps.authentication = { success: false, error: authResult };
      return results;
    }

    const tokenId = authResult.TokenId;
    logSuccess(`TokenId obtained: ${tokenId.substring(0, 30)}...`);
    results.steps.authentication = {
      success: true,
      tokenId: tokenId.substring(0, 30) + "...",
      endpoint:
        "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
    };

    // STEP 2: Get Static Data - Real CityId
    logStep(
      2,
      "Get Static Data - Retrieve Real CityId for " + TEST_PARAMS.destination,
    );
    const cityId = await getCityId(
      TEST_PARAMS.destination,
      TEST_PARAMS.countryCode,
      tokenId,
    );

    if (!cityId) {
      logError("Failed to retrieve CityId for " + TEST_PARAMS.destination);
      results.steps.staticData = { success: false, error: "No CityId found" };
      return results;
    }

    logSuccess(`Real CityId retrieved: ${cityId}`);
    results.steps.staticData = {
      success: true,
      destination: TEST_PARAMS.destination,
      cityId: Number(cityId),
      countryCode: TEST_PARAMS.countryCode,
    };

    // STEP 3: Hotel Search
    logStep(3, "Hotel Search - Search hotels with real CityId");
    console.log("\n📌 REQUEST BODY:");
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
      currency: CURRENCY_BY_COUNTRY[TEST_PARAMS.countryCode] || "USD",
    };
    console.log(JSON.stringify(searchRequest, null, 2));

    const searchResult = await searchHotels(searchRequest);

    // Log full search result for debugging
    console.log("\n📌 SEARCH RESULT (parsed by search.js):");
    console.log(JSON.stringify(searchResult, null, 2));

    if (!searchResult || !searchResult.traceId) {
      logError("Hotel search failed", searchResult);
      results.steps.hotelSearch = { success: false, error: searchResult };
      return results;
    }

    const traceId = searchResult.traceId;
    const hotels = searchResult.hotels || [];

    logSuccess(
      `Hotel search successful. TraceId: ${traceId}, Hotels found: ${hotels.length}`,
    );

    if (hotels.length === 0) {
      logError("No hotels found in search results");
      console.log(
        "\n⚠️  IMPORTANT: Upload this test output to see exactly what TBO returned.",
      );
      results.steps.hotelSearch = {
        success: false,
        error: "No hotels found",
        responseStatus: searchResult.responseStatus,
        debugInfo: "Check console output above for RAW TBO RESPONSE",
      };
      return results;
    }

    // Select cheapest hotel (sort by OfferedPrice)
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
      traceId,
      totalHotels: hotels.length,
      selectedHotel: {
        name: selectedHotel.HotelName,
        code: hotelCode,
        resultIndex,
        price: selectedHotel.Price,
      },
      endpoint:
        "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult",
    };

    console.log("\nSelected Hotel:", {
      name: selectedHotel.HotelName,
      code: hotelCode,
      resultIndex,
      price: selectedHotel.Price,
    });

    // STEP 4: Get Hotel Room Details
    logStep(4, "Get Hotel Room Details");
    const roomResult = await getHotelRoom({
      traceId,
      resultIndex,
      hotelCode,
    });

    if (!roomResult || !roomResult.rooms || roomResult.rooms.length === 0) {
      logError("Failed to get room details", roomResult);
      results.steps.roomDetails = { success: false, error: roomResult };
      return results;
    }

    const hotelRoomsDetails = roomResult.rooms || [];

    logSuccess(
      `Room details retrieved. Available rooms: ${hotelRoomsDetails.length}`,
    );

    // Select cheapest room (sort by OfferedPrice)
    const sortedRooms = [...hotelRoomsDetails].sort((a, b) => {
      const priceA = a.Price?.OfferedPrice || a.OfferedPrice || Infinity;
      const priceB = b.Price?.OfferedPrice || b.OfferedPrice || Infinity;
      return priceA - priceB;
    });
    const selectedRoom = sortedRooms[0];

    results.steps.roomDetails = {
      success: true,
      totalRooms: hotelRoomsDetails.length,
      selectedRoom: {
        roomTypeName: selectedRoom.RoomTypeName,
        roomTypeCode: selectedRoom.RoomTypeCode,
        price: selectedRoom.Price,
        cancellationPolicy: selectedRoom.CancellationPolicy,
      },
      endpoint:
        "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelRoom",
    };

    console.log("\nSelected Room:", {
      name: selectedRoom.RoomTypeName,
      code: selectedRoom.RoomTypeCode,
      price: selectedRoom.Price,
    });

    // STEP 5: Block Room
    logStep(5, "Block Room - Hold room temporarily");
    const blockResult = await blockRoom({
      traceId,
      resultIndex,
      hotelCode,
      hotelName: selectedHotel.HotelName,
      guestNationality: TEST_PARAMS.nationality,
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelRoomDetails: [selectedRoom],
    });

    // ✅ FIXED: Check ResponseStatus = 1 (TBO success code)
    if (!blockResult || blockResult.responseStatus !== 1) {
      logError(
        `Failed to block room. ResponseStatus: ${blockResult?.responseStatus}, Error: ${blockResult?.error?.ErrorMessage || "Unknown"}`,
        blockResult,
      );
      results.steps.blockRoom = {
        success: false,
        error: blockResult?.error,
        responseStatus: blockResult?.responseStatus,
        errorCode: blockResult?.error?.ErrorCode,
        errorMessage: blockResult?.error?.ErrorMessage,
      };
      return results;
    }

    logSuccess(
      `Room blocked successfully. ResponseStatus: ${blockResult.responseStatus}`,
    );

    results.steps.blockRoom = {
      success: true,
      status: blockResult.responseStatus,
      isPriceChanged: blockResult.isPriceChanged,
      isPolicyChanged: blockResult.isCancellationPolicyChanged,
      endpoint:
        "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom",
    };

    // STEP 6: Book Hotel
    logStep(6, "Book Hotel - Confirm booking");
    // ✅ CRITICAL: Use BlockRoom response's room details, NOT the original GetHotelRoom details
    // BlockRoom updates the Price when IsPriceChanged: true, and Book must use that exact Price
    // Also pass the CategoryId from BlockRoom response (mandatory for Book API)
    const bookResult = await bookHotel({
      traceId,
      resultIndex,
      hotelCode,
      hotelName: selectedHotel.HotelName,
      categoryId: blockResult.categoryId, // ✅ CRITICAL: CategoryId from BlockRoom (mandatory for Book)
      guestNationality: TEST_PARAMS.nationality,
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelPassenger: TEST_PARAMS.passengers,
      hotelRoomDetails: blockResult.hotelRoomDetails, // ✅ Use BlockRoom result, not original room
    });

    // ✅ FIXED: Check ResponseStatus = 1 AND bookingId exists
    if (
      !bookResult ||
      bookResult.responseStatus !== 1 ||
      !bookResult.bookingId
    ) {
      logError(
        `Failed to book hotel. ResponseStatus: ${bookResult?.responseStatus}, Error: ${bookResult?.error?.ErrorMessage || "Unknown"}`,
        bookResult,
      );
      results.steps.booking = {
        success: false,
        error: bookResult?.error,
        responseStatus: bookResult?.responseStatus,
        errorCode: bookResult?.error?.ErrorCode,
        errorMessage: bookResult?.error?.ErrorMessage,
      };
      return results;
    }

    const bookingId = bookResult.bookingId;
    const confirmationNo = bookResult.confirmationNo;

    logSuccess(
      `Hotel booked successfully. BookingId: ${bookingId}, ConfirmationNo: ${confirmationNo}`,
    );

    results.steps.booking = {
      success: true,
      bookingId,
      confirmationNo,
      status: bookResult.responseStatus,
      bookingRefNo: bookResult.bookingRefNo,
      endpoint:
        "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book",
    };

    // STEP 7: Generate Voucher
    logStep(7, "Generate Voucher");
    const voucherResult = await generateVoucher({
      bookingId,
      bookingRefNo: bookResult.bookingRefNo,
    });

    if (!voucherResult || !voucherResult.voucherURL) {
      logError("Failed to generate voucher", voucherResult);
      results.steps.voucher = { success: false, error: voucherResult };
      return results;
    }

    const voucherUrl = voucherResult.voucherURL;

    logSuccess(`Voucher generated successfully. URL: ${voucherUrl}`);

    results.steps.voucher = {
      success: true,
      voucherUrl,
      status: voucherResult.responseStatus,
      endpoint:
        "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GenerateVoucher",
    };

    // OPTIONAL: Get Booking Details
    logStep(8, "Get Booking Details (Optional Verification)");
    const bookingDetailsResult = await getBookingDetails({
      bookingId,
      bookingRefNo: bookResult.bookingRefNo,
    });

    if (bookingDetailsResult && bookingDetailsResult.responseStatus) {
      logSuccess("Booking details retrieved successfully");

      results.steps.bookingDetails = {
        success: true,
        status: bookingDetailsResult.responseStatus,
        bookingStatus: bookingDetailsResult.status,
        endpoint:
          "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetBookingDetails",
      };
    }

    console.log("\n" + "=".repeat(80));
    console.log("COMPLETE BOOKING FLOW SUMMARY");
    console.log("=".repeat(80));
    console.log("\n✅ All steps completed successfully!\n");
    console.log("Flow Summary:");
    console.log("1. ✅ Authentication");
    console.log("2. ✅ Static Data (Real CityId)");
    console.log("3. ✅ Hotel Search");
    console.log("4. ✅ Room Details");
    console.log("5. ✅ Block Room");
    console.log("6. ✅ Book Hotel");
    console.log("7. ✅ Generate Voucher");
    console.log("8. ✅ Booking Details (Verification)");
    console.log("\nBooking Information:");
    console.log(`  - BookingId: ${bookingId}`);
    console.log(`  - ConfirmationNo: ${confirmationNo}`);
    console.log(`  - Voucher URL: ${voucherUrl}`);
    console.log(`  - Hotel: ${selectedHotel.HotelName}`);
    console.log(`  - Room: ${selectedRoom.RoomTypeName}`);
    console.log(`  - Check-in: ${TEST_PARAMS.checkInDate}`);
    console.log(`  - Check-out: ${TEST_PARAMS.checkOutDate}`);

    results.overallSuccess = true;
  } catch (error) {
    logError("Unexpected error during flow execution", error);
    results.overallSuccess = false;
    results.error = {
      message: error.message,
      stack: error.stack,
    };
  }

  const resultsFile = path.join(
    __dirname,
    "tbo-full-booking-flow-results.json",
  );
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: ${resultsFile}`);

  return results;
}

// Run the test
if (require.main === module) {
  console.log("Starting TBO Complete Hotel Booking Flow Test...");
  console.log("Test Parameters:", TEST_PARAMS);

  runCompleteFlow()
    .then((results) => {
      if (results.overallSuccess) {
        console.log("\n🎉 COMPLETE BOOKING FLOW TEST PASSED! 🎉\n");
        process.exit(0);
      } else {
        console.log("\n⚠️  BOOKING FLOW TEST FAILED ⚠️\n");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("\n💥 FATAL ERROR:", error);
      process.exit(1);
    });
}

module.exports = { runCompleteFlow };
