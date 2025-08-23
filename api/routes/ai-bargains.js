/**
 * AI Bargain Routes
 * Handles conversational bargaining logic with PostgreSQL persistence
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const db = require("../database/connection");

// Rate limiting
const rateLimit = require("express-rate-limit");

// Bargain-specific rate limiter
const bargainRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 bargain requests per minute
  message: {
    error: "Too many bargain attempts",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all bargain routes
router.use(bargainRateLimit);

/**
 * POST /bargains/quote
 * Core AI bargaining endpoint - atomic decision in one call
 *
 * Request Body:
 * {
 *   module: "flights" | "hotels" | "sightseeing" | "transfers",
 *   productRef: string,
 *   userOffer: number,
 *   basePrice: number,
 *   sessionId?: string,
 *   userId?: string,
 *   routeInfo?: object,
 *   departureDate?: string
 * }
 */
router.post("/quote", async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      module,
      productRef,
      userOffer,
      basePrice,
      sessionId,
      userId,
      routeInfo = {},
      departureDate,
      attemptNumber = 1,
    } = req.body;

    // Validation
    if (!module || !productRef || !userOffer || !basePrice) {
      return res.status(400).json({
        error:
          "Missing required fields: module, productRef, userOffer, basePrice",
        code: "INVALID_REQUEST",
      });
    }

    if (typeof userOffer !== "number" || typeof basePrice !== "number") {
      return res.status(400).json({
        error: "userOffer and basePrice must be numbers",
        code: "INVALID_DATA_TYPE",
      });
    }

    if (userOffer <= 0 || basePrice <= 0) {
      return res.status(400).json({
        error: "userOffer and basePrice must be positive numbers",
        code: "INVALID_PRICE_RANGE",
      });
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || uuidv4();

    // AI Decision Logic
    const discountPercentage = (basePrice - userOffer) / basePrice;

    // Acceptance probability based on discount percentage
    let acceptanceChance;
    if (discountPercentage <= 0.2) {
      // 20% or less discount
      acceptanceChance = 0.8; // 80% chance
    } else if (discountPercentage <= 0.3) {
      // 30% or less discount
      acceptanceChance = 0.6; // 60% chance
    } else {
      // More than 30% discount
      acceptanceChance = 0.4; // 40% chance
    }

    // Add some randomness based on attempt number (lower chance on later attempts)
    if (attemptNumber > 1) {
      acceptanceChance *= 1 - (attemptNumber - 1) * 0.1; // Reduce by 10% per attempt
    }

    const isAccepted = Math.random() < acceptanceChance;

    let resultPrice = userOffer;
    let status = "accepted";

    if (!isAccepted) {
      // Counter offer calculation - gets more aggressive with each round
      const counterFactors = [0.1, 0.05, 0.02]; // Round 1: 10%, Round 2: 5%, Round 3: 2%
      const counterFactor = counterFactors[attemptNumber - 1] || 0.02;
      resultPrice = Math.round(
        userOffer + (basePrice - userOffer) * counterFactor,
      );
      status = "counter";
    }

    // Calculate savings
    const savings = basePrice - resultPrice;
    const savingsPercentage = (savings / basePrice) * 100;

    // AI emotional state and decision path for analytics
    const aiEmotion = isAccepted ? "agreeable" : "negotiating";
    const decisionPath = [
      { step: "discount_analysis", discountPercentage },
      { step: "acceptance_probability", acceptanceChance },
      { step: "decision", isAccepted },
      { step: "counter_calculation", resultPrice },
    ];

    // User behavior tracking
    const userBehavior = {
      discountRequested: discountPercentage,
      priceGap: basePrice - userOffer,
      attemptNumber,
      timestamp: new Date().toISOString(),
    };

    try {
      // Log the bargain event to database
      const eventResult = await db.query(
        `
        INSERT INTO bargain_events (
          session_id, attempt_no, user_offer, base_price, result_price, 
          status, latency_ms, decision_path, ai_emotion, user_behavior
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
        [
          finalSessionId,
          attemptNumber,
          userOffer,
          basePrice,
          resultPrice,
          status,
          Date.now() - startTime,
          JSON.stringify(decisionPath),
          aiEmotion,
          JSON.stringify(userBehavior),
        ],
      );

      console.log(`✅ Bargain event logged: ${eventResult.rows[0].id}`);
    } catch (dbError) {
      console.error("❌ Failed to log bargain event:", dbError);
      // Continue without failing the request
    }

    // Success response
    res.json({
      success: true,
      sessionId: finalSessionId,
      status,
      userOffer,
      resultPrice,
      basePrice,
      savings,
      savingsPercentage: Math.round(savingsPercentage * 100) / 100,
      isAccepted,
      attemptNumber,
      aiEmotion,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Bargain quote error:", error);
    res.status(500).json({
      error: "Internal server error during bargain processing",
      code: "PROCESSING_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /bargains/hold
 * Create a 30-second hold on accepted price
 *
 * Request Body:
 * {
 *   sessionId: string,
 *   finalPrice: number,
 *   holdSeconds?: number (default 30)
 * }
 */
router.post("/hold", async (req, res) => {
  try {
    const { sessionId, finalPrice, holdSeconds = 30 } = req.body;

    // Validation
    if (!sessionId || !finalPrice) {
      return res.status(400).json({
        error: "Missing required fields: sessionId, finalPrice",
        code: "INVALID_REQUEST",
      });
    }

    if (typeof finalPrice !== "number" || finalPrice <= 0) {
      return res.status(400).json({
        error: "finalPrice must be a positive number",
        code: "INVALID_PRICE",
      });
    }

    const holdId = uuidv4();
    const expiresAt = new Date(Date.now() + holdSeconds * 1000);

    // Create hold record
    await db.query(
      `
      INSERT INTO bargain_holds (id, session_id, final_price, hold_seconds, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [holdId, sessionId, finalPrice, holdSeconds, expiresAt],
    );

    console.log(`✅ Bargain hold created: ${holdId} for ${finalPrice}`);

    res.json({
      success: true,
      holdId,
      sessionId,
      finalPrice,
      holdSeconds,
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Hold creation error:", error);
    res.status(500).json({
      error: "Failed to create price hold",
      code: "HOLD_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /bargains/hold/:holdId/book
 * Convert a hold into a confirmed booking
 */
router.put("/hold/:holdId/book", async (req, res) => {
  try {
    const { holdId } = req.params;
    const { orderRef } = req.body;

    if (!holdId) {
      return res.status(400).json({
        error: "Missing holdId parameter",
        code: "INVALID_REQUEST",
      });
    }

    // Check if hold exists and is still valid
    const holdResult = await db.query(
      `
      SELECT * FROM bargain_holds 
      WHERE id = $1 AND status = 'holding' AND expires_at > NOW()
    `,
      [holdId],
    );

    if (holdResult.rows.length === 0) {
      return res.status(404).json({
        error: "Hold not found or expired",
        code: "HOLD_NOT_FOUND",
      });
    }

    const hold = holdResult.rows[0];

    // Update hold status to booked
    await db.query(
      `
      UPDATE bargain_holds 
      SET status = 'booked', order_ref = $1 
      WHERE id = $2
    `,
      [orderRef, holdId],
    );

    console.log(
      `✅ Bargain hold converted to booking: ${holdId} -> ${orderRef}`,
    );

    res.json({
      success: true,
      holdId,
      orderRef,
      finalPrice: hold.final_price,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Booking conversion error:", error);
    res.status(500).json({
      error: "Failed to convert hold to booking",
      code: "BOOKING_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /bargains/session/:sessionId
 * Get bargain session history
 */
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: "Missing sessionId parameter",
        code: "INVALID_REQUEST",
      });
    }

    // Get session events
    const eventsResult = await db.query(
      `
      SELECT * FROM bargain_events 
      WHERE session_id = $1 
      ORDER BY created_at ASC
    `,
      [sessionId],
    );

    // Get any holds for this session
    const holdsResult = await db.query(
      `
      SELECT * FROM bargain_holds 
      WHERE session_id = $1 
      ORDER BY created_at DESC
    `,
      [sessionId],
    );

    res.json({
      success: true,
      sessionId,
      events: eventsResult.rows,
      holds: holdsResult.rows,
      totalAttempts: eventsResult.rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Session history error:", error);
    res.status(500).json({
      error: "Failed to retrieve session history",
      code: "SESSION_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /bargains/analytics
 * Get bargain analytics (admin only)
 */
router.get("/analytics", async (req, res) => {
  try {
    const { timeframe = "24h", module } = req.query;

    // Calculate time filter
    let timeFilter = "created_at > NOW() - INTERVAL '24 hours'";
    if (timeframe === "7d") {
      timeFilter = "created_at > NOW() - INTERVAL '7 days'";
    } else if (timeframe === "30d") {
      timeFilter = "created_at > NOW() - INTERVAL '30 days'";
    }

    // Module filter
    let moduleFilter = "";
    if (
      module &&
      ["flights", "hotels", "sightseeing", "transfers"].includes(module)
    ) {
      moduleFilter = `AND EXISTS (
        SELECT 1 FROM bargain_sessions bs 
        JOIN modules m ON bs.module_id = m.id 
        WHERE bs.id = bargain_events.session_id AND m.name = '${module}'
      )`;
    }

    // Get analytics data
    const analyticsResult = await db.query(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_offers,
        COUNT(CASE WHEN status = 'counter' THEN 1 END) as counter_offers,
        AVG(user_offer) as avg_user_offer,
        AVG(base_price) as avg_base_price,
        AVG(result_price) as avg_result_price,
        AVG(latency_ms) as avg_response_time,
        AVG((base_price - result_price) / base_price * 100) as avg_savings_percentage
      FROM bargain_events 
      WHERE ${timeFilter} ${moduleFilter}
    `);

    // Get success rate by attempt number
    const successRateResult = await db.query(`
      SELECT 
        attempt_no,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        ROUND(COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
      FROM bargain_events 
      WHERE ${timeFilter} ${moduleFilter}
      GROUP BY attempt_no 
      ORDER BY attempt_no
    `);

    const analytics = analyticsResult.rows[0];
    const successRates = successRateResult.rows;

    res.json({
      success: true,
      timeframe,
      module: module || "all",
      analytics: {
        totalAttempts: parseInt(analytics.total_attempts) || 0,
        acceptedOffers: parseInt(analytics.accepted_offers) || 0,
        counterOffers: parseInt(analytics.counter_offers) || 0,
        overallSuccessRate:
          analytics.total_attempts > 0
            ? Math.round(
                (analytics.accepted_offers / analytics.total_attempts) *
                  100 *
                  100,
              ) / 100
            : 0,
        averageUserOffer: Math.round(parseFloat(analytics.avg_user_offer) || 0),
        averageBasePrice: Math.round(parseFloat(analytics.avg_base_price) || 0),
        averageResultPrice: Math.round(
          parseFloat(analytics.avg_result_price) || 0,
        ),
        averageResponseTime: Math.round(
          parseFloat(analytics.avg_response_time) || 0,
        ),
        averageSavingsPercentage:
          Math.round(
            (parseFloat(analytics.avg_savings_percentage) || 0) * 100,
          ) / 100,
      },
      successRatesByAttempt: successRates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Analytics error:", error);
    res.status(500).json({
      error: "Failed to retrieve analytics",
      code: "ANALYTICS_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /bargains/cleanup
 * Clean up expired holds (maintenance endpoint)
 */
router.delete("/cleanup", async (req, res) => {
  try {
    const result = await db.query(`
      UPDATE bargain_holds 
      SET status = 'expired' 
      WHERE status = 'holding' AND expires_at < NOW()
      RETURNING id
    `);

    const expiredCount = result.rows.length;
    console.log(`✅ Cleaned up ${expiredCount} expired holds`);

    res.json({
      success: true,
      expiredHolds: expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    res.status(500).json({
      error: "Failed to cleanup expired holds",
      code: "CLEANUP_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "ai-bargains",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

module.exports = router;
