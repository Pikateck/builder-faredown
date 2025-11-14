/**
 * TBO Debug - Hotel Room Details
 * Endpoint: https://affiliate.travelboutiqueonline.com/HotelAPI/GetHotelRoom
 * Method: POST
 * Auth: TokenId
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");

/**
 * Get Hotel Room Details
 */
async function getHotelRoom(params = {}) {
  // 1. Get TokenId
  const authData = await authenticateTBO();
  const tokenId = authData.TokenId;

  if (!tokenId) {
    throw new Error("Authentication failed - no TokenId");
  }

  // 2. Build request
  const {
    resultIndex,    // From search results
    traceId         // From search results
  } = params;

  if (!resultIndex) {
    throw new Error("resultIndex is required (from search results)");
  }

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP,
    TokenId: tokenId,
    ResultIndex: resultIndex,
    TraceId: traceId || ""
  };

  const url = process.env.TBO_HOTEL_SEARCH_URL + "GetHotelRoom";

  console.log("🛏️ TBO Hotel Room Request");
  console.log("  URL:", url);
  console.log("  ResultIndex:", request.ResultIndex);
  console.log("  TraceId:", request.TraceId || "N/A");
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: request,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate"
    }
  });

  console.log("📥 TBO Room Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Status:", response.data?.Status);
  console.log("  Room Count:", response.data?.HotelRoomsDetails?.length || 0);
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  
  if (response.data?.HotelRoomsDetails?.length > 0) {
    console.log("\nRoom Details:");
    response.data.HotelRoomsDetails.slice(0, 3).forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.RoomTypeName || r.RoomName}`);
      console.log(`   Price: ${r.Price?.OfferedPrice} ${r.Price?.CurrencyCode}`);
      console.log(`   Max Occupancy: ${r.MaxOccupancy || 'N/A'}`);
    });
  }
  console.log("");

  return response.data;
}

module.exports = { getHotelRoom };
