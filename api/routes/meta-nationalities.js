/**
 * Nationalities Metadata API
 * 
 * Provides nationality master data for hotel search dropdowns and user profiles
 * 
 * Endpoints:
 *  - GET /api/meta/nationalities - Get all active nationalities
 */

const express = require('express');
const router = express.Router();
const db = require('../database/connection');

/**
 * GET /api/meta/nationalities
 * 
 * Returns list of active nationalities for dropdown selection
 * Sorted by display_order (priority countries first), then alphabetically
 * 
 * Response:
 * {
 *   success: true,
 *   nationalities: [
 *     { isoCode: 'IN', countryName: 'India' },
 *     { isoCode: 'AE', countryName: 'United Arab Emirates' },
 *     ...
 *   ]
 * }
 */
router.get('/nationalities', async (req, res) => {
  try {
    console.log('📍 GET /api/meta/nationalities - Fetching active nationalities');

    const query = `
      SELECT 
        iso_code AS "isoCode",
        country_name AS "countryName",
        display_order AS "displayOrder"
      FROM public.nationalities_master
      WHERE is_active = true
      ORDER BY display_order ASC, country_name ASC
    `;

    const result = await db.query(query);

    console.log(`✅ Found ${result.rows.length} active nationalities`);

    res.json({
      success: true,
      nationalities: result.rows.map(row => ({
        isoCode: row.isoCode,
        countryName: row.countryName
      })),
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error fetching nationalities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nationalities',
      message: error.message
    });
  }
});

/**
 * GET /api/meta/nationalities/:isoCode
 * 
 * Get details for a specific nationality by ISO code
 * 
 * Params:
 *  - isoCode: 2-letter ISO country code (e.g., IN, AE, GB)
 * 
 * Response:
 * {
 *   success: true,
 *   nationality: { isoCode: 'IN', countryName: 'India', isActive: true }
 * }
 */
router.get('/nationalities/:isoCode', async (req, res) => {
  try {
    const { isoCode } = req.params;

    console.log(`📍 GET /api/meta/nationalities/${isoCode}`);

    const query = `
      SELECT 
        iso_code AS "isoCode",
        country_name AS "countryName",
        is_active AS "isActive",
        display_order AS "displayOrder"
      FROM public.nationalities_master
      WHERE iso_code = $1
    `;

    const result = await db.query(query, [isoCode.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Nationality not found',
        isoCode
      });
    }

    res.json({
      success: true,
      nationality: result.rows[0]
    });

  } catch (error) {
    console.error(`❌ Error fetching nationality ${req.params.isoCode}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nationality',
      message: error.message
    });
  }
});

module.exports = router;
