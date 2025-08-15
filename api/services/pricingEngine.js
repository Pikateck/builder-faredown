/**
 * Complete Pricing Engine Service
 * Handles markup application, promo codes, bargaining logic, and booking confirmation
 * Supports Air, Hotel, Sightseeing, and Transfer modules
 */

const { Pool } = require('pg');

class PricingEngine {
  constructor(dbPool) {
    this.pool = dbPool;
  }

  /**
   * Get applicable markup rule for a booking
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

    // Build dynamic WHERE clause for rule matching
    let whereConditions = [
      'status = $1',
      'module = $2',
      '(valid_from IS NULL OR valid_from <= CURRENT_DATE)',
      '(valid_to IS NULL OR valid_to >= CURRENT_DATE)'
    ];
    
    let queryParams = ['active', module];
    let paramIndex = 3;

    // Add specific matching conditions (more specific rules win)
    const specificityScore = [];

    if (serviceClass) {
      whereConditions.push(`(service_class = $${paramIndex} OR service_class IS NULL)`);
      queryParams.push(serviceClass);
      specificityScore.push(`CASE WHEN service_class = $${paramIndex} THEN 1 ELSE 0 END`);
      paramIndex++;
    }

    if (hotelCategory) {
      whereConditions.push(`(hotel_category = $${paramIndex} OR hotel_category IS NULL)`);
      queryParams.push(hotelCategory);
      specificityScore.push(`CASE WHEN hotel_category = $${paramIndex} THEN 1 ELSE 0 END`);
      paramIndex++;
    }

    if (serviceType) {
      whereConditions.push(`(service_type = $${paramIndex} OR service_type IS NULL)`);
      queryParams.push(serviceType);
      specificityScore.push(`CASE WHEN service_type = $${paramIndex} THEN 1 ELSE 0 END`);
      paramIndex++;
    }

    if (origin) {
      whereConditions.push(`(origin = $${paramIndex} OR origin IS NULL OR origin = 'ALL')`);
      queryParams.push(origin);
      specificityScore.push(`CASE WHEN origin = $${paramIndex} THEN 1 ELSE 0 END`);
      paramIndex++;
    }

    if (destination) {
      whereConditions.push(`(destination = $${paramIndex} OR destination IS NULL OR destination = 'ALL')`);
      queryParams.push(destination);
      specificityScore.push(`CASE WHEN destination = $${paramIndex} THEN 1 ELSE 0 END`);
      paramIndex++;
    }

    if (airlineCode) {
      whereConditions.push(`(airline_code = $${paramIndex} OR airline_code IS NULL)`);
      queryParams.push(airlineCode);
      specificityScore.push(`CASE WHEN airline_code = $${paramIndex} THEN 1 ELSE 0 END`);
      paramIndex++;
    }

    // Build specificity calculation
    const specificityCalc = specificityScore.length > 0 
      ? specificityScore.join(' + ') 
      : '0';

    const query = `
      SELECT *,
             (${specificityCalc}) as specificity_score
      FROM markup_rules 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY priority DESC, specificity_score DESC, created_at ASC
      LIMIT 1
    `;

    const result = await this.pool.query(query, queryParams);
    return result.rows[0] || null;
  }

  /**
   * Validate and get promo code
   */
  async validatePromoCode(promoCode, params) {
    if (!promoCode) return null;

    const {
      module,
      fareAmount,
      serviceClass = null,
      hotelCategory = null,
      serviceType = null
    } = params;

    const query = `
      SELECT * FROM promo_codes 
      WHERE code = $1 
        AND module = $2 
        AND status = 'active'
        AND (expires_on IS NULL OR expires_on >= CURRENT_DATE)
        AND marketing_budget > budget_spent
        AND $3 >= min_fare_amount
        AND (service_class IS NULL OR service_class = $4)
        AND (hotel_category IS NULL OR hotel_category = $5)
        AND (service_type IS NULL OR service_type = $6)
    `;

    const result = await this.pool.query(query, [
      promoCode, module, fareAmount, serviceClass, hotelCategory, serviceType
    ]);

    return result.rows[0] || null;
  }

  /**
   * Calculate markup value
   */
  calculateMarkup(baseAmount, markupRule) {
    if (!markupRule) return 0;

    if (markupRule.markup_type === 'percent') {
      return baseAmount * (markupRule.markup_value / 100);
    } else {
      return markupRule.markup_value;
    }
  }

  /**
   * Calculate promo discount
   */
  calculatePromoDiscount(grossAmount, promoRule) {
    if (!promoRule) return 0;

    // Use random value between min and max for variety
    const discountPercent = promoRule.discount_min + 
      Math.random() * (promoRule.discount_max - promoRule.discount_min);

    if (promoRule.discount_type === 'percent') {
      return grossAmount * (discountPercent / 100);
    } else {
      return discountPercent; // Fixed amount
    }
  }

