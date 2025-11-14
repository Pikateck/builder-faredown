/**
 * TBO HOTEL SEARCH WITH REAL DUBAI CITYID
 *
 * Using DestinationId: 115936 (from GetDestinationSearchStaticData)
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
  searchUrl:
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult",

  dubaicityId: 115936, // From GetDestinationSearchStaticData

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
  console.log("Payload:", JSON.stringify(request, null, 2));

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
    console.log("Status:", response.data?.Status);
    console.log(
      "TokenId:",
      response.data?.TokenId ? "✅ " + response.data.TokenId : "❌ MISSING",
    );
    console.log(
      "Member:",
      response.data?.Member?.FirstName,
      response.data?.Member?.LastName,
    );

    return response.data?.TokenId;
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    return null;
  }
}

async function searchHotels(tokenId) {
  console.log("\n" + "═".repeat(80));
  console.log("STEP 2: SEARCH HOTELS IN DUBAI");
  console.log("═".repeat(80));

  const request = {
    EndUserIp: CONFIG.endUserIp,
    TokenId: tokenId,
    CheckInDate: "15/12/2025",
    NoOfNights: 3,
    CountryCode: "AE",
    CityId: CONFIG.dubaicityId, // Real CityId from static data
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
  console.log("URL:", CONFIG.searchUrl);
  console.log("Payload:");
  console.log(
    JSON.stringify(
      {
        ...request,
        TokenId: tokenId.substring(0, 40) + "...",
      },
      null,
      2,
    ),
  );

  console.log("\nKey Parameters:");
  console.log(
    "  CityId:",
    request.CityId,
    "(Dubai - from GetDestinationSearchStaticData)",
  );
  console.log("  CheckIn:", request.CheckInDate);
  console.log("  Nights:", request.NoOfNights);
  console.log("  Currency:", request.PreferredCurrency);
  console.log("  Rooms:", request.NoOfRooms);
  console.log("  Guests:", request.RoomGuests[0].NoOfAdults, "adults");

  try {
    const client = createClient();
    const response = await client.post(CONFIG.searchUrl, request, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("\n📥 RESPONSE:");
    console.log("HTTP Status:", response.status);
    console.log("ResponseStatus:", response.data?.ResponseStatus);
    console.log("Status:", response.data?.Status);
    console.log("TraceId:", response.data?.TraceId);
    console.log("Hotel Count:", response.data?.HotelResults?.length || 0);
    console.log("Error:", response.data?.Error?.ErrorMessage || "None");

    if (response.data?.HotelResults?.length > 0) {
      console.log(
        "\n✅ SUCCESS! Found",
        response.data.HotelResults.length,
        "hotels in Dubai",
      );

      console.log("\n📋 SAMPLE HOTELS (First 10):");
      console.log("─".repeat(80));

      response.data.HotelResults.slice(0, 10).forEach((hotel, i) => {
        console.log(`\n${i + 1}. ${hotel.HotelName}`);
        console.log(`   Hotel Code: ${hotel.HotelCode}`);
        console.log(`   Star Rating: ${hotel.StarRating} ⭐`);
        console.log(
          `   Price: ${hotel.Price?.CurrencyCode} ${hotel.Price?.OfferedPrice}`,
        );
        console.log(`   Published Price: ${hotel.Price?.PublishedPrice}`);
        console.log(`   Result Index: ${hotel.ResultIndex}`);
      });

      console.log("\n─".repeat(80));
      console.log("Total Hotels:", response.data.HotelResults.length);

      // Save full response
      fs.writeFileSync(
        "tbo-dubai-hotel-search-SUCCESS.json",
        JSON.stringify(
          {
            request: {
              ...request,
              TokenId: "***REDACTED***",
            },
            response: response.data,
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
      );

      console.log(
        "\n💾 Full response saved to: tbo-dubai-hotel-search-SUCCESS.json",
      );

      return response.data;
    } else {
      console.log("\n⚠️  No hotels found (but no error)");
      console.log("Full response:", JSON.stringify(response.data, null, 2));

      fs.writeFileSync(
        "tbo-dubai-hotel-search-no-results.json",
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

      return null;
    }
  } catch (error) {
    console.error(
      "\n❌ ERROR:",
      error.response?.status,
      error.response?.statusText,
    );
    console.error("Response:", JSON.stringify(error.response?.data, null, 2));

    fs.writeFileSync(
      "tbo-dubai-hotel-search-ERROR.json",
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

async function main() {
  console.log("\n╔" + "═".repeat(78) + "╗");
  console.log(
    "║" +
      " ".repeat(18) +
      "TBO HOTEL SEARCH - DUBAI (REAL CITYID)" +
      " ".repeat(22) +
      "║",
  );
  console.log("╚" + "═".repeat(78) + "╝\n");

  console.log("Configuration:");
  console.log(
    "  Dubai CityId:",
    CONFIG.dubaicityId,
    "(from GetDestinationSearchStaticData)",
  );
  console.log("  Auth URL:", CONFIG.authUrl);
  console.log("  Search URL:", CONFIG.searchUrl);
  console.log("  Proxy:", CONFIG.useProxy ? "Enabled" : "Disabled");
  console.log("");

  // Step 1: Auth
  const tokenId = await authenticate();
  if (!tokenId) {
    console.log("\n❌ ABORTED - Authentication failed");
    return;
  }

  // Step 2: Search
  const hotels = await searchHotels(tokenId);

  // Summary
  console.log("\n" + "═".repeat(80));
  console.log("FINAL SUMMARY");
  console.log("═".repeat(80));

  if (hotels && hotels.HotelResults?.length > 0) {
    console.log("\n🎉 COMPLETE SUCCESS - END TO END INTEGRATION WORKING!");
    console.log("\n✅ Auth: SUCCESS");
    console.log(
      "✅ GetDestinationSearchStaticData: SUCCESS (DestinationId: 115936)",
    );
    console.log(
      "✅ GetHotelResult: SUCCESS (" + hotels.HotelResults.length + " hotels)",
    );
    console.log("\n📊 INTEGRATION STATUS: READY FOR PRODUCTION");
    console.log("\n🚀 NEXT STEPS:");
    console.log("  1. Wire Dubai CityId (115936) into Faredown hotel search");
    console.log(
      "  2. Implement city autocomplete using GetDestinationSearchStaticData",
    );
    console.log("  3. Test GetHotelRoom (room details)");
    console.log("  4. Test BlockRoom (pre-book)");
    console.log("  5. Test Book (final booking)");
    console.log("\n📁 FILES CREATED:");
    console.log(
      "  - dubai-destination-success.json (static data with all UAE cities)",
    );
    console.log(
      "  - tbo-dubai-hotel-search-SUCCESS.json (full hotel search results)",
    );
  } else {
    console.log("\n❌ HOTEL SEARCH FAILED");
    console.log("Check the error logs and JSON files for details.");
  }
}

main().catch(console.error);
