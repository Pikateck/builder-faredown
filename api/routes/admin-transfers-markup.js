const express = require("express");
const router = express.Router();
const { body, validationResult, query } = require("express-validator");

// Database connection
const { Pool } = require("pg");
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Validation middleware
const validateTransferMarkup = [
  body("rule_name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Rule name is required and must be less than 100 characters"),
  body("origin_city")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Origin city is required"),
  body("destination_city")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Destination city is required"),
  body("vehicle_type")
    .isIn(["economy", "standard", "premium", "luxury", "van", "bus"])
    .withMessage("Invalid vehicle type"),
  body("markup_type")
    .isIn(["percentage", "fixed"])
    .withMessage("Markup type must be percentage or fixed"),
  body("markup_value")
    .isFloat({ min: 0 })
    .withMessage("Markup value must be a positive number"),
  body("min_fare_range")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Min fare range must be a positive number"),
  body("max_fare_range")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max fare range must be a positive number"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("Active status must be boolean"),
  body("priority")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Priority must be between 1 and 100"),
];

// GET /api/admin/transfers-markup - Get all transfer markups with pagination and search
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("search")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Search query too long"),
    query("vehicle_type")
      .optional()
      .isIn(["economy", "standard", "premium", "luxury", "van", "bus"])
      .withMessage("Invalid vehicle type"),
    query("is_active")
      .optional()
      .isBoolean()
      .withMessage("Active filter must be boolean"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || "";
      const vehicleType = req.query.vehicle_type;
      const isActive = req.query.is_active;

      // Build WHERE clause
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(
          `(rule_name ILIKE $${paramIndex} OR origin_city ILIKE $${paramIndex} OR destination_city ILIKE $${paramIndex})`,
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (vehicleType) {
        whereConditions.push(`vehicle_type = $${paramIndex}`);
        queryParams.push(vehicleType);
        paramIndex++;
      }

      if (isActive !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`);
        queryParams.push(isActive === "true");
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get total count
      const countQuery = `
      SELECT COUNT(*) as total 
      FROM transfers_markups 
      ${whereClause}
    `;
      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const dataQuery = `
      SELECT 
        id,
        rule_name,
        origin_city,
        destination_city,
        vehicle_type,
        markup_type,
        markup_value,
        min_fare_range,
        max_fare_range,
        is_active,
        priority,
        created_at,
        updated_at
      FROM transfers_markups 
      ${whereClause}
      ORDER BY priority ASC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

      queryParams.push(limit, offset);
      const dataResult = await pool.query(dataQuery, queryParams);

      res.json({
        success: true,
        data: dataResult.rows,
        pagination: {
          current_page: page,
          per_page: limit,
          total_items: total,
          total_pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching transfer markups:", error);
      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Failed to fetch transfer markups",
      });
    }
  },
);

// GET /api/admin/transfers-markup/:id - Get specific transfer markup
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid markup ID" });
    }

    const query = `
      SELECT 
        id,
        rule_name,
        origin_city,
        destination_city,
        vehicle_type,
        markup_type,
        markup_value,
        min_fare_range,
        max_fare_range,
        is_active,
        priority,
        created_at,
        updated_at
      FROM transfers_markups 
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transfer markup not found" });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching transfer markup:", error);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to fetch transfer markup",
    });
  }
});

// POST /api/admin/transfers-markup - Create new transfer markup
router.post("/", validateTransferMarkup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const {
      rule_name,
      origin_city,
      destination_city,
      vehicle_type,
      markup_type,
      markup_value,
      min_fare_range,
      max_fare_range,
      is_active = true,
      priority = 50,
    } = req.body;

    // Check for duplicate rule names
    const duplicateCheck = await pool.query(
      "SELECT id FROM transfers_markups WHERE rule_name = $1",
      [rule_name],
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        message: "A transfer markup rule with this name already exists",
      });
    }

    // Validate fare range if provided
    if (min_fare_range && max_fare_range && min_fare_range >= max_fare_range) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Min fare range must be less than max fare range",
      });
    }

    const query = `
      INSERT INTO transfers_markups (
        rule_name, origin_city, destination_city, vehicle_type,
        markup_type, markup_value, min_fare_range, max_fare_range,
        is_active, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, rule_name, origin_city, destination_city, vehicle_type,
                markup_type, markup_value, min_fare_range, max_fare_range,
                is_active, priority, created_at, updated_at
    `;

    const values = [
      rule_name,
      origin_city,
      destination_city,
      vehicle_type,
      markup_type,
      markup_value,
      min_fare_range || null,
      max_fare_range || null,
      is_active,
      priority,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Transfer markup rule created successfully",
    });
  } catch (error) {
    console.error("Error creating transfer markup:", error);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to create transfer markup",
    });
  }
});

// PUT /api/admin/transfers-markup/:id - Update transfer markup
router.put("/:id", validateTransferMarkup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid markup ID" });
    }

    const {
      rule_name,
      origin_city,
      destination_city,
      vehicle_type,
      markup_type,
      markup_value,
      min_fare_range,
      max_fare_range,
      is_active,
      priority,
    } = req.body;

    // Check if markup exists
    const existingMarkup = await pool.query(
      "SELECT id, rule_name FROM transfers_markups WHERE id = $1",
      [id],
    );
    if (existingMarkup.rows.length === 0) {
      return res.status(404).json({ error: "Transfer markup not found" });
    }

    // Check for duplicate rule names (excluding current record)
    const duplicateCheck = await pool.query(
      "SELECT id FROM transfers_markups WHERE rule_name = $1 AND id != $2",
      [rule_name, id],
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        message: "A transfer markup rule with this name already exists",
      });
    }

    // Validate fare range if provided
    if (min_fare_range && max_fare_range && min_fare_range >= max_fare_range) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Min fare range must be less than max fare range",
      });
    }

    const query = `
      UPDATE transfers_markups 
      SET 
        rule_name = $1,
        origin_city = $2,
        destination_city = $3,
        vehicle_type = $4,
        markup_type = $5,
        markup_value = $6,
        min_fare_range = $7,
        max_fare_range = $8,
        is_active = $9,
        priority = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING id, rule_name, origin_city, destination_city, vehicle_type,
                markup_type, markup_value, min_fare_range, max_fare_range,
                is_active, priority, created_at, updated_at
    `;

    const values = [
      rule_name,
      origin_city,
      destination_city,
      vehicle_type,
      markup_type,
      markup_value,
      min_fare_range || null,
      max_fare_range || null,
      is_active,
      priority,
      id,
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: "Transfer markup rule updated successfully",
    });
  } catch (error) {
    console.error("Error updating transfer markup:", error);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to update transfer markup",
    });
  }
});

// DELETE /api/admin/transfers-markup/:id - Delete transfer markup
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid markup ID" });
    }

    // Check if markup exists
    const existingMarkup = await pool.query(
      "SELECT id, rule_name FROM transfers_markups WHERE id = $1",
      [id],
    );
    if (existingMarkup.rows.length === 0) {
      return res.status(404).json({ error: "Transfer markup not found" });
    }

    await pool.query("DELETE FROM transfers_markups WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Transfer markup rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transfer markup:", error);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to delete transfer markup",
    });
  }
});

// PATCH /api/admin/transfers-markup/:id/toggle - Toggle active status
router.patch("/:id/toggle", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid markup ID" });
    }

    // Check if markup exists and get current status
    const existingMarkup = await pool.query(
      "SELECT id, is_active FROM transfers_markups WHERE id = $1",
      [id],
    );
    if (existingMarkup.rows.length === 0) {
      return res.status(404).json({ error: "Transfer markup not found" });
    }

    const currentStatus = existingMarkup.rows[0].is_active;
    const newStatus = !currentStatus;

    const query = `
      UPDATE transfers_markups 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, rule_name, is_active, updated_at
    `;

    const result = await pool.query(query, [newStatus, id]);

    res.json({
      success: true,
      data: result.rows[0],
      message: `Transfer markup rule ${newStatus ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling transfer markup status:", error);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to toggle transfer markup status",
    });
  }
});

