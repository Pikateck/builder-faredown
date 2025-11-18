/**
 * Supplier Adapter Manager
 * Orchestrates multiple supplier adapters and provides unified interface
 */

const AmadeusAdapter = require("./amadeusAdapter");
const TBOAdapter = require("./tboAdapter");
const HotelbedsAdapter = require("./hotelbedsAdapter");
const RateHawkAdapter = require("./ratehawkAdapter");
const redisService = require("../redisService");
const cpoRepository = require("../cpoRepository");
const winston = require("winston");

class SupplierAdapterManager {
  constructor() {
    this.adapters = new Map();
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] [ADAPTER_MANAGER] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
        }),
      ),
      transports: [new winston.transports.Console()],
    });

    this.initializeAdapters();
  }

  /**
   * Initialize all available adapters
   */
  initializeAdapters() {
    try {
      // Initialize Amadeus adapter
      if (process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET) {
        this.adapters.set("AMADEUS", new AmadeusAdapter());
        this.logger.info("Amadeus adapter initialized");
      } else {
        this.logger.warn(
          "Amadeus credentials not found, adapter not initialized",
        );
      }

      // Initialize TBO adapter
      if (
        process.env.TBO_AGENCY_ID ||
        process.env.TBO_API_USER_ID ||
        process.env.TBO_HOTEL_USER_ID
      ) {
        this.adapters.set("TBO", new TBOAdapter());
        this.logger.info("TBO adapter initialized");
      } else {
        this.logger.warn("TBO credentials not found, adapter not initialized");
      }

      // Initialize Hotelbeds adapter
      if (process.env.HOTELBEDS_API_KEY && process.env.HOTELBEDS_SECRET) {
        this.adapters.set("HOTELBEDS", new HotelbedsAdapter());
        this.logger.info("Hotelbeds adapter initialized");
      } else {
        this.logger.warn(
          "Hotelbeds credentials not found, adapter not initialized",
        );
      }

      // Initialize RateHawk adapter
      if (process.env.RATEHAWK_API_ID && process.env.RATEHAWK_API_KEY) {
        this.adapters.set("RATEHAWK", new RateHawkAdapter());
        this.logger.info("RateHawk adapter initialized");
      } else {
        this.logger.warn(
          "RateHawk credentials not found, adapter not initialized",
        );
      }

      this.logger.info(`Initialized ${this.adapters.size} supplier adapters`);
    } catch (error) {
      this.logger.error("Failed to initialize adapters:", error);
    }
  }

  /**
   * Get adapter by supplier code
   */
  getAdapter(supplierCode) {
    return this.adapters.get(supplierCode.toUpperCase());
  }

  /**
   * Get all available adapters
   */
  getAllAdapters() {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters by product type
   */
  getAdaptersByProductType(productType) {
    switch (productType.toLowerCase()) {
      case "flight":
        const flightAdapters = [];
        if (this.adapters.has("AMADEUS")) {
          flightAdapters.push(this.adapters.get("AMADEUS"));
        }
        if (this.adapters.has("TBO")) {
          flightAdapters.push(this.adapters.get("TBO"));
        }
        return flightAdapters;
      case "hotel":
        const hotelAdapters = [];
        if (this.adapters.has("HOTELBEDS")) {
          hotelAdapters.push(this.adapters.get("HOTELBEDS"));
        }
        if (this.adapters.has("RATEHAWK")) {
          hotelAdapters.push(this.adapters.get("RATEHAWK"));
        }
        // Include TBO adapter for hotels when available (adapter implements searchHotels)
        if (this.adapters.has("TBO")) {
          hotelAdapters.push(this.adapters.get("TBO"));
        }
        return hotelAdapters;
      case "sightseeing":
        return this.adapters.has("HOTELBEDS")
          ? [this.adapters.get("HOTELBEDS")]
          : [];
      default:
        return [];
    }
  }

  // ==========================================
  // UNIFIED SEARCH METHODS
  // ==========================================

  /**
   * Search across all flight suppliers
   */
  async searchAllFlights(searchParams, suppliers = ["AMADEUS", "TBO"]) {
    const cached = await this.getCachedSearchResults("flight", searchParams);
    if (cached?.results) {
      this.logger.info("Returning cached flight search results");
      const aggregated = this.aggregateResults(cached.results);
      return { ...aggregated, cacheHit: true };
    }

    const results = await this.executeParallelSearch(
      "flight",
      searchParams,
      suppliers,
    );

    await this.cacheSearchResults("flight", searchParams, results);

    return this.aggregateResults(results);
  }

  /**
   * Search across all hotel suppliers
   */
  async searchAllHotels(searchParams, suppliers = null) {
    const defaultSuppliers = (
      process.env.HOTELS_SUPPLIERS || "HOTELBEDS,RATEHAWK,TBO"
    )
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const supplierList =
      Array.isArray(suppliers) && suppliers.length > 0
        ? suppliers
        : defaultSuppliers;

    const cached = await this.getCachedSearchResults("hotel", searchParams);
    if (cached?.results) {
      this.logger.info("Returning cached hotel search results");
      const aggregated = this.aggregateResults(cached.results);
      return { ...aggregated, cacheHit: true };
    }

    const results = await this.executeParallelSearch(
      "hotel",
      searchParams,
      supplierList,
    );

    await this.cacheSearchResults("hotel", searchParams, results);

    return this.aggregateResults(results);
  }

  /**
   * Search across all sightseeing suppliers
   */
  async searchAllSightseeing(searchParams, suppliers = ["HOTELBEDS"]) {
    const cached = await this.getCachedSearchResults(
      "sightseeing",
      searchParams,
    );
    if (cached?.results) {
      this.logger.info("Returning cached sightseeing search results");
      const aggregated = this.aggregateResults(cached.results);
      return { ...aggregated, cacheHit: true };
    }

    const results = await this.executeParallelSearch(
      "sightseeing",
      searchParams,
      suppliers,
    );

    await this.cacheSearchResults("sightseeing", searchParams, results);

    return this.aggregateResults(results);
  }

  /**
   * Execute parallel search across multiple suppliers
   */
  async executeParallelSearch(productType, searchParams, supplierCodes) {
    const searchPromises = supplierCodes
      .map((code) => this.getAdapter(code))
      .filter((adapter) => adapter !== undefined)
      .map(async (adapter) => {
        try {
          const startTime = Date.now();
          let results;

          switch (productType) {
            case "flight":
              results = await adapter.searchFlights(searchParams);
              break;
            case "hotel":
              results = await adapter.searchHotels(searchParams);
              break;
            case "sightseeing":
              results = await adapter.searchSightseeing(searchParams);
              break;
            default:
              throw new Error(`Unsupported product type: ${productType}`);
          }

          const responseTime = Date.now() - startTime;

          return {
            supplier: adapter.supplierCode,
            success: true,
            results: results,
            responseTime: responseTime,
            resultCount: results.length,
          };
        } catch (error) {
          this.logger.error(
            `Search failed for ${adapter.supplierCode}:`,
            error,
          );
          return {
            supplier: adapter.supplierCode,
            success: false,
            error: error.message,
            results: [],
            responseTime: 0,
            resultCount: 0,
          };
        }
      });

    const results = await Promise.allSettled(searchPromises);

    return results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : {
            supplier: "UNKNOWN",
            success: false,
            error: result.reason?.message || "Unknown error",
            results: [],
            responseTime: 0,
            resultCount: 0,
          },
    );
  }

  /**
   * Aggregate and deduplicate results from multiple suppliers
   */
  aggregateResults(supplierResults) {
    const allResults = [];
    const seenProducts = new Set();
    const supplierMetrics = {};

    for (const supplierResult of supplierResults) {
      supplierMetrics[supplierResult.supplier] = {
        success: supplierResult.success,
        responseTime: supplierResult.responseTime,
        resultCount: supplierResult.resultCount,
        error: supplierResult.error,
      };

      if (supplierResult.success && supplierResult.results) {
        for (const product of supplierResult.results) {
          // Create a deduplication key based on product attributes
          const dedupKey = this.createDeduplicationKey(product);

          if (!seenProducts.has(dedupKey)) {
            seenProducts.add(dedupKey);
            allResults.push({
              ...product,
              supplier: supplierResult.supplier,
              responseTime: supplierResult.responseTime,
            });
          }
        }
      }
    }

    // Sort by price ascending (handle numeric, object, or missing)
    const getNumericPrice = (p) => {
      if (typeof p.price === "number") return p.price;
      if (p && p.price && typeof p.price === "object") {
        const v =
          p.price.amount ??
          p.price.final ??
          p.price.markedUp ??
          p.price.originalAmount;
        if (typeof v === "number") return v;
      }
      if (typeof p.totalPrice === "number") return p.totalPrice;
      if (typeof p.currentPrice === "number") return p.currentPrice;
      return 0;
    };
    allResults.sort((a, b) => getNumericPrice(a) - getNumericPrice(b));

    return {
      products: allResults,
      totalResults: allResults.length,
      supplierMetrics: supplierMetrics,
      searchTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Create deduplication key for products
   */
  createDeduplicationKey(product) {
    if (product.airline && product.origin && product.destination) {
      // Flight product
      return `flight:${product.airline}-${product.origin}-${product.destination}-${product.departureDate}-${product.flightNumber}`;
    } else if (product.hotelId) {
      // Hotel product
      return `hotel:${product.hotelId}-${product.roomCode}-${product.checkIn}-${product.checkOut}`;
    } else if (product.activityCode) {
      // Sightseeing product
      return `activity:${product.activityCode}-${product.location}-${product.activityDate}`;
    } else {
      // Fallback to original ID
      return `unknown:${product.id || product.originalId}`;
    }
  }

  /**
   * Cache search results for performance
   */
  async cacheSearchResults(productType, searchParams, results) {
    try {
      const cacheKey = this.generateSearchCacheKey(productType, searchParams);

      const cacheData = {
        results: results,
        searchParams: searchParams,
        timestamp: new Date().toISOString(),
        ttl: 300, // 5 minutes
      };

      await redisService.set(cacheKey, cacheData, 300);
      this.logger.info(`Search results cached: ${cacheKey}`);
    } catch (error) {
      this.logger.error("Failed to cache search results:", error);
    }
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(productType, searchParams) {
    try {
      const cacheKey = this.generateSearchCacheKey(productType, searchParams);
      return await redisService.get(cacheKey);
    } catch (error) {
      this.logger.error("Failed to get cached search results:", error);
      return null;
    }
  }

  /**
   * Generate cache key for search parameters
   */
  generateSearchCacheKey(productType, searchParams) {
    // Include maxResults so increasing it yields a different cache entry
    const keyParams = { ...searchParams };

    const paramString = JSON.stringify(
      keyParams,
      Object.keys(keyParams).sort(),
    );
    const hash = require("crypto")
      .createHash("md5")
      .update(paramString)
      .digest("hex");

    return `search:${productType}:${hash}`;
  }

  // ==========================================
  // BOOKING METHODS
  // ==========================================

  /**
   * Book product through appropriate supplier
   */
  async bookProduct(productType, supplierCode, bookingData) {
    const adapter = this.getAdapter(supplierCode);
    if (!adapter) {
      throw new Error(`Adapter not found for supplier: ${supplierCode}`);
    }

    try {
      let bookingResult;

      switch (productType.toLowerCase()) {
        case "flight":
          bookingResult = await adapter.bookFlight(bookingData);
          break;
        case "hotel":
          bookingResult = await adapter.bookHotel(bookingData);
          break;
        case "sightseeing":
          bookingResult = await adapter.bookSightseeing(bookingData);
          break;
        default:
          throw new Error(
            `Unsupported product type for booking: ${productType}`,
          );
      }

      this.logger.info(`Booking successful via ${supplierCode}`, {
        productType: productType,
        bookingId: bookingResult.bookingId,
        reference: bookingResult.reference,
      });

      return bookingResult;
    } catch (error) {
      this.logger.error(`Booking failed via ${supplierCode}:`, error);
      throw error;
    }
  }

  // ==========================================
  // SUPPLIER MANAGEMENT
  // ==========================================

  /**
   * Get health status of all adapters
   */
  async getAdapterHealthStatus() {
    const healthChecks = Array.from(this.adapters.values()).map(
      async (adapter) => {
        try {
          return await adapter.healthCheck();
        } catch (error) {
          return {
            supplier: adapter.supplierCode,
            status: "unhealthy",
            error: error.message,
            timestamp: new Date().toISOString(),
          };
        }
      },
    );

    const results = await Promise.allSettled(healthChecks);

    return results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : {
            supplier: "UNKNOWN",
            status: "error",
            error: result.reason?.message || "Health check failed",
            timestamp: new Date().toISOString(),
          },
    );
  }

  /**
   * Get adapter metrics
   */
  getAdapterMetrics() {
    const metrics = {};

    for (const [code, adapter] of this.adapters) {
      metrics[code] = adapter.getMetrics();
    }

    return {
      adapters: metrics,
      totalAdapters: this.adapters.size,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset circuit breaker for specific adapter
   */
  resetAdapterCircuitBreaker(supplierCode) {
    const adapter = this.getAdapter(supplierCode);
    if (adapter) {
      adapter.resetCircuitBreaker();
      this.logger.info(`Circuit breaker reset for ${supplierCode}`);
      return true;
    }
    return false;
  }

  /**
   * Update adapter configuration
   */
  updateAdapterConfig(supplierCode, config) {
    const adapter = this.getAdapter(supplierCode);
    if (adapter) {
      adapter.updateConfig(config);
      this.logger.info(`Configuration updated for ${supplierCode}`, config);
      return true;
    }
    return false;
  }

  /**
   * Refresh supplier rate snapshots for active products
   */
  async refreshSupplierSnapshots(productType = null, limit = 100) {
    try {
      // Get top products to refresh
      const products = await cpoRepository.getTopProducts(productType, limit);

      const refreshResults = {
        total: products.length,
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const product of products) {
        try {
          const adapters = this.getAdaptersByProductType(product.product_type);

          for (const adapter of adapters) {
            // Create a mock search to get fresh pricing
            const searchParams = this.createSearchParamsFromProduct(product);

            switch (product.product_type) {
              case "flight":
                await adapter.searchFlights(searchParams);
                break;
              case "hotel":
                await adapter.searchHotels(searchParams);
                break;
              case "sightseeing":
                await adapter.searchSightseeing(searchParams);
                break;
            }
          }

          refreshResults.success++;
        } catch (error) {
          refreshResults.failed++;
          refreshResults.errors.push({
            canonical_key: product.canonical_key,
            error: error.message,
          });
        }
      }

      this.logger.info("Supplier snapshots refresh completed", refreshResults);
      return refreshResults;
    } catch (error) {
      this.logger.error("Failed to refresh supplier snapshots:", error);
      throw error;
    }
  }

  /**
   * Create search parameters from existing product
   */
  createSearchParamsFromProduct(product) {
    const attrs = product.attrs;

    switch (product.product_type) {
      case "flight":
        return {
          origin: attrs.origin,
          destination: attrs.dest,
          departureDate: attrs.dep_date,
          adults: 1,
          maxResults: 5,
        };
      case "hotel":
        return {
          destination: attrs.city,
          checkIn: attrs.check_in || new Date().toISOString().split("T")[0],
          checkOut:
            attrs.check_out ||
            new Date(Date.now() + 86400000).toISOString().split("T")[0],
          rooms: [
            {
              adults: attrs.guests?.adults || 2,
              children: attrs.guests?.children || 0,
            },
          ],
          maxResults: 5,
        };
      case "sightseeing":
        return {
          destination: attrs.location,
          dateFrom:
            attrs.activity_date || new Date().toISOString().split("T")[0],
          dateTo:
            attrs.activity_date ||
            new Date(Date.now() + 86400000).toISOString().split("T")[0],
          maxResults: 5,
        };
      default:
        return {};
    }
  }
}

// Export singleton instance
const supplierAdapterManager = new SupplierAdapterManager();

module.exports = supplierAdapterManager;
