/**
 * Admin Reports API Routes
 * Provides comprehensive booking and pricing reports for admin dashboard
 */

const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');

// Database connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// GET /api/admin/reports/bookings - Get comprehensive booking reports
router.get('/bookings', [
  query('module').optional().isIn(['air', 'hotel', 'sightseeing', 'transfer']),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled']),
  query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  query('end_date').optional().isISO8601().withMessage('Invalid end date format'),
  query('search').optional().trim().isLength({ max: 100 }),
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

    const {
      module,
      status,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build WHERE conditions
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (module) {
      whereConditions.push(`module = $${paramIndex}`);
      queryParams.push(module);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`booking_status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(end_date + ' 23:59:59');
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        booking_reference ILIKE $${paramIndex} OR 
        payment_reference ILIKE $${paramIndex} OR 
        user_id::text ILIKE $${paramIndex} OR
        markup_rule_name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM v_bookings_report ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM v_bookings_report 
      ${whereClause}
      ORDER BY created_at DESC
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
    console.error('Error fetching booking reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking reports',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/reports/analytics - Get analytics overview
router.get('/analytics', [
  query('module').optional().isIn(['air', 'hotel', 'sightseeing', 'transfer']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
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

    const { module, start_date, end_date } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (module) {
      whereConditions.push(`module = $${paramIndex}`);
      queryParams.push(module);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(end_date + ' 23:59:59');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Main analytics query
    const analyticsQuery = `
      SELECT 
        module,
        COUNT(*) as total_bookings,
        SUM(base_net_amount) as total_net,
        SUM(applied_markup_value) as total_markup,
        SUM(promo_discount_value) as total_promo_discounts,
        SUM(bargain_discount_value) as total_bargain_discounts,
        SUM(final_payable) as total_revenue,
        AVG(applied_markup_pct) as avg_markup_pct,
        COUNT(CASE WHEN promo_code IS NOT NULL THEN 1 END) as bookings_with_promo,
        COUNT(CASE WHEN bargain_discount_value > 0 THEN 1 END) as bookings_with_bargain,
        COUNT(CASE WHEN never_loss_pass = false THEN 1 END) as never_loss_triggers
      FROM v_bookings_report
      ${whereClause}
      GROUP BY module
      ORDER BY total_revenue DESC
    `;

    const analyticsResult = await pool.query(analyticsQuery, queryParams);

    // Summary metrics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        SUM(final_payable) as total_revenue,
        AVG(final_payable) as avg_booking_value,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM v_bookings_report
      ${whereClause}
    `;
    const summaryResult = await pool.query(summaryQuery, queryParams);

    // Top performing markup rules
    const topRulesQuery = `
      SELECT 
        markup_rule_name,
        module,
        COUNT(*) as usage_count,
        SUM(applied_markup_value) as total_markup_generated,
        AVG(applied_markup_pct) as avg_markup_pct
      FROM v_bookings_report
      ${whereClause}
        AND markup_rule_name IS NOT NULL
      GROUP BY markup_rule_name, module
      ORDER BY total_markup_generated DESC
      LIMIT 10
    `;
    const topRulesResult = await pool.query(topRulesQuery, queryParams);

    // Promo code performance
    const promoQuery = `
      SELECT 
        promo_code,
        module,
        COUNT(*) as usage_count,
        SUM(promo_discount_value) as total_discount_given,
        AVG(promo_discount_value) as avg_discount
      FROM v_bookings_report
      ${whereClause}
        AND promo_code IS NOT NULL
      GROUP BY promo_code, module
      ORDER BY usage_count DESC
      LIMIT 10
    `;
    const promoResult = await pool.query(promoQuery, queryParams);

    res.json({
      success: true,
      data: {
        by_module: analyticsResult.rows,
        summary: summaryResult.rows[0],
        top_markup_rules: topRulesResult.rows,
        top_promo_codes: promoResult.rows
      }
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

// GET /api/admin/reports/revenue-trends - Get revenue trends over time
router.get('/revenue-trends', [
  query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Period must be daily, weekly, or monthly'),
  query('module').optional().isIn(['air', 'hotel', 'sightseeing', 'transfer']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
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

    const { period = 'daily', module, start_date, end_date } = req.query;

    let dateGrouping;
    switch (period) {
      case 'weekly':
        dateGrouping = "DATE_TRUNC('week', created_at)";
        break;
      case 'monthly':
        dateGrouping = "DATE_TRUNC('month', created_at)";
        break;
      default:
        dateGrouping = "DATE(created_at)";
    }

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (module) {
      whereConditions.push(`module = $${paramIndex}`);
      queryParams.push(module);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(end_date + ' 23:59:59');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const trendsQuery = `
      SELECT 
        ${dateGrouping} as period,
        module,
        COUNT(*) as bookings_count,
        SUM(final_payable) as revenue,
        SUM(applied_markup_value) as markup_revenue,
        SUM(promo_discount_value) as promo_discounts,
        AVG(final_payable) as avg_booking_value
      FROM v_bookings_report
      ${whereClause}
      GROUP BY ${dateGrouping}, module
      ORDER BY period DESC, module
    `;

    const trendsResult = await pool.query(trendsQuery, queryParams);

    res.json({
      success: true,
      data: {
        period: period,
        trends: trendsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue trends',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/reports/markup-performance - Get markup rule performance
router.get('/markup-performance', [
  query('module').optional().isIn(['air', 'hotel', 'sightseeing', 'transfer'])
], async (req, res) => {
  try {
    const { module } = req.query;

    let whereCondition = '';
    let queryParams = [];

    if (module) {
      whereCondition = 'WHERE module = $1';
      queryParams.push(module);
    }

    // Active rules vs usage
    const performanceQuery = `
      SELECT 
        mr.id,
        mr.rule_name,
        mr.module,
        mr.markup_value,
        mr.priority,
        mr.status,
        COALESCE(usage.booking_count, 0) as booking_count,
        COALESCE(usage.total_markup_generated, 0) as total_markup_generated,
        COALESCE(usage.avg_markup_pct, 0) as avg_markup_pct,
        mr.created_at
      FROM markup_rules mr
      LEFT JOIN (
        SELECT 
          applied_markup_rule_id,
          COUNT(*) as booking_count,
          SUM(applied_markup_value) as total_markup_generated,
          AVG(applied_markup_pct) as avg_markup_pct
        FROM bookings 
        WHERE applied_markup_rule_id IS NOT NULL
        GROUP BY applied_markup_rule_id
      ) usage ON mr.id = usage.applied_markup_rule_id
      ${whereCondition}
      ORDER BY COALESCE(usage.total_markup_generated, 0) DESC, mr.priority DESC
    `;

    const performanceResult = await pool.query(performanceQuery, queryParams);

    res.json({
      success: true,
      data: performanceResult.rows
    });

  } catch (error) {
    console.error('Error fetching markup performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch markup performance',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
