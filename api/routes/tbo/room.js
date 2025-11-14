/**
 * TBO Hotel Room Details Route
 *
 * Handles room details retrieval
 * Endpoint: POST /api/tbo/room
 */

const express = require("express");
const router = express.Router();
const { getHotelRoom } = require("../../tbo/room");

/**
 * POST /api/tbo/room
 * Get hotel room details
 *
 * Request body:
 * {
 *   traceId: string,
 *   resultIndex: number,
 *   hotelCode: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   traceId: string,
 *   rooms: [{
 *     roomTypeName: string,
 *     roomTypeCode: string,
 *     rateKey: string,
 *     ratePlanCode: string,
 *     infosource: string,
 *     roomIndex: number,
 *     price: {
 *       currencyCode: string,
 *       publishedPrice: number,
 *       offeredPrice: number,
 *       agentCommission: number,
 *       agentMarkUp: number,
 *       serviceTax: number,
 *       tds: number
 *     },
 *     lastCancellationDate: string,
 *     cancellationPolicy: string,
 *     cancellationPolicies: [],
 *     inclusions: [],
 *     ...
 *   }],
 *   isUnderCancellationAllowed: boolean,
 *   isPolicyPerStay: boolean,
 *   isPassportMandatory: boolean,
 *   isPANMandatory: boolean
 * }
 */
router.post("/", async (req, res) => {
  try {
    const { traceId, resultIndex, hotelCode } = req.body;

    // Validate required fields
    if (!traceId || !resultIndex || !hotelCode) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: traceId, resultIndex, hotelCode",
      });
    }

    const result = await getHotelRoom({
      traceId,
      resultIndex: Number(resultIndex),
      hotelCode: String(hotelCode),
    });

    if (!result || !result.responseStatus) {
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve room details",
        details: result,
      });
    }

    res.json({
      success: true,
      traceId: result.traceId,
      rooms: result.rooms,
      isUnderCancellationAllowed: result.isUnderCancellationAllowed,
      isPolicyPerStay: result.isPolicyPerStay,
      isPassportMandatory: result.isPassportMandatory,
      isPANMandatory: result.isPANMandatory,
    });
  } catch (error) {
    console.error("TBO Room Details Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
});

module.exports = router;
