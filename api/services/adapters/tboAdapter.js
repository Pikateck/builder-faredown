/**
 * TBO (Travel Boutique Online) Supplier Adapter
 * Integrates with TBO API for flight data
 * API Docs: https://apidoc.tektravels.com/flight/NewReleases2025.aspx
 */

const BaseSupplierAdapter = require("./baseSupplierAdapter");
const axios = require("axios");
const pool = require("../../database/connection");

class TBOAdapter extends BaseSupplierAdapter {
  constructor(config = {}) {
    super("TBO", {
      searchUrl:
        process.env.TBO_SEARCH_URL ||
        "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest",
      bookingUrl:
        process.env.TBO_BOOKING_URL ||
        "https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest",
      agencyId: process.env.TBO_AGENCY_ID,
      endUserIp: process.env.TBO_END_USER_IP || "192.168.5.56",
      credentialMode: process.env.TBO_CREDENTIAL_MODE || "runtime",
      timeout: parseInt(process.env.TBO_TIMEOUT_MS || "15000"),
      requestsPerSecond: 10,
      ...config,
    });

    this.tokenId = null;
    this.tokenExpiry = null;

    // Initialize HTTP clients for both endpoints
    this.searchClient = axios.create({
      baseURL: this.config.searchUrl,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Faredown-AI-Bargaining/1.0",
      },
    });

