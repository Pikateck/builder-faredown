import express from "express";
/**
 * Profile Management API Routes
 * Comprehensive endpoints for Booking.com-style profile system
 */

const router = express.Router();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { validate } = require("../middleware/validation");
const { audit } = require("../middleware/audit");

// Database connection - Use SSL for Render PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Middleware to set passport encryption key
const setPassportKey = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const passportKey =
      process.env.PASSPORT_ENCRYPTION_KEY ||
      "faredown_default_passport_key_2024";
    await client.query(`SELECT set_config('app.passport_key', $1, false)`, [
      passportKey,
    ]);
    req.dbClient = client;
    next();
  } catch (error) {
    client.release();
    res.status(500).json({ error: "Database configuration error" });
  }
};

// Middleware to authenticate user (simplified for demo)
const authenticateUser = (req, res, next) => {
  // In production, verify JWT token
  const userId = req.headers["x-user-id"] || "1"; // Demo: use header for user ID
  req.userId = parseInt(userId);
  next();
};

// ============================================================================
// PROFILE ENDPOINTS
// ============================================================================

// GET /api/profile - Get current user profile
router.get("/", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `
      SELECT 
        u.id, u.uuid, u.email, u.first_name, u.last_name, u.full_name,
        u.phone, u.phone_e164, u.dob, u.nationality_iso2, u.gender,
        u.display_name, u.profile_picture_url, u.email_verified, u.phone_verified,
        a.line1, a.line2, a.city, a.state, a.postal_code, a.country_iso2,
        p.currency_iso3, p.language, p.timezone, p.date_format,
        p.marketing_opt_in, p.email_notifications, p.sms_notifications,
        p.push_notifications, p.price_alerts, p.booking_reminders, p.travel_tips
      FROM users u
      LEFT JOIN faredown.addresses a ON u.address_id = a.id
      LEFT JOIN faredown.user_preferences p ON u.id = p.user_id
      WHERE u.id = $1
    `,
      [req.userId],
    );

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

// PUT /api/profile - Update user profile
router.put("/", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const {
      firstName,
      lastName,
      fullName,
      email,
      phone,
      phoneE164,
      dob,
      nationalityIso2,
      gender,
      displayName,
      profilePictureUrl,
      address,
      preferences,
    } = req.body;

    // Update user basic info
    const userUpdateResult = await client.query(
      `
      UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        full_name = COALESCE($3, full_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        phone_e164 = COALESCE($6, phone_e164),
        dob = COALESCE($7, dob),
        nationality_iso2 = COALESCE($8, nationality_iso2),
        gender = COALESCE($9, gender),
        display_name = COALESCE($10, display_name),
        profile_picture_url = COALESCE($11, profile_picture_url),
        updated_at = now()
      WHERE id = $12
      RETURNING id, uuid
    `,
      [
        firstName,
        lastName,
        fullName,
        email,
        phone,
        phoneE164,
        dob,
        nationalityIso2,
        gender,
        displayName,
        profilePictureUrl,
        req.userId,
      ],
    );

    // Update or create address
    if (address) {
      const addressResult = await client.query(
        `
        INSERT INTO faredown.addresses (line1, line2, city, state, postal_code, country_iso2)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
        RETURNING id
      `,
        [
          address.line1,
          address.line2,
          address.city,
          address.state,
          address.postalCode,
          address.countryIso2,
        ],
      );

      if (addressResult.rows.length > 0) {
        await client.query(
          `
          UPDATE users SET address_id = $1 WHERE id = $2
        `,
          [addressResult.rows[0].id, req.userId],
        );
      }
    }

    // Update preferences
    if (preferences) {
      await client.query(
        `
        INSERT INTO faredown.user_preferences (
          user_id, currency_iso3, language, timezone, date_format,
          marketing_opt_in, email_notifications, sms_notifications,
          push_notifications, price_alerts, booking_reminders, travel_tips
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (user_id) DO UPDATE SET
          currency_iso3 = COALESCE(EXCLUDED.currency_iso3, faredown.user_preferences.currency_iso3),
          language = COALESCE(EXCLUDED.language, faredown.user_preferences.language),
          timezone = COALESCE(EXCLUDED.timezone, faredown.user_preferences.timezone),
          date_format = COALESCE(EXCLUDED.date_format, faredown.user_preferences.date_format),
          marketing_opt_in = COALESCE(EXCLUDED.marketing_opt_in, faredown.user_preferences.marketing_opt_in),
          email_notifications = COALESCE(EXCLUDED.email_notifications, faredown.user_preferences.email_notifications),
          sms_notifications = COALESCE(EXCLUDED.sms_notifications, faredown.user_preferences.sms_notifications),
          push_notifications = COALESCE(EXCLUDED.push_notifications, faredown.user_preferences.push_notifications),
          price_alerts = COALESCE(EXCLUDED.price_alerts, faredown.user_preferences.price_alerts),
          booking_reminders = COALESCE(EXCLUDED.booking_reminders, faredown.user_preferences.booking_reminders),
          travel_tips = COALESCE(EXCLUDED.travel_tips, faredown.user_preferences.travel_tips),
          updated_at = now()
      `,
        [
          req.userId,
          preferences.currencyIso3,
          preferences.language,
          preferences.timezone,
          preferences.dateFormat,
          preferences.marketingOptIn,
          preferences.emailNotifications,
          preferences.smsNotifications,
          preferences.pushNotifications,
          preferences.priceAlerts,
          preferences.bookingReminders,
          preferences.travelTips,
        ],
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  } finally {
    if (client) client.release();
  }
});

