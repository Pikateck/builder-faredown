#!/usr/bin/env node
/**
 * Test RateHawk integration in production API
 * This script verifies that RateHawk is returning data alongside Hotelbeds
 */

const https = require("https");

const API_BASE = "https://builder-faredown-pricing.onrender.com/api";
const ADMIN_KEY =
  "8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1";

async function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("error", reject);
  });
}

async function main() {
  console.log("🧪 Testing RateHawk Integration in Production\n");
  console.log("=".repeat(60));

  try {
    // Test 1: Check adapter health
    console.log("\n1️⃣  Checking Adapter Health Status...");
    const healthUrl = `${API_BASE}/health-check`;
    try {
      const health = await fetchJSON(healthUrl);
      console.log("✅ Health check endpoint accessible");
      if (health.data?.adapters) {
        console.log(
          "Available adapters:",
          Object.keys(health.data.adapters).join(", "),
        );
        Object.entries(health.data.adapters || {}).forEach(([name, status]) => {
          console.log(
            `   - ${name}: ${status.healthy ? "✅ Healthy" : "❌ Unhealthy"}`,
          );
        });
      }
    } catch (e) {
      console.log(
        "⚠️  Health check not available (expected on some endpoints)",
      );
    }

    // Test 2: Test Hotel Search with DXB
    console.log("\n2️⃣  Testing Hotel Search (DXB, Jan 12-15, 2026)...");
    const searchUrl = `${API_BASE}/hotels/search?destination=DXB&checkIn=2026-01-12&checkOut=2026-01-15`;
    const searchResult = await fetchJSON(searchUrl);

    if (searchResult.success) {
      const hotels = searchResult.data || [];
      console.log(`✅ Search returned ${hotels.length} hotels`);

      // Analyze suppliers
      const supplierCounts = {};
      hotels.forEach((hotel) => {
        const supplier = (hotel.supplier || "unknown").toUpperCase();
        supplierCounts[supplier] = (supplierCounts[supplier] || 0) + 1;
      });

      console.log("\n📊 Supplier Breakdown:");
      Object.entries(supplierCounts).forEach(([supplier, count]) => {
        const percentage = ((count / hotels.length) * 100).toFixed(1);
        console.log(`   - ${supplier}: ${count} hotels (${percentage}%)`);
      });

      // Check for RateHawk data
      if (supplierCounts.RATEHAWK) {
        console.log("\n✅ SUCCESS: RateHawk data is being returned!");
        console.log(`   Expected to see: HOTELBEDS + RATEHAWK`);
        console.log(
          `   Actually got: ${Object.keys(supplierCounts).join(" + ")}`,
        );
      } else {
        console.log("\n❌ PROBLEM: RateHawk data NOT found in results");
        console.log(
          `   Only getting: ${Object.keys(supplierCounts).join(", ")}`,
        );
        console.log("\n   Possible causes:");
        console.log(
          "   1. RateHawk not enabled in suppliers table (is_enabled = FALSE)",
        );
        console.log(
          "   2. RateHawk adapter not initialized (missing env vars)",
        );
        console.log(
          "   3. RateHawk adapter encountered an error during search",
        );
      }

      // Show sample hotel
      if (hotels.length > 0) {
        console.log("\n📄 Sample Hotel Entry:");
        const sample = hotels[0];
        console.log(`   Name: ${sample.name}`);
        console.log(`   Supplier: ${sample.supplier}`);
        console.log(`   Price: ${sample.lowestPrice} ${sample.currency}`);
      }
    } else {
      console.log("❌ Search failed:", searchResult.error || "Unknown error");
    }

    // Test 3: Check adapter metrics
    console.log("\n3️⃣  Checking Adapter Metrics...");
    const metricsUrl = `${API_BASE}/admin-suppliers/metrics`;
    try {
      const metrics = await fetchJSON(metricsUrl, {
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      if (metrics.success && metrics.data?.adapters) {
        console.log("✅ Adapter Metrics:");
        Object.entries(metrics.data.adapters).forEach(([name, data]) => {
          console.log(`   ${name}:`);
          console.log(`     - Success Count: ${data.success_count || 0}`);
          console.log(`     - Error Count: ${data.error_count || 0}`);
          console.log(`     - Avg Response: ${data.avg_response_ms || 0}ms`);
        });
      }
    } catch (e) {
      console.log("⚠️  Metrics endpoint not accessible (admin only)");
    }

    // Test 4: Check suppliers in database
    console.log("\n4️⃣  Checking Suppliers Configuration...");
    const suppliersUrl = `${API_BASE}/admin-suppliers`;
    try {
      const suppliers = await fetchJSON(suppliersUrl, {
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      if (suppliers.success && suppliers.data) {
        console.log("✅ Suppliers in Database:");
        suppliers.data.forEach((s) => {
          const status = s.is_enabled ? "✅" : "❌";
          console.log(`   ${status} ${s.code}: ${s.name} (${s.product_type})`);
        });
      }
    } catch (e) {
      console.log("⚠️  Suppliers endpoint not accessible (admin only)");
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Test complete!\n");
  } catch (error) {
    console.error("\n❌ Error during testing:", error.message);
    process.exit(1);
  }
}

main();
