#!/usr/bin/env node
/**
 * TBO JSON API Test - Correct Endpoints Only
 * Uses ONLY the endpoints from Pavneet's live credentials email
 *
 * Auth: https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate
 * Search: https://affiliate.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult
 *
 * Usage:
 *   node test-tbo-correct-endpoints.js
 */

const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");

// TBO Configuration (ONLY from live credentials email)
const config = {
  // Auth endpoint
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",

  // Search endpoint (affiliate subdomain, JSON V10)
  searchUrl:
    "https://affiliate.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult",

  // Credentials
  clientId: "tboprod",
  userName: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",

  // Proxy (Fixie)
  useProxy: true,
  proxyUrl: "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80",
};

// Create axios instance with proxy
const agent = config.useProxy ? new HttpsProxyAgent(config.proxyUrl) : null;

const http = axios.create({
  httpsAgent: agent,
  httpAgent: agent,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

console.log(
  "╔═══════════════════════════════════════════════════════════════╗",
);
console.log(
  "║     TBO JSON API Test - Correct Endpoints (Live Creds)        ║",
);
console.log(
  "╚═══════════════════════════════════════════════════════════════╝",
);
console.log("");
console.log("Using ONLY endpoints from Pavneet's live credentials email:");
console.log("  Auth: api.travelboutiqueonline.com/SharedAPI/...");
console.log("  Search: affiliate.travelboutiqueonline.com/HotelAPI_V10/...");
console.log("");
console.log("🔌 Proxy:", config.useProxy ? "Enabled (Fixie)" : "Disabled");
console.log("");

const results = {
  auth: null,
  search: null,
};

async function testTBOIntegration() {
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Authentication
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                    STEP 1: AUTHENTICATION                      ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
    console.log("");
    console.log("📍 URL:", config.authUrl);
    console.log("");

    const authPayload = {
      ClientId: config.clientId,
      UserName: config.userName,
      Password: config.password,
      EndUserIp: config.endUserIp,
    };

    console.log("📤 AUTH REQUEST:");
    console.log(JSON.stringify(authPayload, null, 2));
    console.log("");

    const authResponse = await http.post(config.authUrl, authPayload);

    results.auth = {
      request: authPayload,
      response: authResponse.data,
    };

    console.log("📥 AUTH RESPONSE:");
    console.log(JSON.stringify(authResponse.data, null, 2));
    console.log("");

    const tokenId = authResponse.data.TokenId;

    if (!tokenId) {
      throw new Error("��� No TokenId received from authentication");
    }

    console.log("✅ Authentication successful!");
    console.log("   TokenId:", tokenId.substring(0, 40) + "...");
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Hotel Search (GetHotelResult)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║            STEP 2: HOTEL SEARCH (GetHotelResult)              ║",
    );
    console.log(
      "╚══════════════════════════════════════════════════════���════════╝",
    );
    console.log("");
    console.log("📍 URL:", config.searchUrl);
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
      EndUserIp: config.endUserIp,
      TokenId: tokenId,
    };

    console.log("📤 SEARCH REQUEST:");
    console.log(JSON.stringify(searchPayload, null, 2));
    console.log("");

    const searchResponse = await http.post(config.searchUrl, searchPayload);

    results.search = {
      request: searchPayload,
      response: searchResponse.data,
    };

    console.log("📥 SEARCH RESPONSE:");
    console.log(JSON.stringify(searchResponse.data, null, 2));
    console.log("");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SUMMARY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                         TEST SUMMARY                           ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
    console.log("");

    const authSuccess = authResponse.data.Status === 1;
    const searchSuccess =
      searchResponse.data.HotelSearchResult?.ResponseStatus === 1;
    const hotelCount =
      searchResponse.data.HotelSearchResult?.HotelResults?.length || 0;
    const errorMessage =
      searchResponse.data.HotelSearchResult?.Error?.ErrorMessage ||
      searchResponse.data.Error?.ErrorMessage;

    console.log("✅ Authentication:", authSuccess ? "SUCCESS" : "FAILED");
    console.log("✅ Hotel Search:", searchSuccess ? "SUCCESS" : "FAILED");
    console.log("📊 Hotels Found:", hotelCount);
    if (errorMessage) {
      console.log("⚠️  Error Message:", errorMessage);
    }
    console.log("");

    if (authSuccess && searchSuccess && hotelCount > 0) {
      console.log("🎉 TBO INTEGRATION FULLY WORKING!");
      console.log("");
      console.log("Sample Hotels:");
      searchResponse.data.HotelSearchResult.HotelResults.slice(0, 3).forEach(
        (hotel, i) => {
          console.log(`\n${i + 1}. ${hotel.HotelName}`);
          console.log(`   Code: ${hotel.HotelCode}`);
          console.log(`   Stars: ${hotel.StarRating || "N/A"}`);
          console.log(
            `   Price: ${hotel.Price?.PublishedPrice} ${hotel.Price?.CurrencyCode}`,
          );
        },
      );
      console.log("");
    } else {
      console.log("⚠️  Integration issue detected");
      console.log("");
      console.log("This is the clean test using ONLY TBO-provided endpoints.");
      console.log("No TekTravels endpoints were used.");
      console.log("");
    }

    // Save results to file
    fs.writeFileSync("tbo-test-results.json", JSON.stringify(results, null, 2));
    console.log("💾 Full results saved to: tbo-test-results.json");
    console.log("");
  } catch (error) {
    console.error(
      "╔══════════════════════��════════════════════════════════════════╗",
    );
    console.error(
      "║                          ERROR                                 ║",
    );
    console.error(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
    console.error("");
    console.error("❌ Test failed:", error.message);
    console.error("");

    if (error.response) {
      console.error("HTTP Status:", error.response.status);
      console.error("Status Text:", error.response.statusText);
      console.error("");
      console.error("Response Data:");
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error("");

      // Save error results
      results.error = {
        message: error.message,
        status: error.response.status,
        data: error.response.data,
      };

      fs.writeFileSync(
        "tbo-test-results.json",
        JSON.stringify(results, null, 2),
      );
      console.error("💾 Error results saved to: tbo-test-results.json");
      console.error("");
    }

    if (error.code) {
      console.error("Error Code:", error.code);
      console.error("");
    }

    process.exit(1);
  }
}

// Run the test
testTBOIntegration();
