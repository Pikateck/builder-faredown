#!/usr/bin/env node

const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");

const config = {
  authUrl:
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  clientId: "tboprod",
  userName: "BOMF145",
  password: "@Bo#4M-Api@",
  endUserIp: "52.5.155.132",
  proxyUrl: "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80",
};

const agent = new HttpsProxyAgent(config.proxyUrl);
const http = axios.create({
  httpsAgent: agent,
  httpAgent: agent,
  timeout: 60000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

const staticEndpoints = [
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/CountryList",
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/DestinationCityList",
  "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/CountryList",
  "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/DestinationCityList",
];

async function testStaticEndpoints() {
  console.log("Testing static data endpoints with TokenId...");
  console.log("");

  // Get TokenId
  const authPayload = {
    ClientId: config.clientId,
    UserName: config.userName,
    Password: config.password,
    EndUserIp: config.endUserIp,
  };

  const authResponse = await http.post(config.authUrl, authPayload);
  const tokenId = authResponse.data.TokenId;

  console.log("✅ Auth successful");
  console.log("TokenId:", tokenId.substring(0, 40) + "...");
  console.log("");

  for (const endpoint of staticEndpoints) {
    console.log(`Testing: ${endpoint}`);

    const payloads = [
      { TokenId: tokenId, EndUserIp: config.endUserIp },
      { TokenId: tokenId },
      { EndUserIp: config.endUserIp, TokenId: tokenId },
    ];

    for (let i = 0; i < payloads.length; i++) {
      try {
        const response = await http.post(endpoint, payloads[i]);

        console.log(`  ✅ Payload ${i + 1} worked!`);
        console.log(`  HTTP ${response.status}`);

        // Check for city list
        const data = response.data;
        let cities = null;

        if (data.DestinationCityList) {
          cities = data.DestinationCityList;
        } else if (data.CityList) {
          cities = data.CityList;
        } else if (data.CountryList) {
          console.log(`  Found ${data.CountryList.length} countries`);
          continue;
        } else if (Array.isArray(data)) {
          cities = data;
        }

        if (cities && cities.length > 0) {
          console.log(`  🎉 Found ${cities.length} cities!`);

          // Find Dubai
          const dubai = cities.find((c) => {
            const name = (c.CityName || c.Name || "").toLowerCase();
            return (
              name.includes("dubai") ||
              c.CountryCode === "AE" ||
              c.CityCode === "DXB"
            );
          });

          if (dubai) {
            console.log("");
            console.log("✅ DUBAI FOUND:");
            console.log(JSON.stringify(dubai, null, 2));

            fs.writeFileSync(
              "dubai-cityid.json",
              JSON.stringify(dubai, null, 2),
            );
            console.log("");
            console.log(`💾 Saved to dubai-cityid.json`);
            return dubai;
          }

          // Save full list
          fs.writeFileSync(
            "tbo-cities-full.json",
            JSON.stringify(cities, null, 2),
          );
          console.log(
            `  💾 Saved ${cities.length} cities to tbo-cities-full.json`,
          );

          return;
        }
      } catch (error) {
        if (i === payloads.length - 1) {
          console.log(
            `  ❌ All payloads failed: ${error.response?.status || error.message}`,
          );
        }
      }
    }
    console.log("");
  }
}

testStaticEndpoints().catch(console.error);
