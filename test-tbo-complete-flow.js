#!/usr/bin/env node
/**
 * Complete TBO JSON API Test
 * 1. Get city list from static data API
 * 2. Authenticate
 * 3. Search hotels with correct CityId
 *
 * Uses ONLY endpoints from live credentials
 */

const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");

const config = {
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  searchUrl:
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult",
  staticDataUrl: "https://apiwr.tboholidays.com/HotelAPI/DestinationCityList",

  clientId: "tboprod",
  userName: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",

  staticUser: "travelcategory",
  staticPassword: "Tra@59334536",

  useProxy: true,
  proxyUrl: "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80",
};

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

const results = {
  staticData: null,
  auth: null,
  search: null,
};

console.log(
  "╔═══════════════════════════════════════════════════════════════╗",
);
console.log(
  "║         TBO Complete Flow Test - All Correct Endpoints        ║",
);
console.log(
  "╚═══════════════════════════════════════════════════════════════╝",
);
console.log("");
console.log("Endpoints:");
console.log("  Static: apiwr.tboholidays.com/HotelAPI/");
console.log("  Auth: api.travelboutiqueonline.com/SharedAPI/...");
console.log("  Search: hotelbooking.travelboutiqueonline.com/HotelAPI_V10/...");
console.log("");

async function runCompleteFlow() {
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━━━━━━━━
    // STEP 1: Get City List from Static Data
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║              STEP 1: GET CITY LIST (Static Data)              ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
    console.log("");
    console.log("📍 URL:", config.staticDataUrl);
    console.log("");

    const staticPayload = {
      UserName: config.staticUser,
      Password: config.staticPassword,
    };

    console.log("📤 REQUEST:");
    console.log(
      JSON.stringify(
        { UserName: staticPayload.UserName, Password: "***" },
        null,
        2,
      ),
    );
    console.log("");

    const staticResponse = await http.post(config.staticDataUrl, staticPayload);
    results.staticData = {
      request: { UserName: staticPayload.UserName },
      response: staticResponse.data,
    };

    console.log("📥 RESPONSE:");
    console.log("  HTTP Status:", staticResponse.status);
    console.log(
      "  Cities Found:",
      staticResponse.data?.DestinationCityList?.length || 0,
    );

    // Find Dubai
    const cities = staticResponse.data?.DestinationCityList || [];
    const dubai = cities.find((c) =>
      c.CityName?.toLowerCase().includes("dubai"),
    );

    if (dubai) {
      console.log("  ✅ Found Dubai:");
      console.log("     CityId:", dubai.CityId);
      console.log("     Name:", dubai.CityName);
      console.log("     CountryCode:", dubai.CountryCode);
    } else {
      console.log("  ⚠️  Dubai not found, will try CityId 130443");
    }
    console.log("");

    const cityId = dubai?.CityId || 130443;
    const countryCode = dubai?.CountryCode || "AE";

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Authentication
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                    STEP 2: AUTHENTICATION                      ║",
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
    console.log(
      JSON.stringify({ ...authPayload, Password: "***MASKED***" }, null, 2),
    );
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
      throw new Error("No TokenId received");
    }

    console.log("✅ Authentication successful!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Hotel Search
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║              STEP 3: HOTEL SEARCH (GetHotelResult)            ║",
    );
    console.log(
      "╚═══════════════════════════���═══════════════════════════════════╝",
    );
    console.log("");
    console.log("📍 URL:", config.searchUrl);
    console.log("");

    const searchPayload = {
      CheckInDate: "15/12/2025",
      NoOfNights: 3,
      CountryCode: countryCode,
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
      searchResponse.data.HotelSearchResult?.Error?.ErrorMessage;

    console.log("✅ Authentication:", authSuccess ? "SUCCESS" : "FAILED");
    console.log("✅ Hotel Search:", searchSuccess ? "SUCCESS" : "FAILED");
    console.log("📊 Hotels Found:", hotelCount);
    if (errorMessage) {
      console.log("⚠️  Error:", errorMessage);
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
      console.log("⚠️  Issue detected - review logs above");
      console.log("");
    }

    // Save results
    fs.writeFileSync(
      "tbo-complete-flow-results.json",
      JSON.stringify(results, null, 2),
    );
    console.log("💾 Full results saved to: tbo-complete-flow-results.json");
    console.log("");
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
      console.error("Response Data:");
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error("");

      results.error = {
        message: error.message,
        status: error.response.status,
        data: error.response.data,
      };
    }

    fs.writeFileSync(
      "tbo-complete-flow-results.json",
      JSON.stringify(results, null, 2),
    );
    console.error("💾 Results saved to: tbo-complete-flow-results.json");

    process.exit(1);
  }
}

runCompleteFlow();
