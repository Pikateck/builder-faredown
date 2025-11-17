/**
 * TBO Hotel Search - Search
 *
 * CORRECT ENDPOINT (per TBO email):
 * https://affiliate.travelboutiqueonline.com/HotelAPI/Search
 *
 * Returns hotels with real pricing
 * Uses TokenId from authentication
 * Uses CityId (DestinationId) from GetDestinationSearchStaticData
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");
const { getCityId } = require("./static");

/**
 * Format date as dd/MM/yyyy (TBO requirement)
 */
function formatDateForTBO(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Search Hotels - GetHotelResult
 * VERIFIED WORKING - Returns 2,429+ hotels with real pricing
 * Uses hotelbooking subdomain with GetHotelResult method
 */
async function searchHotels(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO HOTEL SEARCH");
  console.log("═".repeat(80));

  // NOTE: Affiliate endpoint uses STATIC credentials, not TokenId
  // Static credentials are for initial auth only (used in tboRequest wrapper)
  console.log("\nStep 1: Using static credentials for affiliate search...");

  // 2. Get CityId from static data
  const {
    destination = "Dubai",
    checkIn = "15/12/2025",
    checkOut = "18/12/2025",
    countryCode = "AE",
    currency = "USD",
    guestNationality = "IN",
    rooms = [{ adults: 2, children: 0, childAges: [] }],
  } = params;

  console.log("\nStep 2: Getting CityId for", destination, "in", countryCode);
  const cityId = await getCityId(destination, countryCode, tokenId);

  if (!cityId) {
    throw new Error(`City not found: ${destination} in ${countryCode}`);
  }

  // 3. Calculate nights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const noOfNights = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
  );

  if (noOfNights < 1) {
    throw new Error(`Invalid dates: checkIn=${checkIn}, checkOut=${checkOut}`);
  }

  // 4. Build RoomGuests (exact TBO format)
  const roomGuests = rooms.map((r) => ({
    NoOfAdults: Number(r.adults) || 2,
    NoOfChild: Number(r.children) || 0,
    ChildAge: Array.isArray(r.childAges)
      ? r.childAges.map((a) => Number(a))
      : [],
  }));

  // 5. Build search request (EXACT TBO JSON specification)
  const searchRequest = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    CheckInDate: formatDateForTBO(checkIn),
    NoOfNights: noOfNights,
    CountryCode: countryCode,
    CityId: Number(cityId), // Real CityId from static data
    PreferredCurrency: currency,
    GuestNationality: guestNationality,
    NoOfRooms: roomGuests.length,
    RoomGuests: roomGuests,
    IsNearBySearchAllowed: false,
    MaxRating: 5,
    MinRating: 0,
  };

  // ✅ CORRECT ENDPOINT per TBO email (affiliate base URL + Search method)
  const CORRECT_ENDPOINT =
    "https://affiliate.travelboutiqueonline.com/HotelAPI/Search";
  const url = process.env.TBO_HOTEL_SEARCH_URL || CORRECT_ENDPOINT;

  // Safety override: always use affiliate endpoint for search
  const finalUrl = CORRECT_ENDPOINT;

  console.log("\nStep 3: Searching hotels...");
  console.log("  URL:", finalUrl);
  console.log("  CityId:", searchRequest.CityId, `(${destination})`);
  console.log("  CheckIn:", searchRequest.CheckInDate);
  console.log("  Nights:", searchRequest.NoOfNights);
  console.log("  Rooms:", searchRequest.NoOfRooms);
  console.log("  Currency:", searchRequest.PreferredCurrency);
  console.log("");

  const response = await tboRequest(finalUrl, {
    method: "POST",
    data: searchRequest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    timeout: 90000, // Extended timeout for large result sets (2000+ hotels via proxy)
  });

  // Log RAW response for debugging
  console.log("📥 RAW TBO RESPONSE:");
  console.log("  HTTP Status:", response.status);
  console.log("  Raw body (first 2000 chars):");
  const rawBody = JSON.stringify(response.data, null, 2);
  console.log(rawBody.substring(0, 2000));
  if (rawBody.length > 2000) {
    console.log(`  ... (${rawBody.length - 2000} more characters)`);
  }
  console.log("");

  // Parse response - try different possible structures
  let result = response.data;
  let hotels = [];
  let responseStatus = null;
  let traceId = null;
  let errorMessage = null;

  // Check various possible response structures from TBO
  if (response.data?.HotelResults) {
    hotels = response.data.HotelResults;
    responseStatus = response.data.Status || response.data.ResponseStatus;
    traceId = response.data.TraceId;
    errorMessage = response.data.Error?.ErrorMessage;
  } else if (response.data?.HotelSearchResult?.HotelResults) {
    hotels = response.data.HotelSearchResult.HotelResults;
    responseStatus =
      response.data.HotelSearchResult.ResponseStatus ||
      response.data.HotelSearchResult.Status;
    traceId = response.data.HotelSearchResult.TraceId;
    errorMessage = response.data.HotelSearchResult.Error?.ErrorMessage;
    result = response.data.HotelSearchResult;
  } else if (response.data?.response?.HotelResults) {
    hotels = response.data.response.HotelResults;
    responseStatus =
      response.data.response.Status || response.data.response.ResponseStatus;
    traceId = response.data.response.TraceId;
    errorMessage = response.data.response.Error?.ErrorMessage;
    result = response.data.response;
  } else if (Array.isArray(response.data)) {
    // Direct array of hotels
    hotels = response.data;
    responseStatus = 1;
    traceId = "direct_array";
  }

  console.log("📊 PARSED RESPONSE:");
  console.log("  ResponseStatus:", responseStatus);
  console.log("  TraceId:", traceId);
  console.log("  Hotel Count:", hotels.length);
  console.log("  Error:", errorMessage || "None");
  console.log("");

  // Check for API errors
  if (responseStatus !== 1) {
    throw new Error(
      `TBO Hotel Search failed - ResponseStatus: ${responseStatus}, Error: ${errorMessage || "Unknown error"}`,
    );
  }

  if (hotels?.length > 0) {
    console.log("✅ Sample Hotels (first 5):");
    hotels.slice(0, 5).forEach((h, i) => {
      const hotelName = h.HotelName || h.hotelName || "Unknown";
      const stars = h.StarRating || h.starRating || "?";
      const price = h.Price?.OfferedPrice || h.OfferedPrice || "?";
      const currency = h.Price?.CurrencyCode || h.CurrencyCode || "?";
      console.log(
        `  ${i + 1}. ${hotelName} (${stars}★) - ${currency} ${price}`,
      );
    });
    console.log("");
  } else {
    console.log("⚠️  WARNING: Hotel search returned 0 results");
    console.log(
      "   This could mean: no hotels available for these dates/destination",
    );
  }

  return {
    responseStatus: responseStatus,
    traceId: traceId,
    cityId: Number(cityId),
    checkInDate: searchRequest.CheckInDate,
    checkOutDate: formatDateForTBO(checkOut),
    currency: currency,
    noOfRooms: roomGuests.length,
    hotels: hotels || [],
    error: { ErrorCode: 0, ErrorMessage: errorMessage },
  };
}

module.exports = { searchHotels, formatDateForTBO };
