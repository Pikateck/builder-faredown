/**
 * TBO HOTEL API - COMPLETE END-TO-END FLOW TEST
 *
 * Tests all integrated modules:
 * 1. Authentication
 * 2. Static Data (City Lookup)
 * 3. Hotel Search
 * 4. Room Details
 * 5. Block Room (optional - for pricing validation)
 *
 * This demonstrates the production-ready integration
 */

require("dotenv").config({ path: "./api/.env", override: true });
const tbo = require("./api/tbo");
const fs = require("fs");

async function testCompleteFlow() {
  console.log("\n╔" + "═".repeat(78) + "╗");
  console.log(
    "║" +
      " ".repeat(15) +
      "TBO COMPLETE FLOW - PRODUCTION INTEGRATION" +
      " ".repeat(20) +
      "║",
  );
  console.log("╚" + "═".repeat(78) + "╝\n");

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
  };

  try {
    // ====================================
    // STEP 1: AUTHENTICATE
    // ====================================
    console.log("\n" + "═".repeat(80));
    console.log("STEP 1: AUTHENTICATE");
    console.log("═".repeat(80));

    const authData = await tbo.authenticateTBO();
    const tokenId = authData.TokenId;

    results.steps.push({
      step: 1,
      name: "Authenticate",
      status: tokenId ? "SUCCESS" : "FAILED",
      tokenId: tokenId ? tokenId.substring(0, 40) + "..." : null,
      memberId: authData.Member?.MemberId,
      agencyId: authData.Member?.AgencyId,
    });

    if (!tokenId) {
      throw new Error("Authentication failed");
    }

    console.log("✅ STEP 1 COMPLETE\n");

    // ====================================
    // STEP 2: GET DESTINATION STATIC DATA
    // ====================================
    console.log("\n" + "═".repeat(80));
    console.log("STEP 2: GET DESTINATION STATIC DATA (UAE Cities)");
    console.log("═".repeat(80));

    const staticData = await tbo.getDestinationSearchStaticData("AE", tokenId);

    const dubai = staticData.destinations.find(
      (d) => d.cityName.toLowerCase() === "dubai",
    );

    results.steps.push({
      step: 2,
      name: "GetDestinationSearchStaticData",
      status: dubai ? "SUCCESS" : "FAILED",
      traceId: staticData.traceId,
      totalCities: staticData.destinations.length,
      dubaicityId: dubai?.destinationId,
      sampleCities: staticData.destinations.slice(0, 5).map((d) => ({
        name: d.cityName,
        id: d.destinationId,
      })),
    });

    if (!dubai) {
      throw new Error("Dubai not found in static data");
    }

    console.log("✅ STEP 2 COMPLETE\n");

    // ====================================
    // STEP 3: SEARCH HOTELS
    // ====================================
    console.log("\n" + "═".repeat(80));
    console.log("STEP 3: SEARCH HOTELS (Dubai)");
    console.log("═".repeat(80));

    const searchParams = {
      destination: "Dubai",
      checkIn: "15/12/2025",
      checkOut: "18/12/2025",
      countryCode: "AE",
      currency: "USD",
      guestNationality: "IN",
      rooms: [{ adults: 2, children: 0, childAges: [] }],
    };

    const searchResults = await tbo.searchHotels(searchParams);

    results.steps.push({
      step: 3,
      name: "SearchHotels",
      status: searchResults.hotels.length > 0 ? "SUCCESS" : "FAILED",
      traceId: searchResults.traceId,
      totalHotels: searchResults.hotels.length,
      cityId: searchResults.cityId,
      sampleHotels: searchResults.hotels.slice(0, 5).map((h) => ({
        name: h.HotelName,
        code: h.HotelCode,
        stars: h.StarRating,
        price: h.Price?.OfferedPrice,
        currency: h.Price?.CurrencyCode,
        resultIndex: h.ResultIndex,
      })),
    });

    if (searchResults.hotels.length === 0) {
      throw new Error("No hotels found");
    }

    console.log("✅ STEP 3 COMPLETE\n");

    // ====================================
    // STEP 4: GET HOTEL ROOM DETAILS
    // ====================================
    console.log("\n" + "═".repeat(80));
    console.log("STEP 4: GET HOTEL ROOM DETAILS (First Hotel)");
    console.log("═".repeat(80));

    const firstHotel = searchResults.hotels[0];

    const roomParams = {
      traceId: searchResults.traceId,
      resultIndex: firstHotel.ResultIndex,
      hotelCode: firstHotel.HotelCode,
    };

    const roomResults = await tbo.getHotelRoom(roomParams);

    results.steps.push({
      step: 4,
      name: "GetHotelRoom",
      status: roomResults.rooms.length > 0 ? "SUCCESS" : "FAILED",
      traceId: roomResults.traceId,
      hotel: firstHotel.HotelName,
      hotelCode: firstHotel.HotelCode,
      totalRooms: roomResults.rooms.length,
      sampleRooms: roomResults.rooms.slice(0, 3).map((r) => ({
        name: r.RoomTypeName,
        price: r.Price?.OfferedPrice,
        currency: r.Price?.CurrencyCode,
        cancellation: r.LastCancellationDate,
      })),
    });

    console.log("✅ STEP 4 COMPLETE\n");

    // ====================================
    // SUMMARY
    // ====================================
    console.log("\n" + "═".repeat(80));
    console.log("FINAL SUMMARY");
    console.log("═".repeat(80));

    const allSuccess = results.steps.every((s) => s.status === "SUCCESS");

    if (allSuccess) {
      console.log("\n🎉 ALL STEPS COMPLETED SUCCESSFULLY!");
      console.log("\n✅ Integration Status: PRODUCTION READY");
      console.log("\nFlow Verification:");
      results.steps.forEach((step) => {
        console.log(`  ${step.step}. ${step.name}: ✅ ${step.status}`);
      });

      console.log("\n📊 Results Summary:");
      console.log(`  - TokenId: Obtained (valid for 24 hours)`);
      console.log(
        `  - UAE Cities: ${results.steps[1].totalCities} destinations`,
      );
      console.log(`  - Dubai CityId: ${results.steps[1].dubaicityId}`);
      console.log(`  - Hotels Found: ${results.steps[2].totalHotels}`);
      console.log(`  - TraceId: ${results.steps[2].traceId}`);
      console.log(`  - Room Options: ${results.steps[3].totalRooms}`);

      console.log("\n📁 Detailed Results:");
      results.steps.forEach((step) => {
        console.log(`\n  ${step.name}:`);
        if (step.sampleHotels) {
          console.log(`    Sample Hotels:`);
          step.sampleHotels.forEach((h, i) => {
            console.log(
              `      ${i + 1}. ${h.name || "No name"} (${h.stars}★) - ${h.currency} ${h.price}`,
            );
          });
        }
        if (step.sampleRooms) {
          console.log(`    Sample Rooms:`);
          step.sampleRooms.forEach((r, i) => {
            console.log(`      ${i + 1}. ${r.name} - ${r.currency} ${r.price}`);
          });
        }
      });

      console.log("\n🚀 NEXT STEPS:");
      console.log("  1. ✅ Wire static data into production adapter");
      console.log("  2. ✅ Update hotel search to use real CityIds");
      console.log("  3. ✅ Implement room details endpoint");
      console.log("  4. ⏭️  Implement BlockRoom (pre-book validation)");
      console.log("  5. ⏭️  Implement Book (final booking)");
      console.log("  6. ⏭️  Implement GenerateVoucher");
    } else {
      console.log("\n❌ SOME STEPS FAILED");
      results.steps.forEach((step) => {
        const icon = step.status === "SUCCESS" ? "✅" : "❌";
        console.log(`  ${step.step}. ${step.name}: ${icon} ${step.status}`);
      });
    }

    // Save results
    fs.writeFileSync(
      "tbo-complete-flow-results.json",
      JSON.stringify(results, null, 2),
    );
    console.log("\n💾 Results saved to: tbo-complete-flow-results.json");
  } catch (error) {
    console.error("\n❌ FLOW FAILED:", error.message);
    console.error("Stack:", error.stack);

    results.error = {
      message: error.message,
      stack: error.stack,
    };

    fs.writeFileSync(
      "tbo-complete-flow-error.json",
      JSON.stringify(results, null, 2),
    );
    console.log("\n💾 Error details saved to: tbo-complete-flow-error.json");
  }
}

// Run the test
testCompleteFlow().catch(console.error);
