const express = require("express");
const { Pool } = require("pg");

const router = require("express").Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const EXPORT_COLUMNS = [
  "id",
  "module",
  "rule_name",
  "description",
  "airline_code",
  "origin_iata",
  "dest_iata",
  "route_from",
  "route_to",
  "booking_class",
  "hotel_city",
  "hotel_star_min",
  "hotel_star_max",
  "supplier_id",
  "product_code",
  "vehicle_type",
  "transfer_kind",
  "m_type",
  "m_value",
  "current_min_pct",
  "current_max_pct",
  "bargain_min_pct",
  "bargain_max_pct",
  "valid_from",
  "valid_to",
  "priority",
  "user_type",
  "is_active",
  "created_at",
  "updated_at",
];

function buildWhere(query) {
  const {
    module,
    airline_code,
    route_from,
    route_to,
    booking_class,
    status,
    search,
    hotel_city,
    supplier_id,
    product_code,
    vehicle_type,
    transfer_kind,
  } = query;
  const where = [];
  const params = [];
  let i = 1;
  if (module) {
    where.push(`module = $${i++}`);
    params.push(module);
  }
  if (status) {
    where.push(`is_active = $${i++}`);
    params.push(status === "active" || status === true || status === "true");
  }
  if (airline_code) {
    where.push(`airline_code = $${i++}`);
    params.push(airline_code);
  }
  if (route_from) {
    where.push(`route_from = $${i++}`);
    params.push(route_from);
  }
  if (route_to) {
    where.push(`route_to = $${i++}`);
    params.push(route_to);
  }
  if (booking_class) {
    where.push(`booking_class = $${i++}`);
    params.push(booking_class);
  }
  if (hotel_city) {
    where.push(`hotel_city = $${i++}`);
    params.push(hotel_city);
  }
  if (supplier_id) {
    where.push(`supplier_id = $${i++}`);
    params.push(supplier_id);
  }
  if (product_code) {
    where.push(`product_code = $${i++}`);
    params.push(product_code);
  }
  if (vehicle_type) {
    where.push(`vehicle_type = $${i++}`);
    params.push(vehicle_type);
  }
  if (transfer_kind) {
    where.push(`transfer_kind = $${i++}`);
    params.push(transfer_kind);
  }
  if (search) {
    where.push(
      `(LOWER(rule_name) LIKE $${i} OR LOWER(description) LIKE $${i})`,
    );
    params.push(`%${search.toLowerCase()}%`);
    i++;
  }
  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

// GET /api/markups
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const offset = (page - 1) * limit;

    const { where, params } = buildWhere(req.query);

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM markup_rules ${where}`,
      params,
    );
    const total = count.rows[0]?.total || 0;

    const data = await pool.query(
      `SELECT * FROM markup_rules ${where} ORDER BY module, priority ASC, updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    res.json({ success: true, items: data.rows, total, page, pageSize: limit });
  } catch (err) {
    console.error("/api/markups list error", err);
    res.status(500).json({ success: false, error: "Failed to fetch markups" });
  }
});

// POST /api/markups
router.post("/", async (req, res) => {
  try {
    const fields = [
      "module",
      "rule_name",
      "description",
      "airline_code",
      "booking_class",
      "route_from",
      "route_to",
      "hotel_city",
      "hotel_star_min",
      "hotel_star_max",
      "supplier_id",
      "product_code",
      "vehicle_type",
      "transfer_kind",
      "m_type",
      "m_value",
      "current_min_pct",
      "current_max_pct",
      "bargain_min_pct",
      "bargain_max_pct",
      "valid_from",
      "valid_to",
      "priority",
      "user_type",
      "is_active",
    ];
    const values = fields.map((k) => req.body[k] ?? null);
    const idx = values.map((_, i) => `$${i + 1}`).join(",");
    const q = `INSERT INTO markup_rules (${fields.join(",")}) VALUES (${idx}) RETURNING *`;
    const result = await pool.query(q, values);
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error("/api/markups create error", err);
    res.status(500).json({ success: false, error: "Failed to create markup" });
  }
});

