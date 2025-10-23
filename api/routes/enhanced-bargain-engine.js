import express from "express";
/**
 * Enhanced Bargain Engine API
 * Implements comprehensive bargain logic with proper formula and round-specific messaging
 * Formula: Final bargain price = Supplier Net Rate â€“ (Markup Amount + Promo Code Discount)
 */

const { Client } = require("pg");
const crypto = require("crypto");
const router = express.Router();

// Database connection pool
let pgPool;
try {
  const { Pool } = require("pg");
  pgPool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "faredown_booking_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com') ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} catch (error) {
  console.error("âŒ Database pool initialization failed:", error);
}

// Round-specific messaging templates
const ROUND_MESSAGES = {
  1: {
    type: "best_offer",
    checking: "Let me check with the {module} provider about your offer of {userPrice}â€¦",
    success: "Good news! We can offer you {bargainPrice} for this booking.",
    warning: "This is a special price â€” it may not be available again if you continue bargaining.",
    matched: "Congratulations! Your price of {userPrice} is matched. You can book right now."
  },
  2: {
    type: "risk_round", 
    warning_before: "Are you sure you want to try again? This offer may not be better than the previous one.",
    checking: "Rechecking with the {module} provider at {userPrice}â€¦",
    success: "We can offer {bargainPrice} this time.",
    additional: "Remember, the first price is usually the best â€” this one might not last long.",
    matched: "Congratulations! Your price of {userPrice} is matched. You can book right now."
  },
  3: {
    type: "final_chance",
    warning_before: "This is your last round. The price could be better, the same, or even higher.",
    checking: "Final check with the {module} provider at {userPrice}â€¦",
    success: "Great news! We can offer {bargainPrice} for this booking.",
    urgency: "You have **30 seconds** to book at this price, or the offer will expire.",
    matched: "Congratulations! Your price of {userPrice} is matched. Book now."
  },
  expired: {
    message: "The special offer has expired. You can try again or book at the original price of {originalPrice}."
  }
};

/**
 * @api {post} /api/enhanced-bargain/start Start Enhanced Bargain Session
 * @apiName StartEnhancedBargain
 * @apiGroup EnhancedBargain
 * @apiVersion 2.0.0
 */
