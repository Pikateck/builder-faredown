const express = require("express");
const { body, validationResult, query } = require("express-validator");
const { pool } = require("../database/connection");
const router = express.Router();

// Middleware for authentication (adjust based on your auth system)
const requireAuth = (req, res, next) => {
  // Check for user in request (set by your auth middleware)
  if (!req.user && !req.headers['x-user-id']) {
    return res.status(401).json({ 
      success: false, 
      error: "Authentication required to submit reviews" 
    });
  }
  
  // If using header-based auth for development
  if (!req.user && req.headers['x-user-id']) {
    req.user = { id: req.headers['x-user-id'] };
  }
  
  next();
};

// Optional auth (for helpful/report endpoints)
const optionalAuth = (req, res, next) => {
  if (req.headers['x-user-id']) {
    req.user = { id: req.headers['x-user-id'] };
  }
  next();
};

// Admin middleware (adjust based on your admin system)
const requireAdmin = (req, res, next) => {
  // Check for admin role (implement based on your system)
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: "Admin access required" 
    });
  }
  next();
};

// Rate limiting helper
const rateLimitKey = (userId, propertyId) => `review_rate_${userId}_${propertyId}`;

// Helper function for validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array()
    });
  }
  return null;
};

// =====================================================
// PUBLIC REVIEW ENDPOINTS
// =====================================================

/**
 * POST /api/properties/:propertyId/reviews
 * Create a new review for a property
 */
router.post("/api/properties/:propertyId/reviews", 
  requireAuth,
  [
    // Validation rules
    body("overall_rating").isInt({ min: 1, max: 5 }).withMessage("Overall rating must be 1-5"),
    body("staff_rating").optional().isInt({ min: 1, max: 5 }),
    body("cleanliness_rating").optional().isInt({ min: 1, max: 5 }),
    body("value_rating").optional().isInt({ min: 1, max: 5 }),
    body("facilities_rating").optional().isInt({ min: 1, max: 5 }),
    body("comfort_rating").optional().isInt({ min: 1, max: 5 }),
    body("location_rating").optional().isInt({ min: 1, max: 5 }),
    body("wifi_rating").optional().isInt({ min: 1, max: 5 }),
    body("title").isLength({ min: 3, max: 200 }).withMessage("Title must be 3-200 characters"),
    body("body").isLength({ min: 50, max: 2000 }).withMessage("Review must be 50-2000 characters"),
    body("trip_type").isIn(["Leisure","Business","Family","Couple","Solo"]).withMessage("Invalid trip type"),
    body("room_type").optional().isLength({ max: 255 }),
    body("country_code").isLength({ min: 2, max: 2 }).withMessage("Country code must be 2 characters"),
    body("stay_start").isISO8601().withMessage("Invalid stay start date"),
    body("stay_end").isISO8601().withMessage("Invalid stay end date"),
    body("reviewer_name").isLength({ min: 1, max: 100 }).withMessage("Name is required")
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const validationError = handleValidationErrors(req, res);
      if (validationError) return;

      const { propertyId } = req.params;
      const user = req.user;
      const payload = req.body;

      // Validate date range
      const stayStart = new Date(payload.stay_start);
      const stayEnd = new Date(payload.stay_end);
      if (stayStart >= stayEnd) {
        return res.status(400).json({
          success: false,
          error: "Stay end date must be after start date"
        });
      }

      // Check for existing review from this user for this property
      const { rows: existingReviews } = await pool.query(
        "SELECT id FROM reviews WHERE user_id = $1 AND property_id = $2",
        [user.id, propertyId]
      );

      if (existingReviews.length > 0) {
        return res.status(409).json({
          success: false,
          error: "You have already reviewed this property"
        });
      }

      // Check for verified stay (if you have bookings data)
      let verified = false;
      try {
        const { rows: bookings } = await pool.query(
          `SELECT 1 FROM hotel_bookings 
           WHERE user_id = $1 AND hotel_code = $2 
           AND status = 'completed' AND check_out_date <= NOW() LIMIT 1`,
          [user.id, propertyId]
        );
        verified = bookings.length > 0;
      } catch (error) {
        console.warn("Could not check booking history for verification:", error.message);
        // Continue without verification
      }

      // Get country name from countries table
      let countryName = payload.country_code;
      try {
        const { rows: countries } = await pool.query(
          "SELECT name FROM public.countries WHERE iso2 = $1",
          [payload.country_code.toUpperCase()]
        );
        if (countries.length > 0) {
          countryName = countries[0].name;
        }
      } catch (error) {
        console.warn("Could not fetch country name:", error.message);
      }

      // Insert the review
      const query = `
        INSERT INTO reviews (
          property_id, user_id, overall_rating, staff_rating, cleanliness_rating, 
          value_rating, facilities_rating, comfort_rating, location_rating, wifi_rating,
          title, body, trip_type, room_type, country_code, stay_start, stay_end,
          verified_stay, status, reviewer_name, reviewer_country_name
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING id, created_at
      `;

      const values = [
        propertyId,
        user.id,
        payload.overall_rating,
        payload.staff_rating || null,
        payload.cleanliness_rating || null,
        payload.value_rating || null,
        payload.facilities_rating || null,
        payload.comfort_rating || null,
        payload.location_rating || null,
        payload.wifi_rating || null,
        payload.title,
        payload.body,
        payload.trip_type,
        payload.room_type || null,
        payload.country_code.toUpperCase(),
        payload.stay_start,
        payload.stay_end,
        verified,
        'pending', // All reviews start as pending
        payload.reviewer_name,
        countryName
      ];

      const { rows } = await pool.query(query, values);
      const review = rows[0];

      res.status(201).json({
        success: true,
        data: {
          id: review.id,
          status: "pending",
          verified_stay: verified,
          created_at: review.created_at,
          message: "Review submitted successfully and is pending approval"
        }
      });

    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to submit review"
      });
    }
  }
);

