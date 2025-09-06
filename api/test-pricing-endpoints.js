/**
 * Test Pricing API endpoints
 */

const axios = require("axios");

const baseURL = "http://localhost:3001";

async function testEndpoints() {
  console.log("🧪 Testing Pricing API Endpoints...\n");

  try {
    // Test 1: Health endpoint
    console.log("1️⃣ Testing /health endpoint...");
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log("✅ Health check passed:", healthResponse.data);
    console.log("");

    // Test 2: Pricing quote endpoint
    console.log("2️⃣ Testing /api/pricing/quote endpoint...");
    const quoteResponse = await axios.post(`${baseURL}/api/pricing/quote`, {
      module: "air",
      origin: "BOM",
      destination: "JFK",
      serviceClass: "Y",
      airlineCode: "AI",
      currency: "USD",
      baseFare: 512.35,
      userType: "b2c",
      debug: true,
      extras: { promoCode: "WELCOME10", pax: 1 },
    });
    console.log("✅ Quote endpoint passed:");
    console.log(JSON.stringify(quoteResponse.data, null, 2));
    console.log("");

    // Test 3: Generate a journey ID and test diff endpoint
    console.log("3️⃣ Testing /api/pricing/diff endpoint...");

    // First make a request with Price Echo headers to log a checkpoint
    const journeyId = "test-journey-" + Date.now();
    await axios.post(
      `${baseURL}/api/pricing/quote`,
      {
        module: "air",
        origin: "BOM",
        destination: "JFK",
        serviceClass: "Y",
        airlineCode: "AI",
        currency: "USD",
        baseFare: 512.35,
        userType: "b2c",
      },
      {
        headers: {
          "x-fd-journey": journeyId,
          "x-fd-step": "search_results",
        },
      },
    );

    // Now test the diff endpoint
    const diffResponse = await axios.get(
      `${baseURL}/api/pricing/diff?journeyId=${journeyId}`,
    );
    console.log("✅ Diff endpoint passed:");
    console.log(JSON.stringify(diffResponse.data, null, 2));
    console.log("");

    // Test 4: Rules preview endpoint
    console.log("4️⃣ Testing /api/pricing/rules/preview endpoint...");
    const previewResponse = await axios.get(
      `${baseURL}/api/pricing/rules/preview?module=air&origin=BOM&destination=JFK&serviceClass=Y&userType=b2c&baseFare=500`,
    );
    console.log("✅ Rules preview passed:");
    console.log(JSON.stringify(previewResponse.data, null, 2));
    console.log("");

    console.log("🎉 All endpoint tests passed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    if (error.response?.status) {
      console.error("Status:", error.response.status);
    }
  }
}

testEndpoints();
