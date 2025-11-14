#!/usr/bin/env node
/**
 * TBO Final Test - Auth + Search
 * Uses confirmed working endpoints
 */

const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");

const config = {
  authUrl: "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  searchUrl: "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult",
  
  clientId: "tboprod",
  userName: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",
  
  useProxy: true,
  proxyUrl: "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80"
};

const agent = config.useProxy ? new HttpsProxyAgent(config.proxyUrl) : null;
const http = axios.create({
  httpsAgent: agent,
  httpAgent: agent,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

const results = {};

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║              TBO Final Integration Test                        ║");
console.log("║       Auth + Search (hotelbooking subdomain)                   ║");
console.log("╚═══════════════════════════════════════════════════════════════╝");
console.log("");

async function runTest() {
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━━━
    // AUTHENTICATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("STEP 1: AUTHENTICATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("URL:", config.authUrl);
    console.log("");
    
    const authPayload = {
      ClientId: config.clientId,
      UserName: config.userName,
      Password: config.password,
      EndUserIp: config.endUserIp
    };
    
    console.log("AUTH REQUEST:");
    console.log(JSON.stringify(authPayload, null, 2));
    console.log("");
    
    const authResponse = await http.post(config.authUrl, authPayload);
    results.auth = {
      request: authPayload,
      response: authResponse.data
    };
    
    console.log("AUTH RESPONSE:");
    console.log(JSON.stringify(authResponse.data, null, 2));
    console.log("");
    console.log("✅ Auth Status:", authResponse.data.Status === 1 ? "SUCCESS" : "FAILED");
    console.log("");
    
    const tokenId = authResponse.data.TokenId;
    if (!tokenId) {
      throw new Error("No TokenId");
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // HOTEL SEARCH - Try without CityId first
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("STEP 2: HOTEL SEARCH");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("URL:", config.searchUrl);
    console.log("");
    
    // Try with City name instead of CityId
    const searchPayload = {
      CheckInDate: "15/12/2025",
      NoOfNights: 3,
      CountryCode: "AE",
      CityId: "130443",  // Try as string
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
    
    console.log("SEARCH REQUEST:");
    console.log(JSON.stringify(searchPayload, null, 2));
    console.log("");
    
    const searchResponse = await http.post(config.searchUrl, searchPayload);
    results.search = {
      request: searchPayload,
      response: searchResponse.data
    };
    
    console.log("SEARCH RESPONSE:");
    console.log(JSON.stringify(searchResponse.data, null, 2));
    console.log("");
    
    // SUMMARY
    const searchResult = searchResponse.data.HotelSearchResult;
    const status = searchResult?.ResponseStatus;
    const hotelCount = searchResult?.HotelResults?.length || 0;
    const error = searchResult?.Error;
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("Auth:", results.auth.response.Status === 1 ? "✅ SUCCESS" : "❌ FAILED");
    console.log("Search ResponseStatus:", status);
    console.log("Hotels Found:", hotelCount);
    if (error?.ErrorMessage) {
      console.log("Error:", error.ErrorMessage);
    }
    console.log("");
    
    if (status === 1 && hotelCount > 0) {
      console.log("🎉 INTEGRATION WORKING!");
      console.log("");
      searchResult.HotelResults.slice(0, 3).forEach((h, i) => {
        console.log(`${i + 1}. ${h.HotelName} - ${h.Price?.PublishedPrice} ${h.Price?.CurrencyCode}`);
      });
    } else if (status !== 1) {
      console.log("⚠️  Search returned non-success status");
      console.log("");
      console.log("ResponseStatus codes:");
      console.log("  1 = Success");
      console.log("  2 = No results");
      console.log("  3 = Invalid request");
      console.log("  4 = Authentication error");
    }
    console.log("");
    
    fs.writeFileSync('tbo-final-test-results.json', JSON.stringify(results, null, 2));
    console.log("💾 Saved to: tbo-final-test-results.json");
    
  } catch (error) {
    console.error("ERROR:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
      results.error = {
        message: error.message,
        status: error.response.status,
        data: error.response.data
      };
    }
    fs.writeFileSync('tbo-final-test-results.json', JSON.stringify(results, null, 2));
    process.exit(1);
  }
}

runTest();
