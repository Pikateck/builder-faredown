/**
 * Third Party API Logger Service
 * Logs all requests and responses from third-party suppliers (TBO, Hotelbeds, Amadeus, etc.)
 * for debugging, audit, and monitoring purposes
 */

const pool = require("../database/connection");
const { v4: uuidv4 } = require("uuid");

class ThirdPartyLogger {
  constructor() {
    this.enabled = process.env.ENABLE_API_LOGGING !== "false"; // Enabled by default
    this.logLevel = process.env.API_LOG_LEVEL || "all"; // all, errors-only, none
    this.sensitiveFields = [
      "password",
      "api_key",
      "api_secret",
      "token",
      "authorization",
      "clientId",
      "ClientId",
      "Password",
      "TokenId",
      "apiKey",
      "apiSecret",
    ];
  }

  /**
   * Sanitize sensitive data from payloads and headers
   */
  sanitize(data) {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const [key, value] of Object.entries(sanitized)) {
      // Check if key is sensitive
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveFields.some((field) =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive && typeof value === "string") {
        // Mask sensitive data
        sanitized[key] = value.length > 4 
          ? `${value.substring(0, 2)}***${value.substring(value.length - 2)}`
          : "***";
      } else if (typeof value === "object" && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitize(value);
      }
    }

