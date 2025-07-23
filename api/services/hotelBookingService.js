/**
 * Hotelbeds Booking Service
 * Handles hotel booking operations with Hotelbeds API
 */

const hotelbedsService = require('./hotelbedsService');
const markupService = require('./markupService');
const emailService = require('./emailService');
const { v4: uuidv4 } = require('uuid');

class HotelBookingService {
  constructor() {
    this.bookings = new Map(); // In production, this would be database
    this.pendingBookings = new Map(); // Temporary storage for payment pending bookings
  }

  /**
   * Pre-book hotel (hold inventory during payment)
   */
  async preBookHotel(bookingData) {
    try {
      const {
        hotelCode,
        roomCode,
        rateKey,
        checkIn,
        checkOut,
        rooms,
        guestDetails,
        contactInfo,
        specialRequests,
        totalAmount,
        currency = 'INR'
      } = bookingData;

      // Generate temporary booking reference
      const tempBookingRef = `TEMP_${uuidv4().substring(0, 8).toUpperCase()}`;

      // Validate guest details
      const validationResult = this.validateGuestDetails(guestDetails);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Create pre-booking record
      const preBooking = {
        tempBookingRef,
        hotelCode,
        roomCode,
        rateKey,
        checkIn,
        checkOut,
        rooms,
        guestDetails,
        contactInfo,
        specialRequests,
        totalAmount,
        currency,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        paymentStatus: 'pending'
      };

      // Store temporarily
      this.pendingBookings.set(tempBookingRef, preBooking);

      // Set auto-cleanup
      setTimeout(() => {
        this.pendingBookings.delete(tempBookingRef);
      }, 15 * 60 * 1000); // 15 minutes

      return {
        success: true,
        tempBookingRef,
        expiresAt: preBooking.expiresAt,
        totalAmount,
        currency
      };

    } catch (error) {
      console.error('Pre-booking error:', error);
      throw new Error(`Pre-booking failed: ${error.message}`);
    }
  }

  /**
   * Confirm booking after successful payment
   */
  async confirmBooking(tempBookingRef, paymentDetails) {
    try {
      const preBooking = this.pendingBookings.get(tempBookingRef);
      
      if (!preBooking) {
        throw new Error('Pre-booking not found or expired');
      }

      if (new Date() > new Date(preBooking.expiresAt)) {
        this.pendingBookings.delete(tempBookingRef);
        throw new Error('Pre-booking has expired');
      }

      // Prepare Hotelbeds booking request
      const hotelbedsBookingRequest = {
        clientReference: tempBookingRef,
        holder: {
          name: preBooking.guestDetails.primaryGuest.firstName,
          surname: preBooking.guestDetails.primaryGuest.lastName,
          email: preBooking.contactInfo.email,
          phoneNumber: preBooking.contactInfo.phone
        },
        stay: {
          checkIn: preBooking.checkIn,
          checkOut: preBooking.checkOut
        },
        occupancies: preBooking.rooms.map(room => ({
          rooms: 1,
          adults: room.adults,
          children: room.children,
          childrenAges: room.childrenAges || []
        })),
        hotel: {
          code: preBooking.hotelCode
        },
        rooms: [{
          rateKey: preBooking.rateKey,
          roomCode: preBooking.roomCode
        }],
        remark: preBooking.specialRequests || 'Booking via Faredown'
      };

      // Make booking with Hotelbeds
      const hotelbedsResponse = await this.makeHotelbedsBooking(hotelbedsBookingRequest);
      
      if (!hotelbedsResponse.success) {
        throw new Error(`Hotelbeds booking failed: ${hotelbedsResponse.error}`);
      }

      // Generate final booking reference
      const finalBookingRef = `FD${Date.now().toString().slice(-8).toUpperCase()}`;

      // Create confirmed booking record
      const confirmedBooking = {
        ...preBooking,
        bookingRef: finalBookingRef,
        hotelbedsBookingRef: hotelbedsResponse.bookingReference,
        hotelbedsConfirmationNumber: hotelbedsResponse.confirmationNumber,
        status: 'confirmed',
        paymentDetails: {
          razorpayPaymentId: paymentDetails.razorpay_payment_id,
          razorpayOrderId: paymentDetails.razorpay_order_id,
          razorpaySignature: paymentDetails.razorpay_signature,
          method: paymentDetails.method,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          paidAt: new Date().toISOString()
        },
        confirmedAt: new Date().toISOString(),
        hotelbedsDetails: hotelbedsResponse.bookingDetails
      };

      // Store confirmed booking
      this.bookings.set(finalBookingRef, confirmedBooking);

      // Remove from pending
      this.pendingBookings.delete(tempBookingRef);

      // Send confirmation email (don't wait for it)
      this.sendBookingConfirmationEmail(confirmedBooking).catch(error => {
        console.error('Failed to send booking confirmation email:', error);
      });

      return {
        success: true,
        bookingRef: finalBookingRef,
        confirmationNumber: hotelbedsResponse.confirmationNumber,
        booking: confirmedBooking
      };

    } catch (error) {
      console.error('Booking confirmation error:', error);
      throw new Error(`Booking confirmation failed: ${error.message}`);
    }
  }

