/**
 * TBO Hotel Booking Database Model
 * Handles all database operations for TBO hotel bookings
 */

const db = require("../lib/db");

class TBOHotelBooking {
  constructor() {
    this.tableName = "tbo_hotel_bookings";
  }

  /**
   * Create a new TBO hotel booking record
   */
  async create(bookingData) {
    const {
      booking_id,
      trace_id,
      result_index,
      category_id,
      hotel_code,
      hotel_name,
      check_in_date,
      check_out_date,
      nights_count,
      room_config,
      room_occupancy,
      supplier_response,
      block_price,
      block_currency,
      block_status,
      book_price,
      book_currency,
      book_status,
      voucher_id,
      confirmation_id,
      price_changed_in_block,
      price_changed_in_book,
      cancellation_charges,
      refund_to_customer,
    } = bookingData;

    const query = `
      INSERT INTO ${this.tableName} (
        booking_id, trace_id, result_index, category_id, hotel_code, hotel_name,
        check_in_date, check_out_date, nights_count, room_config, room_occupancy,
        supplier_response, block_price, block_currency, block_status,
        book_price, book_currency, book_status, voucher_id, confirmation_id,
        price_changed_in_block, price_changed_in_book, cancellation_charges,
        refund_to_customer, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW()
      )
      RETURNING *
    `;

    const values = [
      booking_id,
      trace_id,
      result_index,
      category_id || null,
      hotel_code,
      hotel_name,
      check_in_date,
      check_out_date,
      nights_count,
      JSON.stringify(room_config || {}),
      JSON.stringify(room_occupancy || {}),
      JSON.stringify(supplier_response || {}),
      block_price || null,
      block_currency || null,
      block_status || null,
      book_price || null,
      book_currency || null,
      book_status || null,
      voucher_id || null,
      confirmation_id || null,
      price_changed_in_block || false,
      price_changed_in_book || false,
      JSON.stringify(cancellation_charges || {}),
      refund_to_customer || null,
    ];

    try {
      const result = await db.query(query, values);
      return {
        success: true,
        data: result.rows[0],
        message: "TBO booking created successfully",
      };
    } catch (error) {
      console.error("Error creating TBO booking:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to create TBO booking",
      };
    }
  }

  /**
   * Update TBO booking with block room response
   */
  async updateBlock(id, blockData) {
    const {
      block_price,
      block_currency,
      block_status,
      price_changed_in_block,
      supplier_response,
      category_id,
    } = blockData;

    const query = `
      UPDATE ${this.tableName}
      SET 
        block_price = COALESCE($2, block_price),
        block_currency = COALESCE($3, block_currency),
        block_status = COALESCE($4, block_status),
        price_changed_in_block = COALESCE($5, price_changed_in_block),
        supplier_response = COALESCE($6::jsonb, supplier_response),
        category_id = COALESCE($7, category_id),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      block_price || null,
      block_currency || null,
      block_status || null,
      price_changed_in_block || null,
      supplier_response ? JSON.stringify(supplier_response) : null,
      category_id || null,
    ];

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Booking not found",
        };
      }

      return {
        success: true,
        data: result.rows[0],
        message: "TBO booking block data updated",
      };
    } catch (error) {
      console.error("Error updating TBO booking block data:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update TBO booking with book/confirmation response
   */
  async updateBook(id, bookData) {
    const {
      book_price,
      book_currency,
      book_status,
      price_changed_in_book,
      voucher_id,
      confirmation_id,
      supplier_response,
    } = bookData;

    const query = `
      UPDATE ${this.tableName}
      SET 
        book_price = COALESCE($2, book_price),
        book_currency = COALESCE($3, book_currency),
        book_status = COALESCE($4, book_status),
        price_changed_in_book = COALESCE($5, price_changed_in_book),
        voucher_id = COALESCE($6, voucher_id),
        confirmation_id = COALESCE($7, confirmation_id),
        supplier_response = COALESCE($8::jsonb, supplier_response),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      book_price || null,
      book_currency || null,
      book_status || null,
      price_changed_in_book || null,
      voucher_id || null,
      confirmation_id || null,
      supplier_response ? JSON.stringify(supplier_response) : null,
    ];

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Booking not found",
        };
      }

      return {
        success: true,
        data: result.rows[0],
        message: "TBO booking confirmed",
      };
    } catch (error) {
      console.error("Error updating TBO booking confirmation:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find booking by trace ID
   */
  async findByTraceId(trace_id) {
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE trace_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    try {
      const result = await db.query(query, [trace_id]);
      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Booking not found",
          data: null,
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error("Error finding booking by trace ID:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Find booking by ID
   */
  async findById(id) {
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE id = $1
    `;

    try {
      const result = await db.query(query, [id]);
      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Booking not found",
          data: null,
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error("Error finding booking by ID:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Get all TBO bookings with filters
   */
  async getAll(filters = {}, page = 1, limit = 20) {
    let whereConditions = [];
    let values = [];
    let paramIndex = 1;

    if (filters.hotel_code) {
      whereConditions.push(`hotel_code = $${paramIndex}`);
      values.push(filters.hotel_code);
      paramIndex++;
    }

    if (filters.hotel_name) {
      whereConditions.push(`hotel_name ILIKE $${paramIndex}`);
      values.push(`%${filters.hotel_name}%`);
      paramIndex++;
    }

    if (filters.block_status) {
      whereConditions.push(`block_status = $${paramIndex}`);
      values.push(filters.block_status);
      paramIndex++;
    }

    if (filters.book_status) {
      whereConditions.push(`book_status = $${paramIndex}`);
      values.push(filters.book_status);
      paramIndex++;
    }

    if (filters.trace_id) {
      whereConditions.push(`trace_id = $${paramIndex}`);
      values.push(filters.trace_id);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${this.tableName}
      ${whereClause}
    `;

    const dataQuery = `
      SELECT *
      FROM ${this.tableName}
      ${whereClause}
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
      console.error("Error getting TBO bookings:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get booking analytics
   */
  async getAnalytics(dateFrom, dateTo) {
    const query = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN block_status = 'success' THEN 1 END) as blocked_bookings,
        COUNT(CASE WHEN book_status = 'success' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN price_changed_in_block = true THEN 1 END) as price_changed_in_block,
        COUNT(CASE WHEN price_changed_in_book = true THEN 1 END) as price_changed_in_book,
        SUM(block_price) as total_block_amount,
        SUM(book_price) as total_book_amount,
        AVG(block_price) as avg_block_price,
        AVG(book_price) as avg_book_price
      FROM ${this.tableName}
      WHERE created_at BETWEEN $1 AND $2
    `;

    try {
      const result = await db.query(query, [dateFrom, dateTo]);
      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error("Error getting TBO analytics:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new TBOHotelBooking();
