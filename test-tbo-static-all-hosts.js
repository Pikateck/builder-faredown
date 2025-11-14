/**
 * TBO Static Data - Test ALL Hosts
 * Tests static endpoints on all known TBO hosts
 */

require("dotenv").config({ path: ".env" });
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const HttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;

const FIXIE_URL = "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80";
const httpsAgent = new HttpsProxyAgent(FIXIE_URL);
const httpAgent = new HttpProxyAgent(FIXIE_URL);

const CONFIG = {
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  clientId: "tboprod",
  userId: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",
};

let tokenId = null;

async function makeRequest(url, config) {
  return axios({
    url,
    ...config,
    httpsAgent,
    httpAgent,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.headers,
    },
    timeout: 15000,
  });
}

async function authenticate() {
  const response = await makeRequest(CONFIG.authUrl, {
    method: "POST",
    data: {
      ClientId: CONFIG.clientId,
      UserName: CONFIG.userId,
      Password: CONFIG.password,
      EndUserIp: CONFIG.endUserIp,
    },
  });

  tokenId = response.data.TokenId;
  console.log("✅ TokenId:", tokenId.substring(0, 30) + "...\n");
  return tokenId;
}

async function testEndpoint(name, url) {
  const requestBody = {
    ClientId: CONFIG.clientId,
    TokenId: tokenId,
    EndUserIp: CONFIG.endUserIp,
  };

  try {
    const response = await makeRequest(url, {
      method: "POST",
      data: requestBody,
    });

    console.log(`✅ ${name}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data Status: ${response.data?.Status}`);
    if (response.data?.Countries?.length) {
      console.log(`   Countries: ${response.data.Countries.length}`);
    }
    if (response.data?.Cities?.length) {
      console.log(`   Cities: ${response.data.Cities.length}`);
    }
    console.log("");
    return { success: true, url, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Status: ${error.response?.status || "N/A"}`);
    console.log(`   Error: ${error.message.substring(0, 100)}`);
    console.log("");
    return { success: false, url, status: error.response?.status };
  }
}

async function runTests() {
  console.log("█".repeat(80));
  console.log("TBO STATIC DATA - ALL HOSTS TEST");
  console.log("█".repeat(80));
  console.log("");

  await authenticate();

  // Test all known TBO hosts
  const hosts = [
    "https://apiwr.tboholidays.com",
    "https://affiliate.travelboutiqueonline.com",
    "https://api.travelboutiqueonline.com",
    "https://hotelbooking.travelboutiqueonline.com",
  ];

  const paths = [
    "/HotelAPI/CountryList",
    "/HotelAPI_V10/HotelService.svc/rest/CountryList",
    "/SharedAPI/SharedData.svc/rest/CountryList",
  ];

  const results = [];

  for (const host of hosts) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`HOST: ${host}`);
    console.log("=".repeat(80));
    console.log("");

    for (const path of paths) {
      const url = host + path;
      const result = await testEndpoint(
        `${host.split("//")[1]} - ${path}`,
        url,
      );
      results.push(result);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("WORKING ENDPOINTS");
  console.log("=".repeat(80));
  const working = results.filter((r) => r.success);

  if (working.length > 0) {
    working.forEach((r) => {
      console.log(`✅ ${r.url}`);
    });
  } else {
    console.log("❌ No working static endpoints found");
    console.log("");
    console.log("Next steps:");
    console.log("1. Check if static data requires different authentication");
    console.log("2. Try GET method instead of POST");
    console.log("3. Try without TokenId (just ClientId + EndUserIp)");
  }
  console.log("");
}

runTests();
