/**
 * TBO Hotel Booking Route
 * 
 * Handles final hotel booking confirmation
 * Endpoint: POST /api/tbo/book
 */

const express = require('express');
const router = express.Router();
const { bookHotel } = require('../../tbo/book');

/**
 * POST /api/tbo/book
 * Confirm hotel booking
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
 *   hotelRoomDetails: [...],  // Room details from BlockRoom
 *   hotelPassenger: [{        // Passenger details
 *     Title: string,
 *     FirstName: string,
 *     LastName: string,
 *     PaxType: number,        // 1=Adult, 2=Child
 *     Age: number,
 *     PassportNo: string,
 *     PassportIssueDate: string,
 *     PassportExpDate: string,
 *     Email: string,
 *     Phoneno: string,
 *     AddressLine1: string,
 *     City: string,
 *     CountryCode: string,
 *     CountryName: string,
 *     Nationality: string
 *   }]
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   bookingId: string,
 *   confirmationNo: string,
 *   bookingRefNo: string,
 *   status: string,
 *   responseStatus: number,
 *   isPriceChanged: boolean,
 *   hotelBookingDetails: {...}
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      traceId,
      resultIndex,
      hotelCode,
      hotelName,
      guestNationality = 'AE',
      noOfRooms = 1,
      isVoucherBooking = true,
      hotelRoomDetails,
      hotelPassenger
    } = req.body;

    // Validate required fields
    if (!traceId || !resultIndex || !hotelCode || !hotelRoomDetails || !hotelPassenger) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: traceId, resultIndex, hotelCode, hotelRoomDetails, hotelPassenger'
      });
    }

    if (!Array.isArray(hotelPassenger) || hotelPassenger.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'hotelPassenger must be a non-empty array'
      });
    }

    // Validate passenger details
    const requiredPassengerFields = ['Title', 'FirstName', 'LastName', 'Email', 'Phoneno'];
    for (const passenger of hotelPassenger) {
      for (const field of requiredPassengerFields) {
        if (!passenger[field]) {
          return res.status(400).json({
            success: false,
            error: `Missing passenger field: ${field}`
          });
        }
      }
    }

    const result = await bookHotel({
      traceId,
      resultIndex: Number(resultIndex),
      hotelCode: String(hotelCode),
      hotelName,
      guestNationality,
      noOfRooms: Number(noOfRooms),
      isVoucherBooking,
      hotelRoomDetails,
      hotelPassenger
    });

    if (!result || !result.bookingId) {
      return res.status(500).json({
        success: false,
        error: 'Booking failed',
        details: result
      });
    }

    res.json({
      success: true,
      bookingId: result.bookingId,
      confirmationNo: result.confirmationNo,
      bookingRefNo: result.bookingRefNo,
      status: result.status,
      responseStatus: result.responseStatus,
      isPriceChanged: result.isPriceChanged,
      hotelBookingDetails: result.hotelBookingDetails
    });

  } catch (error) {
    console.error('TBO Booking Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

module.exports = router;
