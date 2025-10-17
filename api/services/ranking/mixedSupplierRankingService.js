/**
 * Mixed-Supplier Ranking Service (Phase 2)
 * Aggregates and ranks results from multiple suppliers (RateHawk, Hotelbeds, TBO)
 * Implements price parity, supplier scoring, and user preference logic
 */

const db = require("../../database/connection");

class MixedSupplierRankingService {
  /**
   * Search and rank hotels across multiple suppliers
   * Returns unified results sorted by price + supplier scoring
   */
  static async searchMultiSupplier(searchParams = {}) {
    try {
      const {
        city,
        country,
        checkIn,
        checkOut,
        adults = 2,
        children = 0,
        priceMin = 0,
        priceMax = Infinity,
        freeCancellationOnly = false,
        minStarRating = 0,
        currency = "USD",
        preferredSuppliers = ["RATEHAWK", "HOTELBEDS", "TBO"],
        limit = 50,
        offset = 0,
      } = searchParams;

      // Get supplier scores/weights
      const supplierScores = await this.getSupplierScores(preferredSuppliers);

      // Main query: get properties with their cheapest offer from each supplier
      let query = `
        WITH room_offers_ranked AS (
          SELECT DISTINCT ON (property_id, supplier_code)
            ro.offer_id,
            ro.property_id,
            ro.supplier_code,
            ro.price_total,
            ro.room_name,
            ro.board_basis,
            ro.free_cancellation,
            ro.occupancy_adults,
            ro.occupancy_children,
            ro.currency,
            ro.rate_key_or_token
          FROM room_offer_unified ro
          WHERE 1 = 1
      `;

      const params = [];
      let paramIndex = 1;

      // Date filter
      if (checkIn && checkOut) {
        query += ` AND (ro.search_checkin <= $${paramIndex} AND ro.search_checkout >= $${paramIndex + 1})`;
        params.push(checkIn, checkOut);
        paramIndex += 2;
      }

      // Occupancy filter
      query += ` AND ro.occupancy_adults >= $${paramIndex} AND ro.occupancy_children >= $${paramIndex + 1}`;
      params.push(adults, children);
      paramIndex += 2;

      // Price filter
      query += ` AND ro.price_total >= $${paramIndex} AND ro.price_total <= $${paramIndex + 1}`;
      params.push(priceMin, priceMax);
      paramIndex += 2;

      // Free cancellation filter
      if (freeCancellationOnly) {
        query += ` AND ro.free_cancellation = true`;
      }

      // Currency
      if (currency) {
        query += ` AND ro.currency = $${paramIndex}`;
        params.push(currency);
        paramIndex += 1;
      }

      // Supplier filter
      if (preferredSuppliers && preferredSuppliers.length > 0) {
        const placeholders = preferredSuppliers
          .map(() => `$${paramIndex++}`)
          .join(",");
        query += ` AND ro.supplier_code IN (${placeholders})`;
        params.push(...preferredSuppliers);
      }

      query += ` ORDER BY property_id, supplier_code, ro.price_total ASC
        ),
        cheapest_per_property AS (
          SELECT DISTINCT ON (property_id)
            property_id,
            supplier_code,
            price_total,
            offer_id
          FROM room_offers_ranked
          ORDER BY property_id, price_total ASC
        )
        SELECT
          hu.property_id,
          hu.hotel_name,
          hu.address,
          hu.city,
          hu.country,
          hu.lat,
          hu.lng,
          hu.star_rating,
          hu.review_score,
          hu.review_count,
          hu.giata_id,
          hu.thumbnail_url,
          cpp.supplier_code,
          cpp.price_total,
          cpp.offer_id,
          COUNT(DISTINCT ro.supplier_code) as supplier_count
        FROM cheapest_per_property cpp
        JOIN hotel_unified hu ON cpp.property_id = hu.property_id
        LEFT JOIN room_offers_ranked ro ON hu.property_id = ro.property_id
        WHERE hu.city = $${paramIndex} OR hu.country = $${paramIndex + 1}
      `;
      params.push(city, country);
      paramIndex += 2;

      // Star rating filter
      if (minStarRating > 0) {
        query += ` AND hu.star_rating >= $${paramIndex}`;
        params.push(minStarRating);
        paramIndex += 1;
      }

      query += ` GROUP BY hu.property_id, cpp.supplier_code, cpp.price_total, cpp.offer_id
        ORDER BY cpp.price_total ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Enrich results with full offer details and supplier info
      const enriched = [];
      const processedProperties = new Set();

      for (const row of result.rows) {
        // Get full offer details
        const offerDetails = await db.query(
          `SELECT * FROM room_offer_unified WHERE offer_id = $1`,
          [row.offer_id],
        );

        if (offerDetails.rows.length === 0) continue;

        const offer = offerDetails.rows[0];
        const supplierScore = supplierScores[row.supplier_code] || {
          weight: 1.0,
          reliability: 0.8,
        };

        // Build response card
        const card = {
          property_id: row.property_id,
          hotel_name: row.hotel_name,
          address: row.address,
          city: row.city,
          country: row.country,
          lat: parseFloat(row.lat),
          lng: parseFloat(row.lng),
          star_rating: parseFloat(row.star_rating),
          review_score: parseFloat(row.review_score),
          review_count: row.review_count,
          thumbnail_url: row.thumbnail_url,
          badges: {
            breakfastIncluded: offer.board_basis !== "RO",
            freeCancellation: offer.free_cancellation || false,
            multipleSuppliers: row.supplier_count > 1,
          },
          price: {
            currency: offer.currency,
            total: parseFloat(offer.price_total),
            perNight: offer.price_per_night
              ? parseFloat(offer.price_per_night)
              : null,
          },
          supplier: {
            code: row.supplier_code,
            weight: supplierScore.weight,
            reliability: supplierScore.reliability,
          },
          room_name: offer.room_name,
          rate_key: offer.rate_key_or_token,
          offer_id: row.offer_id,
          alternatives: row.supplier_count > 1,
        };

        // Avoid duplicate properties (show cheapest first per property)
        if (!processedProperties.has(row.property_id)) {
          enriched.push(card);
          processedProperties.add(row.property_id);
        }
      }

      return enriched;
    } catch (error) {
      console.error("Error searching multi-supplier hotels", {
        searchParams,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get supplier scores/weights for ranking
   * Can be customized per user or globally
   */
  static async getSupplierScores(supplierCodes = []) {
    try {
      const result = await db.query(
        `SELECT COALESCE(code, supplier_code) AS code, enabled, weight FROM supplier_master
         WHERE COALESCE(code, supplier_code) = ANY($1)
         ORDER BY weight DESC`,
        [supplierCodes],
      );

      const scores = {};
      for (const row of result.rows) {
        // Higher weight = higher preference
        const normalizedWeight = Number(row.weight) || 100;
        scores[row.code.toUpperCase()] = {
          weight: normalizedWeight / 100,
          reliability: row.enabled ? 0.9 : 0.5,
        };
      }

      return scores;
    } catch (error) {
      console.error("Error getting supplier scores", { error: error.message });
      // Return default scores
      return {
        RATEHAWK: { weight: 1.0, reliability: 0.9 },
        HOTELBEDS: { weight: 1.1, reliability: 0.85 },
        TBO: { weight: 1.25, reliability: 0.8 },
      };
    }
  }

  /**
   * Get alternative suppliers for a property
   * Shows price comparison across all available suppliers
   */
  static async getPropertySupplierAlternatives(propertyId) {
    try {
      const alternatives = await db.query(
        `SELECT
          ro.supplier_code,
          COUNT(*) as available_rooms,
          MIN(ro.price_total) as cheapest_price,
          MAX(ro.price_total) as most_expensive_price,
          ROUND(AVG(ro.price_total)::numeric, 2) as avg_price,
          ro.currency,
          COUNT(CASE WHEN ro.free_cancellation = true THEN 1 END) as free_cancellation_count
         FROM room_offer_unified ro
         WHERE ro.property_id = $1
         AND (ro.expires_at IS NULL OR ro.expires_at > NOW())
         GROUP BY ro.supplier_code, ro.currency
         ORDER BY cheapest_price ASC`,
        [propertyId],
      );

      return {
        property_id: propertyId,
        suppliers: alternatives.rows.map((row) => ({
          supplier_code: row.supplier_code,
          price_range: {
            min: parseFloat(row.cheapest_price),
            max: parseFloat(row.most_expensive_price),
            average: parseFloat(row.avg_price),
            currency: row.currency,
          },
          available_rooms: row.available_rooms,
          free_cancellation_options: row.free_cancellation_count,
        })),
      };
    } catch (error) {
      console.error("Error getting supplier alternatives", {
        propertyId,
        error: error.message,
      });
      return { property_id: propertyId, suppliers: [] };
    }
  }

  /**
   * Get supplier performance metrics
   * Returns stats on pricing, availability, and reliability
   */
  static async getSupplierMetrics(supplierCode, timeWindowDays = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

      const metrics = await db.query(
        `SELECT
          supplier_code,
          COUNT(DISTINCT property_id) as unique_hotels,
          COUNT(*) as total_offers,
          ROUND(AVG(price_total)::numeric, 2) as avg_price,
          MIN(price_total) as min_price,
          MAX(price_total) as max_price,
          ROUND(
            (COUNT(CASE WHEN free_cancellation = true THEN 1 END)::float / 
             COUNT(*)::float * 100)::numeric, 2
          ) as free_cancellation_percentage,
          COUNT(CASE WHEN currency = 'USD' THEN 1 END) as usd_offers,
          COUNT(CASE WHEN currency = 'AED' THEN 1 END) as aed_offers
         FROM room_offer_unified
         WHERE supplier_code = $1
         AND created_at > $2
         GROUP BY supplier_code`,
        [supplierCode, cutoffDate],
      );

      if (metrics.rows.length === 0) {
        return null;
      }

      return metrics.rows[0];
    } catch (error) {
      console.error("Error getting supplier metrics", {
        supplierCode,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get total count of hotels across suppliers
   */
  static async getMultiSupplierCount(searchParams = {}) {
    try {
      const { city, country, preferredSuppliers = [] } = searchParams;

      let query = `
        SELECT COUNT(DISTINCT hu.property_id) as total
        FROM hotel_unified hu
        WHERE (hu.city = $1 OR hu.country = $2)
      `;
      const params = [city, country];

      if (preferredSuppliers.length > 0) {
        query += ` AND EXISTS (
          SELECT 1 FROM room_offer_unified ro 
          WHERE ro.property_id = hu.property_id 
          AND ro.supplier_code = ANY($3)
        )`;
        params.push(preferredSuppliers);
      }

      const result = await db.query(query, params);
      return parseInt(result.rows[0]?.total) || 0;
    } catch (error) {
      console.error("Error getting multi-supplier count", {
        searchParams,
        error: error.message,
      });
      return 0;
    }
  }
}

module.exports = MixedSupplierRankingService;
