/**
 * Comprehensive Pricing Engine for Faredown Platform
 * Handles markup, promo codes, taxes, payment gateway charges, and currency conversion
 * Works across all modules: Flights, Hotels, Sightseeing, Transfers, Packages
 */

const { currencyService } = require("./currencyService");

class PricingEngine {
  constructor() {
    // Default configuration - can be overridden by admin settings
    this.config = {
      taxRates: {
        default: 12.0, // 12% GST for India
        regions: {
          India: 12.0,
          UAE: 5.0, // VAT
          Europe: 20.0, // Average VAT
          USA: 8.5, // Average sales tax
          Singapore: 7.0, // GST
        },
      },
      paymentGateway: {
        percentage: 2.5, // 2.5% PG charges
        fixedAmount: 20, // ₹20 fixed charges
        currency: "INR",
      },
      currency: {
        baseCurrency: "INR",
        exchangeRates: {}, // Will be populated from currency service
        roundingPolicy: "up", // 'up', 'down', 'nearest'
      },
    };
  }

  /**
   * Calculate final price with all business logic applied
   * @param {Object} params - Pricing parameters
   * @returns {Object} - Complete pricing breakdown
   */
  async calculateFinalPrice(params) {
    const {
      module, // 'flights', 'hotels', 'sightseeing', 'transfers', 'packages'
      basePrice,
      baseCurrency = "INR",
      targetCurrency = "INR",
      item = {}, // Item details for rule matching
      customer = {}, // Customer details
      booking = {}, // Booking details
      promoCode = null,
      region = "India",
      quantity = 1,
    } = params;

    try {
      // Step 1: Validate inputs
      if (!module || !basePrice || basePrice <= 0) {
        throw new Error(
          "Invalid pricing parameters: module and positive basePrice are required",
        );
      }

      // Step 2: Apply markup rules
      const markupResult = await this.applyMarkupRules(
        module,
        basePrice,
        item,
        booking,
      );

      // Step 3: Apply promo code discounts
      const promoResult = await this.applyPromoCode(
        module,
        markupResult.finalPrice,
        promoCode,
        item,
        customer,
      );

      // Step 4: Calculate taxes
      const taxResult = this.calculateTaxes(
        promoResult.finalPrice,
        region,
        item,
      );

      // Step 5: Apply payment gateway charges
      const pgResult = this.calculatePaymentGatewayCharges(
        taxResult.finalPrice,
      );

      // Step 6: Apply currency conversion
      const currencyResult = await this.convertCurrency(
        pgResult.finalPrice,
        baseCurrency,
        targetCurrency,
      );

      // Step 7: Apply quantity multiplier
      const quantityResult = this.applyQuantity(
        currencyResult.finalPrice,
        quantity,
      );

      // Step 8: Compile complete breakdown
      const breakdown = {
        basePrice: this.roundPrice(basePrice, targetCurrency),
        quantity,

        // Markup details
        markup: {
          amount: this.roundPrice(markupResult.markupAmount, targetCurrency),
          percentage: markupResult.markupPercentage,
          rules: markupResult.appliedRules,
          priceAfterMarkup: this.roundPrice(
            markupResult.finalPrice,
            targetCurrency,
          ),
        },

        // Promo details
        promo: {
          code: promoResult.promoCode,
          discount: this.roundPrice(promoResult.discountAmount, targetCurrency),
          percentage: promoResult.discountPercentage,
          savings: this.roundPrice(promoResult.discountAmount, targetCurrency),
          priceAfterPromo: this.roundPrice(
            promoResult.finalPrice,
            targetCurrency,
          ),
        },

        // Tax details
        taxes: {
          rate: taxResult.taxRate,
          amount: this.roundPrice(taxResult.taxAmount, targetCurrency),
          region: region,
          priceAfterTax: this.roundPrice(taxResult.finalPrice, targetCurrency),
        },

        // Payment gateway details
        paymentGateway: {
          percentage: pgResult.percentage,
          fixedAmount: this.roundPrice(pgResult.fixedAmount, targetCurrency),
          totalCharges: this.roundPrice(pgResult.totalCharges, targetCurrency),
          priceAfterPG: this.roundPrice(pgResult.finalPrice, targetCurrency),
        },

        // Currency conversion details
        currency: {
          baseCurrency,
          targetCurrency,
          exchangeRate: currencyResult.exchangeRate,
          conversionApplied: baseCurrency !== targetCurrency,
        },

        // Final pricing
        subtotal: this.roundPrice(promoResult.finalPrice, targetCurrency), // After markup and promo
        totalTaxes: this.roundPrice(taxResult.taxAmount, targetCurrency),
        totalCharges: this.roundPrice(pgResult.totalCharges, targetCurrency),
        finalPrice: this.roundPrice(quantityResult.finalPrice, targetCurrency),
        totalSavings: this.roundPrice(
          promoResult.discountAmount * quantity,
          targetCurrency,
        ),

        // Per unit prices
        pricePerUnit: this.roundPrice(
          currencyResult.finalPrice,
          targetCurrency,
        ),

        // Metadata
        calculatedAt: new Date().toISOString(),
        module,
        region,
      };

      return {
        success: true,
        data: breakdown,
        summary: {
          basePrice: this.roundPrice(basePrice * quantity, targetCurrency),
          finalPrice: breakdown.finalPrice,
          totalSavings: breakdown.totalSavings,
          currency: targetCurrency,
        },
      };
    } catch (error) {
      console.error("Pricing calculation error:", error);
      return {
        success: false,
        error: error.message,
        fallback: {
          basePrice: this.roundPrice(basePrice * quantity, targetCurrency),
          finalPrice: this.roundPrice(basePrice * quantity, targetCurrency),
          currency: targetCurrency,
        },
      };
    }
  }

