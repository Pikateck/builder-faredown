/**
 * V1 Admin API Routes - Booking Management
 * Admin-only endpoints for managing all bookings with full visibility
 * 
 * Requires:
 * - Authentication (JWT token)
 * - Admin role
 * - Audit logging
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../lib/db');
const { logAudit } = require('../services/auditService');

// =====================================================
// 1. GET ALL BOOKINGS (with filtering)
// =====================================================

/**
 * GET /api/v1/admin/bookings
 * List all bookings with filtering, sorting, and pagination
 * Query params: status, customer_email, date_from, date_to, module, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      customer_email,
      date_from,
      date_to,
      module = 'hotels',
      page = 1,
      limit = 50,
      sort = 'created_at',
      sort_dir = 'DESC',
    } = req.query;

    let query = `
      SELECT 
        hb.id, hb.booking_ref, hb.customer_id, hb.hotel_name, hb.hotel_city,
        hb.check_in_date, hb.check_out_date, hb.nights,
        hb.base_price, hb.total_amount, hb.final_paid_amount, hb.currency,
        hb.status, hb.payment_status, hb.bargain_status, hb.bargain_rounds,
        hb.created_at, hb.updated_at,
        c.customer_id as customer_code, c.email as customer_email, c.first_name, c.last_name,
        c.loyalty_tier, c.loyalty_points_balance,
        (SELECT COUNT(*) FROM booking_documents bd WHERE bd.booking_id = hb.id AND bd.is_latest) as documents_count,
        (SELECT COUNT(*) FROM special_requests sr WHERE sr.booking_id = hb.id) as requests_count
      FROM hotel_bookings hb
      LEFT JOIN customers c ON hb.customer_id = c.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND hb.status = $${paramCount++}`;
      values.push(status);
    }

    if (customer_email) {
      query += ` AND c.email ILIKE $${paramCount++}`;
      values.push(`%${customer_email}%`);
    }

    if (date_from) {
      query += ` AND hb.created_at >= $${paramCount++}`;
      values.push(date_from);
    }

    if (date_to) {
      query += ` AND hb.created_at <= $${paramCount++}`;
      values.push(date_to);
    }

    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['created_at', 'booking_ref', 'total_amount', 'status', 'hotel_name'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortDirection = sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY hb.${sortField} ${sortDirection}`;

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limitNum, offset);

    const result = await pool.query(query, values);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM hotel_bookings hb LEFT JOIN customers c ON hb.customer_id = c.id WHERE 1=1`;
    const countValues = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND hb.status = $${countParamCount++}`;
      countValues.push(status);
    }
    if (customer_email) {
      countQuery += ` AND c.email ILIKE $${countParamCount++}`;
      countValues.push(`%${customer_email}%`);
    }
    if (date_from) {
      countQuery += ` AND hb.created_at >= $${countParamCount++}`;
      countValues.push(date_from);
    }
    if (date_to) {
      countQuery += ` AND hb.created_at <= $${countParamCount++}`;
      countValues.push(date_to);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        bookingRef: row.booking_ref,
        customer: {
          id: row.customer_id,
          code: row.customer_code,
          email: row.customer_email,
          firstName: row.first_name,
          lastName: row.last_name,
          loyaltyTier: row.loyalty_tier,
          loyaltyPoints: row.loyalty_points_balance,
        },
        hotel: {
          name: row.hotel_name,
          city: row.hotel_city,
          checkInDate: row.check_in_date,
          checkOutDate: row.check_out_date,
          nights: row.nights,
        },
        pricing: {
          basePrice: parseFloat(row.base_price),
          totalAmount: parseFloat(row.total_amount),
          finalPaidAmount: row.final_paid_amount ? parseFloat(row.final_paid_amount) : null,
          currency: row.currency,
        },
        bargaining: {
          status: row.bargain_status,
          rounds: row.bargain_rounds,
        },
        documents: row.documents_count,
        specialRequests: row.requests_count,
        status: row.status,
        paymentStatus: row.payment_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve bookings',
    });
  }
});

// =====================================================
// 2. GET BOOKING WITH ALL DETAILS (Admin view)
// =====================================================

/**
 * GET /api/v1/admin/bookings/:bookingId
 * Get complete booking with all related data (admin view with full history)
 */
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Get booking
    const bookingResult = await pool.query(
      `SELECT * FROM hotel_bookings WHERE id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const booking = bookingResult.rows[0];

    // Get customer
    const customerResult = await pool.query(
      `SELECT * FROM customers WHERE id = $1`,
      [booking.customer_id]
    );

    // Get PAN (masked)
    const panResult = await pool.query(
      `SELECT id, pan_last4, is_verified, verified_at FROM pan_identifiers 
       WHERE customer_id = $1 AND is_primary = true`,
      [booking.customer_id]
    );

    // Get documents
    const docsResult = await pool.query(
      `SELECT id, document_type, document_name, document_number, file_url, 
              email_sent, email_sent_at, email_delivery_status, 
              download_count, last_downloaded_at, generated_at, version
       FROM booking_documents
       WHERE booking_id = $1
       ORDER BY version DESC`,
      [bookingId]
    );

    // Get special requests
    const srResult = await pool.query(
      `SELECT id, request_type, request_text, status, status_notes,
              acknowledged_by, acknowledged_at, fulfilled_at, created_at, updated_at
       FROM special_requests
       WHERE booking_id = $1
       ORDER BY created_at DESC`,
      [bookingId]
    );

    // Get bargain history
    const bargainResult = await pool.query(
      `SELECT id, round_number, total_rounds, base_price, customer_offer, 
              seller_counter, accepted_price, discount_amount, discount_percentage,
              offer_sent_at, offer_deadline, counter_received_at, accepted_at, status
       FROM bargain_rounds
       WHERE booking_id = $1
       ORDER BY round_number`,
      [bookingId]
    );

    // Get audit logs
    const auditResult = await pool.query(
      `SELECT id, action, old_values, new_values, changed_fields, 
              user_id, user_email, user_role, request_id, status, created_at
       FROM audit_logs
       WHERE entity_id = $1 AND entity_type = 'hotel_booking'
       ORDER BY created_at DESC
       LIMIT 20`,
      [bookingId]
    );

    // Get loyalty events
    const loyaltyResult = await pool.query(
      `SELECT id, event_type, event_description, points_change, 
              points_balance_before, points_balance_after, metadata, event_date
       FROM loyalty_events
       WHERE booking_id = $1
       ORDER BY event_date DESC`,
      [bookingId]
    );

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          bookingRef: booking.booking_ref,
          status: booking.status,
          paymentStatus: booking.payment_status,
          bargainStatus: booking.bargain_status,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at,
        },
        customer: customerResult.rows[0] ? {
          id: customerResult.rows[0].id,
          customerId: customerResult.rows[0].customer_id,
          email: customerResult.rows[0].email,
          firstName: customerResult.rows[0].first_name,
          lastName: customerResult.rows[0].last_name,
          phone: customerResult.rows[0].phone_number,
          loyaltyTier: customerResult.rows[0].loyalty_tier,
          loyaltyPoints: customerResult.rows[0].loyalty_points_balance,
          kycVerified: customerResult.rows[0].kyc_verified,
        } : null,
        pan: panResult.rows[0] ? {
          last4: panResult.rows[0].pan_last4,
          isVerified: panResult.rows[0].is_verified,
          verifiedAt: panResult.rows[0].verified_at,
        } : null,
        hotel: {
          code: booking.hotel_code,
          name: booking.hotel_name,
          city: booking.hotel_city,
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          nights: booking.nights,
        },
        pricing: {
          basePrice: parseFloat(booking.base_price),
          totalAmount: parseFloat(booking.total_amount),
          finalPaidAmount: booking.final_paid_amount ? parseFloat(booking.final_paid_amount) : null,
          currency: booking.currency,
          bargainSummary: booking.bargain_summary,
        },
        documents: docsResult.rows,
        specialRequests: srResult.rows,
        bargainRounds: bargainResult.rows,
        auditLog: auditResult.rows,
        loyaltyEvents: loyaltyResult.rows,
      },
    });

  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve booking details',
    });
  }
});

// =====================================================
// 3. UPDATE BOOKING (Admin)
// =====================================================

/**
 * PUT /api/v1/admin/bookings/:bookingId
 * Update booking fields (admin only)
 */
router.put('/:bookingId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { bookingId } = req.params;
    const { status, payment_status, notes } = req.body;

    await client.query('BEGIN');

    const bookingResult = await client.query(
      `SELECT id, status, payment_status FROM hotel_bookings WHERE id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const oldValues = bookingResult.rows[0];
    const updates = {};
    const changedFields = [];

    if (status && status !== oldValues.status) {
      updates.status = status;
      changedFields.push('status');
    }

    if (payment_status && payment_status !== oldValues.payment_status) {
      updates.payment_status = payment_status;
      changedFields.push('payment_status');
    }

    if (Object.keys(updates).length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'No updates provided',
      });
    }

    // Build update query
    let updateQuery = 'UPDATE hotel_bookings SET updated_at = NOW()';
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      updateQuery += `, ${key} = $${paramCount++}`;
      values.push(value);
    }

    updateQuery += ` WHERE id = $${paramCount++} RETURNING *`;
    values.push(bookingId);

    const updateResult = await client.query(updateQuery, values);

    // Audit log
    await logAudit(client, {
      entity_type: 'hotel_booking',
      entity_id: bookingId,
      action: 'admin_update',
      old_values: oldValues,
      new_values: updates,
      changed_fields: changedFields,
      user_email: req.user?.email || 'admin',
      user_role: req.user?.role || 'admin',
      status: 'success',
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        bookingRef: updateResult.rows[0].booking_ref,
        updatedFields: Object.keys(updates),
        updatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
    });
  } finally {
    client.release();
  }
});

// =====================================================
// 4. DASHBOARD STATISTICS
// =====================================================

/**
 * GET /api/v1/admin/bookings/stats/dashboard
 * Get dashboard statistics
 */
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM hotel_bookings WHERE status = 'pending') as pending_bookings,
        (SELECT COUNT(*) FROM hotel_bookings WHERE status = 'confirmed') as confirmed_bookings,
        (SELECT COUNT(*) FROM hotel_bookings WHERE status = 'completed') as completed_bookings,
        (SELECT COUNT(*) FROM hotel_bookings WHERE payment_status = 'completed') as paid_bookings,
        (SELECT SUM(COALESCE(total_amount, 0)) FROM hotel_bookings WHERE status IN ('confirmed', 'completed')) as total_revenue,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM special_requests WHERE status = 'pending') as pending_special_requests,
        (SELECT AVG(COALESCE(bargain_rounds, 0))::numeric(5,2) FROM hotel_bookings WHERE bargain_rounds > 0) as avg_bargain_rounds,
        (SELECT COUNT(*) FROM hotel_bookings WHERE bargain_status = 'accepted') as bargains_accepted
    `);

    res.json({
      success: true,
      data: stats.rows[0],
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
    });
  }
});

module.exports = router;
