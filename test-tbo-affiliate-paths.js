#!/usr/bin/env node
/**
 * Test different endpoint paths on affiliate.travelboutiqueonline.com
 * to find the correct JSON GetHotelResult endpoint
 */

const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");

const config = {
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  clientId: "tboprod",
  userName: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",
  useProxy: true,
  proxyUrl: "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80",
};

const agent = config.useProxy ? new HttpsProxyAgent(config.proxyUrl) : null;
const http = axios.create({
  httpsAgent: agent,
  httpAgent: agent,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Paths to test on affiliate.travelboutiqueonline.com
const searchPaths = [
  "/HotelAPI_V10/HotelService.svc/rest/GetHotelResult",
  "/HotelAPI/GetHotelResult",
  "/HotelAPI/Search",
  "/HotelAPI_V10/Search",
  "/HotelAPI/HotelService.svc/rest/GetHotelResult",
];

async function testPaths() {
  console.log("Testing affiliate.travelboutiqueonline.com endpoint paths...");
  console.log("");

  // Get auth token first
  const authPayload = {
    ClientId: config.clientId,
    UserName: config.userName,
    Password: config.password,
    EndUserIp: config.endUserIp,
  };

  const authResponse = await http.post(config.authUrl, authPayload);
  const tokenId = authResponse.data.TokenId;

  console.log("✅ Auth successful, TokenId:", tokenId.substring(0, 30) + "...");
  console.log("");

  const searchPayload = {
    CheckInDate: "15/12/2025",
    NoOfNights: 3,
    CountryCode: "AE",
    CityId: 130443,
    ResultCount: null,
    PreferredCurrency: "INR",
    GuestNationality: "IN",
    NoOfRooms: 1,
    RoomGuests: [{ NoOfAdults: 2, NoOfChild: 0, ChildAge: null }],
    MaxRating: 5,
    MinRating: 0,
    ReviewScore: null,
    IsNearBySearchAllowed: false,
    EndUserIp: config.endUserIp,
    TokenId: tokenId,
  };

  console.log("Testing paths:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const path of searchPaths) {
    const fullUrl = `https://affiliate.travelboutiqueonline.com${path}`;

    try {
      console.log("");
      console.log(`Testing: ${path}`);

      const response = await http.post(fullUrl, searchPayload);

      console.log(`  ✅ HTTP ${response.status}`);

      if (response.data.HotelSearchResult) {
        const status = response.data.HotelSearchResult.ResponseStatus;
        const error = response.data.HotelSearchResult.Error;
        const hotelCount =
          response.data.HotelSearchResult.HotelResults?.length || 0;

        console.log(`  ResponseStatus: ${status}`);
        console.log(`  Hotels: ${hotelCount}`);
        if (error?.ErrorMessage) {
          console.log(`  Error: ${error.ErrorMessage}`);
        }

        if (status === 1 && hotelCount > 0) {
          console.log(`  🎉 THIS WORKS! Use this endpoint.`);
        }
      } else {
        console.log(
          `  Response:`,
          JSON.stringify(response.data).substring(0, 200),
        );
      }
    } catch (error) {
      const status = error.response?.status || "N/A";
      const message = error.response?.data || error.message;

      console.log(
        `  ❌ HTTP ${status}: ${typeof message === "string" ? message : JSON.stringify(message).substring(0, 100)}`,
      );
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

testPaths().catch(console.error);
