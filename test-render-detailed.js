#!/usr/bin/env node

const axios = require("axios");

const RENDER_URL = "https://builder-faredown-pricing.onrender.com/api";

async function testHotelSearch() {
  console.log("📍 Detailed Hotel Search Test\n");

  try {
    const client = axios.create({
      validateStatus: () => true,
      responseType: "text",
      transformResponse: [(data) => data],
    });

    const response = await client.post(
      `${RENDER_URL}/hotels/search`,
      {
        cityId: "DXB",
        destination: "Dubai",
        checkIn: "2025-12-21",
        checkOut: "2025-12-22",
        rooms: "1",
        adults: "2",
        children: "0",
        currency: "INR",
      },
      { timeout: 30000 },
    );

    console.log("Raw Response:");
    console.log(`  Status: ${response.status}`);
    console.log(`  Status Text: ${response.statusText}`);
    console.log(`  Content-Type: ${response.headers["content-type"]}`);
    console.log(`  Body Length: ${response.data.length}`);
    console.log(`  First 500 chars:\n${response.data.substring(0, 500)}`);
    console.log(`\n  Last 500 chars:\n${response.data.substring(Math.max(0, response.data.length - 500))}`);

    // Try to parse it
    try {
      const parsed = JSON.parse(response.data);
      console.log("\n✅ Response is valid JSON");
      console.log(`  Keys: ${Object.keys(parsed).join(", ")}`);
      console.log(`  Error: ${parsed.error}`);
      console.log(`  Source: ${parsed.source}`);
    } catch (parseErr) {
      console.log(
        `\n❌ Response is NOT valid JSON: ${parseErr.message}`,
      );
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

testHotelSearch();
