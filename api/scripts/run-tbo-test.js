#!/usr/bin/env node

/**
 * TBO Hotel API - Complete End-to-End Test Script
 * 
 * Tests:
 * 1) Authentication against TBO Shared Data API
 * 2) Hotel Search with live data from TBO Hotel API
 * 
 * Environment Variables Required:
 * - TBO_CLIENT_ID=tboprod (or TBO_HOTEL_CLIENT_ID)
 * - TBO_API_USER_ID=BOMF145 (or TBO_HOTEL_USER_ID)
 * - TBO_API_PASSWORD=@Bo#4M-Api@ (or TBO_HOTEL_PASSWORD)
 * 
 * Usage: node api/scripts/run-tbo-test.js
 */

const axios = require("axios");
const { tboRequest } = require("../lib/tboRequest");

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  cyan: "\x1b[36m",
};

function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    section: `${colors.bright}${colors.cyan}→${colors.reset}`,
  }[type] || "•";
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function logDivider() {
  console.log(
    `${colors.bright}${"=".repeat(80)}${colors.reset}`
  );
}

function logSubSection(title) {
  console.log("");
  log(`${title}`, "section");
}

// Get env vars with fallback to alternative names
function getEnvVar(primaryName, fallbackName, defaultValue = null) {
  const value = process.env[primaryName] || process.env[fallbackName];
  if (!value && defaultValue === null) {
    return null;
  }
  return value || defaultValue;
}

