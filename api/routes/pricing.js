/**
 * Pricing API Routes
 * Handles quotes, bargaining, and booking confirmation for all modules
 */

const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const PricingEngine = require('../services/pricingEngine');

// Database connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const pricingEngine = new PricingEngine(pool);

// Validation middleware
const validateQuoteRequest = [
  body('module').isIn(['air', 'hotel', 'sightseeing', 'transfer']).withMessage('Invalid module'),
  body('baseNetAmount').isFloat({ min: 0 }).withMessage('Base net amount must be a positive number'),
  body('origin').optional().trim().isLength({ max: 100 }),
  body('destination').optional().trim().isLength({ max: 100 }),
  body('serviceClass').optional().isIn(['Economy', 'Business', 'First']),
  body('hotelCategory').optional().isIn(['1-star', '2-star', '3-star', '4-star', '5-star']),
  body('serviceType').optional().isIn(['Standard', 'Premium', 'Luxury']),
  body('airlineCode').optional().trim().isLength({ max: 10 }),
  body('promoCode').optional().trim().isLength({ max: 50 }),
  body('userType').optional().isIn(['all', 'b2c', 'b2b']).withMessage('Invalid user type')
];

const validateBargainRequest = [
  body('tempId').trim().notEmpty().withMessage('Temp ID is required'),
  body('offeredPrice').isFloat({ min: 0 }).withMessage('Offered price must be a positive number'),
  body('userId').optional().isUUID().withMessage('Invalid user ID format')
];

const validateBookingRequest = [
  body('tempId').trim().notEmpty().withMessage('Temp ID is required'),
  body('paymentReference').trim().notEmpty().withMessage('Payment reference is required'),
  body('userId').optional().isUUID().withMessage('Invalid user ID format')
];

// POST /api/pricing/quote - Generate pricing quote
router.post('/quote', validateQuoteRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const quote = await pricingEngine.generateQuote(req.body);

    res.json({
      success: true,
      data: quote
    });

  } catch (error) {
    console.error('Error generating quote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quote',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/pricing/bargain - Process bargain offer
router.post('/bargain', validateBargainRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { tempId, offeredPrice, userId } = req.body;
    const result = await pricingEngine.processBargainOffer(tempId, offeredPrice, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error processing bargain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bargain offer',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/pricing/confirm - Confirm booking
router.post('/confirm', validateBookingRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { tempId, paymentReference, userId } = req.body;
    const booking = await pricingEngine.confirmBooking(tempId, paymentReference, userId);

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm booking',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/pricing/booking/:id - Get booking details
router.get('/booking/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }

    const booking = await pricingEngine.getBookingDetails(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/pricing/analytics - Get pricing analytics
router.get('/analytics', [
  query('module').optional().isIn(['air', 'hotel', 'sightseeing', 'transfer']),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { module, startDate, endDate } = req.query;
    const analytics = await pricingEngine.getAnalytics(module, startDate, endDate);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/pricing/markup-rules - Get all markup rules
router.get('/markup-rules', [
  query('module').optional().isIn(['air', 'hotel', 'sightseeing', 'transfer']),
  query('status').optional().isIn(['active', 'inactive']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { module, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (module) {
      whereConditions.push(`module = $${paramIndex}`);
      queryParams.push(module);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM markup_rules ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM markup_rules 
      ${whereClause}
      ORDER BY module, priority DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);
    const dataResult = await pool.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching markup rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch markup rules',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/pricing/promo-codes - Get all promo codes
router.get('/promo-codes', [
  query('module').optional().isIn(['air', 'hotel', 'sightseeing', 'transfer']),
  query('status').optional().isIn(['active', 'pending', 'inactive']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { module, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (module) {
      whereConditions.push(`module = $${paramIndex}`);
      queryParams.push(module);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM promo_codes ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data with budget usage
    const dataQuery = `
      SELECT *,
             CASE 
               WHEN marketing_budget > 0 THEN (budget_spent / marketing_budget * 100)::numeric(5,2)
               ELSE 0
             END as budget_usage_percent
      FROM promo_codes 
      ${whereClause}
      ORDER BY module, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);
    const dataResult = await pool.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch promo codes',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/pricing/test-quote - Test endpoint with sample data
router.post('/test-quote', async (req, res) => {
  try {
    const testCases = [
      {
        name: 'Business Class Flight',
        params: {
          module: 'air',
          baseNetAmount: 5000,
          origin: 'DXB',
          destination: 'LHR',
          serviceClass: 'Business',
          promoCode: 'BUSINESSDEAL'
        }
      },
      {
        name: 'First Class Flight',
        params: {
          module: 'air',
          baseNetAmount: 8000,
          origin: 'JFK',
          destination: 'LAX',
          serviceClass: 'First',
          promoCode: 'FIRSTLUXE'
        }
      },
      {
        name: '5-Star Hotel',
        params: {
          module: 'hotel',
          baseNetAmount: 3000,
          destination: 'Dubai',
          hotelCategory: '5-star',
          promoCode: 'FIVESTARSTAY'
        }
      },
      {
        name: 'Luxury Transfer',
        params: {
          module: 'transfer',
          baseNetAmount: 800,
          origin: 'Dubai Airport',
          destination: 'Dubai Marina',
          serviceType: 'Luxury',
          promoCode: 'LUXURYTREAT'
        }
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      try {
        const quote = await pricingEngine.generateQuote(testCase.params);
        results.push({
          name: testCase.name,
          success: true,
          quote
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Test quotes generated',
      data: results
    });

  } catch (error) {
    console.error('Error in test quotes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test quotes',
      message: error.message
    });
  }
});

module.exports = router;
