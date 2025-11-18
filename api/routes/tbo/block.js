/**
 * TBO Block Room Route
 *
 * Handles pre-booking room validation
 * Endpoint: POST /api/tbo/block
 */

const express = require("express");
const router = express.Router();
const { blockRoom } = require("../../tbo/book");
const TBOHotelBooking = require("../../models/TBOHotelBooking");
const TBOHotelRateHistory = require("../../models/TBOHotelRateHistory");

/**
 * POST /api/tbo/block
 * Block (pre-book) a room to validate pricing
 *
 * Request body:
 * {
 *   traceId: string,
 *   resultIndex: number,
 *   hotelCode: string,
 *   hotelName: string,
 *   guestNationality: string,
 *   noOfRooms: number,
 *   isVoucherBooking: boolean,
 *   hotelRoomDetails: [...]  // Room details from GetHotelRoom
 * }
 *
 * Response:
 * {
 *   success: true,
 *   responseStatus: number,
 *   isPriceChanged: boolean,
 *   isCancellationPolicyChanged: boolean,
 *   availabilityType: string,
 *   hotelRoomDetails: [...]
 * }
 */
router.post("/", async (req, res) => {
  try {
    const {
      traceId,
      resultIndex,
      hotelCode,
      hotelName,
      guestNationality = "AE",
      noOfRooms = 1,
      isVoucherBooking = true,
      hotelRoomDetails,
    } = req.body;

    // Validate required fields
    if (!traceId || !resultIndex || !hotelCode || !hotelRoomDetails) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: traceId, resultIndex, hotelCode, hotelRoomDetails",
      });
    }

    if (!Array.isArray(hotelRoomDetails) || hotelRoomDetails.length === 0) {
      return res.status(400).json({
        success: false,
        error: "hotelRoomDetails must be a non-empty array",
      });
    }

    const result = await blockRoom({
      traceId,
      resultIndex: Number(resultIndex),
      hotelCode: String(hotelCode),
      hotelName,
      guestNationality,
      noOfRooms: Number(noOfRooms),
      isVoucherBooking,
      hotelRoomDetails,
    });

    if (!result || !result.responseStatus) {
      return res.status(500).json({
        success: false,
        error: "Failed to block room",
        details: result,
      });
    }

    res.json({
      success: true,
      responseStatus: result.responseStatus,
      isPriceChanged: result.isPriceChanged,
      isCancellationPolicyChanged: result.isCancellationPolicyChanged,
      availabilityType: result.availabilityType,
      hotelRoomDetails: result.hotelRoomDetails,
    });
  } catch (error) {
    console.error("TBO Block Room Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

module.exports = router;
