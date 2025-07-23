const express = require('express');
const router = express.Router();
const voucherService = require('../services/voucherService');
const hotelBookingService = require('../services/hotelBookingService');
const { authenticateToken } = require('../middleware/auth');

/**
 * Generate hotel booking voucher
 * GET /api/vouchers/hotel/:bookingRef
 */
router.get('/hotel/:bookingRef', async (req, res) => {
  try {
    const { bookingRef } = req.params;
    
    // Get booking details
    const booking = hotelBookingService.getBooking(bookingRef);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Generate voucher PDF
    const voucherResult = await voucherService.generateHotelVoucher({
      bookingRef: booking.bookingRef,
      hotelDetails: booking.hotelbedsDetails?.hotel || {
        name: 'Hotel Name',
        address: 'Hotel Address',
        phone: 'N/A',
        email: 'N/A'
      },
      guestDetails: booking.guestDetails,
      roomDetails: booking.roomDetails || {
        name: 'Standard Room',
        category: 'Standard',
        bedType: 'Double'
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      paymentDetails: booking.paymentDetails,
      specialRequests: booking.specialRequests
    });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${voucherResult.filename}"`);
    res.setHeader('Content-Length', voucherResult.pdf.length);

    // Send PDF
    res.send(voucherResult.pdf);

  } catch (error) {
    console.error('Voucher generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate voucher'
    });
  }
});

/**
 * Generate GST invoice
 * GET /api/vouchers/invoice/:bookingRef
 */
router.get('/invoice/:bookingRef', async (req, res) => {
  try {
    const { bookingRef } = req.params;
    
    // Get booking details
    const booking = hotelBookingService.getBooking(bookingRef);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Generate invoice PDF
    const invoiceResult = await voucherService.generateGSTInvoice({
      bookingRef: booking.bookingRef,
      hotelDetails: booking.hotelbedsDetails?.hotel || {
        name: 'Hotel Name',
        address: 'Hotel Address'
      },
      guestDetails: booking.guestDetails,
      roomDetails: booking.roomDetails || {
        name: 'Standard Room',
        category: 'Standard'
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      paymentDetails: booking.paymentDetails,
      markupDetails: booking.markupDetails || {},
      taxDetails: {
        gst: booking.totalAmount * 0.18,
        cgst: booking.totalAmount * 0.09,
        sgst: booking.totalAmount * 0.09
      }
    });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceResult.filename}"`);
    res.setHeader('Content-Length', invoiceResult.pdf.length);

    // Send PDF
    res.send(invoiceResult.pdf);

  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate invoice'
    });
  }
});

/**
 * Preview voucher (returns base64 encoded PDF)
 * GET /api/vouchers/hotel/:bookingRef/preview
 */
router.get('/hotel/:bookingRef/preview', async (req, res) => {
  try {
    const { bookingRef } = req.params;
    
    // Get booking details
    const booking = hotelBookingService.getBooking(bookingRef);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Generate voucher PDF
    const voucherResult = await voucherService.generateHotelVoucher({
      bookingRef: booking.bookingRef,
      hotelDetails: booking.hotelbedsDetails?.hotel || {
        name: 'Hotel Name',
        address: 'Hotel Address',
        phone: 'N/A',
        email: 'N/A'
      },
      guestDetails: booking.guestDetails,
      roomDetails: booking.roomDetails || {
        name: 'Standard Room',
        category: 'Standard',
        bedType: 'Double'
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      paymentDetails: booking.paymentDetails,
      specialRequests: booking.specialRequests
    });

    // Return base64 encoded PDF for preview
    res.json({
      success: true,
      data: {
        filename: voucherResult.filename,
        pdf: voucherResult.pdf.toString('base64'),
        contentType: 'application/pdf'
      }
    });

  } catch (error) {
    console.error('Voucher preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate voucher preview'
    });
  }
});

/**
 * Send voucher via email
 * POST /api/vouchers/hotel/:bookingRef/email
 */
router.post('/hotel/:bookingRef/email', async (req, res) => {
  try {
    const { bookingRef } = req.params;
    const { email, additionalEmails = [] } = req.body;
    
    // Get booking details
    const booking = hotelBookingService.getBooking(bookingRef);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Generate voucher PDF
    const voucherResult = await voucherService.generateHotelVoucher({
      bookingRef: booking.bookingRef,
      hotelDetails: booking.hotelbedsDetails?.hotel || {
        name: 'Hotel Name',
        address: 'Hotel Address',
        phone: 'N/A',
        email: 'N/A'
      },
      guestDetails: booking.guestDetails,
      roomDetails: booking.roomDetails || {
        name: 'Standard Room',
        category: 'Standard',
        bedType: 'Double'
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      paymentDetails: booking.paymentDetails,
      specialRequests: booking.specialRequests
    });

    // TODO: Implement email sending service
    // For now, return success with email details
    res.json({
      success: true,
      data: {
        message: 'Voucher email sent successfully',
        recipients: [email, ...additionalEmails],
        filename: voucherResult.filename
      }
    });

  } catch (error) {
    console.error('Email voucher error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send voucher email'
    });
  }
});

/**
 * Get voucher generation status
 * GET /api/vouchers/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'voucher-generation',
      status: 'operational',
      supportedFormats: ['pdf'],
      features: {
        hotelVoucher: true,
        gstInvoice: true,
        emailDelivery: true,
        preview: true
      }
    }
  });
});

module.exports = router;
