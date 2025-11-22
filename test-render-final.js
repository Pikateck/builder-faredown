#!/usr/bin/env node

const axios = require("axios");

const RENDER_URL = "https://builder-faredown-pricing.onrender.com/api";

async function testEndpoints() {
  console.log("🧪 Testing Render Endpoints\n");

  try {
    // Test 1: Hotel Search
    console.log("📍 Test 1: Hotel Search Endpoint");
    const hotelResponse = await axios.post(
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

    console.log("✅ Hotel Search Success");
    console.log(`   Status: ${hotelResponse.data.success}`);
    console.log(`   Hotels Count: ${hotelResponse.data.totalResults}`);
    console.log(`   Source: ${hotelResponse.data.source}`);
    console.log(`   Duration: ${hotelResponse.data.duration}`);
    console.log(
      `   Sample Hotel: ${hotelResponse.data.hotels[0]?.name || "N/A"}`,
    );
    console.log();
  } catch (error) {
    console.error("❌ Hotel Search Failed:");
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.message}`);
    console.error(
      `   Data: ${JSON.stringify(error.response?.data, null, 2)}`,
    );
    console.log();
  }

  try {
    // Test 2: Currency Rates
    console.log("💱 Test 2: Currency Rates Endpoint");
    const currencyResponse = await axios.get(`${RENDER_URL}/currency/rates`, {
      timeout: 10000,
    });

    console.log("✅ Currency Rates Success");
    console.log(`   Success: ${currencyResponse.data.success}`);
    console.log(
      `   Currencies: ${Object.keys(currencyResponse.data.rates).join(", ")}`,
    );
    console.log(
      `   INR Rate: ${currencyResponse.data.rates.INR?.exchangeRate}`,
    );
    console.log(`   USD Rate: ${currencyResponse.data.rates.USD?.exchangeRate}`);
    console.log();
  } catch (error) {
    console.error("❌ Currency Rates Failed:");
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.message}`);
    console.error(
      `   Data: ${JSON.stringify(error.response?.data, null, 2)}`,
    );
    console.log();
  }

  try {
    // Test 3: Active Currencies
    console.log("💱 Test 3: Active Currencies Endpoint");
    const activeCurrencyResponse = await axios.get(
      `${RENDER_URL}/currency/active`,
      { timeout: 10000 },
    );

    console.log("✅ Active Currencies Success");
    console.log(
      `   Count: ${activeCurrencyResponse.data.length}`,
    );
    activeCurrencyResponse.data.forEach((curr) => {
      console.log(
        `   - ${curr.code}: ${curr.name} (${curr.symbol}) @ ${curr.exchangeRate}`,
      );
    });
    console.log();
  } catch (error) {
    console.error("❌ Active Currencies Failed:");
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.message}`);
    console.log();
  }

  console.log("✅ All tests completed!");
}

testEndpoints();
