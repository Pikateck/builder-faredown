/**
 * Faredown Pricing Engine
 * Centralized pricing logic for all modules (air, hotel, sightseeing, transfer)
 */

class PricingEngine {
  constructor(dbConnection) {
    this.db = dbConnection;
  }

  /**
   * Get the most applicable markup rule for given parameters
   * @param {Object} params - Quote parameters
   * @returns {Promise<Object|null>} Matching rule or null
   */
  async getApplicableMarkupRule(params) {
    const {
      module,
      origin = null,
      destination = null,
      serviceClass = null,
      hotelCategory = null,
      serviceType = null,
      airlineCode = null,
      userType = 'all'
    } = params;

    const query = `
      SELECT *
      FROM markup_rules
      WHERE status = 'active'
        AND module = $1
        AND (origin IS NULL OR origin = $2)
        AND (destination IS NULL OR destination = $3)
        AND (service_class IS NULL OR service_class = $4)
        AND (hotel_category IS NULL OR hotel_category = $5)
        AND (service_type IS NULL OR service_type = $6)
        AND (airline_code IS NULL OR airline_code = $7)
        AND (user_type = 'all' OR user_type = $8)
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
      ORDER BY
        /* Most specific first */
        (CASE WHEN origin IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN destination IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN service_class IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN hotel_category IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN service_type IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN airline_code IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN user_type != 'all' THEN 1 ELSE 0 END) DESC,
        priority DESC
      LIMIT 1;
    `;

    try {
      const result = await this.db.query(query, [
        module,
        origin,
        destination,
        serviceClass,
        hotelCategory,
        serviceType,
        airlineCode,
        userType
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching markup rule:', error);
      throw error;
    }
  }

  /**
   * Get applicable promo code discount
   * @param {Object} params - Quote parameters
   * @returns {Promise<Object|null>} Promo code or null
   */
  async getPromoDiscount(params) {
    const { extras = {} } = params;
    const promoCode = extras.promoCode?.trim();
    
    if (!promoCode) return null;

    const query = `
      SELECT *
      FROM promo_codes
      WHERE code = $1
        AND status = 'active'
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
        AND (usage_limit IS NULL OR usage_count < usage_limit)
        AND (module IS NULL OR module = $2)
      LIMIT 1;
    `;

    try {
      const result = await this.db.query(query, [promoCode, params.module]);
      const promo = result.rows[0];
      
      if (promo && promo.min_fare && params.baseFare < promo.min_fare) {
        return null; // Minimum fare not met
      }
      
      return promo || null;
    } catch (error) {
      console.error('Error fetching promo code:', error);
      throw error;
    }
  }

  /**
   * Get applicable tax policy
   * @param {Object} params - Quote parameters
   * @returns {Promise<Object|null>} Tax policy or null
   */
  async getTaxPolicy(params) {
    const query = `
      SELECT *
      FROM tax_policies
      WHERE module = $1 AND status = 'active'
      ORDER BY priority DESC
      LIMIT 1;
    `;

    try {
      const result = await this.db.query(query, [params.module]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching tax policy:', error);
      throw error;
    }
  }

  /**
   * Calculate final quote with all pricing components
   * @param {Object} params - Quote parameters
   * @returns {Promise<Object>} Complete pricing breakdown
   */
  async quote(params) {
    const {
      module,
      baseFare = 0,
      currency = 'USD',
      debug = false,
      extras = {}
    } = params;

    const breakdown = debug ? { steps: [] } : undefined;
    let fare = Number(baseFare) || 0;

    if (debug) breakdown.steps.push({ label: 'baseFare', value: fare });

    // 1. Apply markup
    const markupRule = await this.getApplicableMarkupRule(params);
    let markup = 0;
    
    if (markupRule) {
      if (markupRule.markup_type === 'percent') {
        markup = Number((fare * (markupRule.markup_value / 100)).toFixed(2));
      } else if (markupRule.markup_type === 'fixed') {
        markup = Number(markupRule.markup_value.toFixed(2));
      }
      if (debug) breakdown.steps.push({ 
        label: 'markup', 
        rule: markupRule, 
        value: markup 
      });
    }

    // 2. Apply promo discount
    const promoCode = await this.getPromoDiscount(params);
    let discount = 0;
    
    if (promoCode) {
      const discountBase = fare + markup;
      if (promoCode.type === 'percent') {
        discount = Number((discountBase * (promoCode.value / 100)).toFixed(2));
      } else if (promoCode.type === 'fixed') {
        discount = Number(promoCode.value.toFixed(2));
      }
      
      // Apply max discount limit if set
      if (promoCode.max_discount && discount > promoCode.max_discount) {
        discount = Number(promoCode.max_discount.toFixed(2));
      }
      
      if (debug) breakdown.steps.push({ 
        label: 'discount', 
        promo: promoCode, 
        value: -discount 
      });
    }

    // 3. Calculate taxable amount
    const taxableAmount = Math.max(0, fare + markup - discount);

    // 4. Apply tax
    const taxPolicy = await this.getTaxPolicy(params);
    let tax = 0;
    
    if (taxPolicy) {
      if (taxPolicy.type === 'percent') {
        tax = Number((taxableAmount * (taxPolicy.value / 100)).toFixed(2));
      } else if (taxPolicy.type === 'fixed') {
        tax = Number(taxPolicy.value.toFixed(2));
      }
      if (debug) breakdown.steps.push({ 
        label: 'tax', 
        policy: taxPolicy, 
        value: tax 
      });
    }

    // 5. Calculate final total
    const totalFare = Number((taxableAmount + tax).toFixed(2));
    
    if (debug) breakdown.steps.push({ label: 'totalFare', value: totalFare });

    const result = {
      baseFare: fare,
      markup,
      discount,
      tax,
      totalFare,
      currency,
      taxableAmount,
      ...(debug ? { breakdown } : {})
    };

    // Log calculation for audit
    if (process.env.NODE_ENV === 'production' || debug) {
      console.log(`[PricingEngine] ${module} quote:`, {
        input: params,
        output: result,
        timestamp: new Date().toISOString()
      });
    }

    return result;
  }

  /**
   * Update promo code usage count
   * @param {string} promoCode - Promo code to update
   * @returns {Promise<void>}
   */
  async incrementPromoUsage(promoCode) {
    const query = `
      UPDATE promo_codes 
      SET usage_count = usage_count + 1,
          updated_at = now()
      WHERE code = $1;
    `;

    try {
      await this.db.query(query, [promoCode]);
    } catch (error) {
      console.error('Error updating promo usage:', error);
      throw error;
    }
  }

  /**
   * Validate pricing parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateParams(params) {
    const errors = [];
    const {
      module,
      baseFare,
      currency
    } = params;

    // Required fields
    if (!module) errors.push('module is required');
    if (!['air', 'hotel', 'sightseeing', 'transfer'].includes(module)) {
      errors.push('module must be one of: air, hotel, sightseeing, transfer');
    }
    if (baseFare === undefined || baseFare === null) errors.push('baseFare is required');
    if (isNaN(Number(baseFare)) || Number(baseFare) < 0) {
      errors.push('baseFare must be a positive number');
    }
    if (!currency) errors.push('currency is required');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get pricing rules summary for admin
   * @param {string} module - Module to get rules for
   * @returns {Promise<Object>} Rules summary
   */
  async getRulesSummary(module = null) {
    const whereClause = module ? "WHERE module = $1" : "";
    const params = module ? [module] : [];

    const query = `
      SELECT 
        module,
        COUNT(*) as total_rules,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_rules,
        AVG(CASE WHEN markup_type = 'percent' THEN markup_value END) as avg_percent_markup,
        AVG(CASE WHEN markup_type = 'fixed' THEN markup_value END) as avg_fixed_markup
      FROM markup_rules 
      ${whereClause}
      GROUP BY module;
    `;

    try {
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching rules summary:', error);
      throw error;
    }
  }
}

module.exports = PricingEngine;
