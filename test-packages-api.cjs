/**
 * Test Packages API Endpoints
 * Test various search scenarios to ensure packages are returned correctly
 */

const https = require("https");

const API_BASE =
  "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api";

async function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname:
        "55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
      path: endpoint,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            error: "JSON parse error",
          });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => reject(new Error("Request timeout")));
    req.end();
  });
}

async function testPackagesAPI() {
  console.log("🧪 Testing Packages API Endpoints...\n");

  const tests = [
    {
      name: "List all packages",
      endpoint: "/api/packages",
      expectation: "Should return all 44 packages",
    },
    {
      name: "Search Dubai packages",
      endpoint: "/api/packages?destination=Dubai&destination_type=city",
      expectation: "Should return Dubai packages",
    },
    {
      name: "Search by country - Japan",
      endpoint: "/api/packages?destination=Japan&destination_type=country",
      expectation: "Should return Japan packages",
    },
    {
      name: "Search luxury packages",
      endpoint: "/api/packages?category=luxury",
      expectation: "Should return luxury category packages",
    },
    {
      name: "Search by price range",
      endpoint: "/api/packages?price_min=200000&price_max=300000",
      expectation: "Should return packages in ₹2-3 lakh range",
    },
    {
      name: "Search featured packages",
      endpoint: "/api/packages?featured=true",
      expectation: "Should return only featured packages",
    },
    {
      name: 'Text search - "cultural"',
      endpoint: "/api/packages?q=cultural",
      expectation:
        'Should return packages with "cultural" in title/description',
    },
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`📡 Endpoint: ${test.endpoint}`);

      const result = await makeRequest(test.endpoint);

      if (result.status === 200) {
        if (result.data.success && result.data.data) {
          const packages = Array.isArray(result.data.data)
            ? result.data.data
            : result.data.data.packages || [];
          console.log(`✅ Success: Found ${packages.length} packages`);

          // Show sample results
          if (packages.length > 0) {
            console.log("📋 Sample results:");
            packages.slice(0, 3).forEach((pkg, index) => {
              console.log(
                `   ${index + 1}. ${pkg.title} - ₹${pkg.base_price_pp?.toLocaleString() || "N/A"} (${pkg.package_category || "N/A"})`,
              );
            });
          }
        } else {
          console.log(`⚠️  API response format unexpected:`, result.data);
        }
      } else {
        console.log(`❌ Failed with status ${result.status}`);
        console.log("Response:", result.data);
      }

      console.log(`💭 Expected: ${test.expectation}\n`);
    } catch (error) {
      console.log(`❌ Error testing ${test.name}:`, error.message);
      console.log("");
    }
  }

  // Test specific package details
  console.log("🔍 Testing individual package details...");
  try {
    const detailsResult = await makeRequest(
      "/api/packages/dubai-luxury-experience",
    );
    if (detailsResult.status === 200) {
      console.log("✅ Package details endpoint working");
      if (detailsResult.data.data) {
        const pkg = detailsResult.data.data;
        console.log(`📋 Package: ${pkg.title}`);
        console.log(`💰 Price: ₹${pkg.base_price_pp?.toLocaleString()}`);
        console.log(`📍 Country: ${pkg.country_name || "N/A"}`);
        console.log(`⭐ Rating: ${pkg.rating || "N/A"}`);
      }
    } else {
      console.log(
        `❌ Package details failed with status ${detailsResult.status}`,
      );
    }
  } catch (error) {
    console.log(`❌ Error testing package details:`, error.message);
  }

  console.log("\n🎯 API Testing Complete!");
}

testPackagesAPI().catch(console.error);
