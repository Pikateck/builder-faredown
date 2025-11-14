/**
 * TBO Static Data - Systematic Path Tester
 * Tests all documented TBO static endpoint path variations
 * Uses TokenId + ClientId (NOT UserName/Password)
 */

require("dotenv").config({ path: ".env" });
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const HttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;

// Fixie proxy
const FIXIE_URL = "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80";
const httpsAgent = new HttpsProxyAgent(FIXIE_URL);
const httpAgent = new HttpProxyAgent(FIXIE_URL);

// Hardcoded config (correct values)
const CONFIG = {
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  staticBase: "https://apiwr.tboholidays.com",
  clientId: "tboprod",
  userId: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",
};

let tokenId = null;

/**
 * Make proxied request
 */
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
    timeout: 15000,
  });
}

/**
 * Get TokenId
 */
async function authenticate() {
  console.log("🔐 Getting TokenId...\n");

  const response = await makeRequest(CONFIG.authUrl, {
    method: "POST",
    data: {
      ClientId: CONFIG.clientId,
      UserName: CONFIG.userId,
      Password: CONFIG.password,
      EndUserIp: CONFIG.endUserIp,
    },
  });

  if (response.data?.Status === 1 && response.data?.TokenId) {
    tokenId = response.data.TokenId;
    console.log("✅ TokenId obtained:", tokenId.substring(0, 30) + "...\n");
    return tokenId;
  } else {
    throw new Error("Authentication failed");
  }
}

/**
 * Test a single static endpoint path
 */
async function testPath(pathName, url, requestBody) {
  try {
    const response = await makeRequest(url, {
      method: "POST",
      data: requestBody,
    });

    console.log(`✅ ${pathName}`);
    console.log(`   URL: ${url}`);
    console.log(`   HTTP Status: ${response.status}`);
    console.log(`   Response Status: ${response.data?.Status}`);

    if (response.data?.Countries) {
      console.log(`   Countries Count: ${response.data.Countries.length}`);
    }
    if (response.data?.Cities) {
      console.log(`   Cities Count: ${response.data.Cities.length}`);
    }
    if (response.data?.Error?.ErrorMessage) {
      console.log(`   Error: ${response.data.Error.ErrorMessage}`);
    }

    console.log("");

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.log(`❌ ${pathName}`);
    console.log(`   URL: ${url}`);
    console.log(`   HTTP Status: ${error.response?.status || "N/A"}`);
    console.log(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.log(
        `   Response:`,
        JSON.stringify(error.response.data).substring(0, 200),
      );
    }
    console.log("");

    return {
      success: false,
      status: error.response?.status,
      error: error.message,
    };
  }
}

/**
 * Test all CountryList path variations
 */
async function testCountryListPaths() {
  console.log("═".repeat(80));
  console.log("TESTING COUNTRY LIST - All Path Variations");
  console.log("═".repeat(80));
  console.log("");

  // Request body with TokenId (NOT UserName/Password)
  const requestBody = {
    ClientId: CONFIG.clientId,
    TokenId: tokenId,
    EndUserIp: CONFIG.endUserIp,
  };

  console.log("📤 Request Body (all tests):");
  console.log(
    JSON.stringify(
      { ...requestBody, TokenId: tokenId.substring(0, 30) + "..." },
      null,
      2,
    ),
  );
  console.log("");

  const paths = [
    {
      name: "Path 1: /HotelAPI/CountryList",
      url: `${CONFIG.staticBase}/HotelAPI/CountryList`,
    },
    {
      name: "Path 2: /HotelAPI/StaticData/CountryList",
      url: `${CONFIG.staticBase}/HotelAPI/StaticData/CountryList`,
    },
    {
      name: "Path 3: /HotelAPI_V10/StaticData/CountryList",
      url: `${CONFIG.staticBase}/HotelAPI_V10/StaticData/CountryList`,
    },
    {
      name: "Path 4: /HotelAPI_V10/CountryList",
      url: `${CONFIG.staticBase}/HotelAPI_V10/CountryList`,
    },
    {
      name: "Path 5: /HotelAPI/StaticData.svc/rest/CountryList",
      url: `${CONFIG.staticBase}/HotelAPI/StaticData.svc/rest/CountryList`,
    },
    {
      name: "Path 6: /SharedAPI/SharedData.svc/rest/CountryList",
      url: `${CONFIG.staticBase}/SharedAPI/SharedData.svc/rest/CountryList`,
    },
    {
      name: "Path 7: /HotelAPI_V10/HotelService.svc/rest/CountryList",
      url: `${CONFIG.staticBase}/HotelAPI_V10/HotelService.svc/rest/CountryList`,
    },
  ];

  const results = [];

  for (const path of paths) {
    const result = await testPath(path.name, path.url, requestBody);
    results.push({
      ...path,
      ...result,
    });
  }

  return results;
}

