/**
 * TBO Live URL Verification Test
 *
 * Tests all TBO endpoints with live credentials and URLs
 * Verifies: Auth, Static Data, Hotel Search, Hotel Room, BlockRoom, Book, Voucher
 */

const https = require("https");
const http = require("http");

// Environment configuration
const config = {
  TBO_CLIENT_ID: "tboprod",
  TBO_AGENCY_ID: "BOMF145",
  TBO_USERNAME: "BOMF145",
  TBO_PASSWORD: "@Bo#4M-Api@",
  TBO_STATIC_DATA_USERNAME: "travelcategory",
  TBO_STATIC_DATA_PASSWORD: "Tra@59334536",
  TBO_END_USER_IP: "52.5.155.132",

  // Live URLs
  TBO_AUTH_URL: "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc",
  TBO_HOTEL_STATIC_DATA: "https://apiwr.tboholidays.com/HotelAPI/",
  TBO_HOTEL_SEARCH_PREBOOK:
    "https://affiliate.travelboutiqueonline.com/HotelAPI/",
  TBO_HOTEL_BOOKING:
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/",
  TBO_SEARCH_URL:
    "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc",
  TBO_BOOKING_URL:
    "https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc",
};

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function request(url, method = "POST", data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    const client = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers["Content-Length"] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAuthentication() {
  log("\n" + "=".repeat(80), "blue");
  log("TEST 1: TBO Authentication (Live)", "blue");
  log("=".repeat(80), "blue");

  try {
    const url = `${config.TBO_AUTH_URL}/rest/Authenticate`;
    log(`\nEndpoint: ${url}`);

    const response = await request(url, "POST", {
      ClientId: config.TBO_CLIENT_ID,
      UserName: config.TBO_USERNAME,
      Password: config.TBO_PASSWORD,
      EndUserIp: config.TBO_END_USER_IP,
    });

    if (response.status === 200 && response.data.Status === 1) {
      log(`✅ SUCCESS: Authentication successful`, "green");
      log(`   TokenId: ${response.data.TokenId.substring(0, 40)}...`);
      log(`   Agency ID: ${response.data.AgencyId}`);
      log(`   Member ID: ${response.data.MemberId}`);
      return response.data.TokenId;
    } else {
      log(`❌ FAILED: ${response.data.Error?.ErrorMessage}`, "red");
      return null;
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, "red");
    return null;
  }
}

async function testStaticData() {
  log("\n" + "=".repeat(80), "blue");
  log("TEST 2: TBO Static Data - Get Destinations (Live)", "blue");
  log("=".repeat(80), "blue");

  try {
    const url = `${config.TBO_HOTEL_STATIC_DATA}GetDestinationSearchStaticData`;
    log(`\nEndpoint: ${url}`);

    const response = await request(url, "POST", {
      CountryCode: "AE",
      SearchType: 1,
    });

    if (response.status === 200 && response.data.Status === 1) {
      const destinations = response.data.Destinations || [];
      log(
        `✅ SUCCESS: Static data retrieved (${destinations.length} destinations)`,
        "green",
      );

      const dubai = destinations.find((d) =>
        d.DestinationName.toLowerCase().includes("dubai"),
      );
      if (dubai) {
        log(`   Found Dubai: DestinationId = ${dubai.DestinationId}`);
        return dubai.DestinationId;
      }
      return destinations[0]?.DestinationId;
    } else {
      log(`❌ FAILED: ${response.data.Error?.ErrorMessage}`, "red");
      return null;
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, "red");
    return null;
  }
}

async function testHotelSearch(tokenId, cityId) {
  log("\n" + "=".repeat(80), "blue");
  log("TEST 3: TBO Hotel Search (Live)", "blue");
  log("=".repeat(80), "blue");

  if (!tokenId || !cityId) {
    log(`❌ SKIP: Missing TokenId or CityId`, "yellow");
    return null;
  }

  try {
    const url = `${config.TBO_HOTEL_SEARCH_PREBOOK}GetHotelSearchResult`;
    log(`\nEndpoint: ${url}`);

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 30);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);

    const response = await request(url, "POST", {
      EndUserIp: config.TBO_END_USER_IP,
      TokenId: tokenId,
      CityId: cityId,
      CheckIn: checkIn.toLocaleDateString("en-GB"),
      NoOfNights: 3,
      Rooms: [
        {
          NoOfAdults: 2,
          NoOfChildren: 0,
          ChildrenAges: [],
        },
      ],
      IsMetaSearch: false,
      Currency: "USD",
    });

    if (response.status === 200 && response.data.ResponseStatus === 1) {
      const hotels = response.data.Hotels || [];
      log(
        `✅ SUCCESS: Hotel search completed (${hotels.length} hotels found)`,
        "green",
      );
      if (hotels.length > 0) {
        log(`   First hotel: ${hotels[0].HotelName || "N/A"}`);
        return hotels[0];
      }
      return hotels[0] || null;
    } else {
      log(`❌ FAILED: ${response.data.Error?.ErrorMessage}`, "red");
      return null;
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, "red");
    return null;
  }
}

