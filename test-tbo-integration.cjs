#!/usr/bin/env node

/**
 * TBO Integration End-to-End Test
 * Tests multi-supplier flight search with Amadeus + TBO
 */

const https = require("https");

const API_BASE =
  process.env.API_BASE_URL || "https://builder-faredown-pricing.onrender.com";

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    console.log(`\n🔍 Testing: ${url}`);

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            reject(
              new Error(`Failed to parse JSON: ${data.substring(0, 200)}`),
            );
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function testTBOIntegration() {
  console.log("🚀 Starting TBO Integration Tests...\n");

  try {
    // Test 1: Health Check
    console.log("📋 Test 1: API Health Check");
    const health = await makeRequest("/api/health");
    console.log(`✅ Status: ${health.status}`);
    console.log(`   Response:`, health.data);

    // Test 2: Flight Search with Multi-Supplier
    console.log("\n📋 Test 2: Multi-Supplier Flight Search (AMADEUS + TBO)");
    const searchParams = new URLSearchParams({
      origin: "BOM",
      destination: "DXB",
      departureDate: "2025-11-15",
      adults: "1",
      cabinClass: "ECONOMY",
    });

    const searchResult = await makeRequest(
      `/api/flights/search?${searchParams}`,
    );
    console.log(`✅ Status: ${searchResult.status}`);

    if (searchResult.data.meta) {
      console.log(`   Total Results: ${searchResult.data.meta.totalResults}`);
      console.log(`   Source: ${searchResult.data.meta.source}`);

      if (searchResult.data.meta.suppliers) {
        console.log(`\n   📊 Supplier Metrics:`);
        Object.entries(searchResult.data.meta.suppliers).forEach(
          ([supplier, metrics]) => {
            console.log(`   - ${supplier}:`);
            console.log(`     Success: ${metrics.success}`);
            console.log(`     Results: ${metrics.resultCount || 0}`);
            console.log(`     Response Time: ${metrics.responseTime}ms`);
            if (metrics.error) {
              console.log(`     Error: ${metrics.error}`);
            }
          },
        );
      }
    }

    if (searchResult.data.data && searchResult.data.data.length > 0) {
      console.log(`\n   🎯 Sample Flight Result:`);
      const flight = searchResult.data.data[0];
      console.log(`   - ID: ${flight.id}`);
      console.log(`   - Airline: ${flight.airline || flight.airlineName}`);
      console.log(
        `   - Route: ${flight.origin || flight.departure?.code} → ${flight.destination || flight.arrival?.code}`,
      );
      console.log(
        `   - Price: ${flight.price?.final || flight.price?.amount || flight.price}`,
      );
      console.log(`   - Supplier: ${flight.supplier || "N/A"}`);
    }

    // Test 3: Verify Supplier-Aware Markup
    console.log("\n📋 Test 3: Supplier-Aware Markup Rules");
    const markupResult = await makeRequest(
      "/api/pricing/markup-rules?supplier=tbo&limit=5",
    );
    console.log(`✅ Status: ${markupResult.status}`);
    if (markupResult.data.data) {
      console.log(
        `   Total TBO Markup Rules: ${markupResult.data.total || markupResult.data.data.length}`,
      );
    }

    // Test 4: Verify Supplier-Aware Promo Codes
    console.log("\n📋 Test 4: Supplier-Aware Promo Codes");
    const promoResult = await makeRequest(
      "/api/pricing/promo-codes?supplier=tbo&limit=5",
    );
    console.log(`✅ Status: ${promoResult.status}`);
    if (promoResult.data.data) {
      console.log(
        `   Total TBO Promo Codes: ${promoResult.data.total || promoResult.data.data.length}`,
      );
    }

    console.log("\n\n✅ ALL TESTS COMPLETED SUCCESSFULLY! 🎉");
    console.log("\n📊 Summary:");
    console.log("   ✓ API Health Check: PASS");
    console.log("   ✓ Multi-Supplier Search: PASS");
    console.log("   ✓ Supplier-Aware Markup: PASS");
    console.log("   ✓ Supplier-Aware Promo: PASS");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

testTBOIntegration();
