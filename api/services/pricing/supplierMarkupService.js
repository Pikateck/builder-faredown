const crypto = require("crypto");
const db = require("../../database/connection");

const DEFAULT_MARKUP_PERCENT = 10;

function normalizeContextValue(value, fallback = "ALL") {
  if (!value) return fallback;
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

async function resolveSupplierMarkup({
  supplierCode,
  module,
  market,
  currency,
  hotelId,
  destination,
  channel,
}) {
  const supplier = normalizeContextValue(supplierCode).toLowerCase();
  const productModule = normalizeContextValue(module).toLowerCase();
  const resolvedMarket = normalizeContextValue(market);
  const resolvedCurrency = normalizeContextValue(currency);
  const resolvedHotelId = normalizeContextValue(hotelId);
  const resolvedDestination = normalizeContextValue(destination);
  const resolvedChannel = normalizeContextValue(channel);

  try {
    const result = await db.query(
      `SELECT * FROM pick_markup_rule($1, $2, $3, $4, $5, $6, $7)`,
      [
        supplier,
        productModule,
        resolvedMarket,
        resolvedCurrency,
        resolvedChannel,
        resolvedHotelId,
        resolvedDestination,
      ],
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (error) {
    console.error("resolveSupplierMarkup failed", {
      supplier,
      productModule,
      error: error.message,
    });
  }

  return {
    value_type: "PERCENT",
    value: DEFAULT_MARKUP_PERCENT,
    priority: 999,
  };
}

function applyMarkupToAmount(baseAmount, markupRule) {
  if (!Number.isFinite(baseAmount)) {
    return {
      finalAmount: 0,
      markupAmount: 0,
    };
  }

  const rule = markupRule || {
    value_type: "PERCENT",
    value: DEFAULT_MARKUP_PERCENT,
  };

  const percentageRule =
    typeof rule.value_type === "string"
      ? rule.value_type.toUpperCase() === "PERCENT"
      : false;

  if (percentageRule) {
    const markupAmount = (baseAmount * Number(rule.value || 0)) / 100;
    return {
      finalAmount: baseAmount + markupAmount,
      markupAmount,
    };
  }

  const markupAmount = Number(rule.value || 0);
  return {
    finalAmount: baseAmount + markupAmount,
    markupAmount,
  };
}

function buildPricingBreakdown({
  base,
  taxes = 0,
  fees = 0,
  markup,
  discount = 0,
  currency,
}) {
  const breakdown = {
    base: Number(base || 0),
    taxes: Number(taxes || 0),
    fees: Number(fees || 0),
    markup: Number(markup || 0),
    discount: Number(discount || 0),
  };
  const total =
    breakdown.base +
    breakdown.taxes +
    breakdown.fees +
    breakdown.markup -
    breakdown.discount;

  return {
    final_price: {
      amount: Number(total.toFixed(2)),
      currency,
    },
    breakdown,
  };
}

function buildPricingHash(parts) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex");
}

module.exports = {
  resolveSupplierMarkup,
  applyMarkupToAmount,
  buildPricingBreakdown,
  buildPricingHash,
};