  /**
   * Make actual booking with Hotelbeds API
   */
  async makeHotelbedsBooking(bookingRequest) {
    try {
      // Mock Hotelbeds booking API call
      // In production, this would make actual API call to Hotelbeds
      
      const response = await hotelbedsService.makeRequest(
        'bookings',
        'POST',
        bookingRequest,
        false
      );

      // Simulate successful booking response
      const mockResponse = {
        success: true,
        bookingReference: `HB${Date.now()}`,
        confirmationNumber: `CNF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'CONFIRMED',
        bookingDetails: {
          hotel: {
            code: bookingRequest.hotel.code,
            name: 'Sample Hotel Name'
          },
          rooms: bookingRequest.rooms,
          stay: bookingRequest.stay,
          totalAmount: bookingRequest.totalAmount || 5000,
          currency: 'EUR'
        }
      };

      return mockResponse;

    } catch (error) {
      console.error('Hotelbeds booking API error:', error);
      return {
        success: false,
        error: error.message || 'Unknown booking error'
      };
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingRef, reason = 'Customer request') {
    try {
      const booking = this.bookings.get(bookingRef);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      // Check cancellation policy
      const cancellationAllowed = this.checkCancellationPolicy(booking);
      if (!cancellationAllowed.allowed) {
        throw new Error(`Cancellation not allowed: ${cancellationAllowed.reason}`);
      }

      // Update booking status
      booking.status = 'cancelled';
      booking.cancelledAt = new Date().toISOString();
      booking.cancellationReason = reason;
      booking.refundAmount = cancellationAllowed.refundAmount;

      return {
        success: true,
        booking,
        refundAmount: cancellationAllowed.refundAmount
      };

    } catch (error) {
      console.error('Booking cancellation error:', error);
      throw new Error(`Cancellation failed: ${error.message}`);
    }
  }

  /**
   * Get booking details
   */
  getBooking(bookingRef) {
    return this.bookings.get(bookingRef) || null;
  }

  /**
   * Get pre-booking details
   */
  getPreBooking(tempBookingRef) {
    return this.pendingBookings.get(tempBookingRef) || null;
  }

  /**
   * Get user bookings
   */
  getUserBookings(userId, limit = 10, offset = 0) {
    const userBookings = Array.from(this.bookings.values())
      .filter(booking => booking.guestDetails?.primaryGuest?.email?.includes(userId))
      .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt))
      .slice(offset, offset + limit);

    return {
      bookings: userBookings,
      total: userBookings.length,
      hasMore: userBookings.length === limit
    };
  }

  /**
   * Validate guest details
   */
  validateGuestDetails(guestDetails) {
    const errors = [];

    if (!guestDetails.primaryGuest) {
      errors.push('Primary guest details are required');
    } else {
      const primary = guestDetails.primaryGuest;
      if (!primary.firstName) errors.push('Primary guest first name is required');
      if (!primary.lastName) errors.push('Primary guest last name is required');
    }

    if (!guestDetails.contactInfo) {
      errors.push('Contact information is required');
    } else {
      const contact = guestDetails.contactInfo;
      if (!contact.email) errors.push('Email is required');
      if (!contact.phone) errors.push('Phone number is required');
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (contact.email && !emailRegex.test(contact.email)) {
        errors.push('Valid email address is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check cancellation policy
   */
  checkCancellationPolicy(booking) {
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));

    // Sample cancellation policy
    if (daysUntilCheckIn >= 7) {
      return {
        allowed: true,
        refundAmount: booking.totalAmount * 0.9, // 90% refund
        reason: 'Free cancellation'
      };
    } else if (daysUntilCheckIn >= 3) {
      return {
        allowed: true,
        refundAmount: booking.totalAmount * 0.5, // 50% refund
        reason: 'Partial refund'
      };
    } else {
      return {
        allowed: false,
        refundAmount: 0,
        reason: 'No refund within 3 days of check-in'
      };
    }
  }

  /**
   * Get booking statistics
   */
  getBookingStats() {
    const allBookings = Array.from(this.bookings.values());
    const pendingBookings = Array.from(this.pendingBookings.values());

    return {
      totalBookings: allBookings.length,
      confirmedBookings: allBookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: allBookings.filter(b => b.status === 'cancelled').length,
      pendingPayment: pendingBookings.length,
      totalRevenue: allBookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      averageBookingValue: allBookings.length > 0 
        ? allBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) / allBookings.length 
        : 0
    };
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmationEmail(booking) {
    try {
      await emailService.sendBookingConfirmation(booking);
      console.log(`Booking confirmation email sent for ${booking.bookingRef}`);
    } catch (error) {
      console.error(`Failed to send booking confirmation email for ${booking.bookingRef}:`, error);
    }
  }

  /**
   * Cleanup expired pre-bookings
   */
  cleanupExpiredBookings() {
    const now = new Date();
    for (const [ref, booking] of this.pendingBookings.entries()) {
      if (new Date(booking.expiresAt) <= now) {
        this.pendingBookings.delete(ref);
      }
    }
  }
}

module.exports = new HotelBookingService();