  /**
   * Apply markup rules based on module and conditions
   */
  async applyMarkupRules(module, basePrice, item, booking) {
    // Mock markup rules - in real implementation, fetch from database
    const markupRules = await this.getMarkupRules(module);

    let appliedRules = [];
    let markupAmount = 0;
    let markupPercentage = 0;

    // Find applicable rules sorted by priority
    const applicableRules = markupRules
      .filter(
        (rule) =>
          rule.isActive && this.matchesRuleConditions(rule, item, booking),
      )
      .sort((a, b) => a.priority - b.priority);

    if (applicableRules.length > 0) {
      const rule = applicableRules[0]; // Take highest priority rule

      if (rule.ruleType === "percentage") {
        markupAmount = (basePrice * rule.value) / 100;
        if (rule.maxValue && markupAmount > rule.maxValue) {
          markupAmount = rule.maxValue;
        }
        if (rule.minValue && markupAmount < rule.minValue) {
          markupAmount = rule.minValue;
        }
      } else if (rule.ruleType === "fixed") {
        markupAmount = rule.value;
      } else if (rule.ruleType === "tiered" && rule.tieredMarkups) {
        const tier = rule.tieredMarkups.find(
          (t) => basePrice >= t.minPrice && basePrice <= t.maxPrice,
        );
        if (tier) {
          markupAmount = (basePrice * tier.markupPercentage) / 100;
        }
      }

      markupPercentage = (markupAmount / basePrice) * 100;
      appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        value: rule.value,
        markupAmount,
        markupPercentage,
      });
    }

    return {
      finalPrice: basePrice + markupAmount,
      markupAmount,
      markupPercentage,
      appliedRules,
    };
  }

  /**
   * Apply promo code discounts
   */
  async applyPromoCode(module, price, promoCode, item, customer) {
    if (!promoCode) {
      return {
        finalPrice: price,
        discountAmount: 0,
        discountPercentage: 0,
        promoCode: null,
      };
    }

    // Mock promo validation - in real implementation, fetch from database
    const promo = await this.validatePromoCode(promoCode, module);

    if (!promo || !promo.isValid) {
      return {
        finalPrice: price,
        discountAmount: 0,
        discountPercentage: 0,
        promoCode: promoCode,
        error: "Invalid or expired promo code",
      };
    }

    let discountAmount = 0;

    if (promo.discountType === "percentage") {
      discountAmount = (price * promo.discountMinValue) / 100;
      if (promo.discountMaxValue && discountAmount > promo.discountMaxValue) {
        discountAmount = promo.discountMaxValue;
      }
    } else if (promo.discountType === "fixed") {
      discountAmount = promo.discountMinValue;
    }

    // Check minimum fare amount
    if (price < promo.minimumFareAmount) {
      return {
        finalPrice: price,
        discountAmount: 0,
        discountPercentage: 0,
        promoCode: promoCode,
        error: `Minimum fare amount ₹${promo.minimumFareAmount} required`,
      };
    }

    const discountPercentage = (discountAmount / price) * 100;

    return {
      finalPrice: Math.max(0, price - discountAmount),
      discountAmount,
      discountPercentage,
      promoCode: promoCode,
    };
  }

  /**
   * Calculate taxes based on region and item type
   */
  calculateTaxes(price, region, item) {
    const taxRate =
      this.config.taxRates.regions[region] || this.config.taxRates.default;
    const taxAmount = (price * taxRate) / 100;

    return {
      finalPrice: price + taxAmount,
      taxAmount,
      taxRate,
      region,
    };
  }

  /**
   * Calculate payment gateway charges
   */
  calculatePaymentGatewayCharges(price) {
    const percentage = this.config.paymentGateway.percentage;
    const fixedAmount = this.config.paymentGateway.fixedAmount;

    const percentageCharges = (price * percentage) / 100;
    const totalCharges = percentageCharges + fixedAmount;

    return {
      finalPrice: price + totalCharges,
      percentageCharges,
      fixedAmount,
      totalCharges,
      percentage,
    };
  }

  /**
   * Convert currency using exchange rates
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return {
        finalPrice: amount,
        exchangeRate: 1,
        fromCurrency,
        toCurrency,
      };
    }

    try {
      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount * exchangeRate;

      return {
        finalPrice: convertedAmount,
        exchangeRate,
        fromCurrency,
        toCurrency,
      };
    } catch (error) {
      console.error("Currency conversion error:", error);
      // Fallback to original amount
      return {
        finalPrice: amount,
        exchangeRate: 1,
        fromCurrency,
        toCurrency,
        error: "Currency conversion failed",
      };
    }
  }

  /**
   * Apply quantity multiplier
   */
  applyQuantity(pricePerUnit, quantity) {
    return {
      finalPrice: pricePerUnit * quantity,
      pricePerUnit,
      quantity,
    };
  }

  /**
   * Round price based on currency and rounding policy
   */
  roundPrice(amount, currency = "INR") {
    const decimals = ["JPY", "KRW"].includes(currency) ? 0 : 2;

    switch (this.config.currency.roundingPolicy) {
      case "up":
        return (
          Math.ceil(amount * Math.pow(10, decimals)) / Math.pow(10, decimals)
        );
      case "down":
        return (
          Math.floor(amount * Math.pow(10, decimals)) / Math.pow(10, decimals)
        );
      case "nearest":
      default:
        return (
          Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals)
        );
    }
  }

  /**
   * Check if item matches rule conditions
   */
  matchesRuleConditions(rule, item, booking) {
    const conditions = rule.conditions || {};

    // Check package category
    if (conditions.packageCategory && conditions.packageCategory.length > 0) {
      if (
        !item.category ||
        !conditions.packageCategory.includes(item.category)
      ) {
        return false;
      }
    }

    // Check price range
    if (conditions.priceRange) {
      if (
        conditions.priceRange.min &&
        item.basePrice < conditions.priceRange.min
      ) {
        return false;
      }
      if (
        conditions.priceRange.max &&
        item.basePrice > conditions.priceRange.max
      ) {
        return false;
      }
    }

    // Check seasonality
    if (
      conditions.seasonality &&
      booking.seasonality !== conditions.seasonality
    ) {
      return false;
    }

    // Check advance booking
    if (conditions.advanceBooking) {
      const bookingDate = new Date(booking.travelDate);
      const today = new Date();
      const daysDiff = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));
      if (daysDiff < conditions.advanceBooking) {
        return false;
      }
    }

    // Check group size
    if (conditions.groupSize) {
      if (
        conditions.groupSize.min &&
        booking.passengers < conditions.groupSize.min
      ) {
        return false;
      }
      if (
        conditions.groupSize.max &&
        booking.passengers > conditions.groupSize.max
      ) {
        return false;
      }
    }

    // Check region
    if (conditions.region && conditions.region.length > 0) {
      if (!item.region || !conditions.region.includes(item.region)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get markup rules for a specific module
   */
  async getMarkupRules(module) {
    // Mock implementation - in real app, fetch from database
    const mockRules = {
      flights: [
        {
          id: "flight_rule_1",
          name: "International Flight Markup",
          ruleType: "percentage",
          value: 15,
          maxValue: 5000,
          priority: 1,
          isActive: true,
          conditions: {
            region: ["International"],
          },
        },
      ],
      hotels: [
        {
          id: "hotel_rule_1",
          name: "Luxury Hotel Markup",
          ruleType: "percentage",
          value: 20,
          maxValue: 8000,
          priority: 1,
          isActive: true,
          conditions: {
            packageCategory: ["luxury"],
          },
        },
      ],
      packages: [
        {
          id: "package_rule_1",
          name: "Package Markup",
          ruleType: "percentage",
          value: 18,
          maxValue: 15000,
          priority: 1,
          isActive: true,
          conditions: {},
        },
      ],
      sightseeing: [
        {
          id: "sight_rule_1",
          name: "Sightseeing Markup",
          ruleType: "percentage",
          value: 12,
          maxValue: 2000,
          priority: 1,
          isActive: true,
          conditions: {},
        },
      ],
      transfers: [
        {
          id: "transfer_rule_1",
          name: "Transfer Markup",
          ruleType: "percentage",
          value: 10,
          maxValue: 1000,
          priority: 1,
          isActive: true,
          conditions: {},
        },
      ],
    };

    return mockRules[module] || [];
  }

  /**
   * Validate promo code
   */
  async validatePromoCode(promoCode, module) {
    // Mock implementation - in real app, fetch from database
    const mockPromos = {
      FAREDOWN20: {
        id: "promo_1",
        code: "FAREDOWN20",
        discountType: "percentage",
        discountMinValue: 20,
        discountMaxValue: 5000,
        minimumFareAmount: 10000,
        module: ["all"],
        isValid: true,
        expiryDate: "2024-12-31",
      },
      SAVE1000: {
        id: "promo_2",
        code: "SAVE1000",
        discountType: "fixed",
        discountMinValue: 1000,
        discountMaxValue: 1000,
        minimumFareAmount: 5000,
        module: ["all"],
        isValid: true,
        expiryDate: "2024-12-31",
      },
    };

    const promo = mockPromos[promoCode.toUpperCase()];
    if (!promo) {
      return { isValid: false, error: "Promo code not found" };
    }

    // Check if promo applies to module
    if (!promo.module.includes("all") && !promo.module.includes(module)) {
      return { isValid: false, error: "Promo code not valid for this service" };
    }

    // Check expiry
    const today = new Date();
    const expiry = new Date(promo.expiryDate);
    if (today > expiry) {
      return { isValid: false, error: "Promo code has expired" };
    }

    return promo;
  }

  /**
   * Get exchange rate between currencies
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    // Mock implementation - in real app, use currency service
    const mockRates = {
      USD_INR: 83.0,
      EUR_INR: 89.5,
      GBP_INR: 105.2,
      AED_INR: 22.6,
      SGD_INR: 62.3,
      INR_USD: 0.012,
      INR_EUR: 0.011,
      INR_GBP: 0.0095,
      INR_AED: 0.044,
      INR_SGD: 0.016,
    };

    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = mockRates[rateKey];

    if (!rate) {
      // If direct rate not available, try reverse
      const reverseKey = `${toCurrency}_${fromCurrency}`;
      const reverseRate = mockRates[reverseKey];
      if (reverseRate) {
        return 1 / reverseRate;
      }
      throw new Error(
        `Exchange rate not available for ${fromCurrency} to ${toCurrency}`,
      );
    }

    return rate;
  }

  /**
   * Get pricing summary for display
   */
  async getPricingSummary(pricingResult) {
    if (!pricingResult.success) {
      return pricingResult.fallback;
    }

    const data = pricingResult.data;
    return {
      basePrice: data.basePrice,
      finalPrice: data.finalPrice,
      savings: data.totalSavings,
      currency: data.currency.targetCurrency,
      breakdown: {
        markup: data.markup.amount,
        discount: data.promo.discount,
        taxes: data.taxes.amount,
        charges: data.paymentGateway.totalCharges,
      },
    };
  }
}

// Export singleton instance
module.exports = new PricingEngine();
