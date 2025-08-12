/**
 * Hotelbeds Transfers Supplier Adapter
 * Integrates with Hotelbeds Transfers API for transfer booking services
 * Based on https://developer.hotelbeds.com/documentation/transfers/booking-api/overview/
 */

const BaseSupplierAdapter = require("./baseSupplierAdapter");
const axios = require("axios");
const crypto = require("crypto");

class HotelbedsTransfersAdapter extends BaseSupplierAdapter {
  constructor(config = {}) {
    super("HOTELBEDS_TRANSFERS", {
      baseUrl:
        process.env.HOTELBEDS_TRANSFERS_API ||
        "https://api.test.hotelbeds.com/transfers-api/1.0",
      contentUrl:
        process.env.HOTELBEDS_TRANSFERS_CONTENT_API ||
        "https://api.test.hotelbeds.com/transfers-cache-api/1.0",
      apiKey: process.env.HOTELBEDS_API_KEY,
      secret: process.env.HOTELBEDS_SECRET,
      requestsPerSecond: 8, // Hotelbeds rate limits
      timeout: 30000,
      ...config,
    });

    // Initialize HTTP clients
    this.transfersClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "User-Agent": "Faredown-Transfers/1.0",
      },
    });

    this.contentClient = axios.create({
      baseURL: this.config.contentUrl,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "User-Agent": "Faredown-Transfers/1.0",
      },
    });

    // Add authentication interceptors
    this.addAuthInterceptor(this.transfersClient);
    this.addAuthInterceptor(this.contentClient);

    // Add response interceptors for error handling
    this.addResponseInterceptor(this.transfersClient);
    this.addResponseInterceptor(this.contentClient);
  }

  /**
   * Add Hotelbeds authentication to request
   */
  addAuthInterceptor(client) {
    client.interceptors.request.use((config) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = crypto
        .createHash("sha256")
        .update(this.config.apiKey + this.config.secret + timestamp)
        .digest("hex");

      config.headers["Api-key"] = this.config.apiKey;
      config.headers["X-Signature"] = signature;

      this.logger.debug("Adding Hotelbeds authentication", {
        endpoint: config.url,
        timestamp,
        hasSignature: !!signature,
      });

      return config;
    });
  }

  /**
   * Add response interceptor for error handling
   */
  addResponseInterceptor(client) {
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          this.logger.error("Hotelbeds API error", {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            endpoint: error.config?.url,
          });

          // Map Hotelbeds error codes to standard errors
          const errorCode = error.response.data?.error?.code;
          const errorMessage = error.response.data?.error?.message || error.response.statusText;

          switch (error.response.status) {
            case 400:
              throw new Error(`Invalid request: ${errorMessage}`);
            case 401:
              throw new Error(`Authentication failed: ${errorMessage}`);
            case 403:
              throw new Error(`Access forbidden: ${errorMessage}`);
            case 404:
              throw new Error(`Resource not found: ${errorMessage}`);
            case 429:
              throw new Error(`Rate limit exceeded: ${errorMessage}`);
            case 500:
              throw new Error(`Server error: ${errorMessage}`);
            default:
              throw new Error(`API error: ${errorMessage}`);
          }
        }

        this.logger.error("Network error", {
          message: error.message,
          code: error.code,
        });

        throw new Error(`Network error: ${error.message}`);
      }
    );
  }

  /**
   * Search for available transfers
   * @param {Object} searchParams - Transfer search parameters
   * @returns {Promise<Array>} - Normalized transfer options
   */
  async searchTransfers(searchParams) {
    return await this.executeWithRetry(async () => {
      const {
        fromLocation,
        toLocation,
        outbound,
        inbound,
        occupancy,
        language = "ENG",
        currency = "EUR",
      } = this.normalizeSearchParams(searchParams);

      this.logger.info("Searching transfers", {
        fromLocation,
        toLocation,
        outbound,
        inbound: inbound || "N/A",
        occupancy,
      });

      const requestBody = {
        language,
        from: fromLocation,
        to: toLocation,
        outbound,
        occupancy: [occupancy],
        currency,
        ...(inbound && { inbound }),
      };

      const response = await this.transfersClient.post("/transfers", requestBody);

      this.logger.info("Transfers search response", {
        statusCode: response.status,
        transfersCount: response.data?.services?.length || 0,
        currency: response.data?.currency,
      });

      return this.normalizeTransferResults(response.data, searchParams);
    });
  }

  /**
   * Get detailed information about a specific transfer
   * @param {string} transferId - Transfer service ID
   * @param {Object} searchParams - Original search parameters for context
   * @returns {Promise<Object>} - Detailed transfer information
   */
  async getTransferDetails(transferId, searchParams) {
    return await this.executeWithRetry(async () => {
      this.logger.info("Getting transfer details", { transferId });

      // For Hotelbeds, transfer details are typically included in the search response
      // If additional details are needed, we may need to make another search call
      // or use the content API for static information

      const transferSearchResults = await this.searchTransfers(searchParams);
      const transferDetails = transferSearchResults.find(
        (transfer) => transfer.id === transferId
      );

      if (!transferDetails) {
        throw new Error(`Transfer with ID ${transferId} not found`);
      }

      // Enhance with additional details from content API if available
      try {
        const contentDetails = await this.getTransferContentDetails(transferId);
        return {
          ...transferDetails,
          ...contentDetails,
        };
      } catch (error) {
        this.logger.warn("Could not fetch content details", {
          transferId,
          error: error.message,
        });
        return transferDetails;
      }
    });
  }

  /**
   * Book a transfer
   * @param {Object} bookingData - Booking information
   * @returns {Promise<Object>} - Booking confirmation
   */
  async bookTransfer(bookingData) {
    return await this.executeWithRetry(async () => {
      const {
        rateKey,
        holder,
        clientReference,
        remarks,
        language = "ENG",
      } = this.normalizeBookingData(bookingData);

      this.logger.info("Booking transfer", {
        rateKey,
        clientReference,
        holderName: holder?.name,
      });

      const requestBody = {
        language,
        rateKey,
        holder,
        clientReference,
        ...(remarks && { remarks }),
      };

      const response = await this.transfersClient.post("/bookings", requestBody);

      this.logger.info("Transfer booking response", {
        statusCode: response.status,
        bookingId: response.data?.booking?.reference,
        status: response.data?.booking?.status,
      });

      return this.normalizeBookingResult(response.data);
    });
  }

  /**
   * Cancel a transfer booking
   * @param {string} bookingReference - Booking reference
   * @param {string} cancellationFlag - Cancellation type
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelTransfer(bookingReference, cancellationFlag = "CANCELLATION") {
    return await this.executeWithRetry(async () => {
      this.logger.info("Cancelling transfer", {
        bookingReference,
        cancellationFlag,
      });

      const response = await this.transfersClient.delete(
        `/bookings/${bookingReference}`,
        {
          params: { cancellationFlag },
        }
      );

      this.logger.info("Transfer cancellation response", {
        statusCode: response.status,
        bookingReference,
      });

      return {
        success: true,
        bookingReference,
        status: "CANCELLED",
        cancellationDate: new Date().toISOString(),
        response: response.data,
      };
    });
  }

  /**
   * Get booking details
   * @param {string} bookingReference - Booking reference
   * @returns {Promise<Object>} - Booking details
   */
  async getBookingDetails(bookingReference) {
    return await this.executeWithRetry(async () => {
      this.logger.info("Getting booking details", { bookingReference });

      const response = await this.transfersClient.get(`/bookings/${bookingReference}`);

      this.logger.info("Booking details response", {
        statusCode: response.status,
        bookingReference,
        status: response.data?.booking?.status,
      });

      return this.normalizeBookingResult(response.data);
    });
  }

  /**
   * Get transfer content details from cache API
   * @param {string} transferId - Transfer ID
   * @returns {Promise<Object>} - Content details
   */
  async getTransferContentDetails(transferId) {
    try {
      // This would typically fetch additional static content
      // The exact endpoint depends on Hotelbeds content API structure
      const response = await this.contentClient.get(`/transfers/${transferId}`);
      return response.data;
    } catch (error) {
      this.logger.warn("Content API not available or transfer not found", {
        transferId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Normalize search parameters for Hotelbeds API
   * @param {Object} searchParams - Original search parameters
   * @returns {Object} - Normalized parameters
   */
  normalizeSearchParams(searchParams) {
    const {
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      passengers,
      isRoundTrip,
    } = searchParams;

    // Format locations for Hotelbeds
    const fromLocation = this.formatLocation(pickupLocation);
    const toLocation = this.formatLocation(dropoffLocation);

    // Format outbound date/time
    const outbound = {
      date: this.formatDate(pickupDate),
      time: pickupTime || "10:00",
    };

    // Format inbound date/time for round trip
    let inbound;
    if (isRoundTrip && returnDate) {
      inbound = {
        date: this.formatDate(returnDate),
        time: returnTime || "14:00",
      };
    }

    // Format occupancy
    const occupancy = {
      adults: passengers.adults || 2,
      children: passengers.children || 0,
      infants: passengers.infants || 0,
    };

    return {
      fromLocation,
      toLocation,
      outbound,
      inbound,
      occupancy,
      language: "ENG",
      currency: "EUR", // Will be converted later
    };
  }

  /**
   * Format location for Hotelbeds API
   * @param {string} location - Location string
   * @returns {Object} - Formatted location object
   */
  formatLocation(location) {
    // Simple location parsing - in production, this would use a location service
    const airportCodes = ["BOM", "DEL", "DXB", "SIN", "LHR", "JFK", "LAX"];
    const locationUpper = location.toUpperCase();

    // Check if it's an airport code
    const airportCode = airportCodes.find((code) => locationUpper.includes(code));
    if (airportCode) {
      return {
        code: airportCode,
        type: "IATA",
      };
    }

    // For hotels and addresses, we'd typically need geocoding
    // For now, return as a general location
    return {
      description: location,
      type: "ATLAS",
    };
  }

  /**
   * Format date for Hotelbeds API
   * @param {Date|string} date - Date to format
   * @returns {string} - Formatted date (YYYY-MM-DD)
   */
  formatDate(date) {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString().split("T")[0];
  }

  /**
   * Normalize transfer search results
   * @param {Object} response - Hotelbeds API response
   * @param {Object} originalParams - Original search parameters
   * @returns {Array} - Normalized transfer options
   */
  normalizeTransferResults(response, originalParams) {
    if (!response.services || !Array.isArray(response.services)) {
      this.logger.warn("No services found in response");
      return [];
    }

    return response.services.map((service) => ({
      id: service.rateKey || service.id,
      rateKey: service.rateKey,
      supplierCode: this.supplierCode,
      
      // Vehicle information
      vehicleType: this.mapVehicleType(service.content?.vehicle?.category),
      vehicleClass: service.content?.vehicle?.class || "standard",
      vehicleName: service.content?.vehicle?.name,
      vehicleImage: service.content?.vehicle?.image,
      
      // Capacity
      maxPassengers: service.content?.vehicle?.maxPax || 4,
      maxLuggage: service.content?.vehicle?.maxLuggage || 2,
      
      // Route information
      pickupLocation: service.content?.pickupInformation?.location,
      pickupInstructions: service.content?.pickupInformation?.instructions,
      dropoffLocation: service.content?.dropoffInformation?.location,
      dropoffInstructions: service.content?.dropoffInformation?.instructions,
      
      // Duration and distance
      estimatedDuration: service.content?.duration,
      distance: service.content?.distance,
      
      // Pricing
      currency: response.currency,
      basePrice: service.price?.amount || 0,
      totalPrice: service.price?.amount || 0,
      priceBreakdown: {
        base: service.price?.amount || 0,
        taxes: 0, // Hotelbeds typically includes taxes
        fees: 0,
      },
      
      // Features and amenities
      features: this.extractFeatures(service.content),
      inclusions: service.content?.inclusions || [],
      exclusions: service.content?.exclusions || [],
      
      // Service provider
      providerName: service.content?.supplier?.name,
      providerRating: service.content?.supplier?.rating,
      
      // Policies
      cancellationPolicy: service.content?.cancellationPolicy,
      freeWaitingTime: service.content?.waitingTime || 60, // minutes
      
      // Booking information
      bookingCutoff: service.content?.cutoffTime,
      confirmationType: service.content?.confirmationType || "INSTANT",
      
      // Raw data for audit
      rawData: service,
      searchParams: originalParams,
      
      // Metadata
      createdAt: new Date().toISOString(),
      ttl: 3600, // 1 hour cache
    }));
  }

  /**
   * Map Hotelbeds vehicle category to standard types
   * @param {string} category - Hotelbeds vehicle category
   * @returns {string} - Standard vehicle type
   */
  mapVehicleType(category) {
    const categoryMapping = {
      SEDAN: "sedan",
      EXECUTIVE: "luxury",
      LUXURY: "luxury",
      SUV: "suv",
      VAN: "minivan",
      MINIVAN: "minivan",
      BUS: "bus",
      WHEELCHAIR: "wheelchair",
    };

    return categoryMapping[category?.toUpperCase()] || "sedan";
  }

  /**
   * Extract features from service content
   * @param {Object} content - Service content
   * @returns {Array} - List of features
   */
  extractFeatures(content) {
    const features = [];

    if (content?.meetAndGreet) features.push("meet_greet");
    if (content?.flightMonitoring) features.push("flight_monitoring");
    if (content?.waitingTime > 0) features.push("free_waiting");
    if (content?.vehicle?.airConditioning) features.push("air_conditioning");
    if (content?.vehicle?.wifi) features.push("wifi");
    if (content?.professionalDriver) features.push("professional_driver");
    if (content?.childSeats) features.push("child_seats_available");

    return features;
  }

  /**
   * Normalize booking data for Hotelbeds API
   * @param {Object} bookingData - Original booking data
   * @returns {Object} - Normalized booking data
   */
  normalizeBookingData(bookingData) {
    const {
      rateKey,
      guestDetails,
      clientReference,
      specialRequests,
      flightNumber,
    } = bookingData;

    // Format holder information
    const holder = {
      name: guestDetails.firstName || "Unknown",
      surname: guestDetails.lastName || "Unknown",
      email: guestDetails.email,
      phone: guestDetails.phone,
    };

    return {
      rateKey,
      holder,
      clientReference: clientReference || `TR${Date.now()}`,
      remarks: specialRequests,
      language: "ENG",
      ...(flightNumber && { flightNumber }),
    };
  }

  /**
   * Normalize booking result
   * @param {Object} response - Hotelbeds booking response
   * @returns {Object} - Normalized booking result
   */
  normalizeBookingResult(response) {
    const booking = response.booking;

    return {
      success: true,
      bookingReference: booking.reference,
      supplierReference: booking.reference,
      status: booking.status,
      
      // Transfer details
      transferDetails: booking.services?.[0],
      
      // Pricing
      totalAmount: booking.totalNet,
      currency: booking.currency,
      
      // Dates
      bookingDate: booking.creationDate,
      confirmationDate: booking.creationDate,
      
      // Provider information
      providerName: booking.services?.[0]?.supplier?.name,
      providerContact: booking.services?.[0]?.supplier?.vatNumber,
      
      // Voucher information
      voucherUrl: booking.voucher?.url,
      voucherNumber: booking.voucher?.reference,
      
      // Raw response for audit
      rawResponse: response,
      
      // Metadata
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get supplier ID from database
   * @returns {Promise<number>} - Supplier ID
   */
  async getSupplierId() {
    // This would typically query the database for the supplier ID
    // For now, return a default ID
    return 1; // Hotelbeds supplier ID
  }

  /**
   * Health check for the adapter
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    try {
      // Test basic connectivity
      const response = await this.contentClient.get("/status", { timeout: 5000 });
      
      return {
        status: "healthy",
        supplier: this.supplierCode,
        timestamp: new Date().toISOString(),
        response: response.status === 200,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        supplier: this.supplierCode,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}

// Export for use in other modules
module.exports = HotelbedsTransfersAdapter;
