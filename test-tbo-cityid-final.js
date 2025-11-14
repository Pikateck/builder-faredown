/**
 * TBO CITY ID RESOLUTION - FINAL ATTEMPT
 *
 * Using EXACT credentials from environment
 * Testing all documented methods to get Dubai CityId
 */

require("dotenv").config({ path: "./api/.env" });
const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");

// EXACT configuration from .env
const CONFIG = {
  // Dynamic API (for hotel search)
  clientId: "tboprod", // TBO_CLIENT_ID
  userId: "BOMF145", // TBO_API_USER_ID
  password: "@Bo#4M-Api@", // TBO_API_PASSWORD
  endUserIp: "52.5.155.132", // TBO_END_USER_IP

  // Static data API (separate credentials)
  staticUser: "travelcategory", // TBO_STATIC_USER
  staticPassword: "Tra@59334536", // TBO_STATIC_PASSWORD

  // URLs
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  staticBase: "https://apiwr.tboholidays.com/HotelAPI/",

  // Proxy
  proxy: process.env.FIXIE_URL,
  useProxy: process.env.USE_SUPPLIER_PROXY === "true",
};

console.log("Configuration loaded:");
console.log("  ClientId:", CONFIG.clientId);
console.log("  UserId:", CONFIG.userId);
console.log("  Static User:", CONFIG.staticUser);
console.log("  Proxy:", CONFIG.useProxy ? "Enabled" : "Disabled");
console.log("");

function createClient() {
  const config = {
    timeout: 30000,
    headers: {
      "User-Agent": "Faredown/1.0",
      "Accept-Encoding": "gzip, deflate",
    },
  };

  if (CONFIG.useProxy && CONFIG.proxy) {
    config.httpsAgent = new HttpsProxyAgent(CONFIG.proxy);
    config.proxy = false;
  }

  return axios.create(config);
}

/**
 * STEP 1: Get TokenId
 */
