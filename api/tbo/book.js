/**
 * TBO Hotel Booking
 *
 * ENDPOINTS:
 * - BlockRoom (PreBook): https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom
 * - Book: https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book
 *
 * BlockRoom validates pricing before final booking
 * Book confirms the reservation
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");
const {
  mapRoomsForBlockRequest,
  validateRoomForBlockRequest,
} = require("./roomMapper");

/**
 * Normalize passenger title to TBO-compatible format
 */
function normalizeTitle(title) {
  if (!title) return "Mr";
  const t = String(title).trim().toLowerCase();
  if (t === "mr" || t === "mr.") return "Mr";
  if (t === "mrs" || t === "mrs.") return "Mrs";
  if (t === "miss") return "Miss";
  if (t === "ms" || t === "ms.") return "Ms";
  return "Mr";
}

/**
 * Build HotelPassenger array for a room with LeadPassenger flag
 * ✅ TBO requirement: Exactly one adult per room must have LeadPassenger: true
 */
function buildHotelPassengersForRoom(roomPassengers) {
  return roomPassengers.map((pax, index) => ({
    Title: normalizeTitle(pax.title || pax.Title),
    FirstName: pax.firstName || pax.FirstName || "Guest",
    MiddleName: pax.middleName || pax.MiddleName || null,
    LastName: pax.lastName || pax.LastName || "Guest",
    Phoneno: pax.phone || pax.Phoneno || null,
    Email: pax.email || pax.Email || null,
    PaxType: pax.paxType || pax.PaxType || 1, // 1 = Adult, 2 = Child
    LeadPassenger: index === 0, // ✅ MANDATORY: Mark first adult in room as lead guest
    Age: pax.age || pax.Age || 30,
    PassportNo: pax.passportNo || pax.PassportNo || null,
    PassportIssueDate:
      pax.passportIssueDate || pax.PassportIssueDate || "0001-01-01T00:00:00",
    PassportExpDate:
      pax.passportExpDate || pax.PassportExpDate || "0001-01-01T00:00:00",
    PAN: pax.pan || pax.PAN || null,
    AddressLine1: pax.addressLine1 || pax.AddressLine1 || null,
    City: pax.city || pax.City || null,
    CountryCode: pax.countryCode || pax.CountryCode || null,
    CountryName: pax.countryName || pax.CountryName || null,
    Nationality: pax.nationality || pax.Nationality || null,
  }));
}

/**
 * Block Room (PreBook)
 *
 * Validates pricing and availability before final booking
 * Required to ensure price hasn't changed
 */
