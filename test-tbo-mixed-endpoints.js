/**
 * TBO Test - Mixed Endpoints
 * Auth from: api.travelboutiqueonline.com (KNOWN WORKING)
 * Search to: HotelBE.tektravels.com (TekTravels JSON endpoint)
 */

require("dotenv").config({ path: ".env" });
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const HttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;

const FIXIE_URL = "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80";
const httpsAgent = new HttpsProxyAgent(FIXIE_URL);
const httpAgent = new HttpProxyAgent(FIXIE_URL);

const CONFIG = {
  // Use WORKING auth endpoint
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  // Use TekTravels search endpoint as user specified
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
  console.log("TBO TEST - Working Auth + TekTravels Search");
  console.log("█".repeat(80));
  console.log("");

  // STEP 1: Auth (known working endpoint)
  console.log("STEP 1: AUTHENTICATION\n");
  console.log("📤 AUTH REQUEST:");
  console.log("URL:", CONFIG.authUrl);
  console.log(
    "Body:",
    JSON.stringify(
      {
        ClientId: CONFIG.clientId,
        UserName: CONFIG.userId,
        Password: CONFIG.password,
        EndUserIp: CONFIG.endUserIp,
      },
      null,
      2,
    ),
  );
  console.log("");

  const authResponse = await makeRequest(CONFIG.authUrl, {
    method: "POST",
    data: {
      ClientId: CONFIG.clientId,
      UserName: CONFIG.userId,
      Password: CONFIG.password,
      EndUserIp: CONFIG.endUserIp,
    },
  });

  console.log("📥 AUTH RESPONSE:");
  console.log("HTTP Status:", authResponse.status);
  console.log("Body:", JSON.stringify(authResponse.data, null, 2));
  console.log("");

  if (!authResponse.data?.TokenId) {
    console.log("❌ No TokenId - stopping");
    return;
  }

  const tokenId = authResponse.data.TokenId;
  console.log("✅ TokenId obtained:", tokenId.substring(0, 30) + "...\n");

  // STEP 2: Hotel Search (TekTravels GetHotelResult endpoint)
  console.log("═".repeat(80));
  console.log("STEP 2: HOTEL SEARCH (TekTravels GetHotelResult)");
  console.log("═".repeat(80));
  console.log("");

  // Exact spec payload
  const searchRequest = {
    CheckInDate: "15/12/2025",
    NoOfNights: "3",
    CountryCode: "AE",
    CityId: "130443", // Dubai
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
  console.log("Body:", JSON.stringify(searchRequest, null, 2));
  console.log("");

  try {
    const searchResponse = await makeRequest(CONFIG.searchUrl, {
      method: "POST",
      data: searchRequest,
    });

    console.log("📥 SEARCH RESPONSE:");
    console.log("HTTP Status:", searchResponse.status);
    console.log("Full Body:");
    console.log(JSON.stringify(searchResponse.data, null, 2));
    console.log("");

    if (searchResponse.data?.HotelResult?.length > 0) {
      console.log(
        "✅ SUCCESS - Hotels found:",
        searchResponse.data.HotelResult.length,
      );
    } else {
      console.log("❌ No hotels in response");
    }
  } catch (error) {
    console.log("❌ SEARCH ERROR:", error.message);
    console.log("HTTP Status:", error.response?.status);
    console.log("Full Response Body:");
    console.log(JSON.stringify(error.response?.data, null, 2));
  }
}

runTest();
