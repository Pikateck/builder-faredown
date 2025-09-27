/**
 * Test script to verify all admin endpoints are working properly
 */

const http = require("http");

const BASE_URL = "http://localhost:3001";

const endpoints = [
  {
    name: "Promo Codes",
    path: "/api/promo",
    method: "GET",
  },
  {
    name: "Promo Stats",
    path: "/api/promo/stats",
    method: "GET",
  },
  {
    name: "Extranet Inventory",
    path: "/api/admin/extranet/inventory",
    method: "GET",
  },
  {
    name: "Extranet Stats",
    path: "/api/admin/extranet/stats",
    method: "GET",
  },
  {
    name: "Package Markup Rules",
    path: "/api/admin/markup/packages",
    method: "GET",
  },
  {
    name: "Package Markup Stats",
    path: "/api/admin/markup/packages/stats",
    method: "GET",
  },
  {
    name: "Pricing Engine - Calculate",
    path: "/api/pricing/calculate",
    method: "POST",
    data: {
      module: "flights",
      basePrice: 25000,
      item: { category: "economy" },
      booking: { travelDate: "2024-06-15" },
    },
  },
  {
    name: "Pricing Engine - Validate Promo",
    path: "/api/pricing/validate-promo",
    method: "POST",
    data: {
      promoCode: "WELCOME10",
      module: "flights",
      basePrice: 25000,
    },
  },
];

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.path, BASE_URL);
    const options = {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Admin-Test-Script",
      },
    };

    if (endpoint.method === "GET") {
      // Add admin token simulation for protected routes
      if (endpoint.path.includes("/admin/")) {
        options.headers["Authorization"] = "Bearer test-admin-token";
      }
    }

    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: response,
            endpoint: endpoint.name,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            endpoint: endpoint.name,
            error: "Invalid JSON response",
          });
        }
      });
    });

    req.on("error", (error) => {
      reject({
        endpoint: endpoint.name,
        error: error.message,
      });
    });

    if (endpoint.data) {
      req.write(JSON.stringify(endpoint.data));
    }

    req.end();
  });
}

async function testAllEndpoints() {
  console.log("🧪 Testing all admin endpoints...\n");

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.name}`);
      const result = await makeRequest(endpoint);

      if (result.status >= 200 && result.status < 300) {
        console.log(`✅ ${endpoint.name}: ${result.status}`);
        if (result.data.success) {
          const dataSize = result.data.data
            ? Array.isArray(result.data.data)
              ? result.data.data.length
              : result.data.data.promoCodes?.length ||
                result.data.data.items?.length ||
                Object.keys(result.data.data).length
            : 0;
          console.log(`   📊 Data: ${dataSize} records`);
        }
      } else {
        console.log(`⚠️  ${endpoint.name}: ${result.status}`);
        if (result.data.message) {
          console.log(`   📝 Message: ${result.data.message}`);
        }
      }

      results.push({
        endpoint: endpoint.name,
        status: result.status,
        success: result.status >= 200 && result.status < 300,
        hasData: result.data.success && result.data.data,
      });
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.error}`);
      results.push({
        endpoint: endpoint.name,
        status: "ERROR",
        success: false,
        error: error.error,
      });
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n📊 Test Summary:");
  console.log("==================");

  const successful = results.filter((r) => r.success).length;
  const total = results.length;

  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);

  if (successful === total) {
    console.log("\n🎉 All endpoints are working correctly!");
  } else {
    console.log("\n⚠️  Some endpoints need attention:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.endpoint}: ${r.error || r.status}`);
      });
  }

  console.log("\n📋 Functional modules:");
  results
    .filter((r) => r.success && r.hasData)
    .forEach((r) => {
      console.log(`   ✓ ${r.endpoint}`);
    });
}

// Run tests if called directly
if (require.main === module) {
  testAllEndpoints().catch(console.error);
}

module.exports = { testAllEndpoints };
