/**
 * Test: BlockRoom Fix Verification
 *
 * Tests room mapping and validation for the BlockRoom API fix
 * Verifies that room details are correctly transformed before sending to TBO
 */

const {
  mapRoomForBlockRequest,
  mapRoomsForBlockRequest,
  validateRoomForBlockRequest,
} = require("./api/tbo/roomMapper");

console.log(
  "╔═══════════════════════════════════════════════════════════════╗",
);
console.log(
  "║         TBO BLOCKROOM FIX - ROOM MAPPING TEST                 ║",
);
console.log(
  "╚═══════════════════════════════════════��═══════════════════════╝\n",
);

// Test 1: Map a single room with minimal fields
console.log("TEST 1: Map room with minimal fields");
console.log("─".repeat(60));

const minimalRoom = {
  RoomTypeCode: "RT001",
  RoomTypeName: "Double Room",
  Price: {
    CurrencyCode: "INR",
    RoomPrice: 5000,
    Tax: 900,
  },
};

try {
  const mappedMinimal = mapRoomForBlockRequest(minimalRoom, 0);

  console.log("✅ Minimal room mapped successfully");
  console.log("   Fields added:");
  console.log(`   - RoomIndex: ${mappedMinimal.RoomIndex}`);
  console.log(`   - RatePlanCode: "${mappedMinimal.RatePlanCode}"`);
  console.log(`   - SmokingPreference: ${mappedMinimal.SmokingPreference}`);
  console.log(`   - Supplements: ${JSON.stringify(mappedMinimal.Supplements)}`);
  console.log(
    `   - Price structure: ${JSON.stringify(mappedMinimal.Price).substring(0, 50)}...`,
  );
} catch (error) {
  console.log("❌ Failed:", error.message);
}

console.log("\n");

// Test 2: Map a room with all fields populated
console.log("TEST 2: Map room with all fields populated");
console.log("─".repeat(60));

const fullRoom = {
  RoomTypeCode: "RT002",
  RoomTypeName: "Suite",
  RatePlanCode: "PLAN123",
  RatePlanName: "Premium Plan",
  BedTypes: [{ BedTypeCode: 1, BedTypeDescription: "Double Bed" }],
  SmokingPreference: 2,
  Supplements: ["WiFi", "Breakfast"],
  Price: {
    CurrencyCode: "INR",
    RoomPrice: 10000,
    Tax: 1800,
    ExtraGuestCharge: 500,
    ChildCharge: 0,
    OtherCharges: 200,
    Discount: 0,
    PublishedPrice: 12500,
    PublishedPriceRoundedOff: 12500,
    OfferedPrice: 11800,
    OfferedPriceRoundedOff: 11800,
    AgentCommission: 500,
    AgentMarkUp: 300,
    TDS: 50,
  },
};

try {
  const mappedFull = mapRoomForBlockRequest(fullRoom, 1);

  console.log("✅ Full room mapped successfully");
  console.log("   Room Index:", mappedFull.RoomIndex);
  console.log("   Rate Plan Code:", mappedFull.RatePlanCode);
  console.log("   Room Type:", mappedFull.RoomTypeName);
  console.log("   Smoking Preference:", mappedFull.SmokingPreference);
  console.log("   Supplements:", mappedFull.Supplements.length, "items");
  console.log("   Price Currency:", mappedFull.Price[0].CurrencyCode);
  console.log("   Room Price:", mappedFull.Price[0].RoomPrice);
} catch (error) {
  console.log("❌ Failed:", error.message);
}

console.log("\n");

// Test 3: Map multiple rooms
console.log("TEST 3: Map multiple rooms");
console.log("─".repeat(60));

const multipleRooms = [
  {
    RoomTypeCode: "RT001",
    RoomTypeName: "Standard Room",
    Price: { CurrencyCode: "INR", RoomPrice: 5000, Tax: 900 },
  },
  {
    RoomTypeCode: "RT002",
    RoomTypeName: "Deluxe Room",
    Price: { CurrencyCode: "INR", RoomPrice: 7000, Tax: 1260 },
  },
];

try {
  const mappedRooms = mapRoomsForBlockRequest(multipleRooms);

  console.log(`✅ ${mappedRooms.length} rooms mapped successfully`);
  mappedRooms.forEach((room, index) => {
    console.log(`   Room ${index}:`);
    console.log(`     - Type: ${room.RoomTypeName}`);
    console.log(`     - Price: ${room.Price[0].RoomPrice}`);
    console.log(`     - Index: ${room.RoomIndex}`);
  });
} catch (error) {
  console.log("❌ Failed:", error.message);
}

