/**
 * Nationality Resolution Utility
 * 
 * Centralizes logic for determining guest nationality across the application
 * Priority: explicit request > user profile > default (IN)
 */

const db = require('../database/connection');

/**
 * Resolve guest nationality for hotel search
 * 
 * Priority order:
 * 1. Explicit nationality in request payload
 * 2. Authenticated user's saved nationality from profile
 * 3. Default to 'IN' (India)
 * 
 * @param {Object} req - Express request object
 * @param {Object|null} user - Authenticated user object (optional)
 * @returns {Promise<string>} ISO 2-letter nationality code
 */
async function resolveGuestNationality(req, user = null) {
  try {
    // 1. Check if explicitly provided in request body
    if (req.body?.guestNationality) {
      const explicit = req.body.guestNationality.toUpperCase();
      console.log(`🌍 Using explicit nationality from request: ${explicit}`);
      return explicit;
    }

    // 2. Check if user is authenticated and has saved nationality
    if (user?.id || user?.userId) {
      const userId = user.id || user.userId;
      
      const result = await db.query(
        'SELECT nationality_iso FROM public.users WHERE id = $1',
        [userId]
      );

      if (result.rows.length > 0 && result.rows[0].nationality_iso) {
        const userNationality = result.rows[0].nationality_iso;
        console.log(`👤 Using user's saved nationality: ${userNationality}`);
        return userNationality;
      }
    }

    // 3. Fallback to default (India)
    console.log('🇮🇳 Using default nationality: IN');
    return 'IN';

  } catch (error) {
    console.error('❌ Error resolving nationality:', error);
    // On error, fail safely to default
    return 'IN';
  }
}

/**
 * Validate that nationality code exists and is active
 * 
 * @param {string} isoCode - ISO 2-letter country code
 * @returns {Promise<boolean>} True if valid and active
 */
async function validateNationality(isoCode) {
  try {
    if (!isoCode || isoCode.length !== 2) {
      return false;
    }

    const result = await db.query(
      `SELECT 1 FROM public.nationalities_master 
       WHERE iso_code = $1 AND is_active = true`,
      [isoCode.toUpperCase()]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error validating nationality:', error);
    return false;
  }
}

/**
 * Get nationality name from ISO code
 * 
 * @param {string} isoCode - ISO 2-letter country code
 * @returns {Promise<string|null>} Country name or null
 */
async function getNationalityName(isoCode) {
  try {
    const result = await db.query(
      `SELECT country_name FROM public.nationalities_master 
       WHERE iso_code = $1`,
      [isoCode.toUpperCase()]
    );

    return result.rows.length > 0 ? result.rows[0].country_name : null;
  } catch (error) {
    console.error('❌ Error getting nationality name:', error);
    return null;
  }
}

/**
 * Update user's saved nationality in profile
 * 
 * @param {string} userId - User ID (UUID)
 * @param {string} isoCode - ISO 2-letter country code
 * @returns {Promise<boolean>} True if updated successfully
 */
async function updateUserNationality(userId, isoCode) {
  try {
    // Validate first
    const isValid = await validateNationality(isoCode);
    if (!isValid) {
      console.warn(`⚠️  Invalid nationality code: ${isoCode}`);
      return false;
    }

    const upperCode = isoCode.toUpperCase();
    
    await db.query(
      `UPDATE public.users 
       SET nationality_iso = $1, updated_at = NOW()
       WHERE id = $2`,
      [upperCode, userId]
    );

    console.log(`✅ Updated user ${userId} nationality to ${upperCode}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating user nationality:', error);
    return false;
  }
}

/**
 * Log nationality resolution for debugging/analytics
 * 
 * @param {string} nationality - Resolved nationality code
 * @param {string} source - Source of nationality (explicit|user|default)
 * @param {Object} context - Additional context
 */
function logNationalityResolution(nationality, source, context = {}) {
  console.log('🌍 Nationality Resolution:', {
    nationality,
    source,
    timestamp: new Date().toISOString(),
    ...context
  });
}

module.exports = {
  resolveGuestNationality,
  validateNationality,
  getNationalityName,
  updateUserNationality,
  logNationalityResolution
};
