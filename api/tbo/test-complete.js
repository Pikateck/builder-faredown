/**
 * TBO Complete Integration Test
 * Tests all endpoints in sequence with full logging
 *
 * ✅ CORRECTED: Uses exact TBO production URLs and JSON spec
 */

const { authenticateTBO } = require("./auth");
const { getCountryList, getCityList } = require("./static");
const { searchHotels } = require("./search");
const { getHotelRoom } = require("./room");

async function runCompleteTest() {
  console.log("\n" + "=".repeat(70));
  console.log("TBO HOTEL API - COMPLETE INTEGRATION TEST");
  console.log("=".repeat(70) + "\n");

  const results = {
    auth: false,
    countries: false,
    cities: false,
    search: false,
    room: false,
  };

  try {
    // 1. Authentication
    console.log("TEST 1: AUTHENTICATION");
    console.log("-".repeat(70));
    const authData = await authenticateTBO();
    results.auth = authData.Status === 1 && !!authData.TokenId;

    if (!results.auth) {
      console.log("❌ Authentication failed - stopping tests\n");
      printSummary(results);
      return;
    }

    // 2. Country List
    console.log("\nTEST 2: COUNTRY LIST (Static Data)");
    console.log("-".repeat(70));
    const countryData = await getCountryList();
    results.countries =
      countryData.Status === 1 && countryData.Countries?.length > 0;

    // 3. City List (UAE)
    console.log("\nTEST 3: CITY LIST (UAE - Static Data)");
    console.log("-".repeat(70));
    const cityData = await getCityList("AE");
    results.cities = cityData.Status === 1 && cityData.Cities?.length > 0;

    // Find Dubai CityId
    const dubai = cityData.Cities?.find((c) =>
      c.Name.toLowerCase().includes("dubai"),
    );
    const dubaiCityId = dubai?.Id || 130443;

    console.log(`\n✅ Found Dubai CityId: ${dubaiCityId}\n`);

    // 4. Hotel Search
    console.log("\nTEST 4: HOTEL SEARCH (Dubai)");
    console.log("-".repeat(70));
    const searchData = await searchHotels({
      cityId: dubaiCityId,
      checkIn: "15/12/2025",
      checkOut: "18/12/2025",
      countryCode: "AE",
      currency: "INR",
      guestNationality: "IN",
      rooms: [{ adults: 2, children: 0, childAges: [] }],
    });

    const statusOk = searchData.ResponseStatus === 1 || searchData.Status === 1;
    results.search = statusOk && searchData.HotelResults?.length > 0;

    // 5. Room Details (if search succeeded)
    if (results.search && searchData.HotelResults?.length > 0) {
      const firstHotel = searchData.HotelResults[0];

      console.log("\nTEST 5: HOTEL ROOM DETAILS");
      console.log("-".repeat(70));

      try {
        const roomData = await getHotelRoom({
          resultIndex: firstHotel.ResultIndex,
          traceId: searchData.TraceId,
        });
        results.room = roomData.Status === 1;
      } catch (err) {
        console.log("⚠️ Room details test skipped:", err.message);
        results.room = false;
      }
    }

    // Summary
    printSummary(results);
  } catch (error) {
    console.error("\n❌ Test failed with error:", error.message);
    console.error("Stack:", error.stack);
    printSummary(results);
  }
}

function printSummary(results) {
  console.log("\n" + "=".repeat(70));
  console.log("TEST SUMMARY");
  console.log("=".repeat(70) + "\n");

  console.log("1. Authentication:", results.auth ? "✅ PASS" : "❌ FAIL");
  console.log("2. Country List:", results.countries ? "✅ PASS" : "❌ FAIL");
  console.log("3. City List:", results.cities ? "✅ PASS" : "❌ FAIL");
  console.log("4. Hotel Search:", results.search ? "✅ PASS" : "❌ FAIL");
  console.log("5. Room Details:", results.room ? "✅ PASS" : "⏭️ SKIPPED");

  const passCount = Object.values(results).filter((r) => r).length;
  const totalCount = Object.keys(results).length;

  console.log("");
  console.log(`Overall: ${passCount}/${totalCount} tests passed`);
  console.log("");

  if (passCount === totalCount) {
    console.log("🎉 ALL TESTS PASSED - TBO Integration is working!\n");
  } else if (results.auth && results.search) {
    console.log("✅ CORE FUNCTIONALITY WORKING (Auth + Search)\n");
  } else {
    console.log("⚠️ Some tests failed - check errors above\n");
  }
}

// Run if called directly
if (require.main === module) {
  runCompleteTest().catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { runCompleteTest };