router.post("/start", async (req, res) => {
  try {
    const {
      user_id,
      module,  // 'flights', 'hotels', 'sightseeing', 'transfers'
      product_id,
      supplier_net_rate,
      product_details = {},
      promo_code = null
    } = req.body;

    // Validate required fields
    if (!user_id || !module || !product_id || !supplier_net_rate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: user_id, module, product_id, supplier_net_rate"
      });
    }

    // Get module ID
    const moduleResult = await pgPool.query(
      "SELECT id FROM modules WHERE name = $1 AND active = true",
      [module]
    );

    if (moduleResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid module: ${module}`
      });
    }

    const module_id = moduleResult.rows[0].id;

    // Calculate initial bargain pricing using the database function
    const pricingResult = await pgPool.query(
      "SELECT * FROM calculate_enhanced_bargain_price($1, $2, $3)",
      [supplier_net_rate, module, promo_code]
    );

    const pricing = pricingResult.rows[0];

    // Create bargain session
    const sessionId = crypto.randomUUID();
    await pgPool.query(`
      INSERT INTO bargain_sessions (
        id, user_id, module_id, product_ref, base_price, status, 
        max_attempts, ai_personality, user_context
      ) VALUES ($1, $2, $3, $4, $5, 'active', 3, 'enhanced', $6)
    `, [
      sessionId,
      user_id,
      module_id,
      product_id,
      supplier_net_rate,
      JSON.stringify({
        product_details,
        promo_code,
        supplier_net_rate,
        pricing
      })
    ]);

    // Calculate display price with markup (this is what customer sees initially)
    const display_price = Math.round(supplier_net_rate + pricing.markup_amount);

    res.json({
      success: true,
      session_id: sessionId,
      module,
      supplier_net_rate,
      display_price: Math.round(display_price),
      bargain_range: {
        min: Math.round(pricing.bargain_range_min),
        max: Math.round(pricing.bargain_range_max)
      },
      total_discount_available: Math.round(pricing.total_discount),
      markup_details: {
        amount: Math.round(pricing.markup_amount),
        percentage: ((pricing.markup_amount / supplier_net_rate) * 100).toFixed(1)
      },
      promo_details: promo_code ? {
        code: promo_code,
        discount: Math.round(pricing.promo_discount)
      } : null,
      recommended_target: Math.round(pricing.final_price),
      instructions: "Enter your target price to start the AI bargain process. The first round typically offers the best deals!"
    });

  } catch (error) {
    console.error("Enhanced bargain start error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start bargain session",
      details: error.message
    });
  }
});

/**
 * @api {post} /api/enhanced-bargain/offer Process Bargain Offer
 * @apiName ProcessBargainOffer
 * @apiGroup EnhancedBargain
 * @apiVersion 2.0.0
 */
router.post("/offer", async (req, res) => {
  try {
    const {
      session_id,
      user_target_price,
      round_number = 1
    } = req.body;

    // Validate inputs
    if (!session_id || !user_target_price) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: session_id, user_target_price"
      });
    }

    if (round_number < 1 || round_number > 3) {
      return res.status(400).json({
        success: false,
        error: "Invalid round_number. Must be between 1 and 3"
      });
    }

    // Get session details
    const sessionResult = await pgPool.query(`
      SELECT bs.*, m.name as module_name
      FROM bargain_sessions bs
      JOIN modules m ON bs.module_id = m.id
      WHERE bs.id = $1 AND bs.status = 'active'
    `, [session_id]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Bargain session not found or inactive"
      });
    }

    const session = sessionResult.rows[0];
    const user_context = session.user_context || {};
    const supplier_net_rate = user_context.supplier_net_rate || session.base_price;
    const promo_code = user_context.promo_code;

    // Recalculate pricing for this round
    const pricingResult = await pgPool.query(
      "SELECT * FROM calculate_enhanced_bargain_price($1, $2, $3)",
      [supplier_net_rate, session.module_name, promo_code]
    );

    const pricing = pricingResult.rows[0];

    // Check if user target price matches the total discount range (Price Match Logic)
    const price_matched = await pgPool.query(
      "SELECT check_enhanced_price_match($1, $2, $3, $4) as is_match",
      [user_target_price, pricing.total_discount, supplier_net_rate, 0.02]  // 2% tolerance
    );

    const is_price_matched = price_matched.rows[0].is_match;

    // Generate AI counter-offer based on round logic
    let ai_counter_price;
    let round_status;
    let ai_message;
    let warning_message = null;

    if (is_price_matched) {
      // User price matches! Accept it
      round_status = "matched";
      ai_counter_price = user_target_price;
      ai_message = ROUND_MESSAGES[round_number].matched
        .replace("{userPrice}", `â‚¹${user_target_price.toLocaleString()}`);
    } else {
      // Generate counter-offer based on round
      round_status = "completed";
      
      if (round_number === 1) {
        // Round 1: Best offer (slightly below the calculated price)
        const tilt_factor = 0.995; // 0.5% better than calculated
        ai_counter_price = Math.round(pricing.final_price * tilt_factor);
        
        ai_message = ROUND_MESSAGES[1].checking
          .replace("{module}", session.module_name)
          .replace("{userPrice}", `â‚¹${user_target_price.toLocaleString()}`) +
          " " +
          ROUND_MESSAGES[1].success
          .replace("{bargainPrice}", `â‚¹${ai_counter_price.toLocaleString()}`) +
          " " +
          ROUND_MESSAGES[1].warning;
          
      } else if (round_number === 2) {
        // Round 2: Risk round (randomize around calculated price Â±2%)
        const risk_factor = 0.98 + (Math.random() * 0.04); // Between 98% and 102%
        ai_counter_price = Math.round(pricing.final_price * risk_factor);
        
        warning_message = ROUND_MESSAGES[2].warning_before;
        ai_message = ROUND_MESSAGES[2].checking
          .replace("{module}", session.module_name)
          .replace("{userPrice}", `â‚¹${user_target_price.toLocaleString()}`) +
          " " +
          ROUND_MESSAGES[2].success
          .replace("{bargainPrice}", `â‚¹${ai_counter_price.toLocaleString()}`) +
          " " +
          ROUND_MESSAGES[2].additional;
          
      } else {
        // Round 3: Final chance (could be better/same/worse; time-boxed)
        const final_factor = 0.97 + (Math.random() * 0.06); // Between 97% and 103%
        ai_counter_price = Math.round(pricing.final_price * final_factor);
        
        warning_message = ROUND_MESSAGES[3].warning_before;
        ai_message = ROUND_MESSAGES[3].checking
          .replace("{module}", session.module_name)
          .replace("{userPrice}", `â‚¹${user_target_price.toLocaleString()}`) +
          " " +
          ROUND_MESSAGES[3].success
          .replace("{bargainPrice}", `â‚¹${ai_counter_price.toLocaleString()}`) +
          " " +
          ROUND_MESSAGES[3].urgency;
      }
    }

    // Ensure minimum margin (never go below supplier net rate + 2%)
    const minimum_price = Math.round(supplier_net_rate * 1.02);
    ai_counter_price = Math.max(ai_counter_price, minimum_price);

    // Create bargain round record
    await pgPool.query(`
      INSERT INTO bargain_rounds (
        session_id, round_number, user_target_price, ai_counter_price, round_status,
        supplier_net_price, markup_amount, promo_discount, total_discount,
        ai_message, warning_message, round_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      session_id,
      round_number,
      user_target_price,
      ai_counter_price,
      round_status,
      supplier_net_rate,
      pricing.markup_amount,
      pricing.promo_discount,
      pricing.total_discount,
      ai_message,
      warning_message,
      ROUND_MESSAGES[round_number].type
    ]);

    // Update session attempt count
    await pgPool.query(
      "UPDATE bargain_sessions SET attempt_count = $1 WHERE id = $2",
      [round_number, session_id]
    );

    // Create response
    const response = {
      success: true,
      session_id,
      round_number,
      round_type: ROUND_MESSAGES[round_number].type,
      user_target_price,
      ai_counter_price,
      round_status,
      ai_message,
      pricing_breakdown: {
        supplier_net_rate,
        markup_amount: Math.round(pricing.markup_amount),
        promo_discount: Math.round(pricing.promo_discount),
        total_discount: Math.round(pricing.total_discount),
        display_price: Math.round(supplier_net_rate + pricing.markup_amount),
        your_savings: Math.max(0, Math.round((supplier_net_rate + pricing.markup_amount) - ai_counter_price))
      },
      is_price_matched,
      can_continue: round_number < 3 && !is_price_matched,
      next_round: round_number < 3 ? round_number + 1 : null
    };

    // Add warning message for rounds 2 & 3
    if (warning_message) {
      response.warning_message = warning_message;
    }

    // If price is matched or it's round 3, create a hold
    if (is_price_matched || round_number === 3) {
      const hold_expires_at = new Date(Date.now() + 30000); // 30 seconds from now
      
      const holdResult = await pgPool.query(`
        INSERT INTO bargain_holds_enhanced (
          session_id, module_id, product_id, original_price, supplier_net_price,
          markup_amount, promo_discount, total_discount, final_hold_price,
          expires_at, promo_code_id, markup_rule_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
        RETURNING id, expires_at
      `, [
        session_id,
        session.module_id,
        session.product_ref,
        supplier_net_rate + pricing.markup_amount,
        supplier_net_rate,
        pricing.markup_amount,
        pricing.promo_discount,
        pricing.total_discount,
        ai_counter_price,
        hold_expires_at,
        null, // promo_code_id (would need to be resolved from promo_codes_enhanced)
        null  // markup_rule_id (would need to be resolved)
      ]);

      response.hold = {
        id: holdResult.rows[0].id,
        expires_at: holdResult.rows[0].expires_at,
        duration_seconds: 30,
        message: is_price_matched 
          ? "Your price is held for 30 seconds. Book now!"
          : "Final offer held for 30 seconds. Decide quickly!"
      };
    }

    res.json(response);

  } catch (error) {
    console.error("Enhanced bargain offer error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process bargain offer",
      details: error.message
    });
  }
});