async function blockRoom(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO BLOCK ROOM (PREBOOK)");
  console.log("═".repeat(80));

  // 1. Get TokenId
  console.log("\nStep 1: Authenticating...");
  const authData = await authenticateTBO();
  const tokenId = authData.TokenId;

  if (!tokenId) {
    throw new Error("Authentication failed - no TokenId");
  }
  console.log("✅ TokenId obtained");

  // 2. Build request
  const {
    traceId,
    resultIndex,
    hotelCode,
    hotelName,
    guestNationality = "IN",
    noOfRooms = 1,
    hotelRoomDetails,
    isVoucherBooking = false,
  } = params;

  if (!traceId || !resultIndex || !hotelCode || !hotelRoomDetails) {
    throw new Error("Missing required parameters");
  }

  // ✅ CRITICAL: Transform room details to convert SmokingPreference from string to integer
  // TBO's deserialization expects SmokingPreference as Int64 (0=NoPreference, 1=Smoking, 2=NonSmoking, 3=Either)
  // The GetHotelRoom response provides SmokingPreference as string, which must be converted

  console.log("\nStep 2a: Mapping room details...");
  const mappedRooms = mapRoomsForBlockRequest(hotelRoomDetails);

  console.log("\nStep 2b: Validating room details...");
  const validationResults = mappedRooms.map((room) =>
    validateRoomForBlockRequest(room),
  );
  const invalidRooms = validationResults.filter((result) => !result.success);

  if (invalidRooms.length > 0) {
    console.log("❌ Validation errors:");
    invalidRooms.forEach((result) => {
      console.log("  Errors:", result.errors);
    });
    throw new Error("Room validation failed");
  }

  console.log(`✅ ${mappedRooms.length} room(s) mapped and validated`);

  console.log("\nStep 2: Preparing room details for BlockRoom...");
  console.log(`  Rooms count: ${mappedRooms.length}`);

  mappedRooms.forEach((room, index) => {
    console.log(`  Room ${index}:`);
    console.log(`    RoomTypeName: ${room.RoomTypeName}`);
    console.log(
      `    SmokingPreference: ${room.SmokingPreference} (type: ${typeof room.SmokingPreference})`,
    );
    console.log(
      `    Price: ${typeof room.Price === "object" && !Array.isArray(room.Price) ? "object ✓" : Array.isArray(room.Price) ? "ARRAY ✗" : "INVALID"}`,
    );
  });

  // ✅ CRITICAL FIX: Field name is HotelRoomsDetails (WITH 's'), NOT HotelRoomDetails
  // ✅ Pass mapped rooms with SmokingPreference as INTEGER, not string

  // ✅ PER TBO BLOCKROOM SPEC: CategoryId is a top-level MANDATORY field (field 6)
  // Extract from primary room or fall back to alternatives
  const primaryRoom = mappedRooms[0];
  const blockRoomCategoryId =
    primaryRoom?.CategoryId ||
    primaryRoom?.CategoryCode ||
    primaryRoom?.RoomCategoryId ||
    undefined;

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    TraceId: traceId,
    ResultIndex: Number(resultIndex),
    HotelCode: String(hotelCode),
    CategoryId: blockRoomCategoryId, // ✅ TOP-LEVEL CategoryId per TBO docs (field 6, mandatory)
    HotelName: hotelName,
    GuestNationality: guestNationality,
    NoOfRooms: Number(noOfRooms),
    IsVoucherBooking: isVoucherBooking,
    HotelRoomsDetails: mappedRooms, // ✅ WITH 's' - correct field name, WITH mapped rooms (SmokingPreference as integer)
  };

  const url =
    process.env.TBO_HOTEL_BLOCKROOM_URL ||
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom";

  console.log("\nStep 2: Blocking room...");
  console.log("  URL:", url);
  console.log("  TraceId:", request.TraceId);
  console.log("  HotelCode:", request.HotelCode);
  console.log("  HotelName:", request.HotelName);
  console.log("  NoOfRooms:", request.NoOfRooms);
  console.log("");

  // ✅ DIAGNOSTIC: Log CategoryId at both root and room level (TBO spec requires top-level)
  console.log(
    "🔍 DIAGNOSTIC: BlockRoom CategoryId (TBO spec requires top-level):",
  );
  console.log(
    `  Root CategoryId   : "${blockRoomCategoryId || "<<MISSING>>"}"`,
  );
  console.log(`    Type: ${typeof blockRoomCategoryId}`);
  console.log(`    Truthy: ${!!blockRoomCategoryId}`);
  console.log("");
  console.log("🔍 DIAGNOSTIC: CategoryId in HotelRoomsDetails (nested):");
  mappedRooms.forEach((room, idx) => {
    console.log(
      `  Room ${idx}: CategoryId = "${room.CategoryId || "<<MISSING>>"}"`,
    );
    console.log(`    Type: ${typeof room.CategoryId}`);
    console.log(`    Truthy: ${!!room.CategoryId}`);
  });
  console.log("");

  // ✅ DIAGNOSTIC: Log Price structure (must be object, not array)
  console.log(
    "🔍 DIAGNOSTIC: BlockRoom Price structure (TBO requires object, not array):",
  );
  mappedRooms.forEach((room, idx) => {
    console.log(`  Room ${idx} Price:`);
    console.log(`    Type: ${typeof room.Price}`);
    console.log(`    Is Array: ${Array.isArray(room.Price)}`);
    console.log(
      `    CurrencyCode: "${room.Price?.CurrencyCode || "<<MISSING>>"}"`,
    );
    console.log(`    RoomPrice: ${room.Price?.RoomPrice || "<<MISSING>>"}`);
    console.log(
      `    Tax: ${room.Price?.Tax !== undefined ? room.Price.Tax : "<<MISSING>>"}`,
    );
    console.log(
      `    OtherCharges: ${room.Price?.OtherCharges !== undefined ? room.Price.OtherCharges : "<<MISSING>>"}`,
    );
  });
  console.log("");

  console.log("📤 Request Payload:");
  console.log(
    JSON.stringify(
      {
        ...request,
        TokenId: tokenId.substring(0, 30) + "...",
      },
      null,
      2,
    ),
  );
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: request,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    timeout: 30000,
  });

  // ✅ DEBUG: Log raw response to identify wrapper name
  console.log("\n🔍 RAW RESPONSE KEYS:", Object.keys(response.data || {}));
  console.log(
    "🔍 RAW RESPONSE:",
    JSON.stringify(response.data, null, 2).substring(0, 500),
  );

  // ✅ Handle multiple possible wrapper names (TBO docs show BlockRoomResult)
  const result =
    response.data?.BlockRoomResponse ||
    response.data?.BlockRoomResult ||
    response.data;

  console.log("\n📥 TBO BlockRoom Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", result?.ResponseStatus);
  console.log("  AvailabilityType:", result?.AvailabilityType);
  console.log("  IsPriceChanged:", result?.IsPriceChanged);
  console.log(
    "  IsCancellationPolicyChanged:",
    result?.IsCancellationPolicyChanged,
  );
  // ✅ Check both singular and plural as TBO API may return either
  const roomDetails =
    result?.HotelRoomDetails || result?.HotelRoomsDetails || [];
  console.log("  HotelRoomDetails count:", roomDetails.length);
  console.log("  Error:", result?.Error?.ErrorMessage || "None");
  console.log("");

  return {
    responseStatus: result?.ResponseStatus,
    availabilityType: result?.AvailabilityType,
    isPriceChanged: result?.IsPriceChanged,
    isCancellationPolicyChanged: result?.IsCancellationPolicyChanged,
    hotelRoomDetails: roomDetails, // ✅ Handle both singular and plural
    error: result?.Error,
  };
}

