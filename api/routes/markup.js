import express from "express";

const { Pool } = require("pg");

const router = require("express").Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Helpers
function mapAirRowToClient(row) {
  return {
    id: String(row.id),
    name: row.rule_name,
    description: row.description || "",
    airline: row.airline_code || "ALL",
    route: { from: row.route_from || "ALL", to: row.route_to || "ALL" },
    class: row.booking_class || "economy",
    markupType: row.m_type === "flat" ? "fixed" : "percentage",
    markupValue: Number(row.m_value || 0),
    minAmount: 0,
    maxAmount: 0,
    currentFareMin: Number(row.current_min_pct || 0),
    currentFareMax: Number(row.current_max_pct || 0),
    bargainFareMin: Number(row.bargain_min_pct || 0),
    bargainFareMax: Number(row.bargain_max_pct || 0),
    validFrom: row.valid_from || null,
    validTo: row.valid_to || null,
    status: row.is_active ? "active" : "inactive",
    priority: row.priority || 1,
    userType: row.user_type || "all",
    specialConditions: "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHotelRowToClient(row) {
  return {
    id: String(row.id),
    name: row.rule_name,
    description: row.description || "",
    city: row.hotel_city || "ALL",
    hotelName: "",
    hotelChain: "",
    starRating: String(row.hotel_star_min || "") || "",
    roomCategory: "",
    markupType: row.m_type === "flat" ? "fixed" : "percentage",
    markupValue: Number(row.m_value || 0),
    minAmount: 0,
    maxAmount: 0,
    currentFareMin: Number(row.current_min_pct || 0),
    currentFareMax: Number(row.current_max_pct || 0),
    bargainFareMin: Number(row.bargain_min_pct || 0),
    bargainFareMax: Number(row.bargain_max_pct || 0),
    validFrom: row.valid_from || null,
    validTo: row.valid_to || null,
    seasonType: "Regular",
    applicableDays: [],
    minStay: 0,
    maxStay: 0,
    status: row.is_active ? "active" : "inactive",
    priority: row.priority || 1,
    userType: row.user_type || "all",
    specialConditions: row.description || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ===== AIR MARKUP ROUTES =====
router.get("/air", async (req, res) => {
  try {
    const {
      search,
      airline,
      class: cabinClass,
      status,
      supplier,
      page = 1,
      limit = 10,
    } = req.query;
    const where = ["module = 'air'"];
    const params = [];
    let i = 1;
    if (status && status !== "all") {
      where.push(`is_active = $${i++}`);
      params.push(status === "active");
    }
    if (airline && airline !== "all") {
      where.push(`airline_code = $${i++}`);
      params.push(airline);
    }
    if (cabinClass && cabinClass !== "all") {
      where.push(`LOWER(booking_class) = LOWER($${i++})`);
      params.push(cabinClass);
    }
    if (supplier && supplier !== "all") {
      where.push(`(supplier_scope = $${i++} OR supplier_scope = 'all')`);
      params.push(supplier.toLowerCase());
    }
    if (search) {
      where.push(
        `(LOWER(rule_name) LIKE $${i} OR LOWER(description) LIKE $${i})`,
      );
      params.push(`%${String(search).toLowerCase()}%`);
      i++;
    }
    const whereSql = `WHERE ${where.join(" AND ")}`;

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM markup_rules ${whereSql}`,
      params,
    );
    const total = count.rows[0].total;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const data = await pool.query(
      `SELECT * FROM markup_rules ${whereSql} ORDER BY priority ASC, updated_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      [...params, parseInt(limit), offset],
    );

    res.json({
      success: true,
      items: data.rows.map(mapAirRowToClient),
      total,
      page: parseInt(page),
      pageSize: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("GET /api/markup/air error", err);
    res.status(500).json({ error: "Failed to fetch air markups" });
  }
});

router.post("/air", async (req, res) => {
  try {
    const b = req.body || {};
    const q = `INSERT INTO markup_rules(module, rule_name, description, airline_code, route_from, route_to, booking_class, m_type, m_value, current_min_pct, current_max_pct, bargain_min_pct, bargain_max_pct, valid_from, valid_to, priority, user_type, is_active, supplier_scope)
               VALUES('air',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`;
    const vals = [
      b.name,
      b.description || null,
      b.airline || null,
      b.route?.from || null,
      b.route?.to || null,
      b.class || null,
      b.markupType === "fixed" ? "flat" : "percentage",
      b.markupValue || 0,
      b.currentFareMin || null,
      b.currentFareMax || null,
      b.bargainFareMin || null,
      b.bargainFareMax || null,
      b.validFrom || null,
      b.validTo || null,
      b.priority || 1,
      b.userType || "all",
      b.status ? b.status === "active" : true,
      b.supplierScope || "all",
    ];
    const r = await pool.query(q, vals);
    res.status(201).json({ markup: mapAirRowToClient(r.rows[0]) });
  } catch (err) {
    console.error("POST /api/markup/air error", err);
    res.status(500).json({ error: "Failed to create air markup" });
  }
});

router.put("/air/:id", async (req, res) => {
  try {
    const b = req.body || {};
    const updates = [];
    const params = [];
    let i = 1;
    const map = {
      rule_name: b.name,
      description: b.description,
      airline_code: b.airline,
      route_from: b.route?.from,
      route_to: b.route?.to,
      booking_class: b.class,
      m_type: b.markupType
        ? b.markupType === "fixed"
          ? "flat"
          : "percentage"
        : undefined,
      m_value: b.markupValue,
      current_min_pct: b.currentFareMin,
      current_max_pct: b.currentFareMax,
      bargain_min_pct: b.bargainFareMin,
      bargain_max_pct: b.bargainFareMax,
      valid_from: b.validFrom,
      valid_to: b.validTo,
      priority: b.priority,
      user_type: b.userType,
      supplier_scope: b.supplierScope,
      is_active:
        typeof b.status === "string" ? b.status === "active" : undefined,
    };
    Object.entries(map).forEach(([k, v]) => {
      if (v !== undefined) {
        updates.push(`${k} = $${i++}`);
        params.push(v);
      }
    });
    if (!updates.length)
      return res.status(400).json({ error: "No fields to update" });
    params.push(req.params.id);
    const r = await pool.query(
      `UPDATE markup_rules SET ${updates.join(", ")}, updated_at = now() WHERE id = $${i} AND module = 'air' RETURNING *`,
      params,
    );
    if (!r.rowCount) return res.status(404).json({ error: "Markup not found" });
    res.json({ markup: mapAirRowToClient(r.rows[0]) });
  } catch (err) {
    console.error("PUT /api/markup/air/:id error", err);
    res.status(500).json({ error: "Failed to update air markup" });
  }
});

router.delete("/air/:id", async (req, res) => {
  try {
    const r = await pool.query(
      "DELETE FROM markup_rules WHERE id = $1 AND module = 'air'",
      [req.params.id],
    );
    if (!r.rowCount) return res.status(404).json({ error: "Markup not found" });
    res.json({ message: "Air markup deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/markup/air/:id error", err);
    res.status(500).json({ error: "Failed to delete air markup" });
  }
});

router.post("/air/:id/toggle-status", async (req, res) => {
  try {
    const r = await pool.query(
      "UPDATE markup_rules SET is_active = NOT is_active, updated_at = now() WHERE id = $1 AND module = 'air' RETURNING *",
      [req.params.id],
    );
    if (!r.rowCount) return res.status(404).json({ error: "Markup not found" });
    res.json({ markup: mapAirRowToClient(r.rows[0]) });
  } catch (err) {
    console.error("POST /api/markup/air/:id/toggle-status error", err);
    res.status(500).json({ error: "Failed to toggle air markup status" });
  }
});

// ===== HOTEL MARKUP ROUTES =====
router.get("/hotel", async (req, res) => {
  try {
    const {
      search,
      city,
      starRating,
      status,
      page = 1,
      limit = 10,
    } = req.query;
    const where = ["module = 'hotel'"];
    const params = [];
    let i = 1;
    if (status && status !== "all") {
      where.push(`is_active = $${i++}`);
      params.push(status === "active");
    }
    if (city && city !== "all") {
      where.push(`hotel_city ILIKE $${i++}`);
      params.push(`%${city}%`);
    }
    if (starRating && starRating !== "all") {
      where.push(`hotel_star_min >= $${i++}`);
      params.push(parseInt(starRating));
    }
    if (search) {
      where.push(
        `(LOWER(rule_name) LIKE $${i} OR LOWER(description) LIKE $${i})`,
      );
      params.push(`%${String(search).toLowerCase()}%`);
      i++;
    }
    const whereSql = `WHERE ${where.join(" AND ")}`;

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM markup_rules ${whereSql}`,
      params,
    );
    const total = count.rows[0].total;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const data = await pool.query(
      `SELECT * FROM markup_rules ${whereSql} ORDER BY priority ASC, updated_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      [...params, parseInt(limit), offset],
    );

    res.json({
      success: true,
      items: data.rows.map(mapHotelRowToClient),
      total,
      page: parseInt(page),
      pageSize: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("GET /api/markup/hotel error", err);
    res.status(500).json({ error: "Failed to fetch hotel markups" });
  }
});

router.post("/hotel", async (req, res) => {
  try {
    const b = req.body || {};
    const q = `INSERT INTO markup_rules(module, rule_name, description, hotel_city, hotel_star_min, hotel_star_max, m_type, m_value, current_min_pct, current_max_pct, bargain_min_pct, bargain_max_pct, valid_from, valid_to, priority, user_type, is_active)
               VALUES('hotel',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`;
    const vals = [
      b.name,
      b.description || null,
      b.city || null,
      b.starRating ? parseInt(b.starRating) : null,
      null,
      b.markupType === "fixed" ? "flat" : "percentage",
      b.markupValue || 0,
      b.currentFareMin || null,
      b.currentFareMax || null,
      b.bargainFareMin || null,
      b.bargainFareMax || null,
      b.validFrom || null,
      b.validTo || null,
      b.priority || 1,
      b.userType || "all",
      b.status ? b.status === "active" : true,
    ];
    const r = await pool.query(q, vals);
    res.status(201).json({ markup: mapHotelRowToClient(r.rows[0]) });
  } catch (err) {
    console.error("POST /api/markup/hotel error", err);
    res.status(500).json({ error: "Failed to create hotel markup" });
  }
});

router.put("/hotel/:id", async (req, res) => {
  try {
    const b = req.body || {};
    const updates = [];
    const params = [];
    let i = 1;
    const map = {
      rule_name: b.name,
      description: b.description,
      hotel_city: b.city,
      hotel_star_min: b.starRating ? parseInt(b.starRating) : undefined,
      m_type: b.markupType
        ? b.markupType === "fixed"
          ? "flat"
          : "percentage"
        : undefined,
      m_value: b.markupValue,
      current_min_pct: b.currentFareMin,
      current_max_pct: b.currentFareMax,
      bargain_min_pct: b.bargainFareMin,
      bargain_max_pct: b.bargainFareMax,
      valid_from: b.validFrom,
      valid_to: b.validTo,
      priority: b.priority,
      user_type: b.userType,
      is_active:
        typeof b.status === "string" ? b.status === "active" : undefined,
    };
    Object.entries(map).forEach(([k, v]) => {
      if (v !== undefined) {
        updates.push(`${k} = $${i++}`);
        params.push(v);
      }
    });
    if (!updates.length)
      return res.status(400).json({ error: "No fields to update" });
    params.push(req.params.id);
    const r = await pool.query(
      `UPDATE markup_rules SET ${updates.join(", ")}, updated_at = now() WHERE id = $${i} AND module = 'hotel' RETURNING *`,
      params,
    );
    if (!r.rowCount) return res.status(404).json({ error: "Markup not found" });
    res.json({ markup: mapHotelRowToClient(r.rows[0]) });
  } catch (err) {
    console.error("PUT /api/markup/hotel/:id error", err);
    res.status(500).json({ error: "Failed to update hotel markup" });
  }
});

router.delete("/hotel/:id", async (req, res) => {
  try {
    const r = await pool.query(
      "DELETE FROM markup_rules WHERE id = $1 AND module = 'hotel'",
      [req.params.id],
    );
    if (!r.rowCount) return res.status(404).json({ error: "Markup not found" });
    res.json({ message: "Hotel markup deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/markup/hotel/:id error", err);
    res.status(500).json({ error: "Failed to delete hotel markup" });
  }
});

router.post("/hotel/:id/toggle-status", async (req, res) => {
  try {
    const r = await pool.query(
      "UPDATE markup_rules SET is_active = NOT is_active, updated_at = now() WHERE id = $1 AND module = 'hotel' RETURNING *",
      [req.params.id],
    );
    if (!r.rowCount) return res.status(404).json({ error: "Markup not found" });
    res.json({ markup: mapHotelRowToClient(r.rows[0]) });
  } catch (err) {
    console.error("POST /api/markup/hotel/:id/toggle-status error", err);
    res.status(500).json({ error: "Failed to toggle hotel markup status" });
  }
});
module.exports = router;