// PUT /api/markups/:id
router.put("/:id", async (req, res) => {
  try {
    const updatable = [
      "rule_name",
      "description",
      "airline_code",
      "booking_class",
      "route_from",
      "route_to",
      "hotel_city",
      "hotel_star_min",
      "hotel_star_max",
      "supplier_id",
      "product_code",
      "vehicle_type",
      "transfer_kind",
      "m_type",
      "m_value",
      "current_min_pct",
      "current_max_pct",
      "bargain_min_pct",
      "bargain_max_pct",
      "valid_from",
      "valid_to",
      "priority",
      "user_type",
      "is_active",
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
    const q = `UPDATE markup_rules SET ${sets.join(", ")}, updated_at = now() WHERE id = $${i} RETURNING *`;
    const result = await pool.query(q, params);
    if (!result.rowCount)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error("/api/markups update error", err);
    res.status(500).json({ success: false, error: "Failed to update markup" });
  }
});

// PATCH /api/markups/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { is_active } = req.body || {};
    let result;
    if (typeof is_active === "undefined") {
      // Toggle when no explicit value is provided
      result = await pool.query(
        "UPDATE markup_rules SET is_active = NOT is_active, updated_at = now() WHERE id = $1 RETURNING *",
        [req.params.id],
      );
    } else {
      result = await pool.query(
        "UPDATE markup_rules SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *",
        [is_active, req.params.id],
      );
    }
    if (!result.rowCount)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error("/api/markups status error", err);
    res.status(500).json({ success: false, error: "Failed to toggle status" });
  }
});

// DELETE /api/markups/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM markup_rules WHERE id = $1", [
      req.params.id,
    ]);
    if (!result.rowCount)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("/api/markups delete error", err);
    res.status(500).json({ success: false, error: "Failed to delete markup" });
  }
});

// POST /api/markups/test-apply - compute final
router.post("/test-apply", async (req, res) => {
  try {
    const { module, base_amount, currency = "INR" } = req.body;
    if (!module || base_amount == null) {
      return res
        .status(400)
        .json({ success: false, error: "module and base_amount are required" });
    }

    // find best rule
    const { where, params } = buildWhere(req.body);
    const q = `SELECT * FROM vw_active_markup_rules ${where} ORDER BY priority ASC, updated_at DESC LIMIT 1`;
    const r = await pool.query(q, params);
    const rule = r.rows[0] || null;

    let final = Number(base_amount);
    let markupValue = 0;
    let markupType = rule?.m_type || "percentage";
    if (rule) {
      if (rule.m_type === "percentage") {
        markupValue = (final * Number(rule.m_value)) / 100.0;
        final = final + markupValue;
      } else {
        markupValue = Number(rule.m_value);
        final = final + markupValue;
      }
    }

    // persist snapshot
    const snap = await pool.query(
      `INSERT INTO pricing_quotes(module, rule_id, request_ref, base_amount, currency, markup_type, markup_value, final_amount, route_from, route_to, airline_code, booking_class, hotel_city, vehicle_type, transfer_kind, supplier_id, product_code)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
      [
        module,
        rule?.id || null,
        req.body.request_ref || null,
        base_amount,
        currency,
        markupType,
        rule?.m_value || 0,
        final,
        req.body.route_from || null,
        req.body.route_to || null,
        req.body.airline_code || null,
        req.body.booking_class || null,
        req.body.hotel_city || null,
        req.body.vehicle_type || null,
        req.body.transfer_kind || null,
        req.body.supplier_id || null,
        req.body.product_code || null,
      ],
    );

    res.json({
      success: true,
      matched_rule_id: rule?.id || null,
      base_amount: Number(base_amount),
      markup_type: markupType,
      markup_value: rule?.m_value || 0,
      final_amount: final,
      currency,
      quote_id: snap.rows[0].id,
    });
  } catch (err) {
    console.error("/api/markups/test-apply error", err);
    res.status(500).json({ success: false, error: "Failed to test apply" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const format = String(req.query.format || "csv").toLowerCase();
    const limitParam = parseInt(String(req.query.limit || "5000"), 10);
    const resolvedLimit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 10000)
        : 5000;

    const { where, params } = buildWhere(req.query);
    const queryParams = [...params];
    let query = `SELECT * FROM markup_rules ${where} ORDER BY module, priority ASC, updated_at DESC`;

    if (resolvedLimit > 0) {
      query += ` LIMIT $${queryParams.length + 1}`;
      queryParams.push(resolvedLimit);
    }

    const result = await pool.query(query, queryParams);
    const rows = result.rows;

    if (format === "json") {
      return res.json({
        success: true,
        items: rows,
        total: rows.length,
        exportDate: new Date().toISOString(),
      });
    }

    const columnHeaders = EXPORT_COLUMNS;
    const headerRow = columnHeaders.map((col) => `"${col}"`).join(",");
    const csvRows = rows.map((row) =>
      columnHeaders
        .map((column) => {
          const value = row[column];
          if (value === null || typeof value === "undefined") {
            return "";
          }
          if (value instanceof Date) {
            return `"${value.toISOString()}"`;
          }
          if (typeof value === "object") {
            const serialized = JSON.stringify(value);
            return `"${serialized.replace(/"/g, '""')}"`;
          }
          const stringValue = String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(","),
    );

    const csvContent = [headerRow, ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="markups_export_${new Date().toISOString().split("T")[0]}.csv"`,
    );
    res.send(csvContent);
  } catch (error) {
    console.error("❌ Export markups error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export markups",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = router;
