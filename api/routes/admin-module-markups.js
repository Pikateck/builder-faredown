const express = require("express");
const express = require("express");
const db = require("../database/connection");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticateToken, requireAdmin);

// Helper to build precedence ORDER BY (newest first when ties)
const precedenceOrder = `
  ORDER BY 
    -- Flights
    (airline_code IS NOT NULL AND cabin IS NOT NULL) DESC,
    (airline_code IS NOT NULL) DESC,
    (cabin IS NOT NULL) DESC,
    (is_domestic IS NOT NULL) DESC,
    -- Hotels
    (room_type IS NOT NULL) DESC,
    (hotel_id IS NOT NULL) DESC,
    (hotel_chain IS NOT NULL) DESC,
    (star_rating IS NOT NULL) DESC,
    (city_code IS NOT NULL) DESC,
    -- Transfers
    (origin_city IS NOT NULL AND dest_city IS NOT NULL AND vehicle_type IS NOT NULL) DESC,
    (origin_city IS NOT NULL AND dest_city IS NOT NULL) DESC,
    (vehicle_type IS NOT NULL) DESC,
    -- Sightseeing
    (attraction_id IS NOT NULL) DESC,
    (experience_type IS NOT NULL) DESC,
    (city_code IS NOT NULL) DESC,
    updated_at DESC
`;

// GET /api/admin/markups
router.get("/", async (req, res) => {
  try {
    const { module, supplier_id } = req.query;
    const where = [];
    const params = [];
    let i = 1;
    if (module) {
      where.push(`module = $${i++}`);
      params.push(String(module).toUpperCase());
    }
    if (supplier_id) {
      where.push(`supplier_id = $${i++}`);
      params.push(supplier_id);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const q = `SELECT * FROM module_markups ${whereSql} ${precedenceOrder}`;
    const rows = await db.query(q, params);
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("GET /api/admin/markups error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/markups
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

    await db.query(
      `INSERT INTO markup_audit_log(entity_type, entity_id, action, before_json, after_json, acted_by) VALUES('MODULE_MARKUP', $1, 'CREATE', NULL, $2, $3)`,
      [
        ins.rows[0].id,
        JSON.stringify(ins.rows[0]),
        req.body.created_by || "admin",
      ],
    );

    res.status(201).json({ success: true, data: ins.rows[0] });
  } catch (error) {
    console.error("POST /api/admin/markups error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/markups/:id
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
    if (!sets.length)
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });
    params.push(req.params.id);

    const before = await db.query(
      `SELECT * FROM module_markups WHERE id = $1`,
      [req.params.id],
    );

    const upd = await db.query(
      `UPDATE module_markups SET ${sets.join(", ")}, updated_at = now() WHERE id = $${i} RETURNING *`,
      params,
    );

    await db.query(
      `INSERT INTO markup_audit_log(entity_type, entity_id, action, before_json, after_json, acted_by) VALUES('MODULE_MARKUP', $1, 'UPDATE', $2, $3, $4)`,
      [
        req.params.id,
        JSON.stringify(before.rows[0] || null),
        JSON.stringify(upd.rows[0] || null),
        req.body.updated_by || "admin",
      ],
    );

    res.json({ success: true, data: upd.rows[0] });
  } catch (error) {
    console.error("PUT /api/admin/markups/:id error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/markups/:id/audit
router.get("/:id/audit", async (req, res) => {
  try {
    const r = await db.query(
      `SELECT * FROM markup_audit_log WHERE entity_type = 'MODULE_MARKUP' AND entity_id = $1 ORDER BY acted_at DESC`,
      [req.params.id],
    );
    res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error("GET /api/admin/markups/:id/audit error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
