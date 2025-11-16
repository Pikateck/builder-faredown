/**
 * TBO Hotel Room Details
 *
 * ENDPOINT:
 * https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelRoom
 *
 * Gets detailed room information, pricing, and cancellation policies
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");

/**
 * Get Hotel Room Details
 *
 * Required parameters:
 * - traceId: From search response
 * - resultIndex: Hotel index from search
 * - hotelCode: Hotel code from search
 *
 * Returns detailed room information with pricing and policies
 */
async function getHotelRoom(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO GET HOTEL ROOM");
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
  const { traceId, resultIndex, hotelCode } = params;

  if (!traceId || !resultIndex || !hotelCode) {
    throw new Error(
      "Missing required parameters: traceId, resultIndex, hotelCode",
    );
  }

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    TraceId: traceId,
    ResultIndex: Number(resultIndex),
    HotelCode: String(hotelCode),
  };

  const url =
    process.env.TBO_HOTEL_ROOM_URL ||
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelRoom";

  console.log("\nStep 2: Getting room details...");
  console.log("  URL:", url);
  console.log("  TraceId:", request.TraceId);
  console.log("  ResultIndex:", request.ResultIndex);
  console.log("  HotelCode:", request.HotelCode);
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

  // ✅ CORRECTED: Handle GetHotelRoomResult wrapper as per TBO docs
  const result = response.data?.GetHotelRoomResult || response.data;

  console.log("📥 TBO Room Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", result?.ResponseStatus);
  console.log("  TraceId:", result?.TraceId);
  console.log("  Room Count:", result?.HotelRoomsDetails?.length || 0);
  console.log("  Error:", result?.Error?.ErrorMessage || "None");
  console.log("");

  if (result?.HotelRoomsDetails?.length > 0) {
    console.log("Sample Rooms (first 3):");
    result.HotelRoomsDetails.slice(0, 3).forEach((r, i) => {
      console.log(
        `  ${i + 1}. ${r.RoomTypeName} - ${r.Price?.CurrencyCode} ${r.Price?.OfferedPrice}`,
      );
      console.log(`     Cancellation: ${r.LastCancellationDate || "N/A"}`);
      console.log(
        `     Fields: RoomTypeID=${r.RoomTypeID}, RoomCombination=${r.RoomCombination}, RoomIndex=${r.RoomIndex}`,
      );
    });
    console.log("");
  }

  // ✅ IMPORTANT: Log all fields from GetHotelRoom response for BlockRoom
  console.log("🔍 Full GetHotelRoom response structure (first room):");
  if (result?.HotelRoomsDetails?.[0]) {
    console.log(JSON.stringify(result.HotelRoomsDetails[0], null, 2).substring(0, 500));
  }

  return {
    responseStatus: result?.ResponseStatus,
    traceId: result?.TraceId,
    isUnderCancellationAllowed: result?.IsUnderCancellationAllowed,
    isPolicyPerStay: result?.IsPolicyPerStay,
    isPassportMandatory: result?.IsPassportMandatory,
    isPANMandatory: result?.IsPANMandatory,
    rooms: result?.HotelRoomsDetails || [],
    // ✅ Include full response for BlockRoom
    fullResponse: result,
    error: result?.Error,
  };
}

module.exports = { getHotelRoom };
