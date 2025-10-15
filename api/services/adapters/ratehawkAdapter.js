/**
 * RateHawk (WorldOTA) Supplier Adapter
 * Integrates with RateHawk API for hotel data
 * API Docs: https://worldota.net/documentation/
 */

const BaseSupplierAdapter = require("./baseSupplierAdapter");
const axios = require("axios");
const pool = require("../../database/connection");

class RateHawkAdapter extends BaseSupplierAdapter {
  constructor(config = {}) {
    super("RATEHAWK", {
      baseUrl:
        process.env.RATEHAWK_BASE_URL || "https://api.worldota.net/api/b2b/v3/",
      keyId: process.env.RATEHAWK_API_ID || "3635",
      apiKey:
        process.env.RATEHAWK_API_KEY || "d020d57a-b31d-4696-bc9a-3b90dc84239f",
      requestsPerSecond: 2.5, // 150/60s = 2.5/s for SERP
      timeout: parseInt(process.env.RATEHAWK_TIMEOUT_MS || "30000"),
      ...config,
    });

    // Create HTTP client with Basic Auth
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: this.createBasicAuth(),
      },
    });

    // Rate limiters per endpoint
    this.rateLimiters = {
      search_serp_hotels: { max: 150, window: 60000, requests: [] },
      search_serp_region: { max: 10, window: 60000, requests: [] },
      search_serp_geo: { max: 10, window: 60000, requests: [] },
      hotel_static: { max: 100, window: 86400000, requests: [] },
      hotel_info: { max: 100, window: 86400000, requests: [] },
    };

    // Short-TTL cache for identical queries
    this.searchCache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  /**
   * Create Basic Authentication header
   */
  createBasicAuth() {
    const credentials = `${this.config.keyId}:${this.config.apiKey}`;
    const encoded = Buffer.from(credentials).toString("base64");
    return `Basic ${encoded}`;
  }

  /**
   * Rate limiter with per-endpoint buckets
   */
  async checkRateLimit(endpoint) {
    const limiter = this.rateLimiters[endpoint];
    if (!limiter) return true;

    const now = Date.now();
    const windowStart = now - limiter.window;

    // Remove old requests outside window
    limiter.requests = limiter.requests.filter((time) => time > windowStart);

    // Check if we're at limit
    if (limiter.requests.length >= limiter.max) {
      const oldestRequest = limiter.requests[0];
      const waitTime = oldestRequest + limiter.window - now;

      this.logger.warn(
        `Rate limit reached for ${endpoint}, waiting ${waitTime}ms`,
      );

      // Wait with jitter
      const jitter = Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime + jitter));

      return this.checkRateLimit(endpoint); // Retry after wait
    }

    // Record this request
    limiter.requests.push(now);
    return true;
  }

  /**
   * Search hotels using RateHawk SERP API
   */
  async searchHotels(searchParams) {
    return await this.executeWithRetry(async () => {
      const {
        destination,
        checkIn,
        checkOut,
        rooms = [{ adults: 2, children: 0 }],
        currency = "USD",
        language = "en",
        maxResults = 20,
        regionId,
        hotelIds,
      } = searchParams;

      // Check cache first
      const cacheKey = JSON.stringify({
        destination,
        checkIn,
        checkOut,
        rooms,
        currency,
      });

      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        this.logger.info("Returning cached RateHawk results");
        return cached.results;
      }

      // Check rate limit
      await this.checkRateLimit("search_serp_hotels");

      // Build occupancy array
      const occupancy = rooms.map((room, index) => ({
        adults: room.adults,
        children:
          room.children > 0 && room.childAges
            ? room.childAges.map((age) => parseInt(age))
            : [],
      }));

      // Build request payload
      const requestPayload = {
        checkin: checkIn,
        checkout: checkOut,
        residency: "in", // Guest residency (adjust based on user)
        language: language,
        guests: occupancy,
        region_id: regionId || parseInt(destination) || null,
        ids: hotelIds || null,
        currency: currency,
      };

      this.logger.info("Searching RateHawk hotels", {
        destination,
        checkIn,
        checkOut,
        rooms: rooms.length,
      });

      const response = await this.executeWithRetry(async () => {
        return await this.httpClient.post(
          "search/serp/hotels/",
          requestPayload,
        );
      });

      if (response.data.status !== "ok") {
        throw new Error(
          `RateHawk search failed: ${response.data.error || "Unknown error"}`,
        );
      }

      const hotels = response.data.data?.hotels || [];

      this.logger.info(`RateHawk returned ${hotels.length} hotels`);

      // Transform to our standard format
      const normalizedHotels = hotels
        .slice(0, maxResults)
        .map((hotel) => this.transformRateHawkHotel(hotel, checkIn, checkOut));

      // Cache results
      this.searchCache.set(cacheKey, {
        results: normalizedHotels,
        timestamp: Date.now(),
      });

      // Clean old cache entries
      if (this.searchCache.size > 100) {
        const oldestKeys = Array.from(this.searchCache.keys()).slice(0, 50);
        oldestKeys.forEach((key) => this.searchCache.delete(key));
      }

      // Store in repository
      await this.storeProductsAndSnapshots(normalizedHotels, "hotel");

      return normalizedHotels;
    });
  }

  /**
   * Get hotel details
   */
  async getHotelDetails(hotelId) {
    return await this.executeWithRetry(async () => {
      await this.checkRateLimit("hotel_info");

      const response = await this.httpClient.get(`hotel/info/`, {
        params: {
          hotel_id: hotelId,
          language: "en",
        },
      });

      if (response.data.status !== "ok") {
        throw new Error(
          `RateHawk hotel details failed: ${response.data.error || "Unknown error"}`,
        );
      }

      return response.data.data;
    });
  }

  /**
   * Get hotel static data (for content sync)
   */
  async getHotelStatic(limit = 1000, offset = 0) {
    await this.checkRateLimit("hotel_static");

    const response = await this.httpClient.get("hotel/static/", {
      params: {
        limit,
        offset,
      },
    });

    if (response.data.status !== "ok") {
      throw new Error(
        `RateHawk static data failed: ${response.data.error || "Unknown error"}`,
      );
    }

    return response.data.data || [];
  }

  /**
   * Search regions for autocomplete
   */
  async searchRegions(query, language = "en") {
    await this.checkRateLimit("search_serp_region");

    const response = await this.executeWithRetry(async () => {
      return await this.httpClient.get("search/serp/region/", {
        params: {
          query,
          language,
        },
      });
    });

    if (response.data.status !== "ok") {
      return [];
    }

    return response.data.data?.regions || [];
  }

  /**
   * Get booking form (pre-booking validation)
   */
  async getBookingForm(rateKey, language = "en") {
    return await this.executeWithRetry(async () => {
      const response = await this.httpClient.post("hotel/order/booking/form/", {
        partner_order_id: `faredown_${Date.now()}`,
        book_hash: rateKey,
        language,
      });

      if (response.data.status !== "ok") {
        throw new Error(
          `RateHawk booking form failed: ${response.data.error?.message || "Unknown error"}`,
        );
      }

      return response.data.data;
    });
  }

  /**
   * Book hotel through RateHawk
   */
  async bookHotel(bookingData) {
    return await this.executeWithRetry(async () => {
      const {
        rateKey,
        partnerOrderId,
        language = "en",
        user,
        guests,
      } = bookingData;

      // Build guest data
      const guestData = guests.map((guest, index) => ({
        first_name: guest.firstName,
        last_name: guest.lastName,
        is_child: guest.type === "child",
      }));

      const finishPayload = {
        partner_order_id: partnerOrderId,
        book_hash: rateKey,
        language,
        user: {
          email: user.email,
          phone: user.phone,
        },
        hotel_data: {
          guests: guestData,
        },
      };

      this.logger.info("Booking hotel with RateHawk", {
        partnerOrderId,
        guestCount: guestData.length,
      });

      const response = await this.httpClient.post(
        "hotel/order/booking/finish/",
        finishPayload,
      );

      if (response.data.status !== "ok") {
        throw new Error(
          `RateHawk booking failed: ${response.data.error?.message || "Unknown error"}`,
        );
      }

      const orderData = response.data.data;

      this.logger.info("RateHawk booking successful", {
        orderId: orderData.order_id,
        status: orderData.status,
      });

      return {
        success: true,
        orderId: orderData.order_id,
        partnerOrderId: partnerOrderId,
        status: orderData.status,
        supplier: "RATEHAWK",
        bookingData: orderData,
      };
    });
  }

  /**
   * Get booking status
   */
  async getBookingStatus(orderId) {
    return await this.executeWithRetry(async () => {
      const response = await this.httpClient.post(
        "hotel/order/booking/finish/status/",
        {
          order_id: orderId,
        },
      );

      if (response.data.status !== "ok") {
        throw new Error(
          `RateHawk status check failed: ${response.data.error?.message || "Unknown error"}`,
        );
      }

      return response.data.data;
    });
  }

  /**
   * Get order info
   */
  async getOrderInfo(orderId, language = "en") {
    return await this.executeWithRetry(async () => {
      const response = await this.httpClient.post("hotel/order/info/", {
        order_id: orderId,
        language,
      });

      if (response.data.status !== "ok") {
        throw new Error(
          `RateHawk order info failed: ${response.data.error?.message || "Unknown error"}`,
        );
      }

      return response.data.data;
    });
  }

  /**
   * Cancel booking
   */
  async cancelBooking(orderId) {
    return await this.executeWithRetry(async () => {
      const response = await this.httpClient.post("hotel/order/cancel/", {
        order_id: orderId,
      });

      if (response.data.status !== "ok") {
        throw new Error(
          `RateHawk cancellation failed: ${response.data.error?.message || "Unknown error"}`,
        );
      }

      this.logger.info("RateHawk cancellation successful", { orderId });

      return {
        success: true,
        orderId: orderId,
        status: "cancelled",
        supplier: "RATEHAWK",
        cancellationData: response.data.data,
      };
    });
  }

  /**
   * Download voucher
   */
  async downloadVoucher(orderId) {
    return await this.executeWithRetry(async () => {
      const response = await this.httpClient.post(
        "hotel/order/document/voucher/download/",
        {
          order_id: orderId,
        },
        {
          responseType: "arraybuffer",
        },
      );

      return {
        data: response.data,
        contentType: response.headers["content-type"],
        fileName: `voucher_${orderId}.pdf`,
      };
    });
  }

  /**
   * Download invoice
   */
  async downloadInvoice(orderId) {
    return await this.executeWithRetry(async () => {
      const response = await this.httpClient.post(
        "hotel/order/document/info_invoice/download/",
        {
          order_id: orderId,
        },
        {
          responseType: "arraybuffer",
        },
      );

      return {
        data: response.data,
        contentType: response.headers["content-type"],
        fileName: `invoice_${orderId}.pdf`,
      };
    });
  }

  /**
   * Transform RateHawk hotel to standard format
   */
  transformRateHawkHotel(hotel, checkIn, checkOut) {
    try {
      // Extract first rate for basic pricing
      const rates = hotel.rates || [];
      const firstRate = rates[0] || {};

      return {
        id: `rh_${hotel.id}`,
        hotelId: hotel.id.toString(),
        name: hotel.name || "Unknown Hotel",
        destination: hotel.region?.name || "",
        destinationCode: hotel.region?.id?.toString() || "",
        location: {
          latitude: hotel.location?.coordinates?.lat,
          longitude: hotel.location?.coordinates?.lon,
          address: hotel.address || "",
        },
        starRating: hotel.star_rating || 0,
        images: (hotel.images || []).map((img) => ({
          url: img.url,
          thumbnail: img.thumbnail_url || img.url,
        })),
        price: {
          amount: firstRate.payment_options?.payment_types?.[0]?.amount || 0,
          currency:
            firstRate.payment_options?.payment_types?.[0]?.currency_code ||
            "USD",
          originalAmount:
            firstRate.payment_options?.payment_types?.[0]?.amount || 0,
        },
        rates: rates.map((rate) => ({
          rateKey: rate.book_hash,
          roomType: rate.room_name || "Standard Room",
          boardType: rate.meal || "Room Only",
          cancellationPolicy:
            rate.payment_options?.cancellation_penalties || [],
          isRefundable: !rate.payment_options?.cancellation_penalties?.some(
            (p) => p.amount > 0,
          ),
          price: rate.payment_options?.payment_types?.[0]?.amount || 0,
          currency:
            rate.payment_options?.payment_types?.[0]?.currency_code || "USD",
        })),
        checkIn,
        checkOut,
        amenities:
          hotel.amenity_groups?.flatMap((g) => g.amenities || []) || [],
        description:
          hotel.description_struct
            ?.map((d) => d.paragraphs?.join(" "))
            .join("\n") || "",
        supplier: "RATEHAWK",
        supplierHotelId: hotel.id.toString(),
        supplierCode: "ratehawk",
      };
    } catch (error) {
      this.logger.error("Failed to transform RateHawk hotel:", {
        message: error.message,
        hotelId: hotel?.id,
      });
      throw new Error(error.message || "Failed to transform hotel data");
    }
  }

  /**
   * Flight search not supported
   */
  async searchFlights(searchParams) {
    this.logger.warn("Flight search not supported by RateHawk adapter");
    return [];
  }

  /**
   * Sightseeing not supported
   */
  async searchSightseeing(searchParams) {
    this.logger.warn("Sightseeing search not supported by RateHawk adapter");
    return [];
  }

  /**
   * Health check
   */
  async performHealthCheck() {
    try {
      // Try a simple region search
      const regions = await this.searchRegions("Dubai", "en");

      return {
        healthy: true,
        supplier: "RATEHAWK",
        regionsAvailable: regions.length,
        rateLimiterState: Object.keys(this.rateLimiters).reduce((acc, key) => {
          acc[key] = {
            current: this.rateLimiters[key].requests.length,
            max: this.rateLimiters[key].max,
          };
          return acc;
        }, {}),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("RateHawk health check failed:", {
        message: error.message,
        code: error.code,
      });
      return {
        healthy: false,
        supplier: "RATEHAWK",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = RateHawkAdapter;
