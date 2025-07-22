/**
 * Booking Management Routes
 * Handles all booking operations - flights, hotels, cancellations, modifications
 */

const express = require('express');
const router = express.Router();
const { requirePermission, PERMISSIONS } = require('../middleware/auth');
const { validate, validatePagination, validateId } = require('../middleware/validation');
const { audit } = require('../middleware/audit');

// Mock booking database
const mockBookings = new Map([
  ['FD001', {
    id: 'FD001',
    type: 'flight',
    status: 'confirmed',
    customerId: 'user_001',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    customerPhone: '+91 98765 43210',
    details: {
      from: 'BOM',
      fromCity: 'Mumbai',
      to: 'DXB', 
      toCity: 'Dubai',
      departureDate: '2025-02-15',
      returnDate: '2025-02-20',
      airline: 'Emirates',
      flightNumber: 'EK-215',
      class: 'economy',
      passengers: [
        { firstName: 'John', lastName: 'Doe', type: 'adult' }
      ]
    },
    amount: 25890,
    currency: 'INR',
    paymentMethod: 'credit_card',
    paymentStatus: 'completed',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    bargained: true,
    originalPrice: 28900,
    specialRequests: 'Aisle seat preferred',
    confirmationNumber: 'FD001-CONF'
  }],
  ['HD002', {
    id: 'HD002',
    type: 'hotel',
    status: 'pending',
    customerId: 'user_002',
    customerName: 'Jane Smith',
    customerEmail: 'jane.smith@example.com',
    customerPhone: '+91 87654 32109',
    details: {
      hotelId: 'hotel_001',
      hotelName: 'Grand Hyatt Dubai',
      city: 'Dubai',
      checkIn: '2025-02-10',
      checkOut: '2025-02-15',
      nights: 5,
      rooms: 1,
      guests: 2,
      roomType: 'Deluxe King Room'
    },
    amount: 45500,
    currency: 'INR',
    paymentMethod: 'pay_at_hotel',
    paymentStatus: 'pending',
    createdAt: new Date('2025-01-18'),
    updatedAt: new Date('2025-01-18'),
    bargained: false,
    originalPrice: 45500,
    specialRequests: 'Late checkout requested',
    confirmationNumber: 'HD002-CONF'
  }],
  ['FD003', {
    id: 'FD003',
    type: 'flight',
    status: 'cancelled',
    customerId: 'user_003',
    customerName: 'Mike Johnson',
    customerEmail: 'mike.johnson@example.com',
    customerPhone: '+91 76543 21098',
    details: {
      from: 'DEL',
      fromCity: 'Delhi',
      to: 'LHR',
      toCity: 'London',
      departureDate: '2025-02-25',
      returnDate: '2025-03-05',
      airline: 'British Airways',
      flightNumber: 'BA-131',
      class: 'business',
      passengers: [
        { firstName: 'Mike', lastName: 'Johnson', type: 'adult' }
      ]
    },
    amount: 85600,
    currency: 'INR',
    paymentMethod: 'credit_card',
    paymentStatus: 'refunded',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-19'),
    cancelledAt: new Date('2025-01-19'),
    cancelReason: 'Customer request',
    refundAmount: 77040, // 90% refund
    bargained: true,
    originalPrice: 92000,
    confirmationNumber: 'FD003-CONF'
  }]
]);

/**
 * @api {get} /api/bookings Get All Bookings
 * @apiName GetBookings
 * @apiGroup Bookings
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * 
 * @apiQuery {String} [status] Filter by status (pending, confirmed, cancelled, completed)
 * @apiQuery {String} [type] Filter by type (flight, hotel)
 * @apiQuery {String} [customerId] Filter by customer ID
 * @apiQuery {String} [startDate] Filter by creation date (start)
 * @apiQuery {String} [endDate] Filter by creation date (end)
 * @apiQuery {String} [search] Search in booking details
 * @apiQuery {Number} [page=1] Page number
 * @apiQuery {Number} [limit=20] Items per page
 * @apiQuery {String} [sortBy=createdAt] Sort by field
 * @apiQuery {String} [sortOrder=desc] Sort order (asc, desc)
 * 
 * @apiSuccess {Array} bookings List of bookings
 * @apiSuccess {Object} pagination Pagination information
 * @apiSuccess {Object} summary Summary statistics
 */
