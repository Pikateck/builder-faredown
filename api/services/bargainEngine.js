/**
 * Bargain Engine Service
 * Core business logic for module-specific bargaining
 */

const db = require("../lib/db");

class BargainEngine {
  /**
   * Get effective settings for a module (with market overrides)
   * @param {string} module - Module name
   * @param {object} options - Optional country/city for market rules
   * @returns {Promise<object>} Resolved settings
   */
  async getSettings(module, options = {}) {
    const { country_code, city } = options;

    // Get base settings
    const baseResult = await db.query(
      "SELECT * FROM bargain_settings WHERE module = $1",
      [module],
    );

    if (baseResult.rows.length === 0) {
      throw new Error(`No settings found for module: ${module}`);
    }

    let settings = baseResult.rows[0];

    // Apply market-specific overrides if provided
    if (country_code || city) {
      const marketResult = await db.query(
        `SELECT * FROM bargain_market_rules 
         WHERE module = $1 
         AND (country_code = $2 OR country_code IS NULL)
         AND (city = $3 OR city IS NULL)
         ORDER BY 
           CASE WHEN city IS NOT NULL THEN 1 ELSE 2 END,
           CASE WHEN country_code IS NOT NULL THEN 1 ELSE 2 END
         LIMIT 1`,
        [module, country_code, city],
      );

      if (marketResult.rows.length > 0) {
        const override = marketResult.rows[0];

        // Merge overrides
        settings = {
          ...settings,
          attempts:
            override.attempts !== null ? override.attempts : settings.attempts,
          r1_timer_sec:
            override.r1_timer_sec !== null
              ? override.r1_timer_sec
              : settings.r1_timer_sec,
          r2_timer_sec:
            override.r2_timer_sec !== null
              ? override.r2_timer_sec
              : settings.r2_timer_sec,
          discount_min_pct:
            override.discount_min_pct !== null
              ? override.discount_min_pct
              : settings.discount_min_pct,
          discount_max_pct:
            override.discount_max_pct !== null
              ? override.discount_max_pct
              : settings.discount_max_pct,
          copy_json: override.copy_json
            ? { ...settings.copy_json, ...override.copy_json }
            : settings.copy_json,
        };
      }
    }

    return settings;
  }

