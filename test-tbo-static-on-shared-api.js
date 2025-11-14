/**
 * Test GetDestinationSearchStaticData on SharedData service
 * (Same service where Authenticate works)
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

  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",

  // Try different paths for static data
  staticEndpoints: [
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/GetDestinationSearchStaticData",
    "https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData",
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetDestinationSearchStaticData",
    "https://affiliate.travelboutiqueonline.com/HotelAPI/GetDestinationSearchStaticData",
  ],

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

async function authenticate() {
  const request = {
    ClientId: CONFIG.clientId,
    UserName: CONFIG.userId,
    Password: CONFIG.password,
    EndUserIp: CONFIG.endUserIp,
  };

  try {
    const client = createClient();
    const response = await client.post(CONFIG.authUrl, request, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data?.TokenId;
  } catch (error) {
    console.error("Auth failed:", error.message);
    return null;
  }
}

async function testStaticEndpoint(url, tokenId) {
  console.log("\n" + "=".repeat(80));
  console.log("Testing:", url);
  console.log("=".repeat(80));

  const request = {
    EndUserIp: CONFIG.endUserIp,
    TokenId: tokenId,
    CountryCode: "AE",
    SearchType: "1",
  };

  console.log("\n📤 REQUEST:");
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
    console.log(
      "Response:",
      JSON.stringify(response.data, null, 2).substring(0, 1000),
    );

    // Check for destinations
    const destinations =
      response.data?.Destinations ||
      response.data?.GetDestinationSearchStaticDataResult ||
      response.data?.DestinationList ||
      response.data?.Cities ||
      [];

    if (Array.isArray(destinations) && destinations.length > 0) {
      console.log("\n✅ SUCCESS! Found", destinations.length, "destinations");

      const dubai = destinations.find((d) =>
        String(d.CityName || d.Name || d.DestinationName || "")
          .toLowerCase()
          .includes("dubai"),
      );

      if (dubai) {
        console.log("\n🎯 DUBAI FOUND:");
        console.log(JSON.stringify(dubai, null, 2));
        return { url, dubai, destinations };
      } else {
        console.log("Sample destinations:", destinations.slice(0, 3));
      }
    } else {
      console.log("⚠️  No destinations array found");
      console.log("Response keys:", Object.keys(response.data || {}));
    }

    return null;
  } catch (error) {
    console.log(
      "❌ ERROR:",
      error.response?.status,
      error.response?.statusText,
    );
    if (error.response?.status !== 404) {
      console.log(
        "Error data:",
        JSON.stringify(error.response?.data, null, 2).substring(0, 500),
      );
    }
    return null;
  }
}

async function main() {
  console.log("╔" + "═".repeat(78) + "╗");
  console.log(
    "║" + " ".repeat(20) + "TEST STATIC DATA ENDPOINTS" + " ".repeat(32) + "║",
  );
  console.log("╚" + "═".repeat(78) + "╝\n");

  // Step 1: Auth
  console.log("Step 1: Authenticating...");
  const tokenId = await authenticate();

  if (!tokenId) {
    console.log("❌ Auth failed");
    return;
  }

  console.log("✅ TokenId:", tokenId);

  // Step 2: Try each endpoint
  let success = null;

  for (const endpoint of CONFIG.staticEndpoints) {
    const result = await testStaticEndpoint(endpoint, tokenId);
    if (result) {
      success = result;
      break;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));

  if (success) {
    console.log("\n✅ FOUND WORKING ENDPOINT:");
    console.log("  URL:", success.url);
    console.log("\n🎯 Dubai Data:");
    console.log(JSON.stringify(success.dubai, null, 2));

    const destinationId =
      success.dubai.DestinationId || success.dubai.CityId || success.dubai.Id;
    console.log("\n✅ Dubai DestinationId:", destinationId);

    fs.writeFileSync(
      "dubai-destination-success.json",
      JSON.stringify(
        {
          url: success.url,
          destinationId: destinationId,
          dubai: success.dubai,
          allDestinations: success.destinations,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    console.log("\n💾 Saved to: dubai-destination-success.json");
    console.log(
      "\n🚀 NEXT: Use this DestinationId in GetHotelResult as CityId",
    );
  } else {
    console.log("\n❌ ALL ENDPOINTS FAILED");
    console.log("\nTried:");
    CONFIG.staticEndpoints.forEach((e) => console.log("  -", e));
  }
}

main().catch(console.error);
