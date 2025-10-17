/**
 * TBO Error Mapper
 * Normalizes TBO hotel API errors into consistent application error codes
 */

function createError(message, code, meta = {}) {
  const err = new Error(message || "TBO error");
  err.code = code || "TBO_UNKNOWN_ERROR";
  err.meta = meta;
  return err;
}

function mapFromResponse(res) {
  const raw = res?.data || res || {};
  const msg = raw?.Error?.ErrorMessage || raw?.Error || raw?.Message || "";
  const message = typeof msg === "string" ? msg : JSON.stringify(msg);
  const status = raw.Status;

  // Authentication/token issues
  if (/token/i.test(message) || /unauthorized/i.test(message)) {
    return createError(message || "Authentication failed", "TBO_AUTH_FAILED", { status });
  }

  // Price change / availability
  if (/price\s*change/i.test(message) || /price\s*changed/i.test(message) || /not\s*available/i.test(message)) {
    return createError(message || "Price changed or not available", "TBO_PRICE_CHANGED", { status });
  }

  // Booking not found / invalid
  if (/booking\s*not\s*found/i.test(message) || /invalid\s*booking/i.test(message)) {
    return createError(message || "Booking not found", "TBO_BOOKING_NOT_FOUND", { status });
  }

  // Rate limit / throttling
  if (/rate\s*limit/i.test(message) || /throttl/i.test(message) || /too\s*many/i.test(message)) {
    return createError(message || "Rate limited", "TBO_RATE_LIMITED", { status });
  }

  // Validation / bad request
  if (/invalid/i.test(message) || /required/i.test(message) || /bad\s*request/i.test(message)) {
    return createError(message || "Invalid request", "TBO_BAD_REQUEST", { status });
  }

  // Generic failure when Status != 1
  if (status !== undefined && status !== 1) {
    return createError(message || "TBO request failed", "TBO_REQUEST_FAILED", { status });
  }

  return createError(message || "Unknown TBO error", "TBO_UNKNOWN_ERROR", { status });
}

function mapFromAxiosError(error) {
  const data = error?.response?.data;
  if (data) return mapFromResponse({ data });
  const message = error?.message || "TBO request error";
  // Network/timeout
  if (/timeout/i.test(message) || /network/i.test(message) || /ECONN/i.test(message)) {
    return createError(message, "TBO_NETWORK_ERROR");
  }
  return createError(message, "TBO_UNKNOWN_ERROR");
}

module.exports = { mapFromResponse, mapFromAxiosError, createError };