// ============================================================================
// TRAVELERS ENDPOINTS
// ============================================================================

// GET /api/profile/travelers - Get all saved travelers
router.get("/travelers", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `
      SELECT 
        t.id, t.first_name, t.last_name, t.dob, t.gender,
        t.nationality_iso2, t.relationship, t.frequent_flyer_number,
        t.dietary_restrictions, t.mobility_assistance, t.is_primary,
        a.line1, a.line2, a.city, a.state, a.postal_code, a.country_iso2,
        t.created_at, t.updated_at
      FROM faredown.travelers t
      LEFT JOIN faredown.addresses a ON t.address_id = a.id
      WHERE t.user_id = $1
      ORDER BY t.is_primary DESC, t.created_at ASC
    `,
      [req.userId],
    );

    res.json({ travelers: result.rows });
  } catch (error) {
    console.error("Get travelers error:", error);
    res.status(500).json({ error: "Failed to fetch travelers" });
  } finally {
    if (client) client.release();
  }
});

// POST /api/profile/travelers - Create new traveler
router.post("/travelers", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const {
      firstName,
      lastName,
      dob,
      gender,
      nationalityIso2,
      relationship,
      frequentFlyerNumber,
      dietaryRestrictions,
      mobilityAssistance,
      isPrimary,
      address,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dob) {
      return res
        .status(400)
        .json({
          error: "First name, last name, and date of birth are required",
        });
    }

    let addressId = null;
    if (address) {
      const addressResult = await client.query(
        `
        INSERT INTO faredown.addresses (line1, line2, city, state, postal_code, country_iso2)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
        [
          address.line1,
          address.line2,
          address.city,
          address.state,
          address.postalCode,
          address.countryIso2,
        ],
      );
      addressId = addressResult.rows[0].id;
    }

    // If this is set as primary, update others to not be primary
    if (isPrimary) {
      await client.query(
        `
        UPDATE faredown.travelers SET is_primary = false WHERE user_id = $1
      `,
        [req.userId],
      );
    }

    const result = await client.query(
      `
      INSERT INTO faredown.travelers (
        user_id, first_name, last_name, dob, gender, nationality_iso2,
        relationship, frequent_flyer_number, dietary_restrictions,
        mobility_assistance, is_primary, address_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, first_name, last_name, created_at
    `,
      [
        req.userId,
        firstName,
        lastName,
        dob,
        gender,
        nationalityIso2,
        relationship,
        frequentFlyerNumber,
        dietaryRestrictions,
        mobilityAssistance,
        isPrimary,
        addressId,
      ],
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: "Traveler created successfully",
      traveler: result.rows[0],
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Create traveler error:", error);
    res.status(500).json({ error: "Failed to create traveler" });
  } finally {
    if (client) client.release();
  }
});

// PUT /api/profile/travelers/:id - Update traveler
router.put("/travelers/:id", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const { id } = req.params;
    const updateData = req.body;

    // Verify traveler belongs to user
    const ownerCheck = await client.query(
      `
      SELECT id FROM faredown.travelers WHERE id = $1 AND user_id = $2
    `,
      [id, req.userId],
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Traveler not found" });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    const fieldMap = {
      firstName: "first_name",
      lastName: "last_name",
      dob: "dob",
      gender: "gender",
      nationalityIso2: "nationality_iso2",
      relationship: "relationship",
      frequentFlyerNumber: "frequent_flyer_number",
      dietaryRestrictions: "dietary_restrictions",
      mobilityAssistance: "mobility_assistance",
      isPrimary: "is_primary",
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateData[key] !== undefined) {
        updateFields.push(`${dbField} = $${paramCount}`);
        updateValues.push(updateData[key]);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // If setting as primary, update others
    if (updateData.isPrimary) {
      await client.query(
        `
        UPDATE faredown.travelers SET is_primary = false 
        WHERE user_id = $1 AND id != $2
      `,
        [req.userId, id],
      );
    }

    updateFields.push(`updated_at = now()`);
    updateValues.push(id, req.userId);

    const result = await client.query(
      `
      UPDATE faredown.travelers 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, first_name, last_name, updated_at
    `,
      updateValues,
    );

    await client.query("COMMIT");
    res.json({
      message: "Traveler updated successfully",
      traveler: result.rows[0],
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Update traveler error:", error);
    res.status(500).json({ error: "Failed to update traveler" });
  } finally {
    if (client) client.release();
  }
});

// DELETE /api/profile/travelers/:id - Delete traveler
router.delete("/travelers/:id", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const { id } = req.params;

    const result = await client.query(
      `
      DELETE FROM faredown.travelers 
      WHERE id = $1 AND user_id = $2
      RETURNING id, first_name, last_name
    `,
      [id, req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Traveler not found" });
    }

    res.json({
      message: "Traveler deleted successfully",
      traveler: result.rows[0],
    });
  } catch (error) {
    console.error("Delete traveler error:", error);
    res.status(500).json({ error: "Failed to delete traveler" });
  } finally {
    if (client) client.release();
  }
});

// ============================================================================
// PASSPORT ENDPOINTS
// ============================================================================

// GET /api/profile/travelers/:id/passports - Get passports for traveler
router.get(
  "/travelers/:travelerId/passports",
  authenticateUser,
  setPassportKey,
  async (req, res) => {
    try {
      const { travelerId } = req.params;

      // Verify traveler belongs to user
      const ownerCheck = await req.dbClient.query(
        `
      SELECT id FROM faredown.travelers WHERE id = $1 AND user_id = $2
    `,
        [travelerId, req.userId],
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Traveler not found" });
      }

      const result = await req.dbClient.query(
        `
      SELECT * FROM faredown.v_passports_masked 
      WHERE traveler_id = $1
      ORDER BY is_primary DESC, expiry_date DESC
    `,
        [travelerId],
      );

      res.json({ passports: result.rows });
    } catch (error) {
      console.error("Get passports error:", error);
      res.status(500).json({ error: "Failed to fetch passports" });
    } finally {
      req.dbClient.release();
    }
  },
);

// POST /api/profile/travelers/:id/passports - Add passport
router.post(
  "/travelers/:travelerId/passports",
  authenticateUser,
  setPassportKey,
  async (req, res) => {
    try {
      await req.dbClient.query("BEGIN");

      const { travelerId } = req.params;
      const {
        givenNames,
        surname,
        passportNumber,
        issuingCountry,
        issueDate,
        expiryDate,
        placeOfBirth,
        isPrimary,
      } = req.body;

      // Validate required fields
      if (
        !givenNames ||
        !surname ||
        !passportNumber ||
        !issuingCountry ||
        !expiryDate
      ) {
        return res.status(400).json({ error: "Required fields missing" });
      }

      // Verify traveler belongs to user
      const ownerCheck = await req.dbClient.query(
        `
      SELECT id FROM faredown.travelers WHERE id = $1 AND user_id = $2
    `,
        [travelerId, req.userId],
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Traveler not found" });
      }

      // If setting as primary, update others
      if (isPrimary) {
        await req.dbClient.query(
          `
        UPDATE faredown.passports SET is_primary = false 
        WHERE traveler_id = $1
      `,
          [travelerId],
        );
      }

      const result = await req.dbClient.query(
        `
      INSERT INTO faredown.passports (
        traveler_id, given_names, surname, number_enc, issuing_country,
        issue_date, expiry_date, place_of_birth, is_primary
      ) VALUES (
        $1, $2, $3, faredown.encrypt_passport_number($4), $5, $6, $7, $8, $9
      ) RETURNING id, given_names, surname, issuing_country, expiry_date, created_at
    `,
        [
          travelerId,
          givenNames,
          surname,
          passportNumber,
          issuingCountry,
          issueDate,
          expiryDate,
          placeOfBirth,
          isPrimary,
        ],
      );

      await req.dbClient.query("COMMIT");
      res.status(201).json({
        message: "Passport added successfully",
        passport: result.rows[0],
      });
    } catch (error) {
      await req.dbClient.query("ROLLBACK");
      console.error("Add passport error:", error);
      res.status(500).json({ error: "Failed to add passport" });
    } finally {
      req.dbClient.release();
    }
  },
);

// DELETE /api/profile/passports/:id - Delete passport
router.delete("/passports/:id", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const { id } = req.params;

    // Verify passport belongs to user's traveler
    const result = await client.query(
      `
      DELETE FROM faredown.passports 
      WHERE id = $1 AND traveler_id IN (
        SELECT id FROM faredown.travelers WHERE user_id = $2
      )
      RETURNING id, given_names, surname
    `,
      [id, req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Passport not found" });
    }

    res.json({
      message: "Passport deleted successfully",
      passport: result.rows[0],
    });
  } catch (error) {
    console.error("Delete passport error:", error);
    res.status(500).json({ error: "Failed to delete passport" });
  } finally {
    if (client) client.release();
  }
});

// ============================================================================
// PAYMENT METHODS ENDPOINTS
// ============================================================================

// GET /api/profile/payment-methods - Get payment methods
router.get("/payment-methods", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `
      SELECT 
        pm.id, pm.provider, pm.type, pm.brand, pm.last4,
        pm.exp_month, pm.exp_year, pm.holder_name, pm.is_default,
        pm.is_verified, pm.created_at,
        a.line1, a.line2, a.city, a.state, a.postal_code, a.country_iso2
      FROM faredown.payment_methods pm
      LEFT JOIN faredown.addresses a ON pm.billing_address_id = a.id
      WHERE pm.user_id = $1
      ORDER BY pm.is_default DESC, pm.created_at DESC
    `,
      [req.userId],
    );

    res.json({ paymentMethods: result.rows });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({ error: "Failed to fetch payment methods" });
  } finally {
    if (client) client.release();
  }
});

// POST /api/profile/payment-methods - Add payment method
router.post("/payment-methods", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const {
      provider,
      token,
      type,
      brand,
      last4,
      expMonth,
      expYear,
      holderName,
      isDefault,
      billingAddress,
    } = req.body;

    // Validate required fields
    if (!provider || !token || !type) {
      return res
        .status(400)
        .json({ error: "Provider, token, and type are required" });
    }

    let billingAddressId = null;
    if (billingAddress) {
      const addressResult = await client.query(
        `
        INSERT INTO faredown.addresses (line1, line2, city, state, postal_code, country_iso2)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
        [
          billingAddress.line1,
          billingAddress.line2,
          billingAddress.city,
          billingAddress.state,
          billingAddress.postalCode,
          billingAddress.countryIso2,
        ],
      );
      billingAddressId = addressResult.rows[0].id;
    }

    // If setting as default, update others
    if (isDefault) {
      await client.query(
        `
        UPDATE faredown.payment_methods SET is_default = false WHERE user_id = $1
      `,
        [req.userId],
      );
    }

    const result = await client.query(
      `
      INSERT INTO faredown.payment_methods (
        user_id, provider, token, type, brand, last4, exp_month, exp_year,
        holder_name, billing_address_id, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, provider, type, brand, last4, created_at
    `,
      [
        req.userId,
        provider,
        token,
        type,
        brand,
        last4,
        expMonth,
        expYear,
        holderName,
        billingAddressId,
        isDefault,
      ],
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: "Payment method added successfully",
      paymentMethod: result.rows[0],
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Add payment method error:", error);
    res.status(500).json({ error: "Failed to add payment method" });
  } finally {
    if (client) client.release();
  }
});

