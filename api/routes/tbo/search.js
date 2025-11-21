/**
 * TBO Hotel Search Route
 *
 * Handles hotel search with dynamic CityId resolution
 * Endpoint: POST /api/tbo/search
 */

const express = require("express");
const router = express.Router();
const { searchHotels } = require("../../tbo/search");
const TBOHotelRateHistory = require("../../models/TBOHotelRateHistory");

/**
 * POST /api/tbo/search
 * Search hotels
 *
 * Request body:
 * {
 *   destination: string,
 *   countryCode: string,
 *   checkIn: string (YYYY-MM-DD),
 *   checkOut: string (YYYY-MM-DD),
 *   rooms: [{ adults: number, children: number, childAges: number[] }],
 *   currency: string (default: "USD"),
 *   guestNationality: string (default: "AE")
 * }
 *
 * Response:
 * {
 *   success: true,
 *   traceId: string,
 *   cityId: number,
 *   checkInDate: string,
 *   checkOutDate: string,
 *   hotels: [{
 *     hotelCode: string,
 *     hotelName: string,
 *     starRating: number,
 *     price: {
 *       currencyCode: string,
 *       publishedPrice: number,
 *       offeredPrice: number
 *     },
 *     resultIndex: number,
 *     ...
 *   }]
 * }
 */
router.post("/", async (req, res) => {
  try {
    const {
      destination,
      countryCode = "AE",
      checkIn,
      checkOut,
      rooms = [{ adults: 2, children: 0, childAges: [] }],
      currency = "USD",
      guestNationality = "AE",
    } = req.body;

    // Validate required fields
    if (!destination || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: destination, checkIn, checkOut",
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const result = await searchHotels({
      destination,
      countryCode,
      checkIn,
      checkOut,
      rooms,
      currency,
      guestNationality,
    });

    // Normalize hotels to standard format
    const normalizedHotels = (result.hotels || []).map((hotel, index) => ({
      resultIndex: index,
      hotelCode: hotel.HotelCode || hotel.hotelCode,
      hotelName: hotel.HotelName || hotel.hotelName || "Unknown Hotel",
      starRating: hotel.StarRating || hotel.starRating,
      price: {
        currencyCode:
          hotel.Price?.CurrencyCode || hotel.CurrencyCode || currency,
        publishedPrice: hotel.Price?.PublishedPrice || hotel.PublishedPrice,
        offeredPrice: hotel.Price?.OfferedPrice || hotel.OfferedPrice,
      },
      checkInDate: result.checkInDate,
      checkOutDate: result.checkOutDate,
      // Pass through original hotel data for downstream use
      ...hotel,
    }));

    res.json({
      success: true,
      traceId: result.traceId,
      cityId: result.cityId,
      checkInDate: result.checkInDate,
      checkOutDate: result.checkOutDate,
      currency: result.currency,
      noOfRooms: result.noOfRooms,
      hotels: normalizedHotels,
    });
  } catch (error) {
    console.error("TBO Hotel Search Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

module.exports = router;
