/**
 * TBO Universal JSON Hotel API - Complete Pipeline Test
 * ✅ CORRECTED: Uses exact TBO production URLs and JSON specification
 *
 * Tests the full flow:
 * 1. Authentication (get TokenId) - Uses ClientId/UserName/Password
 * 2. Country List (Static Data) - Uses UserName/Password
 * 3. City List (Static Data) - Uses UserName/Password
 * 4. Hotel Search - Uses TokenId
 *
 * CRITICAL: Uses Fixie proxy to ensure requests come from whitelisted IP
 */

const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const HttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;

// Fixie proxy configuration (CRITICAL - TBO requires whitelisted IP)
const FIXIE_URL =
  process.env.FIXIE_URL ||
  "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80";

// Create proxy agents
const httpsAgent = new HttpsProxyAgent(FIXIE_URL);
const httpAgent = new HttpProxyAgent(FIXIE_URL);

console.log("\n🔌 PROXY CONFIGURATION:");
console.log("  Fixie URL:", FIXIE_URL ? "✅ SET" : "❌ NOT SET");
console.log("  Proxy Agent:", httpsAgent ? "✅ INITIALIZED" : "❌ FAILED");
console.log("");

// ✅ CORRECTED: Configuration from TBO email (Pavneet Kaur, Oct 17, 2025)
const config = {
  // Authentication - Returns TokenId
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",

  // Static Data - Uses UserName/Password
  staticBase: "https://apiwr.tboholidays.com/HotelAPI/",

  // Hotel Search - Uses TokenId
  searchBase: "https://affiliate.travelboutiqueonline.com/HotelAPI/",

  // Dynamic API Credentials
  clientId: "tboprod",
  userId: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132", // Fixie proxy IP (whitelisted by TBO)

  // Static Data Credentials (SEPARATE)
  staticUserName: "travelcategory",
  staticPassword: "Tra@59334536",
};

let tokenId = null;

/**
 * Helper: Make request through Fixie proxy
 */
function makeProxiedRequest(url, data, method = "POST", timeout = 15000) {
  const config = {
    method: method,
    url: url,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    httpsAgent: httpsAgent, // CRITICAL: Use Fixie proxy
    httpAgent: httpAgent, // CRITICAL: Use Fixie proxy
    timeout: timeout,
  };

  if (method === "GET") {
    config.params = data;
  } else {
    config.data = data;
  }

  return axios(config);
}

/**
 * Format date as dd/MM/yyyy (TBO requirement)
 */