// PUT /api/profile/payment-methods/:id/default - Set default payment method
router.put(
  "/payment-methods/:id/default",
  authenticateUser,
  async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      await client.query("BEGIN");

      const { id } = req.params;

      // Verify payment method belongs to user
      const ownerCheck = await client.query(
        `
      SELECT id FROM faredown.payment_methods WHERE id = $1 AND user_id = $2
    `,
        [id, req.userId],
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      // Update all to not default
      await client.query(
        `
      UPDATE faredown.payment_methods SET is_default = false WHERE user_id = $1
    `,
        [req.userId],
      );

      // Set this one as default
      const result = await client.query(
        `
      UPDATE faredown.payment_methods SET is_default = true 
      WHERE id = $1 AND user_id = $2
      RETURNING id, provider, type, brand, last4
    `,
        [id, req.userId],
      );

      await client.query("COMMIT");
      res.json({
        message: "Default payment method updated",
        paymentMethod: result.rows[0],
      });
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      console.error("Set default payment method error:", error);
      res.status(500).json({ error: "Failed to set default payment method" });
    } finally {
      if (client) client.release();
    }
  },
);

// DELETE /api/profile/payment-methods/:id - Delete payment method
router.delete("/payment-methods/:id", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const { id } = req.params;

    const result = await client.query(
      `
      DELETE FROM faredown.payment_methods 
      WHERE id = $1 AND user_id = $2
      RETURNING id, provider, type, brand, last4
    `,
      [id, req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    res.json({
      message: "Payment method deleted successfully",
      paymentMethod: result.rows[0],
    });
  } catch (error) {
    console.error("Delete payment method error:", error);
    res.status(500).json({ error: "Failed to delete payment method" });
  } finally {
    if (client) client.release();
  }
});

