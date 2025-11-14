#!/usr/bin/env node
/**
 * Try different CityId variations to find valid Dubai ID
 */

const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");

const config = {
  authUrl: "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  searchUrl: "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult",
  clientId: "tboprod",
  userName: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",
  proxyUrl: "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80"
};

const agent = new HttpsProxyAgent(config.proxyUrl);
const http = axios.create({
  httpsAgent: agent,
  httpAgent: agent,
  timeout: 30000,
  headers: { "Content-Type": "application/json", "Accept": "application/json" }
});

// Common CityIds from various booking systems for Dubai
const cityIdsToTest = [
  "130443",  // TBO docs sample (Amsterdam)
  "101659",  // Common Dubai ID in some systems
  "800001",  // Another common pattern
  "784001",  // UAE country code + 001
  "DXB",     // IATA code
  "Dubai",   // City name
  "1",       // Simple increment
  "1000",
  "10000",
  130443,    // As number
  101659,    // As number
];

async function testCityIds() {
  console.log("Finding valid Dubai CityId...");
  console.log("");
  
  // Get auth token
  const authPayload = {
    ClientId: config.clientId,
    UserName: config.userName,
    Password: config.password,
    EndUserIp: config.endUserIp
  };
  
  const authResponse = await http.post(config.authUrl, authPayload);
  const tokenId = authResponse.data.TokenId;
  
  console.log("✅ Auth successful");
  console.log("");
  
  for (const cityId of cityIdsToTest) {
    const searchPayload = {
      CheckInDate: "15/12/2025",
      NoOfNights: 3,
      CountryCode: "AE",
      CityId: cityId,
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
      TokenId: tokenId
    };
    
    try {
      console.log(`Testing CityId: ${cityId} (${typeof cityId})`);
      
      const searchResponse = await http.post(config.searchUrl, searchPayload);
      const result = searchResponse.data.HotelSearchResult;
      const status = result?.ResponseStatus;
      const error = result?.Error?.ErrorMessage;
      const hotelCount = result?.HotelResults?.length || 0;
      
      if (status === 1 && hotelCount > 0) {
        console.log(`  🎉 SUCCESS! CityId ${cityId} works!`);
        console.log(`  Hotels found: ${hotelCount}`);
        console.log("");
        console.log("Sample Hotels:");
        result.HotelResults.slice(0, 3).forEach((h, i) => {
          console.log(`  ${i + 1}. ${h.HotelName} - ${h.Price?.PublishedPrice} ${h.Price?.CurrencyCode}`);
        });
        console.log("");
        console.log(`✅ USE THIS: CityId = ${JSON.stringify(cityId)}`);
        return cityId;
      } else {
        console.log(`  Status: ${status}, Error: ${error || "None"}`);
      }
      
    } catch (error) {
      console.log(`  ❌ ${error.response?.status || error.message}`);
    }
  }
  
  console.log("");
  console.log("⚠️  No valid CityId found. Need to:");
  console.log("  1. Contact TBO support for valid CityId");
  console.log("  2. Or get static city list working");
}

testCityIds().catch(console.error);
