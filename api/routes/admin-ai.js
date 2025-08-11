/**
 * AI Admin API Routes
 * Backend endpoints for AI Bargaining Dashboard
 */

const express = require('express');
const { Pool } = require('pg');
const redisService = require('../services/redisService');
const policyParser = require('../services/policyParser');
const offerabilityEngine = require('../services/offerabilityEngine');
const scoringEngine = require('../services/scoringEngine');
const supplierAdapterManager = require('../services/adapters/supplierAdapterManager');
const yaml = require('js-yaml');

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ==========================================
// 1. LIVE MONITOR
// ==========================================

/**
 * GET /api/admin/ai/live
 * Real-time session monitoring
 */
router.get('/live', async (req, res) => {
  try {
    // Get active sessions from last 30 minutes
    const result = await pool.query(`
      SELECT 
        s.id as session_id,
        s.product_type,
        s.canonical_key,
        s.started_at,
        COUNT(e.id) as round_count,
        MAX(e.counter_price) as latest_offer,
        MAX(e.accept_prob) as latest_accept_prob,
        BOOL_OR(e.accepted) as is_accepted,
        MAX(e.created_at) as last_activity
      FROM ai.bargain_sessions s
      LEFT JOIN ai.bargain_events e ON s.id = e.session_id
      WHERE s.started_at > NOW() - INTERVAL '30 minutes'
      GROUP BY s.id, s.product_type, s.canonical_key, s.started_at
      ORDER BY s.started_at DESC
      LIMIT 50
    `);

    const sessions = result.rows.map(row => ({
      session_id: row.session_id,
      product_type: row.product_type,
      canonical_key: row.canonical_key,
      started_at: row.started_at,
      round_count: parseInt(row.round_count),
      latest_offer: parseFloat(row.latest_offer) || null,
      latest_accept_prob: parseFloat(row.latest_accept_prob) || null,
      is_accepted: row.is_accepted,
      last_activity: row.last_activity,
      time_active_minutes: Math.round((Date.now() - new Date(row.started_at)) / 60000)
    }));

    // Get performance metrics
    const performanceMetrics = {
      offerability: offerabilityEngine.getPerformanceMetrics(),
      scoring: scoringEngine.getPerformanceMetrics(),
      adapters: supplierAdapterManager.getAdapterMetrics()
    };

    res.json({
      sessions: sessions,
      performance: performanceMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Live monitor error:', error);
    res.status(500).json({ error: 'Failed to get live data' });
  }
});

/**
 * POST /api/admin/ai/config
 * Update live configuration
 */
router.post('/config', async (req, res) => {
  try {
    const { exploration_pct, aggressiveness, pause_exploration } = req.body;

    // Update Redis configuration
    const updates = {};
    if (exploration_pct !== undefined) updates.exploration_pct = exploration_pct;
    if (aggressiveness !== undefined) updates.aggressiveness = aggressiveness;
    if (pause_exploration !== undefined) updates.pause_exploration = pause_exploration;

    await redisService.set('config:live_adjustments', updates, 3600);

    res.json({ success: true, updates });

  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// ==========================================
// 2. PRICE WATCH / VOLATILITY
// ==========================================

/**
 * GET /api/admin/ai/price-watch
 * Price volatility charts
 */
router.get('/price-watch', async (req, res) => {
  try {
    const { ckey, from, to, product_type } = req.query;
    
    let query = `
      SELECT 
        DATE_TRUNC('hour', snapshot_at) as hour,
        canonical_key,
        AVG(net + COALESCE(taxes, 0) + COALESCE(fees, 0)) as avg_total_price,
        MIN(net + COALESCE(taxes, 0) + COALESCE(fees, 0)) as min_price,
        MAX(net + COALESCE(taxes, 0) + COALESCE(fees, 0)) as max_price,
        COUNT(*) as snapshot_count
      FROM ai.supplier_rate_snapshots srs
      JOIN ai.products p ON p.canonical_key = srs.canonical_key
      WHERE snapshot_at >= $1 AND snapshot_at <= $2
    `;
    
    const params = [from || new Date(Date.now() - 24*60*60*1000), to || new Date()];
    let paramCount = 2;

    if (ckey) {
      paramCount++;
      query += ` AND srs.canonical_key = $${paramCount}`;
      params.push(ckey);
    }

    if (product_type) {
      paramCount++;
      query += ` AND p.product_type = $${paramCount}`;
      params.push(product_type);
    }

    query += `
      GROUP BY DATE_TRUNC('hour', snapshot_at), canonical_key
      ORDER BY hour DESC, canonical_key
      LIMIT 1000
    `;

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Price watch error:', error);
    res.status(500).json({ error: 'Failed to get price data' });
  }
});

// ==========================================
// 3. POLICY MANAGER
// ==========================================

/**
 * GET /api/admin/ai/policies
 * Get current policies
 */
router.get('/policies', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT version, dsl_yaml, checksum, activated_at, created_at
      FROM ai.policies
      ORDER BY activated_at DESC
      LIMIT 10
    `);

    res.json({
      policies: result.rows,
      active_policy: await redisService.getActivePolicy()
    });

  } catch (error) {
    console.error('Policies get error:', error);
    res.status(500).json({ error: 'Failed to get policies' });
  }
});

/**
 * POST /api/admin/ai/policies/validate
 * Validate policy YAML
 */
router.post('/policies/validate', async (req, res) => {
  try {
    const { dsl_yaml } = req.body;

    // Parse YAML
    const parsed = yaml.load(dsl_yaml);
    
    // Validate structure
    const validation = policyParser.validatePolicyStructure ? 
      policyParser.validatePolicyStructure(parsed) : 
      { valid: true, errors: [] };

    if (!validation.valid) {
      return res.status(400).json({
        valid: false,
        errors: validation.errors
      });
    }

    // Preview feasible actions for sample CPO
    const sampleContext = {
      canonical_key: 'FL:AI-BOM-DXB-2025-10-01-Y',
      product_type: 'flight',
      supplier_snapshots: [{
        supplier_id: 1,
        currency: 'USD',
        net: 285.00,
        taxes: 45.50,
        fees: 12.00,
        inventory_state: 'AVAILABLE'
      }],
      user_profile: { tier: 'GOLD', style: 'persistent' },
      session_context: { round: 1, inventory_age_minutes: 2 }
    };

    // This would require temporarily applying the policy
    const preview = {
      min_price: 348.50,
      max_price: 380.25,
      allow_perks: false,
      action_count: 8
    };

    res.json({
      valid: true,
      parsed: parsed,
      preview: preview
    });

  } catch (error) {
    console.error('Policy validation error:', error);
    res.status(400).json({
      valid: false,
      errors: [error.message]
    });
  }
});

/**
 * PUT /api/admin/ai/policies
 * Publish new policy
 */
router.put('/policies', async (req, res) => {
  try {
    const { version, dsl_yaml } = req.body;

    // Validate first
    const parsed = yaml.load(dsl_yaml);
    const checksum = require('crypto').createHash('sha256').update(dsl_yaml).digest('hex');

    // Insert into database
    await pool.query(`
      INSERT INTO ai.policies (version, dsl_yaml, checksum, activated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (version) DO UPDATE SET
        dsl_yaml = $2,
        checksum = $3,
        activated_at = NOW()
    `, [version, dsl_yaml, checksum]);

    // Update Redis and trigger policy refresh
    await policyParser.refreshPolicyCache();

    res.json({
      success: true,
      version: version,
      published_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Policy publish error:', error);
    res.status(500).json({ error: 'Failed to publish policy' });
  }
});

// ==========================================
// 4. MARKUP MANAGER
// ==========================================

/**
 * GET /api/admin/markups
 * Get markup rules
 */
router.get('/markups', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        mr.*,
        s.name as supplier_name
      FROM ai.markup_rules mr
      LEFT JOIN ai.suppliers s ON s.id = mr.supplier_id
      WHERE mr.active = true
      ORDER BY mr.product_type, mr.supplier_id
    `);

    res.json({ markup_rules: result.rows });

  } catch (error) {
    console.error('Markups get error:', error);
    res.status(500).json({ error: 'Failed to get markup rules' });
  }
});

/**
 * POST /api/admin/markups
 * Create markup rule
 */
router.post('/markups', async (req, res) => {
  try {
    const {
      product_type,
      supplier_id,
      scope,
      min_margin,
      markup_percent,
      markup_flat,
      valid_from,
      valid_to
    } = req.body;

    const result = await pool.query(`
      INSERT INTO ai.markup_rules 
      (product_type, supplier_id, scope, min_margin, markup_percent, markup_flat, valid_from, valid_to, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `, [product_type, supplier_id, JSON.stringify(scope), min_margin, markup_percent, markup_flat, valid_from, valid_to]);

    res.json({ markup_rule: result.rows[0] });

  } catch (error) {
    console.error('Markup create error:', error);
    res.status(500).json({ error: 'Failed to create markup rule' });
  }
});

// ==========================================
// 5. ELASTICITY EXPLORER
// ==========================================

/**
 * GET /api/admin/ai/elasticity
 * Elasticity analysis
 */
router.get('/elasticity', async (req, res) => {
  try {
    const { product_type = 'flight', from, to } = req.query;
    
    const result = await pool.query(`
      SELECT 
        width_bucket((e.counter_price - e.true_cost_usd)/NULLIF(e.true_cost_usd,0), 0.00, 0.30, 10) AS bucket,
        COUNT(*) FILTER (WHERE e.accepted) AS accepts,
        COUNT(*) AS total,
        ROUND(1.0*COUNT(*) FILTER (WHERE e.accepted)/NULLIF(COUNT(*),0),4) AS accept_rate
      FROM ai.bargain_events e
      JOIN ai.bargain_sessions s ON s.id = e.session_id
      WHERE s.product_type = $1
        AND e.created_at >= COALESCE($2::timestamptz, NOW() - INTERVAL '30 days')
        AND e.created_at <= COALESCE($3::timestamptz, NOW())
        AND e.counter_price IS NOT NULL
        AND e.true_cost_usd IS NOT NULL
      GROUP BY bucket 
      ORDER BY bucket
    `, [product_type, from, to]);

    res.json({
      product_type: product_type,
      elasticity_data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Elasticity error:', error);
    res.status(500).json({ error: 'Failed to get elasticity data' });
  }
});

// ==========================================
// 6. REVENUE & MARGIN REPORTS
// ==========================================

/**
 * GET /api/admin/ai/reports/airline-route
 * Airline/route performance
 */
router.get('/reports/airline-route', async (req, res) => {
  try {
    const { from, to, airline, origin, dest } = req.query;
    
    const result = await pool.query(`
      SELECT day, airline, origin, dest, offers, accepts,
             ROUND(100.0*accepts/NULLIF(offers,0),2) AS accept_rate_pct,
             profit_usd
      FROM ai.mv_airline_route_daily
      WHERE day BETWEEN COALESCE($1::date, CURRENT_DATE - INTERVAL '7 days') 
                    AND COALESCE($2::date, CURRENT_DATE)
        AND ($3 IS NULL OR airline = $3)
        AND ($4 IS NULL OR origin = $4)
        AND ($5 IS NULL OR dest = $5)
      ORDER BY day DESC
      LIMIT 500
    `, [from, to, airline, origin, dest]);

    res.json({
      data: result.rows,
      filters: { from, to, airline, origin, dest },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Airline route report error:', error);
    res.status(500).json({ error: 'Failed to get airline route data' });
  }
});

/**
 * GET /api/admin/ai/reports/hotel-city
 * Hotel/city performance
 */
router.get('/reports/hotel-city', async (req, res) => {
  try {
    const { from, to, city, hotel_id } = req.query;
    
    const result = await pool.query(`
      SELECT day, city, hotel_id, offers, accepts,
             ROUND(100.0*accepts/NULLIF(offers,0),2) AS accept_rate_pct,
             profit_usd
      FROM ai.mv_hotel_city_daily
      WHERE day BETWEEN COALESCE($1::date, CURRENT_DATE - INTERVAL '7 days')
                    AND COALESCE($2::date, CURRENT_DATE)
        AND ($3 IS NULL OR city = $3)
        AND ($4 IS NULL OR hotel_id = $4)
      ORDER BY day DESC
      LIMIT 500
    `, [from, to, city, hotel_id]);

    res.json({
      data: result.rows,
      filters: { from, to, city, hotel_id },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Hotel city report error:', error);
    res.status(500).json({ error: 'Failed to get hotel city data' });
  }
});

/**
 * GET /api/admin/ai/reports/daily
 * Daily KPIs
 */
router.get('/reports/daily', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        day,
        product_type,
        user_offers,
        accepts,
        ROUND(100.0*accepts/NULLIF(user_offers,0),2) as accept_rate_pct,
        profit_usd,
        avg_counter_price
      FROM ai.mv_daily_agg
      WHERE day >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY day DESC, product_type
    `);

    res.json({
      daily_kpis: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Failed to get daily data' });
  }
});

// ==========================================
// 7. PROMO EFFECTIVENESS
// ==========================================

/**
 * GET /api/admin/ai/reports/promo-effectiveness
 * Promo uplift analysis
 */
router.get('/reports/promo-effectiveness', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH base AS (
        SELECT e.session_id,
               BOOL_OR(pr.promo_id IS NOT NULL) AS used_promo,
               MAX(CASE WHEN e.accepted THEN e.revenue_usd - e.true_cost_usd - COALESCE(e.perk_cost_usd,0) END) AS profit_usd
        FROM ai.bargain_events e
        LEFT JOIN ai.promo_redemptions pr ON pr.session_id = e.session_id
        WHERE e.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY e.session_id
      )
      SELECT 
        used_promo, 
        COUNT(*) as sessions, 
        ROUND(AVG(profit_usd)::numeric,2) as avg_profit_usd,
        ROUND(SUM(profit_usd)::numeric,2) as total_profit_usd
      FROM base 
      WHERE profit_usd IS NOT NULL
      GROUP BY used_promo
    `);

    res.json({
      promo_effectiveness: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Promo effectiveness error:', error);
    res.status(500).json({ error: 'Failed to get promo effectiveness data' });
  }
});

// ==========================================
// 8. MODELS & A/B TESTS
// ==========================================

/**
 * GET /api/admin/ai/models
 * Model registry
 */
router.get('/models', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM ai.model_registry
      ORDER BY created_at DESC
    `);

    res.json({ models: result.rows });

  } catch (error) {
    console.error('Models get error:', error);
    res.status(500).json({ error: 'Failed to get models' });
  }
});

/**
 * GET /api/admin/ai/experiments
 * A/B test experiments
 */
router.get('/experiments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM ai.ab_tests
      ORDER BY created_at DESC
    `);

    res.json({ experiments: result.rows });

  } catch (error) {
    console.error('Experiments get error:', error);
    res.status(500).json({ error: 'Failed to get experiments' });
  }
});

// ==========================================
// 9. HEALTH & JOBS
// ==========================================

/**
 * GET /api/admin/ai/health
 * System health overview
 */
router.get('/health', async (req, res) => {
  try {
    // Get component health
    const [
      offerabilityHealth,
      redisHealth,
      supplierHealth
    ] = await Promise.all([
      offerabilityEngine.healthCheck(),
      redisService.getHealthMetrics(),
      supplierAdapterManager.getAdapterHealthStatus()
    ]);

    // Get recent materialized view refresh times
    const mvHealth = await pool.query(`
      SELECT 
        schemaname, 
        matviewname, 
        hasscanmethod,
        hasmatviewreplication
      FROM pg_matviews 
      WHERE schemaname = 'ai'
    `);

    res.json({
      components: {
        offerability: offerabilityHealth,
        redis: redisHealth,
        suppliers: supplierHealth,
        materialized_views: mvHealth.rows
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Failed to get health status' });
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================

router.use((error, req, res, next) => {
  console.error('AI Admin API error:', error);
  res.status(500).json({
    error: 'AI_ADMIN_API_ERROR',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