function formatDateForTBO(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * 1. Test Authentication
 * ✅ CORRECTED: Uses ClientId/UserName/Password/EndUserIp
 */
async function testAuthentication() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: AUTHENTICATION");
  console.log("=".repeat(60) + "\n");

  const authRequest = {
    ClientId: config.clientId,
    UserName: config.userId,
    Password: config.password,
    EndUserIp: config.endUserIp,
  };

  console.log("📤 Request:");
  console.log("  URL:", config.authUrl);
  console.log("  ClientId:", authRequest.ClientId);
  console.log("  UserName:", authRequest.UserName);
  console.log("  Password:", "***");
  console.log("  EndUserIp:", authRequest.EndUserIp);
  console.log("");

  try {
    const response = await makeProxiedRequest(
      config.authUrl,
      authRequest,
      "POST",
      15000,
    );

    console.log("📥 Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  Status:", response.data?.Status);
    console.log(
      "  TokenId:",
      response.data?.TokenId
        ? `✅ PRESENT (${response.data.TokenId.length} chars)`
        : "❌ MISSING",
    );
    console.log("  Member ID:", response.data?.Member?.MemberId);
    console.log("  Agency ID:", response.data?.Member?.AgencyId);
    console.log("  Error Code:", response.data?.Error?.ErrorCode);
    console.log("  Error Message:", response.data?.Error?.ErrorMessage);
    console.log("");

    if (response.data?.Status === 1 && response.data?.TokenId) {
      tokenId = response.data.TokenId;
      console.log("✅ SUCCESS: Authentication worked!\n");
      return true;
    } else {
      console.log("❌ FAILED: Authentication returned non-success status\n");
      console.log("Full Response:", JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    console.log("  HTTP Status:", error.response?.status);
    console.log("  Response:", JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

/**
 * 2. Test Country List
 * ✅ CORRECTED: Uses UserName/Password (NOT TokenId)
 */
async function testCountryList() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: COUNTRY LIST (Static Data)");
  console.log("=".repeat(60) + "\n");

  // ✅ CORRECTED: Static data uses UserName/Password (GET method)
  const params = {
    UserName: config.staticUserName,
    Password: config.staticPassword,
  };

  console.log("📤 Request:");
  console.log("  URL:", config.staticBase + "CountryList");
  console.log("  Method: GET");
  console.log("  UserName:", params.UserName);
  console.log("");

  try {
    const response = await makeProxiedRequest(
      config.staticBase + "CountryList",
      params,
      "GET",
      15000,
    );

    console.log("📥 Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  Status:", response.data?.Status);
    console.log("  Country Count:", response.data?.Countries?.length || 0);
    console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
    console.log("");

    if (response.data?.Status === 1) {
      const countries = response.data?.Countries || [];
      console.log("Sample Countries:");
      countries.slice(0, 5).forEach((c) => {
        console.log(`  - ${c.Name} (${c.Code})`);
      });
      console.log("\n✅ SUCCESS: Country List retrieved!\n");
      return true;
    } else {
      console.log("❌ FAILED:", response.data?.Error?.ErrorMessage);
      return false;
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    console.log("  HTTP Status:", error.response?.status);
    console.log("  Response:", JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

/**
 * 3. Test City List
 * ✅ CORRECTED: Uses UserName/Password (NOT TokenId)
 */
async function testCityList() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: CITY LIST for UAE (Static Data)");
  console.log("=".repeat(60) + "\n");

  // ✅ CORRECTED: Static data uses UserName/Password (GET method)
  const params = {
    UserName: config.staticUserName,
    Password: config.staticPassword,
    CountryCode: "AE",
  };

  console.log("📤 Request:");
  console.log("  URL:", config.staticBase + "HotelCityList");
  console.log("  CountryCode: AE");
  console.log("  Method: GET");
  console.log("  UserName:", params.UserName);
  console.log("");

  try {
    const response = await makeProxiedRequest(
      config.staticBase + "HotelCityList",
      params,
      "GET",
      15000,
    );

    console.log("📥 Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  Status:", response.data?.Status);
    console.log("  City Count:", response.data?.Cities?.length || 0);
    console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
    console.log("");

    if (response.data?.Status === 1) {
      const cities = response.data?.Cities || [];
      console.log("UAE Cities:");
      cities.slice(0, 10).forEach((c) => {
        console.log(`  - ${c.Name} (ID: ${c.Id || c.Code})`);
      });
      console.log("\n✅ SUCCESS: City List retrieved!\n");
      return cities;
    } else {
      console.log("❌ FAILED:", response.data?.Error?.ErrorMessage);
      return [];
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    console.log("  HTTP Status:", error.response?.status);
    console.log("  Response:", JSON.stringify(error.response?.data, null, 2));
    return [];
  }
}

/**
 * 4. Test Hotel Search
 * ✅ CORRECTED: Uses TokenId and EXACT TBO JSON specification
 */
async function testHotelSearch(cities) {
  if (!tokenId) {
    console.log("⏭️  Skipping Hotel Search test (no TokenId)\n");
    return false;
  }

  if (!cities || cities.length === 0) {
    console.log("⏭️  Skipping Hotel Search test (no cities)\n");
    return false;
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: HOTEL SEARCH in Dubai (with TokenId)");
  console.log("=".repeat(60) + "\n");

  // Find Dubai
  const dubai = cities.find((c) => c.Name.toLowerCase().includes("dubai"));
  if (!dubai) {
    console.log("❌ Dubai not found in city list");
    return false;
  }

  const cityId = dubai.Id || dubai.Code;
  const checkIn = "15/12/2025"; // dd/MM/yyyy
  const checkOut = "18/12/2025"; // dd/MM/yyyy

  // Calculate NoOfNights
  const checkInDate = new Date("2025-12-15");
  const checkOutDate = new Date("2025-12-18");
  const noOfNights = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
  );

  // ✅ CORRECTED: Exact TBO JSON specification
  const searchRequest = {
    EndUserIp: config.endUserIp,
    TokenId: tokenId,
    CheckInDate: checkIn, // dd/MM/yyyy
    NoOfNights: noOfNights, // NOT CheckOutDate
    CountryCode: "AE",
    CityId: Number(cityId), // TBO's numeric city ID
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

  console.log("📤 Request:");
  console.log("  URL:", config.searchBase + "Search");
  console.log("  City: Dubai (ID:", cityId + ")");
  console.log("  CheckIn:", searchRequest.CheckInDate);
  console.log("  NoOfNights:", searchRequest.NoOfNights);
  console.log("  Rooms:", searchRequest.NoOfRooms);
  console.log("  Currency:", searchRequest.PreferredCurrency);
  console.log("");
  console.log(
    "Full Request:",
    JSON.stringify({ ...searchRequest, TokenId: "HIDDEN" }, null, 2),
  );
  console.log("");

  try {
    const response = await makeProxiedRequest(
      config.searchBase + "Search",
      searchRequest,
      "POST",
      30000,
    );

    console.log("📥 Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  ResponseStatus:", response.data?.ResponseStatus);
    console.log("  Status:", response.data?.Status);
    console.log("  Hotel Count:", response.data?.HotelResults?.length || 0);
    console.log("  TraceId:", response.data?.TraceId ? "PRESENT" : "MISSING");
    console.log("  Error Code:", response.data?.Error?.ErrorCode);
    console.log("  Error Message:", response.data?.Error?.ErrorMessage);
    console.log("");

    const statusOk =
      response.data?.ResponseStatus === 1 || response.data?.Status === 1;

    if (statusOk && response.data?.HotelResults?.length > 0) {
      console.log("✅ SUCCESS: Hotels found!\n");
      console.log("Sample Hotels:");
      response.data.HotelResults.slice(0, 3).forEach((h, i) => {
        console.log(`\n${i + 1}. ${h.HotelName}`);
        console.log(`   Code: ${h.HotelCode}`);
        console.log(`   Stars: ${h.StarRating}`);
        console.log(
          `   Price: ${h.Price?.OfferedPrice} ${h.Price?.CurrencyCode}`,
        );
      });
      console.log("");
      return true;
    } else {
      console.log("❌ FAILED: No hotels or non-success status");
      console.log(
        "Full Response:",
        JSON.stringify(response.data, null, 2).substring(0, 1000),
      );
      return false;
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    console.log("  HTTP Status:", error.response?.status);
    console.log(
      "  Response:",
      JSON.stringify(error.response?.data, null, 2).substring(0, 1000),
    );
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("\n" + "█".repeat(60));
  console.log("TBO HOTEL API - COMPLETE PIPELINE TEST");
  console.log("✅ CORRECTED: Uses exact TBO production URLs");
  console.log("█".repeat(60));

  const results = {
    auth: false,
    countries: false,
    cities: false,
    search: false,
  };

  // Test 1: Authentication
  results.auth = await testAuthentication();
  if (!results.auth) {
    console.log("\n❌ Authentication failed - stopping tests\n");
    printSummary(results);
    return;
  }

  // Test 2: Country List (Static Data)
  results.countries = await testCountryList();

  // Test 3: City List (Static Data)
  const cities = await testCityList();
  results.cities = cities.length > 0;

  // Test 4: Hotel Search
  results.search = await testHotelSearch(cities);

  // Summary
  printSummary(results);
}

function printSummary(results) {
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60) + "\n");

  console.log("1. Authentication:", results.auth ? "✅ PASS" : "❌ FAIL");
  console.log("2. Country List:", results.countries ? "✅ PASS" : "❌ FAIL");
  console.log("3. City List:", results.cities ? "✅ PASS" : "❌ FAIL");
  console.log("4. Hotel Search:", results.search ? "✅ PASS" : "❌ FAIL");

  const passCount = Object.values(results).filter((r) => r).length;
  const totalCount = Object.keys(results).length;

  console.log("");
  console.log(`Overall: ${passCount}/${totalCount} tests passed`);
  console.log("");

  if (passCount === totalCount) {
    console.log("🎉 ALL TESTS PASSED - TBO Integration is working!\n");
  } else if (results.auth && results.search) {
    console.log("✅ CORE FUNCTIONALITY WORKING (Auth + Search)\n");
  } else {
    console.log("⚠️ Some tests failed - check errors above\n");
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
