/**
 * Verify TBO BlockRoom Fix
 * Tests that SmokingPreference and Price are correctly formatted
 */

const {
  mapRoomForBlockRequest,
  validateRoomForBlockRequest,
} = require("./api/tbo/roomMapper");

console.log(
  "\n╔════════════════════════════════════════════════════════════════╗",
);
console.log(
  "║     TBO BLOCKROOM API FIX - VERIFICATION                      ║",
);
console.log(
  "╚════════════════════════════════════════════════════════════════╝\n",
);

// Test room from actual TBO response (like your test)
const roomFromTBOResponse = {
  RoomTypeCode: "74026|217183559|1|1",
  RoomTypeName: "Twin/King room",
  RatePlanCode: "74026|217183559|1",
  RatePlanName: "No meals",
  Price: {
    // ❌ This is an OBJECT (from TBO)
    CurrencyCode: "USD",
    RoomPrice: 261.64,
    Tax: 0,
    ExtraGuestCharge: 0,
    ChildCharge: 0,
    OtherCharges: 10.47,
    Discount: 0,
    PublishedPrice: 272.11,
    PublishedPriceRoundedOff: 272.11,
    OfferedPrice: 272.11,
    OfferedPriceRoundedOff: 272.11,
    AgentCommission: 0,
    AgentMarkUp: 0,
    ServiceTax: 1.88,
    TCS: 0,
    TDS: 0,
    ServiceCharge: 0,
    TotalGSTAmount: 1.8838,
  },
  SmokingPreference: "NoPreference", // ❌ This is a STRING (from TBO)
};

console.log("INPUT ROOM (from TBO response):");
console.log("─".repeat(64));
console.log(`✓ RoomTypeCode: "${roomFromTBOResponse.RoomTypeCode}"`);
console.log(`✓ RoomTypeName: "${roomFromTBOResponse.RoomTypeName}"`);
console.log(
  `✗ SmokingPreference: "${roomFromTBOResponse.SmokingPreference}" (TYPE: ${typeof roomFromTBOResponse.SmokingPreference})`,
);
console.log(`✗ Price type: ${typeof roomFromTBOResponse.Price}`);
console.log();

console.log("MAPPING ROOM...");
console.log("─".repeat(64));

const mappedRoom = mapRoomForBlockRequest(roomFromTBOResponse, 0);

console.log("\nMAPPED ROOM (for BlockRoom API):");
console.log("─".repeat(64));
console.log(`✓ RoomTypeCode: "${mappedRoom.RoomTypeCode}"`);
console.log(`✓ RoomTypeName: "${mappedRoom.RoomTypeName}"`);
console.log(
  `✓ SmokingPreference: ${mappedRoom.SmokingPreference} (TYPE: ${typeof mappedRoom.SmokingPreference})`,
);
console.log(`✓ Price type: ${typeof mappedRoom.Price}`);
console.log(`✓ Price is array: ${Array.isArray(mappedRoom.Price)}`);
console.log(`✓ Price array length: ${mappedRoom.Price.length}`);
console.log(`✓ Price[0].CurrencyCode: "${mappedRoom.Price[0].CurrencyCode}"`);
console.log(`✓ Price[0].RoomPrice: ${mappedRoom.Price[0].RoomPrice}`);
console.log();

console.log("VALIDATION CHECK:");
console.log("─".repeat(64));
const validation = validateRoomForBlockRequest(mappedRoom);

if (validation.success) {
  console.log("✅ VALIDATION PASSED\n");
  console.log("Room is ready for BlockRoom API!");
} else {
  console.log("❌ VALIDATION FAILED\n");
  console.log("Errors:");
  validation.errors.forEach((error) => {
    console.log(`  - ${error}`);
  });
}

console.log();
console.log("DETAILED COMPARISON:");
console.log("─".repeat(64));

const comparison = [
  {
    field: "SmokingPreference",
    before: `"${roomFromTBOResponse.SmokingPreference}" (string)`,
    after: `${mappedRoom.SmokingPreference} (integer)`,
    status: typeof mappedRoom.SmokingPreference === "number" ? "✅" : "❌",
  },
  {
    field: "Price structure",
    before: "{ CurrencyCode, RoomPrice, ... } (object)",
    after: "[{ CurrencyCode, RoomPrice, ... }] (array)",
    status: Array.isArray(mappedRoom.Price) ? "✅" : "❌",
  },
  {
    field: "RoomIndex",
    before: "missing",
    after: `${mappedRoom.RoomIndex}`,
    status: mappedRoom.RoomIndex === 0 ? "✅" : "❌",
  },
];

comparison.forEach((item) => {
  console.log(`${item.status} ${item.field}`);
  console.log(`   Before: ${item.before}`);
  console.log(`   After:  ${item.after}`);
  console.log();
});

console.log("FINAL REQUEST STRUCTURE:");
console.log("─".repeat(64));
console.log(JSON.stringify(mappedRoom, null, 2).substring(0, 800));
console.log("...\n");

console.log(
  "╔════════════════════════════════════════════════════════════════╗",
);
console.log(
  "║                    VERIFICATION COMPLETE                      ║",
);
console.log(
  "╚════════════════════════════════════════════════════════════════╝\n",
);

if (validation.success) {
  console.log(
    "✅ FIX VERIFIED - Room is correctly formatted for TBO BlockRoom API\n",
  );
  console.log("Next steps:");
  console.log("  1. Push code to production");
  console.log("  2. Run: node test-tbo-full-booking-flow.js");
  console.log("  3. Verify ResponseStatus = 1 in BlockRoom response");
  console.log();
} else {
  console.log("❌ FIX NOT WORKING - There are validation errors\n");
  process.exit(1);
}
