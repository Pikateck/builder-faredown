/**
 * COMPREHENSIVE TBO STATIC DATA TEST
 * 
 * Purpose: Properly test all documented methods to retrieve city data from TBO
 * 
 * What this tests:
 * 1. JSON POST to DestinationCityList (as currently implemented)
 * 2. JSON POST to CityList (alternate endpoint)
 * 3. SOAP/XML envelope to static endpoints
 * 4. Different host variations
 * 5. TokenId vs Static credentials
 * 
 * Goal: Find ONE working method to get Dubai's real CityId
 */

require("dotenv").config({ path: "./api/.env" });
const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");

// Configuration
const CONFIG = {
  // Static data credentials (separate from dynamic API)
  staticUsername: process.env.TBO_STATIC_USER || "travelcategory",
  staticPassword: process.env.TBO_STATIC_PASSWORD || "Tra@59334536",
  
  // Dynamic API credentials
  clientId: process.env.TBO_CLIENT_ID || "tboprod",
  userId: process.env.TBO_API_USER_ID || "BOMF145",
  password: process.env.TBO_API_PASSWORD || "@Bo#4M-Api@",
  endUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
  
  // Endpoints
  authUrl: "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
  staticHosts: [
    "https://apiwr.tboholidays.com/HotelAPI/",
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/",
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/"
  ],
  
  // Proxy
  proxy: process.env.FIXIE_URL,
  useProxy: process.env.USE_SUPPLIER_PROXY === "true"
};

// Axios instance with proxy
function createAxiosInstance() {
  const config = {
    timeout: 30000,
    headers: {
      "User-Agent": "Faredown/1.0",
      "Accept-Encoding": "gzip, deflate"
    }
  };
  
  if (CONFIG.useProxy && CONFIG.proxy) {
    config.httpsAgent = new HttpsProxyAgent(CONFIG.proxy);
    config.proxy = false;
  }
  
  return axios.create(config);
}

/**
 * Get TokenId for testing TokenId-based static endpoints
 */
