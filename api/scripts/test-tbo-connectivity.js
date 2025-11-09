#!/usr/bin/env node

/**
 * TBO Connectivity Test Script
 * Tests authentication and basic hotel search against TBO Hotel API
 * 
 * Usage: node api/scripts/test-tbo-connectivity.js
 * 
 * Environment variables required:
 * - TBO_CLIENT_ID=tboprod
 * - TBO_API_USER_ID=BOMF145
 * - TBO_API_PASSWORD=@Bo#4M-Api@
 * - TBO_STATIC_USER=travelcategory
 * - TBO_STATIC_PASSWORD=Tra@59334536
 */

const axios = require("axios");
const { tboRequest } = require("../lib/tboRequest");

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
  }[type] || "•";
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function testTBOConnectivity() {
  log("=== TBO Connectivity Test ===", "info");
  log(
    "This test verifies TBO Hotel API authentication and basic connectivity",
    "info",
  );
  console.log("");

  // Step 1: Verify environment variables
  log("Step 1: Checking environment variables", "info");
  const requiredVars = [
    "TBO_HOTEL_CLIENT_ID",
    "TBO_HOTEL_USER_ID",
    "TBO_HOTEL_PASSWORD",
    "TBO_STATIC_DATA_CREDENTIALS_USERNAME",
    "TBO_STATIC_DATA_CREDENTIALS_PASSWORD",
  ];

  const envVars = {};
  let allVarsPresent = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    const status = value ? "✓" : "✗";
    envVars[varName] = !!value;
    log(
      `  ${status} ${varName}: ${value ? "SET" : "MISSING"}`,
      value ? "success" : "error",
    );
    if (!value) allVarsPresent = false;
  }

  if (!allVarsPresent) {
    log("Missing required environment variables. Exiting.", "error");
    process.exit(1);
  }

  console.log("");

  // Step 2: Test Authentication
  log("Step 2: Testing TBO Authentication (Dynamic API)", "info");
  const authPayload = {
    ClientId: process.env.TBO_HOTEL_CLIENT_ID || process.env.TBO_CLIENT_ID,
    UserName: process.env.TBO_HOTEL_USER_ID || process.env.TBO_API_USER_ID,
    Password: process.env.TBO_HOTEL_PASSWORD || process.env.TBO_API_PASSWORD,
    EndUserIp: process.env.TBO_END_USER_IP || "192.168.5.56",
  };

  log(`  Authenticating as: ${authPayload.UserName}@${authPayload.ClientId}`);
  log(`  Endpoint: https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/Authenticate`);

  try {
    const authResponse = await tboRequest(
      "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/Authenticate",
      {
        method: "POST",
        data: authPayload,
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (authResponse.data?.Status === 1 && authResponse.data?.TokenId) {
      const tokenId = authResponse.data.TokenId;
      log(`Authentication successful!`, "success");
      log(`  Token: ${tokenId.substring(0, 30)}...`);
      log(`  Token expires in: ${authResponse.data?.ExpiryDuration || "~55 minutes"}`);

      console.log("");

      // Step 3: Test Hotel Search
      log("Step 3: Testing TBO Hotel Search (Dynamic Search)", "info");
      const searchPayload = {
        ClientId: process.env.TBO_HOTEL_CLIENT_ID || process.env.TBO_CLIENT_ID,
        UserName: process.env.TBO_HOTEL_USER_ID || process.env.TBO_API_USER_ID,
        Password: process.env.TBO_HOTEL_PASSWORD || process.env.TBO_API_PASSWORD,
        EndUserIp: process.env.TBO_END_USER_IP || "192.168.5.56",
        CheckInDate: "31/10/2025", // dd/mm/yyyy format
        CheckOutDate: "03/11/2025",
        CityId: "130443", // Dubai (DXB)
        NoOfRooms: 1,
        RoomGuests: [
          {
            NoOfAdults: 2,
            NoOfChild: 0,
            ChildAge: [],
          },
        ],
        GuestNationality: "IN",
        PreferredCurrency: "INR",
        IsNearBySearchAllowed: true,
      };

      log(`  Searching hotels in Dubai (CityId: 130443)`);
      log(
        `  Dates: 31/10/2025 - 03/11/2025 (2 nights)`,
      );
      log(
        `  Endpoint: https://affiliate.travelboutiqueonline.com/HotelAPI/Search`,
      );

      try {
        const searchResponse = await tboRequest(
          "https://affiliate.travelboutiqueonline.com/HotelAPI/Search",
          {
            method: "POST",
            data: searchPayload,
            timeout: 30000,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );

        if (searchResponse.data?.Status === 1) {
          const hotels = searchResponse.data?.HotelSearchResult || [];
          log(`Hotel search successful!`, "success");
          log(`  Total hotels found: ${hotels.length}`);

          if (hotels.length > 0) {
            const firstHotel = hotels[0];
            log(`  Sample hotel:`, "info");
            log(
              `    - Name: ${firstHotel.HotelName || "N/A"}`,
            );
            log(
              `    - Rating: ${firstHotel.StarRating || "N/A"} stars`,
            );
            log(
              `    - Code: ${firstHotel.HotelCode || "N/A"}`,
            );
            log(
              `    - Price (per night): ${firstHotel.Price?.CurrencyCode || "INR"} ${
                firstHotel.Price?.RoomPrice || "N/A"
              }`,
            );
          }

          console.log("");
          log(
            "✓ TBO connectivity test PASSED - All systems operational!",
            "success",
          );
          console.log("");
          log(
            "You can now proceed with implementing the STEP 2 canonical endpoints.",
            "info",
          );
          process.exit(0);
        } else {
          const errorMsg =
            searchResponse.data?.Error?.ErrorMessage ||
            searchResponse.data?.Error?.Message ||
            JSON.stringify(searchResponse.data);
          log(`Hotel search failed: ${errorMsg}`, "error");
          log(`Full response:`, "error");
          console.log(JSON.stringify(searchResponse.data, null, 2));
          process.exit(1);
        }
      } catch (searchError) {
        log(`Hotel search request failed: ${searchError.message}`, "error");
        if (searchError.response) {
          log(
            `  HTTP Status: ${searchError.response.status}`,
            "error",
          );
          log(
            `  Response: ${JSON.stringify(searchError.response.data).substring(0, 200)}`,
            "error",
          );
        }
        console.log("");
        log("Full error details:", "error");
        console.log(searchError);
        process.exit(1);
      }
    } else {
      const errorMsg =
        authResponse.data?.Error?.ErrorMessage ||
        authResponse.data?.Error?.Message ||
        authResponse.data?.Message ||
        JSON.stringify(authResponse.data);
      log(`Authentication failed: ${errorMsg}`, "error");
      log(`Full response:`, "error");
      console.log(JSON.stringify(authResponse.data, null, 2));
      process.exit(1);
    }
  } catch (authError) {
    log(`Authentication request failed: ${authError.message}`, "error");
    if (authError.response) {
      log(
        `  HTTP Status: ${authError.response.status}`,
        "error",
      );
      const responseData =
        typeof authError.response.data === "string"
          ? authError.response.data.substring(0, 200)
          : JSON.stringify(authError.response.data).substring(0, 200);
      log(`  Response: ${responseData}`, "error");

      if (authError.response.status === 401 || authError.response.status === 403) {
        log(
          `\n⚠️  Authentication error (401/403). Possible causes:`,
          "warning",
        );
        log(
          `   1. Credentials incorrect (TBO_CLIENT_ID, TBO_API_USER_ID, TBO_API_PASSWORD)`,
          "warning",
        );
        log(
          `   2. Outbound IP not whitelisted (52.5.155.132, 52.87.82.133)`,
          "warning",
        );
        log(
          `   3. Account not enabled for TBO Hotel API`,
          "warning",
        );
      }
    }
    console.log("");
    log("Full error details:", "error");
    console.log(authError);
    process.exit(1);
  }
}

// Run the test
testTBOConnectivity().catch((error) => {
  log(`Unexpected error: ${error.message}`, "error");
  console.log(error);
  process.exit(1);
});
