#!/usr/bin/env node
/**
 * SCENARIO 1: Domestic (Mumbai, 1 Adult)
 * 
 * Direct TBO API calls - bypasses middleware, calls TBO directly
 * Location: ~/project/src/api/
 * Run: node test-scenario-1-direct.js
 */

const axios = require("axios");
const { HttpProxyAgent } = require("http-proxy-agent");
const { HttpsProxyAgent } = require("https-proxy-agent");

// TBO Configuration
const TBO_HOTEL_SEARCH_URL = "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult";
const TBO_HOTEL_ROOM_URL = "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelRoomDetails";
const TBO_BLOCK_URL = "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom";
const TBO_BOOK_URL = "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/HotelBooking";
const TBO_AUTH_URL = "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate";
const TBO_STATIC_URL = "https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData";

// Credentials from environment
const TBO_CLIENT_ID = process.env.TBO_HOTEL_CLIENT_ID || "tboprod";
const TBO_USER_ID = process.env.TBO_HOTEL_USER_ID || "BOMF145";
const TBO_PASSWORD = process.env.TBO_HOTEL_PASSWORD || "@Bo#4M-Api@";

// Proxy configuration
const USE_PROXY = process.env.USE_SUPPLIER_PROXY === "true";
const FIXIE_URL = process.env.FIXIE_URL;

const httpAgent = USE_PROXY && FIXIE_URL ? new HttpProxyAgent(FIXIE_URL) : undefined;
const httpsAgent = USE_PROXY && FIXIE_URL ? new HttpsProxyAgent(FIXIE_URL) : undefined;

const tboAxios = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 30000,
});

async function authenticate() {
  console.log("Authenticating with TBO...");
  const response = await tboAxios.post(TBO_AUTH_URL, {
    ClientId: TBO_CLIENT_ID,
    UserName: TBO_USER_ID,
    Password: TBO_PASSWORD,
    EndUserIp: "52.5.155.132",
  });
  const tokenId = response.data.TokenId;
  if (!tokenId) throw new Error("Authentication failed");
  return tokenId;
}

async function getCityId(destination, countryCode, tokenId) {
  console.log(`Getting CityId for ${destination}, ${countryCode}...`);
  const response = await tboAxios.post(TBO_STATIC_URL, {
    EndUserIp: "52.5.155.132",
    CountryCode: countryCode,
    TokenId: tokenId,
    SearchType: 1,
  });

  if (response.data.Status !== 1) {
    throw new Error("TBO Static Data Error: " + response.data.Error?.ErrorMessage);
  }
  const destinations = response.data.Destinations || response.data.Destination || [];
  console.log(`Found ${destinations.length} destinations`);

  // Try various field names
  const found = destinations.find(d =>
    (d.CityName && d.CityName.includes(destination)) ||
    (d.DestinationName && d.DestinationName.includes(destination)) ||
    (d.CityDescription && d.CityDescription.includes(destination))
  );

  if (!found && destinations.length > 0) {
    // List first few destinations for debugging
    const sampleDest = destinations[0];
    console.log("Sample destination keys:", Object.keys(sampleDest));
    console.log("First destination:", sampleDest);
  }

  return found?.DestinationId;
}

async function searchHotels(tokenId, cityId, checkIn, checkOut) {
  console.log("Searching hotels...");
  const response = await tboAxios.post(TBO_HOTEL_SEARCH_URL, {
    EndUserIp: "52.5.155.132",
    TokenId: tokenId,
    CheckInDate: checkIn,
    NoOfNights: 2,
    CountryCode: "IN",
    CityId: cityId,
    PreferredCurrency: "INR",
    GuestNationality: "IN",
    NoOfRooms: 1,
    RoomGuests: [{ NoOfAdults: 1, NoOfChild: 0, ChildAge: [] }],
    IsNearBySearchAllowed: false,
    MaxRating: 5,
    MinRating: 0,
  });

  if (response.data.Status !== 1) {
    throw new Error("Hotel search failed: " + response.data.Error?.ErrorMessage);
  }

  return response.data;
}