async function getTokenId() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 1: AUTHENTICATE TO GET TOKENID");
  console.log("=".repeat(80));
  
  const request = {
    ClientId: CONFIG.clientId,
    UserName: CONFIG.userId,
    Password: CONFIG.password,
    EndUserIp: CONFIG.endUserIp
  };
  
  console.log("📤 Auth Request:");
  console.log("  URL:", CONFIG.authUrl);
  console.log("  Payload:", JSON.stringify(request, null, 2));
  
  try {
    const client = createAxiosInstance();
    const response = await client.post(CONFIG.authUrl, request, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    
    console.log("📥 Auth Response:");
    console.log("  Status:", response.status);
    console.log("  TokenId:", response.data?.TokenId ? "✅ " + response.data.TokenId.substring(0, 40) + "..." : "❌ MISSING");
    console.log("  Status:", response.data?.Status);
    
    return response.data?.TokenId;
  } catch (error) {
    console.error("❌ Auth failed:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 1: JSON POST with static credentials
 */
async function testJSONStaticCreds(host, endpoint) {
  const url = host + endpoint;
  const request = {
    UserName: CONFIG.staticUsername,
    Password: CONFIG.staticPassword,
    CountryCode: "AE"
  };
  
  console.log("\n📤 Request:");
  console.log("  URL:", url);
  console.log("  Method: POST (JSON)");
  console.log("  Auth: Static UserName/Password");
  console.log("  Payload:", JSON.stringify(request, null, 2));
  
  try {
    const client = createAxiosInstance();
    const response = await client.post(url, request, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    
    console.log("📥 Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  Response Keys:", Object.keys(response.data || {}).join(", "));
    
    // Try to find cities in response
    const cities = response.data?.DestinationCityList || 
                   response.data?.CityList || 
                   response.data?.Cities ||
                   response.data?.Result ||
                   [];
    
    if (Array.isArray(cities) && cities.length > 0) {
      console.log("✅ SUCCESS! Found", cities.length, "cities");
      
      // Find Dubai
      const dubai = cities.find(c => 
        c.CityName?.toLowerCase().includes('dubai') ||
        c.Name?.toLowerCase().includes('dubai')
      );
      
      if (dubai) {
        console.log("\n🎯 DUBAI FOUND!");
        console.log(JSON.stringify(dubai, null, 2));
        
        // Save to file
        fs.writeFileSync("dubai-cityid-found.json", JSON.stringify({
          source: "JSON Static Credentials",
          url: url,
          dubai: dubai,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        return dubai;
      } else {
        console.log("⚠️  Cities found but Dubai not in list");
        console.log("Sample cities:", cities.slice(0, 3).map(c => c.CityName || c.Name).join(", "));
      }
    } else {
      console.log("⚠️  No cities array found in response");
      console.log("Response sample:", JSON.stringify(response.data, null, 2).substring(0, 500));
    }
    
    return null;
  } catch (error) {
    console.log("❌ Error:", error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log("Error data:", JSON.stringify(error.response.data, null, 2).substring(0, 300));
    }
    return null;
  }
}

/**
 * Test 2: JSON POST with TokenId
 */
async function testJSONWithToken(host, endpoint, tokenId) {
  const url = host + endpoint;
  const request = {
    TokenId: tokenId,
    CountryCode: "AE"
  };
  
  console.log("\n📤 Request:");
  console.log("  URL:", url);
  console.log("  Method: POST (JSON)");
  console.log("  Auth: TokenId");
  console.log("  Payload:", JSON.stringify({ ...request, TokenId: tokenId.substring(0, 40) + "..." }, null, 2));
  
  try {
    const client = createAxiosInstance();
    const response = await client.post(url, request, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    
    console.log("📥 Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  Response Keys:", Object.keys(response.data || {}).join(", "));
    
    const cities = response.data?.DestinationCityList || 
                   response.data?.CityList || 
                   response.data?.Cities ||
                   [];
    
    if (Array.isArray(cities) && cities.length > 0) {
      console.log("✅ SUCCESS! Found", cities.length, "cities");
      
      const dubai = cities.find(c => 
        c.CityName?.toLowerCase().includes('dubai') ||
        c.Name?.toLowerCase().includes('dubai')
      );
      
      if (dubai) {
        console.log("\n🎯 DUBAI FOUND!");
        console.log(JSON.stringify(dubai, null, 2));
        
        fs.writeFileSync("dubai-cityid-found.json", JSON.stringify({
          source: "JSON with TokenId",
          url: url,
          dubai: dubai,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        return dubai;
      }
    } else {
      console.log("⚠️  No cities found");
      console.log("Response sample:", JSON.stringify(response.data, null, 2).substring(0, 500));
    }
    
    return null;
  } catch (error) {
    console.log("❌ Error:", error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log("Error data:", JSON.stringify(error.response.data, null, 2).substring(0, 300));
    }
    return null;
  }
}

/**
 * Test 3: SOAP/XML envelope (for SOAP-based endpoints)
 */
async function testSOAPXML(host, endpoint) {
  const url = host + endpoint;
  
  // SOAP envelope for DestinationCityList
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <DestinationCityList xmlns="http://tempuri.org/">
      <UserName>${CONFIG.staticUsername}</UserName>
      <Password>${CONFIG.staticPassword}</Password>
      <CountryCode>AE</CountryCode>
    </DestinationCityList>
  </soap:Body>
</soap:Envelope>`;
  
  console.log("\n📤 Request:");
  console.log("  URL:", url);
  console.log("  Method: POST (SOAP/XML)");
  console.log("  Auth: Static UserName/Password");
  console.log("  SOAP Action: DestinationCityList");
  
  try {
    const client = createAxiosInstance();
    const response = await client.post(url, soapEnvelope, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://tempuri.org/DestinationCityList"
      }
    });
    
    console.log("📥 Response:");
    console.log("  HTTP Status:", response.status);
    console.log("  Content-Type:", response.headers['content-type']);
    console.log("  Response preview:", String(response.data).substring(0, 500));
    
    // Check if response contains city data
    if (String(response.data).toLowerCase().includes('dubai')) {
      console.log("✅ SUCCESS! Dubai found in SOAP response");
      fs.writeFileSync("dubai-soap-response.xml", String(response.data));
      console.log("Saved to: dubai-soap-response.xml");
      return true;
    } else {
      console.log("⚠️  No Dubai found in response");
    }
    
    return null;
  } catch (error) {
    console.log("❌ Error:", error.response?.status, error.response?.statusText);
    return null;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log("╔" + "═".repeat(78) + "╗");
  console.log("║" + " ".repeat(20) + "TBO STATIC DATA COMPREHENSIVE TEST" + " ".repeat(24) + "║");
  console.log("╚" + "═".repeat(78) + "╝");
  
  console.log("\n📋 Configuration:");
  console.log("  Static Username:", CONFIG.staticUsername);
  console.log("  Static Password:", CONFIG.staticPassword ? "***" + CONFIG.staticPassword.substring(CONFIG.staticPassword.length - 4) : "MISSING");
  console.log("  Dynamic ClientId:", CONFIG.clientId);
  console.log("  Dynamic UserId:", CONFIG.userId);
  console.log("  Proxy:", CONFIG.useProxy ? CONFIG.proxy?.substring(0, 30) + "..." : "Disabled");
  console.log("  Target: Dubai (AE)");
  
  // Get TokenId first
  const tokenId = await getTokenId();
  
  const endpoints = [
    "DestinationCityList",
    "CityList",
    "CountryList"
  ];
  
  const results = [];
  
  // Test each host + endpoint combination
  for (const host of CONFIG.staticHosts) {
    console.log("\n" + "=".repeat(80));
    console.log(`TESTING HOST: ${host}`);
    console.log("=".repeat(80));
    
    for (const endpoint of endpoints) {
      console.log("\n" + "-".repeat(80));
      console.log(`TEST: ${endpoint}`);
      console.log("-".repeat(80));
      
      // Method 1: JSON with static credentials
      console.log("\n🧪 Method 1: JSON POST with Static Credentials");
      const result1 = await testJSONStaticCreds(host, endpoint);
      if (result1) {
        console.log("\n\n🎉 SUCCESS! Dubai CityId found via JSON Static Credentials");
        console.log("CityId:", result1.CityId || result1.Id);
        results.push({ method: "JSON Static", host, endpoint, dubai: result1 });
      }
      
      // Method 2: JSON with TokenId (if we have one)
      if (tokenId) {
        console.log("\n🧪 Method 2: JSON POST with TokenId");
        const result2 = await testJSONWithToken(host, endpoint, tokenId);
        if (result2) {
          console.log("\n\n🎉 SUCCESS! Dubai CityId found via JSON with TokenId");
          console.log("CityId:", result2.CityId || result2.Id);
          results.push({ method: "JSON TokenId", host, endpoint, dubai: result2 });
        }
      }
      
      // Method 3: SOAP/XML (only for DestinationCityList endpoint)
      if (endpoint === "DestinationCityList") {
        console.log("\n🧪 Method 3: SOAP/XML Envelope");
        await testSOAPXML(host, endpoint);
      }
      
      // If we found Dubai, we can stop
      if (results.length > 0) {
        break;
      }
    }
    
    if (results.length > 0) {
      break;
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(80));
  
  if (results.length > 0) {
    console.log("\n✅ SUCCESS! Found Dubai CityId:");
    results.forEach(r => {
      console.log(`\n  Method: ${r.method}`);
      console.log(`  Host: ${r.host}`);
      console.log(`  Endpoint: ${r.endpoint}`);
      console.log(`  Dubai CityId: ${r.dubai.CityId || r.dubai.Id}`);
      console.log(`  Dubai Data:`, JSON.stringify(r.dubai, null, 2));
    });
    
    console.log("\n📁 Dubai CityId saved to: dubai-cityid-found.json");
    console.log("\n🚀 NEXT STEP: Run hotel search with this CityId:");
    console.log(`   node test-tbo-hotel-search-with-cityid.js ${results[0].dubai.CityId || results[0].dubai.Id}`);
  } else {
    console.log("\n❌ NO SUCCESS - All methods failed to retrieve Dubai CityId");
    console.log("\n🔍 DIAGNOSIS:");
    console.log("  - All JSON endpoints returned errors (401/404/400)");
    console.log("  - SOAP endpoints (if applicable) failed");
    console.log("  - Both static credentials and TokenId approaches failed");
    console.log("\n📞 RECOMMENDATION:");
    console.log("  Since API methods are failing, the city list data must be obtained from:");
    console.log("  1. TBO B2B Portal (requires manual login)");
    console.log("     - Log in at: https://b2b.travelboutiqueonline.com (or similar)");
    console.log("     - Look for: Static Data > City List > Download");
    console.log("     - File: NewCityListHotel.rar or similar");
    console.log("  2. Contact TBO Support");
    console.log("     - Request: Valid CityId for Dubai (AE)");
    console.log("     - Or: API endpoint documentation for static data");
    console.log("  3. Check TBO documentation portal");
    console.log("     - URL: https://apidoc.tektravels.com/");
    console.log("     - Section: STATIC DATA > DESTINATIONCITYLIST");
  }
}

// Run
main().catch(console.error);