/**
 * Test all DestinationCityList path variations
 */
async function testCityListPaths() {
  console.log("═".repeat(80));
  console.log("TESTING CITY LIST - All Path Variations");
  console.log("═".repeat(80));
  console.log("");

  // Request body with TokenId (NOT UserName/Password)
  const requestBody = {
    ClientId: CONFIG.clientId,
    TokenId: tokenId,
    EndUserIp: CONFIG.endUserIp,
    CountryCode: "AE",
  };

  console.log("📤 Request Body (all tests):");
  console.log(
    JSON.stringify(
      { ...requestBody, TokenId: tokenId.substring(0, 30) + "..." },
      null,
      2,
    ),
  );
  console.log("");

  const paths = [
    {
      name: "Path 1: /HotelAPI/DestinationCityList",
      url: `${CONFIG.staticBase}/HotelAPI/DestinationCityList`,
    },
    {
      name: "Path 2: /HotelAPI/HotelCityList",
      url: `${CONFIG.staticBase}/HotelAPI/HotelCityList`,
    },
    {
      name: "Path 3: /HotelAPI/StaticData/DestinationCityList",
      url: `${CONFIG.staticBase}/HotelAPI/StaticData/DestinationCityList`,
    },
    {
      name: "Path 4: /HotelAPI_V10/StaticData/DestinationCityList",
      url: `${CONFIG.staticBase}/HotelAPI_V10/StaticData/DestinationCityList`,
    },
    {
      name: "Path 5: /HotelAPI_V10/DestinationCityList",
      url: `${CONFIG.staticBase}/HotelAPI_V10/DestinationCityList`,
    },
    {
      name: "Path 6: /HotelAPI/StaticData.svc/rest/DestinationCityList",
      url: `${CONFIG.staticBase}/HotelAPI/StaticData.svc/rest/DestinationCityList`,
    },
    {
      name: "Path 7: /SharedAPI/SharedData.svc/rest/DestinationCityList",
      url: `${CONFIG.staticBase}/SharedAPI/SharedData.svc/rest/DestinationCityList`,
    },
    {
      name: "Path 8: /HotelAPI_V10/HotelService.svc/rest/DestinationCityList",
      url: `${CONFIG.staticBase}/HotelAPI_V10/HotelService.svc/rest/DestinationCityList`,
    },
  ];

  const results = [];

  for (const path of paths) {
    const result = await testPath(path.name, path.url, requestBody);
    results.push({
      ...path,
      ...result,
    });
  }

  return results;
}

/**
 * Print summary
 */
function printSummary(countryResults, cityResults) {
  console.log("═".repeat(80));
  console.log("SUMMARY - Working Endpoints");
  console.log("═".repeat(80));
  console.log("");

  const workingCountry = countryResults.filter(
    (r) => r.success && r.status === 200,
  );
  const workingCity = cityResults.filter((r) => r.success && r.status === 200);

  if (workingCountry.length > 0) {
    console.log("✅ COUNTRY LIST - Working Paths:");
    workingCountry.forEach((r) => {
      console.log(`   ${r.name}`);
      console.log(`   ${r.url}`);
      console.log("");
    });
  } else {
    console.log("❌ COUNTRY LIST - No working paths found\n");
  }

  if (workingCity.length > 0) {
    console.log("✅ CITY LIST - Working Paths:");
    workingCity.forEach((r) => {
      console.log(`   ${r.name}`);
      console.log(`   ${r.url}`);
      console.log("");
    });
  } else {
    console.log("❌ CITY LIST - No working paths found\n");
  }

  console.log("═".repeat(80));
  console.log("Total Tested:");
  console.log(`  Country List: ${countryResults.length} paths`);
  console.log(`  City List: ${cityResults.length} paths`);
  console.log(
    `  Success: ${workingCountry.length + workingCity.length} / ${countryResults.length + cityResults.length}`,
  );
  console.log("═".repeat(80));
  console.log("");
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("");
  console.log("█".repeat(80));
  console.log("TBO STATIC DATA - SYSTEMATIC PATH TESTER");
  console.log("█".repeat(80));
  console.log("");

  try {
    // 1. Authenticate
    await authenticate();

    // 2. Test Country List paths
    const countryResults = await testCountryListPaths();

    // 3. Test City List paths
    const cityResults = await testCityListPaths();

    // 4. Print summary
    printSummary(countryResults, cityResults);
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    console.error(error.stack);
  }
}

runTests();