/**
 * @api {post} /api/enhanced-bargain/accept Accept Bargain Offer
 * @apiName AcceptBargainOffer
 * @apiGroup EnhancedBargain
 * @apiVersion 2.0.0
 */
router.post("/accept", async (req, res) => {
  try {
    const { session_id, hold_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: session_id"
      });
    }

    // Get active hold
    const holdResult = await pgPool.query(`
      SELECT bh.*, bs.user_id, bs.product_ref, m.name as module_name
      FROM bargain_holds_enhanced bh
      JOIN bargain_sessions bs ON bh.session_id = bs.id
      JOIN modules m ON bh.module_id = m.id
      WHERE bh.session_id = $1 
        AND bh.status = 'active' 
        AND bh.expires_at > NOW()
      ORDER BY bh.created_at DESC
      LIMIT 1
    `, [session_id]);

    if (holdResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No active hold found or hold has expired"
      });
    }

    const hold = holdResult.rows[0];

    // Generate booking reference
    const booking_reference = `BRG_${Date.now()}_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Update hold status to consumed
    await pgPool.query(
      "UPDATE bargain_holds_enhanced SET status = 'consumed', consumed_at = NOW(), booking_reference = $1 WHERE id = $2",
      [booking_reference, hold.id]
    );

    // Update session status to completed
    await pgPool.query(
      "UPDATE bargain_sessions SET status = 'completed', final_price = $1 WHERE id = $2",
      [hold.final_hold_price, session_id]
    );

    res.json({
      success: true,
      message: "Bargain offer accepted successfully!",
      booking_reference,
      final_price: hold.final_hold_price,
      module: hold.module_name,
      product_id: hold.product_id,
      savings: hold.original_price - hold.final_hold_price,
      hold_details: {
        original_price: hold.original_price,
        supplier_net_price: hold.supplier_net_price,
        markup_amount: hold.markup_amount,
        promo_discount: hold.promo_discount,
        total_discount: hold.total_discount,
        final_price: hold.final_hold_price
      },
      next_steps: {
        message: "Proceed to booking with this confirmed price",
        expires_in_minutes: 15,
        booking_reference
      }
    });

  } catch (error) {
    console.error("Enhanced bargain accept error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to accept bargain offer",
      details: error.message
    });
  }
});

/**
 * @api {get} /api/enhanced-bargain/session/:id Get Bargain Session
 * @apiName GetBargainSession
 * @apiGroup EnhancedBargain
 * @apiVersion 2.0.0
 */
router.get("/session/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get session with rounds
    const sessionResult = await pgPool.query(`
      SELECT 
        bs.*,
        m.name as module_name,
        m.display_name as module_display_name,
        json_agg(
          json_build_object(
            'round_number', br.round_number,
            'user_target_price', br.user_target_price,
            'ai_counter_price', br.ai_counter_price,
            'round_status', br.round_status,
            'ai_message', br.ai_message,
            'warning_message', br.warning_message,
            'round_type', br.round_type,
            'created_at', br.created_at
          ) ORDER BY br.round_number
        ) FILTER (WHERE br.id IS NOT NULL) as rounds
      FROM bargain_sessions bs
      JOIN modules m ON bs.module_id = m.id
      LEFT JOIN bargain_rounds br ON bs.id = br.session_id
      WHERE bs.id = $1
      GROUP BY bs.id, m.name, m.display_name
    `, [id]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Bargain session not found"
      });
    }

    const session = sessionResult.rows[0];

    // Get active hold if any
    const holdResult = await pgPool.query(`
      SELECT * FROM bargain_holds_enhanced
      WHERE session_id = $1 AND status = 'active' AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `, [id]);

    const active_hold = holdResult.rows.length > 0 ? holdResult.rows[0] : null;

    res.json({
      success: true,
      session: {
        id: session.id,
        user_id: session.user_id,
        module: session.module_name,
        module_display_name: session.module_display_name,
        product_ref: session.product_ref,
        base_price: session.base_price,
        final_price: session.final_price,
        status: session.status,
        attempt_count: session.attempt_count,
        max_attempts: session.max_attempts,
        created_at: session.created_at,
        expires_at: session.expires_at,
        rounds: session.rounds || [],
        active_hold
      }
    });

  } catch (error) {
    console.error("Get bargain session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get bargain session",
      details: error.message
    });
  }
});

/**
 * @api {post} /api/enhanced-bargain/cleanup Cleanup Expired Holds
 * @apiName CleanupExpiredHolds
 * @apiGroup EnhancedBargain
 * @apiVersion 2.0.0
 */
router.post("/cleanup", async (req, res) => {
  try {
    const result = await pgPool.query("SELECT cleanup_expired_bargain_holds() as expired_count");
    const expired_count = result.rows[0].expired_count;

    res.json({
      success: true,
      message: `Cleaned up ${expired_count} expired holds`,
      expired_count
    });

  } catch (error) {
    console.error("Cleanup expired holds error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup expired holds",
      details: error.message
    });
  }
});
export default router;