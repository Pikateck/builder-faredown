/**
 * Test script for Transfers Bargain API
 * Tests the end-to-end bargain flow with sample transfer data
 */

const http = require("http");

const API_BASE = "http://localhost:3001";

// Test transfer data
const sampleTransferData = {
  id: "test_transfer_1",
  vehicleType: "sedan",
  vehicleClass: "economy",
  vehicleName: "Economy Sedan",
  totalPrice: 1380,
  maxPassengers: 3,
  estimatedDuration: 45,
  pricing: {
    totalPrice: 1380,
    basePrice: 1200,
  },
};

const sampleUserProfile = {
  tier: "standard",
  userId: "test_user_1",
};

const sampleSearchDetails = {
  pickupLocation: "Mumbai Airport (BOM)",
  dropoffLocation: "Hotel Taj Mahal Palace",
  pickupDate: "2024-12-25",
};

// Helper function to make HTTP requests
function makeRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path: `/api/transfers-bargain${path}`,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test the complete bargain flow
async function testTransfersBargainFlow() {
  console.log("\nðŸš€ Testing Transfers Bargain API Flow\n");

  try {
    // Test 1: Health Check
    console.log("1ï¸âƒ£ Testing health endpoint...");
    const health = await makeRequest("/health", "GET");
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.data);

    // Test 2: Start Bargain Session
    console.log("\n2ï¸âƒ£ Starting bargain session...");
    const startPayload = {
      transferData: sampleTransferData,
      userProfile: sampleUserProfile,
      searchDetails: sampleSearchDetails,
    };

    const startResponse = await makeRequest(
      "/session/start",
      "POST",
      startPayload,
    );
    console.log(`   Status: ${startResponse.status}`);
    console.log(`   Response:`, startResponse.data);

    if (!startResponse.data.success) {
      throw new Error("Failed to start bargain session");
    }

    const sessionId = startResponse.data.sessionId;
    console.log(`   âœ… Session created: ${sessionId}`);

    // Test 3: Make First Offer (Too Low)
    console.log("\n3ï¸âƒ£ Making first offer (too low - â‚¹800)...");
    const firstOffer = {
      sessionId: sessionId,
      userOffer: 800,
      message: "I'd like to pay â‚¹800 for this transfer.",
    };

    const firstOfferResponse = await makeRequest(
      "/session/offer",
      "POST",
      firstOffer,
    );
    console.log(`   Status: ${firstOfferResponse.status}`);
    console.log(
      `   AI Decision: ${firstOfferResponse.data.aiResponse?.decision}`,
    );
    console.log(
      `   AI Message: ${firstOfferResponse.data.aiResponse?.message}`,
    );

    // Test 4: Make Second Offer (Reasonable)
    console.log("\n4ï¸âƒ£ Making second offer (reasonable - â‚¹1200)...");
    const secondOffer = {
      sessionId: sessionId,
      userOffer: 1200,
      message: "How about â‚¹1200?",
    };

    const secondOfferResponse = await makeRequest(
      "/session/offer",
      "POST",
      secondOffer,
    );
    console.log(`   Status: ${secondOfferResponse.status}`);
    console.log(
      `   AI Decision: ${secondOfferResponse.data.aiResponse?.decision}`,
    );
    console.log(
      `   AI Counter Price: â‚¹${secondOfferResponse.data.aiResponse?.counterPrice}`,
    );
    console.log(
      `   AI Message: ${secondOfferResponse.data.aiResponse?.message}`,
    );
    console.log(`   Savings: â‚¹${secondOfferResponse.data.aiResponse?.savings}`);

    // Test 5: Accept Counter Offer (if there is one)
    if (
      secondOfferResponse.data.aiResponse?.decision === "counter" ||
      secondOfferResponse.data.aiResponse?.decision === "accept"
    ) {
      console.log("\n5ï¸âƒ£ Accepting the bargain...");
      const acceptPayload = { sessionId: sessionId };

      const acceptResponse = await makeRequest(
        "/session/accept",
        "POST",
        acceptPayload,
      );
      console.log(`   Status: ${acceptResponse.status}`);
      console.log(
        `   Booking Reference: ${acceptResponse.data.bookingPayload?.bookingReference}`,
      );
      console.log(
        `   Final Price: â‚¹${acceptResponse.data.bookingPayload?.finalPrice}`,
      );
      console.log(
        `   Savings: â‚¹${acceptResponse.data.bookingPayload?.savings}`,
      );
    }

    // Test 6: Get Session Details
    console.log("\n6ï¸âƒ£ Getting session details...");
    const sessionDetails = await makeRequest(`/session/${sessionId}`, "GET");
    console.log(`   Status: ${sessionDetails.status}`);
    console.log(`   Session Status: ${sessionDetails.data.session?.status}`);
    console.log(`   Total Rounds: ${sessionDetails.data.session?.rounds}`);

    console.log("\nâœ… All tests completed successfully!");
  } catch (error) {
    console.error("\nâŒ Test failed:", error.message);
    console.error("Details:", error);
  }
}

// Run the test
if (require.main === module) {
  testTransfersBargainFlow();
}

export default { testTransfersBargainFlow };
