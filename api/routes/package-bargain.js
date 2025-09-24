/**
 * Package Bargain API Routes
 * Integrates packages with the existing bargain system
 * Handles bargain sessions for package total pricing
 */

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const crypto = require("crypto");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Bargain configuration
const BARGAIN_CONFIG = {
  MAX_ROUNDS: 3,
  ROUND_TIMEOUT: 30000, // 30 seconds
  DEFAULT_FLOOR_PERCENTAGE: 0.06, // 6% minimum margin
  ROUND_DISCOUNT_RATES: {
    1: 0.02, // 2% discount in round 1
    2: 0.04, // 4% discount in round 2  
    3: 0.05  // 5% discount in round 3 (final)
  }
};

// Helper function to generate session ID
function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

// Helper function to calculate bargain floor price
function calculateFloorPrice(baseTotal, floorPercentage = BARGAIN_CONFIG.DEFAULT_FLOOR_PERCENTAGE) {
  return Math.round(baseTotal * (1 - floorPercentage));
}

// Helper function to calculate system counter offer
function calculateCounterOffer(userOffer, baseTotal, round, floorPrice) {
  const discountRate = BARGAIN_CONFIG.ROUND_DISCOUNT_RATES[round] || 0.05;
  let systemOffer = Math.round(baseTotal * (1 - discountRate));
  
  // Ensure system offer is not below floor price
  systemOffer = Math.max(systemOffer, floorPrice);
  
  // If user offer is close to or above system offer, accept it
  if (userOffer >= systemOffer * 0.98) {
    return userOffer;
  }
  
  return systemOffer;
}

/**
 * POST /api/packages/:slug/bargain/start
 * Start a bargain session for a package
 */
