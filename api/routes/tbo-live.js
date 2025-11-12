// api/routes/tbo-live.js
// Live TBO hotel search + room details

const express = require("express");
const fs = require("fs");
const {
  tboHotelSearch,
  tboGetHotelRoom,
} = require("../services/tbo-live-client");

const router = express.Router();

// POST /api/tbo/hotels/search
router.post("/hotels/search", async (req, res) => {
  try {
    const {
      checkInDate,
      noOfNights,
      countryCode,
      cityId,
      currency,
      guestNationality,
      rooms,
    } = req.body;

    const tboReq = {
      // As per TBO GetHotelResult JSON docs (dd/MM/yyyy)
      CheckInDate: checkInDate,
      NoOfNights: noOfNights,
      CountryCode: countryCode,
      CityId: cityId,
      ResultCount: null,
      PreferredCurrency: currency,
      GuestNationality: guestNationality,
      NoOfRooms: rooms.length,
      RoomGuests: rooms.map((r) => ({
        NoOfAdults: r.adults,
        NoOfChild: r.children,
        ChildAge: r.childAges && r.childAges.length ? r.childAges : null,
      })),
      MaxRating: 5,
      MinRating: 0,
      ReviewScore: null,
      IsNearBySearchAllowed: false,
    };

    const raw = await tboHotelSearch(tboReq);

    fs.writeFileSync(
      "tbo-hotel-search-response.json",
      JSON.stringify(raw, null, 2),
      "utf-8"
    );

    res.json(raw);
  } catch (err) {
    console.error("❌ Error in /api/tbo/hotels/search:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Body:", err.response.data);
    }
    res.status(500).json({ error: "TBO HotelSearch failed" });
  }
});

// POST /api/tbo/hotels/rooms
router.post("/hotels/rooms", async (req, res) => {
  try {
    const { traceId, resultIndex, hotelCode } = req.body;

    const tboReq = {
      TraceId: traceId,
      ResultIndex: resultIndex,
      HotelCode: hotelCode,
    };

    const raw = await tboGetHotelRoom(tboReq);

    fs.writeFileSync(
      "tbo-hotel-room-response.json",
      JSON.stringify(raw, null, 2),
      "utf-8"
    );

    res.json(raw);
  } catch (err) {
    console.error("❌ Error in /api/tbo/hotels/rooms:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Body:", err.response.data);
    }
    res.status(500).json({ error: "TBO GetHotelRoom failed" });
  }
});

module.exports = router;
