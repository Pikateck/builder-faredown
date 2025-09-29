/**
 * Test API directly with exact frontend parameters
 */

const https = require("https");
const querystring = require("querystring");

// Test both the internal API (port 3001) and the proxied API (port 8080)
async function testAPI(port, description) {
  return new Promise((resolve) => {
    const params = querystring.stringify({
      destination: "London, United Kingdom",
      destination_type: "city",
      departure_date: "2025-10-01",
      return_date: "2025-10-05",
    });

    const options = {
      hostname:
        "55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
      path: `/api/packages?${params}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    console.log(`\n🧪 Testing ${description}`);
    console.log(`📡 URL: https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.success && jsonData.data && jsonData.data.packages) {
            console.log(`✅ Found ${jsonData.data.packages.length} packages`);
            jsonData.data.packages.slice(0, 3).forEach((pkg) => {
              console.log(
                `   - ${pkg.title} (${pkg.country_name || "Unknown"}) - ₹${pkg.base_price_pp?.toLocaleString()}`,
              );
            });
          } else {
            console.log(`❌ No packages found or unexpected response format`);
            console.log(
              "Response:",
              JSON.stringify(jsonData, null, 2).substring(0, 500),
            );
          }
        } catch (e) {
          console.log(`❌ JSON parse error: ${e.message}`);
          console.log("Raw response:", data.substring(0, 200));
        }
        resolve();
      });
    });

    req.on("error", (error) => {
      console.log(`❌ Request error: ${error.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log(`❌ Request timeout`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log("🔍 Testing London search API calls...");

  await testAPI(8080, "Production API (through proxy)");

  console.log("\n🎯 Test complete!");
}

runTests().catch(console.error);
