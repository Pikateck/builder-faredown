/**
 * Test TBO Authentication
 * Run: node test-tbo-auth.cjs
 */

const axios = require("axios");

// Use environment variables directly (already set in the environment)
const TBO_SEARCH_URL = process.env.TBO_SEARCH_URL || "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest";
const TBO_CLIENT_ID = process.env.TBO_CLIENT_ID || process.env.TBO_AGENCY_ID;
const TBO_USERNAME = process.env.TBO_USERNAME;
const TBO_PASSWORD = process.env.TBO_PASSWORD;
const TBO_END_USER_IP = process.env.TBO_END_USER_IP || "192.168.5.56";

async function testTBOAuth() {
  console.log("\n🔐 Testing TBO Authentication...\n");
  
  console.log("Configuration:");
  console.log("- Search URL:", TBO_SEARCH_URL);
  console.log("- Client ID:", TBO_CLIENT_ID);
  console.log("- Username:", TBO_USERNAME);
  console.log("- Password:", TBO_PASSWORD ? "***" : "(not set)");
  console.log("- End User IP:", TBO_END_USER_IP);
  console.log("");

  if (!TBO_CLIENT_ID || !TBO_USERNAME || !TBO_PASSWORD) {
    console.error("❌ Missing TBO credentials. Please check your environment variables.");
    console.error("Required variables: TBO_CLIENT_ID, TBO_USERNAME, TBO_PASSWORD");
    process.exit(1);
  }

  try {
    const authRequest = {
      ClientId: TBO_CLIENT_ID,
      UserName: TBO_USERNAME,
      Password: TBO_PASSWORD,
      EndUserIp: TBO_END_USER_IP,
    };

    console.log("📤 Sending authentication request...");
    console.log("Request payload:", JSON.stringify(authRequest, null, 2));
    console.log("");

    const response = await axios.post(
      `${TBO_SEARCH_URL}/Authenticate`,
      authRequest,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("📥 Response received:");
    console.log("Status Code:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
    console.log("");

    if (response.data.Status === 1 && response.data.TokenId) {
      console.log("✅ TBO Authentication SUCCESSFUL!");
      console.log("Token ID:", response.data.TokenId);
      console.log("Member ID:", response.data.Member?.MemberId);
      console.log("Agency Name:", response.data.Member?.AgencyName);
      
      // Test balance check
      console.log("\n💰 Testing balance check...");
      const balanceRequest = {
        TokenId: response.data.TokenId,
        EndUserIp: TBO_END_USER_IP,
      };

      const balanceResponse = await axios.post(
        `${TBO_SEARCH_URL}/GetAgencyBalance`,
        balanceRequest,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      if (balanceResponse.data.Status === 1) {
        console.log("✅ Balance check successful!");
        console.log("Balance:", balanceResponse.data.Result?.Balance);
        console.log("Currency:", balanceResponse.data.Result?.Currency);
      } else {
        console.log("⚠️  Balance check failed:", balanceResponse.data.Error);
      }
      
      process.exit(0);
    } else {
      console.error("❌ TBO Authentication FAILED!");
      console.error("Error:", response.data.Error || response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Authentication request failed:");
    console.error("Error:", error.message);
    
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("No response received. Please check:");
      console.error("1. Network connectivity");
      console.error("2. TBO API URL is correct");
      console.error("3. Firewall/proxy settings");
    }
    
    process.exit(1);
  }
}

testTBOAuth();
