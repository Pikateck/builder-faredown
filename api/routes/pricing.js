/**
 * Faredown Pricing API Routes
 * Handles all pricing calculation endpoints
 */

const express = require('express');
const PricingEngine = require('../services/pricing/PricingEngine');
const { Pool } = require('pg');

const router = express.Router();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize pricing engine
const pricingEngine = new PricingEngine(pool);

/**
 * POST /api/pricing/quote
 * Main pricing calculation endpoint
 * 
 * Body example:
 * {
 *   "module": "air",
 *   "origin": "BOM",
 *   "destination": "JFK", 
 *   "serviceClass": "Y",
 *   "airlineCode": "AI",
 *   "currency": "USD",
 *   "baseFare": 512.35,
 *   "userType": "b2c",
 *   "debug": true,
 *   "extras": { "promoCode": "WELCOME10", "pax": 1 }
 * }
 */
router.post('/quote', async (req, res) => {
  try {
    const params = req.body;
    
    // Validate required parameters
    const validation = pricingEngine.validateParams(params);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Enable debug mode if environment variable is set or explicitly requested
    const debugMode = (process.env.DEBUG_PRICING === 'true') || params.debug === true;
    
    // Calculate pricing
    const result = await pricingEngine.quote({ 
      ...params, 
      debug: debugMode 
    });
    
    // Increment promo usage if promo code was applied
    if (params.extras?.promoCode && result.discount > 0) {
      try {
        await pricingEngine.incrementPromoUsage(params.extras.promoCode);
      } catch (error) {
        console.error('Error updating promo usage:', error);
        // Don't fail the request for this
      }
    }

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pricing quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Pricing calculation failed',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
    });
  }
});

/**
 * GET /api/pricing/rules/preview
 * Preview which markup rule would match given parameters
 * 
 * Query params: module, origin, destination, serviceClass, hotelCategory, 
 *               serviceType, airlineCode, userType, baseFare
 */
router.get('/rules/preview', async (req, res) => {
  try {
    const params = {
      module: req.query.module || 'air',
      origin: req.query.origin || null,
      destination: req.query.destination || null,
      serviceClass: req.query.serviceClass || null,
      hotelCategory: req.query.hotelCategory || null,
      serviceType: req.query.serviceType || null,
      airlineCode: req.query.airlineCode || null,
      userType: req.query.userType || 'all',
      currency: req.query.currency || 'USD',
      baseFare: Number(req.query.baseFare || 0)
    };

    const rule = await pricingEngine.getApplicableMarkupRule(params);
    const taxPolicy = await pricingEngine.getTaxPolicy(params);
    
    // Get promo if provided
    let promo = null;
    if (req.query.promoCode) {
      promo = await pricingEngine.getPromoDiscount({
        ...params,
        extras: { promoCode: req.query.promoCode }
      });
    }

    res.json({
      success: true,
      data: {
        matchedRule: rule,
        taxPolicy: taxPolicy,
        promoCode: promo,
        parameters: params
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Rules preview error:', error);
    res.status(500).json({
      success: false,
      error: 'Rule preview failed',
      message: error.message
    });
  }
});

/**
 * GET /api/pricing/rules/summary
 * Get pricing rules summary for admin dashboard
 */
router.get('/rules/summary', async (req, res) => {
  try {
    const module = req.query.module || null;
    const summary = await pricingEngine.getRulesSummary(module);
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Rules summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rules summary',
      message: error.message
    });
  }
});

/**
 * POST /api/pricing/validate
 * Validate pricing parameters without calculating
 */
router.post('/validate', (req, res) => {
  try {
    const validation = pricingEngine.validateParams(req.body);
    
    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/pricing/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'Faredown Pricing Engine',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Error handling middleware for pricing routes
 */
router.use((error, req, res, next) => {
  console.error('Pricing API error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
