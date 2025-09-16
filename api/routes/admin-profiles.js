/**
 * Admin Profile Management Routes
 * Admin endpoints for managing customer profiles, travelers, and bookings
 */

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { requirePermission, PERMISSIONS } = require("../middleware/auth");
const { validate, validatePagination } = require("../middleware/validation");
const { auditLogger } = require("../middleware/audit");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware to set passport encryption key
const setPassportKey = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const passportKey = process.env.PASSPORT_ENCRYPTION_KEY || 'faredown_default_passport_key_2024';
    await client.query(`SELECT set_config('app.passport_key', $1, false)`, [passportKey]);
    req.dbClient = client;
    next();
  } catch (error) {
    client.release();
    res.status(500).json({ error: 'Database configuration error' });
  }
};

// ============================================================================
// PROFILE LISTING AND SEARCH
// ============================================================================

// GET /api/admin/profiles - Get all customer profiles with filters
router.get("/", requirePermission("manage_users"), async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    const {
      search = "",
      status = "all",
      country = "all",
      page = 1,
      limit = 25
    } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;
    
    // Search filter
    if (search.trim()) {
      whereConditions.push(`
        (u.first_name ILIKE $${paramCount} OR 
         u.last_name ILIKE $${paramCount} OR 
         u.full_name ILIKE $${paramCount} OR 
         u.email ILIKE $${paramCount} OR 
         u.phone ILIKE $${paramCount})
      `);
      queryParams.push(`%${search.trim()}%`);
      paramCount++;
    }
    
    // Status filter
    if (status !== "all") {
      if (status === "verified") {
        whereConditions.push(`u.email_verified = true`);
      } else if (status === "unverified") {
        whereConditions.push(`u.email_verified = false`);
      } else {
        // Assuming we have a status column
        whereConditions.push(`u.status = $${paramCount}`);
        queryParams.push(status);
        paramCount++;
      }
    }
    
    // Country filter
    if (country !== "all") {
      whereConditions.push(`u.nationality_iso2 = $${paramCount}`);
      queryParams.push(country);
      paramCount++;
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    
    const countResult = await client.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated profiles
    const offset = (page - 1) * limit;
    const profilesQuery = `
      SELECT 
        u.id, u.uuid, u.email, u.first_name, u.last_name, u.full_name,
        u.phone, u.phone_e164, u.dob, u.nationality_iso2, u.gender,
        u.display_name, u.profile_picture_url, u.email_verified, u.phone_verified,
        u.created_at, u.updated_at,
        COALESCE(t.travelers_count, 0) as travelers_count,
        COALESCE(p.payment_methods_count, 0) as payment_methods_count,
        COALESCE(b.bookings_count, 0) as bookings_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as travelers_count
        FROM faredown.travelers
        GROUP BY user_id
      ) t ON u.id = t.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as payment_methods_count
        FROM faredown.payment_methods
        GROUP BY user_id
      ) p ON u.id = p.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as bookings_count
        FROM faredown.bookings
        GROUP BY user_id
      ) b ON u.id = b.user_id
      ${whereClause}
      ORDER BY u.updated_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    queryParams.push(limit, offset);
    
    const profilesResult = await client.query(profilesQuery, queryParams);
    
    res.json({
      profiles: profilesResult.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error("Get profiles error:", error);
    res.status(500).json({ error: "Failed to fetch profiles" });
  } finally {
    if (client) client.release();
  }
});

// ============================================================================
// INDIVIDUAL PROFILE MANAGEMENT
// ============================================================================

// GET /api/admin/profiles/:id - Get detailed profile information
router.get("/:id", requirePermission("manage_users"), async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    const { id } = req.params;
    
    const result = await client.query(`
      SELECT 
        u.id, u.uuid, u.email, u.first_name, u.last_name, u.full_name,
        u.phone, u.phone_e164, u.dob, u.nationality_iso2, u.gender,
        u.display_name, u.profile_picture_url, u.email_verified, u.phone_verified,
        u.created_at, u.updated_at,
        a.line1, a.line2, a.city, a.state, a.postal_code, a.country_iso2,
        p.currency_iso3, p.language, p.timezone, p.date_format,
        p.marketing_opt_in, p.email_notifications, p.sms_notifications,
        p.push_notifications, p.price_alerts, p.booking_reminders, p.travel_tips
      FROM users u
      LEFT JOIN faredown.addresses a ON u.address_id = a.id
      LEFT JOIN faredown.user_preferences p ON u.id = p.user_id
      WHERE u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    res.json({ profile: result.rows[0] });
    
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  } finally {
    if (client) client.release();
  }
});