router.post("/:slug/bargain/start", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { slug } = req.params;
    const { departure_id, adults = 1, children = 0, infants = 0 } = req.body;

    // Validate input
    if (!departure_id) {
      return res.status(400).json({
        success: false,
        error: "departure_id is required"
      });
    }

    // Get package and departure details
    const packageQuery = `
      SELECT 
        p.id, p.title, p.slug, p.category,
        pd.id as departure_id, pd.price_per_person, pd.child_price, 
        pd.infant_price, pd.currency, pd.available_seats,
        pd.departure_city_name, pd.departure_date
      FROM packages p
      JOIN package_departures pd ON pd.package_id = p.id
      WHERE p.slug = $1 AND pd.id = $2 AND p.status = 'active' 
        AND pd.is_active = TRUE AND pd.departure_date >= CURRENT_DATE
    `;

    const packageResult = await client.query(packageQuery, [slug, departure_id]);

    if (packageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Package or departure not found"
      });
    }

    const packageData = packageResult.rows[0];

    // Check availability
    if (packageData.available_seats < (adults + children)) {
      return res.status(400).json({
        success: false,
        error: "Not enough seats available"
      });
    }

    // Calculate base total
    const adultPrice = packageData.price_per_person * adults;
    const childPrice = (packageData.child_price || packageData.price_per_person * 0.8) * children;
    const infantPrice = (packageData.infant_price || 0) * infants;
    const baseTotal = adultPrice + childPrice + infantPrice;

    // Calculate floor price (minimum acceptable price)
    const floorPrice = calculateFloorPrice(baseTotal);

    // Generate session ID
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + BARGAIN_CONFIG.ROUND_TIMEOUT);

    // Store bargain session
    await client.query('BEGIN');

    const sessionQuery = `
      INSERT INTO bargain_sessions (
        session_id, package_id, departure_id, user_ip, user_agent,
        adults_count, children_count, infants_count,
        base_total, floor_price, current_round, max_rounds,
        session_status, expires_at, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, 'active', $12, NOW()
      )
    `;

    await client.query(sessionQuery, [
      sessionId,
      packageData.id,
      packageData.departure_id,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
      adults,
      children,
      infants,
      baseTotal,
      floorPrice,
      BARGAIN_CONFIG.MAX_ROUNDS,
      expiresAt
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        session_id: sessionId,
        package: {
          title: packageData.title,
          departure_city: packageData.departure_city_name,
          departure_date: packageData.departure_date
        },
        pricing: {
          base_total: baseTotal,
          floor_total: floorPrice,
          currency: packageData.currency
        },
        passengers: {
          adults,
          children,
          infants,
          total: adults + children + infants
        },
        bargain_info: {
          max_rounds: BARGAIN_CONFIG.MAX_ROUNDS,
          current_round: 0,
          expires_in_seconds: 30
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error starting bargain session:', error);
    res.status(500).json({
      success: false,
      error: "Failed to start bargain session",
      message: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/packages/bargain/:session_id/counter
 * Submit counter offer in bargain session
 */
router.post("/bargain/:session_id/counter", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { session_id } = req.params;
    const { user_offer } = req.body;

    if (!user_offer || user_offer <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid user_offer is required"
      });
    }

    await client.query('BEGIN');

    // Get session details
    const sessionQuery = `
      SELECT 
        bs.*,
        p.title as package_title,
        pd.departure_city_name,
        pd.departure_date,
        pd.currency
      FROM bargain_sessions bs
      JOIN packages p ON p.id = bs.package_id
      JOIN package_departures pd ON pd.id = bs.departure_id
      WHERE bs.session_id = $1 AND bs.session_status = 'active'
    `;

    const sessionResult = await client.query(sessionQuery, [session_id]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Bargain session not found or expired"
      });
    }

    const session = sessionResult.rows[0];

    // Check if session expired
    if (new Date() > new Date(session.expires_at)) {
      await client.query(
        "UPDATE bargain_sessions SET session_status = 'expired' WHERE session_id = $1",
        [session_id]
      );
      
      return res.status(400).json({
        success: false,
        error: "Bargain session has expired"
      });
    }

    // Check if max rounds reached
    if (session.current_round >= session.max_rounds) {
      return res.status(400).json({
        success: false,
        error: "Maximum bargain rounds reached"
      });
    }

    // Check if user offer is below floor price
    if (user_offer < session.floor_price) {
      return res.status(400).json({
        success: false,
        error: `Offer too low. Minimum acceptable price is ${session.currency} ${session.floor_price}`,
        min_price: session.floor_price
      });
    }

    const newRound = session.current_round + 1;
    const isLastRound = newRound >= session.max_rounds;

    // Calculate system counter offer
    const systemCounterOffer = calculateCounterOffer(
      user_offer, 
      session.base_total, 
      newRound, 
      session.floor_price
    );

    // Check if user offer is accepted
    const isAccepted = user_offer >= systemCounterOffer || user_offer >= session.floor_price * 1.02;
    const finalPrice = isAccepted ? user_offer : systemCounterOffer;

    // Update session
    const newExpiresAt = isAccepted || isLastRound 
      ? new Date(Date.now() + 300000) // 5 minutes to complete booking
      : new Date(Date.now() + BARGAIN_CONFIG.ROUND_TIMEOUT);

    const sessionStatus = isAccepted ? 'accepted' : (isLastRound ? 'completed' : 'active');

    await client.query(`
      UPDATE bargain_sessions 
      SET current_round = $1, 
          last_user_offer = $2,
          last_system_offer = $3,
          final_price = $4,
          session_status = $5,
          expires_at = $6,
          updated_at = NOW()
      WHERE session_id = $7
    `, [newRound, user_offer, systemCounterOffer, finalPrice, sessionStatus, newExpiresAt, session_id]);

    // Log the round
    await client.query(`
      INSERT INTO bargain_rounds (
        session_id, round_number, user_offer, system_offer,
        is_accepted, round_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [session_id, newRound, user_offer, systemCounterOffer, isAccepted, sessionStatus]);

    await client.query('COMMIT');

    // Prepare response based on round and acceptance
    const response = {
      success: true,
      data: {
        session_id,
        round: newRound,
        max_rounds: session.max_rounds,
        user_offer,
        system_counter_offer: systemCounterOffer,
        accepted: isAccepted,
        final_price: finalPrice,
        currency: session.currency,
        savings: session.base_total - finalPrice,
        savings_percentage: Math.round(((session.base_total - finalPrice) / session.base_total) * 100),
        expires_in_seconds: isAccepted || isLastRound ? 300 : 30,
        package: {
          title: session.package_title,
          departure_city: session.departure_city_name,
          departure_date: session.departure_date
        }
      }
    };

    // Add appropriate message based on round and result
    if (isAccepted) {
      response.data.message = `Congratulations! Your offer of ${session.currency} ${user_offer} has been accepted. You can proceed to book now.`;
      response.data.can_proceed_to_book = true;
    } else if (isLastRound) {
      response.data.message = `This was your final round. Our best offer is ${session.currency} ${systemCounterOffer}.`;
      response.data.can_proceed_to_book = true;
    } else {
      response.data.message = `Round ${newRound} - We can offer ${session.currency} ${systemCounterOffer}. You have ${session.max_rounds - newRound} more round(s).`;
      response.data.can_proceed_to_book = false;
    }

    res.json(response);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing bargain counter:', error);
    res.status(500).json({
      success: false,
      error: "Failed to process bargain offer",
      message: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/packages/bargain/:session_id/status
 * Get current bargain session status
 */
router.get("/bargain/:session_id/status", async (req, res) => {
  try {
    const { session_id } = req.params;

    const query = `
      SELECT 
        bs.*,
        p.title as package_title,
        pd.departure_city_name,
        pd.departure_date,
        pd.currency,
        (
          SELECT json_agg(
            json_build_object(
              'round', br.round_number,
              'user_offer', br.user_offer,
              'system_offer', br.system_offer,
              'is_accepted', br.is_accepted,
              'created_at', br.created_at
            )
            ORDER BY br.round_number
          )
          FROM bargain_rounds br
          WHERE br.session_id = bs.session_id
        ) as rounds
      FROM bargain_sessions bs
      JOIN packages p ON p.id = bs.package_id
      JOIN package_departures pd ON pd.id = bs.departure_id
      WHERE bs.session_id = $1
    `;

    const result = await pool.query(query, [session_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Bargain session not found"
      });
    }

    const session = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const isExpired = now > expiresAt;

    res.json({
      success: true,
      data: {
        session_id,
        status: isExpired ? 'expired' : session.session_status,
        package: {
          title: session.package_title,
          departure_city: session.departure_city_name,
          departure_date: session.departure_date
        },
        pricing: {
          base_total: session.base_total,
          floor_price: session.floor_price,
          final_price: session.final_price,
          currency: session.currency
        },
        rounds: {
          current_round: session.current_round,
          max_rounds: session.max_rounds,
          history: session.rounds || []
        },
        timing: {
          expires_at: session.expires_at,
          is_expired: isExpired,
          seconds_remaining: isExpired ? 0 : Math.max(0, Math.floor((expiresAt - now) / 1000))
        },
        passengers: {
          adults: session.adults_count,
          children: session.children_count,
          infants: session.infants_count
        }
      }
    });

  } catch (error) {
    console.error('Error fetching bargain status:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bargain status",
      message: error.message
    });
  }
});

/**
 * POST /api/packages/:slug/book
 * Book a package (with or without bargain)
 */
router.post("/:slug/book", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { slug } = req.params;
    const {
      departure_id,
      adults = 1,
      children = 0,
      infants = 0,
      guest_details,
      bargain_session_id,
      promo_code,
      special_requests
    } = req.body;

    // Validate required fields
    if (!departure_id || !guest_details) {
      return res.status(400).json({
        success: false,
        error: "departure_id and guest_details are required"
      });
    }

    await client.query('BEGIN');

    // Get package and departure details
    const packageQuery = `
      SELECT 
        p.id, p.title, p.slug,
        pd.id as departure_id, pd.price_per_person, pd.child_price, 
        pd.infant_price, pd.currency, pd.available_seats,
        pd.departure_city_name, pd.departure_date, pd.return_date
      FROM packages p
      JOIN package_departures pd ON pd.package_id = p.id
      WHERE p.slug = $1 AND pd.id = $2 AND p.status = 'active' 
        AND pd.is_active = TRUE AND pd.departure_date >= CURRENT_DATE
      FOR UPDATE
    `;

    const packageResult = await client.query(packageQuery, [slug, departure_id]);

    if (packageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Package or departure not found"
      });
    }

    const packageData = packageResult.rows[0];

    // Check availability
    if (packageData.available_seats < (adults + children)) {
      return res.status(400).json({
        success: false,
        error: "Not enough seats available"
      });
    }

    // Calculate pricing
    const adultPrice = packageData.price_per_person * adults;
    const childPrice = (packageData.child_price || packageData.price_per_person * 0.8) * children;
    const infantPrice = (packageData.infant_price || 0) * infants;
    const baseTotal = adultPrice + childPrice + infantPrice;

    let agreedTotal = baseTotal;
    let bargainDiscount = 0;

    // Apply bargain discount if session provided
    if (bargain_session_id) {
      const bargainQuery = `
        SELECT final_price, session_status 
        FROM bargain_sessions 
        WHERE session_id = $1 AND package_id = $2
      `;
      const bargainResult = await client.query(bargainQuery, [bargain_session_id, packageData.id]);
      
      if (bargainResult.rows.length > 0 && bargainResult.rows[0].session_status === 'accepted') {
        agreedTotal = bargainResult.rows[0].final_price;
        bargainDiscount = baseTotal - agreedTotal;
      }
    }

    // Generate booking reference
    const bookingRef = `PKG${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create booking
    const bookingQuery = `
      INSERT INTO package_bookings (
        booking_ref, package_id, departure_id,
        primary_guest_name, primary_guest_email, primary_guest_phone,
        guest_details, adults_count, children_count, infants_count,
        base_price_per_adult, base_price_per_child, base_price_per_infant,
        base_total, original_total, bargain_discount, agreed_total,
        bargain_session_id, promo_code, special_requests,
        final_amount, currency, booking_status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW()
      )
      RETURNING *
    `;

    const bookingValues = [
      bookingRef,
      packageData.id,
      packageData.departure_id,
      guest_details.primary_guest?.name || 'Unknown',
      guest_details.primary_guest?.email || '',
      guest_details.primary_guest?.phone || '',
      JSON.stringify(guest_details),
      adults,
      children,
      infants,
      packageData.price_per_person,
      packageData.child_price || packageData.price_per_person * 0.8,
      packageData.infant_price || 0,
      baseTotal,
      baseTotal,
      bargainDiscount,
      agreedTotal,
      bargain_session_id,
      promo_code,
      special_requests,
      agreedTotal, // For now, final_amount = agreed_total (before taxes/fees)
      packageData.currency,
      'confirmed'
    ];

    const bookingResult = await client.query(bookingQuery, bookingValues);

    // Update seat availability
    await client.query(
      `UPDATE package_departures 
       SET booked_seats = booked_seats + $1 
       WHERE id = $2`,
      [adults + children, departure_id]
    );

    await client.query('COMMIT');

    const booking = bookingResult.rows[0];

    res.status(201).json({
      success: true,
      message: "Package booked successfully",
      data: {
        booking_ref: booking.booking_ref,
        booking_id: booking.id,
        package_title: packageData.title,
        departure_date: packageData.departure_date,
        departure_city: packageData.departure_city_name,
        passengers: {
          adults,
          children,
          infants,
          total: adults + children + infants
        },
        pricing: {
          base_total: baseTotal,
          bargain_discount: bargainDiscount,
          agreed_total: agreedTotal,
          final_amount: booking.final_amount,
          currency: packageData.currency
        },
        next_steps: [
          "Payment processing will be initiated",
          "Booking confirmation will be sent via email",
          "Travel documents will be provided before departure"
        ]
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating package booking:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create booking",
      message: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
