#!/usr/bin/env node

const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");

const agent = new HttpsProxyAgent("http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80");
const http = axios.create({
  httpsAgent: agent,
  httpAgent: agent,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

const url = "https://apiwr.tboholidays.com/HotelAPI/CityList";

async function testCityList() {
  console.log("Testing CityList endpoint with different payloads...");
  console.log("");
  
  const payloads = [
    { UserName: "travelcategory", Password: "Tra@59334536" },
    { Username: "travelcategory", Password: "Tra@59334536" },
    { ClientId: "tboprod", UserName: "BOMF145", Password: "@Bo#4M-Api@" },
    {}
  ];
  
  for (let i = 0; i < payloads.length; i++) {
    try {
      console.log(`Test ${i + 1}:`, JSON.stringify(payloads[i]));
      const response = await http.post(url, payloads[i]);
      console.log("Response:", JSON.stringify(response.data, null, 2));
      console.log("");
    } catch (error) {
      console.log("Error:", error.response?.data || error.message);
      console.log("");
    }
  }
}

testCityList();
