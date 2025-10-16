/**
 * RateHawk (WorldOTA) Supplier Adapter
 * Integrates with RateHawk API for hotel data
 * API Docs: https://worldota.net/documentation/
 */

const BaseSupplierAdapter = require("./baseSupplierAdapter");
const axios = require("axios");
const pool = require("../../database/connection");
const HotelNormalizer = require("../normalization/hotelNormalizer");
const HotelDedupAndMergeUnified = require("../merging/hotelDedupAndMergeUnified");

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

    // Cache for resolved region identifiers
    this.regionCache = new Map();
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
        destinationCode,
        destinationName,
        rawDestination,
        checkIn,
        checkOut,
        rooms = [{ adults: 2, children: 0 }],
        currency = "USD",
        language = "en",
        maxResults = 20,
        regionId,
        hotelIds,
      } = searchParams;

      const cacheKey = JSON.stringify({
        destination: destination || destinationCode || destinationName || rawDestination,
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

      await this.checkRateLimit("search_serp_hotels");

      const occupancy = rooms.map((room) => ({
        adults: room.adults,
        children:
          room.children > 0 && room.childAges
            ? room.childAges.map((age) => parseInt(age))
            : [],
      }));

      const languageCode = typeof language === "string" ? language : "en";

      let resolvedRegionId = this.normalizeRegionId(regionId);
      if (!resolvedRegionId) {
        const candidates = [
          destination,
          destinationCode,
          destinationName,
          rawDestination,
        ];

        for (const candidate of candidates) {
          const candidateRegionId = await this.resolveRegionId(
            candidate,
            languageCode,
          );
          if (candidateRegionId) {
            resolvedRegionId = candidateRegionId;
            break;
          }
        }
      }

      if (!resolvedRegionId) {
        this.logger.warn("RateHawk region ID could not be resolved", {
          destination,
          destinationCode,
          destinationName,
        });
        return [];
      }

      const requestPayload = {
        checkin: checkIn,
        checkout: checkOut,
        residency: "in",
        language: languageCode,
        guests: occupancy,
        region_id: resolvedRegionId,
        currency: currency,
      };

      if (hotelIds && Array.isArray(hotelIds) && hotelIds.length > 0) {
        requestPayload.ids = hotelIds;
      }

      this.logger.info("Searching RateHawk hotels", {
        destination,
        destinationCode,
        destinationName,
        resolvedRegionId,
        checkIn,
        checkOut,
        rooms: rooms.length,
        payload: requestPayload,
      });

      let response;
      try {
        response = await this.executeWithRetry(async () => {
          try {
            const endpoint = hotelIds && hotelIds.length > 0
              ? "search/serp/hotels/"
              : "search/serp/region/";

            const axiosResponse = await this.httpClient.post(
              endpoint,
              requestPayload,
            );
            return axiosResponse;
          } catch (axiosError) {
            this.logger.error("RateHawk API error", {
              status: axiosError.response?.status,
              statusText: axiosError.response?.statusText,
              errorData: axiosError.response?.data,
              requestPayload,
            });
            throw axiosError;
          }
        });
      } catch (error) {
        this.logger.error("RateHawk search failed after retries", {
          error: error.message,
          payload: requestPayload,
        });
        return [];
      }

      if (!response || !response.data) {
        this.logger.warn("RateHawk returned invalid response structure");
        return [];
      }

      if (response.data.status !== "ok") {
        const message =
          response.data.error?.message ||
          response.data.error ||
          "Unknown error";
        this.logger.error(`RateHawk search failed: ${message}`, {
          responseData: response.data,
        });
        return [];
      }

      const hotels = response.data.data?.hotels || [];
      const responseRooms = response.data.data?.rooms || [];

      this.logger.info(`RateHawk returned ${hotels.length} hotels and ${responseRooms.length} room offers`);

      const normalizedHotels = hotels
        .slice(0, maxResults)
        .map((hotel) => this.transformRateHawkHotel(hotel, checkIn, checkOut));

      this.searchCache.set(cacheKey, {
        results: normalizedHotels,
        timestamp: Date.now(),
      });

      if (this.searchCache.size > 100) {
        const oldestKeys = Array.from(this.searchCache.keys()).slice(0, 50);
        oldestKeys.forEach((key) => this.searchCache.delete(key));
      }

      await this.storeProductsAndSnapshots(normalizedHotels, "hotel");

      // Phase 1: Persist to master schema in parallel (non-blocking)
      try {
        await this.persistToMasterSchema(hotels, responseRooms, {
          checkin: checkIn,
          checkout: checkOut,
          adults: rooms[0]?.adults || 2,
          children: rooms[0]?.children || 0,
          currency,
        });
      } catch (error) {
        this.logger.warn("Error persisting to master schema (non-blocking)", {
          error: error.message,
        });
      }

      return normalizedHotels;
    });
  }

  normalizeRegionId(value) {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const parsed = Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  createRegionCacheKey(candidate, language) {
    return `${(language || "en").toLowerCase()}|${String(candidate)
      .trim()
      .toLowerCase()}`;
  }

  async resolveRegionId(candidate, language = "en") {
    if (candidate === null || candidate === undefined) {
      return null;
    }

    const numericCandidate = this.normalizeRegionId(candidate);
    if (numericCandidate) {
      return numericCandidate;
    }

    const candidateString = String(candidate).trim();
    if (!candidateString) {
      return null;
    }

    const cacheKey = this.createRegionCacheKey(candidateString, language);
    if (this.regionCache.has(cacheKey)) {
      return this.regionCache.get(cacheKey);
    }

    try {
      const regions = await this.searchRegions(candidateString, language);
      if (!Array.isArray(regions) || regions.length === 0) {
        return null;
      }

      const normalizedCandidate = candidateString.toLowerCase();

      const matchByCode = regions.find((region) => {
        const codes = [
          region.code,
          region.iata,
          region.city_code,
          region.city_iata,
          region.country_code,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return codes.includes(normalizedCandidate);
      });

      const matchByName = regions.find((region) =>
        region.name
          ? String(region.name).toLowerCase().includes(normalizedCandidate)
          : false,
      );

      const selected = matchByCode || matchByName || regions[0];
      const regionId = this.normalizeRegionId(selected?.id);

      if (regionId) {
        this.regionCache.set(cacheKey, regionId);
        return regionId;
      }
    } catch (error) {
      this.logger.warn("Failed to resolve RateHawk region ID", {
        candidate: candidateString,
        error: error.message,
      });
    }

    return null;
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
   * Search regions for autocomplete using multicomplete endpoint
   */
  async searchRegions(query, language = "en") {
    await this.checkRateLimit("search_serp_region");

    try {
      const response = await this.httpClient.post("search/multicomplete/", {
        query,
        language,
      });

      if (response.data.status !== "ok") {
        this.logger.warn("RateHawk region search returned non-ok status", {
          query,
          language,
          status: response.data.status,
          error: response.data.error,
        });
        return [];
      }

      const regions = response.data.data?.regions || [];

      return Array.isArray(regions) ? regions : [];
    } catch (error) {
      this.logger.warn("RateHawk region search failed", {
        query,
        language,
        status: error.response?.status,
        error: error.message,
        details: error.response?.data?.error || error.response?.data,
      });
      return [];
    }
  }

  /**
   * Normalize and persist RateHawk results to master hotel schema
   * Phase 1: Write to both old and new tables in parallel
   */
  async persistToMasterSchema(hotels, rooms, searchContext = {}) {
    try {
      if (!hotels || hotels.length === 0) {
        return { hotelsInserted: 0, offersInserted: 0 };
      }

      // Normalize hotels and rooms to TBO-based schema
      const normalizedHotels = hotels.map((hotel) =>
        HotelNormalizer.normalizeRateHawkHotel(hotel, "RATEHAWK"),
      );

      const normalizedOffers = [];
      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        const hotelId = room.hotel_id || hotels[i]?.id;
        const hotel = normalizedHotels.find(
          (h) =>
            h &&
            h.supplierMapData.supplier_hotel_id === hotelId,
        );

        if (hotel) {
          const offer = HotelNormalizer.normalizeRateHawkRoomOffer(
            room,
            hotel.hotelMasterData.property_id,
            "RATEHAWK",
            searchContext,
          );
          if (offer) {
            offer.supplier_hotel_id = hotelId;
            normalizedOffers.push(offer);
          }
        }
      }

      // Merge into master tables with dedup logic
      const mergeResult = await HotelDedupAndMerge.mergeNormalizedResults(
        normalizedHotels.map((h) => h.hotelMasterData),
        normalizedOffers,
        "RATEHAWK",
      );

      this.logger.info("Persisted RateHawk results to master schema", {
        hotelsInserted: mergeResult.hotelsInserted,
        offersInserted: mergeResult.offersInserted,
      });

      return mergeResult;
    } catch (error) {
      this.logger.error("Error persisting to master schema", {
        error: error.message,
      });
      return { hotelsInserted: 0, offersInserted: 0, error: error.message };
    }
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
