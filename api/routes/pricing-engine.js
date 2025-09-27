const express = require("express");
const router = express.Router();
const pricingEngine = require("../services/pricingEngine");
const { authenticateToken } = require("../middleware/auth");

/**
 * @route POST /api/pricing/calculate
 * @desc Calculate final price with markup, promo, taxes, and currency conversion
 * @access Public (but can be restricted with auth if needed)
 */
router.post("/calculate", async (req, res) => {
  try {
    const {
      module,
      basePrice,
      baseCurrency = "INR",
      targetCurrency = "INR",
      item = {},
      customer = {},
      booking = {},
      promoCode = null,
      region = "India",
      quantity = 1,
    } = req.body;

    // Validation
    if (!module || !basePrice || basePrice <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: module and positive basePrice are required",
      });
    }

    const validModules = [
      "flights",
      "hotels",
      "sightseeing",
      "transfers",
      "packages",
    ];
    if (!validModules.includes(module)) {
      return res.status(400).json({
        success: false,
        message: `Invalid module. Must be one of: ${validModules.join(", ")}`,
      });
    }

    // Calculate pricing
    const result = await pricingEngine.calculateFinalPrice({
      module,
      basePrice: parseFloat(basePrice),
      baseCurrency,
      targetCurrency,
      item,
      customer,
      booking,
      promoCode,
      region,
      quantity: parseInt(quantity) || 1,
    });

    res.json(result);
  } catch (error) {
    console.error("Pricing calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate pricing",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/pricing/validate-promo
 * @desc Validate promo code for a specific module
 * @access Public
 */
router.post("/validate-promo", async (req, res) => {
  try {
    const { promoCode, module, basePrice = 0 } = req.body;

    if (!promoCode || !module) {
      return res.status(400).json({
        success: false,
        message: "Promo code and module are required",
      });
    }

    // Validate promo code
    const promo = await pricingEngine.validatePromoCode(promoCode, module);

    if (!promo.isValid) {
      return res.json({
        success: false,
        valid: false,
        message: promo.error || "Invalid promo code",
      });
    }

    // Calculate potential discount
    let estimatedDiscount = 0;
    if (basePrice > 0) {
      if (promo.discountType === "percentage") {
        estimatedDiscount = Math.min(
          (basePrice * promo.discountMinValue) / 100,
          promo.discountMaxValue || Infinity,
        );
      } else if (promo.discountType === "fixed") {
        estimatedDiscount = promo.discountMinValue;
      }
    }

    res.json({
      success: true,
      valid: true,
      promo: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountMinValue,
        maxDiscount: promo.discountMaxValue,
        minimumFare: promo.minimumFareAmount,
        estimatedDiscount: Math.round(estimatedDiscount * 100) / 100,
      },
      message: "Promo code is valid",
    });
  } catch (error) {
    console.error("Promo validation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate promo code",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/pricing/exchange-rates
 * @desc Get current exchange rates
 * @access Public
 */
router.get("/exchange-rates", async (req, res) => {
  try {
    const { from = "INR", to } = req.query;

    const rates = {
      USD: await pricingEngine.getExchangeRate(from, "USD").catch(() => null),
      EUR: await pricingEngine.getExchangeRate(from, "EUR").catch(() => null),
      GBP: await pricingEngine.getExchangeRate(from, "GBP").catch(() => null),
      AED: await pricingEngine.getExchangeRate(from, "AED").catch(() => null),
      SGD: await pricingEngine.getExchangeRate(from, "SGD").catch(() => null),
      INR:
        from === "INR"
          ? 1
          : await pricingEngine.getExchangeRate(from, "INR").catch(() => null),
    };

    // Filter out null values
    const validRates = Object.fromEntries(
      Object.entries(rates).filter(([, rate]) => rate !== null),
    );

    if (to) {
      const specificRate = await pricingEngine.getExchangeRate(from, to);
      res.json({
        success: true,
        data: {
          from,
          to,
          rate: specificRate,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          baseCurrency: from,
          rates: validRates,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Exchange rate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exchange rates",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/pricing/breakdown
 * @desc Get detailed pricing breakdown for transparency
 * @access Public
 */
router.post("/breakdown", async (req, res) => {
  try {
    const result = await pricingEngine.calculateFinalPrice(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Return detailed breakdown for user transparency
    const breakdown = {
      itemPrice: result.data.basePrice,
      markup: {
        description: "Service charges and processing fees",
        amount: result.data.markup.amount,
        percentage: `${result.data.markup.percentage.toFixed(1)}%`,
      },
      discount: {
        description: result.data.promo.code
          ? `Promo code: ${result.data.promo.code}`
          : "No discount applied",
        amount: -result.data.promo.discount,
        savings: result.data.promo.discount,
      },
      subtotal: result.data.subtotal,
      taxes: {
        description: `${result.data.taxes.region} taxes (${result.data.taxes.rate}%)`,
        amount: result.data.taxes.amount,
        rate: `${result.data.taxes.rate}%`,
      },
      paymentCharges: {
        description: "Payment gateway charges",
        amount: result.data.paymentGateway.totalCharges,
        breakdown: {
          percentage: `${result.data.paymentGateway.percentage}%`,
          fixed: result.data.paymentGateway.fixedAmount,
        },
      },
      totalAmount: result.data.finalPrice,
      currency: result.data.currency.targetCurrency,
      quantity: result.data.quantity,
    };

    res.json({
      success: true,
      data: breakdown,
      metadata: {
        calculatedAt: result.data.calculatedAt,
        module: result.data.module,
        currencyConversion: result.data.currency.conversionApplied,
      },
    });
  } catch (error) {
    console.error("Pricing breakdown error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate pricing breakdown",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/pricing/tax-rates
 * @desc Get tax rates by region
 * @access Public
 */
router.get("/tax-rates", (req, res) => {
  try {
    const { region } = req.query;

    const taxRates = {
      India: 12.0,
      UAE: 5.0,
      Europe: 20.0,
      USA: 8.5,
      Singapore: 7.0,
      default: 12.0,
    };

    if (region) {
      const rate = taxRates[region] || taxRates.default;
      res.json({
        success: true,
        data: {
          region,
          taxRate: rate,
          description: `${rate}% tax rate for ${region}`,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          regions: Object.entries(taxRates)
            .filter(([key]) => key !== "default")
            .map(([region, rate]) => ({
              region,
              taxRate: rate,
              description: `${rate}% tax rate for ${region}`,
            })),
          defaultRate: taxRates.default,
        },
      });
    }
  } catch (error) {
    console.error("Tax rates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tax rates",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/pricing/bulk-calculate
 * @desc Calculate pricing for multiple items at once
 * @access Public
 */
router.post("/bulk-calculate", async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and must not be empty",
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 items allowed per bulk calculation",
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        const result = await pricingEngine.calculateFinalPrice(item);

        results.push({
          index: i,
          itemId: item.itemId || i,
          result: result.success
            ? await pricingEngine.getPricingSummary(result)
            : result,
        });
      } catch (error) {
        errors.push({
          index: i,
          itemId: items[i].itemId || i,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          totalItems: items.length,
          successful: results.length,
          failed: errors.length,
        },
      },
    });
  } catch (error) {
    console.error("Bulk pricing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate bulk pricing",
      error: error.message,
    });
  }
});

module.exports = router;
