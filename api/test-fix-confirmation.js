const http = require("http");

// Test that verifies the "API server offline" issue is fixed
async function testFixConfirmation() {
  console.log('✅ Testing Fix Confirmation - "API server offline" issue...\n');

  // Test 1: Verify /api/admin/users endpoint exists (should get 401, not 404)
  console.log(
    "1️⃣ Testing /api/admin/users (should return 401 Unauthorized, not 404 Not Found)",
  );
  const users = await testEndpoint("/api/admin/users");

  // Test 2: Verify /api/admin/users/stats endpoint exists
  console.log(
    "\n2️⃣ Testing /api/admin/users/stats (should return 401 Unauthorized, not 404 Not Found)",
  );
  const stats = await testEndpoint("/api/admin/users/stats");

  // Test 3: Verify basic admin dashboard still works
  console.log(
    "\n3️⃣ Testing /api/admin/dashboard (should return 401 Unauthorized, not 404 Not Found)",
  );
  const dashboard = await testEndpoint("/api/admin/dashboard");

  console.log("\n📋 RESULTS SUMMARY:");
  console.log("==================");

  if (users.status === 401) {
    console.log(
      "✅ /api/admin/users: FIXED - Endpoint exists (401 Unauthorized)",
    );
  } else if (users.status === 404) {
    console.log("❌ /api/admin/users: STILL BROKEN - Endpoint not found (404)");
  } else {
    console.log(`⚠️  /api/admin/users: UNEXPECTED - Status ${users.status}`);
  }

  if (stats.status === 401) {
    console.log(
      "✅ /api/admin/users/stats: FIXED - Endpoint exists (401 Unauthorized)",
    );
  } else if (stats.status === 404) {
    console.log(
      "❌ /api/admin/users/stats: STILL BROKEN - Endpoint not found (404)",
    );
  } else {
    console.log(
      `���️  /api/admin/users/stats: UNEXPECTED - Status ${stats.status}`,
    );
  }

  if (dashboard.status === 401) {
    console.log(
      "✅ /api/admin/dashboard: OK - Working as expected (401 Unauthorized)",
    );
  } else {
    console.log(
      `⚠️  /api/admin/dashboard: UNEXPECTED - Status ${dashboard.status}`,
    );
  }

  // Conclusion
  if (users.status === 401 && stats.status === 401) {
    console.log('\n🎉 SUCCESS: "API server offline" error has been FIXED!');
    console.log("📝 The admin user endpoints now exist and respond correctly.");
    console.log(
      "🔐 Authentication is working - frontend should now work with proper login.",
    );
  } else {
    console.log("\n❌ ISSUE: Some endpoints are still missing or broken.");
  }
}

async function testEndpoint(path) {
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

    console.log(`📡 Testing: ${path}`);

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(`   Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log(`   Message: ${parsed.message || parsed.error || "OK"}`);
        } catch (e) {
          console.log(`   Response: ${data.substring(0, 50)}...`);
        }
        resolve({ status: res.statusCode, data });
      });
    });

    req.on("error", (error) => {
      console.error(`   Error: ${error.message}`);
      resolve({ status: 0, error: error.message });
    });

    req.end();
  });
}

testFixConfirmation().catch(console.error);