    this.bookingClient = axios.create({
      baseURL: this.config.bookingUrl,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Faredown-AI-Bargaining/1.0",
      },
    });

    // Keep backward compatibility
    this.httpClient = this.searchClient;
  }

  /**
   * Get or refresh TBO token
   */
  async getTokenId() {
    try {
      // Check token cache in database first
      const cachedToken = await this.getCachedToken();
      if (cachedToken && Date.now() < cachedToken.expires_at) {
        this.tokenId = cachedToken.token_id;
        this.tokenExpiry = cachedToken.expires_at;
        return this.tokenId;
      }

      // If runtime mode, authenticate and get new token
      if (this.config.credentialMode === "runtime") {
        this.logger.info("Authenticating with TBO (runtime mode)");

        const authRequest = {
          ClientId: this.config.apiKey || process.env.TBO_CLIENT_ID,
          UserName: process.env.TBO_USERNAME,
          Password: process.env.TBO_PASSWORD,
          EndUserIp: this.config.endUserIp,
        };

        const response = await this.httpClient.post(
          "/Authenticate",
          authRequest
        );

        if (response.data.Status === 1 && response.data.TokenId) {
          this.tokenId = response.data.TokenId;
          // TBO tokens typically expire in 1 hour, set expiry to 55 minutes for safety
          this.tokenExpiry = Date.now() + 55 * 60 * 1000;

          // Cache the token in database
          await this.cacheToken(this.tokenId, this.tokenExpiry);

          this.logger.info("TBO authentication successful");
          return this.tokenId;
        } else {
          throw new Error(
            `TBO authentication failed: ${response.data.Error || "Unknown error"}`
          );
        }
      } else {
        // Static mode: use pre-configured token
        this.tokenId = process.env.TBO_TOKEN_ID;
        this.logger.info("Using static TBO token");
        return this.tokenId;
      }
    } catch (error) {
      this.logger.error(
        "Failed to get TBO token:",
        error.response?.data || error.message
      );
      throw new Error("Authentication failed with TBO API");
    }
  }

  /**
   * Get cached token from database
   */
  async getCachedToken() {
    try {
      const result = await pool.query(
        `SELECT token_id, agency_id, expires_at 
         FROM tbo_token_cache 
         WHERE agency_id = $1 
           AND expires_at > NOW()
         ORDER BY created_at DESC 
         LIMIT 1`,
        [this.config.agencyId]
      );

      if (result.rows.length > 0) {
        return {
          token_id: result.rows[0].token_id,
          expires_at: new Date(result.rows[0].expires_at).getTime(),
        };
      }

      return null;
    } catch (error) {
      this.logger.error("Failed to get cached TBO token:", error);
      return null;
    }
  }

  /**
   * Cache token in database
   */
  async cacheToken(tokenId, expiresAt) {
    try {
      await pool.query(
        `INSERT INTO tbo_token_cache (token_id, agency_id, expires_at)
         VALUES ($1, $2, $3)`,
        [tokenId, this.config.agencyId, new Date(expiresAt)]
      );
      this.logger.info("TBO token cached successfully");
    } catch (error) {
      this.logger.error("Failed to cache TBO token:", error);
    }
  }

  /**
   * Get agency balance
   */
  async getAgencyBalance() {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const request = {
        TokenId: tokenId,
        EndUserIp: this.config.endUserIp,
      };

      const response = await this.httpClient.post(
        "/GetAgencyBalance",
        request
      );

      if (response.data.Status === 1) {
        return {
          balance: response.data.Result.Balance,
          currency: response.data.Result.Currency,
          supplier: "TBO",
        };
      }

      throw new Error(
        `Failed to get TBO balance: ${response.data.Error || "Unknown error"}`
      );
    });
  }

  /**
   * Search flights using TBO Search API
   */
  async searchFlights(searchParams) {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const {
        origin,
        destination,
        departureDate,
        returnDate,
        adults = 1,
        children = 0,
        infants = 0,
        travelClass = "ECONOMY",
        maxResults = 20,
      } = searchParams;

      // Map cabin class to TBO format
      const cabinMap = {
        ECONOMY: 1,
        PREMIUM_ECONOMY: 2,
        BUSINESS: 3,
        FIRST: 4,
      };

      const searchRequest = {
        EndUserIp: this.config.endUserIp,
        TokenId: tokenId,
        AdultCount: adults,
        ChildCount: children,
        InfantCount: infants,
        DirectFlight: false,
        OneStopFlight: false,
        JourneyType: returnDate ? 2 : 1, // 1=OneWay, 2=Return
        PreferredAirlines: null,
        Segments: [
          {
            Origin: origin,
            Destination: destination,
            FlightCabinClass: cabinMap[travelClass] || 1,
            PreferredDepartureTime: departureDate + "T00:00:00",
            PreferredArrivalTime: departureDate + "T23:59:00",
          },
        ],
        Sources: null, // null means all sources (GDS+LCC+NDC)
      };

      // Add return segment if round trip
      if (returnDate) {
        searchRequest.Segments.push({
          Origin: destination,
          Destination: origin,
          FlightCabinClass: cabinMap[travelClass] || 1,
          PreferredDepartureTime: returnDate + "T00:00:00",
          PreferredArrivalTime: returnDate + "T23:59:00",
        });
      }

      this.logger.info("Searching TBO flights", {
        origin,
        destination,
        departureDate,
        returnDate,
      });

      const response = await this.httpClient.post("/Search", searchRequest);

      if (response.data.Status !== 1) {
        throw new Error(
          `TBO search failed: ${response.data.Error || "Unknown error"}`
        );
      }

      const results = response.data.Response?.Results || [[]];
      const flightOffers = results[0] || [];

      // Transform TBO response to our standard format
      const normalizedFlights = flightOffers
        .slice(0, maxResults)
        .map((offer) => this.transformTBOFlightOffer(offer));

      // Store in repository and create snapshots
      await this.storeProductsAndSnapshots(normalizedFlights, "flight");

      this.logger.info(
        `Retrieved ${normalizedFlights.length} flight offers from TBO`
      );

      return normalizedFlights;
    });
  }

  /**
   * Get fare quote for a specific result
   */
  async getFareQuote(resultIndex, traceId) {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const request = {
        EndUserIp: this.config.endUserIp,
        TokenId: tokenId,
        TraceId: traceId,
        ResultIndex: resultIndex.toString(),
      };

      const response = await this.httpClient.post("/FareQuote", request);

      if (response.data.Status === 1 && response.data.Response) {
        return this.transformTBOFlightOffer(response.data.Response.Results);
      }

      throw new Error(
        `TBO FareQuote failed: ${response.data.Error || "Unknown error"}`
      );
    });
  }

  /**
   * Get fare rules
   */
  async getFareRules(resultIndex, traceId) {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const request = {
        EndUserIp: this.config.endUserIp,
        TokenId: tokenId,
        TraceId: traceId,
        ResultIndex: resultIndex.toString(),
      };

      const response = await this.httpClient.post("/FareRule", request);

      if (response.data.Status === 1) {
        return response.data.Response?.FareRules || [];
      }

      throw new Error(
        `TBO FareRule failed: ${response.data.Error || "Unknown error"}`
      );
    });
  }

  /**
   * Get SSR (Special Service Requests) details
   */
  async getSSR(resultIndex, traceId) {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const request = {
        EndUserIp: this.config.endUserIp,
        TokenId: tokenId,
        TraceId: traceId,
        ResultIndex: resultIndex.toString(),
      };

      const response = await this.httpClient.post("/SSR", request);

      if (response.data.Status === 1) {
        return {
          baggage: response.data.Response?.Baggage || [],
          mealDynamic: response.data.Response?.MealDynamic || [],
          seatDynamic: response.data.Response?.SeatDynamic || [],
        };
      }

      throw new Error(
        `TBO SSR failed: ${response.data.Error || "Unknown error"}`
      );
    });
  }

  /**
   * Book flight through TBO
   */
  async bookFlight(bookingData) {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const {
        traceId,
        resultIndex,
        passengers,
        gstInfo = null,
        deliveryInfo = null,
      } = bookingData;

      const bookingRequest = {
        EndUserIp: this.config.endUserIp,
        TokenId: tokenId,
        TraceId: traceId,
        ResultIndex: resultIndex.toString(),
        Passengers: passengers.map((pax) => ({
          Title: pax.title,
          FirstName: pax.firstName,
          LastName: pax.lastName,
          PaxType: pax.type === "adult" ? 1 : pax.type === "child" ? 2 : 3,
          DateOfBirth: pax.dateOfBirth,
          Gender: pax.gender === "male" ? 1 : 2,
          PassportNo: pax.passportNo || "",
          PassportExpiry: pax.passportExpiry || "",
          AddressLine1: pax.addressLine1 || "Address",
          AddressLine2: pax.addressLine2 || "",
          City: pax.city || "City",
          CountryCode: pax.countryCode || "IN",
          CountryName: pax.countryName || "India",
          Nationality: pax.nationality || "IN",
          ContactNo: pax.contactNo || "",
          Email: pax.email || "",
          IsLeadPax: pax.isLead || false,
          FFAirlineCode: pax.frequentFlyerAirline || null,
          FFNumber: pax.frequentFlyerNumber || null,
        })),
      };

      if (gstInfo) {
        bookingRequest.GST = gstInfo;
      }

      if (deliveryInfo) {
        bookingRequest.DeliveryInfo = deliveryInfo;
      }

      this.logger.info("Booking flight with TBO", {
        traceId,
        resultIndex,
        passengerCount: passengers.length,
      });

      const response = await this.bookingClient.post("/Book", bookingRequest);

      if (response.data.Status !== 1) {
        throw new Error(
          `TBO booking failed: ${response.data.Error || "Unknown error"}`
        );
      }

      const booking = response.data.Response;

      this.logger.info("TBO booking successful", {
        bookingId: booking.BookingId,
        pnr: booking.PNR,
        status: booking.Status,
      });

      return {
        success: true,
        bookingId: booking.BookingId,
        pnr: booking.PNR,
        status: booking.Status === 1 ? "pending" : "failed",
        supplier: "TBO",
        traceId: traceId,
        bookingData: booking,
      };
    });
  }

  /**
   * Ticket the booking
   */
  async ticketBooking(bookingId, pnr) {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const request = {
        EndUserIp: this.config.endUserIp,
        TokenId: tokenId,
        BookingId: bookingId,
        PNR: pnr,
      };

      const response = await this.bookingClient.post("/Ticket", request);

      if (response.data.Status === 1) {
        this.logger.info("TBO ticketing successful", {
          bookingId,
          pnr,
          ticketStatus: response.data.Response?.TicketStatus,
        });

        return {
          success: true,
          bookingId: bookingId,
          pnr: pnr,
          ticketStatus: response.data.Response?.TicketStatus,
          tickets: response.data.Response?.FlightItinerary?.Tickets || [],
          supplier: "TBO",
        };
      }

      throw new Error(
        `TBO ticketing failed: ${response.data.Error || "Unknown error"}`
      );
    });
  }

  /**
   * Get booking details
   */
  async getBookingDetails(bookingId, pnr) {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const request = {
        EndUserIp: this.config.endUserIp,
        TokenId: tokenId,
        BookingId: bookingId,
        PNR: pnr,
      };

      const response = await this.bookingClient.post(
        "/GetBookingDetails",
        request
      );

      if (response.data.Status === 1) {
        return response.data.Response;
      }

      throw new Error(
        `Failed to get TBO booking details: ${response.data.Error || "Unknown error"}`
      );
    });
  }

  /**
   * Cancel booking (SendChangeRequest)
   */
  async cancelBooking(bookingId, pnr, requestType = 1) {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const request = {
        EndUserIp: this.config.endUserIp,
        TokenId: tokenId,
        BookingId: bookingId,
        RequestType: requestType, // 1=Full Cancel, 2=Partial Cancel, 4=Reschedule
        Remarks: "User requested cancellation",
        Sectors: [],
      };

      const response = await this.bookingClient.post(
        "/SendChangeRequest",
        request
      );

      if (response.data.Status === 1) {
        this.logger.info("TBO cancellation request successful", {
          bookingId,
          pnr,
          changeRequestId: response.data.Response?.ChangeRequestId,
        });

        return {
          success: true,
          bookingId: bookingId,
          pnr: pnr,
          changeRequestId: response.data.Response?.ChangeRequestId,
          status: "cancellation_requested",
          supplier: "TBO",
        };
      }

      throw new Error(
        `TBO cancellation failed: ${response.data.Error || "Unknown error"}`
      );
    });
  }

  /**
   * Calendar fare search
   */
  async getCalendarFare(searchParams) {
    return await this.executeWithRetry(async () => {
      const tokenId = await this.getTokenId();

      const { origin, destination, departureDate, adults = 1 } = searchParams;

      const request = {
        EndUserIp: this.config.endUserIp,
        TokenId: tokenId,
        AdultCount: adults,
        ChildCount: 0,
        InfantCount: 0,
        JourneyType: 1,
        Segments: [
          {
            Origin: origin,
            Destination: destination,
            PreferredDepartureTime: departureDate + "T00:00:00",
          },
        ],
      };

      const response = await this.httpClient.post("/CalendarFare", request);

      if (response.data.Status === 1) {
        return response.data.Response?.CalendarFareData || [];
      }

      throw new Error(
        `TBO CalendarFare failed: ${response.data.Error || "Unknown error"}`
      );
    });
  }

  /**
   * Transform TBO flight offer to standard format
   */
  transformTBOFlightOffer(offer) {
    try {
      const segments = offer.Segments?.[0] || [];
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      const fare = offer.Fare || {};

      return {
        id: offer.ResultIndex || offer.TraceId,
        airline: firstSegment?.Airline?.AirlineCode || "",
        flightNumber: firstSegment?.Airline?.FlightNumber || "",
        origin: firstSegment?.Origin?.Airport?.AirportCode || "",
        destination: lastSegment?.Destination?.Airport?.AirportCode || "",
        departureDate: firstSegment?.Origin?.DepTime?.split("T")[0] || "",
        departureTime: firstSegment?.Origin?.DepTime || "",
        arrivalTime: lastSegment?.Destination?.ArrTime || "",
        durationMinutes: offer.Segments?.[0]?.reduce(
          (acc, seg) => acc + (seg.Duration || 0),
          0
        ),
        stops: segments.length - 1,
        class: this.mapTBOCabinClass(firstSegment?.CabinClass || 1),
        bookingClass: firstSegment?.BookingClass || "",
        fareBasis: firstSegment?.FareBasis || "",
        price: parseFloat(fare.PublishedFare || fare.OfferedFare || 0),
        currency: fare.Currency || "INR",
        netPrice: parseFloat(fare.BaseFare || 0),
        taxes:
          parseFloat(fare.Tax || 0) +
          parseFloat(fare.OtherCharges || 0) +
          parseFloat(fare.ServiceFee || 0),
        fees: parseFloat(fare.ServiceFee || 0),
        inventoryState: offer.IsRefundable ? "AVAILABLE" : "LIMITED",
        aircraftType: firstSegment?.Airline?.AircraftType || "",
        fareRules: segments.map((seg) => ({
          cabin: this.mapTBOCabinClass(seg.CabinClass),
          class: seg.BookingClass,
          fareBasis: seg.FareBasis,
          brandedFare: seg.FareClassification?.Type || "",
        })),
        baggageAllowance: firstSegment?.Baggage || "0",
        originalId: offer.ResultIndex,
        supplierCode: "TBO",
        rateKey: offer.ResultIndex,
        traceId: offer.TraceId,
        isLCC: offer.IsLCC || false,
        isRefundable: offer.IsRefundable || false,
        policyFlags: {
          refundable: offer.IsRefundable || false,
          changeable: true,
          lastTicketingDate: offer.LastTicketDate || null,
        },
      };
    } catch (error) {
      this.logger.error("Failed to transform TBO flight offer:", error);
      throw error;
    }
  }

  /**
   * Map TBO cabin class to standard format
   */
  mapTBOCabinClass(tboClass) {
    const cabinMap = {
      1: "ECONOMY",
      2: "PREMIUM_ECONOMY",
      3: "BUSINESS",
      4: "FIRST",
    };
    return cabinMap[tboClass] || "ECONOMY";
  }

  /**
   * Hotel search (TBO supports hotels, but not implementing here)
   */
  async searchHotels(searchParams) {
    this.logger.warn("Hotel search not implemented for TBO adapter yet");
    return [];
  }

  /**
   * Sightseeing search (TBO doesn't provide sightseeing)
   */
  async searchSightseeing(searchParams) {
    this.logger.warn("Sightseeing search not supported by TBO adapter");
    return [];
  }

  /**
   * Health check
   */
  async performHealthCheck() {
    try {
      const balance = await this.getAgencyBalance();
      return {
        healthy: true,
        supplier: "TBO",
        balance: balance.balance,
        currency: balance.currency,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("TBO health check failed:", error);
      return {
        healthy: false,
        supplier: "TBO",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = TBOAdapter;
