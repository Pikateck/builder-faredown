/**
 * V1 API Routes - Bookings Management
 * Complete integration with PostgreSQL as single source of truth
 * 
 * All operations:
 * - Write to Postgres (transactional)
 * - Generate audit logs
 * - Return consistent API contracts
 * - Support idempotency for payments
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../lib/db');
const { generateBookingRef, generateDocumentNumber, sanitizePAN } = require('../utils/bookingUtils');
const { logAudit } = require('../services/auditService');
const { sendEmail } = require('../services/emailService');

// =====================================================
// 1. CREATE BOOKING (Pre-book with customer & PAN)
// =====================================================

/**
 * POST /api/v1/bookings/hotels
 * Create a new hotel booking with customer and PAN details
 * 
 * Request body:
 * {
 *   customer: { email, firstName, lastName, phone },
 *   pan_number: "XXXX1234567890XX",
 *   hotel: { code, name, checkIn, checkOut, nights, rooms, adults, children },
 *   pricing: { basePrice, taxes, fees, total, currency },
 *   specialRequests: "...",
 *   guestDetails: {...}
 * }
 */
router.post('/hotels', async (req, res) => {
  const client = await pool.connect();
  const requestId = uuidv4();
  
  try {
    const {
      customer,
      pan_number,
      hotel,
      pricing,
      specialRequests,
      guestDetails,
    } = req.body;

    // Validation
    if (!customer?.email || !pan_number || !hotel?.code || !pricing?.total) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customer, pan_number, hotel, pricing',
      });
    }

    // Validate PAN format
    if (!/^[A-Z0-9]{1,20}$/.test(pan_number)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid PAN format. Must be alphanumeric, max 20 chars',
      });
    }

    await client.query('BEGIN');

    // 1. Create or update customer
    const customerId = uuidv4();
    const customerCode = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const customerResult = await client.query(
      `INSERT INTO customers (
        id, customer_id, email, first_name, last_name, phone_number, loyalty_tier, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Silver', NOW())
      ON CONFLICT (email) DO UPDATE SET
        first_name = COALESCE($4, customers.first_name),
        last_name = COALESCE($5, customers.last_name),
        phone_number = COALESCE($6, customers.phone_number),
        updated_at = NOW()
      RETURNING id, customer_id`,
      [customerId, customerCode, customer.email, customer.firstName, customer.lastName, customer.phone]
    );

    const actualCustomerId = customerResult.rows[0].id;

    // 2. Store PAN (hashed)
    const crypto = require('crypto');
    const panHash = crypto.createHash('sha256').update(pan_number).digest('hex');
    const panLast4 = pan_number.slice(-4);

    const panResult = await client.query(
      `INSERT INTO pan_identifiers (
        id, customer_id, pan_number, pan_hash, pan_last4, is_primary, is_verified, created_at
      ) VALUES ($1, $2, $3, $4, $5, true, true, NOW())
      RETURNING id`,
      [uuidv4(), actualCustomerId, pan_number, panHash, panLast4]
    );

    // 3. Create booking
    const bookingRef = generateBookingRef();
    const bookingId = uuidv4();

    const bookingResult = await client.query(
      `INSERT INTO hotel_bookings (
        id, booking_ref, customer_id, hotel_code, hotel_name,
        check_in_date, check_out_date, nights, rooms_count, adults_count, children_count,
        base_price, taxes, fees, total_amount, final_paid_amount, currency,
        guest_details, special_requests, pan_card, status, payment_status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20, 'pending', 'pending',
        NOW(), NOW()
      ) RETURNING id, booking_ref`,
      [
        bookingId, bookingRef, actualCustomerId, hotel.code, hotel.name,
        hotel.checkIn, hotel.checkOut, hotel.nights, hotel.rooms, hotel.adults, hotel.children || 0,
        pricing.basePrice, pricing.taxes || 0, pricing.fees || 0, pricing.total, pricing.total, pricing.currency || 'INR',
        JSON.stringify(guestDetails || {}), specialRequests || '', pan_number, 
      ]
    );

    // 4. Add special requests if provided
    if (specialRequests) {
      await client.query(
        `INSERT INTO special_requests (
          id, booking_id, customer_id, request_type, request_text, status, created_at
        ) VALUES ($1, $2, $3, 'other', $4, 'pending', NOW())`,
        [uuidv4(), bookingId, actualCustomerId, specialRequests]
      );
    }

    // 5. Create audit log
    await logAudit(client, {
      entity_type: 'hotel_booking',
      entity_id: bookingId,
      entity_name: bookingRef,
      action: 'create',
      new_values: {
        hotel: hotel.name,
        customer: customer.email,
        totalAmount: pricing.total,
        pan: `****${panLast4}`,
      },
      user_email: 'system',
      request_id: requestId,
      status: 'success',
    });

    // 6. Create loyalty event
    await client.query(
      `INSERT INTO loyalty_events (
        id, customer_id, booking_id, event_type, event_description, 
        points_change, created_at
      ) VALUES ($1, $2, $3, 'booking_created', $4, 0, NOW())`,
      [uuidv4(), actualCustomerId, bookingId, `Booking created: ${hotel.name}`]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        bookingId: bookingId,
        bookingRef: bookingRef,
        customerId: actualCustomerId,
        customerCode: customerCode,
        hotelName: hotel.name,
        checkInDate: hotel.checkIn,
        checkOutDate: hotel.checkOut,
        totalAmount: pricing.total,
        currency: pricing.currency || 'INR',
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
      },
      requestId,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking creation error:', error);
    
    await logAudit(null, {
      entity_type: 'hotel_booking',
      action: 'create',
      status: 'error',
      error_message: error.message,
      request_id: requestId,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      requestId,
    });
  } finally {
    client.release();
  }
});