// GET /api/admin/transfers-markup/stats - Get transfer markup statistics
router.get("/analytics/stats", async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_rules,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_rules,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_rules,
        COUNT(DISTINCT vehicle_type) as unique_vehicle_types,
        COUNT(DISTINCT origin_city) as unique_origins,
        COUNT(DISTINCT destination_city) as unique_destinations,
        AVG(markup_value) as avg_markup_value,
        MIN(markup_value) as min_markup_value,
        MAX(markup_value) as max_markup_value
      FROM transfers_markups
    `;

    const vehicleTypeQuery = `
      SELECT 
        vehicle_type,
        COUNT(*) as count,
        AVG(markup_value) as avg_markup
      FROM transfers_markups
      GROUP BY vehicle_type
      ORDER BY count DESC
    `;

    const markupTypeQuery = `
      SELECT 
        markup_type,
        COUNT(*) as count,
        AVG(markup_value) as avg_value
      FROM transfers_markups
      GROUP BY markup_type
    `;

    const [statsResult, vehicleTypeResult, markupTypeResult] =
      await Promise.all([
        pool.query(statsQuery),
        pool.query(vehicleTypeQuery),
        pool.query(markupTypeQuery),
      ]);

    res.json({
      success: true,
      data: {
        overview: statsResult.rows[0],
        by_vehicle_type: vehicleTypeResult.rows,
        by_markup_type: markupTypeResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching transfer markup stats:", error);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to fetch transfer markup statistics",
    });
  }
});

module.exports = router;
