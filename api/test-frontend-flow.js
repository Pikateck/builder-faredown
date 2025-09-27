const http = require("http");

async function testFrontendFlow() {
  console.log("🔍 Testing complete frontend-to-backend flow...\n");

  // Test 1: Direct API call with Dubai filter
  console.log("1️⃣ Testing direct API call with Dubai filter:");
  await testApiCall(
    "/api/packages?destination=Dubai%2C+United+Arab+Emirates&destination_type=city&page=1&page_size=20",
  );

  // Test 2: API call without any filters
  console.log(
    "\n2️⃣ Testing API call without filters (should show all packages):",
  );
  await testApiCall("/api/packages?page=1&page_size=20");

  // Test 3: API call with different destination
  console.log("\n3️⃣ Testing API call with Europe filter:");
  await testApiCall(
    "/api/packages?destination=Europe&destination_type=region&page=1&page_size=20",
  );

  // Test 4: Test the exact parameters that PackagesSearchForm sends
  console.log("\n4️⃣ Testing exact parameters from PackagesSearchForm:");
  const searchFormParams = new URLSearchParams({
    destination: "Dubai, United Arab Emirates",
    destination_code: "DXB", // This might be sent by the form
    destination_type: "city",
    category: "any",
    adults: "2",
    children: "0",
    module: "packages",
    page: "1",
    page_size: "20",
  });
  await testApiCall(`/api/packages?${searchFormParams.toString()}`);

  console.log("\n✅ Test completed!");
}

async function testApiCall(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 8080,
      path: path,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    console.log(`📡 Request: ${path}`);

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);

          if (response.data && response.data.packages) {
            console.log(`📦 Packages found: ${response.data.packages.length}`);
            response.data.packages.forEach((pkg, index) => {
              console.log(`   ${index + 1}. ${pkg.title} (${pkg.category})`);
            });
            console.log(
              `📊 Total: ${response.data.pagination?.total || "unknown"}`,
            );
          } else {
            console.log(`❌ No packages data found`);
            console.log(`Response: ${JSON.stringify(response, null, 2)}`);
          }
          resolve(response);
        } catch (error) {
          console.error(`❌ JSON Parse Error: ${error.message}`);
          console.log(`Raw response: ${data}`);
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      console.error(`❌ Request Error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

testFrontendFlow().catch(console.error);
