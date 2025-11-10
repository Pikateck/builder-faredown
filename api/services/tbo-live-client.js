// api/services/tbo-live-client.js
// Live TBO Hotel JSON APIs: Authenticate + GetHotelResult + GetHotelRoom

const axios = require("axios");

let cachedToken = null;

// Authenticate against TBO (JSON REST)
async function authenticate() {
  if (cachedToken && Date.now() - cachedToken.fetchedAt < 30 * 60 * 1000) {
    // reuse token up to 30 mins
    return cachedToken.tokenId;
  }

  const payload = {
    ClientId: process.env.TBO_CLIENT_ID,
    UserName: process.env.TBO_API_USER_ID,
    Password: process.env.TBO_API_PASSWORD,
    EndUserIp: process.env.TBO_END_USER_IP,
  };

  console.log("🔑 Calling TBO Authenticate...");

  const res = await axios.post(process.env.TBO_AUTH_URL, payload, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.data || !res.data.TokenId) {
    console.error("TBO Authenticate response:", res.data);
    throw new Error("TBO Authenticate did not return TokenId");
  }

  cachedToken = {
    tokenId: res.data.TokenId,
    fetchedAt: Date.now(),
  };

  console.log("✅ Got TokenId from TBO");
  return cachedToken.tokenId;
}

// Live Hotel Search (GetHotelResult)
async function tboHotelSearch(searchBody) {
  const tokenId = await authenticate();

  const payload = {
    ...searchBody,
    EndUserIp: process.env.TBO_END_USER_IP,
    TokenId: tokenId,
  };

  console.log("🏨 Calling TBO GetHotelResult...");

  const res = await axios.post(process.env.TBO_HOTEL_SEARCH_URL, payload, {
    headers: { "Content-Type": "application/json" },
  });

  return res.data;
}

// Live Hotel Room Details (GetHotelRoom)
async function tboGetHotelRoom(roomBody) {
  const tokenId = await authenticate();

  const payload = {
    ...roomBody,
    EndUserIp: process.env.TBO_END_USER_IP,
    TokenId: tokenId,
  };

  console.log("🛏  Calling TBO GetHotelRoom...");

  const res = await axios.post(process.env.TBO_HOTEL_ROOM_URL, payload, {
    headers: { "Content-Type": "application/json" },
  });

  return res.data;
}

module.exports = {
  tboHotelSearch,
  tboGetHotelRoom,
};
