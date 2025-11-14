#!/usr/bin/env node
/**
 * Test hotelbooking.travelboutiqueonline.com for GetHotelResult
 * This subdomain was mentioned in credentials for booking operations
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

// Test paths on hotelbooking subdomain
const searchPaths = [
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult",
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI/GetHotelResult",
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI/Search",
];

async function testHotelBookingSubdomain() {
  console.log(
    "Testing hotelbooking.travelboutiqueonline.com for GetHotelResult...",
  );
  console.log("");

  // Get auth token
  const authPayload = {
    ClientId: config.clientId,
    UserName: config.userName,
    Password: config.password,
    EndUserIp: config.endUserIp,
  };

  const authResponse = await http.post(config.authUrl, authPayload);
  const tokenId = authResponse.data.TokenId;

  console.log("✅ Auth successful");
  console.log("   TokenId:", tokenId.substring(0, 40) + "...");
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

  console.log("Testing paths on hotelbooking subdomain:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const url of searchPaths) {
    try {
      console.log("");
      console.log(`Testing: ${url}`);

      const response = await http.post(url, searchPayload);

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
          console.log("");
          console.log(`  🎉 SUCCESS! This endpoint works!`);
          console.log("");
          console.log("  Sample Hotels:");
          response.data.HotelSearchResult.HotelResults.slice(0, 3).forEach(
            (h, i) => {
              console.log(
                `    ${i + 1}. ${h.HotelName} - ${h.Price?.PublishedPrice} ${h.Price?.CurrencyCode}`,
              );
            },
          );
        }
      } else if (response.data.Status) {
        console.log(`  Status:`, response.data.Status);
      } else {
        console.log(
          `  Response:`,
          JSON.stringify(response.data).substring(0, 150),
        );
      }
    } catch (error) {
      const status = error.response?.status || "N/A";
      const message = error.response?.data || error.message;

      console.log(`  ❌ HTTP ${status}`);
      if (typeof message === "string") {
        console.log(`     ${message}`);
      } else {
        console.log(`     ${JSON.stringify(message).substring(0, 150)}`);
      }
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

testHotelBookingSubdomain().catch(console.error);