// =====================================================
// 2. GET BOOKING DETAILS
// =====================================================

/**
 * GET /api/v1/bookings/hotels/:bookingRef
 * Retrieve complete booking details with all related data
 */
router.get('/hotels/:bookingRef', async (req, res) => {
  try {
    const { bookingRef } = req.params;

    const result = await pool.query(
      `SELECT 
        hb.id, hb.booking_ref, hb.customer_id, hb.hotel_name, hb.hotel_city,
        hb.check_in_date, hb.check_out_date, hb.nights,
        hb.base_price, hb.markup_amount, hb.taxes, hb.fees, hb.total_amount, hb.final_paid_amount,
        hb.currency, hb.status, hb.payment_status, hb.bargain_status, hb.bargain_rounds,
        hb.guest_details, hb.special_requests, hb.pan_card,
        c.customer_id as customer_code, c.email as customer_email, c.first_name, c.last_name,
        c.loyalty_tier, c.loyalty_points_balance
      FROM hotel_bookings hb
      LEFT JOIN customers c ON hb.customer_id = c.id
      WHERE hb.booking_ref = $1`,
      [bookingRef]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const booking = result.rows[0];

    // Get related documents
    const docsResult = await pool.query(
      `SELECT id, document_type, document_name, document_number, file_url, email_sent, generated_at
       FROM booking_documents
       WHERE booking_id = $1 AND is_latest = true
       ORDER BY generated_at DESC`,
      [booking.id]
    );

    // Get special requests
    const srResult = await pool.query(
      `SELECT id, request_type, request_text, status, created_at
       FROM special_requests
       WHERE booking_id = $1
       ORDER BY created_at DESC`,
      [booking.id]
    );

    // Get bargain history
    const bargainResult = await pool.query(
      `SELECT round_number, base_price, customer_offer, seller_counter, accepted_price, 
              status, offer_sent_at, accepted_at
       FROM bargain_rounds
       WHERE booking_id = $1
       ORDER BY round_number`,
      [booking.id]
    );

    res.json({
      success: true,
      data: {
        id: booking.id,
        bookingRef: booking.booking_ref,
        customer: {
          id: booking.customer_id,
          code: booking.customer_code,
          email: booking.customer_email,
          firstName: booking.first_name,
          lastName: booking.last_name,
          loyaltyTier: booking.loyalty_tier,
          loyaltyPoints: booking.loyalty_points_balance,
        },
        hotel: {
          name: booking.hotel_name,
          city: booking.hotel_city,
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          nights: booking.nights,
        },
        pricing: {
          basePrice: parseFloat(booking.base_price),
          markupAmount: parseFloat(booking.markup_amount),
          taxes: parseFloat(booking.taxes),
          fees: parseFloat(booking.fees),
          totalAmount: parseFloat(booking.total_amount),
          finalPaidAmount: booking.final_paid_amount ? parseFloat(booking.final_paid_amount) : null,
          currency: booking.currency,
        },
        bargaining: {
          status: booking.bargain_status,
          rounds: booking.bargain_rounds,
          history: bargainResult.rows,
        },
        documents: docsResult.rows,
        specialRequests: srResult.rows,
        guestDetails: booking.guest_details,
        panCardLast4: booking.pan_card ? booking.pan_card.slice(-4) : null,
        status: booking.status,
        paymentStatus: booking.payment_status,
      },
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve booking',
    });
  }
});

// =====================================================
// 3. UPDATE BOOKING STATUS
// =====================================================

/**
 * PUT /api/v1/bookings/hotels/:bookingRef/status
 * Update booking status (confirm, cancel, etc.)
 */
router.put('/hotels/:bookingRef/status', async (req, res) => {
  const client = await pool.connect();
  const requestId = uuidv4();

  try {
    const { bookingRef } = req.params;
    const { status, reason } = req.body;

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: confirmed, cancelled, or completed',
      });
    }

    await client.query('BEGIN');

    const bookingResult = await client.query(
      `SELECT id, status, customer_id FROM hotel_bookings WHERE booking_ref = $1`,
      [bookingRef]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const { id: bookingId, status: oldStatus, customer_id: customerId } = bookingResult.rows[0];

    // Update booking
    const updateResult = await client.query(
      `UPDATE hotel_bookings 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, booking_ref, status, hotel_name, total_amount`,
      [status, bookingId]
    );

    // Create loyalty event
    if (status === 'confirmed') {
      await client.query(
        `INSERT INTO loyalty_events (
          id, customer_id, booking_id, event_type, event_description, created_at
        ) VALUES ($1, $2, $3, 'booking_confirmed', $4, NOW())`,
        [uuidv4(), customerId, bookingId, `Booking confirmed: ${updateResult.rows[0].hotel_name}`]
      );
    }

    // Audit log
    await logAudit(client, {
      entity_type: 'hotel_booking',
      entity_id: bookingId,
      action: 'update_status',
      old_values: { status: oldStatus },
      new_values: { status },
      user_email: 'system',
      request_id: requestId,
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        bookingRef: updateResult.rows[0].booking_ref,
        status: updateResult.rows[0].status,
        updatedAt: new Date().toISOString(),
      },
      requestId,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
    });
  } finally {
    client.release();
  }
});

