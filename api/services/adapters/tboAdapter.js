/**
 * TBO (Travel Boutique Online) Supplier Adapter
 * Integrates with TBO API for flight data
 * API Docs: https://apidoc.tektravels.com/flight/NewReleases2025.aspx
 */

const BaseSupplierAdapter = require("./baseSupplierAdapter");
const axios = require("axios");
const pool = require("../../database/connection");
const HotelNormalizer = require("../normalization/hotelNormalizer");
const HotelDedupAndMergeUnified = require("../merging/hotelDedupAndMergeUnified");

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
      // Hotel API specific configuration (live)
      hotelAuthBase: process.env.TBO_HOTEL_BASE_URL_AUTHENTICATION ||
        "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc",
      hotelStaticBase: process.env.TBO_HOTEL_STATIC_DATA ||
        "https://apiwr.tboholidays.com/HotelAPI/",
      hotelSearchBase: process.env.TBO_HOTEL_SEARCH_PREBOOK ||
        "https://affiliate.travelboutiqueonline.com/HotelAPI/",
      hotelBookingBase: process.env.TBO_HOTEL_BOOKING ||
        "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/",
      hotelClientId: process.env.TBO_HOTEL_CLIENT_ID || process.env.TBO_CLIENT_ID,
      hotelUserId: process.env.TBO_HOTEL_USER_ID || process.env.TBO_USERNAME,
      hotelPassword: process.env.TBO_HOTEL_PASSWORD || process.env.TBO_PASSWORD,
      staticUserName: process.env.TBO_STATIC_DATA_CREDENTIALS_USERNAME,
      staticPassword: process.env.TBO_STATIC_DATA_CREDENTIALS_PASSWORD,
      ...config,
    });

    this.tokenId = null;
    this.tokenExpiry = null;
    this.hotelTokenId = null;
    this.hotelTokenExpiry = null;

    // Initialize HTTP clients for both endpoints (flights)
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

    // Hotel-specific HTTP clients
    this.hotelAuthClient = axios.create({
      baseURL: this.config.hotelAuthBase,
      timeout: this.config.timeout,
      headers: { "Content-Type": "application/json" },
    });
    this.hotelStaticClient = axios.create({
      baseURL: this.config.hotelStaticBase,
      timeout: this.config.timeout,
      headers: { "Content-Type": "application/json" },
    });
    this.hotelSearchClient = axios.create({
      baseURL: this.config.hotelSearchBase,
      timeout: this.config.timeout,
      headers: { "Content-Type": "application/json" },
    });
    this.hotelBookingClient = axios.create({
      baseURL: this.config.hotelBookingBase,
      timeout: this.config.timeout,
      headers: { "Content-Type": "application/json" },
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

        this.logger.info(
          `TBO Auth Request: ClientId=${authRequest.ClientId}, UserName=${authRequest.UserName}, EndUserIp=${authRequest.EndUserIp}`,
        );

        const response = await this.httpClient.post(
          "/Authenticate",
          authRequest,
        );

        this.logger.info(
          `TBO Auth Response: Status=${response.data.Status}, HasToken=${!!response.data.TokenId}`,
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
          const errorMsg = `TBO authentication failed: ${response.data.Error?.ErrorMessage || response.data.Error || JSON.stringify(response.data)}`;
          this.logger.error(errorMsg);
          throw new Error(errorMsg);
        }
      } else {
        // Static mode: use pre-configured token
        this.tokenId = process.env.TBO_TOKEN_ID;
        this.logger.info("Using static TBO token");
        return this.tokenId;
      }
    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      this.logger.error(
        "Failed to get TBO token:",
        JSON.stringify(errorDetails, null, 2),
      );
      this.logger.error("TBO Auth Error Stack:", error.stack);
      throw new Error(
        `Authentication failed with TBO API: ${JSON.stringify(errorDetails)}`,
      );
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
        [this.config.agencyId],
      );

      if (result.rows.length > 0) {
        this.logger.info(
          `Found cached TBO token for agency ${this.config.agencyId}`,
        );
        return {
          token_id: result.rows[0].token_id,
          expires_at: new Date(result.rows[0].expires_at).getTime(),
        };
      }

      this.logger.info(
        `No cached TBO token found for agency ${this.config.agencyId}`,
      );
      return null;
    } catch (error) {
      this.logger.error("Failed to get cached TBO token:", error.message);
      if (error.code === "42P01") {
        this.logger.error(
          "Table tbo_token_cache does not exist. Please run the migration script.",
        );
      }
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
        [tokenId, this.config.agencyId, new Date(expiresAt)],
      );
      this.logger.info("TBO token cached successfully");
    } catch (error) {
      this.logger.error("Failed to cache TBO token:", error.message);
      if (error.code === "42P01") {
        this.logger.error(
          "Table tbo_token_cache does not exist. Continuing without caching.",
        );
      }
      // Don't throw - caching failure shouldn't prevent search
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

      const response = await this.httpClient.post("/GetAgencyBalance", request);

      if (response.data.Status === 1) {
        return {
          balance: response.data.Result.Balance,
          currency: response.data.Result.Currency,
          supplier: "TBO",
        };
      }

      throw new Error(
        `Failed to get TBO balance: ${response.data.Error || "Unknown error"}`,
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

      this.logger.info(
        `TBO Search Response: Status=${response.data.Status}, HasResults=${!!response.data.Response?.Results}`,
      );

      if (response.data.Status !== 1) {
        const errorMsg = `TBO search failed: ${response.data.Error?.ErrorMessage || response.data.Error || JSON.stringify(response.data)}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      const results = response.data.Response?.Results || [[]];
      const flightOffers = results[0] || [];

      this.logger.info(`TBO returned ${flightOffers.length} flight offers`);

      // Transform TBO response to our standard format
      const normalizedFlights = flightOffers
        .slice(0, maxResults)
        .map((offer) => this.transformTBOFlightOffer(offer));

      // Store in repository and create snapshots
      await this.storeProductsAndSnapshots(normalizedFlights, "flight");

      this.logger.info(
        `Retrieved ${normalizedFlights.length} flight offers from TBO`,
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
        `TBO FareQuote failed: ${response.data.Error || "Unknown error"}`,
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
        `TBO FareRule failed: ${response.data.Error || "Unknown error"}`,
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
        `TBO SSR failed: ${response.data.Error || "Unknown error"}`,
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
          `TBO booking failed: ${response.data.Error || "Unknown error"}`,
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
        `TBO ticketing failed: ${response.data.Error || "Unknown error"}`,
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
        request,
      );

      if (response.data.Status === 1) {
        return response.data.Response;
      }

      throw new Error(
        `Failed to get TBO booking details: ${response.data.Error || "Unknown error"}`,
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
        request,
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
        `TBO cancellation failed: ${response.data.Error || "Unknown error"}`,
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
        `TBO CalendarFare failed: ${response.data.Error || "Unknown error"}`,
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
          0,
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
   * Get/refresh Hotel token (separate from flight token)
   */
  async getHotelToken() {
    // Return cached token if valid in-memory
    if (this.hotelTokenId && this.hotelTokenExpiry && Date.now() < this.hotelTokenExpiry) {
      return this.hotelTokenId;
    }

    // Try DB cache
    try {
      const cached = await this.getCachedHotelToken();
      if (cached && Date.now() < cached.expires_at) {
        this.hotelTokenId = cached.token_id;
        this.hotelTokenExpiry = cached.expires_at;
        return this.hotelTokenId;
      }
    } catch {}

    return await this.executeWithRetry(async () => {
      const authRequest = {
        ClientId: this.config.hotelClientId,
        UserName: this.config.hotelUserId,
        Password: this.config.hotelPassword,
        EndUserIp: this.config.endUserIp,
      };
      const response = await this.hotelAuthClient.post("/Authenticate", authRequest);
      if (response.data?.Status === 1 && response.data?.TokenId) {
        // Cache token ~55 minutes (memory + DB)
        this.hotelTokenId = response.data.TokenId;
        this.hotelTokenExpiry = Date.now() + 55 * 60 * 1000;
        await this.cacheHotelToken(this.hotelTokenId, this.hotelTokenExpiry);
        return this.hotelTokenId;
      }
      throw new Error(
        `TBO Hotel auth failed: ${response.data?.Error?.ErrorMessage || JSON.stringify(response.data)}`,
      );
    });
  }

  /**
   * Get cached HOTEL token from database
   */
  async getCachedHotelToken() {
    try {
      const result = await pool.query(
        `SELECT token_id, agency_id, expires_at
         FROM tbo_token_cache
         WHERE agency_id = $1
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [this.config.hotelClientId],
      );
      if (result.rows.length > 0) {
        return {
          token_id: result.rows[0].token_id,
          expires_at: new Date(result.rows[0].expires_at).getTime(),
        };
      }
      return null;
    } catch (error) {
      this.logger.warn("Hotel token cache lookup failed", { error: error.message });
      return null;
    }
  }

  /**
   * Cache HOTEL token in database
   */
  async cacheHotelToken(tokenId, expiresAt) {
    try {
      await pool.query(
        `INSERT INTO tbo_token_cache (token_id, agency_id, expires_at)
         VALUES ($1, $2, $3)`,
        [tokenId, this.config.hotelClientId, new Date(expiresAt)],
      );
    } catch (error) {
      this.logger.warn("Hotel token cache insert failed", { error: error.message });
    }
  }

  /**
   * Hotel search using TBO Hotel API (scaffold)
   */
  async searchHotels(searchParams) {
    try {
      this.logger.info("TBO hotel search initiated", {
        destination: searchParams.destination,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
      });

      const tokenId = await this.getHotelToken();

      const {
        destination,
        checkIn,
        checkOut,
        adults = 2,
        children = 0,
        currency = "INR",
        rooms = 1,
        childAges = [],
        guestNationality = "IN",
      } = searchParams;

      // Build RoomGuests payload supporting both numeric rooms and per-room array
      let roomGuests = [];
      if (Array.isArray(rooms)) {
        roomGuests = rooms.map((r) => ({
          NoOfAdults: Number(r.adults) || 1,
          NoOfChild: Number(r.children) || 0,
          ChildAge: Array.isArray(r.childAges) ? r.childAges.map((a) => Number(a) || 0) : [],
        }));
      } else {
        roomGuests = [
          {
            NoOfAdults: Number(adults) || 1,
            NoOfChild: Number(children) || 0,
            ChildAge: Array.isArray(childAges) ? childAges.map((a) => Number(a) || 0) : [],
          },
        ];
      }

      const payload = {
        TokenId: tokenId,
        CheckIn: checkIn,
        CheckOut: checkOut,
        NoOfRooms: Array.isArray(rooms) ? rooms.length : Number(rooms) || 1,
        GuestNationality: guestNationality,
        City: destination,
        IsNearBySearchAllowed: true,
        RoomGuests: roomGuests,
        PreferredCurrency: currency,
        EndUserIp: this.config.endUserIp,
      };

      // Use retry wrapper
      const res = await this.executeWithRetry(() =>
        this.hotelSearchClient.post("/Search", payload),
      );
      const hotels = res.data?.HotelResult || res.data?.Hotels || [];

      // Persist to master schema (fire-and-forget)
      const searchContext = {
        checkin: checkIn,
        checkout: checkOut,
        adults,
        children,
        currency,
        destination,
      };
      this.persistToMasterSchema(hotels, searchContext).catch((e) =>
        this.logger.warn("TBO persistToMasterSchema failed", { error: e.message }),
      );

      // Map to lightweight aggregator results
      const results = hotels.slice(0, 20).map((h) => ({
        hotelId: String(h.HotelCode || h.HotelId || h.Id || ""),
        name: h.HotelName || h.Name || "",
        city: destination,
        price: parseFloat(h.Price?.PublishedPrice) || parseFloat(h.MinPrice) || 0,
        currency: currency,
        supplier: "TBO",
        checkIn,
        checkOut,
        roomCode: h.Rooms?.[0]?.RoomTypeCode || "",
      }));

      return results;
    } catch (error) {
      this.logger.error("TBO hotel search failed", {
        error: error.message,
        destination: searchParams.destination,
      });
      return [];
    }
  }

  /**
   * Normalize and persist TBO results to unified master hotel schema (Phase 3)
   * Note: TBO hotel data structure (when available)
   */
  async persistToMasterSchema(hotels, searchContext = {}) {
    try {
      if (!hotels || hotels.length === 0) {
        return { hotelsInserted: 0, offersInserted: 0 };
      }

      // Normalize hotels to TBO-based schema
      const normalizedHotels = hotels.map((hotel) => {
        const normalized = HotelNormalizer.normalizeTBOHotel(hotel, "TBO");
        return {
          ...normalized,
          rawHotel: hotel, // Keep raw for accessing rates
        };
      });

      // Extract rates/offers from each hotel
      const normalizedOffers = [];
      for (const hotelNorm of normalizedHotels) {
        const hotel = hotelNorm.rawHotel;
        const hotelId = hotel.HotelCode || hotel.Id;

        // TBO: hotel.Rooms[].Rates[]
        const rooms = hotel.Rooms || [];
        for (const room of rooms) {
          const rates = room.Rates || [];
          for (const rate of rates) {
            const offer = HotelNormalizer.normalizeTBORoomOffer(
              rate,
              hotelNorm.hotelMasterData.property_id,
              "TBO",
              {
                checkin: searchContext.checkin,
                checkout: searchContext.checkout,
                adults: searchContext.adults,
                children: searchContext.children,
                currency: searchContext.currency,
              },
            );

            if (offer) {
              offer.supplier_hotel_id = hotelId;
              // Add denormalized fields for easy querying
              offer.hotel_name =
                hotel.HotelName || hotelNorm.hotelMasterData.hotel_name;
              offer.city =
                searchContext.destination || hotelNorm.hotelMasterData.city;
              normalizedOffers.push(offer);
            }
          }
        }
      }

      this.logger.info("Extracted rates from TBO hotels", {
        totalHotels: hotels.length,
        totalOffers: normalizedOffers.length,
      });

      // Prepare hotels for merge (include supplier_hotel_id)
      const hotelsForMerge = normalizedHotels.map((h) => ({
        ...h.hotelMasterData,
        supplier_hotel_id: h.supplierMapData?.supplier_hotel_id || (h.rawHotel?.HotelCode || h.rawHotel?.Id ? String(h.rawHotel.HotelCode || h.rawHotel.Id) : null),
      }));

      // Merge into unified Phase 3 tables with dedup logic
      const mergeResult =
        await HotelDedupAndMergeUnified.mergeNormalizedResults(
          hotelsForMerge,
          normalizedOffers,
          "TBO",
        );

      this.logger.info("Persisted TBO results to unified schema", {
        hotelsInserted: mergeResult.hotelsInserted,
        offersInserted: mergeResult.offersInserted,
      });

      return mergeResult;
    } catch (error) {
      this.logger.error("Error persisting TBO to unified schema", {
        error: error.message,
        stack: error.stack,
      });
      return { hotelsInserted: 0, offersInserted: 0, error: error.message };
    }
  }

  /**
   * Static data: Country list
   */
  async getCountryList(force = false) {
    try {
      const redis = require("../redisService");
      const cacheKey = "tbo:static:countries";
      if (!force) {
        const cached = await redis.get(cacheKey);
        if (cached) return cached;
      }
      const res = await this.executeWithRetry(() =>
        this.hotelStaticClient.post("/CountryList", {
          UserName: this.config.staticUserName?.trim(),
          Password: this.config.staticPassword,
        }),
      );
      const data = res.data?.CountryList || res.data?.Result || [];
      await (require("../redisService").set(cacheKey, data, 24 * 60 * 60));
      return data;
    } catch (e) {
      this.logger.error("TBO static CountryList failed", { error: e.message });
      return [];
    }
  }

  /**
   * Static data: City list for a country
   */
  async getCityList(countryCode, force = false) {
    try {
      const redis = require("../redisService");
      const cacheKey = `tbo:static:cities:${countryCode}`;
      if (!force) {
        const cached = await redis.get(cacheKey);
        if (cached) return cached;
      }
      const res = await this.executeWithRetry(() =>
        this.hotelStaticClient.post("/CityList", {
          UserName: this.config.staticUserName?.trim(),
          Password: this.config.staticPassword,
          CountryCode: countryCode,
        }),
      );
      const data = res.data?.CityList || res.data?.Result || [];
      await (require("../redisService").set(cacheKey, data, 24 * 60 * 60));
      return data;
    } catch (e) {
      this.logger.error("TBO static CityList failed", { error: e.message });
      return [];
    }
  }

  /**
   * Static data: Hotel codes in a city
   */
  async getHotelCodes(cityCode, force = false) {
    try {
      const redis = require("../redisService");
      const cacheKey = `tbo:static:hotelcodes:${cityCode}`;
      if (!force) {
        const cached = await redis.get(cacheKey);
        if (cached) return cached;
      }
      const res = await this.executeWithRetry(() =>
        this.hotelStaticClient.post("/HotelCodesList", {
          UserName: this.config.staticUserName?.trim(),
          Password: this.config.staticPassword,
          CityCode: cityCode,
        }),
      );
      const data = res.data?.HotelCodes || res.data?.Result || [];
      await (require("../redisService").set(cacheKey, data, 24 * 60 * 60));
      return data;
    } catch (e) {
      this.logger.error("TBO static HotelCodesList failed", { error: e.message });
      return [];
    }
  }

  /**
   * Static data: Hotel details by code
   */
  async getHotelDetails(hotelCode, force = false) {
    try {
      const redis = require("../redisService");
      const cacheKey = `tbo:static:hotel:${hotelCode}`;
      if (!force) {
        const cached = await redis.get(cacheKey);
        if (cached) return cached;
      }
      const res = await this.executeWithRetry(() =>
        this.hotelStaticClient.post("/HotelDetails", {
          UserName: this.config.staticUserName?.trim(),
          Password: this.config.staticPassword,
          HotelCode: hotelCode,
        }),
      );
      const data = res.data?.Hotel || res.data?.Result || null;
      await (require("../redisService").set(cacheKey, data, 24 * 60 * 60));
      return data;
    } catch (e) {
      this.logger.error("TBO static HotelDetails failed", { error: e.message });
      return null;
    }
  }

  /**
   * Sightseeing search (TBO doesn't provide sightseeing)
   */
  async searchSightseeing(searchParams) {
    this.logger.warn("Sightseeing search not supported by TBO adapter");
    return [];
  }

  /**
   * PreBook hotel
   */
  async preBookHotel(params) {
    const { mapFromResponse, mapFromAxiosError } = require("../tboErrorMapper");
    try {
      const tokenId = await this.getHotelToken();
      const payload = { TokenId: tokenId, EndUserIp: this.config.endUserIp, ...params };
      const res = await this.executeWithRetry(() => this.hotelSearchClient.post("/PreBook", payload));
      if (res.data?.Status === 1 || res.data?.IsPriceChanged !== undefined) {
        return res.data;
      }
      throw mapFromResponse(res);
    } catch (e) {
      if (!e.code) throw mapFromAxiosError(e);
      throw e;
    }
  }

  /**
   * Book hotel
   */
  async bookHotel(params) {
    const { mapFromResponse, mapFromAxiosError } = require("../tboErrorMapper");
    try {
      const tokenId = await this.getHotelToken();
      const payload = { TokenId: tokenId, EndUserIp: this.config.endUserIp, ...params };
      const res = await this.executeWithRetry(() => this.hotelBookingClient.post("/Book", payload));
      if (res.data?.Status === 1 || res.data?.BookingId || res.data?.ConfirmationNo) {
        return res.data;
      }
      throw mapFromResponse(res);
    } catch (e) {
      if (!e.code) throw mapFromAxiosError(e);
      throw e;
    }
  }

  /**
   * Generate voucher
   */
  async generateHotelVoucher(params) {
    const { mapFromResponse, mapFromAxiosError } = require("../tboErrorMapper");
    try {
      const tokenId = await this.getHotelToken();
      const payload = { TokenId: tokenId, EndUserIp: this.config.endUserIp, ...params };
      const res = await this.executeWithRetry(() => this.hotelBookingClient.post("/GenerateVoucher", payload), 5);
      if (res.data?.Status === 1 || res.data?.VoucherNo) {
        return res.data;
      }
      throw mapFromResponse(res);
    } catch (e) {
      if (!e.code) throw mapFromAxiosError(e);
      throw e;
    }
  }

  /**
   * Get booking details
   */
  async getHotelBookingDetails(params) {
    const { mapFromResponse, mapFromAxiosError } = require("../tboErrorMapper");
    try {
      const tokenId = await this.getHotelToken();
      const payload = { TokenId: tokenId, EndUserIp: this.config.endUserIp, ...params };
      const res = await this.executeWithRetry(() => this.hotelBookingClient.post("/GetBookingDetail", payload));
      if (res.data?.Status === 1) {
        return res.data;
      }
      throw mapFromResponse(res);
    } catch (e) {
      if (!e.code) throw mapFromAxiosError(e);
      throw e;
    }
  }

  /**
   * Cancel hotel booking (SendChangeRequest)
   */
  async cancelHotelBooking(params) {
    const { mapFromResponse, mapFromAxiosError } = require("../tboErrorMapper");
    try {
      const tokenId = await this.getHotelToken();
      const payload = { TokenId: tokenId, EndUserIp: this.config.endUserIp, RequestType: 1, Remarks: "User cancellation", ...params };
      const res = await this.executeWithRetry(() => this.hotelBookingClient.post("/SendChangeRequest", payload));
      if (res.data?.Status === 1) {
        return res.data;
      }
      throw mapFromResponse(res);
    } catch (e) {
      if (!e.code) throw mapFromAxiosError(e);
      throw e;
    }
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
