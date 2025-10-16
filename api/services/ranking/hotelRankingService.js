/**
 * Hotel Ranking Service
 * Queries unified master tables and ranks by cheapest total price
 */

const db = require("../../database/connection");

class HotelRankingService {
  /**
   * Get all room offers for a property, grouped by supplier
   * Returns: { property_id, cheapest_offer, all_offers_by_supplier }
   */
  static async getPropertyOffers(propertyId, currency = "USD") {
    try {
      const offers = await db.query(
        `SELECT
          offer_id, property_id, supplier_code, room_name, board_basis,
          bed_type, refundable, free_cancellation, occupancy_adults,
          occupancy_children, inclusions_json, currency, price_total,
          price_per_night, rate_key_or_token, availability_count
         FROM room_offer
         WHERE property_id = $1
         AND expires_at IS NULL OR expires_at > NOW()
         ORDER BY price_total ASC`,
        [propertyId],
      );

      if (offers.rows.length === 0) {
        return null;
      }

      // Group by supplier
      const bySupplier = {};
      for (const offer of offers.rows) {
        if (!bySupplier[offer.supplier_code]) {
          bySupplier[offer.supplier_code] = [];
        }
        bySupplier[offer.supplier_code].push(offer);
      }

      return {
        property_id: propertyId,
        cheapest_offer: offers.rows[0], // First row is cheapest (sorted by price_total ASC)
        offers_by_supplier: bySupplier,
        total_offers: offers.rows.length,
      };
    } catch (error) {
      console.error("Error fetching property offers", {
        propertyId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Search and rank hotels by cheapest total price
   * Filters applied: price range, free cancellation, occupancy, etc.
   */
  static async searchAndRankHotels(searchParams = {}) {
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
        limit = 50,
        offset = 0,
      } = searchParams;

      // Base query: get properties with filtered offers
      let query = `
        WITH filtered_offers AS (
          SELECT DISTINCT ON (ro.property_id)
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
          FROM room_offer ro
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

      // Currency (optional, can search across currencies post-conversion)
      if (currency) {
        query += ` AND ro.currency = $${paramIndex}`;
        params.push(currency);
        paramIndex += 1;
      }

      query += ` ORDER BY ro.property_id, ro.price_total ASC
        )
        SELECT
          hm.property_id,
          hm.hotel_name,
          hm.address,
          hm.city,
          hm.country,
          hm.lat,
          hm.lng,
          hm.star_rating,
          hm.review_score,
          hm.review_count,
          hm.giata_id,
          hm.thumbnail_url,
          COUNT(DISTINCT ro.offer_id) as offers_count,
          MIN(ro.price_total) as cheapest_price,
          MIN(ro.supplier_code) as cheapest_supplier
        FROM hotel_master hm
        LEFT JOIN filtered_offers ro ON hm.property_id = ro.property_id
        WHERE hm.city = $${paramIndex} OR hm.country = $${paramIndex + 1}
      `;
      params.push(city, country);
      paramIndex += 2;

      // Star rating filter
      if (minStarRating > 0) {
        query += ` AND hm.star_rating >= $${paramIndex}`;
        params.push(minStarRating);
        paramIndex += 1;
      }

      query += ` GROUP BY hm.property_id
        ORDER BY cheapest_price ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Enrich each result with cheapest offer details
      const enriched = [];
      for (const row of result.rows) {
        const offers = await this.getPropertyOffers(row.property_id, currency);
        enriched.push({
          property_id: row.property_id,
          hotel_name: row.hotel_name,
          address: row.address,
          city: row.city,
          country: row.country,
          lat: row.lat,
          lng: row.lng,
          star_rating: row.star_rating,
          review_score: row.review_score,
          review_count: row.review_count,
          thumbnail_url: row.thumbnail_url,
          badges: {
            breakfastIncluded:
              offers?.cheapest_offer?.board_basis !== "RO" || false,
            freeCancellation: offers?.cheapest_offer?.free_cancellation || false,
          },
          price: {
            currency: offers?.cheapest_offer?.currency || currency,
            total: parseFloat(offers?.cheapest_offer?.price_total) || 0,
            perNight: parseFloat(offers?.cheapest_offer?.price_per_night) || null,
          },
          cheapest_supplier: offers?.cheapest_offer?.supplier_code,
          offers_count: offers?.total_offers || 0,
          room_name: offers?.cheapest_offer?.room_name,
          rate_key: offers?.cheapest_offer?.rate_key_or_token,
        });
      }

      return enriched;
    } catch (error) {
      console.error("Error searching and ranking hotels", {
        searchParams,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get total count of properties matching search criteria
   */
  static async getSearchResultCount(searchParams = {}) {
    try {
      const { city, country, minStarRating = 0 } = searchParams;

      let query = `
        SELECT COUNT(DISTINCT hm.property_id) as total
        FROM hotel_master hm
        WHERE (hm.city = $1 OR hm.country = $2)
      `;
      const params = [city, country];

      if (minStarRating > 0) {
        query += ` AND hm.star_rating >= $3`;
        params.push(minStarRating);
      }

      const result = await db.query(query, params);
      return parseInt(result.rows[0]?.total) || 0;
    } catch (error) {
      console.error("Error getting search result count", {
        searchParams,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Get all offers for a property (for "View Details" page)
   */
  static async getPropertyAllOffers(propertyId) {
    try {
      const offers = await db.query(
        `SELECT
          offer_id, property_id, supplier_code, room_name, board_basis,
          bed_type, refundable, cancellable_until, free_cancellation,
          occupancy_adults, occupancy_children, inclusions_json,
          currency, price_base, price_taxes, price_total, price_per_night,
          rate_key_or_token, availability_count, created_at
         FROM room_offer
         WHERE property_id = $1
         AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY price_total ASC`,
        [propertyId],
      );

      // Group by supplier for display
      const grouped = {};
      for (const offer of offers.rows) {
        if (!grouped[offer.supplier_code]) {
          grouped[offer.supplier_code] = [];
        }
        grouped[offer.supplier_code].push(offer);
      }

      return {
        property_id: propertyId,
        offers_by_supplier: grouped,
        total_offers: offers.rows.length,
      };
    } catch (error) {
      console.error("Error fetching all property offers", {
        propertyId,
        error: error.message,
      });
      return null;
    }
  }
}

module.exports = HotelRankingService;
