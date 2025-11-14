/**
 * TBO Debug - Hotel Booking
 * Endpoints:
 * - BlockRoom: https://affiliate.travelboutiqueonline.com/HotelAPI/BlockRoom
 * - Book: https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book
 * Method: POST
 * Auth: TokenId
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");

/**
 * Block Room (PreBook)
 */
async function blockRoom(params = {}) {
  const authData = await authenticateTBO();
  const tokenId = authData.TokenId;

  if (!tokenId) {
    throw new Error("Authentication failed - no TokenId");
  }

  const {
    resultIndex,
    traceId,
    hotelCode,
    rateKey
  } = params;

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP,
    TokenId: tokenId,
    ResultIndex: resultIndex,
    TraceId: traceId,
    HotelCode: hotelCode,
    RateKey: rateKey
  };

  const url = process.env.TBO_HOTEL_SEARCH_URL + "BlockRoom";

  console.log("🔒 TBO Block Room Request");
  console.log("  URL:", url);
  console.log("  HotelCode:", request.HotelCode);
  console.log("  ResultIndex:", request.ResultIndex);
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

  console.log("📥 TBO Block Room Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Status:", response.data?.Status);
  console.log("  BlockRoomId:", response.data?.BlockRoomId || "N/A");
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  console.log("");

  return response.data;
}

/**
 * Book Hotel
 */
async function bookHotel(params = {}) {
  const authData = await authenticateTBO();
  const tokenId = authData.TokenId;

  if (!tokenId) {
    throw new Error("Authentication failed - no TokenId");
  }

  const {
    blockRoomId,
    guestDetails,
    specialRequests = ""
  } = params;

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP,
    TokenId: tokenId,
    BlockRoomId: blockRoomId,
    GuestDetails: guestDetails,
    SpecialRequests: specialRequests
  };

  const url = process.env.TBO_HOTEL_BOOKING + "Book";

  console.log("📝 TBO Book Hotel Request");
  console.log("  URL:", url);
  console.log("  BlockRoomId:", request.BlockRoomId);
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

  console.log("📥 TBO Book Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Status:", response.data?.Status);
  console.log("  BookingId:", response.data?.BookingId || "N/A");
  console.log("  ConfirmationNo:", response.data?.ConfirmationNo || "N/A");
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  console.log("");

  return response.data;
}

/**
 * Get Booking Details
 */
async function getBookingDetails(params = {}) {
  const authData = await authenticateTBO();
  const tokenId = authData.TokenId;

  if (!tokenId) {
    throw new Error("Authentication failed - no TokenId");
  }

  const {
    bookingId,
    confirmationNo
  } = params;

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP,
    TokenId: tokenId,
    BookingId: bookingId || "",
    ConfirmationNo: confirmationNo || ""
  };

  const url = process.env.TBO_HOTEL_BOOKING + "GetBookingDetail";

  console.log("📋 TBO Booking Details Request");
  console.log("  URL:", url);
  console.log("  BookingId:", request.BookingId || "N/A");
  console.log("  ConfirmationNo:", request.ConfirmationNo || "N/A");
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

  console.log("📥 TBO Booking Details Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Status:", response.data?.Status);
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  console.log("");

  return response.data;
}

module.exports = { blockRoom, bookHotel, getBookingDetails };
