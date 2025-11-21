#!/usr/bin/env node

const axios = require("axios");

const API_BASE_URL =
  process.env.VITE_API_BASE_URL ||
  "https://builder-faredown-pricing.onrender.com/api";

console.log(`Using API: ${API_BASE_URL}`);
console.log("Attempting search...\n");

axios
  .post(
    `${API_BASE_URL}/tbo/search`,
    {
      destination: "Mumbai",
      countryCode: "IN",
      checkIn: "2025-12-20",
      checkOut: "2025-12-22",
      rooms: [{ adults: 1, children: 0, childAges: [] }],
      currency: "INR",
      guestNationality: "IN",
    },
    {
      timeout: 30000, // 30 second timeout
    },
  )
  .then((response) => {
    console.log(`✓ Search successful!`);
    console.log(`  Hotels found: ${response.data.hotels?.length || 0}`);
    if (response.data.hotels && response.data.hotels.length > 0) {
      const hotel = response.data.hotels[0];
      console.log(`  First hotel:`, {
        hotelName: hotel.hotelName || hotel.HotelName,
        hotelCode: hotel.hotelCode || hotel.HotelCode,
        resultIndex: hotel.resultIndex || hotel.ResultIndex,
      });
    }
  })
  .catch((error) => {
    console.error(`✗ Search failed!`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data:`, error.response.data);
    } else if (error.code) {
      console.error(`  Error: ${error.code} - ${error.message}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
  });
