const express = require("express");
const express = require("express");
const db = require("../database/connection");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const norm = (s = "") => String(s || "").trim().toUpperCase();

async function getRateToUSD(cur) {
  const c = norm(cur);
  if (c === "USD") return 1.0;
  const r = await db.query(
    `SELECT rate FROM fx_rates WHERE base_currency = 'USD' AND target_currency = $1`,
    [c],
  );
  if (!r.rows[0]) throw new Error(`FX rate USD->${c} missing`);
  return 1 / Number(r.rows[0].rate);
}
async function getRateFromUSD(cur) {
  const c = norm(cur);
  if (c === "USD") return 1.0;
  const r = await db.query(
    `SELECT rate FROM fx_rates WHERE base_currency = 'USD' AND target_currency = $1`,
    [c],
  );
  if (!r.rows[0]) throw new Error(`FX rate USD->${c} missing`);
  return Number(r.rows[0].rate);
}

async function getSupplierRow(code) {
  const q = await db.query(
    `SELECT COALESCE(code, supplier_code) AS code, base_currency, hedge_buffer, base_markup FROM supplier_master WHERE COALESCE(code, supplier_code) = $1`,
    [norm(code)],
  );
  return q.rows[0] || null;
}

// POST /api/pricing/preview
// body: { supplier_code, net_amount, supplier_currency, display_currency, module }
router.post("/preview", authenticateToken, async (req, res) => {
  try {
    const {
      supplier_code,
      net_amount,
      supplier_currency,
      display_currency = "INR",
      module: moduleName,
    } = req.body || {};

    const amount = Number(net_amount || 0);
    if (!supplier_code || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: "supplier_code and positive net_amount required" });
    }

    const supplier = await getSupplierRow(supplier_code);
    const supCurrency = norm(supplier_currency || supplier?.base_currency || "USD");

    // Supplier -> USD
    const toUSD = await getRateToUSD(supCurrency);
    let usd = amount * toUSD;

    // Hedge
    const hedgePct = Number(supplier?.hedge_buffer || 0);
    if (hedgePct > 0) usd *= 1 + hedgePct / 100.0;

    // Supplier base markup (profit)
    const baseMarkupPct = Number(supplier?.base_markup || 0);
    let usd_after_markup = usd * (1 + baseMarkupPct / 100.0);

    // Module-level markup preview (pull best rule if exists)
    let moduleMarkupPct = 0;
    const mod = (moduleName || "").toString().toLowerCase();
    if (mod) {
      // Try to find a generic active rule for module
      const r = await db.query(
        `SELECT m_type, m_value FROM markup_rules WHERE module = $1 AND is_active = TRUE ORDER BY priority ASC, updated_at DESC LIMIT 1`,
        [mod],
      );
      if (r.rows[0]) {
        moduleMarkupPct = r.rows[0].m_type === "percentage" ? Number(r.rows[0].m_value || 0) : 0;
        if (r.rows[0].m_type === "fixed") {
          // treat fixed as % of amount in preview context (approx)
          moduleMarkupPct = (Number(r.rows[0].m_value || 0) / Math.max(1, usd_after_markup)) * 100.0;
        }
      }
    }

    const usd_after_module = usd_after_markup * (1 + moduleMarkupPct / 100.0);

    // Convert to display currency
    const fromUSD = await getRateFromUSD(display_currency);
    const display_amount = usd_after_module * fromUSD;

    // Bargain floor: net in USD after hedge, converted to display currency (no markups)
    const floor_display = (usd * fromUSD);

    res.json({
      success: true,
      breakdown: {
        supplier_code: norm(supplier_code),
        module: mod || null,
        input: { net_amount: amount, currency: supCurrency },
        fx_supplier_to_usd: toUSD,
        hedge_applied_percent: hedgePct,
        supplier_base_markup_percent: baseMarkupPct,
        module_markup_percent: moduleMarkupPct,
        usd_after_supplier_markup: Number(usd_after_markup.toFixed(6)),
        usd_after_module_markup: Number(usd_after_module.toFixed(6)),
        usd_to_display_rate: fromUSD,
        output: { amount: Number(display_amount.toFixed(2)), currency: norm(display_currency) },
        bargain_floor: { amount: Number(floor_display.toFixed(2)), currency: norm(display_currency) }
      },
    });
  } catch (error) {
    console.error("/api/pricing/preview error", error);
    res.status(500).json({ success: false, error: error.message || "Preview error" });
  }
});

module.exports = router;
