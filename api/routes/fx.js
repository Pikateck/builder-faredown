const express = require("express");
const db = require("../database/connection");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Normalize currency codes
const norm = (c = "") => String(c || "").trim().toUpperCase();

async function getRateToUSD(from) {
  const f = norm(from);
  if (f === "USD") return 1.0;
  const r = await db.query(
    `SELECT rate FROM fx_rates WHERE base_currency = 'USD' AND target_currency = $1`,
    [f],
  );
  if (!r.rows[0]) throw new Error(`FX rate USD->${f} missing`);
  return 1 / Number(r.rows[0].rate);
}

async function getRateFromUSD(to) {
  const t = norm(to);
  if (t === "USD") return 1.0;
  const r = await db.query(
    `SELECT rate FROM fx_rates WHERE base_currency = 'USD' AND target_currency = $1`,
    [t],
  );
  if (!r.rows[0]) throw new Error(`FX rate USD->${t} missing`);
  return Number(r.rows[0].rate);
}

async function getSupplierAdjustments(supplierCode) {
  if (!supplierCode) return { hedge: 0, baseMarkup: 0, currency: "USD" };
  const q = await db.query(
    `SELECT base_currency, hedge_buffer, base_markup FROM supplier_master WHERE COALESCE(code, supplier_code) = $1`,
    [norm(supplierCode)],
  );
  const row = q.rows[0] || {};
  return {
    hedge: Number(row.hedge_buffer || 0),
    baseMarkup: Number(row.base_markup || 0),
    currency: row.base_currency || "USD",
  };
}

// GET /api/fx/convert?amount=100&from=AED&to=INR&supplier=tbo&includeHedge=true
router.get("/convert", authenticateToken, async (req, res) => {
  try {
    const amount = Number(req.query.amount || 0);
    const from = norm(req.query.from || "USD");
    const to = norm(req.query.to || "USD");
    const supplier = req.query.supplier ? norm(req.query.supplier) : null;
    const includeHedge = String(req.query.includeHedge || "true").toLowerCase() !== "false";

    if (!Number.isFinite(amount)) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    // Supplier defaults
    const { hedge } = await getSupplierAdjustments(supplier);

    // Convert to USD
    const rateToUSD = await getRateToUSD(from);
    let usd = amount * rateToUSD;

    // Apply hedge at USD stage
    if (includeHedge && hedge > 0) {
      usd *= 1 + hedge / 100.0;
    }

    // USD -> target
    const rateFromUSD = await getRateFromUSD(to);
    const final = usd * rateFromUSD;

    res.json({
      success: true,
      breakdown: {
        input: { amount, currency: from },
        usd_before_markup: Number(usd.toFixed(6)),
        fx: { to_usd: rateToUSD, from_usd: rateFromUSD },
        hedge_percent: hedge,
        output: { amount: Number(final.toFixed(2)), currency: to },
      },
    });
  } catch (error) {
    console.error("/api/fx/convert error", error);
    res.status(500).json({ success: false, error: error.message || "FX error" });
  }
});

module.exports = router;
