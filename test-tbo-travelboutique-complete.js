/**
 * TBO Complete Flow - travelboutiqueonline.com Endpoints Only
 * Auth + Search using the SAME endpoint family
 * With spec-perfect GetHotelResult payload
 */

require("dotenv").config({ path: ".env" });
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const HttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;

const FIXIE_URL = "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80";
const httpsAgent = new HttpsProxyAgent(FIXIE_URL);
const httpAgent = new HttpProxyAgent(FIXIE_URL);

const CONFIG = {
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  searchUrl: "https://affiliate.travelboutiqueonline.com/HotelAPI/Search", // JSON endpoint on same domain
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
  console.log("TBO COMPLETE FLOW - travelboutiqueonline.com Endpoints");
  console.log("█".repeat(80));
  console.log("");

  // STEP 1: Auth
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
  console.log("Body:", JSON.stringify(authRequest, null, 2));
  console.log("");

  const authResponse = await makeRequest(CONFIG.authUrl, {
    method: "POST",
    data: authRequest,
  });

  console.log("📥 AUTH RESPONSE:");
  console.log("HTTP Status:", authResponse.status);
  console.log("Body:", JSON.stringify(authResponse.data, null, 2));
  console.log("");

  if (!authResponse.data?.TokenId) {
    console.log("❌ No TokenId");
    return;
  }

  const tokenId = authResponse.data.TokenId;
  console.log("✅ TokenId obtained\n");

  // STEP 2: Hotel Search - Spec-Perfect Payload
  console.log("═".repeat(80));
  console.log("STEP 2: HOTEL SEARCH (Spec-Perfect Payload)");
  console.log("═".repeat(80));
  console.log("");

  // Build exactly as per TBO JSON spec for GetHotelResult
  const searchRequest = {
    CheckInDate: "15/12/2025",
    NoOfNights: "3",
    CountryCode: "AE",
    CityId: "130443",
    ResultCount: null,
    PreferredCurrency: "INR",
    GuestNationality: "IN",
    NoOfRooms: "1",
    RoomGuests: [
      {
        NoOfAdults: 2,
        NoOfChild: 0,
        ChildAge: null,
      },
    ],
    MaxRating: 5,
    MinRating: 0,
    ReviewScore: null,
    IsNearBySearchAllowed: false,
    EndUserIp: CONFIG.endUserIp,
    TokenId: tokenId,
  };

  console.log("📤 SEARCH REQUEST:");
  console.log("URL:", CONFIG.searchUrl);
  console.log("Method: POST");
  console.log("Body:", JSON.stringify(searchRequest, null, 2));
  console.log("");

  try {
    const searchResponse = await makeRequest(CONFIG.searchUrl, {
      method: "POST",
      data: searchRequest,
    });

    console.log("📥 SEARCH RESPONSE:");
    console.log("HTTP Status:", searchResponse.status);
    console.log("Full Body:", JSON.stringify(searchResponse.data, null, 2));
    console.log("");

    // Check various response structures
    const hotels =
      searchResponse.data?.HotelResults ||
      searchResponse.data?.HotelResult ||
      searchResponse.data?.HotelSearchResult?.HotelResult ||
      [];

    if (hotels.length > 0) {
      console.log("✅ SUCCESS - Hotels found:", hotels.length);
      console.log("\nSample Hotels:");
      hotels.slice(0, 3).forEach((h, i) => {
        console.log(`${i + 1}. ${h.HotelName}`);
        console.log(`   Code: ${h.HotelCode}`);
        console.log(
          `   Price: ${h.Price?.OfferedPrice || h.Price?.PublishedPrice} ${h.Price?.CurrencyCode}`,
        );
      });
    } else {
      console.log("❌ No hotels found");
      console.log(
        "\nResponse Status:",
        searchResponse.data?.ResponseStatus || searchResponse.data?.Status,
      );
      console.log(
        "Error:",
        searchResponse.data?.Error ||
          searchResponse.data?.HotelSearchResult?.Error,
      );
    }
  } catch (error) {
    console.log("❌ SEARCH ERROR:", error.message);
    console.log("HTTP Status:", error.response?.status);
    console.log("Response:", JSON.stringify(error.response?.data, null, 2));
  }
}

runTest();
