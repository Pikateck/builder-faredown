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

  // ✅ CRITICAL: Per TBO documentation Sample Verification page:
  // "The details in the HotelRoomsDetails array should be passed as per the combination received in the GetHotelRoom response."
  // Pass room details EXACTLY as received from GetHotelRoom - do NOT map or transform!
  // TBO expects full structure including RoomTypeID, RoomCombination, etc.

  console.log("\nStep 2: Preparing room details for BlockRoom...");
  console.log(`  Rooms count: ${hotelRoomDetails.length}`);
  console.log(`  Using rooms AS-IS from GetHotelRoom response (matching combination type)`);

  hotelRoomDetails.forEach((room, index) => {
    console.log(`  Room ${index}:`);
    console.log(`    RoomTypeName: ${room.RoomTypeName}`);
    console.log(`    RoomTypeID: ${room.RoomTypeID}`);
    console.log(`    RoomCombination: ${room.RoomCombination}`);
    console.log(`    RoomIndex: ${room.RoomIndex}`);
  });

  // ✅ CRITICAL FIX: Field name is HotelRoomsDetails (WITH 's'), NOT HotelRoomDetails
  // This was the actual error - we were using the wrong field name!
  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    TraceId: traceId,
    ResultIndex: Number(resultIndex),
    HotelCode: String(hotelCode),
    HotelName: hotelName,
    GuestNationality: guestNationality,
    NoOfRooms: Number(noOfRooms),
    IsVoucherBooking: isVoucherBooking,
    HotelRoomsDetails: hotelRoomDetails, // ✅ WITH 's' - correct field name for BlockRoom API
  };

  const url =
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom";

  console.log("\nStep 2: Blocking room...");
  console.log("  URL:", url);
  console.log("  TraceId:", request.TraceId);
  console.log("  HotelCode:", request.HotelCode);
  console.log("  HotelName:", request.HotelName);
  console.log("  NoOfRooms:", request.NoOfRooms);
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

  // ✅ Map and validate room details
  console.log("\nStep 2a: Mapping room details for booking...");
  const mappedRoomDetails = mapRoomsForBlockRequest(hotelRoomDetails);

  // ✅ IMPORTANT: TBO expects HotelRoomDetails (singular) NOT HotelRoomsDetails
  // According to official TBO API docs: https://apidoc.tektravels.com/hotel/HotelBook.aspx
  // HotelPassenger should be inside each HotelRoomDetails element
  const roomDetailsWithPassengers = mappedRoomDetails.map((room) => ({
    ...room,
    HotelPassenger: hotelPassenger,
  }));

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    TraceId: traceId,
    ResultIndex: Number(resultIndex),
    HotelCode: String(hotelCode),
    HotelName: hotelName,
    GuestNationality: guestNationality,
    NoOfRooms: Number(noOfRooms),
    IsVoucherBooking: isVoucherBooking,
    HotelRoomDetails: roomDetailsWithPassengers, // ✅ No 's' - matches TBO API spec exactly
  };

  const url =
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book";

  console.log("\nStep 2: Booking hotel...");
  console.log("  URL:", url);
  console.log("  TraceId:", request.TraceId);
  console.log("  HotelCode:", request.HotelCode);
  console.log("  HotelName:", request.HotelName);
  console.log(
    "  Lead Passenger:",
    hotelPassenger[0]?.FirstName,
    hotelPassenger[0]?.LastName,
  );
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

  // ✅ Handle multiple possible wrapper names
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
