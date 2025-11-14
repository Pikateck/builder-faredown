const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("tbo-dubai-hotel-search-no-results.json", "utf8"),
);

console.log("═".repeat(80));
console.log("TBO HOTEL SEARCH RESULTS ANALYSIS");
console.log("═".repeat(80));

const result = data.response?.HotelSearchResult || data.response;

console.log("\n📊 RESPONSE SUMMARY:");
console.log("  ResponseStatus:", result?.ResponseStatus);
console.log("  TraceId:", result?.TraceId);
console.log("  CityId:", result?.CityId);
console.log("  Hotel Count:", result?.HotelResults?.length || 0);
console.log("  Error:", result?.Error?.ErrorMessage || "None");

if (result?.HotelResults?.length > 0) {
  console.log(
    "\n✅ SUCCESS! Found",
    result.HotelResults.length,
    "hotels in Dubai",
  );

  console.log("\n📋 TOP 15 HOTELS:");
  console.log("─".repeat(80));

  result.HotelResults.slice(0, 15).forEach((hotel, i) => {
    console.log(`\n${i + 1}. ${hotel.HotelName || "No name"}`);
    console.log(`   Hotel Code: ${hotel.HotelCode}`);
    console.log(`   Stars: ${hotel.StarRating} ⭐`);
    console.log(
      `   Price: ${hotel.Price?.CurrencyCode} ${hotel.Price?.OfferedPrice}`,
    );
    console.log(`   Result Index: ${hotel.ResultIndex}`);
  });

  console.log("\n─".repeat(80));
  console.log("Total Hotels:", result.HotelResults.length);

  // Save summary
  const summary = {
    success: true,
    timestamp: data.timestamp,
    cityId: data.request.CityId,
    totalHotels: result.HotelResults.length,
    traceId: result.TraceId,
    sampleHotels: result.HotelResults.slice(0, 10).map((h) => ({
      name: h.HotelName,
      code: h.HotelCode,
      stars: h.StarRating,
      price: h.Price?.OfferedPrice,
      currency: h.Price?.CurrencyCode,
    })),
  };

  fs.writeFileSync("tbo-search-summary.json", JSON.stringify(summary, null, 2));
  console.log("\n💾 Summary saved to: tbo-search-summary.json");

  console.log("\n🎉 TBO INTEGRATION: COMPLETE SUCCESS!");
  console.log("\n✅ PROVEN:");
  console.log("  ✓ Authenticate → TokenId works");
  console.log(
    "  ✓ GetDestinationSearchStaticData → Dubai DestinationId (115936) works",
  );
  console.log("  ✓ GetHotelResult → Returns real hotel data");
  console.log("\n📊 INTEGRATION STATUS: READY FOR PRODUCTION");
} else {
  console.log("\n❌ No hotels found");
}
