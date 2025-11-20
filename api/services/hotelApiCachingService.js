/**
 * Hotel API Caching Service
 * Implements:
 * - Redis caching for search and room results
 * - Request coalescing (promise locking)
 * - Full logging to database
 * - Cache hit tracking
 */

const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const redisClient = require("../lib/redisClient");
const pool = require("../database/connection");
const winston = require("winston");

class HotelApiCachingService {
  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] [HOTEL_CACHE] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
        }),
      ),
      transports: [new winston.transports.Console()],
    });

    // In-memory store for request coalescing (promise locking)
    this.ongoingRequests = new Map();

    // Cache TTL constants
    this.TTL = {
      HOTEL_SEARCH: 180, // 3 minutes
      ROOM_DETAILS: 120, // 2 minutes
      CITY_INFO: 3600, // 1 hour
      HOTEL_INFO: 3600, // 1 hour
    };
  }

  /**
   * Generate a search hash from search parameters
   * Used as cache key identifier
   */
  generateSearchHash(params) {
    const {
      cityId,
      countryCode,
      checkInDate,
      checkOutDate,
      checkIn,
      checkOut,
      nationality,
      rooms = [],
      adults = 2,
      children = 0,
      childAges = [],
    } = params;

    // Normalize rooms - can be string "1" or array of room objects
    let normalizedRooms = [];
    if (typeof rooms === "string") {
      // Single string like "1" or "2" - create room objects for each
      const numRooms = parseInt(rooms) || 1;
      for (let i = 0; i < numRooms; i++) {
        normalizedRooms.push({
          adults: parseInt(adults) || 2,
          children: parseInt(children) || 0,
          childAges: Array.isArray(childAges) ? childAges : [],
        });
      }
    } else if (Array.isArray(rooms)) {
      // Already an array of room objects
      normalizedRooms = rooms;
    } else {
      // Fallback: create default room
      normalizedRooms = [
        {
          adults: parseInt(adults) || 2,
          children: parseInt(children) || 0,
          childAges: Array.isArray(childAges) ? childAges : [],
        },
      ];
    }

    // Create a normalized string representation
    const roomsStr = normalizedRooms
      .map(
        (r) =>
          `${r.adults || 0}-${r.children || 0}-${(r.childAges || []).join(",")}`,
      )
      .join("|");

    // Use checkIn/checkOut if provided, otherwise fall back to checkInDate/checkOutDate
    const checkInDate_ = checkInDate || checkIn;
    const checkOutDate_ = checkOutDate || checkOut;

    const searchString = JSON.stringify({
      cityId: cityId?.toString() || "",
      countryCode: (countryCode || "").toUpperCase(),
      checkInDate: checkInDate_?.toString() || "",
      checkOutDate: checkOutDate_?.toString() || "",
      nationality: (nationality || "").toUpperCase(),
      rooms: roomsStr,
    });

    // Generate MD5 hash
    return crypto.createHash("md5").update(searchString).digest("hex");
  }

  /**
   * Generate a room details cache key
   */
  generateRoomKey(hotelCode, roomKey, checkInDate, checkOutDate) {
    return `hotel_room:${hotelCode}:${roomKey}:${checkInDate}:${checkOutDate}`;
  }

  /**
   * Check if identical request is already in progress
   * If so, return the pending promise (request coalescing)
   * If not, create a new pending request marker
   */
  getOrCreatePendingRequest(searchHash) {
    if (this.ongoingRequests.has(searchHash)) {
      this.logger.info(
        "Request coalescing: waiting for identical in-progress request",
        {
          searchHash,
        },
      );
      return this.ongoingRequests.get(searchHash);
    }

    // Create a promise that will be resolved when the request completes
    let resolvePending, rejectPending;
    const pendingPromise = new Promise((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    });

    this.ongoingRequests.set(searchHash, {
      promise: pendingPromise,
      resolve: resolvePending,
      reject: rejectPending,
      startTime: Date.now(),
    });

    return pendingPromise;
  }

  /**
   * Complete a pending request
   */
  completePendingRequest(searchHash, result) {
    const pending = this.ongoingRequests.get(searchHash);
    if (pending) {
      const duration = Date.now() - pending.startTime;
      this.logger.info("Completing pending request", {
        searchHash,
        durationMs: duration,
      });
      pending.resolve(result);
      this.ongoingRequests.delete(searchHash);
    }
  }

  /**
   * Fail a pending request
   */
  failPendingRequest(searchHash, error) {
    const pending = this.ongoingRequests.get(searchHash);
    if (pending) {
      const duration = Date.now() - pending.startTime;
      this.logger.error("Failing pending request", {
        searchHash,
        durationMs: duration,
        error: error.message,
      });
      pending.reject(error);
      this.ongoingRequests.delete(searchHash);
    }
  }

  /**
   * Try to get hotel search results from cache
   */
  async getCachedSearchResults(searchHash) {
    try {
      const cacheKey = `hotel_search:${searchHash}`;
      const cached = await redisClient.getJSON(cacheKey);

      if (cached) {
        this.logger.info("Cache hit for hotel search", {
          searchHash,
          resultCount: cached.results?.length || 0,
        });
        return {
          results: cached.results,
          cacheHit: true,
          cachedAt: cached.cachedAt,
        };
      }

      return null;
    } catch (error) {
      this.logger.warn("Failed to get cached search results:", error.message);
      return null;
    }
  }

  /**
   * Cache hotel search results
   */
  async cacheSearchResults(searchHash, results) {
    try {
      const cacheKey = `hotel_search:${searchHash}`;
      const cacheData = {
        results,
        cachedAt: new Date().toISOString(),
      };

      await redisClient.setJSON(cacheKey, cacheData, this.TTL.HOTEL_SEARCH);

      this.logger.info("Cached hotel search results", {
        searchHash,
        resultCount: results.length,
        ttlSeconds: this.TTL.HOTEL_SEARCH,
      });

      return true;
    } catch (error) {
      this.logger.warn("Failed to cache search results:", error.message);
      return false;
    }
  }

  /**
   * Try to get cached room details
   */
  async getCachedRoomDetails(roomCacheKey) {
    try {
      const cached = await redisClient.getJSON(roomCacheKey);
      if (cached) {
        this.logger.info("Cache hit for room details", { roomCacheKey });
        return {
          roomDetails: cached.roomDetails,
          cacheHit: true,
          cachedAt: cached.cachedAt,
        };
      }
      return null;
    } catch (error) {
      this.logger.warn("Failed to get cached room details:", error.message);
      return null;
    }
  }

  /**
   * Cache room details
   */
  async cacheRoomDetails(roomCacheKey, roomDetails) {
    try {
      const cacheData = {
        roomDetails,
        cachedAt: new Date().toISOString(),
      };

      await redisClient.setJSON(roomCacheKey, cacheData, this.TTL.ROOM_DETAILS);

      this.logger.info("Cached room details", { roomCacheKey });
      return true;
    } catch (error) {
      this.logger.warn("Failed to cache room details:", error.message);
      return false;
    }
  }

  /**
   * Log an API call to the database
   */
  async logApiCall({
    supplierCode,
    endpoint,
    requestPayload,
    responsePayload,
    responseTimeMs,
    cacheHit = false,
    traceId,
    searchHash,
    checkInDate,
    checkOutDate,
    cityId,
    countryCode,
    nationality,
    numRooms,
    totalGuests,
    success,
    httpStatusCode,
    errorMessage,
    errorCode,
  }) {
    try {
      const query = `
        INSERT INTO public.hotel_supplier_api_logs (
          supplier_code,
          endpoint,
          request_payload,
          response_payload,
          response_time_ms,
          cache_hit,
          trace_id,
          search_hash,
          check_in_date,
          check_out_date,
          city_id,
          country_code,
          nationality,
          num_rooms,
          total_guests,
          success,
          http_status_code,
          error_message,
          error_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `;

      const values = [
        supplierCode,
        endpoint,
        JSON.stringify(requestPayload),
        JSON.stringify(responsePayload),
        responseTimeMs,
        cacheHit,
        traceId,
        searchHash,
        checkInDate,
        checkOutDate,
        cityId,
        countryCode,
        nationality,
        numRooms,
        totalGuests,
        success,
        httpStatusCode,
        errorMessage,
        errorCode,
      ];

      const result = await pool.query(query, values);
      const logId = result.rows[0]?.id;

      this.logger.info("Logged API call", {
        logId,
        supplier: supplierCode,
        cacheHit,
        traceId,
        success,
      });

      return logId;
    } catch (error) {
      this.logger.error("Failed to log API call:", error.message);
      return null;
    }
  }

  /**
   * Wrap a hotel search function with caching and logging
   */
  async executeHotelSearch({
    supplierCode,
    endpoint,
    searchParams,
    searchFunction,
    requestPayload,
  }) {
    const traceId = uuidv4();
    const searchHash = this.generateSearchHash(searchParams);
    const startTime = Date.now();

    this.logger.info("Starting hotel search", {
      traceId,
      supplier: supplierCode,
      searchHash,
      endpoint,
    });

    try {
      // Normalize rooms for logging purposes
      let normalizedRooms = [];
      const rooms = searchParams.rooms;
      if (typeof rooms === "string") {
        const numRooms = parseInt(rooms) || 1;
        for (let i = 0; i < numRooms; i++) {
          normalizedRooms.push({
            adults: parseInt(searchParams.adults) || 2,
            children: parseInt(searchParams.children) || 0,
            childAges: Array.isArray(searchParams.childAges)
              ? searchParams.childAges
              : [],
          });
        }
      } else if (Array.isArray(rooms)) {
        normalizedRooms = rooms;
      } else {
        normalizedRooms = [
          {
            adults: parseInt(searchParams.adults) || 2,
            children: parseInt(searchParams.children) || 0,
            childAges: Array.isArray(searchParams.childAges)
              ? searchParams.childAges
              : [],
          },
        ];
      }

      const numRooms = normalizedRooms.length;
      const totalGuests = normalizedRooms.reduce(
        (sum, r) => sum + (r.adults || 0) + (r.children || 0),
        0,
      );

      // Step 1: Try to get from cache
      const cached = await this.getCachedSearchResults(searchHash);
      if (cached) {
        // Log cache hit
        await this.logApiCall({
          supplierCode,
          endpoint,
          requestPayload,
          responsePayload: null,
          responseTimeMs: Date.now() - startTime,
          cacheHit: true,
          traceId,
          searchHash,
          checkInDate: searchParams.checkInDate || searchParams.checkIn,
          checkOutDate: searchParams.checkOutDate || searchParams.checkOut,
          cityId: searchParams.cityId,
          countryCode: searchParams.countryCode,
          nationality: searchParams.nationality,
          numRooms,
          totalGuests,
          success: true,
          httpStatusCode: 200,
        });

        return {
          ...cached,
          traceId,
          searchHash,
        };
      }

      // Step 2: Check if request is already in progress (coalescing)
      const pendingPromise = this.getOrCreatePendingRequest(searchHash);

      // If we just created the pending request, execute the search
      const pending = this.ongoingRequests.get(searchHash);
      if (
        pending &&
        pending.promise === pendingPromise &&
        pending.startTime === pending.startTime
      ) {
        // This is the first request, proceed with execution
        try {
          const responsePayload = await searchFunction();
          const responseTimeMs = Date.now() - startTime;

          // Step 3: Cache the results
          await this.cacheSearchResults(searchHash, responsePayload);

          // Step 4: Log successful call
          await this.logApiCall({
            supplierCode,
            endpoint,
            requestPayload,
            responsePayload,
            responseTimeMs,
            cacheHit: false,
            traceId,
            searchHash,
            checkInDate: searchParams.checkInDate,
            checkOutDate: searchParams.checkOutDate,
            cityId: searchParams.cityId,
            countryCode: searchParams.countryCode,
            nationality: searchParams.nationality,
            numRooms: searchParams.rooms?.length || 0,
            totalGuests: searchParams.rooms?.reduce(
              (sum, r) => sum + (r.adults || 0) + (r.children || 0),
              0,
            ),
            success: true,
            httpStatusCode: 200,
          });

          // Resolve all waiting requests
          this.completePendingRequest(searchHash, {
            results: responsePayload,
            cacheHit: false,
            traceId,
            searchHash,
          });

          return {
            results: responsePayload,
            cacheHit: false,
            traceId,
            searchHash,
          };
        } catch (error) {
          const responseTimeMs = Date.now() - startTime;

          // Log failed call
          await this.logApiCall({
            supplierCode,
            endpoint,
            requestPayload,
            responsePayload: null,
            responseTimeMs,
            cacheHit: false,
            traceId,
            searchHash,
            checkInDate: searchParams.checkInDate || searchParams.checkIn,
            checkOutDate: searchParams.checkOutDate || searchParams.checkOut,
            cityId: searchParams.cityId,
            countryCode: searchParams.countryCode,
            nationality: searchParams.nationality,
            numRooms,
            totalGuests,
            success: false,
            httpStatusCode: error.response?.status || 500,
            errorMessage: error.message,
            errorCode: error.code,
          });

          // Reject all waiting requests
          this.failPendingRequest(searchHash, error);
          throw error;
        }
      } else {
        // This is a coalesced request, wait for the first one to complete
        const coalesced = await pendingPromise;
        this.logger.info("Coalesced request completed", {
          traceId,
          searchHash,
        });
        return { ...coalesced, traceId };
      }
    } catch (error) {
      this.logger.error("Hotel search failed", {
        traceId,
        supplier: supplierCode,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Wrap a room details function with caching and logging
   */
  async executeRoomDetailsCall({
    supplierCode,
    endpoint,
    hotelCode,
    roomKey,
    checkInDate,
    checkOutDate,
    roomFunction,
    requestPayload,
  }) {
    const traceId = uuidv4();
    const roomCacheKey = this.generateRoomKey(
      hotelCode,
      roomKey,
      checkInDate,
      checkOutDate,
    );
    const startTime = Date.now();

    this.logger.info("Starting room details call", {
      traceId,
      supplier: supplierCode,
      roomCacheKey,
    });

    try {
      // Step 1: Try to get from cache
      const cached = await this.getCachedRoomDetails(roomCacheKey);
      if (cached) {
        // Log cache hit
        await this.logApiCall({
          supplierCode,
          endpoint,
          requestPayload,
          responsePayload: null,
          responseTimeMs: Date.now() - startTime,
          cacheHit: true,
          traceId,
          checkInDate,
          checkOutDate,
          success: true,
          httpStatusCode: 200,
        });

        return {
          ...cached,
          traceId,
        };
      }

      // Step 2: Execute the room call
      const responsePayload = await roomFunction();
      const responseTimeMs = Date.now() - startTime;

      // Step 3: Cache the results
      await this.cacheRoomDetails(roomCacheKey, responsePayload);

      // Step 4: Log successful call
      await this.logApiCall({
        supplierCode,
        endpoint,
        requestPayload,
        responsePayload,
        responseTimeMs,
        cacheHit: false,
        traceId,
        checkInDate,
        checkOutDate,
        success: true,
        httpStatusCode: 200,
      });

      return {
        roomDetails: responsePayload,
        cacheHit: false,
        traceId,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      // Log failed call
      await this.logApiCall({
        supplierCode,
        endpoint,
        requestPayload,
        responsePayload: null,
        responseTimeMs,
        cacheHit: false,
        traceId,
        checkInDate,
        checkOutDate,
        success: false,
        httpStatusCode: error.response?.status || 500,
        errorMessage: error.message,
        errorCode: error.code,
      });

      this.logger.error("Room details call failed", {
        traceId,
        supplier: supplierCode,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Get performance metrics for a supplier
   */
  async getSupplierMetrics(supplierCode, days = 7) {
    try {
      const query = `
        SELECT 
          supplier_code,
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE success = TRUE) as successful_requests,
          COUNT(*) FILTER (WHERE success = FALSE) as failed_requests,
          COUNT(*) FILTER (WHERE cache_hit = TRUE) as cache_hits,
          ROUND(100.0 * COUNT(*) FILTER (WHERE cache_hit = TRUE) / COUNT(*), 2) as cache_hit_rate,
          ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
          MAX(response_time_ms) as max_response_time_ms,
          MIN(response_time_ms) as min_response_time_ms
        FROM public.hotel_supplier_api_logs
        WHERE supplier_code = $1 
          AND request_timestamp >= NOW() - INTERVAL '1 day' * $2
        GROUP BY supplier_code
      `;

      const result = await pool.query(query, [supplierCode, days]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error("Failed to get supplier metrics:", error.message);
      return null;
    }
  }

  /**
   * Clear in-memory coalescing requests (for cleanup/debugging)
   */
  clearCoalescingRequests() {
    const count = this.ongoingRequests.size;
    this.ongoingRequests.clear();
    this.logger.info(`Cleared ${count} coalescing requests`);
    return count;
  }
}

// Export singleton instance
module.exports = new HotelApiCachingService();
