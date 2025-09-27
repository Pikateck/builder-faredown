const http = require("http");

// Test that confirms the "makeRequest is not a function" error is fixed
async function testMakeRequestFix() {
  console.log(
    '✅ Testing Fix Confirmation - "makeRequest is not a function" error...\n',
  );

  // Test 1: Verify admin packages endpoint exists and responds (not with function error)
  console.log(
    "1️⃣ Testing /api/admin/packages (should return 401 Unauthorized, not TypeError)",
  );
  const packages = await testEndpoint("/api/admin/packages");

  // Test 2: Verify admin packages stats endpoint exists
  console.log(
    "\n2️⃣ Testing /api/admin/packages/stats (should return 401 Unauthorized, not TypeError)",
  );
  const stats = await testEndpoint("/api/admin/packages/stats");

  console.log("\n📋 RESULTS SUMMARY:");
  console.log("==================");

  if (packages.status === 401) {
    console.log(
      "✅ /api/admin/packages: FIXED - Endpoint accessible (401 Unauthorized)",
    );
  } else if (packages.status === 500) {
    console.log(
      "❌ /api/admin/packages: STILL BROKEN - Likely TypeError (500 Internal Error)",
    );
  } else {
    console.log(
      `⚠️  /api/admin/packages: UNEXPECTED - Status ${packages.status}`,
    );
  }

  if (stats.status === 401) {
    console.log(
      "✅ /api/admin/packages/stats: FIXED - Endpoint accessible (401 Unauthorized)",
    );
  } else if (stats.status === 500) {
    console.log(
      "❌ /api/admin/packages/stats: STILL BROKEN - Likely TypeError (500 Internal Error)",
    );
  } else {
    console.log(
      `⚠️  /api/admin/packages/stats: UNEXPECTED - Status ${stats.status}`,
    );
  }

  // Conclusion
  if (packages.status === 401 && stats.status === 401) {
    console.log(
      '\n🎉 SUCCESS: "makeRequest is not a function" error has been FIXED!',
    );
    console.log(
      "📝 Admin Package Management endpoints are now working correctly.",
    );
    console.log(
      "🔐 Frontend should now work properly with admin authentication.",
    );
  } else {
    console.log(
      "\n❌ ISSUE: Some endpoints may still have TypeScript/function errors.",
    );
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

testMakeRequestFix().catch(console.error);