async function authenticate() {
  console.log("=".repeat(80));
  console.log("STEP 1: AUTHENTICATE");
  console.log("=".repeat(80));

  const request = {
    ClientId: CONFIG.clientId,
    UserName: CONFIG.userId,
    Password: CONFIG.password,
    EndUserIp: CONFIG.endUserIp,
  };

  console.log("Request:");
  console.log("  URL:", CONFIG.authUrl);
  console.log("  ClientId:", request.ClientId);
  console.log("  UserName:", request.UserName);
  console.log("  Password:", request.Password);
  console.log("  EndUserIp:", request.EndUserIp);
  console.log("");

  try {
    const client = createClient();
    const response = await client.post(CONFIG.authUrl, request, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  Status:", response.data?.Status);
    console.log(
      "  TokenId:",
      response.data?.TokenId ? "✅ " + response.data.TokenId : "❌ MISSING",
    );
    console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
    console.log("");

    if (response.data?.TokenId) {
      return response.data.TokenId;
    } else {
      console.error("❌ Authentication failed!");
      console.error("Full response:", JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error("❌ Auth request failed:");
    console.error("  Status:", error.response?.status);
    console.error("  Data:", error.response?.data);
    return null;
  }
}

/**
 * STEP 2: Try to get city list with static credentials
 */
async function getCityListStatic() {
  console.log("=".repeat(80));
  console.log("STEP 2: GET CITY LIST (STATIC CREDENTIALS)");
  console.log("=".repeat(80));

  const url = CONFIG.staticBase + "CityList";
  const request = {
    UserName: CONFIG.staticUser,
    Password: CONFIG.staticPassword,
    CountryCode: "AE",
  };

  console.log("Request:");
  console.log("  URL:", url);
  console.log("  UserName:", request.UserName);
  console.log("  Password:", request.Password);
  console.log("  CountryCode:", request.CountryCode);
  console.log("");

  try {
    const client = createClient();
    const response = await client.post(url, request, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  Response:", JSON.stringify(response.data, null, 2));
    console.log("");

    // Check for cities
    const cities =
      response.data?.CityList ||
      response.data?.DestinationCityList ||
      response.data?.Cities ||
      response.data?.Result ||
      [];

    if (Array.isArray(cities) && cities.length > 0) {
      console.log("✅ Found", cities.length, "cities");

      const dubai = cities.find(
        (c) =>
          c.CityName?.toLowerCase().includes("dubai") ||
          c.Name?.toLowerCase().includes("dubai"),
      );

      if (dubai) {
        console.log("\n🎯 DUBAI FOUND!");
        console.log(JSON.stringify(dubai, null, 2));
        return dubai;
      } else {
        console.log("⚠️  Dubai not found in list");
        console.log(
          "Sample cities:",
          cities.slice(0, 5).map((c) => c.CityName || c.Name),
        );
      }
    } else {
      console.log("⚠️  No cities in response");
    }

    return null;
  } catch (error) {
    console.error("❌ Request failed:");
    console.error("  Status:", error.response?.status);
    console.error("  StatusText:", error.response?.statusText);
    console.error("  Data:", JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

/**
 * STEP 3: Try with TokenId (if static fails)
 */
async function getCityListWithToken(tokenId) {
  console.log("=".repeat(80));
  console.log("STEP 3: GET CITY LIST (WITH TOKENID)");
  console.log("=".repeat(80));

  const url = CONFIG.staticBase + "CityList";
  const request = {
    TokenId: tokenId,
    CountryCode: "AE",
  };

  console.log("Request:");
  console.log("  URL:", url);
  console.log("  TokenId:", tokenId.substring(0, 40) + "...");
  console.log("  CountryCode:", request.CountryCode);
  console.log("");

  try {
    const client = createClient();
    const response = await client.post(url, request, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  Response:", JSON.stringify(response.data, null, 2));
    console.log("");

    const cities =
      response.data?.CityList ||
      response.data?.DestinationCityList ||
      response.data?.Cities ||
      [];

    if (Array.isArray(cities) && cities.length > 0) {
      console.log("✅ Found", cities.length, "cities");

      const dubai = cities.find(
        (c) =>
          c.CityName?.toLowerCase().includes("dubai") ||
          c.Name?.toLowerCase().includes("dubai"),
      );

      if (dubai) {
        console.log("\n🎯 DUBAI FOUND!");
        console.log(JSON.stringify(dubai, null, 2));
        return dubai;
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Request failed:");
    console.error("  Status:", error.response?.status);
    console.error("  Data:", JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("\n╔" + "═".repeat(78) + "╗");
  console.log(
    "║" + " ".repeat(25) + "TBO CITYID RESOLUTION" + " ".repeat(32) + "║",
  );
  console.log("╚" + "═".repeat(78) + "╝\n");

  // Step 1: Auth
  const tokenId = await authenticate();

  // Step 2: Try static credentials
  let dubai = await getCityListStatic();

  // Step 3: If static failed and we have TokenId, try with TokenId
  if (!dubai && tokenId) {
    dubai = await getCityListWithToken(tokenId);
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("FINAL RESULT");
  console.log("=".repeat(80));

  if (dubai) {
    const cityId = dubai.CityId || dubai.Id || dubai.id;
    console.log("\n✅ SUCCESS! Dubai CityId found:");
    console.log("\n  CityId:", cityId);
    console.log("  CityName:", dubai.CityName || dubai.Name);
    console.log("  CountryCode:", dubai.CountryCode || dubai.Country);
    console.log("\nFull Dubai object:");
    console.log(JSON.stringify(dubai, null, 2));

    // Save to file
    fs.writeFileSync(
      "dubai-cityid.json",
      JSON.stringify(
        {
          cityId: cityId,
          dubai: dubai,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    console.log("\n✅ Dubai CityId saved to: dubai-cityid.json");
    console.log("\n🚀 NEXT STEP:");
    console.log(`   node test-tbo-hotel-search.js --cityId=${cityId}`);
  } else {
    console.log("\n❌ FAILED - Could not retrieve Dubai CityId from TBO API");
    console.log("\n📋 WHAT HAPPENED:");
    console.log("  ✅ Auth endpoint: " + (tokenId ? "Working" : "Failed"));
    console.log("  ❌ Static CityList (UserName/Password): Failed");
    console.log(
      "  ❌ CityList with TokenId: " +
        (tokenId ? "Failed" : "Not tested (no TokenId)"),
    );
    console.log("\n🔍 DIAGNOSIS:");
    console.log(
      "  The TBO static data API is not accessible via the documented endpoints.",
    );
    console.log("  This could mean:");
    console.log(
      "    1. Static data requires portal download (NewCityListHotel.rar)",
    );
    console.log("    2. Endpoint paths are different from documentation");
    console.log("    3. Static credentials need to be activated/whitelisted");
    console.log("    4. SOAP/XML is required instead of JSON");
    console.log("\n📞 REQUIRED USER ACTION:");
    console.log("  Since I cannot log into web portals, you need to:");
    console.log(
      "  1. Log into TBO B2B portal: https://b2b.travelboutiqueonline.com",
    );
    console.log("     (or ask TBO support for the correct portal URL)");
    console.log("  2. Look for: Static Data > Downloads > City List");
    console.log("  3. Download: NewCityListHotel.rar (or similar file)");
    console.log("  4. Extract the file and find Dubai (AE) in the CSV/Excel");
    console.log("  5. Provide the CityId to me");
    console.log("\n  OR");
    console.log("\n  Contact TBO support and ask:");
    console.log("    'What is the CityId for Dubai (CountryCode: AE)?'");
    console.log("    'How do I access the static city list data?'");
  }
}

main().catch(console.error);
