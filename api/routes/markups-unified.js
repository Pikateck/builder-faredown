const express = require("express");
const { Pool } = require("pg");
const db = require("../database/connection");

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const EXPORT_COLUMNS = [
  "id",
  "name",
  "supplier",
  "route_code",
  "origin_airport",
  "destination_airport",
  "market",
  "passenger_type",
  "cabin_class",
  "airline_code",
  "base_markup_percent",
  "base_markup_amount",
  "min_markup",
  "max_markup",
  "created_at",
];

// GET /api/markups - Main endpoint for admin panel queries with module filtering
router.get("/", async (req, res) => {
  try {
    // Check if database is connected
    if (!db.isConnected) {
      await db.initialize();
    }

    // Check if table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'module_markups'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      return res.status(500).json({
        success: false,
        error: "Database table 'module_markups' does not exist",
        message:
          "Please run migration: api/database/migrations/20251019_suppliers_master_spec.sql",
        help: "The admin panel requires the module_markups table to be created in PostgreSQL",
      });
    }

    const {
      module,
      supplier_id,
      page = 1,
      limit = 20,
      search,
      status,
    } = req.query;

    // Build WHERE clause
    const where = [];
    const params = [];
    let paramIndex = 1;

    if (module) {
      where.push(`module = $${paramIndex++}`);
      params.push(String(module).toUpperCase());
    }

    if (supplier_id) {
      where.push(`supplier_id = $${paramIndex++}`);
      params.push(supplier_id);
    }

    if (search) {
      where.push(
        `(airline_code ILIKE $${paramIndex} OR city_code ILIKE $${paramIndex} OR hotel_chain ILIKE $${paramIndex})`,
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status !== undefined && status !== null && status !== "all") {
      const statusBool =
        String(status).toLowerCase() === "active" ||
        status === true ||
        status === "1";
      where.push(`status = $${paramIndex++}`);
      params.push(statusBool);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM module_markups ${whereSql}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT * FROM module_markups
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    params.push(parseInt(limit), offset);

    const result = await db.query(dataQuery, params);

    res.json({
      success: true,
      items: result.rows,
      total,
      page: parseInt(page),
      pageSize: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching markups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch markups",
      message: error.message,
    });
  }
});

// Legacy endpoint for unified_markups table
router.get("/list", async (req, res) => {
  try {
    const query = `
      SELECT id, name, supplier, route_code, origin_airport, destination_airport, 
             market, passenger_type, cabin_class, airline_code, 
             base_markup_percent, base_markup_amount, min_markup, max_markup, created_at
      FROM unified_markups
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching markups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch markups",
      message: error.message,
    });
  }
});

router.get("/export", async (req, res) => {
  try {
    const { module } = req.query;

    // Export from module_markups if module specified, otherwise unified_markups
    let query;
    let result;

    if (module) {
      const where = `WHERE module = $1`;
      query = `
        SELECT id, supplier_id, module, airline_code, cabin, city_code,
               hotel_chain, star_rating, markup_type, markup_value,
               bargain_min_pct, bargain_max_pct, valid_from, valid_to,
               status, created_at, updated_at
        FROM module_markups
        ${where}
        ORDER BY created_at DESC
      `;
      result = await db.query(query, [String(module).toUpperCase()]);
    } else {
      query = `
        SELECT ${EXPORT_COLUMNS.join(", ")}
        FROM unified_markups
        ORDER BY created_at DESC
      `;
      result = await pool.query(query);
    }

    // Set CSV headers
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=markups.csv");

    // Create CSV content
    const headers = EXPORT_COLUMNS.join(",");
    const rows = result.rows.map((row) =>
      EXPORT_COLUMNS.map((col) => {
        const value = row[col];
        // Escape quotes and wrap in quotes if contains comma
        if (value === null || value === undefined) return "";
        return String(value).includes(",")
          ? `"${String(value).replace(/"/g, '""')}"`
          : value;
      }).join(","),
    );

    res.send([headers, ...rows].join("\n"));
  } catch (error) {
    console.error("Error exporting markups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export markups",
      message: error.message,
    });
  }
});

// POST /api/markups - Create new markup
router.post("/", async (req, res) => {
  try {
    const fields = [
      "supplier_id",
      "module",
      "is_domestic",
      "cabin",
      "airline_code",
      "city_code",
      "star_rating",
      "hotel_chain",
      "hotel_id",
      "room_type",
      "origin_city",
      "dest_city",
      "transfer_type",
      "vehicle_type",
      "experience_type",
      "attraction_id",
      "markup_type",
      "markup_value",
      "fixed_currency",
      "bargain_min_pct",
      "bargain_max_pct",
      "valid_from",
      "valid_to",
      "status",
      "created_by",
      "updated_by",
    ];

    const vals = fields.map((k) => req.body[k] ?? null);
    const placeholders = vals.map((_, idx) => `$${idx + 1}`).join(",");

    const ins = await db.query(
      `INSERT INTO module_markups(${fields.join(",")}) VALUES(${placeholders}) RETURNING *`,
      vals,
    );

    res.status(201).json({ success: true, data: ins.rows[0] });
  } catch (error) {
    console.error("POST /api/markups error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/markups/:id - Update existing markup
router.put("/:id", async (req, res) => {
  try {
    const updatable = [
      "supplier_id",
      "module",
      "is_domestic",
      "cabin",
      "airline_code",
      "city_code",
      "star_rating",
      "hotel_chain",
      "hotel_id",
      "room_type",
      "origin_city",
      "dest_city",
      "transfer_type",
      "vehicle_type",
      "experience_type",
      "attraction_id",
      "markup_type",
      "markup_value",
      "fixed_currency",
      "bargain_min_pct",
      "bargain_max_pct",
      "valid_from",
      "valid_to",
      "status",
      "updated_by",
    ];

    const sets = [];
    const params = [];
    let i = 1;

    updatable.forEach((k) => {
      if (k in req.body) {
        sets.push(`${k} = $${i++}`);
        params.push(req.body[k]);
      }
    });

    if (sets.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });
    }

    sets.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const upd = await db.query(
      `UPDATE module_markups SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      params,
    );

    if (upd.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Markup not found" });
    }

    res.json({ success: true, data: upd.rows[0] });
  } catch (error) {
    console.error("PUT /api/markups/:id error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/markups/:id - Delete markup
router.delete("/:id", async (req, res) => {
  try {
    const del = await db.query(
      `DELETE FROM module_markups WHERE id = $1 RETURNING *`,
      [req.params.id],
    );

    if (del.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Markup not found" });
    }

    res.json({ success: true, data: del.rows[0] });
  } catch (error) {
    console.error("DELETE /api/markups/:id error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
