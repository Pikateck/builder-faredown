/**
 * Unified TBO Hotel API Client
 *
 * Provides centralized access to all TBO Hotel API endpoints with:
 * - Request/response logging for audit trail
 * - Error handling with TBO error code mapping
 * - Retry logic for transient failures
 * - Request validation using spec-compliant rules
 * - Response normalization
 *
 * Usage:
 * const client = require("./hotel-client");
 * const result = await client.searchHotels(params);
 */

const { authenticateTBO } = require("./auth");
const { searchHotels, formatDateForTBO } = require("./search");
const { getHotelRoom } = require("./room");
const { blockRoom, bookHotel } = require("./book");
const { generateVoucher, getBookingDetails } = require("./voucher");
const { sendChangeRequest, getChangeRequestStatus, cancelHotelBooking } = require("./cancel");
const { getAgencyBalance } = require("./balance");
const { getDestinationSearchStaticData, getCityId } = require("./static");

/**
 * TBO Error Code Reference
 * Maps TBO error codes to human-readable messages and retry recommendations
 */
const TBO_ERROR_CODES = {
  5001: {
    message: "Invalid TokenId or authentication failed",
    retryable: false,
    recommendation: "Re-authenticate and obtain new TokenId",
  },
  5002: {
    message: "Hotel not available",
    retryable: true,
    recommendation: "Try different hotel or dates",
  },
  5003: {
    message: "Room not available",
    retryable: true,
    recommendation: "Try different room or dates",
  },
  5004: {
    message: "Agency balance insufficient",
    retryable: false,
    recommendation: "Contact TBO to add credit to agency account",
  },
  5005: {
    message: "Invalid guest details",
    retryable: false,
    recommendation: "Verify passenger information format",
  },
  5006: {
    message: "Invalid passenger information",
    retryable: false,
    recommendation: "Check PAN, Passport, Nationality fields",
  },
  5007: {
    message: "Price changed significantly",
    retryable: true,
    recommendation: "Re-block room and check IsPriceChanged in response",
  },
  5008: {
    message: "Cancellation policy changed",
    retryable: true,
    recommendation: "Review updated cancellation policy",
  },
};

/**
 * Log TBO API request/response for audit trail
 * @param {string} endpoint - API endpoint name (e.g., "SearchHotels", "BlockRoom")
 * @param {object} request - Request object
 * @param {object} response - Response object
 * @param {string} status - "success" or "error"
 * @param {object} meta - Additional metadata
 */
function logApiCall(endpoint, request, response, status, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    endpoint,
    status,
    request: {
      // Don't log sensitive data
      ...request,
      TokenId: request.TokenId ? request.TokenId.substring(0, 30) + "..." : undefined,
      Password: undefined,
    },
    response: {
      ...response,
      TokenId: response.TokenId ? response.TokenId.substring(0, 30) + "..." : undefined,
    },
    meta,
  };

  if (status === "error") {
    console.error("❌ TBO API Error:", JSON.stringify(logEntry, null, 2));
  } else {
    console.log("✅ TBO API Success:", JSON.stringify(logEntry, null, 2));
  }

  // In production, write to database audit table
  // await auditService.log(logEntry);

  return logEntry;
}

/**
 * Parse TBO error response and provide actionable information
 * @param {object} errorResponse - TBO error response object
 * @returns {object} { errorCode: number, message: string, retryable: boolean, recommendation: string }
 */
function parseTBOError(errorResponse) {
  const errorCode = errorResponse?.Error?.ErrorCode || errorResponse?.ErrorCode || 0;
  const errorMessage = errorResponse?.Error?.ErrorMessage || errorResponse?.ErrorMessage || "Unknown error";

  const knownError = TBO_ERROR_CODES[errorCode];

  return {
    errorCode,
    message: knownError?.message || errorMessage,
    retryable: knownError?.retryable || false,
    recommendation: knownError?.recommendation || "Contact TBO support",
    originalMessage: errorMessage,
  };
}

