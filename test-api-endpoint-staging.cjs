const https = require("https");
const http = require("http");

async function testApiEndpoint() {
  console.log("🧪 STAGING API ENDPOINT TEST");
  console.log("============================");

  const baseUrl =
    "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev";

  // Test the exact API call the frontend should be making
  const testCases = [
    {
      name: "Dubai packages with dates (destination + destination_type)",
      url: `${baseUrl}/api/packages?destination=Dubai%2C+United+Arab+Emirates&destination_type=city&departure_date=2025-10-01&return_date=2025-10-10&category=any&adults=2&module=packages`,
    },
    {
      name: "Dubai packages by-destination endpoint",
      url: `${baseUrl}/api/packages/by-destination?destination=Dubai&destination_type=city&departure_date=2025-10-01&return_date=2025-10-10&limit=20`,
    },
    {
      name: "All packages (no filters) - should show multiple cities",
      url: `${baseUrl}/api/packages?category=any&limit=10`,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`URL: ${testCase.url}`);
    console.log("-------------------------------------------");

    try {
      const response = await makeHttpRequest(testCase.url);
      const data = JSON.parse(response);

      if (data.success && data.data && data.data.packages) {
        const packages = data.data.packages;
        console.log(
          `✅ Response successful: ${packages.length} packages found`,
        );

        packages.forEach((pkg, index) => {
          console.log(
            `${index + 1}. ${pkg.title} (${pkg.package_category || "Unknown"})`,
          );
          console.log(
            `   📍 ${pkg.city_name || "Unknown"}, ${pkg.country_name || "Unknown"}`,
          );
          console.log(
            `   💰 ₹${pkg.base_price_pp?.toLocaleString() || pkg.from_price?.toLocaleString() || "N/A"}`,
          );
        });

        // Check if all packages are Dubai packages for Dubai searches
        if (testCase.name.includes("Dubai")) {
          const nonDubaiPackages = packages.filter(
            (pkg) => pkg.city_name && pkg.city_name.toLowerCase() !== "dubai",
          );

          if (nonDubaiPackages.length > 0) {
            console.log(
              `\n❌ FILTERING ISSUE: Found ${nonDubaiPackages.length} non-Dubai packages:`,
            );
            nonDubaiPackages.forEach((pkg) => {
              console.log(
                `   ❌ ${pkg.title} - ${pkg.city_name}, ${pkg.country_name}`,
              );
            });
          } else {
            console.log("\n✅ FILTERING CORRECT: All packages are from Dubai");
          }
        }
      } else {
        console.log("❌ API Error:", data.error || "Unknown error");
        console.log("Response:", JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }

  console.log("\n🏁 API TEST SUMMARY");
  console.log("==================");
  console.log(
    "If Dubai tests show non-Dubai packages, the issue is in the API filtering logic.",
  );
  console.log(
    "If all tests fail, the issue might be with the API server or URL configuration.",
  );
}

function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const client = isHttps ? https : http;

    const request = client.get(url, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(data);
        } else {
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`),
          );
        }
      });
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

testApiEndpoint();
