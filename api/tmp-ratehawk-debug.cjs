const axios = require("axios");

const keyId = process.env.RATEHAWK_API_ID || "3635";
const apiKey =
  process.env.RATEHAWK_API_KEY || "d020d57a-b31d-4696-bc9a-3b90dc84239f";
const credentials = Buffer.from(`${keyId}:${apiKey}`).toString("base64");

(async () => {
  try {
    const payload = {
      checkin: "2026-01-12",
      checkout: "2026-01-15",
      residency: "in",
      language: "en",
      guests: [{ adults: 2, children: [] }],
      region_id: 6053839,
      currency: "AED",
    };

    console.log("Sending request with payload:");
    console.log(JSON.stringify(payload, null, 2));

    const response = await axios.post(
      "https://api.worldota.net/api/b2b/v3/search/serp/hotels/",
      payload,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    console.log("\nSuccess! Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("\nError occurred:");
    console.log("Status:", error.response?.status);
    console.log("Status Text:", error.response?.statusText);
    console.log("\nFull error data:");
    console.log(JSON.stringify(error.response?.data, null, 2));
  }
})();
