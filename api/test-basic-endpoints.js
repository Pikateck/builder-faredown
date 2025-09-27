const http = require("http");

// Test basic endpoints to verify server is responding
async function testBasicEndpoints() {
  console.log("🔍 Testing basic endpoints to verify server...\n");

  // Test 1: Root endpoint (should work without auth)
  console.log("1️⃣ Testing GET / (root)");
  await testBasicCall("/");

  // Test 2: Health check (should work without auth)
  console.log("\n2️⃣ Testing GET /api/health");
  await testBasicCall("/api/health");

  // Test 3: Test a route that requires auth to see the error type
  console.log("\n3️⃣ Testing GET /api/admin/dashboard (should fail with 401)");
  await testBasicCall("/api/admin/dashboard");

  console.log("\n✅ Basic endpoint tests completed!");
}

async function testBasicCall(path) {
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
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(
          `📝 Response: ${data.substring(0, 200)}${data.length > 200 ? "..." : ""}`,
        );
        resolve({ status: res.statusCode, data });
      });
    });

    req.on("error", (error) => {
      console.error(`❌ Request Error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

testBasicEndpoints().catch(console.error);
