/**
 * TBO Voucher Routes
 * 
 * Handles voucher generation and booking details retrieval
 */

const express = require('express');
const router = express.Router();
const { generateVoucher, getBookingDetails } = require('../../tbo/voucher');

/**
 * POST /api/tbo/voucher/generate
 * Generate hotel booking voucher
 * 
 * Request body:
 * {
 *   bookingId: string,
 *   bookingRefNo: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   voucherURL: string,
 *   bookingId: string,
 *   bookingRefNo: string,
 *   responseStatus: number
 * }
 */
router.post('/generate', async (req, res) => {
  try {
    const { bookingId, bookingRefNo } = req.body;

    // Validate required fields
    if (!bookingId || !bookingRefNo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, bookingRefNo'
      });
    }

    const result = await generateVoucher({
      bookingId: String(bookingId),
      bookingRefNo: String(bookingRefNo)
    });

    if (!result || !result.voucherURL) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate voucher',
        details: result
      });
    }

    res.json({
      success: true,
      voucherURL: result.voucherURL,
      bookingId: result.bookingId,
      bookingRefNo: result.bookingRefNo,
      responseStatus: result.responseStatus
    });

  } catch (error) {
    console.error('TBO Voucher Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

/**
 * POST /api/tbo/voucher/details
 * Get booking details
 * 
 * Request body:
 * {
 *   bookingId: string,
 *   bookingRefNo: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   bookingId: string,
 *   bookingRefNo: string,
 *   confirmationNo: string,
 *   status: string,
 *   hotelDetails: {...}
 * }
 */
router.post('/details', async (req, res) => {
  try {
    const { bookingId, bookingRefNo } = req.body;

    // At least one identifier required
    if (!bookingId && !bookingRefNo) {
      return res.status(400).json({
        success: false,
        error: 'Either bookingId or bookingRefNo is required'
      });
    }

    const result = await getBookingDetails({
      bookingId: bookingId ? String(bookingId) : undefined,
      bookingRefNo: bookingRefNo ? String(bookingRefNo) : undefined
    });

    if (!result || !result.responseStatus) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve booking details',
        details: result
      });
    }

    res.json({
      success: true,
      bookingId: result.bookingId,
      bookingRefNo: result.bookingRefNo,
      confirmationNo: result.confirmationNo,
      status: result.status,
      responseStatus: result.responseStatus,
      hotelDetails: result.hotelDetails
    });

  } catch (error) {
    console.error('TBO Booking Details Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

module.exports = router;
