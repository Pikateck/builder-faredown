#!/usr/bin/env node
/**
 * Test TBO Debug Hotel Search Route
 * Tests the spec-perfect GetHotelResult payload on the correct TekTravels JSON endpoint
 *
 * Usage:
 *   node test-tbo-debug-hotel-search.js
 */

const axios = require("axios");

// Configure for local or remote API
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

async function testDebugHotelSearch() {
  console.log(
    "╔═══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║       TBO Debug Hotel Search - Spec Perfect Test             ║",
  );
  console.log(
    "╚═════════���═════════════════════════════════════════════════════╝",
  );
  console.log("");

  const endpoint = `${API_BASE_URL}/api/tbo/debug/hotel-search`;

  const payload = {
    checkIn: "15/12/2025",
    checkOut: "18/12/2025",
    countryCode: "AE",
    cityId: 130443,
    preferredCurrency: "INR",
    guestNationality: "IN",
    rooms: [
      {
        NoOfAdults: 2,
        NoOfChild: 0,
        ChildAge: null,
      },
    ],
  };

  console.log("📍 Endpoint:", endpoint);
  console.log("");
  console.log("📤 Request Payload:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("");
  console.log("⏳ Making request...");
  console.log("");

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });

    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                    AUTHENTICATION RESPONSE                     ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
    console.log("");

    if (response.data.auth) {
      const auth = response.data.auth;
      console.log("🔐 Auth Status:", auth.Status);
      console.log("📋 Member:", auth.Member?.MemberId);
      console.log("📋 Agency:", auth.Member?.AgencyId);
      console.log(
        "🔑 TokenId:",
        auth.TokenId ? `${auth.TokenId.substring(0, 30)}...` : "NOT RECEIVED",
      );
      console.log("");

      console.log("Full Auth Response:");
      console.log(JSON.stringify(auth, null, 2));
    }

    console.log("");
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                  GETHOTELRESULT REQUEST SENT                   ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
    console.log("");

    if (response.data.requestSent) {
      const req = response.data.requestSent;
      console.log("🏨 Search URL: TBO_HOTEL_SEARCH_URL from .env");
      console.log("📅 CheckInDate:", req.CheckInDate);
      console.log("🌙 NoOfNights:", req.NoOfNights);
      console.log("🌍 CountryCode:", req.CountryCode);
      console.log("🏙️  CityId:", req.CityId);
      console.log("💰 PreferredCurrency:", req.PreferredCurrency);
      console.log("👤 GuestNationality:", req.GuestNationality);
      console.log("🛏️  NoOfRooms:", req.NoOfRooms);
      console.log(
        "🔑 TokenId:",
        req.TokenId ? `${req.TokenId.substring(0, 30)}...` : "NOT SENT",
      );
      console.log("");

      console.log("Full Request Payload:");
      console.log(
        JSON.stringify(
          {
            ...req,
            TokenId: req.TokenId
              ? `${req.TokenId.substring(0, 30)}...`
              : req.TokenId,
          },
          null,
          2,
        ),
      );
    }

    console.log("");
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                  GETHOTELRESULT RESPONSE                       ║",
    );
    console.log(
      "╚════════════════════════════���══════════════════════════════════╝",
    );
    console.log("");

    if (response.data.response) {
      const searchResponse = response.data.response;

      console.log("📊 Response Status:", searchResponse.ResponseStatus);
      console.log("📊 Error:", searchResponse.Error || "None");
      console.log("📊 TraceId:", searchResponse.TraceId || "N/A");
      console.log("");

      if (searchResponse.HotelSearchResult) {
        const result = searchResponse.HotelSearchResult;
        console.log(
          "✅ HotelSearchResult.ResponseStatus:",
          result.ResponseStatus,
        );
        console.log("🏨 HotelResults Count:", result.HotelResults?.length || 0);
        console.log("");

        if (result.HotelResults && result.HotelResults.length > 0) {
          console.log("Sample Hotels:");
          result.HotelResults.slice(0, 3).forEach((hotel, i) => {
            console.log(`\n${i + 1}. ${hotel.HotelName}`);
            console.log(`   Code: ${hotel.HotelCode}`);
            console.log(`   Stars: ${hotel.StarRating}`);
            console.log(
              `   Price: ${hotel.Price?.PublishedPrice} ${hotel.Price?.CurrencyCode}`,
            );
          });
          console.log("");
        }
      }

      console.log("Full Response:");
      console.log(JSON.stringify(searchResponse, null, 2));
    }

    console.log("");
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

    const authWorked =
      response.data.auth?.Status === 1 ||
      response.data.auth?.Status?.Code === 1;
    const searchWorked =
      response.data.response?.HotelSearchResult?.ResponseStatus === 1;

    console.log("✅ Auth:", authWorked ? "SUCCESS" : "FAILED");
    console.log("✅ Search:", searchWorked ? "SUCCESS" : "FAILED");

    if (authWorked && searchWorked) {
      console.log("");
      console.log("🎉 TBO INTEGRATION WORKING! End-to-end flow successful!");
    } else {
      console.log("");
      console.log(
        "⚠️  Integration issue detected. Review logs above for details.",
      );
    }
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

    if (error.response) {
      console.error("");
      console.error("HTTP Status:", error.response.status);
      console.error("Response Data:");
      console.error(JSON.stringify(error.response.data, null, 2));
    }

    console.error("");
    process.exit(1);
  }
}

// Run the test
testDebugHotelSearch();