router.get('/', validatePagination, async (req, res) => {
  try {
    const { 
      status, 
      type, 
      customerId, 
      startDate, 
      endDate, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    const { page, limit, offset } = req.pagination;
    
    // Convert Map to Array for filtering
    let bookings = Array.from(mockBookings.values());
    
    // Apply filters
    if (status) {
      bookings = bookings.filter(booking => booking.status === status);
    }
    
    if (type) {
      bookings = bookings.filter(booking => booking.type === type);
    }
    
    if (customerId) {
      bookings = bookings.filter(booking => booking.customerId === customerId);
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      bookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= start && bookingDate <= end;
      });
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      bookings = bookings.filter(booking => 
        booking.customerName.toLowerCase().includes(searchTerm) ||
        booking.customerEmail.toLowerCase().includes(searchTerm) ||
        booking.id.toLowerCase().includes(searchTerm) ||
        booking.confirmationNumber.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort bookings
    bookings.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return new Date(bValue) - new Date(aValue);
      } else {
        return new Date(aValue) - new Date(bValue);
      }
    });
    
    // Calculate summary
    const summary = {
      total: bookings.length,
      byStatus: {
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        completed: bookings.filter(b => b.status === 'completed').length
      },
      byType: {
        flight: bookings.filter(b => b.type === 'flight').length,
        hotel: bookings.filter(b => b.type === 'hotel').length
      },
      totalRevenue: bookings.reduce((sum, b) => sum + (b.status !== 'cancelled' ? b.amount : 0), 0),
      averageBookingValue: bookings.length > 0 
        ? Math.round(bookings.reduce((sum, b) => sum + b.amount, 0) / bookings.length)
        : 0
    };
    
    // Paginate results
    const total = bookings.length;
    const paginatedBookings = bookings.slice(offset, offset + limit);
    
    // Log booking view access
    await audit.bookingAction(req, 'view', 'multiple', { 
      filters: { status, type, customerId, search },
      resultCount: total 
    });
    
    res.json({
      success: true,
      data: {
        bookings: paginatedBookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary,
        filters: { status, type, customerId, startDate, endDate, search }
      }
    });
    
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

/**
 * @api {get} /api/bookings/:id Get Booking Details
 * @apiName GetBooking
 * @apiGroup Bookings
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} id Booking ID
 * 
 * @apiSuccess {Object} booking Booking details
 */
router.get('/:id', validateId(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = mockBookings.get(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Log booking view
    await audit.bookingAction(req, 'view', id);
    
    res.json({
      success: true,
      data: booking
    });
    
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details'
    });
  }
});

/**
 * @api {post} /api/bookings Create New Booking
 * @apiName CreateBooking
 * @apiGroup Bookings
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} type Booking type (flight, hotel)
 * @apiParam {String} customerId Customer ID
 * @apiParam {Object} details Booking details
 * @apiParam {Number} amount Booking amount
 * @apiParam {String} [currency=INR] Currency code
 * @apiParam {String} [paymentMethod] Payment method
 * @apiParam {String} [specialRequests] Special requests
 * 
 * @apiSuccess {Object} booking Created booking
 */
router.post('/', 
  requirePermission(PERMISSIONS.BOOKING_CREATE),
  validate.createBooking,
  async (req, res) => {
    try {
      const { type, customerId, details, amount, currency, paymentMethod, specialRequests } = req.body;
      
      // Generate booking ID
      const bookingId = `${type === 'flight' ? 'FD' : 'HD'}${Date.now().toString().slice(-6)}`;
      
      // Create new booking
      const newBooking = {
        id: bookingId,
        type,
        status: 'pending',
        customerId,
        customerName: details.customerName || 'Guest User',
        customerEmail: details.customerEmail || 'guest@faredown.com',
        customerPhone: details.customerPhone || '',
        details,
        amount,
        currency: currency || 'INR',
        paymentMethod: paymentMethod || 'credit_card',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        bargained: false,
        originalPrice: amount,
        specialRequests: specialRequests || '',
        confirmationNumber: `${bookingId}-CONF`,
        createdBy: req.user.username
      };
      
      // Save booking
      mockBookings.set(bookingId, newBooking);
      
      // Log booking creation
      await audit.bookingAction(req, 'create', bookingId, newBooking);
      
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: newBooking
      });
      
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking'
      });
    }
  }
);

/**
 * @api {put} /api/bookings/:id Update Booking
 * @apiName UpdateBooking
 * @apiGroup Bookings
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} id Booking ID
 * @apiParam {String} [status] Booking status
 * @apiParam {Number} [amount] Updated amount
 * @apiParam {String} [specialRequests] Special requests
 * @apiParam {String} [notes] Admin notes
 * 
 * @apiSuccess {Object} booking Updated booking
 */
router.put('/:id', 
  validateId(),
  requirePermission(PERMISSIONS.BOOKING_UPDATE),
  validate.updateBooking,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const booking = mockBookings.get(id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      // Store original booking for audit
      const originalBooking = { ...booking };
      
      // Update booking
      const updatedBooking = {
        ...booking,
        ...updates,
        updatedAt: new Date(),
        updatedBy: req.user.username
      };
      
      // Special handling for status changes
      if (updates.status && updates.status !== booking.status) {
        updatedBooking.statusChangedAt = new Date();
        updatedBooking.statusChangedBy = req.user.username;
        
        if (updates.status === 'cancelled') {
          updatedBooking.cancelledAt = new Date();
          updatedBooking.cancelledBy = req.user.username;
        }
      }
      
      // Save updated booking
      mockBookings.set(id, updatedBooking);
      
      // Log booking update
      await audit.bookingAction(req, 'update', id, {
        original: originalBooking,
        updated: updatedBooking,
        changes: updates
      });
      
      res.json({
        success: true,
        message: 'Booking updated successfully',
        data: updatedBooking
      });
      
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update booking'
      });
    }
  }
);