async function getHotelRoom(tokenId, traceId, resultIndex, hotelCode) {
  console.log("Getting room details...");
  const response = await tboAxios.post(TBO_HOTEL_ROOM_URL, {
    EndUserIp: "52.5.155.132",
    TokenId: tokenId,
    TraceId: traceId,
    ResultIndex: resultIndex,
    HotelCode: hotelCode,
  });
  return response.data;
}

async function blockRoom(tokenId, traceId, resultIndex, hotelCode, roomDetails) {
  console.log("Blocking room...");
  const response = await tboAxios.post(TBO_BLOCK_URL, {
    EndUserIp: "52.5.155.132",
    TokenId: tokenId,
    TraceId: traceId,
    ResultIndex: resultIndex,
    HotelCode: hotelCode,
    HotelRoomsDetails: [roomDetails[0]],
    GuestNationality: "IN",
    NoOfRooms: 1,
  });
  return response.data;
}

async function bookHotel(tokenId, traceId, resultIndex, hotelCode, roomDetails, passengers) {
  console.log("Confirming booking...");
  
  const roomsWithPassengers = roomDetails.map(room => ({
    ...room,
    HotelPassenger: passengers,
  }));
  
  const response = await tboAxios.post(TBO_BOOK_URL, {
    EndUserIp: "52.5.155.132",
    TokenId: tokenId,
    TraceId: traceId,
    ResultIndex: resultIndex,
    HotelCode: hotelCode,
    HotelName: "Hotel",
    GuestNationality: "IN",
    NoOfRooms: 1,
    IsVoucherBooking: true,
    HotelRoomsDetails: roomsWithPassengers,
  });
  return response.data;
}

async function testScenario1() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 1: Domestic (Mumbai, 1 Adult)");
  console.log("=".repeat(80));
  
  try {
    // Step 1: Authenticate
    const tokenId = await authenticate();
    console.log("✅ Authenticated");
    
    // Step 2: Get CityId
    const cityId = await getCityId("Mumbai", "IN", tokenId);
    if (!cityId) throw new Error("Mumbai not found");
    console.log(`✅ CityId: ${cityId}`);
    
    // Step 3: Search
    const searchData = await searchHotels(tokenId, cityId, "20/12/2025", "22/12/2025");
    if (!searchData.Hotels || searchData.Hotels.length === 0) throw new Error("No hotels found");
    console.log(`✅ Found ${searchData.Hotels.length} hotels`);
    
    const hotel = searchData.Hotels[0];
    
    // Step 4: Get Room Details
    const roomData = await getHotelRoom(tokenId, searchData.TraceId, hotel.ResultIndex, hotel.HotelCode);
    if (!roomData.HotelRoomDetails || roomData.HotelRoomDetails.length === 0) throw new Error("No room details");
    console.log("✅ Room details retrieved");
    
    // Step 5: Block Room
    const blockData = await blockRoom(tokenId, searchData.TraceId, hotel.ResultIndex, hotel.HotelCode, roomData.HotelRoomDetails);
    if (blockData.ResponseStatus !== 1) throw new Error("Block failed: " + blockData.Error?.ErrorMessage);
    console.log("✅ Room blocked");
    
    // Step 6: Book Hotel
    const bookData = await bookHotel(
      tokenId, 
      searchData.TraceId, 
      hotel.ResultIndex, 
      hotel.HotelCode, 
      blockData.HotelRoomDetails,
      [{
        Title: "Mr",
        FirstName: "Rajesh",
        LastName: "Kumar",
        PaxType: 1,
        Nationality: "IN",
        Email: "rajesh@example.com",
        Phoneno: "+919876543210",
      }]
    );
    
    if (bookData.ResponseStatus !== 1) throw new Error("Book failed: " + bookData.Error?.ErrorMessage);
    
    const confirmationNo = bookData.BookingId || bookData.ConfirmationNo;
    console.log(`✅ PASSED | Confirmation: ${confirmationNo}`);
    
    return {
      scenario: 1,
      status: "PASSED",
      confirmationNo: confirmationNo,
    };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return { 
      scenario: 1, 
      status: "FAILED", 
      error: error.message,
    };
  }
}

testScenario1().then((r) => {
  console.log("=".repeat(80));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.status === "PASSED" ? 0 : 1);
});
