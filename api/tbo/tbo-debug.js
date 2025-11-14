// api/tbo/tbo-debug.js

const express = require("express");
const router = express.Router();
const axios = require("axios");
const dayjs = require("dayjs");

// ---------- Axios with optional Fixie proxy ----------
function buildAxios() {
  let agent;

  if (process.env.USE_SUPPLIER_PROXY === "true" && process.env.FIXIE_URL) {
    try {
      const HttpsProxyAgent = require("https-proxy-agent");
      agent = new HttpsProxyAgent(process.env.FIXIE_URL);
      console.log("🔌 Using Fixie proxy for TBO requests");
    } catch (err) {
      console.warn("⚠️ Unable to load proxy agent:", err.message);
    }
  }

  return axios.create({
    httpsAgent: agent,
    timeout: 60000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

const tboAxios = buildAxios();

// ---------- Auth helper ----------
async function authenticateTBO() {
  const authUrl = process.env.TBO_AUTH_URL;

  const body = {
    ClientId: process.env.TBO_CLIENT_ID,
    UserName: process.env.TBO_API_USER_ID,
    Password: process.env.TBO_API_PASSWORD,
    EndUserIp: process.env.TBO_END_USER_IP,
  };

  console.log("🔐 TBO AUTH →", authUrl, JSON.stringify(body));

  const res = await tboAxios.post(authUrl, body);
  return res.data;
}

// ---------- Debug Hotel Search ----------
router.post("/hotel-search", async (req, res) => {
  try {
    const {
      checkIn, // "dd/MM/yyyy"
      checkOut, // "dd/MM/yyyy"
      countryCode,
      cityId,
      rooms,
      preferredCurrency,
      guestNationality,
    } = req.body;

    // 1) Auth
    const auth = await authenticateTBO();
    const tokenId = auth.TokenId;

    if (!tokenId) {
      return res.status(500).json({
        error: true,
        message: "TBO Auth did not return TokenId",
        rawAuth: auth,
      });
    }

    // 2) Nights
    const noOfNights =
      dayjs(checkOut, "DD/MM/YYYY").diff(dayjs(checkIn, "DD/MM/YYYY"), "day") ||
      1;

    // 3) Payload per GetHotelResult spec
    const payload = {
      CheckInDate: checkIn,
      NoOfNights: noOfNights,
      CountryCode: countryCode || "AE",
      CityId: cityId || 130443,
      ResultCount: null,
      PreferredCurrency: preferredCurrency || "INR",
      GuestNationality: guestNationality || "IN",
      NoOfRooms: rooms?.length || 1,
      RoomGuests:
        rooms && rooms.length
          ? rooms
          : [
              {
                NoOfAdults: 2,
                NoOfChild: 0,
                ChildAge: null,
              },
            ],
      MaxRating: 5,
      MinRating: 0,
      ReviewScore: null,
      IsNearBySearchAllowed: false,
      EndUserIp: process.env.TBO_END_USER_IP,
      TokenId: tokenId,
    };

    const searchUrl = process.env.TBO_HOTEL_SEARCH_URL;

    console.log("🏨 TBO GetHotelResult →", searchUrl);
    console.log("📤 Request:", JSON.stringify(payload, null, 2));

    const searchRes = await tboAxios.post(searchUrl, payload);

    console.log(
      "📥 Response Status:",
      searchRes.status,
      searchRes.data?.HotelSearchResult?.ResponseStatus,
    );

    return res.json({
      auth,
      requestSent: payload,
      response: searchRes.data,
    });
  } catch (err) {
    console.error(
      "❌ TBO Debug hotel-search Error:",
      err.response?.data || err.message,
    );
    return res.status(500).json({
      error: true,
      message: "TBO Debug hotel-search failed",
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
