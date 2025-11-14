/**
 * TBO Complete Test - Full Request/Response Logging
 * Shows EXACT URLs, request bodies, and responses for debugging
 */

require("dotenv").config({ path: ".env" });
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const HttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;

// Fixie proxy
const FIXIE_URL =
  process.env.FIXIE_URL ||
  "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80";
const httpsAgent = new HttpsProxyAgent(FIXIE_URL);
const httpAgent = new HttpProxyAgent(FIXIE_URL);

// TBO Configuration (hardcoded to ensure correct values)
const TBO_CONFIG = {
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  staticBase: "https://apiwr.tboholidays.com/HotelAPI/",
  searchBase: "https://affiliate.travelboutiqueonline.com/HotelAPI/",
  clientId: "tboprod", // MUST be "tboprod" not BOMF145
  userId: "BOMF145", // UserName for auth
  password: "@Bo#4M-Api@", // Password for auth
  endUserIp: "52.5.155.132", // Fixie proxy IP
  staticUserName: "travelcategory", // Static data username
  staticPassword: "Tra@59334536", // Static data password
};

// Debug: Show what we're using
console.log("\n🔍 Loaded from .env:");
console.log("TBO_CLIENT_ID:", process.env.TBO_CLIENT_ID);
console.log("TBO_API_USER_ID:", process.env.TBO_API_USER_ID);
console.log(
  "TBO_API_PASSWORD:",
  process.env.TBO_API_PASSWORD ? "***" : "NOT SET",
);
console.log("TBO_STATIC_USER:", process.env.TBO_STATIC_USER);
console.log(
  "TBO_STATIC_PASSWORD:",
  process.env.TBO_STATIC_PASSWORD ? "***" : "NOT SET",
);

let tokenId = null;

/**
 * Make proxied request
 */
async function makeRequest(url, config) {
  const finalConfig = {
    ...config,
    httpsAgent,
    httpAgent,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      ...config.headers,
    },
  };

  return axios(url, finalConfig);
}

/**
 * Format date as dd/MM/yyyy
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * TEST 1: Authentication
 */
async function test1_Authentication() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST 1: AUTHENTICATION");
  console.log("=".repeat(80));

  const url = TBO_CONFIG.authUrl;
  const requestBody = {
    ClientId: TBO_CONFIG.clientId,
    UserName: TBO_CONFIG.userId,
    Password: TBO_CONFIG.password,
    EndUserIp: TBO_CONFIG.endUserIp,
  };

  console.log("\n📤 REQUEST:");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log("Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await makeRequest(url, {
      method: "POST",
      data: requestBody,
    });

    console.log("\n📥 RESPONSE:");
    console.log("HTTP Status:", response.status);
    console.log("Body:", JSON.stringify(response.data, null, 2));

    if (response.data?.Status === 1 && response.data?.TokenId) {
      tokenId = response.data.TokenId;
      console.log("\n✅ PASS - TokenId obtained");
      return true;
    } else {
      console.log("\n❌ FAIL - No TokenId or Status !== 1");
      return false;
    }
  } catch (error) {
    console.log("\n❌ ERROR:", error.message);
    console.log("Response:", error.response?.data);
    return false;
  }
}

/**
 * TEST 2: Country List (Static Data)
 */
async function test2_CountryList() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST 2: COUNTRY LIST (Static Data)");
  console.log("=".repeat(80));

  const url = TBO_CONFIG.staticBase + "CountryList";
  const requestBody = {
    UserName: TBO_CONFIG.staticUserName,
    Password: TBO_CONFIG.staticPassword,
  };

  console.log("\n📤 REQUEST:");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log("Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await makeRequest(url, {
      method: "POST",
      data: requestBody,
    });

    console.log("\n📥 RESPONSE:");
    console.log("HTTP Status:", response.status);
    console.log(
      "Body:",
      JSON.stringify(response.data, null, 2).substring(0, 1000) + "...",
    );

    if (response.data?.Status === 1 && response.data?.Countries?.length > 0) {
      console.log(
        "\n✅ PASS - Retrieved",
        response.data.Countries.length,
        "countries",
      );
      return true;
    } else {
      console.log("\n❌ FAIL - Status !== 1 or no countries");
      return false;
    }
  } catch (error) {
    console.log("\n❌ ERROR:", error.message);
    console.log("HTTP Status:", error.response?.status);
    console.log("Response:", JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

/**
 * TEST 3: City List (Static Data)
 */
async function test3_CityList() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST 3: CITY LIST for UAE (Static Data)");
  console.log("=".repeat(80));

  const url = TBO_CONFIG.staticBase + "DestinationCityList";
  const requestBody = {
    UserName: TBO_CONFIG.staticUserName,
    Password: TBO_CONFIG.staticPassword,
    CountryCode: "AE",
  };

  console.log("\n📤 REQUEST:");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log("Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await makeRequest(url, {
      method: "POST",
      data: requestBody,
    });

    console.log("\n📥 RESPONSE:");
    console.log("HTTP Status:", response.status);
    console.log(
      "Body:",
      JSON.stringify(response.data, null, 2).substring(0, 2000) + "...",
    );

    if (response.data?.Status === 1 && response.data?.Cities?.length > 0) {
      const cities = response.data.Cities;
      console.log("\n✅ PASS - Retrieved", cities.length, "cities");

      // Find Dubai
      const dubai = cities.find(
        (c) => c.Name && c.Name.toLowerCase().includes("dubai"),
      );
      if (dubai) {
        console.log("\nDubai found:");
        console.log("  Name:", dubai.Name);
        console.log("  ID:", dubai.Id);
        console.log("  Code:", dubai.Code);
      }

      return cities;
    } else {
      console.log("\n❌ FAIL - Status !== 1 or no cities");
      return [];
    }
  } catch (error) {
    console.log("\n❌ ERROR:", error.message);
    console.log("HTTP Status:", error.response?.status);
    console.log("Response:", JSON.stringify(error.response?.data, null, 2));
    return [];
  }
}