/**
 * @api {post} /api/bookings/:id/cancel Cancel Booking
 * @apiName CancelBooking
 * @apiGroup Bookings
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} id Booking ID
 * @apiParam {String} reason Cancellation reason
 * @apiParam {Boolean} [refund=true] Process refund
 * @apiParam {Number} [refundPercentage=100] Refund percentage
 * 
 * @apiSuccess {Object} booking Cancelled booking
 * @apiSuccess {Object} refund Refund details
 */
router.post('/:id/cancel', 
  validateId(),
  requirePermission(PERMISSIONS.BOOKING_CANCEL),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, refund = true, refundPercentage = 100 } = req.body;
      
      const booking = mockBookings.get(id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      if (booking.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Booking is already cancelled'
        });
      }
      
      // Calculate refund amount
      const refundAmount = refund ? Math.round((booking.amount * refundPercentage) / 100) : 0;
      
      // Update booking with cancellation details
      const cancelledBooking = {
        ...booking,
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt: new Date(),
        cancelledBy: req.user.username,
        refundAmount,
        refundStatus: refund ? 'pending' : 'not_applicable',
        updatedAt: new Date()
      };
      
      // Save cancelled booking
      mockBookings.set(id, cancelledBooking);
      
      // Create refund record
      const refundRecord = refund ? {
        id: `refund_${Date.now()}`,
        bookingId: id,
        amount: refundAmount,
        percentage: refundPercentage,
        status: 'pending',
        requestedAt: new Date(),
        requestedBy: req.user.username,
        reason
      } : null;
      
      // Log booking cancellation
      await audit.bookingAction(req, 'cancel', id, {
        reason,
        refund: refundRecord
      });
      
      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: {
          booking: cancelledBooking,
          refund: refundRecord
        }
      });
      
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking'
      });
    }
  }
);

/**
 * @api {get} /api/bookings/:id/history Get Booking History
 * @apiName GetBookingHistory
 * @apiGroup Bookings
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} id Booking ID
 * 
 * @apiSuccess {Array} history Booking change history
 */
router.get('/:id/history', validateId(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = mockBookings.get(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Mock booking history (in real app, this would come from audit logs)
    const history = [
      {
        id: 'hist_001',
        action: 'created',
        timestamp: booking.createdAt,
        user: booking.createdBy || 'system',
        details: 'Booking created',
        changes: null
      },
      {
        id: 'hist_002',
        action: 'updated',
        timestamp: booking.updatedAt,
        user: booking.updatedBy || 'system',
        details: 'Booking details updated',
        changes: {
          status: { from: 'pending', to: booking.status }
        }
      }
    ];
    
    // Add cancellation history if applicable
    if (booking.status === 'cancelled') {
      history.push({
        id: 'hist_003',
        action: 'cancelled',
        timestamp: booking.cancelledAt,
        user: booking.cancelledBy,
        details: `Booking cancelled: ${booking.cancelReason}`,
        changes: {
          status: { from: 'confirmed', to: 'cancelled' }
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        bookingId: id,
        history: history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }
    });
    
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking history'
    });
  }
});

/**
 * @api {post} /api/bookings/:id/resend-confirmation Resend Confirmation
 * @apiName ResendConfirmation
 * @apiGroup Bookings
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} id Booking ID
 * @apiParam {String} [email] Email address to send to
 * 
 * @apiSuccess {Boolean} success Email sent status
 * @apiSuccess {String} message Success message
 */
router.post('/:id/resend-confirmation', 
  validateId(),
  requirePermission(PERMISSIONS.BOOKING_VIEW),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.body;
      
      const booking = mockBookings.get(id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      const targetEmail = email || booking.customerEmail;
      
      // Mock email sending (in real app, integrate with email service)
      const emailSent = {
        id: `email_${Date.now()}`,
        bookingId: id,
        to: targetEmail,
        type: 'booking_confirmation',
        sentAt: new Date(),
        sentBy: req.user.username,
        status: 'sent'
      };
      
      // Log email sending
      await audit.bookingAction(req, 'resend_confirmation', id, {
        email: emailSent
      });
      
      res.json({
        success: true,
        message: `Confirmation email sent to ${targetEmail}`,
        data: emailSent
      });
      
    } catch (error) {
      console.error('Resend confirmation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend confirmation email'
      });
    }
  }
);

module.exports = router;
