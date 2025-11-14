/**
 * TBO Debug - Hotel Search
 * Endpoint: https://affiliate.travelboutiqueonline.com/HotelAPI/Search
 * Method: POST
 * Auth: TokenId (from authentication)
 * 
 * ✅ CORRECTED: Exact payload matching TBO specification
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");

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
 * ✅ CORRECTED: Uses exact TBO JSON specification
 */
async function searchHotels(params = {}) {
  // 1. Get TokenId
  const authData = await authenticateTBO();
  const tokenId = authData.TokenId;

  if (!tokenId) {
    throw new Error("Authentication failed - no TokenId");
  }

  // 2. Build search request (EXACT TBO format)
  const {
    cityId = 130443,              // Dubai (from TBO city list)
    checkIn = "15/12/2025",        // dd/MM/yyyy
    checkOut = "18/12/2025",       // dd/MM/yyyy
    countryCode = "AE",
    currency = "INR",
    guestNationality = "IN",
    rooms = [{ adults: 2, children: 0, childAges: [] }]
  } = params;

  // Calculate nights
  const checkInDate = new Date(checkIn.split("/").reverse().join("-"));
  const checkOutDate = new Date(checkOut.split("/").reverse().join("-"));
  const noOfNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  // Build RoomGuests (exact TBO format)
  const roomGuests = rooms.map(r => ({
    NoOfAdults: Number(r.adults) || 2,
    NoOfChild: Number(r.children) || 0,
    ChildAge: Array.isArray(r.childAges) ? r.childAges.map(a => Number(a)) : []
  }));

  // ✅ EXACT TBO JSON specification
  const searchRequest = {
    EndUserIp: process.env.TBO_END_USER_IP,
    TokenId: tokenId,
    CheckInDate: checkIn,                    // dd/MM/yyyy
    NoOfNights: noOfNights,                  // NOT CheckOutDate
    CountryCode: countryCode,
    CityId: Number(cityId),                  // TBO's numeric city ID
    PreferredCurrency: currency,
    GuestNationality: guestNationality,
    NoOfRooms: roomGuests.length,
    RoomGuests: roomGuests,
    IsNearBySearchAllowed: false,
    MaxRating: 5,
    MinRating: 0
  };

  const url = process.env.TBO_HOTEL_SEARCH_URL + "Search";

  console.log("🔍 TBO Hotel Search Request");
  console.log("  URL:", url);
  console.log("  CityId:", searchRequest.CityId);
  console.log("  CheckIn:", searchRequest.CheckInDate);
  console.log("  NoOfNights:", searchRequest.NoOfNights);
  console.log("  Rooms:", searchRequest.NoOfRooms);
  console.log("  Currency:", searchRequest.PreferredCurrency);
  console.log("");
  console.log("📤 Request Payload:");
  console.log(JSON.stringify({
    ...searchRequest,
    TokenId: tokenId.substring(0, 30) + "..."
  }, null, 2));
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: searchRequest,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate"
    },
    timeout: 30000
  });

  console.log("📥 TBO Search Response");
  console.log("  HTTP Status:", response.status);
  console.log("  ResponseStatus:", response.data?.ResponseStatus);
  console.log("  Status:", response.data?.Status);
  console.log("  Hotel Count:", Array.isArray(response.data?.HotelResults) ? response.data.HotelResults.length : 0);
  console.log("  TraceId:", response.data?.TraceId || "N/A");
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  
  if (response.data?.HotelResults?.length > 0) {
    console.log("\nSample Hotels:");
    response.data.HotelResults.slice(0, 3).forEach((h, i) => {
      console.log(`\n${i + 1}. ${h.HotelName}`);
      console.log(`   Code: ${h.HotelCode}`);
      console.log(`   Stars: ${h.StarRating}`);
      console.log(`   Price: ${h.Price?.OfferedPrice} ${h.Price?.CurrencyCode}`);
    });
  }
  console.log("");

  return response.data;
}

module.exports = { searchHotels, formatDateForTBO };
