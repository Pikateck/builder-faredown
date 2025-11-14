#!/usr/bin/env node
/**
 * TBO JSON API Test - Final Proof
 * Tests Auth → GetHotelResult with TekTravels JSON endpoints
 *
 * This matches the user's exact specification:
 * 1. Auth on https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate
 * 2. Search on https://HotelBE.tektravels.com/hotelservice.svc/rest/GetHotelResult
 *
 * Usage:
 *   node test-tbo-json-final.js
 */

const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");

// TBO Configuration
const config = {
  // Auth endpoint (travelboutiqueonline SharedAPI)
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",

  // Search endpoint (TekTravels JSON - try with capital S in HotelService)
  searchUrl:
    "https://HotelBE.tektravels.com/HotelService.svc/rest/GetHotelResult",

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
  "╔══════════════════════════════��════════════════════════════════╗",
);
console.log(
  "║          TBO JSON API - Final Integration Test                ║",
);
console.log(
  "╚═══════════════════════════════════════════════════════════════╝",
);
console.log("");
console.log("🔌 Using Proxy:", config.useProxy ? "YES" : "NO");
if (config.useProxy) {
  console.log("🌐 Proxy URL:", config.proxyUrl.replace(/:[^:@]+@/, ":***@"));
}
console.log("");

async function testAuth(authUrl, label) {
  console.log(`\n🔐 Testing Auth: ${label}`);
  console.log(`📍 URL: ${authUrl}`);

  const authPayload = {
    ClientId: config.clientId,
    UserName: config.userName,
    Password: config.password,
    EndUserIp: config.endUserIp,
  };

  try {
    const authResponse = await http.post(authUrl, authPayload);
    console.log(`✅ ${label} - SUCCESS`);
    console.log(
      `   TokenId: ${authResponse.data.TokenId?.substring(0, 30)}...`,
    );
    return authResponse.data.TokenId;
  } catch (error) {
    console.log(`❌ ${label} - FAILED`);
    console.log(`   Error: ${error.response?.data || error.message}`);
    return null;
  }
}

async function testSearch(searchUrl, tokenId, label) {
  console.log(`\n🏨 Testing Search: ${label}`);
  console.log(`📍 URL: ${searchUrl}`);
  console.log(`🔑 TokenId: ${tokenId?.substring(0, 30)}...`);

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

  try {
    const searchResponse = await http.post(searchUrl, searchPayload);
    const status = searchResponse.data.HotelSearchResult?.ResponseStatus;
    const hotelCount =
      searchResponse.data.HotelSearchResult?.HotelResults?.length || 0;
    const error = searchResponse.data.HotelSearchResult?.Error;

    if (status === 1 && hotelCount > 0) {
      console.log(`✅ ${label} - SUCCESS`);
      console.log(`   Hotels Found: ${hotelCount}`);
      return true;
    } else {
      console.log(`❌ ${label} - FAILED`);
      console.log(`   ResponseStatus: ${status}`);
      console.log(`   Error: ${error?.ErrorMessage || "Unknown"}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${label} - FAILED`);
    console.log(
      `   Error: ${error.response?.data?.HotelSearchResult?.Error?.ErrorMessage || error.message}`,
    );
    return false;
  }
}

async function testTBOIntegration() {
  try {
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║          TBO Endpoint Combination Matrix Test                 ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );

    const authEndpoints = [
      {
        url: "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
        label: "TBO SharedAPI",
      },
      {
        url: "https://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate",
        label: "TekTravels SharedServices",
      },
    ];

    const searchEndpoints = [
      {
        url: "https://HotelBE.tektravels.com/HotelService.svc/rest/GetHotelResult",
        label: "TekTravels HotelBE (capital S)",
      },
      {
        url: "https://HotelBE.tektravels.com/hotelservice.svc/rest/GetHotelResult",
        label: "TekTravels HotelBE (lowercase s)",
      },
      {
        url: "https://api.tektravels.com/HotelService.svc/rest/GetHotelResult",
        label: "TekTravels API subdomain",
      },
    ];

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("PHASE 1: Test All Auth Endpoints");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const tokens = {};
    for (const auth of authEndpoints) {
      const token = await testAuth(auth.url, auth.label);
      if (token) {
        tokens[auth.label] = token;
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("PHASE 2: Test All Endpoint Combinations");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const results = [];
    for (const authLabel in tokens) {
      for (const search of searchEndpoints) {
        const success = await testSearch(
          search.url,
          tokens[authLabel],
          `${authLabel} + ${search.label}`,
        );
        results.push({ auth: authLabel, search: search.label, success });
      }
    }

    console.log(
      "\n╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                    RESULTS SUMMARY                             ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
    console.log("");

    const workingCombos = results.filter((r) => r.success);
    if (workingCombos.length > 0) {
      console.log("✅ WORKING COMBINATIONS:");
      workingCombos.forEach((r) => {
        console.log(`   • ${r.auth} → ${r.search}`);
      });
      console.log("");
      console.log("🎉 Integration working! Use the combination above.");
    } else {
      console.log("❌ NO WORKING COMBINATIONS FOUND");
      console.log("");
      console.log("Tested combinations:");
      results.forEach((r) => {
        console.log(`   ${r.success ? "✅" : "❌"} ${r.auth} → ${r.search}`);
      });
      console.log("");
      console.log("⚠️  This suggests either:");
      console.log("   1. TBO account not fully provisioned for JSON API");
      console.log("   2. Different auth/search cluster required");
      console.log("   3. Additional parameters needed in payload");
      console.log("");
      console.log("📧 Contact TBO support with these test results.");
    }
  } catch (error) {
    console.error(
      "╔═══════════════════════════════════════════════════════════════╗",
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