/**
 * TEST 4: Hotel Search
 */
async function test4_HotelSearch(cities) {
  console.log("\n" + "=".repeat(80));
  console.log("TEST 4: HOTEL SEARCH in Dubai");
  console.log("=".repeat(80));

  if (!tokenId) {
    console.log("\n⏭️ SKIP - No TokenId from authentication");
    return false;
  }

  if (!cities || cities.length === 0) {
    console.log("\n⏭️ SKIP - No cities from static data");
    return false;
  }

  // Find Dubai
  const dubai = cities.find(
    (c) => c.Name && c.Name.toLowerCase().includes("dubai"),
  );
  if (!dubai || !dubai.Id) {
    console.log("\n❌ FAIL - Dubai not found in city list");
    return false;
  }

  const url = TBO_CONFIG.searchBase + "Search";

  // Calculate nights
  const checkInDate = "15/12/2025";
  const checkOutDate = "18/12/2025";
  const checkInDateObj = new Date("2025-12-15");
  const checkOutDateObj = new Date("2025-12-18");
  const noOfNights = Math.ceil(
    (checkOutDateObj - checkInDateObj) / (1000 * 60 * 60 * 24),
  );

  const requestBody = {
    EndUserIp: TBO_CONFIG.endUserIp,
    TokenId: tokenId,
    CheckInDate: checkInDate,
    NoOfNights: noOfNights,
    CountryCode: "AE",
    CityId: Number(dubai.Id),
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

  console.log("\n📤 REQUEST:");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log(
    "Body:",
    JSON.stringify(
      { ...requestBody, TokenId: tokenId.substring(0, 30) + "..." },
      null,
      2,
    ),
  );

  try {
    const response = await makeRequest(url, {
      method: "POST",
      data: requestBody,
      timeout: 30000,
    });

    console.log("\n📥 RESPONSE:");
    console.log("HTTP Status:", response.status);
    console.log(
      "Body:",
      JSON.stringify(response.data, null, 2).substring(0, 2000) + "...",
    );

    const statusOk =
      response.data?.ResponseStatus === 1 || response.data?.Status === 1;
    const hasHotels = response.data?.HotelResults?.length > 0;

    if (statusOk && hasHotels) {
      console.log(
        "\n✅ PASS - Retrieved",
        response.data.HotelResults.length,
        "hotels",
      );

      // Show first hotel
      const hotel = response.data.HotelResults[0];
      console.log("\nFirst Hotel:");
      console.log("  Name:", hotel.HotelName);
      console.log("  Code:", hotel.HotelCode);
      console.log("  Stars:", hotel.StarRating);
      console.log(
        "  Price:",
        hotel.Price?.OfferedPrice,
        hotel.Price?.CurrencyCode,
      );

      return true;
    } else {
      console.log(
        "\n❌ FAIL - Status:",
        response.data?.Status || response.data?.ResponseStatus,
        "| Hotels:",
        hasHotels ? "YES" : "NO",
      );
      return false;
    }
  } catch (error) {
    console.log("\n❌ ERROR:", error.message);
    console.log("HTTP Status:", error.response?.status);
    console.log("Response:", JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("\n" + "█".repeat(80));
  console.log("TBO HOTEL API - COMPLETE TEST WITH FULL LOGGING");
  console.log("█".repeat(80));

  console.log("\n📋 Configuration:");
  console.log("Auth URL:", TBO_CONFIG.authUrl);
  console.log("Static Base:", TBO_CONFIG.staticBase);
  console.log("Search Base:", TBO_CONFIG.searchBase);
  console.log("ClientId:", TBO_CONFIG.clientId);
  console.log("UserName:", TBO_CONFIG.userId);
  console.log("EndUserIp:", TBO_CONFIG.endUserIp);
  console.log("Static UserName:", TBO_CONFIG.staticUserName);

  const results = {
    auth: false,
    countries: false,
    cities: false,
    search: false,
  };

  // Test 1
  results.auth = await test1_Authentication();
  if (!results.auth) {
    console.log("\n⛔ Stopping - Authentication failed\n");
    printSummary(results);
    return;
  }

  // Test 2
  results.countries = await test2_CountryList();

  // Test 3
  const cities = await test3_CityList();
  results.cities = cities.length > 0;

  // Test 4
  results.search = await test4_HotelSearch(cities);

  printSummary(results);
}

function printSummary(results) {
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log("1. Authentication:", results.auth ? "✅ PASS" : "❌ FAIL");
  console.log("2. Country List:", results.countries ? "✅ PASS" : "❌ FAIL");
  console.log("3. City List:", results.cities ? "✅ PASS" : "❌ FAIL");
  console.log("4. Hotel Search:", results.search ? "✅ PASS" : "❌ FAIL");

  const passCount = Object.values(results).filter((r) => r).length;
  console.log("\nTotal:", passCount, "/ 4 tests passed\n");
}

runTests().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
