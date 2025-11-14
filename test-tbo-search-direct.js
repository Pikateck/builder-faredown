/**
 * TBO Hotel Search - Direct Test with Known CityId
 * Bypasses static data endpoints by using known Dubai CityId: 130443
 * This tests if hotel search works when we have correct CityId
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
  searchUrl: "https://affiliate.travelboutiqueonline.com/HotelAPI/Search",
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
      "Accept-Encoding": "gzip, deflate",
      ...config.headers,
    },
    timeout: 30000,
  });
}

async function runTest() {
  console.log("█".repeat(80));
  console.log("TBO HOTEL SEARCH - DIRECT TEST (Known Dubai CityId)");
  console.log("█".repeat(80));
  console.log("");

  // Step 1: Auth
  console.log("STEP 1: Authentication\n");
  const authResponse = await makeRequest(CONFIG.authUrl, {
    method: "POST",
    data: {
      ClientId: CONFIG.clientId,
      UserName: CONFIG.userId,
      Password: CONFIG.password,
      EndUserIp: CONFIG.endUserIp,
    },
  });

  const tokenId = authResponse.data.TokenId;
  console.log("✅ TokenId obtained:", tokenId.substring(0, 30) + "...\n");

  // Step 2: Hotel Search with known Dubai CityId
  console.log("STEP 2: Hotel Search (Dubai CityId: 130443)\n");

  const searchRequest = {
    EndUserIp: CONFIG.endUserIp,
    TokenId: tokenId,
    CheckInDate: "15/12/2025",
    NoOfNights: 3,
    CountryCode: "AE",
    CityId: 130443, // Known Dubai CityId from previous tests
    PreferredCurrency: "INR",
    GuestNationality: "IN",
    NoOfRooms: 1,
    RoomGuests: [
      {
        NoOfAdults: 2,
        NoOfChild: 0,
        ChildAge: [],
      },
    ],
    IsNearBySearchAllowed: false,
    MaxRating: 5,
    MinRating: 0,
  };

  console.log("📤 REQUEST:");
  console.log("URL:", CONFIG.searchUrl);
  console.log("Method: POST");
  console.log(
    "Body:",
    JSON.stringify(
      { ...searchRequest, TokenId: tokenId.substring(0, 30) + "..." },
      null,
      2,
    ),
  );
  console.log("");

  try {
    const searchResponse = await makeRequest(CONFIG.searchUrl, {
      method: "POST",
      data: searchRequest,
    });

    console.log("📥 RESPONSE:");
    console.log("HTTP Status:", searchResponse.status);
    console.log(
      "Response Status:",
      searchResponse.data?.ResponseStatus || searchResponse.data?.Status,
    );
    console.log("Hotel Count:", searchResponse.data?.HotelResults?.length || 0);

    if (searchResponse.data?.Error) {
      console.log("Error:", searchResponse.data.Error);
    }

    if (searchResponse.data?.HotelResults?.length > 0) {
      console.log("\n✅ SUCCESS - Hotels Found!\n");
      console.log("Sample Hotels:");
      searchResponse.data.HotelResults.slice(0, 3).forEach((h, i) => {
        console.log(`\n${i + 1}. ${h.HotelName}`);
        console.log(`   Code: ${h.HotelCode}`);
        console.log(`   Stars: ${h.StarRating}`);
        console.log(
          `   Price: ${h.Price?.OfferedPrice} ${h.Price?.CurrencyCode}`,
        );
      });
      console.log("");
    } else {
      console.log("\n❌ FAIL - No hotels returned\n");
      console.log(
        "Full Response:",
        JSON.stringify(searchResponse.data, null, 2).substring(0, 1000),
      );
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    console.log("HTTP Status:", error.response?.status);
    console.log("Response:", JSON.stringify(error.response?.data, null, 2));
  }
}

runTest();
