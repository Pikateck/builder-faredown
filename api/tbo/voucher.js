/**
 * TBO Hotel Voucher
 *
 * ENDPOINT:
 * https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GenerateVoucher
 *
 * Generates a voucher PDF/document after successful booking
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");

/**
 * Generate Voucher
 *
 * Required parameters:
 * - bookingRefNo: From Book response
 * - bookingId: From Book response
 *
 * Returns voucher URL and details
 */
async function generateVoucher(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO GENERATE VOUCHER");
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
  const { bookingRefNo, bookingId } = params;

  if (!bookingRefNo || !bookingId) {
    throw new Error("Missing required parameters: bookingRefNo, bookingId");
  }

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    BookingRefNo: String(bookingRefNo),
    BookingId: String(bookingId),
  };

  const url =
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GenerateVoucher";

  console.log("\nStep 2: Generating voucher...");
  console.log("  URL:", url);
  console.log("  BookingRefNo:", request.BookingRefNo);
  console.log("  BookingId:", request.BookingId);
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

  console.log("📥 TBO Voucher Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", response.data?.ResponseStatus);
  console.log("  VoucherURL:", response.data?.VoucherURL || "N/A");
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  console.log("");

  return {
    responseStatus: response.data?.ResponseStatus,
    voucherURL: response.data?.VoucherURL,
    bookingRefNo: response.data?.BookingRefNo,
    bookingId: response.data?.BookingId,
    error: response.data?.Error,
  };
}

/**
 * Get Booking Details
 *
 * Retrieves booking information using BookingRefNo or BookingId
 */
async function getBookingDetails(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO GET BOOKING DETAILS");
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
  const { bookingRefNo, bookingId } = params;

  if (!bookingRefNo && !bookingId) {
    throw new Error("Either bookingRefNo or bookingId is required");
  }

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    BookingRefNo: String(bookingRefNo || ""),
    BookingId: String(bookingId || ""),
  };

  const url =
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetBookingDetails";

  console.log("\nStep 2: Getting booking details...");
  console.log("  URL:", url);
  console.log("  BookingRefNo:", request.BookingRefNo || "N/A");
  console.log("  BookingId:", request.BookingId || "N/A");
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

  console.log("📥 TBO Booking Details Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", response.data?.ResponseStatus);
  console.log("  BookingStatus:", response.data?.Status);
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  console.log("");

  return {
    responseStatus: response.data?.ResponseStatus,
    status: response.data?.Status,
    bookingRefNo: response.data?.BookingRefNo,
    bookingId: response.data?.BookingId,
    confirmationNo: response.data?.ConfirmationNo,
    hotelDetails: response.data?.HotelDetails,
    error: response.data?.Error,
  };
}

module.exports = { generateVoucher, getBookingDetails };