/**
 * GET /api/properties/:propertyId/reviews
 * Get reviews for a property with filtering and pagination
 */
router.get("/api/properties/:propertyId/reviews", [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be 1-50"),
  query("sort").optional().isIn(["recent", "top", "lowest", "helpful"]).withMessage("Invalid sort option"),
  query("filter").optional().isIn(["all", "verified", "trip_type"]).withMessage("Invalid filter option"),
  query("trip_type").optional().isIn(["Leisure","Business","Family","Couple","Solo"])
], async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { propertyId } = req.params;
    const {
      page = 1,
      limit = 20,
      sort = "recent",
      filter = "all",
      trip_type
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause
    let whereClause = "WHERE r.property_id = $1 AND r.status = 'approved'";
    const queryParams = [propertyId];
    let paramCount = 1;

    if (filter === "verified") {
      whereClause += " AND r.verified_stay = true";
    }

    if (trip_type) {
      paramCount++;
      whereClause += ` AND r.trip_type = $${paramCount}`;
      queryParams.push(trip_type);
    }

    // Build ORDER BY clause
    let orderClause;
    switch (sort) {
      case "top":
        orderClause = "ORDER BY r.overall_rating DESC, r.created_at DESC";
        break;
      case "lowest":
        orderClause = "ORDER BY r.overall_rating ASC, r.created_at DESC";
        break;
      case "helpful":
        orderClause = "ORDER BY r.helpful_count DESC, r.created_at DESC";
        break;
      default: // recent
        orderClause = "ORDER BY r.created_at DESC";
    }

    // Get reviews with responses
    const reviewsQuery = `
      SELECT 
        r.id, r.overall_rating, r.staff_rating, r.cleanliness_rating, r.value_rating,
        r.facilities_rating, r.comfort_rating, r.location_rating, r.wifi_rating,
        r.title, r.body, r.trip_type, r.room_type, r.country_code, 
        r.stay_start, r.stay_end, r.verified_stay, r.helpful_count, r.reported_count,
        r.reviewer_name, r.reviewer_country_name, r.created_at,
        rr.body as response_body, rr.created_at as response_date,
        (SELECT COUNT(*) FROM review_photos rp WHERE rp.review_id = r.id) as photo_count
      FROM reviews r
      LEFT JOIN review_responses rr ON r.id = rr.review_id
      ${whereClause}
      ${orderClause}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    queryParams.push(parseInt(limit), offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      ${whereClause}
    `;

    const [reviewsResult, countResult] = await Promise.all([
      pool.query(reviewsQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit/offset params
    ]);

    const reviews = reviewsResult.rows;
    const total = parseInt(countResult.rows[0].total);

    // Get summary stats
    const summaryQuery = `
      SELECT 
        total_approved, total_verified, avg_overall, avg_staff, avg_cleanliness,
        avg_value, avg_facilities, avg_comfort, avg_location, avg_wifi,
        leisure_count, business_count, family_count, couple_count, solo_count
      FROM vw_property_review_summary 
      WHERE property_id = $1
    `;

    const summaryResult = await pool.query(summaryQuery, [propertyId]);
    const summary = summaryResult.rows[0] || {
      total_approved: 0,
      avg_overall: null
    };

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        summary,
        filters: {
          sort,
          filter,
          trip_type
        }
      }
    });

  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch reviews"
    });
  }
});