  /**
   * Start a new bargain session
   * @param {object} params - Session parameters
   * @returns {Promise<object>} Session data
   */
  async startSession(params) {
    const { module, productId, basePrice, userId, metadata } = params;

    // Get settings
    const settings = await this.getSettings(module, metadata);

    if (!settings.enabled) {
      throw new Error(`Bargaining is disabled for module: ${module}`);
    }

    // Create session
    const result = await db.query(
      `INSERT INTO bargain_sessions 
       (module, product_id, user_id, base_price_cents, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [module, productId, userId, basePrice, JSON.stringify(metadata || {})],
    );

    const session = result.rows[0];

    // Log event
    await this.logEvent(session.id, "bargain_opened", {
      module,
      productId,
      basePrice,
      ...metadata,
    });

    return {
      sessionId: session.id,
      r1Timer: settings.r1_timer_sec,
      r2Timer: settings.r2_timer_sec,
      attempts: settings.attempts,
      discountRange: {
        min: settings.discount_min_pct,
        max: settings.discount_max_pct,
      },
      copy: settings.copy_json,
      showRecommendedBadge: settings.show_recommended_badge,
      recommendedLabel: settings.recommended_label,
    };
  }

  /**
   * Calculate counter-offer based on bid
   * @param {number} basePriceCents - Original price
   * @param {number} bidCents - User's bid
   * @param {object} settings - Module settings
   * @returns {number} Counter-offer in cents
   */
  calculateCounterOffer(basePriceCents, bidCents, settings) {
    const minDiscountCents = Math.floor(
      (basePriceCents * settings.discount_min_pct) / 100,
    );
    const maxDiscountCents = Math.floor(
      (basePriceCents * settings.discount_max_pct) / 100,
    );

    const minPrice = basePriceCents - maxDiscountCents;
    const maxPrice = basePriceCents - minDiscountCents;

    // If bid is too low, offer min price
    if (bidCents < minPrice) {
      return minPrice;
    }

    // If bid is acceptable, meet halfway between bid and max
    if (bidCents <= maxPrice) {
      return Math.floor((bidCents + maxPrice) / 2);
    }

    // If bid is too high, offer max price
    return maxPrice;
  }

  /**
   * Submit Round 1 bid
   * @param {string} sessionId - Session ID
   * @param {number} bidCents - User's bid
   * @returns {Promise<object>} Counter-offer
   */
  async submitRound1(sessionId, bidCents) {
    // Get session
    const sessionResult = await db.query(
      "SELECT * FROM bargain_sessions WHERE id = $1",
      [sessionId],
    );

    if (sessionResult.rows.length === 0) {
      throw new Error("Session not found");
    }

    const session = sessionResult.rows[0];

    // Get settings
    const settings = await this.getSettings(session.module);

    // Calculate offer
    const offerCents = this.calculateCounterOffer(
      session.base_price_cents,
      bidCents,
      settings,
    );

    // Update session
    await db.query(
      `UPDATE bargain_sessions 
       SET r1_bid_cents = $1, r1_offer_cents = $2, updated_at = now()
       WHERE id = $3`,
      [bidCents, offerCents, sessionId],
    );

    // Log events
    await this.logEvent(sessionId, "bargain_round1_bid_submitted", {
      bidCents,
    });
    await this.logEvent(sessionId, "bargain_round1_offer_shown", {
      offerCents,
    });

    return {
      offer: offerCents,
      timer: settings.r1_timer_sec,
    };
  }

  /**
   * Submit Round 2 bid (hotels only)
   * @param {string} sessionId - Session ID
   * @param {number} bidCents - User's bid
   * @returns {Promise<object>} Counter-offer
   */
  async submitRound2(sessionId, bidCents) {
    // Get session
    const sessionResult = await db.query(
      "SELECT * FROM bargain_sessions WHERE id = $1",
      [sessionId],
    );

    if (sessionResult.rows.length === 0) {
      throw new Error("Session not found");
    }

    const session = sessionResult.rows[0];

    // Verify Round 1 was completed
    if (!session.r1_offer_cents) {
      throw new Error("Round 1 must be completed first");
    }

    // Get settings
    const settings = await this.getSettings(session.module);

    if (settings.attempts < 2) {
      throw new Error(`Module ${session.module} does not support Round 2`);
    }

    // Calculate offer
    const offerCents = this.calculateCounterOffer(
      session.base_price_cents,
      bidCents,
      settings,
    );

    // Update session
    await db.query(
      `UPDATE bargain_sessions 
       SET r2_bid_cents = $1, r2_offer_cents = $2, updated_at = now()
       WHERE id = $3`,
      [bidCents, offerCents, sessionId],
    );

    // Log events
    await this.logEvent(sessionId, "bargain_round2_bid_submitted", {
      bidCents,
    });
    await this.logEvent(sessionId, "bargain_round2_offer_shown", {
      offerCents,
    });

    return {
      offer: offerCents,
      timer: settings.r2_timer_sec,
    };
  }

  /**
   * Record Round 1 action
   * @param {string} sessionId - Session ID
   * @param {string} action - Action taken
   * @returns {Promise<void>}
   */
  async recordRound1Action(sessionId, action) {
    await db.query(
      `UPDATE bargain_sessions 
       SET r1_action = $1, updated_at = now()
       WHERE id = $2`,
      [action, sessionId],
    );

    await this.logEvent(sessionId, "bargain_round1_action", { action });
  }

  /**
   * Select final price
   * @param {string} sessionId - Session ID
   * @param {string} selection - 'r1' or 'r2'
   * @returns {Promise<object>} Selected price
   */
  async selectPrice(sessionId, selection) {
    // Get session
    const sessionResult = await db.query(
      "SELECT * FROM bargain_sessions WHERE id = $1",
      [sessionId],
    );

    if (sessionResult.rows.length === 0) {
      throw new Error("Session not found");
    }

    const session = sessionResult.rows[0];

    const selectedPrice =
      selection === "r1" ? session.r1_offer_cents : session.r2_offer_cents;

    if (!selectedPrice) {
      throw new Error(`No offer available for ${selection}`);
    }

    // Update session
    await db.query(
      `UPDATE bargain_sessions 
       SET selected_price_cents = $1, updated_at = now()
       WHERE id = $2`,
      [selectedPrice, sessionId],
    );

    // Log event
    await this.logEvent(sessionId, "bargain_price_selected", {
      selection,
      priceSelected: selectedPrice,
    });

    return {
      priceToBook: selectedPrice,
    };
  }

  /**
   * Mark session as abandoned
   * @param {string} sessionId - Session ID
   * @param {string} reason - Abandon reason
   * @returns {Promise<void>}
   */
  async abandonSession(sessionId, reason) {
    await db.query(
      `UPDATE bargain_sessions 
       SET outcome = 'abandoned', updated_at = now()
       WHERE id = $1`,
      [sessionId],
    );

    await this.logEvent(sessionId, "bargain_abandoned", { reason });
  }

  /**
   * Log analytics event
   * @param {string} sessionId - Session ID
   * @param {string} eventName - Event name
   * @param {object} payload - Event payload
   * @returns {Promise<void>}
   */
  async logEvent(sessionId, eventName, payload) {
    await db.query(
      `INSERT INTO bargain_events_raw (session_id, name, payload)
       VALUES ($1, $2, $3)`,
      [sessionId, eventName, JSON.stringify(payload)],
    );
  }

  /**
   * Create price hold (temporary reservation)
   * @param {string} sessionId - Session ID
   * @param {number} holdDurationMinutes - Hold duration
   * @returns {Promise<object>} Hold details
   */
  async createHold(sessionId, holdDurationMinutes = 15) {
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);

    // In Phase A, we just return hold data without DB persistence
    // Full hold tracking can be added in Phase B
    return {
      holdToken: `HOLD_${sessionId}_${Date.now()}`,
      expiresAt: expiresAt.toISOString(),
      sessionId,
    };
  }
}

module.exports = new BargainEngine();