/**
 * Retry helper for transient failures
 * @param {function} asyncFn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {promise} Result from asyncFn
 */
async function retryWithBackoff(asyncFn, maxRetries = 3, delayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delayTime = delayMs * attempt; // Exponential backoff
        console.warn(`Retry attempt ${attempt}/${maxRetries} in ${delayTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayTime));
      }
    }
  }

  throw lastError;
}

// =====================================================================
// UNIFIED HOTEL CLIENT API
// =====================================================================

/**
 * Authenticate and get TokenId
 * Caches TokenId for 1 hour to reduce auth calls
 */
let cachedTokenId = null;
let cachedTokenTime = null;
const TOKEN_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function authenticate() {
  // Check cache
  if (
    cachedTokenId &&
    cachedTokenTime &&
    Date.now() - cachedTokenTime < TOKEN_CACHE_DURATION
  ) {
    console.log("✅ Using cached TokenId");
    return cachedTokenId;
  }

  try {
    const authResponse = await authenticateTBO();

    if (!authResponse.TokenId) {
      const error = parseTBOError(authResponse);
      throw new Error(`Authentication failed: ${error.message}`);
    }

    // Cache token
    cachedTokenId = authResponse.TokenId;
    cachedTokenTime = Date.now();

    logApiCall("Authenticate", {}, authResponse, "success");
    return authResponse.TokenId;
  } catch (error) {
    logApiCall("Authenticate", {}, { Error: error.message }, "error");
    throw error;
  }
}

/**
 * Search hotels
 * @param {object} params - Search parameters
 * @returns {promise} Hotel search results
 */
async function search(params = {}) {
  console.log("\n🔍 TBO HOTEL CLIENT: Search");

  try {
    const result = await searchHotels(params);

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("SearchHotels", params, result, "error", { error });
      throw new Error(`Search failed: ${error.message}`);
    }

    logApiCall("SearchHotels", params, result, "success", {
      hotelCount: result.hotels?.length || 0,
    });

    return {
      success: true,
      traceId: result.traceId,
      hotels: result.hotels || [],
      cityId: result.cityId,
      checkInDate: result.checkInDate,
      checkOutDate: result.checkOutDate,
      currency: result.currency,
      noOfRooms: result.noOfRooms,
      totalResults: result.hotels?.length || 0,
    };
  } catch (error) {
    logApiCall("SearchHotels", params, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Get hotel room details
 * @param {object} params - Room request parameters
 * @returns {promise} Room details
 */
async function getRoom(params = {}) {
  console.log("\n🏨 TBO HOTEL CLIENT: Get Room Details");

  try {
    const result = await getHotelRoom(params);

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("GetHotelRoom", params, result, "error", { error });
      throw new Error(`Get room failed: ${error.message}`);
    }

    logApiCall("GetHotelRoom", params, result, "success", {
      roomCount: result.rooms?.length || 0,
    });

    return {
      success: true,
      traceId: result.traceId,
      rooms: result.rooms || [],
      totalRooms: result.rooms?.length || 0,
    };
  } catch (error) {
    logApiCall("GetHotelRoom", params, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Block room (PreBook) - Validates pricing before booking
 * @param {object} params - Block room parameters
 * @returns {promise} Block result with updated pricing/policies
 */
async function block(params = {}) {
  console.log("\n🔐 TBO HOTEL CLIENT: Block Room");

  try {
    const result = await blockRoom(params);

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("BlockRoom", params, result, "error", { error });
      throw new Error(`Block room failed: ${error.message}`);
    }

    logApiCall("BlockRoom", params, result, "success", {
      isPriceChanged: result.isPriceChanged,
      availabilityType: result.availabilityType,
    });

    return {
      success: true,
      isPriceChanged: result.isPriceChanged || false,
      isCancellationPolicyChanged: result.isCancellationPolicyChanged || false,
      hotelRoomDetails: result.hotelRoomDetails || [],
      categoryId: result.categoryId,
      availabilityType: result.availabilityType,
    };
  } catch (error) {
    logApiCall("BlockRoom", params, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Book hotel (Final booking)
 * @param {object} params - Booking parameters
 * @returns {promise} Booking confirmation
 */
async function book(params = {}) {
  console.log("\n✅ TBO HOTEL CLIENT: Book Hotel");

  try {
    const result = await bookHotel(params);

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("Book", params, result, "error", { error });
      throw new Error(`Booking failed: ${error.message}`);
    }

    logApiCall("Book", params, result, "success", {
      bookingId: result.bookingId,
      bookingRefNo: result.bookingRefNo,
    });

    return {
      success: true,
      bookingId: result.bookingId,
      bookingRefNo: result.bookingRefNo,
      confirmationNo: result.confirmationNo,
      status: result.status,
      isPriceChanged: result.isPriceChanged || false,
    };
  } catch (error) {
    logApiCall("Book", params, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Generate voucher (Get booking document)
 * @param {object} params - Voucher request parameters
 * @returns {promise} Voucher details
 */
async function generateVoucher_(params = {}) {
  console.log("\n📄 TBO HOTEL CLIENT: Generate Voucher");

  try {
    const result = await generateVoucher(params);

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("GenerateVoucher", params, result, "error", { error });
      throw new Error(`Voucher generation failed: ${error.message}`);
    }

    logApiCall("GenerateVoucher", params, result, "success");

    return {
      success: true,
      voucherId: result.voucherId,
      voucherUrl: result.voucherUrl,
    };
  } catch (error) {
    logApiCall("GenerateVoucher", params, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Get booking details
 * @param {object} params - Booking query parameters
 * @returns {promise} Booking information
 */
async function getBooking(params = {}) {
  console.log("\n📋 TBO HOTEL CLIENT: Get Booking Details");

  try {
    const result = await getBookingDetails(params);

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("GetBookingDetails", params, result, "error", { error });
      throw new Error(`Get booking failed: ${error.message}`);
    }

    logApiCall("GetBookingDetails", params, result, "success");

    return {
      success: true,
      bookingId: result.bookingId,
      bookingRefNo: result.bookingRefNo,
      hotelName: result.hotelName,
      checkInDate: result.checkInDate,
      checkOutDate: result.checkOutDate,
      totalAmount: result.totalAmount,
      currency: result.currency,
      status: result.status,
    };
  } catch (error) {
    logApiCall("GetBookingDetails", params, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Send change request (Cancel/Modify booking)
 * @param {object} params - Change request parameters
 * @returns {promise} Change request result
 */
async function requestChange(params = {}) {
  console.log("\n🔄 TBO HOTEL CLIENT: Send Change Request");

  try {
    const result = await sendChangeRequest(params);

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("SendChangeRequest", params, result, "error", { error });
      throw new Error(`Change request failed: ${error.message}`);
    }

    logApiCall("SendChangeRequest", params, result, "success", {
      changeRequestId: result.changeRequestId,
    });

    return {
      success: true,
      changeRequestId: result.changeRequestId,
      requestStatus: result.requestStatus,
      cancellationCharge: result.cancellationCharge,
      refundAmount: result.refundAmount,
    };
  } catch (error) {
    logApiCall("SendChangeRequest", params, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Get change request status
 * @param {object} params - Status query parameters
 * @returns {promise} Status information
 */
async function getChangeStatus(params = {}) {
  console.log("\n🔄 TBO HOTEL CLIENT: Get Change Request Status");

  try {
    const result = await getChangeRequestStatus(params);

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("GetChangeRequestStatus", params, result, "error", { error });
      throw new Error(`Get status failed: ${error.message}`);
    }

    logApiCall("GetChangeRequestStatus", params, result, "success");

    return {
      success: true,
      changeRequestId: result.changeRequestId,
      requestStatus: result.requestStatus,
      processedOn: result.processedOn,
      cancellationCharge: result.cancellationCharge,
      refundAmount: result.refundAmount,
    };
  } catch (error) {
    logApiCall("GetChangeRequestStatus", params, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Cancel hotel booking (Convenience wrapper)
 * @param {object} params - Cancellation parameters
 * @returns {promise} Cancellation result
 */
async function cancel(params = {}) {
  console.log("\n❌ TBO HOTEL CLIENT: Cancel Booking");

  try {
    const result = await cancelHotelBooking(params);

    if (!result.success) {
      logApiCall("CancelHotelBooking", params, result, "error");
      throw new Error(
        `Cancellation failed: ${result.error?.ErrorMessage || result.message}`,
      );
    }

    logApiCall("CancelHotelBooking", params, result, "success");

    return {
      success: true,
      changeRequestId: result.changeRequestId,
      status: result.status,
      cancellationCharge: result.cancellationCharge,
      refundAmount: result.refundAmount,
    };
  } catch (error) {
    logApiCall("CancelHotelBooking", params, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Get agency balance
 * @returns {promise} Balance information
 */
async function getBalance() {
  console.log("\n💰 TBO HOTEL CLIENT: Get Agency Balance");

  try {
    const result = await getAgencyBalance();

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("GetAgencyBalance", {}, result, "error", { error });
      throw new Error(`Get balance failed: ${error.message}`);
    }

    logApiCall("GetAgencyBalance", {}, result, "success");

    return {
      success: true,
      balance: result.balance,
      currency: result.currency,
      agencyId: result.agencyId,
    };
  } catch (error) {
    logApiCall("GetAgencyBalance", {}, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Get destination static data (Countries & Cities)
 * @returns {promise} Static data
 */
async function getStaticData() {
  console.log("\n📚 TBO HOTEL CLIENT: Get Static Data");

  try {
    const result = await getDestinationSearchStaticData();

    if (result.responseStatus !== 1) {
      const error = parseTBOError(result);
      logApiCall("GetDestinationSearchStaticData", {}, result, "error", { error });
      throw new Error(`Get static data failed: ${error.message}`);
    }

    logApiCall("GetDestinationSearchStaticData", {}, result, "success");

    return {
      success: true,
      countries: result.countries || [],
      totalCountries: result.countries?.length || 0,
    };
  } catch (error) {
    logApiCall("GetDestinationSearchStaticData", {}, { error: error.message }, "error");
    throw error;
  }
}

/**
 * Get city ID by name and country
 * @param {string} cityName - City name
 * @param {string} countryCode - Country code
 * @param {string} tokenId - Optional TokenId (fetched if not provided)
 * @returns {promise} City ID
 */
async function resolveCityId(cityName, countryCode, tokenId = null) {
  console.log("\n🔍 TBO HOTEL CLIENT: Resolve City ID");

  try {
    if (!tokenId) {
      tokenId = await authenticate();
    }

    const cityId = await getCityId(cityName, countryCode, tokenId);

    if (!cityId) {
      throw new Error(`City not found: ${cityName} in ${countryCode}`);
    }

    logApiCall("ResolveCityId", { cityName, countryCode }, { cityId }, "success");

    return {
      success: true,
      cityId,
      cityName,
      countryCode,
    };
  } catch (error) {
    logApiCall(
      "ResolveCityId",
      { cityName, countryCode },
      { error: error.message },
      "error",
    );
    throw error;
  }
}

// =====================================================================
// EXPORTS
// =====================================================================

module.exports = {
  // Auth
  authenticate,

  // Search & Static Data
  search,
  getRoom,
  getStaticData,
  resolveCityId,

  // Booking Flow
  block,
  book,

  // Voucher & Details
  generateVoucher: generateVoucher_,
  getBooking,

  // Cancellation & Changes
  requestChange,
  getChangeStatus,
  cancel,

  // Agency
  getBalance,

  // Utilities
  retryWithBackoff,
  parseTBOError,
  logApiCall,
  TBO_ERROR_CODES,
  formatDateForTBO,
};
