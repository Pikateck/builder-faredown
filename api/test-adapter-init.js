/**
 * Diagnostic script to test adapter initialization
 * Run this to verify RateHawk adapter is properly initialized
 */

require("dotenv").config();
const supplierAdapterManager = require("./services/adapters/supplierAdapterManager");

console.log("🔍 Adapter Manager Diagnostic\n");
console.log("=".repeat(60));

// Check environment variables
console.log("\n1️⃣  Environment Variables:");
console.log(
  `   RATEHAWK_API_ID: ${process.env.RATEHAWK_API_ID ? "✅ Set" : "❌ Missing"}`,
);
console.log(
  `   RATEHAWK_API_KEY: ${process.env.RATEHAWK_API_KEY ? "✅ Set" : "❌ Missing"}`,
);
console.log(
  `   RATEHAWK_BASE_URL: ${process.env.RATEHAWK_BASE_URL || "❌ Using default"}`,
);
console.log(
  `   HOTELS_SUPPLIERS: ${process.env.HOTELS_SUPPLIERS || "❌ Missing"}`,
);
console.log(
  `   HOTELBEDS_API_KEY: ${process.env.HOTELBEDS_API_KEY ? "✅ Set" : "❌ Missing"}`,
);

// Check initialized adapters
console.log("\n2️⃣  Initialized Adapters:");
const adapters = supplierAdapterManager.getAllAdapters();
console.log(`   Total: ${adapters.length}`);
adapters.forEach((adapter, i) => {
  console.log(
    `   ${i + 1}. ${adapter.supplierCode} (${adapter.constructor.name})`,
  );
});

// Check hotel adapters specifically
console.log("\n3️⃣  Hotel Product Adapters:");
const hotelAdapters = supplierAdapterManager.getAdaptersByProductType("hotel");
console.log(`   Total: ${hotelAdapters.length}`);
hotelAdapters.forEach((adapter, i) => {
  console.log(`   ${i + 1}. ${adapter.supplierCode}`);
});

// Check if RATEHAWK adapter exists
console.log("\n4️⃣  RATEHAWK Adapter Check:");
const rateHawkAdapter = supplierAdapterManager.getAdapter("RATEHAWK");
if (rateHawkAdapter) {
  console.log(
    `   ✅ RATEHAWK adapter found: ${rateHawkAdapter.constructor.name}`,
  );
  console.log(`   Supplier Code: ${rateHawkAdapter.supplierCode}`);
} else {
  console.log(`   ❌ RATEHAWK adapter NOT found`);
  console.log(`   This means RateHawk was not initialized during startup`);
}

// Check if HOTELBEDS adapter exists
console.log("\n5️⃣  HOTELBEDS Adapter Check:");
const hotelbedsAdapter = supplierAdapterManager.getAdapter("HOTELBEDS");
if (hotelbedsAdapter) {
  console.log(
    `   ✅ HOTELBEDS adapter found: ${hotelbedsAdapter.constructor.name}`,
  );
  console.log(`   Supplier Code: ${hotelbedsAdapter.supplierCode}`);
} else {
  console.log(`   ❌ HOTELBEDS adapter NOT found`);
}

// Test filtering behavior
console.log("\n6️⃣  Adapter Filtering Test:");
const suppliersToTest = ["HOTELBEDS", "RATEHAWK"];
console.log(`   Testing: ${suppliersToTest.join(", ")}`);
const filtered = suppliersToTest
  .map((code) => supplierAdapterManager.getAdapter(code))
  .filter((adapter) => adapter !== undefined);
console.log(`   Result: ${filtered.map((a) => a.supplierCode).join(", ")}`);

console.log("\n" + "=".repeat(60));
console.log("\n✅ Diagnostic complete!\n");

// Try a test search
console.log("7️⃣  Testing Hotel Search:");
(async () => {
  try {
    const testParams = {
      destination: "DXB",
      checkIn: "2026-01-12",
      checkOut: "2026-01-15",
      adults: 2,
      children: 0,
      currency: "EUR",
    };

    console.log(
      `   Searching for: ${testParams.destination}, ${testParams.checkIn} to ${testParams.checkOut}`,
    );
    const result = await supplierAdapterManager.searchAllHotels(testParams, [
      "HOTELBEDS",
      "RATEHAWK",
    ]);

    console.log(`   Result: ${result.totalResults} hotels found`);
    console.log(`   Supplier Metrics:`);
    Object.entries(result.supplierMetrics).forEach(([supplier, metrics]) => {
      const status = metrics.success ? "✅" : "❌";
      console.log(
        `      ${status} ${supplier}: ${metrics.resultCount} results (${metrics.responseTime}ms)`,
      );
      if (metrics.error) {
        console.log(`         Error: ${metrics.error}`);
      }
    });
  } catch (e) {
    console.error("   ❌ Error during search:", e.message);
  }

  process.exit(0);
})();