// ============================================================================
// PREFERENCES ENDPOINTS
// ============================================================================

// GET /api/profile/preferences - Get user preferences
router.get("/preferences", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `
      SELECT * FROM faredown.user_preferences WHERE user_id = $1
    `,
      [req.userId],
    );

    if (result.rows.length === 0) {
      // Create default preferences
      const defaultResult = await client.query(
        `
        INSERT INTO faredown.user_preferences (user_id) VALUES ($1)
        RETURNING *
      `,
        [req.userId],
      );
      return res.json({ preferences: defaultResult.rows[0] });
    }

    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  } finally {
    if (client) client.release();
  }
});

// PUT /api/profile/preferences - Update preferences
router.put("/preferences", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const preferences = req.body;

    const result = await client.query(
      `
      UPDATE faredown.user_preferences SET
        currency_iso3 = COALESCE($1, currency_iso3),
        language = COALESCE($2, language),
        timezone = COALESCE($3, timezone),
        date_format = COALESCE($4, date_format),
        marketing_opt_in = COALESCE($5, marketing_opt_in),
        email_notifications = COALESCE($6, email_notifications),
        sms_notifications = COALESCE($7, sms_notifications),
        push_notifications = COALESCE($8, push_notifications),
        price_alerts = COALESCE($9, price_alerts),
        booking_reminders = COALESCE($10, booking_reminders),
        travel_tips = COALESCE($11, travel_tips),
        updated_at = now()
      WHERE user_id = $12
      RETURNING *
    `,
      [
        preferences.currencyIso3,
        preferences.language,
        preferences.timezone,
        preferences.dateFormat,
        preferences.marketingOptIn,
        preferences.emailNotifications,
        preferences.smsNotifications,
        preferences.pushNotifications,
        preferences.priceAlerts,
        preferences.bookingReminders,
        preferences.travelTips,
        req.userId,
      ],
    );

    res.json({
      message: "Preferences updated successfully",
      preferences: result.rows[0],
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  } finally {
    if (client) client.release();
  }
});

