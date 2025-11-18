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

    // Save booking to database
    let bookingRecord = null;
    try {
      // Extract pricing information from hotelRoomDetails
      let blockPrice = null;
      let blockCurrency = null;
      if (Array.isArray(result.hotelRoomDetails) && result.hotelRoomDetails.length > 0) {
        const firstRoom = result.hotelRoomDetails[0];
        if (firstRoom.price) {
          blockPrice = firstRoom.price.offeredPrice || firstRoom.price.publishedPrice;
          blockCurrency = firstRoom.price.currencyCode;
        }
      }

      const bookingData = {
        trace_id: traceId,
        result_index: resultIndex,
        hotel_code: hotelCode,
        hotel_name: hotelName,
        block_price: blockPrice,
        block_currency: blockCurrency,
        block_status: result.responseStatus === 1 ? 'success' : 'failed',
        price_changed_in_block: result.isPriceChanged || false,
        supplier_response: result,
        room_config: JSON.stringify(hotelRoomDetails),
      };

      const saveResult = await TBOHotelBooking.create(bookingData);
      if (saveResult.success) {
        bookingRecord = saveResult.data;
      } else {
        console.error("Warning: Failed to save booking record:", saveResult.error);
      }
    } catch (dbError) {
      console.error("Error saving booking to database:", dbError);
      // Continue anyway - don't fail the API response
    }

    res.json({
      success: true,
      bookingId: bookingRecord?.id || null,
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
