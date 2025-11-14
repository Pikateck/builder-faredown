/**
 * Test TekTravels Auth Endpoint Path Variations
 * Find the correct path structure on api.tektravels.com
 */

require("dotenv").config({ path: ".env" });
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const HttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;

const FIXIE_URL = "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80";
const httpsAgent = new HttpsProxyAgent(FIXIE_URL);
const httpAgent = new HttpProxyAgent(FIXIE_URL);

const authBody = {
  ClientId: "tboprod",
  UserName: "BOMF145",
  Password: "@Bo#4M-Api@",
  EndUserIp: "52.5.155.132",
};

async function testAuth(name, url) {
  console.log(`Testing: ${name}`);
  console.log(`URL: ${url}`);

  try {
    const response = await axios({
      url,
      method: "POST",
      data: authBody,
      httpsAgent,
      httpAgent,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(
      `Response:`,
      JSON.stringify(response.data, null, 2).substring(0, 500),
    );

    if (response.data?.TokenId) {
      console.log(`\n🎉 SUCCESS - TokenId found!\n`);
      return true;
    }
    console.log("");
    return false;
  } catch (error) {
    console.log(`❌ Status: ${error.response?.status || "N/A"}`);
    console.log(`Error: ${error.message}`);
    if (error.response?.data) {
      console.log(
        `Response:`,
        JSON.stringify(error.response.data).substring(0, 200),
      );
    }
    console.log("");
    return false;
  }
}

async function runTests() {
  console.log("█".repeat(80));
  console.log("TEKTRAVELS AUTH - PATH VARIATIONS TEST");
  console.log("█".repeat(80));
  console.log("");

  const paths = [
    {
      name: "Path 1: /SharedServices/SharedData.svc/rest/Authenticate",
      url: "http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate",
    },
    {
      name: "Path 2: /SharedAPI/SharedData.svc/rest/Authenticate",
      url: "http://api.tektravels.com/SharedAPI/SharedData.svc/rest/Authenticate",
    },
    {
      name: "Path 3: /BookingEngine/SharedData.svc/rest/Authenticate",
      url: "http://api.tektravels.com/BookingEngine/SharedData.svc/rest/Authenticate",
    },
    {
      name: "Path 4 (HTTPS): /SharedServices/SharedData.svc/rest/Authenticate",
      url: "https://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate",
    },
    {
      name: "Path 5 (HTTPS): /SharedAPI/SharedData.svc/rest/Authenticate",
      url: "https://api.tektravels.com/SharedAPI/SharedData.svc/rest/Authenticate",
    },
  ];

  for (const path of paths) {
    const success = await testAuth(path.name, path.url);
    if (success) {
      console.log("=".repeat(80));
      console.log("WORKING AUTH ENDPOINT FOUND:");
      console.log(path.url);
      console.log("=".repeat(80));
      break;
    }
  }
}

runTests();