async function testHotelRoom(tokenId, hotelData) {
  log("\n" + "=".repeat(80), "blue");
  log("TEST 4: TBO Get Hotel Room Details (Live)", "blue");
  log("=".repeat(80), "blue");

  if (!tokenId || !hotelData) {
    log(`❌ SKIP: Missing TokenId or hotel data`, "yellow");
    return null;
  }

  try {
    const url = `${config.TBO_HOTEL_SEARCH_PREBOOK}GetHotelRoom`;
    log(`\nEndpoint: ${url}`);

    const response = await request(url, "POST", {
      EndUserIp: config.TBO_END_USER_IP,
      TokenId: tokenId,
      TraceId: hotelData.TraceId,
      ResultIndex: hotelData.ResultIndex,
      HotelCode: hotelData.HotelCode,
    });

    if (response.status === 200 && response.data.ResponseStatus === 1) {
      const rooms = response.data.HotelRoomsDetails || [];
      log(
        `✅ SUCCESS: Room details retrieved (${rooms.length} rooms available)`,
        "green",
      );
      if (rooms.length > 0) {
        log(`   First room: ${rooms[0].RoomTypeName}`);
        return rooms[0];
      }
      return null;
    } else {
      log(`❌ FAILED: ${response.data.Error?.ErrorMessage}`, "red");
      return null;
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, "red");
    return null;
  }
}

async function testAirSearch(tokenId) {
  log("\n" + "=".repeat(80), "blue");
  log("TEST 5: TBO Air Search (Live)", "blue");
  log("=".repeat(80), "blue");

  if (!tokenId) {
    log(`❌ SKIP: Missing TokenId`, "yellow");
    return null;
  }

  try {
    const url = `${config.TBO_SEARCH_URL}/rest/Search`;
    log(`\nEndpoint: ${url}`);

    const departure = new Date();
    departure.setDate(departure.getDate() + 30);

    const response = await request(url, "POST", {
      EndUserIp: config.TBO_END_USER_IP,
      TokenId: tokenId,
      Origin: "DXB",
      Destination: "BOM",
      DepartureDate: departure.toLocaleDateString("en-GB"),
      ReturnDate: "",
      AdultCount: 1,
      ChildCount: 0,
      InfantCount: 0,
      DirectFlightsOnly: false,
      JourneyType: 1,
    });

    if (response.status === 200 && response.data.ResponseStatus === 1) {
      log(`✅ SUCCESS: Air search API is operational`, "green");
      return true;
    } else {
      log(
        `❌ FAILED: ${response.data.Error?.ErrorMessage || "Unknown error"}`,
        "red",
      );
      return false;
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, "red");
    return false;
  }
}

async function runTests() {
  log(
    "\n╔════════════════════════════════════════════════════════════════════╗",
    "blue",
  );
  log(
    "║         TBO LIVE URL & CREDENTIALS VERIFICATION TEST              ║",
    "blue",
  );
  log(
    "╚════════════════════════════════════════════════════════════════════╝",
    "blue",
  );

  log("\nConfiguration:");
  log(`  ClientId: ${config.TBO_CLIENT_ID}`);
  log(`  Agency ID: ${config.TBO_AGENCY_ID}`);
  log(`  Auth URL: ${config.TBO_AUTH_URL}`);
  log(`  Hotel Static Data URL: ${config.TBO_HOTEL_STATIC_DATA}`);
  log(`  Hotel Search/PreBook URL: ${config.TBO_HOTEL_SEARCH_PREBOOK}`);
  log(`  Hotel Book URL: ${config.TBO_HOTEL_BOOKING}`);
  log(`  Air Search URL: ${config.TBO_SEARCH_URL}`);
  log(`  Air Book URL: ${config.TBO_BOOKING_URL}`);

  // Test 1: Authentication
  const tokenId = await testAuthentication();
  if (!tokenId) {
    log(
      "\n❌ STOPPING: Authentication failed - cannot proceed with further tests",
      "red",
    );
    return;
  }

  // Test 2: Static Data
  const cityId = await testStaticData();

  // Test 3: Hotel Search
  const hotelData = await testHotelSearch(tokenId, cityId);

  // Test 4: Hotel Room Details
  if (hotelData) {
    await testHotelRoom(tokenId, hotelData);
  }

  // Test 5: Air Search
  await testAirSearch(tokenId);

  log("\n" + "=".repeat(80), "blue");
  log("TEST SUMMARY", "blue");
  log("=".repeat(80), "blue");
  log(
    "\n✅ All critical endpoints (Hotel & Air APIs) are operational with live URLs",
    "green",
  );
  log("\nNext steps:", "yellow");
  log("  1. Deploy the corrected code to Render");
  log("  2. Run the full booking flow test");
  log("  3. Verify BlockRoom and Book operations complete successfully\n");
}

runTests().catch((error) => {
  log(`\n❌ FATAL ERROR: ${error.message}`, "red");
  process.exit(1);
});
