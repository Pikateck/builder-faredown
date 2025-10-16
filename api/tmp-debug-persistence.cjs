const supplierAdapterManager = require("./services/adapters/supplierAdapterManager");

(async () => {
  try {
    console.log("Running Dubai search with persistence debugging...\n");

    supplierAdapterManager.resetAdapterCircuitBreaker("RATEHAWK");

    const searchResult = await supplierAdapterManager.searchAllHotels(
      {
        destination: "DXB",
        destinationName: "Dubai",
        checkIn: "2026-01-12",
        checkOut: "2026-01-15",
        rooms: [{ adults: 2, children: 0, childAges: [] }],
        currency: "AED",
        maxResults: 5, // Just 5 for debugging
        adults: 2,
        children: 0,
        roomsCount: 1,
        childAges: [],
        destinationCode: "DXB",
        rawDestination: "Dubai",
      },
      ["RATEHAWK"],
    );

    console.log("Search completed!");
    console.log("Total results:", searchResult.totalResults);
    console.log(
      "Metrics:",
      JSON.stringify(searchResult.supplierMetrics, null, 2),
    );

    // Wait for any async operations
    console.log("\nWaiting 5s for persistence operations...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log(
      "✓ Done. Check unified tables with: node api/tmp-simple-check.cjs",
    );

    process.exitCode = 0;
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    setTimeout(() => process.exit(), 300);
  }
})();