// ============================================================================
// BOOKING INTEGRATION ENDPOINTS
// ============================================================================

// GET /api/profile/booking-passengers/:bookingId - Get passengers for booking
router.get(
  "/booking-passengers/:bookingId",
  authenticateUser,
  async (req, res) => {
    let client;
    try {
      client = await pool.connect();

      const { bookingId } = req.params;

      const result = await client.query(
        `
      SELECT 
        bp.*, t.relationship, t.frequent_flyer_number
      FROM faredown.booking_passengers bp
      LEFT JOIN faredown.travelers t ON bp.traveler_id = t.id
      WHERE bp.booking_id = $1
      ORDER BY bp.created_at
    `,
        [bookingId],
      );

      res.json({ passengers: result.rows });
    } catch (error) {
      console.error("Get booking passengers error:", error);
      res.status(500).json({ error: "Failed to fetch booking passengers" });
    } finally {
      if (client) client.release();
    }
  },
);

// POST /api/profile/booking-passengers - Add passenger to booking from saved travelers
router.post("/booking-passengers", authenticateUser, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const { bookingId, travelerId } = req.body;

    // Get traveler details for snapshot
    const travelerResult = await client.query(
      `
      SELECT 
        t.*, 
        (SELECT right(faredown.decrypt_passport_number(p.number_enc), 4)
         FROM faredown.passports p 
         WHERE p.traveler_id = t.id 
         ORDER BY p.is_primary DESC, p.expiry_date DESC 
         LIMIT 1) as passport_last4
      FROM faredown.travelers t
      WHERE t.id = $1 AND t.user_id = $2
    `,
      [travelerId, req.userId],
    );

    if (travelerResult.rows.length === 0) {
      return res.status(404).json({ error: "Traveler not found" });
    }

    const traveler = travelerResult.rows[0];

    const result = await client.query(
      `
      INSERT INTO faredown.booking_passengers (
        booking_id, traveler_id, first_name, last_name, dob, gender,
        nationality_iso2, passport_last4, frequent_flyer_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        bookingId,
        travelerId,
        traveler.first_name,
        traveler.last_name,
        traveler.dob,
        traveler.gender,
        traveler.nationality_iso2,
        traveler.passport_last4,
        traveler.frequent_flyer_number,
      ],
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: "Passenger added to booking",
      passenger: result.rows[0],
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Add booking passenger error:", error);
    res.status(500).json({ error: "Failed to add passenger to booking" });
  } finally {
    if (client) client.release();
  }
});
export default router;