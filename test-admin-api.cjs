const https = require("https");

async function testAdminAPI(adminKey) {
  const options = {
    hostname: "builder-faredown-pricing.onrender.com",
    port: 443,
    path: "/api/admin/users?search=zubin&limit=10",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
  };

  return new Promise((resolve, reject) => {
    console.log(
      `\n🔑 Testing Admin API with key: ${adminKey.substring(0, 10)}...`,
    );

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(`Response Status: ${res.statusCode}`);

        try {
          const response = JSON.parse(data);
          console.log("Response:", JSON.stringify(response, null, 2));

          if (res.statusCode === 200 && response.users) {
            console.log(`\n✅ Admin API works with this key!`);
            console.log(`Found ${response.users.length} user(s)`);

            if (response.users.length > 0) {
              const user = response.users[0];
              console.log("\n👤 User Details:");
              console.log(`   Email: ${user.email}`);
              console.log(`   Name: ${user.firstName} ${user.lastName}`);
              console.log(`   Status: ${user.status}`);
              console.log(`   Verified: ${user.isVerified ? "Yes" : "No"}`);
              console.log(`   Active: ${user.isActive ? "Yes" : "No"}`);
            }
            resolve(true);
          } else if (res.statusCode === 401) {
            console.log(`❌ Key rejected: ${response.message}`);
            resolve(false);
          } else {
            console.log(`❌ Unexpected response`);
            resolve(false);
          }
        } catch (e) {
          console.log("Response (raw):", data);
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

async function runTests() {
  console.log("🧪 Testing Admin API with different keys\n");
  console.log("=".repeat(60));

  const keysToTest = [
    "admin123",
    process.env.ADMIN_API_KEY,
    process.env.VITE_ADMIN_API_KEY,
  ].filter(Boolean);

  for (const key of keysToTest) {
    try {
      const success = await testAdminAPI(key);
      if (success) {
        console.log(`\n✅ Working key found: ${key}`);
        break;
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n💡 If none of the keys work, you need to:");
  console.log("1. Go to Render dashboard");
  console.log('2. Select "builder-faredown-pricing" service');
  console.log("3. Go to Environment variables");
  console.log("4. Add/Update: ADMIN_API_KEY = admin123");
  console.log("5. Redeploy the service");
}

runTests();