    return sanitized;
  }

  /**
   * Log a third-party API call
   * 
   * @param {Object} params - Logging parameters
   * @param {string} params.supplierName - Name of the supplier (TBO, HOTELBEDS, etc.)
   * @param {string} params.endpoint - API endpoint URL
   * @param {string} params.method - HTTP method (GET, POST, etc.)
   * @param {Object} params.requestPayload - Request body
   * @param {Object} params.requestHeaders - Request headers
   * @param {Object} params.responsePayload - Response body
   * @param {Object} params.responseHeaders - Response headers
   * @param {number} params.statusCode - HTTP status code
   * @param {string} params.errorMessage - Error message if failed
   * @param {string} params.errorStack - Error stack trace
   * @param {Date} params.requestTimestamp - Request start time
   * @param {Date} params.responseTimestamp - Response received time
   * @param {string} params.traceId - Trace ID for correlation
   * @param {string} params.correlationId - Business correlation ID
   */
  async log({
    supplierName,
    endpoint,
    method = "POST",
    requestPayload,
    requestHeaders,
    responsePayload,
    responseHeaders,
    statusCode,
    errorMessage,
    errorStack,
    requestTimestamp = new Date(),
    responseTimestamp = new Date(),
    traceId,
    correlationId,
  }) {
    // Skip if logging is disabled
    if (!this.enabled || this.logLevel === "none") {
      return;
    }

    // Skip successful requests if log level is errors-only
    if (this.logLevel === "errors-only" && statusCode < 400 && !errorMessage) {
      return;
    }

    try {
      // Calculate duration
      const durationMs = responseTimestamp
        ? responseTimestamp.getTime() - requestTimestamp.getTime()
        : null;

      // Sanitize sensitive data
      const sanitizedRequestPayload = this.sanitize(requestPayload);
      const sanitizedRequestHeaders = this.sanitize(requestHeaders);
      const sanitizedResponsePayload = this.sanitize(responsePayload);
      const sanitizedResponseHeaders = this.sanitize(responseHeaders);

      // Generate trace ID if not provided
      const finalTraceId = traceId || uuidv4();

      // Insert log into database
      const query = `
        INSERT INTO public.third_party_api_logs (
          supplier_name,
          endpoint,
          method,
          request_payload,
          request_headers,
          response_payload,
          response_headers,
          status_code,
          error_message,
          error_stack,
          request_timestamp,
          response_timestamp,
          duration_ms,
          trace_id,
          correlation_id,
          environment
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
      `;

      const values = [
        supplierName,
        endpoint,
        method,
        JSON.stringify(sanitizedRequestPayload),
        JSON.stringify(sanitizedRequestHeaders),
        JSON.stringify(sanitizedResponsePayload),
        JSON.stringify(sanitizedResponseHeaders),
        statusCode,
        errorMessage,
        errorStack,
        requestTimestamp,
        responseTimestamp,
        durationMs,
        finalTraceId,
        correlationId,
        process.env.NODE_ENV || "production",
      ];

      const result = await pool.query(query, values);

      console.log(`✅ Logged ${supplierName} API call [${finalTraceId}]`, {
        endpoint,
        statusCode,
        durationMs,
        logId: result.rows[0]?.id,
      });

      return result.rows[0]?.id;
    } catch (error) {
      // Don't throw errors from logging - just log to console
      console.error("❌ Failed to log third-party API call:", error.message);
      console.error("Supplier:", supplierName, "Endpoint:", endpoint);
      return null;
    }
  }

  /**
   * Create a request logger that tracks start and end times
   * Returns an object with end() method to log the response
   * 
   * @param {Object} params - Request parameters
   * @returns {Object} Logger object with end() method
   */
  startRequest({ supplierName, endpoint, method, requestPayload, requestHeaders, traceId, correlationId }) {
    const requestTimestamp = new Date();
    const finalTraceId = traceId || uuidv4();

    return {
      traceId: finalTraceId,
      requestTimestamp,

      /**
       * End the request logging
       */
      async end({ responsePayload, responseHeaders, statusCode, errorMessage, errorStack } = {}) {
        const responseTimestamp = new Date();

        return await this.log({
          supplierName,
          endpoint,
          method,
          requestPayload,
          requestHeaders,
          responsePayload,
          responseHeaders,
          statusCode,
          errorMessage,
          errorStack,
          requestTimestamp,
          responseTimestamp,
          traceId: finalTraceId,
          correlationId,
        });
      },
    };
  }

  /**
   * Query logs for a specific supplier
   */
  async getLogsBySupplier(supplierName, limit = 100) {
    try {
      const query = `
        SELECT * FROM public.third_party_api_logs 
        WHERE supplier_name = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      const result = await pool.query(query, [supplierName, limit]);
      return result.rows;
    } catch (error) {
      console.error("❌ Failed to fetch logs:", error.message);
      return [];
    }
  }

  /**
   * Query logs by trace ID
   */
  async getLogsByTraceId(traceId) {
    try {
      const query = `
        SELECT * FROM public.third_party_api_logs 
        WHERE trace_id = $1 
        ORDER BY created_at ASC
      `;
      const result = await pool.query(query, [traceId]);
      return result.rows;
    } catch (error) {
      console.error("❌ Failed to fetch logs by trace ID:", error.message);
      return [];
    }
  }

  /**
   * Query error logs
   */
  async getErrorLogs(supplierName = null, limit = 100) {
    try {
      let query = `
        SELECT * FROM public.third_party_api_logs 
        WHERE error_message IS NOT NULL
      `;
      const params = [];

      if (supplierName) {
        params.push(supplierName);
        query += ` AND supplier_name = $${params.length}`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("❌ Failed to fetch error logs:", error.message);
      return [];
    }
  }

  /**
   * Get statistics for a supplier
   */
  async getSupplierStats(supplierName, fromDate = null) {
    try {
      let query = `
        SELECT 
          supplier_name,
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful_requests,
          COUNT(*) FILTER (WHERE status_code >= 400) as failed_requests,
          COUNT(*) FILTER (WHERE error_message IS NOT NULL) as error_requests,
          AVG(duration_ms) as avg_duration_ms,
          MAX(duration_ms) as max_duration_ms,
          MIN(duration_ms) as min_duration_ms
        FROM public.third_party_api_logs
        WHERE supplier_name = $1
      `;
      const params = [supplierName];

      if (fromDate) {
        params.push(fromDate);
        query += ` AND created_at >= $${params.length}`;
      }

      query += ` GROUP BY supplier_name`;

      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error("❌ Failed to fetch supplier stats:", error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new ThirdPartyLogger();