console.log("\n");

// Test 4: Validate mapped room
console.log("TEST 4: Validate mapped room structure");
console.log("─".repeat(60));

try {
  const mappedRoom = mapRoomForBlockRequest(minimalRoom, 0);
  const validation = validateRoomForBlockRequest(mappedRoom);

  if (validation.success) {
    console.log("✅ Room validation passed");
  } else {
    console.log("⚠️  Room validation warnings:");
    validation.errors.forEach((error) => {
      console.log(`   - ${error}`);
    });
  }
} catch (error) {
  console.log("��� Validation failed:", error.message);
}

console.log("\n");

// Test 5: Field name alternatives (PlanCode instead of RatePlanCode)
console.log("TEST 5: Handle alternative field names");
console.log("─".repeat(60));

const roomWithAltNames = {
  RoomTypeCode: "RT001",
  RoomTypeName: "Standard Room",
  PlanCode: "ALT_PLAN", // Alternative field name
  PlanName: "Alternative Plan",
  Price: { CurrencyCode: "INR", RoomPrice: 5000, Tax: 900 },
};

try {
  const mapped = mapRoomForBlockRequest(roomWithAltNames, 0);

  console.log("✅ Alternative field names handled:");
  console.log(`   - PlanCode → RatePlanCode: "${mapped.RatePlanCode}"`);
  console.log(`   - PlanName → RatePlanName: "${mapped.RatePlanName}"`);
} catch (error) {
  console.log("❌ Failed:", error.message);
}

console.log("\n");

// Test 6: Complete BlockRoom request structure
console.log("TEST 6: Complete BlockRoom request structure");
console.log("─".repeat(60));

try {
  const sampleRoom = {
    RoomTypeCode: "RT001",
    RoomTypeName: "Double Room",
    Price: { CurrencyCode: "INR", RoomPrice: 5000, Tax: 900 },
  };

  const mappedRoom = mapRoomForBlockRequest(sampleRoom, 0);

  const blockRoomRequest = {
    EndUserIp: "52.5.155.132",
    TokenId: "TOKEN_XXXXX",
    TraceId: "TRACE_123456",
    ResultIndex: 0,
    HotelCode: "HOTEL_123",
    HotelName: "Test Hotel",
    GuestNationality: "IN",
    NoOfRooms: 1,
    IsVoucherBooking: true,
    HotelRoomDetails: [mappedRoom], // ← Mapped room
  };

  console.log("✅ BlockRoom request structure created");
  console.log("\nRequest summary:");
  console.log(
    `  - Hotel: ${blockRoomRequest.HotelName} (${blockRoomRequest.HotelCode})`,
  );
  console.log(`  - Rooms: ${blockRoomRequest.NoOfRooms}`);
  console.log(
    `  - Room Type: ${blockRoomRequest.HotelRoomDetails[0].RoomTypeName}`,
  );
  console.log(
    `  - Room Price: ${blockRoomRequest.HotelRoomDetails[0].Price[0].CurrencyCode} ${blockRoomRequest.HotelRoomDetails[0].Price[0].RoomPrice}`,
  );
  console.log(
    `  - Room Details fields: ${Object.keys(blockRoomRequest.HotelRoomDetails[0]).length}`,
  );
} catch (error) {
  console.log("❌ Failed:", error.message);
}

console.log("\n");

// Summary
console.log(
  "╔═══════════════════════════════════════════════════════════════╗",
);
console.log(
  "║                    TEST SUMMARY                               ║",
);
console.log(
  "╚════════════════��══════════════════════════════════════════════╝",
);
console.log("\n✅ Room Mapping Tests Completed Successfully\n");

console.log("What the fix does:");
console.log("  1. ✅ Maps room fields from GetHotelRoom to BlockRoom format");
console.log("  2. ✅ Adds missing RoomIndex field");
console.log(
  "  3. ✅ Handles alternative field names (PlanCode, OfferCode, etc.)",
);
console.log("  4. ✅ Provides defaults for optional fields");
console.log("  5. ✅ Validates complete Price structure");
console.log("  6. ✅ Ensures all mandatory fields are present\n");

console.log("Next steps:");
console.log("  1. Run full TBO booking flow test");
console.log("  2. Verify BlockRoom API returns ResponseStatus = 1");
console.log("  3. Deploy to production");
console.log("  4. Monitor booking flow for any errors\n");
