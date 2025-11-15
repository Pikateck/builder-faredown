/**
 * TBO Hotel Cancellation and Change Requests
 *
 * ENDPOINTS:
 * - SendChange (Cancel): https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/SendChangeRequest
 * - GetChangeRequestStatus: https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetChangeRequestStatus
 *
 * Note: TBO V10 uses "SendChangeRequest" for cancellations
 * The RequestType parameter determines if it's a cancellation or modification
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");

/**
 * Send Change Request (Cancel Booking)
 *
 * TBO uses SendChangeRequest for both cancellations and modifications
 * RequestType: 4 = Cancellation
 *
 * Required parameters:
 * - bookingId or confirmationNo
 * - requestType (default: 4 for cancellation)
 * - remarks (optional)
 */
async function sendChangeRequest(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO SEND CHANGE REQUEST (CANCEL)");
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
    bookingId,
    confirmationNo,
    requestType = 4,  // 4 = Cancellation (TBO spec)
    remarks = "Cancellation requested by customer",
  } = params;

  if (!bookingId && !confirmationNo) {
    throw new Error("Either bookingId or confirmationNo is required");
  }

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    BookingId: bookingId ? String(bookingId) : "",
    ConfirmationNo: confirmationNo ? String(confirmationNo) : "",
    RequestType: Number(requestType),
    Remarks: String(remarks),
  };

  const url =
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/SendChangeRequest";

  console.log("\nStep 2: Sending change request...");
  console.log("  URL:", url);
  console.log("  BookingId:", request.BookingId || "N/A");
  console.log("  ConfirmationNo:", request.ConfirmationNo || "N/A");
  console.log("  RequestType:", request.RequestType, "(4=Cancel)");
  console.log("  Remarks:", request.Remarks);
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
  console.log("🔍 RAW RESPONSE:", JSON.stringify(response.data, null, 2).substring(0, 800));

  // ✅ Handle multiple possible wrapper names
  const result = response.data?.SendChangeRequestResult ||
                 response.data?.ChangeRequestResult ||
                 response.data?.SendChangeRequestResponse ||
                 response.data;

  console.log("\n📥 TBO Change Request Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", result?.ResponseStatus);
  console.log("  ChangeRequestId:", result?.ChangeRequestId || "N/A");
  console.log("  RequestStatus:", result?.RequestStatus || "N/A");
  console.log("  CancellationCharge:", result?.CancellationCharge || "N/A");
  console.log("  RefundAmount:", result?.RefundAmount || "N/A");
  console.log("  Error:", result?.Error?.ErrorMessage || "None");
  console.log("");

  return {
    responseStatus: result?.ResponseStatus,
    changeRequestId: result?.ChangeRequestId,
    requestStatus: result?.RequestStatus,      // Pending, Processed, etc.
    cancellationCharge: result?.CancellationCharge,
    refundAmount: result?.RefundAmount,
    bookingId: result?.BookingId,
    confirmationNo: result?.ConfirmationNo,
    error: result?.Error,
  };
}

/**
 * Get Change Request Status
 *
 * Retrieves the status of a change/cancellation request
 *
 * Required parameters:
 * - changeRequestId (from SendChangeRequest response)
 */
async function getChangeRequestStatus(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO GET CHANGE REQUEST STATUS");
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
  const { changeRequestId, bookingId, confirmationNo } = params;

  if (!changeRequestId && !bookingId && !confirmationNo) {
    throw new Error("ChangeRequestId, BookingId, or ConfirmationNo is required");
  }

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    ChangeRequestId: changeRequestId ? String(changeRequestId) : "",
    BookingId: bookingId ? String(bookingId) : "",
    ConfirmationNo: confirmationNo ? String(confirmationNo) : "",
  };

  const url =
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetChangeRequestStatus";

  console.log("\nStep 2: Getting change request status...");
  console.log("  URL:", url);
  console.log("  ChangeRequestId:", request.ChangeRequestId || "N/A");
  console.log("  BookingId:", request.BookingId || "N/A");
  console.log("  ConfirmationNo:", request.ConfirmationNo || "N/A");
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
  console.log("🔍 RAW RESPONSE:", JSON.stringify(response.data, null, 2).substring(0, 800));

  // ✅ Handle multiple possible wrapper names
  const result = response.data?.GetChangeRequestStatusResult ||
                 response.data?.ChangeRequestStatusResponse ||
                 response.data?.GetChangeRequestStatusResponse ||
                 response.data;

  console.log("\n📥 TBO Change Request Status Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", result?.ResponseStatus);
  console.log("  ChangeRequestId:", result?.ChangeRequestId || "N/A");
  console.log("  RequestStatus:", result?.RequestStatus || "N/A");
  console.log("  ProcessedOn:", result?.ProcessedOn || "N/A");
  console.log("  CancellationCharge:", result?.CancellationCharge || "N/A");
  console.log("  RefundAmount:", result?.RefundAmount || "N/A");
  console.log("  Error:", result?.Error?.ErrorMessage || "None");
  console.log("");

  return {
    responseStatus: result?.ResponseStatus,
    changeRequestId: result?.ChangeRequestId,
    requestStatus: result?.RequestStatus,      // Pending, Processed, Rejected, etc.
    processedOn: result?.ProcessedOn,          // DateTime when processed
    cancellationCharge: result?.CancellationCharge,
    refundAmount: result?.RefundAmount,
    bookingId: result?.BookingId,
    confirmationNo: result?.ConfirmationNo,
    remarks: result?.Remarks,
    error: result?.Error,
  };
}

/**
 * Cancel Hotel Booking (Convenience wrapper)
 *
 * Simplified cancellation that combines SendChangeRequest + Status check
 */
async function cancelHotelBooking(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO CANCEL HOTEL BOOKING");
  console.log("═".repeat(80));

  const { bookingId, confirmationNo, remarks } = params;

  // Step 1: Send cancellation request
  console.log("\nStep 1: Sending cancellation request...");
  const cancelResult = await sendChangeRequest({
    bookingId,
    confirmationNo,
    requestType: 4,  // 4 = Cancellation
    remarks: remarks || "Booking cancellation requested",
  });

  if (!cancelResult || !cancelResult.changeRequestId) {
    console.log("❌ Cancellation request failed");
    return {
      success: false,
      ...cancelResult,
    };
  }

  console.log(`✅ Cancellation request submitted: ${cancelResult.changeRequestId}`);

  // Step 2: Check status (optional - may be pending)
  if (cancelResult.requestStatus === "Processed") {
    console.log("✅ Cancellation processed immediately");
    return {
      success: true,
      status: "cancelled",
      ...cancelResult,
    };
  }

  console.log(`ℹ️  Cancellation status: ${cancelResult.requestStatus}`);
  console.log("   Use getChangeRequestStatus() to check later");

  return {
    success: true,
    status: "pending",
    message: "Cancellation request submitted. Check status with getChangeRequestStatus()",
    ...cancelResult,
  };
}

module.exports = {
  sendChangeRequest,
  getChangeRequestStatus,
  cancelHotelBooking,
};