/**
 * GET /api/properties/:propertyId/reviews/summary
 * Get review summary stats for a property
 */
router.get("/api/properties/:propertyId/reviews/summary", async (req, res) => {
  try {
    const { propertyId } = req.params;

    const query = `
      SELECT * FROM vw_property_review_summary 
      WHERE property_id = $1
    `;

    const { rows } = await pool.query(query, [propertyId]);
    
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          total_approved: 0,
          total_verified: 0,
          avg_overall: null,
          avg_staff: null,
          avg_cleanliness: null,
          avg_value: null,
          avg_facilities: null,
          avg_comfort: null,
          avg_location: null,
          avg_wifi: null
        }
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error("Error fetching review summary:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/reviews/:reviewId/helpful
 * Mark a review as helpful
 */
router.post("/api/reviews/:reviewId/helpful", requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check if user already voted helpful on this review
    const { rows: existingVotes } = await pool.query(
      "SELECT id FROM review_votes WHERE review_id = $1 AND user_id = $2 AND vote_type = 'helpful'",
      [reviewId, userId]
    );

    if (existingVotes.length > 0) {
      return res.status(409).json({
        success: false,
        error: "You have already marked this review as helpful"
      });
    }

    // Insert the helpful vote
    await pool.query(
      "INSERT INTO review_votes (review_id, user_id, vote_type) VALUES ($1, $2, 'helpful')",
      [reviewId, userId]
    );

    // Get updated helpful count
    const { rows: reviewRows } = await pool.query(
      "SELECT helpful_count FROM reviews WHERE id = $1",
      [reviewId]
    );

    res.json({
      success: true,
      data: {
        helpful_count: reviewRows[0]?.helpful_count || 0,
        message: "Review marked as helpful"
      }
    });

  } catch (error) {
    console.error("Error marking review as helpful:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/reviews/:reviewId/report
 * Report a review
 */
router.post("/api/reviews/:reviewId/report", requireAuth, [
  body("reason").optional().isLength({ max: 500 }).withMessage("Reason must be under 500 characters")
], async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { reviewId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    // Check if user already reported this review
    const { rows: existingVotes } = await pool.query(
      "SELECT id FROM review_votes WHERE review_id = $1 AND user_id = $2 AND vote_type = 'report'",
      [reviewId, userId]
    );

    if (existingVotes.length > 0) {
      return res.status(409).json({
        success: false,
        error: "You have already reported this review"
      });
    }

    // Insert the report vote
    await pool.query(
      "INSERT INTO review_votes (review_id, user_id, vote_type) VALUES ($1, $2, 'report')",
      [reviewId, userId]
    );

    // Log the report reason if provided (you might want a separate reports table)
    if (reason) {
      console.log(`Review ${reviewId} reported by user ${userId}: ${reason}`);
    }

    res.json({
      success: true,
      message: "Review reported successfully"
    });

  } catch (error) {
    console.error("Error reporting review:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// =====================================================
// ADMIN REVIEW ENDPOINTS
// =====================================================

/**
 * GET /api/admin/reviews
 * Get reviews for admin moderation with filtering
 */
router.get("/api/admin/reviews", requireAdmin, [
  query("property_id").optional().isInt().withMessage("Property ID must be an integer"),
  query("status").optional().isIn(["pending", "approved", "rejected"]).withMessage("Invalid status"),
  query("verified").optional().isBoolean().withMessage("Verified must be boolean"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1-100")
], async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const {
      property_id,
      status = "pending",
      verified,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause
    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramCount = 0;

    if (property_id) {
      whereClause += ` AND r.property_id = $${++paramCount}`;
      queryParams.push(property_id);
    }

    if (status) {
      whereClause += ` AND r.status = $${++paramCount}`;
      queryParams.push(status);
    }

    if (verified !== undefined) {
      whereClause += ` AND r.verified_stay = $${++paramCount}`;
      queryParams.push(verified === 'true');
    }

    const query = `
      SELECT 
        r.id, r.property_id, r.user_id, r.overall_rating, r.title, r.body,
        r.trip_type, r.room_type, r.country_code, r.stay_start, r.stay_end,
        r.verified_stay, r.status, r.helpful_count, r.reported_count,
        r.reviewer_name, r.reviewer_country_name, r.created_at, r.updated_at,
        rr.body as response_body, rr.created_at as response_date
      FROM reviews r
      LEFT JOIN review_responses rr ON r.id = rr.review_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    queryParams.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/admin/reviews/:reviewId/approve
 * Approve a review
 */
router.post("/api/admin/reviews/:reviewId/approve", requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const { rows } = await pool.query(
      "UPDATE reviews SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING id, status",
      [reviewId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Review not found"
      });
    }

    res.json({
      success: true,
      data: {
        id: rows[0].id,
        status: rows[0].status,
        message: "Review approved successfully"
      }
    });

  } catch (error) {
    console.error("Error approving review:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/admin/reviews/:reviewId/reject
 * Reject a review
 */
router.post("/api/admin/reviews/:reviewId/reject", requireAdmin, [
  body("reason").optional().isLength({ max: 500 }).withMessage("Reason must be under 500 characters")
], async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { reviewId } = req.params;
    const { reason } = req.body;

    const { rows } = await pool.query(
      "UPDATE reviews SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING id, status",
      [reviewId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Review not found"
      });
    }

    // Log rejection reason
    if (reason) {
      console.log(`Review ${reviewId} rejected by admin ${req.user.id}: ${reason}`);
    }

    res.json({
      success: true,
      data: {
        id: rows[0].id,
        status: rows[0].status,
        message: "Review rejected successfully"
      }
    });

  } catch (error) {
    console.error("Error rejecting review:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/admin/reviews/:reviewId/respond
 * Add an admin response to a review
 */
router.post("/api/admin/reviews/:reviewId/respond", requireAdmin, [
  body("body").isLength({ min: 10, max: 1000 }).withMessage("Response must be 10-1000 characters")
], async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { reviewId } = req.params;
    const { body: responseBody } = req.body;
    const adminId = req.user.id;

    // Check if review exists
    const { rows: reviewRows } = await pool.query(
      "SELECT id FROM reviews WHERE id = $1",
      [reviewId]
    );

    if (reviewRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Review not found"
      });
    }

    // Insert the response
    const { rows } = await pool.query(
      "INSERT INTO review_responses (review_id, admin_id, body) VALUES ($1, $2, $3) RETURNING id, created_at",
      [reviewId, adminId, responseBody]
    );

    res.json({
      success: true,
      data: {
        id: rows[0].id,
        review_id: reviewId,
        body: responseBody,
        created_at: rows[0].created_at,
        message: "Response added successfully"
      }
    });

  } catch (error) {
    console.error("Error adding admin response:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * GET /api/admin/reviews/stats
 * Get review statistics for admin dashboard
 */
router.get("/api/admin/reviews/stats", requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_reviews,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_reviews,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_reviews,
        COUNT(*) FILTER (WHERE verified_stay = true) as verified_reviews,
        COUNT(*) FILTER (WHERE reported_count > 0) as reported_reviews,
        AVG(overall_rating) FILTER (WHERE status = 'approved') as avg_rating,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as reviews_last_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as reviews_last_7d
      FROM reviews
    `;

    const { rows } = await pool.query(query);

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error("Error fetching review stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

module.exports = router;