async function runTests() {
  logDivider();
  log(
    `TBO Hotel API - End-to-End Connectivity Test`,
    "section"
  );
  logDivider();
  console.log("");

  // ============================================================================
  // STEP 1: Environment Variable Verification
  // ============================================================================
  logSubSection("STEP 1: Environment Variable Verification");

  const tboClientId = getEnvVar("TBO_CLIENT_ID", "TBO_HOTEL_CLIENT_ID");
  const tboUserId = getEnvVar("TBO_API_USER_ID", "TBO_HOTEL_USER_ID");
  const tboPassword = getEnvVar("TBO_API_PASSWORD", "TBO_HOTEL_PASSWORD");
  const tboStaticUser = getEnvVar("TBO_STATIC_USER", "TBO_STATIC_DATA_CREDENTIALS_USERNAME");
  const tboStaticPass = getEnvVar("TBO_STATIC_PASSWORD", "TBO_STATIC_DATA_CREDENTIALS_PASSWORD");

  const requiredVars = {
    "TBO Client ID": tboClientId,
    "TBO User ID": tboUserId,
    "TBO Password": tboPassword,
  };

  let allVarsPresent = true;
  for (const [name, value] of Object.entries(requiredVars)) {
    const status = value ? "✓" : "✗";
    if (value) {
      log(`  ${status} ${name}: SET`, "success");
    } else {
      log(`  ${status} ${name}: MISSING`, "error");
      allVarsPresent = false;
    }
  }

  if (!allVarsPresent) {
    console.log("");
    log("Missing required environment variables. Please set:", "error");
    log(
      "  TBO_CLIENT_ID (or TBO_HOTEL_CLIENT_ID)=tboprod",
      "error"
    );
    log(
      "  TBO_API_USER_ID (or TBO_HOTEL_USER_ID)=BOMF145",
      "error"
    );
    log(
      "  TBO_API_PASSWORD (or TBO_HOTEL_PASSWORD)=@Bo#4M-Api@",
      "error"
    );
    process.exit(1);
  }

  console.log("");

  // ============================================================================
  // STEP 2: Authentication Test
  // ============================================================================
  logSubSection("STEP 2: Authentication Test (TBO Shared Data API)");

  const authEndpoint = "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/Authenticate";
  log(`Endpoint: ${authEndpoint}`);
  log(`User: ${tboUserId}@${tboClientId}`);

  const authPayload = {
    ClientId: tboClientId,
    UserName: tboUserId,
    Password: tboPassword,
    EndUserIp: process.env.TBO_END_USER_IP || "192.168.5.56",
  };

  const authLog = { ...authPayload, Password: "***MASKED***" };
  log(`Request Payload:`, "info");
  console.log(`  ${JSON.stringify(authLog, null, 2).split("\n").join("\n  ")}`);
  console.log("");

  let authToken = null;
  let authStartTime = Date.now();

  try {
    log(`Sending authentication request...`, "info");
    const authResponse = await axios.post(authEndpoint, authPayload, {
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const authTime = Date.now() - authStartTime;
    log(`✓ Authentication successful! (${authTime}ms)`, "success");

    const authData = authResponse.data;
    if (authData?.Status === 1 && authData?.TokenId) {
      authToken = authData.TokenId;
      log(`  Token: ${authToken.substring(0, 40)}...`, "success");
      log(`  Expires in: ${authData?.ExpiryDuration || "~55 minutes"}`, "success");
      log(`  Response Status Code: ${authResponse.status}`, "success");

      console.log("");
      log(`Full Response (First 500 chars):`, "info");
      const responseStr = JSON.stringify(authData, null, 2);
      console.log(
        `  ${responseStr.substring(0, 500).split("\n").join("\n  ")}${
          responseStr.length > 500 ? "\n  ..." : ""
        }`
      );
    } else {
      throw new Error(
        `Authentication failed: ${authData?.Error?.ErrorMessage || JSON.stringify(authData)}`
      );
    }
  } catch (error) {
    log(`✗ Authentication failed!`, "error");
    log(`Error: ${error.message}`, "error");
    if (error.response?.data) {
      log(`Full Response:`, "error");
      console.log(
        `  ${JSON.stringify(error.response.data, null, 2).split("\n").join("\n  ")}`
      );
    }
    process.exit(1);
  }

  console.log("");

  // ============================================================================
  // STEP 3: Hotel Search Test (Live)
  // ============================================================================
  logSubSection("STEP 3: Hotel Search Test (TBO Hotel API - Live)");

  // Calculate dates: 30-45 days from today
  const today = new Date();
  const checkInDate = new Date(today);
  checkInDate.setDate(checkInDate.getDate() + 30);

  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + 3); // 3 nights

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const checkIn = formatDate(checkInDate);
  const checkOut = formatDate(checkOutDate);

  // Test city: Dubai (DXB)
  const testCity = "DXB";

  log(`Search Parameters:`, "info");
  log(`  City: ${testCity} (Dubai)`, "info");
  log(`  Check-in: ${checkIn}`, "info");
  log(`  Check-out: ${checkOut}`, "info");
  log(`  Duration: 3 nights`, "info");
  log(`  Guests: 2 adults, 1 room`, "info");
  log(`  Currency: INR`, "info");

  const searchPayload = {
    ClientId: tboClientId,
    UserName: tboUserId,
    Password: tboPassword,
    EndUserIp: process.env.TBO_END_USER_IP || "192.168.5.56",
    City: testCity,
    CheckIn: checkIn,
    CheckOut: checkOut,
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

  const searchLog = { ...searchPayload, Password: "***MASKED***" };
  console.log("");
  log(`Request Payload:`, "info");
  console.log(
    `  ${JSON.stringify(searchLog, null, 2).split("\n").join("\n  ")}`
  );

  const searchEndpoint = "https://affiliate.travelboutiqueonline.com/HotelAPI/Search";
  log(`Endpoint: ${searchEndpoint}`, "info");
  console.log("");

  let searchStartTime = Date.now();

  try {
    log(`Sending hotel search request...`, "info");
    const searchResponse = await axios.post(searchEndpoint, searchPayload, {
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const searchTime = Date.now() - searchStartTime;
    const searchData = searchResponse.data;

    log(`✓ Hotel search completed! (${searchTime}ms)`, "success");
    log(`  Response Status Code: ${searchResponse.status}`, "success");

    if (searchData?.Status === 1) {
      const hotels = searchData?.HotelSearchResult || [];
      log(`  Hotels Found: ${hotels.length}`, "success");

      if (hotels.length > 0) {
        const firstHotel = hotels[0];
        console.log("");
        log(`Sample Hotel (First Result):`, "info");
        log(`  Name: ${firstHotel.HotelName || "N/A"}`, "info");
        log(`  Code: ${firstHotel.HotelCode || "N/A"}`, "info");
        log(`  Rating: ${firstHotel.StarRating || "N/A"} stars`, "info");

        if (firstHotel.Price) {
          log(`  Price (per night): ${firstHotel.Price?.CurrencyCode || "INR"} ${
            firstHotel.Price?.RoomPrice || firstHotel.Price?.PublishedPrice || "N/A"
          }`, "info");
        }

        if (firstHotel.Address) {
          log(`  Location: ${firstHotel.Address || "N/A"}`, "info");
        }

        // Check for rates and cancellation info
        const hasRates = !!firstHotel.Price;
        const hasCancellation =
          !!firstHotel.IsCancellable || !!firstHotel.CancellationPolicy;

        console.log("");
        log(`Data Validation:`, "info");
        log(`  Has Rates: ${hasRates ? "✓ Yes" : "✗ No"}`, hasRates ? "success" : "warning");
        log(
          `  Has Cancellation Info: ${hasCancellation ? "✓ Yes" : "✗ No"}`,
          hasCancellation ? "success" : "warning"
        );

        // Log first hotel complete JSON (truncated)
        console.log("");
        log(`Full First Hotel Data (truncated):`, "info");
        const hotelStr = JSON.stringify(firstHotel, null, 2);
        console.log(
          `  ${hotelStr.substring(0, 800).split("\n").join("\n  ")}${
            hotelStr.length > 800 ? "\n  ..." : ""
          }`
        );
      } else {
        log(`✓ Search successful, but no hotels returned`, "warning");
        log(`  This may indicate TBO has no inventory for these dates/city`, "warning");
      }

      console.log("");
      log(`Full Response (First 500 chars):`, "info");
      const responseStr = JSON.stringify(searchData, null, 2);
      console.log(
        `  ${responseStr.substring(0, 500).split("\n").join("\n  ")}${
          responseStr.length > 500 ? "\n  ..." : ""
        }`
      );
    } else {
      const errorMsg =
        searchData?.Error?.ErrorMessage ||
        searchData?.Error?.Message ||
        searchData?.StatusMessage ||
        JSON.stringify(searchData);

      log(`✗ Hotel search failed`, "error");
      log(`  TBO Status: ${searchData?.Status}`, "error");
      log(`  Error: ${errorMsg}`, "error");

      console.log("");
      log(`Full Response:`, "error");
      console.log(
        `  ${JSON.stringify(searchData, null, 2).split("\n").join("\n  ")}`
      );
      process.exit(1);
    }
  } catch (error) {
    const searchTime = Date.now() - searchStartTime;
    log(`✗ Hotel search failed! (${searchTime}ms)`, "error");
    log(`Error: ${error.message}`, "error");

    if (error.response?.status) {
      log(`HTTP Status: ${error.response.status}`, "error");
    }

    if (error.response?.data) {
      log(`Full Response:`, "error");
      console.log(
        `  ${JSON.stringify(error.response.data, null, 2).split("\n").join("\n  ")}`
      );
    }

    process.exit(1);
  }

  console.log("");
  logDivider();
  log(
    `✓ TBO CONNECTIVITY TEST PASSED - All systems operational!`,
    "success"
  );
  logDivider();
  console.log("");
  log(
    `You can now proceed with implementing the STEP 2 canonical endpoints:`,
    "info"
  );
  log(
    `  - POST /api/hotels/search`,
    "info"
  );
  log(
    `  - GET /api/hotels/:propertyId`,
    "info"
  );
  log(
    `  - POST /api/hotels/:propertyId/rates`,
    "info"
  );
  log(
    `  - GET /api/hotels/autocomplete`,
    "info"
  );
  console.log("");
  log(
    `Store results in room_offer / room_offer_unified with 15-minute TTL.`,
    "info"
  );
  console.log("");
  process.exit(0);
}

// Run tests
runTests().catch((error) => {
  log(`Unexpected error: ${error.message}`, "error");
  console.error(error);
  process.exit(1);
});
