/**
 * Test Multiple TBO Endpoints
 * Run: node test-tbo-endpoints.cjs
 */

const axios = require("axios");

const TBO_CLIENT_ID = process.env.TBO_CLIENT_ID || process.env.TBO_AGENCY_ID || "BOMF145";
const TBO_USERNAME = process.env.TBO_USERNAME || "BOMF145";
const TBO_PASSWORD = process.env.TBO_PASSWORD || "travel/live-18@@";
const TBO_END_USER_IP = process.env.TBO_END_USER_IP || "192.168.5.56";

const endpoints = [
  "https://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest",
  "https://api.tektravels.com/BookingEngineService_Air/AirService.svc",
  "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest",
  "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc",
  "https://api.tbotechnology.in/AirAPI_V10/AirService.svc/rest",
  "https://api.tbotechnology.in/AirAPI_V10/AirService.svc",
];

async function testEndpoint(baseUrl) {
  try {
    const authRequest = {
      ClientId: TBO_CLIENT_ID,
      UserName: TBO_USERNAME,
      Password: TBO_PASSWORD,
      EndUserIp: TBO_END_USER_IP,
    };

    console.log(`\n Testing: ${baseUrl}/Authenticate`);
    
    const response = await axios.post(
      `${baseUrl}/Authenticate`,
      authRequest,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.data.Status === 1 && response.data.TokenId) {
      console.log(`✅ SUCCESS! Token: ${response.data.TokenId}`);
      console.log(`   Member ID: ${response.data.Member?.MemberId}`);
      console.log(`   Agency: ${response.data.Member?.AgencyName}`);
      return baseUrl;
    } else {
      console.log(`❌ Auth failed: ${response.data.Error?.ErrorMessage || response.data.Error}`);
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ HTTP ${error.response.status}: ${error.response.statusText}`);
    } else if (error.code === 'ECONNABORTED') {
      console.log(`❌ Timeout`);
    } else {
      console.log(`❌ ${error.message}`);
    }
    return null;
  }
}

async function main() {
  console.log("🔍 Testing TBO API Endpoints...");
  console.log(`Using credentials: ClientId=${TBO_CLIENT_ID}, Username=${TBO_USERNAME}\n`);

  const workingEndpoint = null;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result) {
      console.log(`\n\n🎉 WORKING ENDPOINT FOUND: ${result}`);
      console.log(`\nUpdate your environment variable:`);
      console.log(`TBO_SEARCH_URL="${result}"`);
      process.exit(0);
    }
  }

  console.log("\n\n❌ No working endpoint found. Please check:");
  console.log("1. TBO credentials are correct");
  console.log("2. TBO account is active");
  console.log("3. IP address is whitelisted");
  console.log("4. Contact TBO support for the correct API endpoint");
  process.exit(1);
}

main();