/**
 * Book Hotel
 *
 * Confirms the final booking
 * Must be called after BlockRoom
 */
async function bookHotel(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO BOOK HOTEL");
  console.log("═".repeat(80));

  // 1. Get TokenId
  console.log("\nStep 1: Authenticating...");
  const authData = await authenticateTBO();
  const tokenId = authData.TokenId;

  if (!tokenId) {
    throw new Error("Authentication failed - no TokenId");
  }
  console.log("✅ TokenId obtained");

  // 2. Build request
  const {
    traceId,
    resultIndex,
    hotelCode,
    hotelName,
    guestNationality = "IN",
    noOfRooms = 1,
    hotelRoomDetails,
    isVoucherBooking = false,
    hotelPassenger,
  } = params;

  if (
    !traceId ||
    !resultIndex ||
    !hotelCode ||
    !hotelRoomDetails ||
    !hotelPassenger
  ) {
    throw new Error("Missing required parameters");
  }

  // ✅ CRITICAL: Per TBO documentation, use the exact structure from BlockRoom response
  // This includes the final Price object that BlockRoom calculated/validated
  // Add HotelPassenger to each room but preserve ALL other fields exactly as they came from BlockRoom
  console.log("\nStep 2: Preparing room details with passenger information...");

  // ✅ CRITICAL: SmokingPreference must be NUMERIC (0-3) for Book API, not string
  // TBO's Book deserialization expects Int64, not string like "NoPreference"
  const smokingEnumMap = {
    nopreference: 0,
    smoking: 1,
    nonsmoking: 2,
    either: 3,
  };

  const roomDetailsWithPassengers = hotelRoomDetails.map((room, roomIndex) => {
    // Convert SmokingPreference to numeric value if it's a string
    let smokingPref = room.SmokingPreference ?? 0;
    if (typeof smokingPref === "string") {
      smokingPref = smokingEnumMap[smokingPref.toLowerCase()] ?? 0;
    }

    // ✅ CRITICAL: Build HotelPassenger with LeadPassenger flag
    // TBO requires exactly one adult per room to have LeadPassenger: true
    const passengersForRoom = buildHotelPassengersForRoom(hotelPassenger);

    return {
      ...room, // Keep ALL fields from BlockRoom response (includes updated Price if IsPriceChanged)
      SmokingPreference: smokingPref, // ✅ OVERRIDE with numeric value for Book API
      // ✅ DO NOT OVERRIDE Price - use the exact Price object from BlockRoom
      // (The ...room spread above preserves room.Price from BlockRoom response)
      HotelPassenger: passengersForRoom, // ✅ WITH LeadPassenger: true for first adult
    };
  });

  roomDetailsWithPassengers.forEach((room, index) => {
    console.log(
      `  Room ${index}: ${room.RoomTypeName} (with ${hotelPassenger.length} passenger(s))`,
    );
    console.log(
      `    SmokingPreference: ${room.SmokingPreference} (type: ${typeof room.SmokingPreference})`,
    );
  });

  // ✅ DIAGNOSTIC: Log the Price object being used for Book (should come from BlockRoom response)
  console.log(
    "\n🔍 DIAGNOSTIC: Book Price (must come from BlockRoom response):",
  );
  roomDetailsWithPassengers.forEach((room, idx) => {
    console.log(`  Room ${idx} Price:`);
    console.log(`    RoomPrice: ${room.Price?.RoomPrice || "<<MISSING>>"}`);
    console.log(
      `    PublishedPrice: ${room.Price?.PublishedPrice || "<<MISSING>>"}`,
    );
    console.log(
      `    OfferedPrice: ${room.Price?.OfferedPrice || "<<MISSING>>"}`,
    );
    console.log(`    Tax: ${room.Price?.Tax || "<<MISSING>>"}`);
    console.log(
      `    Full Price object:`,
      JSON.stringify(room.Price, null, 2).substring(0, 200),
    );
  });
  console.log("");

  // ✅ PER TBO SPEC: CategoryId should be at root level for de-dupe Book requests
  // Extract from first room (same as we did for BlockRoom)
  const primaryRoom = roomDetailsWithPassengers[0];
  const bookCategoryId = primaryRoom?.CategoryId || undefined;

  // ✅ CRITICAL FIX: Field name is HotelRoomsDetails (WITH 's'), NOT HotelRoomDetails
  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    TraceId: traceId,
    ResultIndex: Number(resultIndex),
    HotelCode: String(hotelCode),
    CategoryId: bookCategoryId, // ✅ TOP-LEVEL CategoryId for de-dupe Book requests
    HotelName: hotelName,
    GuestNationality: guestNationality,
    NoOfRooms: Number(noOfRooms),
    IsVoucherBooking: isVoucherBooking,
    HotelRoomsDetails: roomDetailsWithPassengers, // ✅ WITH 's' - correct field name for Book API
  };

  const url =
    process.env.TBO_HOTEL_BOOK_URL ||
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book";

  console.log("\nStep 2: Booking hotel...");
  console.log("  URL:", url);
  console.log("  TraceId:", request.TraceId);
  console.log("  HotelCode:", request.HotelCode);
  console.log("  CategoryId:", request.CategoryId || "<<Not set>>");
  console.log("  HotelName:", request.HotelName);
  console.log(
    "  Lead Passenger:",
    hotelPassenger[0]?.FirstName,
    hotelPassenger[0]?.LastName,
  );
  console.log("");

  // ✅ DIAGNOSTIC: Verify SmokingPreference is numeric in Book request
  console.log(
    "🔍 DIAGNOSTIC: Book SmokingPreference (TBO requires numeric, not string):",
  );
  roomDetailsWithPassengers.forEach((room, idx) => {
    console.log(`  Room ${idx} SmokingPreference:`);
    console.log(`    Value: ${room.SmokingPreference}`);
    console.log(`    Type: ${typeof room.SmokingPreference}`);
    console.log(
      `    Valid: ${typeof room.SmokingPreference === "number" ? "✓" : "✗"}`,
    );
  });
  console.log("");

  // ✅ DIAGNOSTIC: Verify LeadPassenger is set correctly
  console.log("🔍 DIAGNOSTIC: Book LeadPassenger (TBO requires one per room):");
  roomDetailsWithPassengers.forEach((room, idx) => {
    console.log(`  Room ${idx} HotelPassenger:`);
    room.HotelPassenger.forEach((pax, paxIdx) => {
      console.log(
        `    Pax ${paxIdx}: ${pax.FirstName} ${pax.LastName} - LeadPassenger: ${pax.LeadPassenger}`,
      );
    });
  });
  console.log("");

  console.log("📤 Request Payload:");
  console.log(
    JSON.stringify(
      {
        ...request,
        TokenId: tokenId.substring(0, 30) + "...",
      },
      null,
      2,
    ),
  );
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: request,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    timeout: 30000,
  });

  // ✅ DEBUG: Log raw response to identify wrapper name and fields
  console.log("\n🔍 RAW RESPONSE KEYS:", Object.keys(response.data || {}));
  console.log(
    "🔍 RAW RESPONSE:",
    JSON.stringify(response.data, null, 2).substring(0, 1000),
  );

  // �� Handle multiple possible wrapper names
  const result =
    response.data?.BookResponse ||
    response.data?.HotelBookResult ||
    response.data?.BookResult ||
    response.data;

  console.log("\n📥 TBO Book Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", result?.ResponseStatus);
  console.log("  BookingRefNo:", result?.BookingRefNo);
  console.log("  BookingId:", result?.BookingId);
  console.log("  ConfirmationNo:", result?.ConfirmationNo);
  console.log("  Status:", result?.Status);
  console.log("  Error:", result?.Error?.ErrorMessage || "None");
  console.log("");

  return {
    responseStatus: result?.ResponseStatus,
    bookingRefNo: result?.BookingRefNo,
    bookingId: result?.BookingId,
    confirmationNo: result?.ConfirmationNo,
    status: result?.Status,
    isPriceChanged: result?.IsPriceChanged,
    hotelBookingDetails: result?.HotelBookingDetails,
    error: result?.Error,
  };
}

module.exports = { blockRoom, bookHotel };