  /**
   * Generate pricing quote
   */
  async generateQuote(params) {
    const {
      module,
      baseNetAmount,
      origin,
      destination,
      serviceClass,
      hotelCategory,
      serviceType,
      airlineCode,
      userType = 'all',
      promoCode = null
    } = params;

    try {
      // 1. Get applicable markup rule
      const markupRule = await this.getApplicableMarkupRule({
        module, origin, destination, serviceClass, hotelCategory, serviceType, airlineCode, userType
      });

      if (!markupRule) {
        throw new Error(`No markup rule found for ${module} module`);
      }

      // 2. Calculate markup
      const markupValue = this.calculateMarkup(baseNetAmount, markupRule);
      const grossBeforePromo = baseNetAmount + markupValue;

      // 3. Validate and apply promo if provided
      let promoRule = null;
      let promoDiscount = 0;

      if (promoCode) {
        promoRule = await this.validatePromoCode(promoCode, {
          module, fareAmount: grossBeforePromo, serviceClass, hotelCategory, serviceType
        });

        if (promoRule) {
          promoDiscount = this.calculatePromoDiscount(grossBeforePromo, promoRule);
        }
      }

      const grossBeforeBargain = grossBeforePromo - promoDiscount;

      // 4. Calculate current fare range for display
      const currentFareMin = baseNetAmount * (1 + markupRule.current_min_pct / 100);
      const currentFareMax = baseNetAmount * (1 + markupRule.current_max_pct / 100);

      // 5. Calculate bargain range
      const bargainFareMin = baseNetAmount * (1 + markupRule.bargain_min_pct / 100);
      const bargainFareMax = baseNetAmount * (1 + markupRule.bargain_max_pct / 100);

      // 6. Generate temporary quote ID
      const tempId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 7. Store temporary quote
      await this.pool.query(`
        INSERT INTO pricing_quotes (
          temp_id, module, base_net_amount, markup_rule_id, markup_value,
          promo_code_id, promo_discount, gross_before_bargain, quote_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        tempId, module, baseNetAmount, markupRule.id, markupValue,
        promoRule?.id || null, promoDiscount, grossBeforeBargain,
        JSON.stringify({ ...params, currentFareRange: { min: currentFareMin, max: currentFareMax } })
      ]);

      return {
        tempId,
        baseNetAmount,
        markupRule: {
          id: markupRule.id,
          name: markupRule.rule_name,
          value: markupValue,
          percentage: markupRule.markup_value
        },
        promoCode: promoRule ? {
          id: promoRule.id,
          code: promoRule.code,
          discount: promoDiscount
        } : null,
        grossBeforePromo,
        promoDiscount,
        grossBeforeBargain,
        currentFareRange: { min: currentFareMin, max: currentFareMax },
        bargainRange: { min: bargainFareMin, max: bargainFareMax },
        finalPrice: grossBeforeBargain
      };

    } catch (error) {
      console.error('Error generating quote:', error);
      throw error;
    }
  }

  /**
   * Process bargain offer
   */
  async processBargainOffer(tempId, offeredPrice, userId = null) {
    try {
      // Get the quote
      const quoteResult = await this.pool.query(
        'SELECT * FROM pricing_quotes WHERE temp_id = $1 AND expires_at > CURRENT_TIMESTAMP',
        [tempId]
      );

      const quote = quoteResult.rows[0];
      if (!quote) {
        throw new Error('Quote not found or expired');
      }

      // Get markup rule to check bargain range
      const markupResult = await this.pool.query(
        'SELECT * FROM markup_rules WHERE id = $1',
        [quote.markup_rule_id]
      );

      const markupRule = markupResult.rows[0];
      const bargainMin = quote.base_net_amount * (1 + markupRule.bargain_min_pct / 100);
      const bargainMax = quote.base_net_amount * (1 + markupRule.bargain_max_pct / 100);

      let accepted = false;
      let counterOffer = null;
      let finalPrice = offeredPrice;

      // Check if offer is within acceptable range
      if (offeredPrice >= bargainMin && offeredPrice <= bargainMax) {
        accepted = true;
      } else if (offeredPrice < bargainMin) {
        // Counter-offer at minimum acceptable price
        counterOffer = bargainMin;
        finalPrice = bargainMin;
      } else {
        // Offer too high, accept it
        accepted = true;
      }

      // Log bargain event
      await this.pool.query(`
        INSERT INTO bargain_events (booking_id, user_id, offered_price, engine_counter_offer, accepted, metadata)
        VALUES (NULL, $1, $2, $3, $4, $5)
      `, [
        userId, offeredPrice, counterOffer, accepted,
        JSON.stringify({ temp_id: tempId, bargain_range: { min: bargainMin, max: bargainMax } })
      ]);

      // Update quote with bargain details
      const bargainDiscount = quote.gross_before_bargain - finalPrice;
      await this.pool.query(`
        UPDATE pricing_quotes 
        SET quote_details = quote_details || $1
        WHERE temp_id = $2
      `, [
        JSON.stringify({ 
          bargain_offer: offeredPrice, 
          bargain_discount: bargainDiscount,
          final_price: finalPrice,
          accepted: accepted,
          counter_offer: counterOffer
        }),
        tempId
      ]);

      return {
        accepted,
        counterOffer,
        finalPrice,
        bargainDiscount,
        message: accepted 
          ? 'Offer accepted!' 
          : `Your offer is below our minimum. We can offer ${counterOffer.toFixed(2)} instead.`
      };

    } catch (error) {
      console.error('Error processing bargain offer:', error);
      throw error;
    }
  }

  /**
   * Confirm booking
   */
  async confirmBooking(tempId, paymentReference, userId = null) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get the quote with all details
      const quoteResult = await client.query(
        'SELECT * FROM pricing_quotes WHERE temp_id = $1 AND expires_at > CURRENT_TIMESTAMP',
        [tempId]
      );

      const quote = quoteResult.rows[0];
      if (!quote) {
        throw new Error('Quote not found or expired');
      }

      const quoteDetails = quote.quote_details || {};
      const finalPrice = quoteDetails.final_price || quote.gross_before_bargain;
      const bargainDiscount = quoteDetails.bargain_discount || 0;

      // Generate booking reference
      const bookingReference = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Never-loss check
      const neverLossPass = finalPrice >= quote.base_net_amount;
      const safetyAdjustedPrice = neverLossPass ? finalPrice : quote.base_net_amount;

      // Create booking record
      const bookingResult = await client.query(`
        INSERT INTO bookings (
          module, base_net_amount, applied_markup_rule_id, applied_markup_value,
          promo_code_id, promo_discount_value, bargain_discount_value,
          gross_before_bargain, gross_after_bargain, final_payable,
          never_loss_pass, user_id, booking_reference, payment_reference,
          origin, destination, class, hotel_category, service_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `, [
        quote.module, quote.base_net_amount, quote.markup_rule_id, quote.markup_value,
        quote.promo_code_id, quote.promo_discount, bargainDiscount,
        quote.gross_before_bargain, finalPrice, safetyAdjustedPrice,
        neverLossPass, userId, bookingReference, paymentReference,
        quoteDetails.origin, quoteDetails.destination, quoteDetails.serviceClass,
        quoteDetails.hotelCategory, quoteDetails.serviceType
      ]);

      const booking = bookingResult.rows[0];

      // Update promo code budget if used
      if (quote.promo_code_id) {
        await client.query(`
          UPDATE promo_codes 
          SET budget_spent = budget_spent + $1 
          WHERE id = $2
        `, [quote.promo_discount, quote.promo_code_id]);
      }

      // Update bargain events with booking ID
      await client.query(`
        UPDATE bargain_events 
        SET booking_id = $1 
        WHERE metadata->>'temp_id' = $2
      `, [booking.id, tempId]);

      // Clean up the quote
      await client.query('DELETE FROM pricing_quotes WHERE temp_id = $1', [tempId]);

      await client.query('COMMIT');

      return {
        bookingId: booking.id,
        bookingReference: booking.booking_reference,
        finalAmount: booking.final_payable,
        neverLossTriggered: !neverLossPass,
        breakdown: {
          baseNet: booking.base_net_amount,
          markup: booking.applied_markup_value,
          promoDiscount: booking.promo_discount_value,
          bargainDiscount: booking.bargain_discount_value,
          finalPayable: booking.final_payable
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error confirming booking:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get booking details
   */
  async getBookingDetails(bookingId) {
    const query = `
      SELECT * FROM v_bookings_report 
      WHERE booking_id = $1
    `;

    const result = await this.pool.query(query, [bookingId]);
    return result.rows[0] || null;
  }

  /**
   * Get analytics data
   */
  async getAnalytics(module = null, startDate = null, endDate = null) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (module) {
      conditions.push(`module = $${paramIndex}`);
      params.push(module);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        module,
        COUNT(*) as total_bookings,
        SUM(base_net_amount) as total_net,
        SUM(applied_markup_value) as total_markup,
        SUM(promo_discount_value) as total_promo_discounts,
        SUM(bargain_discount_value) as total_bargain_discounts,
        SUM(final_payable) as total_revenue,
        AVG(applied_markup_pct) as avg_markup_pct,
        COUNT(CASE WHEN promo_code IS NOT NULL THEN 1 END) as bookings_with_promo,
        COUNT(CASE WHEN bargain_discount_value > 0 THEN 1 END) as bookings_with_bargain,
        COUNT(CASE WHEN never_loss_pass = false THEN 1 END) as never_loss_triggers
      FROM v_bookings_report
      ${whereClause}
      GROUP BY module
      ORDER BY total_revenue DESC
    `;

    const result = await this.pool.query(query, params);
    return result.rows;
  }
}

module.exports = PricingEngine;
