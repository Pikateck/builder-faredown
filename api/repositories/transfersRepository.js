/**
 * Transfers Repository
 * Handles all database operations for transfers module
 */

const { Client } = require("pg");
const winston = require("winston");

class TransfersRepository {
  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] [TRANSFERS_REPO] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
        })
      ),
      transports: [new winston.transports.Console()],
    });

    this.client = new Client({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "faredown",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
    });

    this.connected = false;
  }

  /**
   * Connect to database
   */
  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
      this.logger.info("Connected to PostgreSQL");
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    if (this.connected) {
      await this.client.end();
      this.connected = false;
      this.logger.info("Disconnected from PostgreSQL");
    }
  }

  /**
   * Create a new transfer booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} - Created booking record
   */
  async createBooking(bookingData) {
    await this.connect();

    try {
      const query = `
        INSERT INTO transfer_bookings (
          booking_ref, supplier_id, user_id, product_id,
          transfer_type, vehicle_type, vehicle_class, product_code, product_name,
          pickup_location, pickup_location_code, pickup_type, pickup_address,
          dropoff_location, dropoff_location_code, dropoff_type, dropoff_address,
          pickup_date, pickup_time, return_date, return_time,
          adults_count, children_count, infants_count, total_passengers,
          guest_details, flight_number, flight_arrival_time,
          special_requests, mobility_requirements, child_seats_required,
          base_price, return_price, markup_amount, markup_percentage,
          discount_amount, taxes, fees, surcharges, total_amount, currency,
          promo_code, promo_discount_type, promo_discount_value,
          status, payment_status, internal_notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
          $41, $42, $43, $44, $45, $46, $47
        ) RETURNING *
      `;

      const values = [
        bookingData.bookingRef,
        bookingData.supplierId || 1, // Default to Hotelbeds
        bookingData.userId,
        bookingData.productId,
        bookingData.transferType || "one_way",
        bookingData.vehicleType,
        bookingData.vehicleClass,
        bookingData.productCode,
        bookingData.productName,
        bookingData.pickupLocation,
        bookingData.pickupLocationCode,
        bookingData.pickupType,
        bookingData.pickupAddress,
        bookingData.dropoffLocation,
        bookingData.dropoffLocationCode,
        bookingData.dropoffType,
        bookingData.dropoffAddress,
        bookingData.pickupDate,
        bookingData.pickupTime,
        bookingData.returnDate,
        bookingData.returnTime,
        bookingData.adultsCount || 2,
        bookingData.childrenCount || 0,
        bookingData.infantsCount || 0,
        bookingData.totalPassengers,
        JSON.stringify(bookingData.guestDetails),
        bookingData.flightNumber,
        bookingData.flightArrivalTime,
        bookingData.specialRequests,
        bookingData.mobilityRequirements,
        bookingData.childSeatsRequired || 0,
        bookingData.basePrice,
        bookingData.returnPrice || 0,
        bookingData.markupAmount || 0,
        bookingData.markupPercentage || 0,
        bookingData.discountAmount || 0,
        bookingData.taxes || 0,
        bookingData.fees || 0,
        bookingData.surcharges || 0,
        bookingData.totalAmount,
        bookingData.currency || "INR",
        bookingData.promoCode,
        bookingData.promoDiscountType,
        bookingData.promoDiscountValue,
        bookingData.status || "pending",
        bookingData.paymentStatus || "pending",
        bookingData.internalNotes,
      ];

      const result = await this.client.query(query, values);
      
      this.logger.info("Transfer booking created", {
        bookingId: result.rows[0].id,
        bookingRef: result.rows[0].booking_ref,
        totalAmount: result.rows[0].total_amount,
      });

      return result.rows[0];
    } catch (error) {
      this.logger.error("Failed to create transfer booking", {
        error: error.message,
        bookingRef: bookingData.bookingRef,
      });
      throw error;
    }
  }

  /**
   * Update a transfer booking
   * @param {number} bookingId - Booking ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated booking record
   */
  async updateBooking(bookingId, updateData) {
    await this.connect();

    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic SET clause
      Object.keys(updateData).forEach((key) => {
        const dbColumn = this.camelToSnakeCase(key);
        setClause.push(`${dbColumn} = $${paramIndex}`);
        
        // Handle JSON fields
        if (["guestDetails", "supplierResponse", "auditLog"].includes(key)) {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
        paramIndex++;
      });

      // Add updated_at
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE transfer_bookings 
        SET ${setClause.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      values.push(bookingId);

      const result = await this.client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error("Booking not found");
      }

      this.logger.info("Transfer booking updated", {
        bookingId,
        updatedFields: Object.keys(updateData),
      });

      return result.rows[0];
    } catch (error) {
      this.logger.error("Failed to update transfer booking", {
        error: error.message,
        bookingId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Update booking by reference
   * @param {string} bookingRef - Booking reference
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated booking record
   */
  async updateBookingByRef(bookingRef, updateData) {
    await this.connect();

    try {
      const booking = await this.getBookingByRef(bookingRef);
      if (!booking) {
        throw new Error("Booking not found");
      }

      return await this.updateBooking(booking.id, updateData);
    } catch (error) {
      this.logger.error("Failed to update booking by reference", {
        error: error.message,
        bookingRef,
      });
      throw error;
    }
  }

  /**
   * Get transfer booking by reference
   * @param {string} bookingRef - Booking reference
   * @returns {Promise<Object|null>} - Booking record or null
   */
  async getBookingByRef(bookingRef) {
    await this.connect();

    try {
      const query = `
        SELECT tb.*, s.name as supplier_name
        FROM transfer_bookings tb
        LEFT JOIN suppliers s ON tb.supplier_id = s.id
        WHERE tb.booking_ref = $1
      `;

      const result = await this.client.query(query, [bookingRef]);

      if (result.rows.length === 0) {
        return null;
      }

      const booking = result.rows[0];
      
      // Parse JSON fields
      if (booking.guest_details) {
        booking.guestDetails = JSON.parse(booking.guest_details);
      }
      if (booking.supplier_response) {
        booking.supplierResponse = JSON.parse(booking.supplier_response);
      }
      if (booking.audit_log) {
        booking.auditLog = JSON.parse(booking.audit_log);
      }

      return booking;
    } catch (error) {
      this.logger.error("Failed to get booking by reference", {
        error: error.message,
        bookingRef,
      });
      throw error;
    }
  }

  /**
   * Get transfer bookings by user ID
   * @param {number} userId - User ID
   * @param {Object} options - Query options (limit, offset, status)
   * @returns {Promise<Array>} - Array of booking records
   */
  async getBookingsByUser(userId, options = {}) {
    await this.connect();

    try {
      const { limit = 20, offset = 0, status } = options;

      let whereClause = "WHERE tb.user_id = $1";
      const values = [userId];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND tb.status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
      }

      const query = `
        SELECT 
          tb.id, tb.booking_ref, tb.status, tb.vehicle_type,
          tb.pickup_location, tb.dropoff_location, tb.pickup_date, tb.pickup_time,
          tb.total_amount, tb.currency, tb.payment_status,
          tb.created_at, tb.updated_at,
          s.name as supplier_name
        FROM transfer_bookings tb
        LEFT JOIN suppliers s ON tb.supplier_id = s.id
        ${whereClause}
        ORDER BY tb.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      values.push(limit, offset);

      const result = await this.client.query(query, values);

      return result.rows;
    } catch (error) {
      this.logger.error("Failed to get bookings by user", {
        error: error.message,
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Cache transfer search results
   * @param {Object} searchParams - Search parameters
   * @param {Object} results - Search results
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Cache record
   */
  async cacheSearchResults(searchParams, results, sessionId) {
    await this.connect();

    try {
      const searchHash = this.generateSearchHash(searchParams);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const query = `
        INSERT INTO transfer_routes_cache (
          supplier_id, search_hash, pickup_location_code, dropoff_location_code,
          pickup_type, dropoff_type, request_params, raw_response,
          normalized_products, ttl_seconds, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (search_hash) 
        DO UPDATE SET 
          raw_response = EXCLUDED.raw_response,
          normalized_products = EXCLUDED.normalized_products,
          expires_at = EXCLUDED.expires_at,
          hit_count = transfer_routes_cache.hit_count + 1,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [
        1, // Default supplier ID (Hotelbeds)
        searchHash,
        searchParams.pickupLocationCode,
        searchParams.dropoffLocationCode,
        searchParams.pickupType || "address",
        searchParams.dropoffType || "address",
        JSON.stringify(searchParams),
        JSON.stringify(results.supplierResults),
        JSON.stringify(results.transfers),
        3600, // 1 hour TTL
        expiresAt,
      ];

      const result = await this.client.query(query, values);

      this.logger.info("Search results cached", {
        searchHash,
        sessionId,
        transfersCount: results.transfers.length,
        expiresAt,
      });

      return result.rows[0];
    } catch (error) {
      this.logger.error("Failed to cache search results", {
        error: error.message,
        sessionId,
      });
      // Don't throw error for caching failures
      return null;
    }
  }

  /**
   * Get cached search results
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object|null>} - Cached results or null
   */
  async getCachedSearchResults(searchParams) {
    await this.connect();

    try {
      const searchHash = this.generateSearchHash(searchParams);

      const query = `
        SELECT normalized_products, expires_at, hit_count, created_at
        FROM transfer_routes_cache 
        WHERE search_hash = $1 
        AND expires_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await this.client.query(query, [searchHash]);

      if (result.rows.length === 0) {
        return null;
      }

      const cached = result.rows[0];

      // Update hit count
      await this.client.query(
        "UPDATE transfer_routes_cache SET hit_count = hit_count + 1 WHERE search_hash = $1",
        [searchHash]
      );

      return {
        transfers: JSON.parse(cached.normalized_products),
        cachedAt: cached.created_at,
        hitCount: cached.hit_count,
        expiresAt: cached.expires_at,
      };
    } catch (error) {
      this.logger.error("Failed to get cached search results", {
        error: error.message,
        searchHash: this.generateSearchHash(searchParams),
      });
      return null;
    }
  }

  /**
   * Store transfer product details
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} - Created product record
   */
  async storeProduct(productData) {
    await this.connect();

    try {
      const query = `
        INSERT INTO transfer_products (
          supplier_id, product_code, product_name, vehicle_type, vehicle_class,
          max_passengers, max_luggage, pickup_location, pickup_location_code,
          pickup_type, dropoff_location, dropoff_location_code, dropoff_type,
          distance_km, estimated_duration_minutes, base_price, currency,
          features, inclusions, exclusions, cancellation_policy,
          provider_name, provider_rating, is_active, supplier_data, search_session_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26
        ) RETURNING *
      `;

      const values = [
        productData.supplierId || 1,
        productData.productCode,
        productData.productName,
        productData.vehicleType,
        productData.vehicleClass,
        productData.maxPassengers,
        productData.maxLuggage,
        productData.pickupLocation,
        productData.pickupLocationCode,
        productData.pickupType,
        productData.dropoffLocation,
        productData.dropoffLocationCode,
        productData.dropoffType,
        productData.distanceKm,
        productData.estimatedDurationMinutes,
        productData.basePrice,
        productData.currency,
        JSON.stringify(productData.features || []),
        JSON.stringify(productData.inclusions || []),
        JSON.stringify(productData.exclusions || []),
        JSON.stringify(productData.cancellationPolicy || {}),
        productData.providerName,
        productData.providerRating,
        productData.isActive !== false,
        JSON.stringify(productData.supplierData || {}),
        productData.searchSessionId,
      ];

      const result = await this.client.query(query, values);

      this.logger.info("Transfer product stored", {
        productId: result.rows[0].id,
        productCode: result.rows[0].product_code,
        vehicleType: result.rows[0].vehicle_type,
      });

      return result.rows[0];
    } catch (error) {
      this.logger.error("Failed to store transfer product", {
        error: error.message,
        productCode: productData.productCode,
      });
      throw error;
    }
  }

  /**
   * Get transfer pricing rules
   * @param {Object} criteria - Matching criteria
   * @returns {Promise<Array>} - Array of pricing rules
   */
  async getPricingRules(criteria = {}) {
    await this.connect();

    try {
      let whereClause = "WHERE is_active = true";
      const values = [];
      let paramIndex = 1;

      if (criteria.vehicleType) {
        whereClause += ` AND (vehicle_type IS NULL OR vehicle_type = $${paramIndex})`;
        values.push(criteria.vehicleType);
        paramIndex++;
      }

      if (criteria.pickupLocationCode) {
        whereClause += ` AND (pickup_location_code IS NULL OR pickup_location_code = $${paramIndex})`;
        values.push(criteria.pickupLocationCode);
        paramIndex++;
      }

      if (criteria.supplierId) {
        whereClause += ` AND (supplier_id IS NULL OR supplier_id = $${paramIndex})`;
        values.push(criteria.supplierId);
        paramIndex++;
      }

      const query = `
        SELECT * FROM transfer_pricing_rules 
        ${whereClause}
        ORDER BY priority ASC, created_at DESC
      `;

      const result = await this.client.query(query, values);

      return result.rows;
    } catch (error) {
      this.logger.error("Failed to get pricing rules", {
        error: error.message,
        criteria,
      });
      throw error;
    }
  }

  /**
   * Generate search hash for caching
   * @param {Object} searchParams - Search parameters
   * @returns {string} - MD5 hash
   */
  generateSearchHash(searchParams) {
    const crypto = require("crypto");
    const normalizedParams = {
      pickup: searchParams.pickupLocation,
      dropoff: searchParams.dropoffLocation,
      date: searchParams.pickupDate,
      time: searchParams.pickupTime,
      passengers: searchParams.passengers,
      isRoundTrip: searchParams.isRoundTrip,
      returnDate: searchParams.returnDate,
    };

    const hashString = JSON.stringify(normalizedParams);
    return crypto.createHash("md5").update(hashString).digest("hex");
  }

  /**
   * Convert camelCase to snake_case
   * @param {string} str - CamelCase string
   * @returns {string} - snake_case string
   */
  camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Get booking statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} - Booking statistics
   */
  async getBookingStats(filters = {}) {
    await this.connect();

    try {
      const { startDate, endDate, status } = filters;

      let whereClause = "WHERE 1=1";
      const values = [];
      let paramIndex = 1;

      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        values.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        values.push(endDate);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
      }

      const query = `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as average_booking_value,
          COUNT(DISTINCT vehicle_type) as unique_vehicle_types,
          COUNT(DISTINCT supplier_id) as unique_suppliers
        FROM transfer_bookings 
        ${whereClause}
      `;

      const result = await this.client.query(query, values);

      return {
        ...result.rows[0],
        total_revenue: parseFloat(result.rows[0].total_revenue || 0),
        average_booking_value: parseFloat(result.rows[0].average_booking_value || 0),
      };
    } catch (error) {
      this.logger.error("Failed to get booking statistics", {
        error: error.message,
        filters,
      });
      throw error;
    }
  }
}

module.exports = new TransfersRepository();
