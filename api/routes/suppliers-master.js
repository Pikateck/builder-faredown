const express = require("express");
const express = require("express");
const db = require("../database/connection");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/suppliers — list with per-module rule counts
router.get("/", authenticateToken, async (req, res) => {
  try {
    const suppliers = await db.query(`
      SELECT s.id, s.supplier_name, s.module, s.base_currency, s.hedge_buffer_pct, s.base_markup_pct,
             s.status, s.valid_from, s.valid_to, s.last_updated_by, s.updated_at
      FROM suppliers_master s
      ORDER BY s.status DESC, s.updated_at DESC, s.supplier_name
    `);

    // Fetch counts in one query
    const counts = await db.query(`
      SELECT supplier_id, module, COUNT(*) as rules
      FROM module_markups
      GROUP BY supplier_id, module
    `);

    const countMap = new Map();
    counts.rows.forEach((r) => {
      const key = `${r.supplier_id}`;
      const map = countMap.get(key) || {};
      map[r.module] = Number(r.rules || 0);
      countMap.set(key, map);
    });

    const data = suppliers.rows.map((s) => ({
      ...s,
      module_rule_counts: countMap.get(String(s.id)) || {},
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/suppliers error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/suppliers/:id/markup — create supplier base markup override per module
router.post("/:id/markup", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      module,
      markup_type,
      markup_value,
      valid_from,
      valid_to,
      status = true,
      acted_by,
    } = req.body || {};

    if (!module || !markup_type || markup_value == null) {
      return res
        .status(400)
        .json({
          success: false,
          error: "module, markup_type, markup_value required",
        });
    }

    const ins = await db.query(
      `INSERT INTO supplier_markups_v2 (supplier_id, module, markup_type, markup_value, valid_from, valid_to, status, created_by, updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING *`,
      [
        id,
        String(module).toUpperCase(),
        markup_type.toUpperCase(),
        Number(markup_value),
        valid_from || null,
        valid_to || null,
        !!status,
        acted_by || "admin",
      ],
    );

    await db.query(
      `INSERT INTO markup_audit_log(entity_type, entity_id, action, before_json, after_json, acted_by)
       VALUES('SUPPLIER_MARKUP', $1, 'CREATE', NULL, $2, $3)`,
      [ins.rows[0].id, JSON.stringify(ins.rows[0]), acted_by || "admin"],
    );

    res.json({ success: true, data: ins.rows[0] });
  } catch (error) {
    console.error("POST /api/suppliers/:id/markup error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
