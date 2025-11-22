#!/usr/bin/env node

const axios = require("axios");

const API_BASE = "https://builder-faredown-pricing.onrender.com/api";

async function test() {
  console.log("Testing Hotel Search...\n");

  try {
    const payload = {
      cityId: "DXB",
      destination: "Dubai",
      checkIn: "2025-12-21",
      checkOut: "2025-12-22",
      rooms: "1",
      adults: "2",
      children: "0",
      currency: "INR",
      guestNationality: "IN",
    };

    console.log(`POST ${API_BASE}/hotels/search`);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("");

    const response = await axios.post(`${API_BASE}/hotels/search`, payload, {
      timeout: 120000,
    });

    console.log("✅ SUCCESS");
    console.log("Status:", response.status);
    console.log("Hotels:", response.data.hotels?.length || 0);
    console.log("Source:", response.data.source);
    console.log("Duration:", response.data.duration);
    console.log("");

    if (response.data.hotels && response.data.hotels.length > 0) {
      console.log("First hotel:");
      console.log(JSON.stringify(response.data.hotels[0], null, 2));
    }
  } catch (error) {
    console.error("❌ FAILED");
    console.error("Status:", error.response?.status);
    console.error("Error:", error.response?.data?.error || error.message);
    console.error("");
    console.error("Full response:", error.response?.data);
  }
}

test();
