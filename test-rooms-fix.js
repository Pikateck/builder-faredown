#!/usr/bin/env node
/**
 * Test Script: Rooms Normalization Fix
 *
 * This script tests that POST /api/hotels/search properly handles
 * rooms parameter as both string and array without crashing.
 */

const https = require("https");

const BASE_URL = "https://builder-faredown-pricing.onrender.com";

function makeRequest(testName, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: "builder-faredown-pricing.onrender.com",
      port: 443,
      path: "/api/hotels/search",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    console.log(`\n🧪 Running: ${testName}`);
    console.log(`📤 Request payload:`, JSON.stringify(payload, null, 2));

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log(`📥 Response status: ${res.statusCode}`);

        if (res.statusCode === 200) {
          console.log(`✅ ${testName} PASSED`);
          try {
            const parsed = JSON.parse(responseData);
            console.log(`   Hotels returned: ${parsed.hotels?.length || 0}`);
            console.log(`   Source: ${parsed.source || "N/A"}`);
          } catch (e) {
            console.log(`   Response length: ${responseData.length} bytes`);
          }
          resolve({ success: true, status: res.statusCode });
        } else if (res.statusCode === 500 || res.statusCode === 502) {
          console.log(`❌ ${testName} FAILED - Server Error`);
          console.log(`   Response: ${responseData.substring(0, 200)}`);
          resolve({
            success: false,
            status: res.statusCode,
            error: "Server error",
          });
        } else {
          console.log(`⚠️  ${testName} - Unexpected status: ${res.statusCode}`);
          console.log(`   Response: ${responseData.substring(0, 200)}`);
          resolve({ success: false, status: res.statusCode });
        }
      });
    });

    req.on("error", (error) => {
      console.log(`❌ ${testName} FAILED - Network Error`);
      console.error(`   Error: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Rooms Normalization Fix - Test Suite");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`Target: ${BASE_URL}/api/hotels/search\n`);

  const tests = [
    {
      name: "Test 1: Rooms as String (was crashing)",
      payload: {
        cityId: "DXB",
        destination: "Dubai, United Arab Emirates",
        cityName: "Dubai, United Arab Emirates",
        countryCode: "AE",
        checkIn: "2025-11-30",
        checkOut: "2025-12-04",
        rooms: "1", // 👈 String (the problem case)
        adults: "1",
        children: "0",
        currency: "INR",
      },
    },
    {
      name: "Test 2: Rooms as Array (already worked)",
      payload: {
        cityId: "DXB",
        destination: "Dubai, United Arab Emirates",
        cityName: "Dubai, United Arab Emirates",
        countryCode: "AE",
        checkIn: "2025-11-30",
        checkOut: "2025-12-04",
        rooms: [{ adults: 2, children: 1, childAges: [5] }], // 👈 Array
        currency: "INR",
      },
    },
    {
      name: "Test 3: Multiple Rooms as String",
      payload: {
        cityId: "DXB",
        destination: "Dubai, United Arab Emirates",
        cityName: "Dubai, United Arab Emirates",
        countryCode: "AE",
        checkIn: "2025-11-30",
        checkOut: "2025-12-04",
        rooms: "2", // 👈 String with multiple rooms
        adults: "3",
        children: "1",
        currency: "INR",
      },
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await makeRequest(test.name, test.payload);
      results.push({ name: test.name, ...result });
      // Wait 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ name: test.name, success: false, error: error.message });
    }
  }

  console.log("\n═════════════════════════════════════════════════���═════");
  console.log("  Test Summary");
  console.log("═══════════════════════════════════════════════════════\n");

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  results.forEach((r) => {
    const status = r.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${r.name}`);
    if (!r.success) {
      console.log(
        `         Status: ${r.status}, Error: ${r.error || "Unknown"}`,
      );
    }
  });

  console.log(
    `\n📊 Results: ${passed} passed, ${failed} failed out of ${results.length} tests\n`,
  );

  if (failed === 0) {
    console.log(
      "🎉 All tests passed! The rooms normalization fix is working.\n",
    );
    process.exit(0);
  } else {
    console.log("⚠️  Some tests failed. Check Render logs for details.\n");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
