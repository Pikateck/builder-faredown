/**
 * TBO DESTINATION STATIC DATA - CORRECT IMPLEMENTATION
 *
 * Using the documented JSON method on the working host:
 * https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetDestinationSearchStaticData
 *
 * Flow:
 * 1. Authenticate → Get TokenId
 * 2. GetDestinationSearchStaticData (CountryCode=AE, SearchType=1) → Get Destinations array
 * 3. Find Dubai → Extract DestinationId
 * 4. GetHotelResult (CityId=DestinationId) → Get real hotels
 */

require("dotenv").config({ path: "./api/.env" });
const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");

const CONFIG = {
  clientId: "tboprod",
  userId: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",

  // All on the same working host
  baseUrl:
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/",
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",

  proxy: process.env.FIXIE_URL,
  useProxy: process.env.USE_SUPPLIER_PROXY === "true",
};

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
 * STEP 1: Authenticate
 */
async function authenticate() {
  console.log("═".repeat(80));
  console.log("STEP 1: AUTHENTICATE");
  console.log("═".repeat(80));

  const request = {
    ClientId: CONFIG.clientId,
    UserName: CONFIG.userId,
    Password: CONFIG.password,
    EndUserIp: CONFIG.endUserIp,
  };

  console.log("\n📤 REQUEST:");
  console.log("URL:", CONFIG.authUrl);
  console.log("Method: POST");
  console.log("Payload:");
  console.log(JSON.stringify(request, null, 2));

  try {
    const client = createClient();
    const response = await client.post(CONFIG.authUrl, request, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("\n📥 RESPONSE:");
    console.log("HTTP Status:", response.status);
    console.log("Response Body:");
    console.log(JSON.stringify(response.data, null, 2));

    const tokenId = response.data?.TokenId;

    if (tokenId) {
      console.log("\n✅ SUCCESS - TokenId obtained:", tokenId);
      return tokenId;
    } else {
      console.log("\n❌ FAILED - No TokenId in response");
      return null;
    }
  } catch (error) {
    console.error(
      "\n❌ ERROR:",
      error.response?.status,
      error.response?.statusText,
    );
    console.error("Response:", JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

/**
 * STEP 2: GetDestinationSearchStaticData
 */
async function getDestinationSearchStaticData(tokenId) {
  console.log("\n" + "═".repeat(80));
  console.log("STEP 2: GET DESTINATION SEARCH STATIC DATA");
  console.log("═".repeat(80));

  const url = CONFIG.baseUrl + "GetDestinationSearchStaticData";

  const request = {
    EndUserIp: CONFIG.endUserIp,
    TokenId: tokenId,
    CountryCode: "AE",
    SearchType: "1", // 1 = City-wise
  };

  console.log("\n📤 REQUEST:");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log("Payload:");
  console.log(JSON.stringify(request, null, 2));

  try {
    const client = createClient();
    const response = await client.post(url, request, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("\n📥 RESPONSE:");
    console.log("HTTP Status:", response.status);
    console.log("Response Body:");
    console.log(JSON.stringify(response.data, null, 2));

    // Save full response
    fs.writeFileSync(
      "tbo-destination-static-data-full.json",
      JSON.stringify(
        {
          request: request,
          response: response.data,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    console.log(
      "\n💾 Full response saved to: tbo-destination-static-data-full.json",
    );

    // Look for Destinations array
    const destinations =
      response.data?.Destinations ||
      response.data?.DestinationList ||
      response.data?.Cities ||
      [];

    if (Array.isArray(destinations) && destinations.length > 0) {
      console.log("\n✅ Found", destinations.length, "destinations");

      // Find Dubai
      const dubai = destinations.find(
        (d) =>
          d.CityName?.toLowerCase().includes("dubai") ||
          d.Name?.toLowerCase().includes("dubai") ||
          d.DestinationName?.toLowerCase().includes("dubai"),
      );

      if (dubai) {
        console.log("\n🎯 DUBAI FOUND:");
        console.log(JSON.stringify(dubai, null, 2));

        const destinationId = dubai.DestinationId || dubai.CityId || dubai.Id;

        console.log("\n✅ Dubai DestinationId:", destinationId);

        // Save Dubai data
        fs.writeFileSync(
          "dubai-destination-data.json",
          JSON.stringify(
            {
              destinationId: destinationId,
              dubai: dubai,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        );

        return {
          destinationId: destinationId,
          dubai: dubai,
        };
      } else {
        console.log("\n⚠️  Dubai not found in destinations list");
        console.log(
          "Sample destinations:",
          destinations
            .slice(0, 5)
            .map((d) => d.CityName || d.Name || d.DestinationName),
        );
        return null;
      }
    } else {
      console.log("\n⚠️  No destinations array found in response");
      console.log("Response keys:", Object.keys(response.data || {}));
      return null;
    }
  } catch (error) {
    console.error(
      "\n❌ ERROR:",
      error.response?.status,
      error.response?.statusText,
    );
    console.error("Response:", JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

/**
 * STEP 3: GetHotelResult with real DestinationId
 */
async function getHotelResult(tokenId, cityId) {
  console.log("\n" + "═".repeat(80));
  console.log("STEP 3: GET HOTEL RESULT (WITH REAL CITYID)");
  console.log("═".repeat(80));

  const url = CONFIG.baseUrl + "GetHotelResult";

  const request = {
    EndUserIp: CONFIG.endUserIp,
    TokenId: tokenId,
    CheckInDate: "15/12/2025",
    NoOfNights: 3,
    CountryCode: "AE",
    CityId: Number(cityId),
    PreferredCurrency: "USD",
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
  console.log("Payload:");
  console.log(JSON.stringify(request, null, 2));

  try {
    const client = createClient();
    const response = await client.post(url, request, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("\n📥 RESPONSE:");
    console.log("HTTP Status:", response.status);
    console.log("Response Status:", response.data?.ResponseStatus);
    console.log("TBO Status:", response.data?.Status);
    console.log("Hotel Count:", response.data?.HotelResults?.length || 0);
    console.log("TraceId:", response.data?.TraceId);
    console.log("Error:", response.data?.Error?.ErrorMessage || "None");

    if (response.data?.HotelResults?.length > 0) {
      console.log(
        "\n✅ SUCCESS! Found",
        response.data.HotelResults.length,
        "hotels",
      );
      console.log("\nSample Hotels:");
      response.data.HotelResults.slice(0, 5).forEach((h, i) => {
        console.log(`\n${i + 1}. ${h.HotelName}`);
        console.log(`   Code: ${h.HotelCode}`);
        console.log(`   Stars: ${h.StarRating}`);
        console.log(
          `   Price: ${h.Price?.OfferedPrice} ${h.Price?.CurrencyCode}`,
        );
      });
    }

    // Save full response
    fs.writeFileSync(
      "tbo-hotel-search-success.json",
      JSON.stringify(
        {
          request: request,
          response: response.data,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    console.log(
      "\n💾 Full search response saved to: tbo-hotel-search-success.json",
    );

    return response.data;
  } catch (error) {
    console.error(
      "\n❌ ERROR:",
      error.response?.status,
      error.response?.statusText,
    );
    console.error("Response:", JSON.stringify(error.response?.data, null, 2));

    // Save error response
    fs.writeFileSync(
      "tbo-hotel-search-error.json",
      JSON.stringify(
        {
          request: request,
          error: error.response?.data,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("\n╔" + "═".repeat(78) + "╗");
  console.log(
    "║" +
      " ".repeat(15) +
      "TBO COMPLETE FLOW: AUTH → STATIC → SEARCH" +
      " ".repeat(22) +
      "║",
  );
  console.log("╚" + "═".repeat(78) + "╝\n");

  console.log("Configuration:");
  console.log("  Base URL:", CONFIG.baseUrl);
  console.log("  Client ID:", CONFIG.clientId);
  console.log("  User ID:", CONFIG.userId);
  console.log("  End User IP:", CONFIG.endUserIp);
  console.log("  Proxy:", CONFIG.useProxy ? "Enabled" : "Disabled");
  console.log("");

  // Step 1: Authenticate
  const tokenId = await authenticate();
  if (!tokenId) {
    console.log("\n❌ ABORTED - Authentication failed");
    return;
  }

  // Step 2: Get Destination Static Data
  const destinationData = await getDestinationSearchStaticData(tokenId);
  if (!destinationData) {
    console.log("\n❌ ABORTED - Could not get Dubai destination data");
    return;
  }

  // Step 3: Search Hotels with real CityId
  const hotelResults = await getHotelResult(
    tokenId,
    destinationData.destinationId,
  );

  // Final Summary
  console.log("\n" + "═".repeat(80));
  console.log("FINAL SUMMARY");
  console.log("═".repeat(80));

  if (hotelResults && hotelResults.HotelResults?.length > 0) {
    console.log("\n🎉 COMPLETE SUCCESS!");
    console.log("\n✅ Step 1: Authentication - SUCCESS");
    console.log("   TokenId:", tokenId);
    console.log("\n✅ Step 2: Get Destination Static Data - SUCCESS");
    console.log("   Dubai DestinationId:", destinationData.destinationId);
    console.log(
      "   Dubai Data:",
      JSON.stringify(destinationData.dubai, null, 2),
    );
    console.log("\n✅ Step 3: Hotel Search - SUCCESS");
    console.log("   Hotels Found:", hotelResults.HotelResults.length);
    console.log("   TraceId:", hotelResults.TraceId);

    console.log("\n📁 FILES CREATED:");
    console.log(
      "  - tbo-destination-static-data-full.json (static data response)",
    );
    console.log("  - dubai-destination-data.json (Dubai DestinationId)");
    console.log("  - tbo-hotel-search-success.json (hotel search results)");

    console.log("\n🚀 NEXT STEPS:");
    console.log("  1. Wire Dubai DestinationId into Faredown hotel search");
    console.log(
      "  2. Implement city autocomplete using GetDestinationSearchStaticData",
    );
    console.log("  3. Test with other cities (London, Paris, etc.)");
    console.log("  4. Move to Room details, PreBook, Book flow");
  } else if (hotelResults) {
    console.log("\n⚠️  PARTIAL SUCCESS");
    console.log("\n✅ Step 1: Authentication - SUCCESS");
    console.log("✅ Step 2: Get Destination Static Data - SUCCESS");
    console.log("❌ Step 3: Hotel Search - No results (but no error)");
    console.log("\nThis could mean:");
    console.log("  - No hotels available for the search criteria");
    console.log("  - Search dates or parameters need adjustment");
  } else {
    console.log("\n❌ FLOW FAILED");
    console.log(
      "\nCheck the error logs above and the saved JSON files for details.",
    );
  }
}

main().catch(console.error);
