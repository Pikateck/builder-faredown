#!/usr/bin/env node

const axios = require("axios");

const RENDER_URL = "https://builder-faredown-pricing.onrender.com/api";

async function testTBO() {
  console.log("🧪 Testing TBO Integration\n");

  try {
    // Test 1: Try a mock endpoint or health check
    console.log("1️⃣ Testing Health Check...");
    try {
      const healthResponse = await axios.get(
        `${RENDER_URL}/health`,
        { timeout: 5000 },
      );
      console.log(`✅ Health: ${healthResponse.status}`);
    } catch (error) {
      console.log(`⚠️ Health check not available`);
    }

    // Test 2: Try to get destinations
    console.log("\n2️⃣ Testing Destinations...");
    try {
      const destResponse = await axios.get(
        `${RENDER_URL}/destinations?search=Dubai&limit=5`,
        { timeout: 10000 },
      );
      console.log(`✅ Destinations: ${destResponse.status}`);
      console.log(`   Count: ${destResponse.data.length || 0}`);
    } catch (error) {
      console.log(`❌ Destinations failed: ${error.response?.status || error.message}`);
    }

    // Test 3: Try admin-TBO routes
    console.log("\n3️⃣ Testing TBO Admin Routes...");
    try {
      const adminTboResponse = await axios.get(
        `${RENDER_URL}/admin/tbo/status`,
        {
          timeout: 10000,
          headers: {
            Authorization: "Bearer test-token",
          },
        },
      );
      console.log(`✅ TBO Status: ${adminTboResponse.status}`);
      console.log(`   Data: ${JSON.stringify(adminTboResponse.data, null, 2)}`);
    } catch (error) {
      console.log(`⚠️ TBO Status: ${error.response?.status || error.message}`);
    }

    // Test 4: Try with mock data enabled
    console.log("\n4️⃣ Testing Hotel Search with Mock Fallback...");
    try {
      const mockResponse = await axios.post(
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
          useMockFallback: true,
        },
        { timeout: 30000 },
      );
      console.log(`✅ Hotel Search: ${mockResponse.status}`);
      console.log(`   Source: ${mockResponse.data.source}`);
      console.log(`   Hotels: ${mockResponse.data.hotels?.length || 0}`);
    } catch (error) {
      console.log(`❌ Hotel Search failed: ${error.response?.status || error.message}`);
      if (error.response?.data?.error) {
        console.log(`   Error: ${error.response.data.error}`);
      }
    }
  } catch (error) {
    console.error("Test error:", error.message);
  }
}

testTBO();
