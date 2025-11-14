/**
 * TBO JSON API - Spec-Perfect Test
 * Uses ONLY TekTravels JSON endpoints as per official documentation
 *
 * Endpoints:
 * - Auth: http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate
 * - Search: https://HotelBE.tektravels.com/HotelService.svc/rest/GetHotelResult
 */

require("dotenv").config({ path: ".env" });
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const HttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;

// Fixie proxy
const FIXIE_URL = "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80";
const httpsAgent = new HttpsProxyAgent(FIXIE_URL);
const httpAgent = new HttpProxyAgent(FIXIE_URL);

// TekTravels JSON API Configuration
const CONFIG = {
  authUrl:
    "http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate",
  searchUrl:
    "https://HotelBE.tektravels.com/HotelService.svc/rest/GetHotelResult",
  clientId: "tboprod",
  userId: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",
};

async function makeRequest(url, config) {
  return axios({
    url,
    ...config,
    httpsAgent,
    httpAgent,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.headers,
    },
    timeout: 30000,
  });
}

async function runTest() {
  console.log("█".repeat(80));
  console.log("TBO JSON API - SPEC-PERFECT TEST (TekTravels Endpoints)");
  console.log("█".repeat(80));
  console.log("");

  // =========================================================================
  // STEP 1: AUTHENTICATION
  // =========================================================================
  console.log("═".repeat(80));
  console.log("STEP 1: AUTHENTICATION");
  console.log("═".repeat(80));
  console.log("");

  const authRequest = {
    ClientId: CONFIG.clientId,
    UserName: CONFIG.userId,
    Password: CONFIG.password,
    EndUserIp: CONFIG.endUserIp,
  };

  console.log("📤 AUTH REQUEST:");
  console.log("URL:", CONFIG.authUrl);
  console.log("Method: POST");
  console.log("Headers: Content-Type: application/json");
  console.log("Body:", JSON.stringify(authRequest, null, 2));
  console.log("");

  let authResponse;
  try {
    authResponse = await makeRequest(CONFIG.authUrl, {
      method: "POST",
      data: authRequest,
    });

    console.log("📥 AUTH RESPONSE:");
    console.log("HTTP Status:", authResponse.status);
    console.log("Full Response Body:");
    console.log(JSON.stringify(authResponse.data, null, 2));
    console.log("");

    if (!authResponse.data?.TokenId) {
      console.log("❌ FAIL - No TokenId in response");
      return;
    }

    console.log("✅ SUCCESS - TokenId obtained\n");
  } catch (error) {
    console.log("❌ AUTH ERROR:", error.message);
    console.log("HTTP Status:", error.response?.status);
    console.log(
      "Response Body:",
      JSON.stringify(error.response?.data, null, 2),
    );
    return;
  }

  const tokenId = authResponse.data.TokenId;

  // =========================================================================
  // STEP 2: HOTEL SEARCH (GetHotelResult)
  // =========================================================================
  console.log("═".repeat(80));
  console.log("STEP 2: HOTEL SEARCH (GetHotelResult)");
  console.log("═".repeat(80));
  console.log("");

  // Build payload EXACTLY as per TBO JSON spec
  // Reference: https://apidoc.tektravels.com/hotel/HotelSearch_json.aspx
  const searchRequest = {
    CheckInDate: "15/12/2025", // dd/MM/yyyy format
    NoOfNights: "3", // String as per spec
    CountryCode: "AE", // UAE
    CityId: "130443", // Dubai (String as per spec)
    ResultCount: null, // Optional
    PreferredCurrency: "INR",
    GuestNationality: "IN",
    NoOfRooms: "1", // String as per spec
    RoomGuests: [
      {
        NoOfAdults: 2, // Number as per spec
        NoOfChild: 0, // Number as per spec
        ChildAge: null,
      },
    ],
    MaxRating: 5, // Number
    MinRating: 0, // Number
    ReviewScore: null, // Optional
    IsNearBySearchAllowed: false, // Boolean
    EndUserIp: CONFIG.endUserIp,
    TokenId: tokenId,
  };

  console.log("📤 SEARCH REQUEST:");
  console.log("URL:", CONFIG.searchUrl);
  console.log("Method: POST");
  console.log("Headers: Content-Type: application/json");
  console.log("Body:", JSON.stringify(searchRequest, null, 2));
  console.log("");

  try {
    const searchResponse = await makeRequest(CONFIG.searchUrl, {
      method: "POST",
      data: searchRequest,
    });

    console.log("📥 SEARCH RESPONSE:");
    console.log("HTTP Status:", searchResponse.status);
    console.log("Full Response Body:");
    console.log(JSON.stringify(searchResponse.data, null, 2));
    console.log("");

    if (searchResponse.data?.HotelResult?.length > 0) {
      console.log(
        "✅ SUCCESS - Hotels Found:",
        searchResponse.data.HotelResult.length,
      );
      console.log("");
      console.log("Sample Hotels:");
      searchResponse.data.HotelResult.slice(0, 3).forEach((h, i) => {
        console.log(`${i + 1}. ${h.HotelName || "N/A"}`);
        console.log(`   Code: ${h.HotelCode || "N/A"}`);
        console.log(
          `   Price: ${h.Price?.PublishedPrice || "N/A"} ${h.Price?.CurrencyCode || ""}`,
        );
      });
    } else {
      console.log("❌ No hotels in response");
    }
  } catch (error) {
    console.log("❌ SEARCH ERROR:", error.message);
    console.log("HTTP Status:", error.response?.status);
    console.log("Full Response Body:");
    console.log(JSON.stringify(error.response?.data, null, 2));
  }

  console.log("");
  console.log("═".repeat(80));
  console.log("END OF TEST");
  console.log("═".repeat(80));
}

runTest();
