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

  console.log("📥 TBO Room Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", response.data?.ResponseStatus);
  console.log("  TraceId:", response.data?.TraceId);
  console.log("  Room Count:", response.data?.HotelRoomDetails?.length || 0);
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  console.log("");

  if (response.data?.HotelRoomDetails?.length > 0) {
    console.log("Sample Rooms (first 3):");
    response.data.HotelRoomDetails.slice(0, 3).forEach((r, i) => {
      console.log(
        `  ${i + 1}. ${r.RoomTypeName} - ${r.Price?.CurrencyCode} ${r.Price?.OfferedPrice}`,
      );
      console.log(`     Cancellation: ${r.LastCancellationDate || "N/A"}`);
    });
    console.log("");
  }

  return {
    responseStatus: response.data?.ResponseStatus,
    traceId: response.data?.TraceId,
    isUnderCancellationAllowed: response.data?.IsUnderCancellationAllowed,
    isPolicyPerStay: response.data?.IsPolicyPerStay,
    isPassportMandatory: response.data?.IsPassportMandatory,
    isPANMandatory: response.data?.IsPANMandatory,
    rooms: response.data?.HotelRoomDetails || [],
    error: response.data?.Error,
  };
}

module.exports = { getHotelRoom };