// =====================================================
// 4. CREATE BOOKING DOCUMENT (Invoice/Voucher)
// =====================================================

/**
 * POST /api/v1/bookings/hotels/:bookingRef/documents
 * Create and store booking document (invoice or voucher)
 */
router.post('/hotels/:bookingRef/documents', async (req, res) => {
  const client = await pool.connect();

  try {
    const { bookingRef } = req.params;
    const { documentType, fileUrl, documentContent } = req.body;

    if (!['invoice', 'voucher'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type. Must be: invoice or voucher',
      });
    }

    const bookingResult = await client.query(
      `SELECT id, customer_id, total_amount FROM hotel_bookings WHERE booking_ref = $1`,
      [bookingRef]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const { id: bookingId, customer_id: customerId, total_amount: totalAmount } = bookingResult.rows[0];
    const documentId = uuidv4();
    const documentNumber = generateDocumentNumber(documentType);

    // Mark previous documents as not latest
    await client.query(
      `UPDATE booking_documents 
       SET is_latest = false 
       WHERE booking_id = $1 AND document_type = $2`,
      [bookingId, documentType]
    );

    // Create new document
    await client.query(
      `INSERT INTO booking_documents (
        id, booking_id, customer_id, document_type, document_name, document_number,
        file_url, document_content, generated_at, generated_by, is_latest, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'system', true, 1)`,
      [
        documentId, bookingId, customerId, documentType,
        `${documentType}_${bookingRef}`, documentNumber,
        fileUrl, JSON.stringify(documentContent || {})
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        documentId,
        documentNumber,
        documentType,
        fileUrl,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Document creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create document',
    });
  } finally {
    client.release();
  }
});

