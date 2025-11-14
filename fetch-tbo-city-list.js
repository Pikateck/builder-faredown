#!/usr/bin/env node
/**
 * Fetch TBO City List and find Dubai's correct CityId
 */

const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");

const config = {
  useProxy: true,
  proxyUrl: "http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80",
  staticUser: "travelcategory",
  staticPassword: "Tra@59334536"
};

const agent = config.useProxy ? new HttpsProxyAgent(config.proxyUrl) : null;
const http = axios.create({
  httpsAgent: agent,
  httpAgent: agent,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Try multiple possible endpoints for city list
const endpoints = [
  "https://apiwr.tboholidays.com/HotelAPI/DestinationCityList",
  "https://apiwr.tboholidays.com/HotelAPI/CityList",
  "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/DestinationCityList",
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/DestinationCityList"
];

async function fetchCityList() {
  console.log("Attempting to fetch TBO city list...");
  console.log("");
  
  const payload = {
    UserName: config.staticUser,
    Password: config.staticPassword
  };
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying: ${endpoint}`);
      
      const response = await http.post(endpoint, payload);
      
      console.log(`  ✅ HTTP ${response.status}`);
      
      if (response.data) {
        // Try to find city list in response
        let cities = null;
        
        if (response.data.DestinationCityList) {
          cities = response.data.DestinationCityList;
        } else if (response.data.CityList) {
          cities = response.data.CityList;
        } else if (Array.isArray(response.data)) {
          cities = response.data;
        }
        
        if (cities && cities.length > 0) {
          console.log(`  ✅ Found ${cities.length} cities`);
          console.log("");
          
          // Find Dubai
          const dubaiVariations = cities.filter(c => {
            const name = c.CityName || c.Name || "";
            return name.toLowerCase().includes("dubai") || 
                   c.CityCode === "DXB" ||
                   c.CountryCode === "AE";
          });
          
          if (dubaiVariations.length > 0) {
            console.log("Dubai entries found:");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            dubaiVariations.forEach(city => {
              console.log("");
              console.log(`CityId: ${city.CityId || city.Id}`);
              console.log(`CityName: ${city.CityName || city.Name}`);
              console.log(`CountryCode: ${city.CountryCode || city.Country}`);
              console.log(`CityCode: ${city.CityCode || city.Code || "N/A"}`);
            });
            console.log("");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━");
          }
          
          // Save full list
          fs.writeFileSync('tbo-city-list.json', JSON.stringify(cities, null, 2));
          console.log("");
          console.log(`💾 Full city list saved to: tbo-city-list.json`);
          
          // Also save just Dubai entries
          if (dubaiVariations.length > 0) {
            fs.writeFileSync('tbo-dubai-cities.json', JSON.stringify(dubaiVariations, null, 2));
            console.log(`💾 Dubai entries saved to: tbo-dubai-cities.json`);
          }
          
          return;
        } else {
          console.log(`  Response structure:`, Object.keys(response.data));
        }
      }
      
    } catch (error) {
      const status = error.response?.status || "N/A";
      const message = error.response?.data || error.message;
      console.log(`  ❌ HTTP ${status}: ${typeof message === 'string' ? message.substring(0, 100) : JSON.stringify(message).substring(0, 100)}`);
    }
    console.log("");
  }
  
  console.log("⚠️  Could not fetch city list from any endpoint");
  console.log("");
  console.log("Alternative: Use hardcoded major city mapping based on TBO documentation");
}

fetchCityList().catch(console.error);
