/**
 * TBO Hotel Rate History Database Model
 * Tracks price changes across booking stages
 */

const db = require("../lib/db");

class TBOHotelRateHistory {
  constructor() {
    this.tableName = "tbo_hotel_rate_history";
  }

  /**
   * Record a price change at a specific stage
   */
  async recordPriceChange(priceData) {
    const {
      tbo_hotel_booking_id,
      trace_id,
      hotel_code,
      search_price,
      search_currency,
      block_price,
      block_currency,
      price_changed_in_block,
      block_price_increase,
      price_change_pct,
      book_price,
      book_currency,
      price_changed_in_book,
      book_price_increase,
      book_price_change_pct,
      stage,
    } = priceData;

    const query = `
      INSERT INTO ${this.tableName} (
        tbo_hotel_booking_id, trace_id, hotel_code,
        search_price, search_currency, block_price, block_currency,
        price_changed_in_block, block_price_increase, price_change_pct,
        book_price, book_currency, price_changed_in_book,
        book_price_increase, book_price_change_pct, stage, created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
      )
      RETURNING *
    `;

    const values = [
      tbo_hotel_booking_id,
      trace_id,
      hotel_code,
      search_price || null,
      search_currency || null,
      block_price || null,
      block_currency || null,
      price_changed_in_block || false,
      block_price_increase || null,
      price_change_pct || null,
      book_price || null,
      book_currency || null,
      price_changed_in_book || false,
      book_price_increase || null,
      book_price_change_pct || null,
      stage || "unknown",
    ];

    try {
      const result = await db.query(query, values);
      return {
        success: true,
        data: result.rows[0],
        message: "Price change recorded",
      };
    } catch (error) {
      console.error("Error recording price change:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to record price change",
      };
    }
  }

  /**
   * Get price history for a booking
   */
  async getByBookingId(tbo_hotel_booking_id) {
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE tbo_hotel_booking_id = $1
      ORDER BY created_at ASC
    `;

    try {
      const result = await db.query(query, [tbo_hotel_booking_id]);
      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Error getting price history:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get price history by trace ID
   */
  async getByTraceId(trace_id) {
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE trace_id = $1
      ORDER BY created_at ASC
    `;

    try {
      const result = await db.query(query, [trace_id]);
      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Error getting price history by trace ID:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get all price changes for a stage
   */
  async getByStage(stage, filters = {}, page = 1, limit = 20) {
    let whereConditions = [`stage = $1`];
    let values = [stage];
    let paramIndex = 2;

    if (filters.trace_id) {
      whereConditions.push(`trace_id = $${paramIndex}`);
      values.push(filters.trace_id);
      paramIndex++;
    }

    if (filters.hotel_code) {
      whereConditions.push(`hotel_code = $${paramIndex}`);
      values.push(filters.hotel_code);
      paramIndex++;
    }

    if (filters.price_changed) {
      const priceField =
        stage === "block"
          ? "price_changed_in_block"
          : "price_changed_in_book";
      whereConditions.push(`${priceField} = $${paramIndex}`);
      values.push(filters.price_changed);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${this.tableName}
      WHERE ${whereClause}
    `;

    const dataQuery = `
      SELECT *
      FROM ${this.tableName}
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        db.query(countQuery, values.slice(0, -2)),
        db.query(dataQuery, values),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting price changes by stage:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get price change statistics
   */
  async getPriceChangeStats(dateFrom, dateTo) {
    const query = `
      SELECT 
        stage,
        COUNT(*) as total_records,
        COUNT(CASE WHEN (stage = 'block' AND price_changed_in_block = true) OR (stage = 'book' AND price_changed_in_book = true) THEN 1 END) as price_changed_count,
        AVG(CASE WHEN stage = 'block' THEN price_change_pct ELSE NULL END) as avg_block_price_change_pct,
        AVG(CASE WHEN stage = 'book' THEN book_price_change_pct ELSE NULL END) as avg_book_price_change_pct,
        MAX(CASE WHEN stage = 'block' THEN block_price_increase ELSE NULL END) as max_block_increase,
        MAX(CASE WHEN stage = 'book' THEN book_price_increase ELSE NULL END) as max_book_increase
      FROM ${this.tableName}
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY stage
    `;

    try {
      const result = await db.query(query, [dateFrom, dateTo]);
      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Error getting price change stats:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Identify hotels with frequent price changes
   */
  async getHotelsWithFrequentChanges(dateFrom, dateTo, threshold = 5) {
    const query = `
      SELECT 
        hotel_code,
        COUNT(*) as price_change_events,
        COUNT(DISTINCT tbo_hotel_booking_id) as affected_bookings,
        AVG(price_change_pct) as avg_price_change_pct,
        MAX(price_change_pct) as max_price_change_pct
      FROM ${this.tableName}
      WHERE created_at BETWEEN $1 AND $2
      AND (price_changed_in_block = true OR price_changed_in_book = true)
      GROUP BY hotel_code
      HAVING COUNT(*) >= $3
      ORDER BY price_change_events DESC
    `;

    try {
      const result = await db.query(query, [dateFrom, dateTo, threshold]);
      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Error getting hotels with frequent changes:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }
}

module.exports = new TBOHotelRateHistory();