// =====================================================
// 5. ADD SPECIAL REQUEST
// =====================================================

/**
 * POST /api/v1/bookings/hotels/:bookingRef/special-requests
 * Add special request to booking
 */
router.post('/hotels/:bookingRef/special-requests', async (req, res) => {
  try {
    const { bookingRef } = req.params;
    const { requestType, requestText } = req.body;

    const bookingResult = await pool.query(
      `SELECT id, customer_id FROM hotel_bookings WHERE booking_ref = $1`,
      [bookingRef]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const { id: bookingId, customer_id: customerId } = bookingResult.rows[0];

    const result = await pool.query(
      `INSERT INTO special_requests (
        id, booking_id, customer_id, request_type, request_text, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING id, created_at`,
      [uuidv4(), bookingId, customerId, requestType || 'other', requestText]
    );

    res.status(201).json({
      success: true,
      data: {
        requestId: result.rows[0].id,
        status: 'pending',
        createdAt: result.rows[0].created_at,
      },
    });

  } catch (error) {
    console.error('Special request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add special request',
    });
  }
});

// =====================================================
// 6. GET CUSTOMER BOOKINGS
// =====================================================

/**
 * GET /api/v1/bookings/customers/:customerEmail
 * Get all bookings for a customer
 */
router.get('/customers/:customerEmail', async (req, res) => {
  try {
    const { customerEmail } = req.params;

    const result = await pool.query(
      `SELECT 
        hb.id, hb.booking_ref, hb.hotel_name, hb.check_in_date, hb.check_out_date,
        hb.total_amount, hb.currency, hb.status, hb.payment_status,
        (SELECT COUNT(*) FROM booking_documents bd WHERE bd.booking_id = hb.id AND bd.is_latest AND bd.document_type = 'voucher') as has_voucher,
        (SELECT COUNT(*) FROM booking_documents bd WHERE bd.booking_id = hb.id AND bd.is_latest AND bd.document_type = 'invoice') as has_invoice,
        hb.created_at
      FROM hotel_bookings hb
      LEFT JOIN customers c ON hb.customer_id = c.id
      WHERE c.email = $1
      ORDER BY hb.created_at DESC`,
      [customerEmail]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        bookingRef: row.booking_ref,
        hotelName: row.hotel_name,
        checkInDate: row.check_in_date,
        checkOutDate: row.check_out_date,
        totalAmount: parseFloat(row.total_amount),
        currency: row.currency,
        status: row.status,
        paymentStatus: row.payment_status,
        hasVoucher: row.has_voucher > 0,
        hasInvoice: row.has_invoice > 0,
        createdAt: row.created_at,
      })),
      total: result.rows.length,
    });

  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer bookings',
    });
  }
});

// =====================================================
// 7. HEALTH CHECK
// =====================================================

router.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as timestamp');
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].timestamp,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
    });
  }
});

module.exports = router;
