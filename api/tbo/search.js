/**
 * TBO Hotel Search
 *
 * WORKING ENDPOINT (VERIFIED):
 * https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult
 *
 * Uses TokenId from authentication
 * Uses DestinationId from GetDestinationSearchStaticData
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
 * Search Hotels
 * VERIFIED WORKING - Returns real hotel data
 * Uses FINAL production URL: https://affiliate.travelboutiqueonline.com/HotelAPI/
 */
async function searchHotels(params = {}) {
  console.log("═".repeat(80));
  console.log("TBO HOTEL SEARCH");
  console.log("═".repeat(80));

  // 1. Get TokenId
  console.log("\nStep 1: Authenticating...");
  const authData = await authenticateTBO();
  const tokenId = authData.TokenId;

  if (!tokenId) {
    throw new Error("Authentication failed - no TokenId");
  }
  console.log("✅ TokenId obtained");

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

  const url =
    process.env.TBO_HOTEL_SEARCH_URL ||
    "https://affiliate.travelboutiqueonline.com/HotelAPI/Search";

  console.log("\nStep 3: Searching hotels...");
  console.log("  URL:", url);
  console.log("  CityId:", searchRequest.CityId, `(${destination})`);
  console.log("  CheckIn:", searchRequest.CheckInDate);
  console.log("  Nights:", searchRequest.NoOfNights);
  console.log("  Rooms:", searchRequest.NoOfRooms);
  console.log("  Currency:", searchRequest.PreferredCurrency);
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: searchRequest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    timeout: 90000, // Extended timeout for large result sets (2000+ hotels via proxy)
  });

  // Handle multiple response formats from TBO
  let result = response.data;

  // If wrapped in HotelSearchResult, unwrap it
  if (response.data?.HotelSearchResult) {
    result = response.data.HotelSearchResult;
  }

  // Also check for response wrapper
  if (response.data?.response?.HotelSearchResult) {
    result = response.data.response.HotelSearchResult;
  }

  console.log("📥 TBO Search Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", result?.ResponseStatus || result?.Status);
  console.log("  TraceId:", result?.TraceId);
  console.log("  Hotel Count:", result?.HotelResults?.length || 0);
  console.log("  Error:", result?.Error?.ErrorMessage || "None");

  // Debug: log actual response structure if no hotels
  if (!result?.HotelResults || result.HotelResults.length === 0) {
    console.log("⚠️  DEBUG: Full response:", JSON.stringify(result, null, 2).substring(0, 800));
  }
  console.log("");

  // Check for API errors
  const responseStatus = result?.ResponseStatus || result?.Status;
  if (responseStatus !== 1) {
    throw new Error(
      `TBO Hotel Search failed - ResponseStatus: ${responseStatus}, Error: ${result?.Error?.ErrorMessage || "Unknown error"}`,
    );
  }

  if (result?.HotelResults?.length > 0) {
    console.log("Sample Hotels (first 5):");
    result.HotelResults.slice(0, 5).forEach((h, i) => {
      console.log(
        `  ${i + 1}. ${h.HotelName || "No name"} (${h.StarRating}★) - ${h.Price?.CurrencyCode} ${h.Price?.OfferedPrice}`,
      );
    });
    console.log("");
  } else {
    console.log("⚠️  WARNING: Hotel search returned no results");
    console.log("   This could mean: no hotels available for these dates/destination");
  }

  return {
    responseStatus: responseStatus,
    traceId: result.TraceId,
    cityId: Number(cityId),
    checkInDate: searchRequest.CheckInDate,
    checkOutDate: formatDateForTBO(checkOut),
    currency: currency,
    noOfRooms: roomGuests.length,
    hotels: result.HotelResults || [],
    error: result.Error,
  };
}

module.exports = { searchHotels, formatDateForTBO };