// PUT /api/admin/profiles/:id - Update profile (admin override)
router.put("/:id", requirePermission("manage_users"), audit, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    const { id } = req.params;
    const updateData = req.body;
    
    // Verify profile exists
    const existsResult = await client.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    // Update user data
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    const allowedFields = [
      'first_name', 'last_name', 'full_name', 'email', 'phone', 'phone_e164',
      'dob', 'nationality_iso2', 'gender', 'display_name', 'email_verified', 'phone_verified'
    ];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        updateValues.push(updateData[field]);
        paramCount++;
      }
    }
    
    if (updateFields.length > 0) {
      updateFields.push(`updated_at = now()`);
      updateValues.push(id);
      
      await client.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
      `, updateValues);
    }
    
    await client.query('COMMIT');
    res.json({ message: "Profile updated successfully" });
    
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  } finally {
    if (client) client.release();
  }
});

// DELETE /api/admin/profiles/:id - Delete profile and all associated data
router.delete("/:id", requirePermission("manage_users"), audit, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Get profile info for audit
    const profileResult = await client.query(`
      SELECT email, first_name, last_name FROM users WHERE id = $1
    `, [id]);
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    const profile = profileResult.rows[0];
    
    // Delete in order (foreign key constraints)
    await client.query('DELETE FROM faredown.booking_passengers WHERE traveler_id IN (SELECT id FROM faredown.travelers WHERE user_id = $1)', [id]);
    await client.query('DELETE FROM faredown.seat_assignments WHERE booking_id IN (SELECT id FROM faredown.bookings WHERE user_id = $1)', [id]);
    await client.query('DELETE FROM faredown.bookings WHERE user_id = $1', [id]);
    await client.query('DELETE FROM faredown.passports WHERE traveler_id IN (SELECT id FROM faredown.travelers WHERE user_id = $1)', [id]);
    await client.query('DELETE FROM faredown.travelers WHERE user_id = $1', [id]);
    await client.query('DELETE FROM faredown.payment_methods WHERE user_id = $1', [id]);
    await client.query('DELETE FROM faredown.user_preferences WHERE user_id = $1', [id]);
    await client.query('DELETE FROM faredown.profile_activity_log WHERE user_id = $1', [id]);
    await client.query('DELETE FROM faredown.saved_searches WHERE user_id = $1', [id]);
    
    // Finally delete the user
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.json({ 
      message: "Profile and all associated data deleted successfully",
      deleted_profile: profile
    });
    
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error("Delete profile error:", error);
    res.status(500).json({ error: "Failed to delete profile" });
  } finally {
    if (client) client.release();
  }
});

// ============================================================================
// PROFILE ASSOCIATED DATA
// ============================================================================

// GET /api/admin/profiles/:id/travelers - Get travelers for profile
router.get("/:id/travelers", requirePermission("manage_users"), async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    const { id } = req.params;
    
    const result = await client.query(`
      SELECT 
        t.id, t.first_name, t.last_name, t.dob, t.gender,
        t.nationality_iso2, t.relationship, t.frequent_flyer_number,
        t.dietary_restrictions, t.mobility_assistance, t.is_primary,
        t.created_at, t.updated_at,
        COUNT(p.id) as passport_count
      FROM faredown.travelers t
      LEFT JOIN faredown.passports p ON t.id = p.traveler_id
      WHERE t.user_id = $1
      GROUP BY t.id
      ORDER BY t.is_primary DESC, t.created_at ASC
    `, [id]);
    
    res.json({ travelers: result.rows });
    
  } catch (error) {
    console.error("Get travelers error:", error);
    res.status(500).json({ error: "Failed to fetch travelers" });
  } finally {
    if (client) client.release();
  }
});

// GET /api/admin/profiles/:id/payment-methods - Get payment methods for profile
router.get("/:id/payment-methods", requirePermission("manage_users"), async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    const { id } = req.params;
    
    const result = await client.query(`
      SELECT 
        pm.id, pm.provider, pm.type, pm.brand, pm.last4,
        pm.exp_month, pm.exp_year, pm.holder_name, pm.is_default,
        pm.is_verified, pm.created_at,
        a.line1, a.line2, a.city, a.state, a.postal_code, a.country_iso2
      FROM faredown.payment_methods pm
      LEFT JOIN faredown.addresses a ON pm.billing_address_id = a.id
      WHERE pm.user_id = $1
      ORDER BY pm.is_default DESC, pm.created_at DESC
    `, [id]);
    
    res.json({ paymentMethods: result.rows });
    
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({ error: "Failed to fetch payment methods" });
  } finally {
    if (client) client.release();
  }
});

// GET /api/admin/profiles/:id/bookings - Get booking history for profile
router.get("/:id/bookings", requirePermission("manage_users"), async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    const { id } = req.params;
    
    const result = await client.query(`
      SELECT 
        b.id, b.module, b.booking_ref, b.supplier_ref, b.status,
        b.total_amount, b.currency, b.created_at, b.updated_at,
        b.booking_data
      FROM faredown.bookings b
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT 50
    `, [id]);
    
    res.json({ bookings: result.rows });
    
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  } finally {
    if (client) client.release();
  }
});

// GET /api/admin/profiles/:id/export - Export all profile data
router.get("/:id/export", requirePermission("manage_users"), setPassportKey, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all profile data
    const [profileRes, travelersRes, paymentsRes, bookingsRes, preferencesRes] = await Promise.all([
      req.dbClient.query(`
        SELECT * FROM users u
        LEFT JOIN faredown.addresses a ON u.address_id = a.id
        WHERE u.id = $1
      `, [id]),
      
      req.dbClient.query(`
        SELECT t.*, 
               COUNT(p.id) as passport_count,
               array_agg(
                 CASE WHEN p.id IS NOT NULL THEN 
                   json_build_object(
                     'id', p.id,
                     'given_names', p.given_names,
                     'surname', p.surname,
                     'issuing_country', p.issuing_country,
                     'expiry_date', p.expiry_date,
                     'is_primary', p.is_primary
                   )
                 ELSE NULL END
               ) FILTER (WHERE p.id IS NOT NULL) as passports
        FROM faredown.travelers t
        LEFT JOIN faredown.passports p ON t.id = p.traveler_id
        WHERE t.user_id = $1
        GROUP BY t.id
      `, [id]),
      
      req.dbClient.query(`
        SELECT pm.*, a.line1, a.line2, a.city, a.state, a.postal_code, a.country_iso2
        FROM faredown.payment_methods pm
        LEFT JOIN faredown.addresses a ON pm.billing_address_id = a.id
        WHERE pm.user_id = $1
      `, [id]),
      
      req.dbClient.query(`
        SELECT * FROM faredown.bookings WHERE user_id = $1
      `, [id]),
      
      req.dbClient.query(`
        SELECT * FROM faredown.user_preferences WHERE user_id = $1
      `, [id])
    ]);
    
    const exportData = {
      export_timestamp: new Date().toISOString(),
      profile: profileRes.rows[0],
      travelers: travelersRes.rows,
      payment_methods: paymentsRes.rows,
      bookings: bookingsRes.rows,
      preferences: preferencesRes.rows[0],
      export_note: "Passport numbers are excluded for security reasons"
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="profile-${id}-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
    
  } catch (error) {
    console.error("Export profile error:", error);
    res.status(500).json({ error: "Failed to export profile data" });
  } finally {
    req.dbClient.release();
  }
});

// ============================================================================
// PROFILE STATISTICS
// ============================================================================

// GET /api/admin/profiles/stats - Get profile system statistics
router.get("/stats/overview", requirePermission("view_dashboard"), async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_profiles,
        COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '24 hours') as active_today,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
      FROM users
    `);
    
    const travelersResult = await client.query(`
      SELECT COUNT(*) as total_travelers FROM faredown.travelers
    `);
    
    const bookingsResult = await client.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as bookings_this_month
      FROM faredown.bookings
    `);
    
    const stats = {
      ...statsResult.rows[0],
      total_travelers: travelersResult.rows[0].total_travelers,
      ...bookingsResult.rows[0]
    };
    
    // Convert string counts to numbers
    Object.keys(stats).forEach(key => {
      stats[key] = parseInt(stats[key]) || 0;
    });
    
    res.json({ stats });
    
  } catch (error) {
    console.error("Get profile stats error:", error);
    res.status(500).json({ error: "Failed to fetch profile statistics" });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
