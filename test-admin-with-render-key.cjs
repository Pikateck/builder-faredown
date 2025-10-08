const https = require("https");

const ADMIN_API_KEY =
  "8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1";

async function testAdminAPI() {
  const options = {
    hostname: "builder-faredown-pricing.onrender.com",
    port: 443,
    path: "/api/admin/users?search=zubin&limit=10",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_API_KEY,
    },
  };

  return new Promise((resolve, reject) => {
    console.log("🔑 Testing Admin API with Render key...\n");

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(`✅ Response Status: ${res.statusCode}\n`);

        try {
          const response = JSON.parse(data);
          console.log("📋 Response:");
          console.log(JSON.stringify(response, null, 2));

          if (res.statusCode === 200 && response.users) {
            console.log(`\n✅ SUCCESS! Admin API authenticated correctly!`);
            console.log(`\n👥 Found ${response.users.length} user(s):\n`);

            response.users.forEach((user, index) => {
              console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
              console.log(`   Email: ${user.email}`);
              console.log(`   Status: ${user.status}`);
              console.log(`   Verified: ${user.isVerified ? "Yes" : "No"}`);
              console.log(`   Active: ${user.isActive ? "Yes" : "No"}`);
              console.log("");
            });

            resolve(true);
          } else if (res.statusCode === 401) {
            console.log(`\n❌ Authentication failed: ${response.message}`);
            resolve(false);
          } else {
            console.log(`\n⚠️  Unexpected response`);
            resolve(false);
          }
        } catch (e) {
          console.log("❌ Failed to parse response:", data);
          reject(e);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ Request Error:", error.message);
      reject(error);
    });

    req.end();
  });
}

async function runTest() {
  console.log("🧪 Admin API Test with Render Key\n");
  console.log("=".repeat(70));
  console.log(`Admin Key: ${ADMIN_API_KEY.substring(0, 20)}...`);
  console.log("=".repeat(70) + "\n");

  try {
    const success = await testAdminAPI();

    console.log("=".repeat(70));

    if (success) {
      console.log("\n✅ Admin Panel should now work correctly!");
      console.log("\n📝 Next Steps:");
      console.log("   1. Refresh your Admin Panel in the browser");
      console.log('   2. Click "Refresh Data" in User Management');
      console.log("   3. You should see: Zubin Aibara (Active)");
    } else {
      console.log("\n❌ Admin API authentication failed");
      console.log("   Please verify the ADMIN_API_KEY on Render");
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

runTest();
