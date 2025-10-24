/**
 * TBO (Travel Boutique Online) Supplier Adapter
 * Integrates with TBO API for flight data
 * API Docs: https://apidoc.tektravels.com/flight/NewReleases2025.aspx
 */

const BaseSupplierAdapter = require("./baseSupplierAdapter");
const axios = require("axios");
const pool = require("../../database/connection");
const { tboRequest, tboVia } = require("../../lib/tboRequest");
const { agentFor, proxyMode } = require("../../lib/proxy");
const HotelNormalizer = require("../normalization/hotelNormalizer");
const HotelDedupAndMergeUnified = require("../merging/hotelDedupAndMergeUnified");

class TBOAdapter extends BaseSupplierAdapter {
  constructor(config = {}) {
    const searchUrlRaw =
      process.env.TBO_SEARCH_URL ||
      "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc";
    const bookingUrlRaw =
      process.env.TBO_BOOKING_URL ||
      "https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc";
    const hotelAuthBaseRaw =
      process.env.TBO_HOTEL_BASE_URL_AUTHENTICATION ||
      "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc";

    super("TBO", {
      searchUrl: searchUrlRaw,
      bookingUrl: bookingUrlRaw,
      agencyId: process.env.TBO_AGENCY_ID,
      apiKey: process.env.TBO_CLIENT_ID || process.env.TBO_AGENCY_ID,
      endUserIp: process.env.TBO_END_USER_IP || "192.168.5.56",
      credentialMode: process.env.TBO_CREDENTIAL_MODE || "runtime",
      timeout: parseInt(process.env.TBO_TIMEOUT_MS || "15000"),
      requestsPerSecond: 10,
      // Hotel API specific configuration (live)
      hotelAuthBase: hotelAuthBaseRaw,
      hotelStaticBase:
        process.env.TBO_HOTEL_STATIC_DATA ||
        "https://apiwr.tboholidays.com/HotelAPI/",
      hotelSearchBase:
        process.env.TBO_HOTEL_SEARCH_PREBOOK ||
        "https://affiliate.travelboutiqueonline.com/HotelAPI/",
      hotelBookingBase:
        process.env.TBO_HOTEL_BOOKING ||
        "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/",
      hotelClientId:
        process.env.TBO_HOTEL_CLIENT_ID ||
        process.env.TBO_CLIENT_ID ||
        process.env.TBO_AGENCY_ID,
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

    // Auth client (SharedAPI /SharedData.svc) - used for flight token
    this.authClient = axios.create({
      baseURL: this.config.hotelAuthBase,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    // Separate hotel auth client to avoid accidental header/base mutations
    this.hotelAuthClient = axios.create({
      baseURL: this.config.hotelAuthBase,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    // Hotel-specific HTTP clients
    this.hotelStaticClient = axios.create({
      baseURL: this.config.hotelStaticBase,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    this.hotelSearchClient = axios.create({
      baseURL: this.config.hotelSearchBase,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    this.hotelBookingClient = axios.create({
      baseURL: this.config.hotelBookingBase,
      timeout: this.config.timeout,
      headers: { "Content-Type": "application/json" },
    });

    // Keep backward compatibility
    this.httpClient = this.searchClient;

    // Diagnostics: in-memory ring buffer for recent auth attempts
    this._authAttempts = [];
    this._egressIp = null;
    this._egressCheckedAt = 0;
  }

  // Diagnostics helpers
  async _getEgressIp(force = false) {
    try {
      const now = Date.now();
      if (
        !force &&
        this._egressIp &&
        now - this._egressCheckedAt < 10 * 60 * 1000
      ) {
        return this._egressIp;
      }
      const { data } = await axios.get("https://api.ipify.org?format=json", {
        timeout: 4000,
      });
      this._egressIp = data?.ip || null;
      this._egressCheckedAt = now;
      return this._egressIp;
    } catch {
      return this._egressIp;
    }
  }
  _recordAuthAttempt(entry) {
    try {
      const item = {
        ts: new Date().toISOString(),
        supplier: "TBO",
        ...entry,
      };
      this._authAttempts.push(item);
      if (this._authAttempts.length > 50) this._authAttempts.shift();
    } catch {}
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
          AgencyId: this.config.agencyId || process.env.TBO_AGENCY_ID,
        };

        this.logger.info(
          `TBO Auth Request: ClientId=${authRequest.ClientId}, UserName=${authRequest.UserName}, EndUserIp=${authRequest.EndUserIp}`,
        );

        const tryPaths = [
          "/Authenticate",
          "/Authenticate/",
          "/rest/Authenticate",
        ];
        let lastErr;
        for (const p of tryPaths) {
          try {
            const egress = await this._getEgressIp();
            const url = `${this.config.hotelAuthBase}${p}`;
            this.logger.info("TBO Auth attempt", { url, via: tboVia() });
            const res = await tboRequest(url, {
              method: "POST",
              data: authRequest,
              timeout: this.config.timeout,
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            });
            // HTML guard
            if (typeof res.data === "string" && /<html/i.test(res.data)) {
              throw new Error("HTML page returned");
            }
            if (res.data?.Status === 1 && res.data?.TokenId) {
              this.tokenId = res.data.TokenId;
              this.tokenExpiry = Date.now() + 55 * 60 * 1000;
              await this.cacheToken(this.tokenId, this.tokenExpiry);
              this._recordAuthAttempt({
                url,
                method: "POST",
                status: res.status || 200,
                bodySnippet: JSON.stringify(res.data).slice(0, 200),
                egressIp: egress,
              });
              this.logger.info("TBO authentication successful");
              return this.tokenId;
            }
            lastErr = new Error(
              `Auth failed: ${res.data?.Error?.ErrorMessage || JSON.stringify(res.data)}`,
            );
            this._recordAuthAttempt({
              url,
              method: "POST",
              status: res.status || 200,
              bodySnippet: JSON.stringify(res.data).slice(0, 200),
              egressIp: egress,
            });
          } catch (e) {
            lastErr = e;
            const status = e.response?.status;
            const body = e.response?.data;
            const egress = await this._getEgressIp();
            const url = `${this.config.hotelAuthBase}${p}`;
            this._recordAuthAttempt({
              url,
              method: "POST",
              status: status || null,
              bodySnippet:
                (typeof body === "string" ? body : JSON.stringify(body))?.slice(
                  0,
                  200,
                ) || String(e.message).slice(0, 200),
              egressIp: egress,
            });
            this.logger.error("TBO Auth attempt failed", {
              url,
              status,
              via: tboVia(),
              body:
                typeof body === "string"
                  ? body.slice(0, 200)
                  : JSON.stringify(body)?.slice(0, 200),
            });
            continue;
          }
        }
        throw lastErr || new Error("TBO authentication failed");
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
    if (
      this.hotelTokenId &&
      this.hotelTokenExpiry &&
      Date.now() < this.hotelTokenExpiry
    ) {
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
        AgencyId: this.config.agencyId || process.env.TBO_AGENCY_ID,
      };

      this.logger.info("🔐 TBO Hotel Auth Request Payload", {
        clientId: authRequest.ClientId,
        userName: authRequest.UserName,
        password: authRequest.Password ? "***" : "null",
        endUserIp: authRequest.EndUserIp,
        agencyId: authRequest.AgencyId,
        payloadJSON: JSON.stringify(authRequest),
      });

      const paths = ["/Authenticate", "/Authenticate/", "/rest/Authenticate"];
      let lastErr;
      for (const p of paths) {
        try {
          const egress = await this._getEgressIp();
          const url = `${this.config.hotelAuthBase}${p}`;
          this.logger.info("TBO Hotel Auth attempt", { url, via: tboVia() });
          const response = await tboRequest(url, {
            method: "POST",
            data: authRequest,
            timeout: this.config.timeout,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });
          if (
            typeof response.data === "string" &&
            /<html/i.test(response.data)
          ) {
            throw new Error("HTML page returned");
          }

          this.logger.info("TBO hotel auth response received", {
            url,
            status: response.status,
            statusText: response.statusText,
            dataStatus: response.data?.Status,
            hasTokenId: !!response.data?.TokenId,
            dataKeys: Object.keys(response.data || {}).slice(0, 10),
            responseHeaders: JSON.stringify(response.headers || {}),
            fullResponseData: JSON.stringify(response.data),
          });

          if (response.data?.Status === 1 && response.data?.TokenId) {
            // Cache token ~55 minutes (memory + DB)
            this.hotelTokenId = response.data.TokenId;
            this.hotelTokenExpiry = Date.now() + 55 * 60 * 1000;
            await this.cacheHotelToken(
              this.hotelTokenId,
              this.hotelTokenExpiry,
            );
            this._recordAuthAttempt({
              url,
              method: "POST",
              status: response.status || 200,
              bodySnippet: JSON.stringify(response.data).slice(0, 200),
              egressIp: egress,
              hotel: true,
            });
            this.logger.info("✅ TBO hotel authentication successful", {
              tokenLength: response.data.TokenId.length,
              expiryTime: new Date(this.hotelTokenExpiry).toISOString(),
            });
            return this.hotelTokenId;
          }

          this.logger.error("❌ TBO hotel auth response status not 1", {
            status: response.data?.Status,
            error: response.data?.Error,
            errorMessage: response.data?.Error?.ErrorMessage,
            errorCode: response.data?.Error?.ErrorCode,
            responseData: JSON.stringify(response.data),
            sentPayload: JSON.stringify(authRequest),
          });

          lastErr = new Error(
            `TBO Hotel auth failed: ${response.data?.Error?.ErrorMessage || JSON.stringify(response.data)}`,
          );
          this._recordAuthAttempt({
            url,
            method: "POST",
            status: response.status || 200,
            bodySnippet: JSON.stringify(response.data).slice(0, 200),
            egressIp: egress,
            hotel: true,
          });
        } catch (e) {
          lastErr = e;
          const status = e.response?.status;
          const body = e.response?.data;
          const egress = await this._getEgressIp();
          const url = `${this.config.hotelAuthBase}${p}`;
          this._recordAuthAttempt({
            url,
            method: "POST",
            status: status || null,
            bodySnippet:
              (typeof body === "string" ? body : JSON.stringify(body))?.slice(
                0,
                200,
              ) || String(e.message).slice(0, 200),
            egressIp: egress,
            hotel: true,
          });
          this.logger.error("TBO Hotel Auth attempt failed", {
            url,
            status,
            via: tboVia(),
            body:
              typeof body === "string"
                ? body.slice(0, 200)
                : JSON.stringify(body)?.slice(0, 200),
          });
          continue;
        }
      }
      throw lastErr || new Error("TBO Hotel auth failed");
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
      this.logger.warn("Hotel token cache lookup failed", {
        error: error.message,
      });
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
      this.logger.warn("Hotel token cache insert failed", {
        error: error.message,
      });
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

      let tokenId;
      try {
        tokenId = await this.getHotelToken();
        this.logger.info("✅ TBO hotel token obtained", {
          tokenId: tokenId ? `${tokenId.substring(0, 20)}...` : "null",
        });
      } catch (tokenError) {
        this.logger.error("❌ Failed to get TBO hotel token", {
          message: tokenError.message,
          stack: tokenError.stack?.split("\n")[0],
        });
        throw tokenError;
      }

      if (!tokenId) {
        throw new Error("TBO hotel token is null or empty");
      }

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
          ChildAge: Array.isArray(r.childAges)
            ? r.childAges.map((a) => Number(a) || 0)
            : [],
        }));
      } else {
        roomGuests = [
          {
            NoOfAdults: Number(adults) || 1,
            NoOfChild: Number(children) || 0,
            ChildAge: Array.isArray(childAges)
              ? childAges.map((a) => Number(a) || 0)
              : [],
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

      this.logger.info("📍 TBO hotel search payload", {
        url: `${this.config.hotelSearchBase}/Search`,
        destination,
        checkIn,
        checkOut,
        adults,
        children,
        currency,
        rooms: Array.isArray(rooms) ? rooms.length : rooms,
      });

      // Use retry wrapper
      let res;
      try {
        res = await this.executeWithRetry(() =>
          tboRequest(`${this.config.hotelSearchBase}/Search`, {
            method: "POST",
            data: payload,
            timeout: this.config.timeout,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
        );
        this.logger.info("✅ TBO search response received", {
          status: res.status,
          hasHotelResult: !!res.data?.HotelResult,
          hasHotels: !!res.data?.Hotels,
          dataKeys: Object.keys(res.data || {}).slice(0, 10),
          responseDataType: typeof res.data,
          responseDataLength: JSON.stringify(res.data).length,
        });
      } catch (apiError) {
        this.logger.error("❌ TBO search API call failed", {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          errorData: apiError.response?.data
            ? JSON.stringify(apiError.response.data).substring(0, 300)
            : "no error data",
          url: `${this.config.hotelSearchBase}/Search`,
          via: tboVia(),
        });
        throw apiError;
      }

      // Try multiple possible response keys for TBO hotels
      let hotels =
        res.data?.HotelResult ||
        res.data?.Hotels ||
        res.data?.hotel_result ||
        res.data?.Result ||
        res.data?.results ||
        res.data?.data ||
        (Array.isArray(res.data) ? res.data : []);

      this.logger.info("🏨 Hotels extracted from TBO response", {
        count: Array.isArray(hotels) ? hotels.length : 0,
        responseDataKeys: Object.keys(res.data || {}),
        detectedHotelsType: typeof hotels,
        isArray: Array.isArray(hotels),
      });

      // Ensure hotels is an array
      if (!Array.isArray(hotels)) {
        this.logger.warn("⚠️ TBO response hotels not in array format", {
          hotelsType: typeof hotels,
          hotelsValue: JSON.stringify(hotels).substring(0, 100),
        });
        hotels = [];
      }

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
        this.logger.warn("TBO persistToMasterSchema failed", {
          error: e.message,
        }),
      );

      // Determine requested max results
      const maxResults = Number.isFinite(parseInt(searchParams.maxResults, 10))
        ? Math.max(1, Math.min(parseInt(searchParams.maxResults, 10), 500))
        : 50;

      // Map to aggregator format and enrich with rates/images/amenities
      const results = hotels.slice(0, maxResults).map((h) => {
        const hotelId = String(h.HotelCode || h.HotelId || h.Id || "");
        // Build rates from Rooms[].Rates[]
        const rawRates = [];
        const roomsArr = Array.isArray(h.Rooms) ? h.Rooms : [];
        for (const room of roomsArr) {
          const rates = Array.isArray(room.Rates) ? room.Rates : [];
          for (const r of rates) {
            const base = parseFloat(r.NetFare || r.BasePrice || 0) || 0;
            const total =
              parseFloat(r.PublishedPrice || r.TotalPrice || base) || base;
            const refundable = !(r.IsNonRefundable === true);
            const policies = Array.isArray(r.CancellationPolicies)
              ? r.CancellationPolicies
              : r.CancellationPolicy
                ? [r.CancellationPolicy]
                : [];
            rawRates.push({
              rateKey:
                r.RateKey ||
                r.Token ||
                `${hotelId}_${room.RoomTypeCode || room.RoomTypeName || "room"}`,
              roomType:
                room.RoomTypeName || room.RoomType || r.RoomName || "Room",
              boardType: r.MealType || r.BoardType || r.Board || "Room Only",
              originalPrice: base,
              price: total,
              markedUpPrice: total,
              currency: r.Currency || currency,
              cancellationPolicy: policies,
              isRefundable: refundable,
              inclusions: r.Inclusions || r.Included || [],
            });
          }
        }

        // Images & amenities
        const images = [];
        if (Array.isArray(h.Images)) {
          h.Images.forEach((img) => {
            if (typeof img === "string" && img) images.push(img);
            else if (img?.Url) images.push(img.Url);
            else if (img?.url) images.push(img.url);
          });
        }
        if (h.ImageUrl) images.push(h.ImageUrl);
        if (h.ThumbnailUrl) images.push(h.ThumbnailUrl);

        const amenities =
          h.Amenities || h.Facilities || h.HotelFacilities || [];

        return {
          hotelId,
          name: h.HotelName || h.Name || "",
          city: destination,
          price:
            parseFloat(h.Price?.PublishedPrice) ||
            parseFloat(h.MinPrice) ||
            rawRates[0]?.price ||
            0,
          currency,
          supplier: "TBO",
          checkIn,
          checkOut,
          roomCode: h.Rooms?.[0]?.RoomTypeCode || "",
          rates: rawRates,
          images,
          amenities,
          starRating: parseFloat(h.StarRating) || undefined,
          reviewCount: h.ReviewCount || undefined,
          reviewScore: h.ReviewScore || undefined,
        };
      });

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
        supplier_hotel_id:
          h.supplierMapData?.supplier_hotel_id ||
          (h.rawHotel?.HotelCode || h.rawHotel?.Id
            ? String(h.rawHotel.HotelCode || h.rawHotel.Id)
            : null),
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
        tboRequest(`${this.config.hotelStaticBase}/CountryList`, {
          method: "POST",
          data: {
            UserName: this.config.staticUserName?.trim(),
            Password: this.config.staticPassword,
          },
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
      const data = res.data?.CountryList || res.data?.Result || [];
      await require("../redisService").set(cacheKey, data, 24 * 60 * 60);
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
        tboRequest(`${this.config.hotelStaticBase}/CityList`, {
          method: "POST",
          data: {
            UserName: this.config.staticUserName?.trim(),
            Password: this.config.staticPassword,
            CountryCode: countryCode,
          },
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
      const data = res.data?.CityList || res.data?.Result || [];
      await require("../redisService").set(cacheKey, data, 24 * 60 * 60);
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
        tboRequest(`${this.config.hotelStaticBase}/HotelCodesList`, {
          method: "POST",
          data: {
            UserName: this.config.staticUserName?.trim(),
            Password: this.config.staticPassword,
            CityCode: cityCode,
          },
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
      const data = res.data?.HotelCodes || res.data?.Result || [];
      await require("../redisService").set(cacheKey, data, 24 * 60 * 60);
      return data;
    } catch (e) {
      this.logger.error("TBO static HotelCodesList failed", {
        error: e.message,
      });
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
        tboRequest(`${this.config.hotelStaticBase}/HotelDetails`, {
          method: "POST",
          data: {
            UserName: this.config.staticUserName?.trim(),
            Password: this.config.staticPassword,
            HotelCode: hotelCode,
          },
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
      const data = res.data?.Hotel || res.data?.Result || null;
      await require("../redisService").set(cacheKey, data, 24 * 60 * 60);
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
      const payload = {
        TokenId: tokenId,
        EndUserIp: this.config.endUserIp,
        ...params,
      };
      const res = await this.executeWithRetry(() =>
        tboRequest(`${this.config.hotelSearchBase}/PreBook`, {
          method: "POST",
          data: payload,
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
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
      const payload = {
        TokenId: tokenId,
        EndUserIp: this.config.endUserIp,
        ...params,
      };
      const res = await this.executeWithRetry(() =>
        tboRequest(`${this.config.hotelBookingBase}/Book`, {
          method: "POST",
          data: payload,
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
      if (
        res.data?.Status === 1 ||
        res.data?.BookingId ||
        res.data?.ConfirmationNo
      ) {
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
      const payload = {
        TokenId: tokenId,
        EndUserIp: this.config.endUserIp,
        ...params,
      };
      const res = await this.executeWithRetry(
        () =>
          tboRequest(`${this.config.hotelBookingBase}/GenerateVoucher`, {
            method: "POST",
            data: payload,
            timeout: this.config.timeout,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
        5,
      );
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
      const payload = {
        TokenId: tokenId,
        EndUserIp: this.config.endUserIp,
        ...params,
      };
      const res = await this.executeWithRetry(() =>
        tboRequest(`${this.config.hotelBookingBase}/GetBookingDetail`, {
          method: "POST",
          data: payload,
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
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
      const payload = {
        TokenId: tokenId,
        EndUserIp: this.config.endUserIp,
        RequestType: 1,
        Remarks: "User cancellation",
        ...params,
      };
      const res = await this.executeWithRetry(() =>
        tboRequest(`${this.config.hotelBookingBase}/SendChangeRequest`, {
          method: "POST",
          data: payload,
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
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
      const last = this._authAttempts[this._authAttempts.length - 1] || null;
      return {
        healthy: false,
        supplier: "TBO",
        error: error.message,
        last_auth_attempt: last,
        timestamp: new Date().toISOString(),
      };
    }
  }
  /**
   * Get detailed hotel info (HOTEL INFO)
   */
  async getHotelInfo(params) {
    const { mapFromResponse, mapFromAxiosError } = require("../tboErrorMapper");
    try {
      const tokenId = await this.getHotelToken();
      const payload = {
        TokenId: tokenId,
        EndUserIp: this.config.endUserIp,
        ...params,
      };
      const res = await this.executeWithRetry(() =>
        tboRequest(`${this.config.hotelSearchBase}/HotelInfo`, {
          method: "POST",
          data: payload,
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
      if (res.data?.Status === 1) return res.data;
      throw mapFromResponse(res);
    } catch (e) {
      if (!e.code) throw mapFromAxiosError(e);
      throw e;
    }
  }

  /**
   * Get room details/pricing for a specific selection (HOTEL ROOM)
   */
  async getHotelRoom(params) {
    const { mapFromResponse, mapFromAxiosError } = require("../tboErrorMapper");
    try {
      const tokenId = await this.getHotelToken();
      const payload = {
        TokenId: tokenId,
        EndUserIp: this.config.endUserIp,
        ...params,
      };
      const res = await this.executeWithRetry(() =>
        tboRequest(`${this.config.hotelSearchBase}/HotelRoom`, {
          method: "POST",
          data: payload,
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
      if (res.data?.Status === 1) return res.data;
      throw mapFromResponse(res);
    } catch (e) {
      if (!e.code) throw mapFromAxiosError(e);
      throw e;
    }
  }

  /**
   * Static data: Top Destinations (popular cities)
   */
  async getTopDestinations(force = false) {
    try {
      const redis = require("../redisService");
      const cacheKey = `tbo:static:topdestinations`;
      if (!force) {
        const cached = await redis.get(cacheKey);
        if (cached) return cached;
      }
      const res = await this.executeWithRetry(() =>
        tboRequest(`${this.config.hotelStaticBase}/TopDestinations`, {
          method: "POST",
          data: {
            UserName: this.config.staticUserName?.trim(),
            Password: this.config.staticPassword,
          },
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
      const data = res.data?.CityList || res.data?.Result || [];
      await require("../redisService").set(cacheKey, data, 24 * 60 * 60);
      return data;
    } catch (e) {
      this.logger.error("TBO static TopDestinations failed", {
        error: e.message,
      });
      return [];
    }
  }

  /**
   * Get status of a previously submitted change/cancel request
   */
  async getChangeRequestStatus(params) {
    const { mapFromResponse, mapFromAxiosError } = require("../tboErrorMapper");
    try {
      const tokenId = await this.getHotelToken();
      const payload = {
        TokenId: tokenId,
        EndUserIp: this.config.endUserIp,
        ...params,
      };
      const res = await this.executeWithRetry(() =>
        tboRequest(`${this.config.hotelBookingBase}/GetChangeRequestStatus`, {
          method: "POST",
          data: payload,
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
      if (res.data?.Status === 1) return res.data;
      throw mapFromResponse(res);
    } catch (e) {
      if (!e.code) throw mapFromAxiosError(e);
      throw e;
    }
  }

  /**
   * Logout tokens (best-effort)
   */
  async logoutAll() {
    try {
      // Flight token logout
      if (this.tokenId) {
        try {
          await this.httpClient.post("/Logout", {
            TokenId: this.tokenId,
            EndUserIp: this.config.endUserIp,
          });
        } catch {}
      }
      // Hotel token logout
      if (this.hotelTokenId) {
        try {
          await tboRequest(`${this.config.hotelAuthBase}/Logout`, {
            method: "POST",
            data: {
              TokenId: this.hotelTokenId,
              EndUserIp: this.config.endUserIp,
            },
            timeout: this.config.timeout,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });
        } catch {}
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Sync TBO cities to cache for fast typeahead search
   * Fetches countries, cities, and airports; stores to tbo_cities table
   */
  async syncCitiesToCache() {
    try {
      const db = require("../../database/connection");

      // Fetch all countries
      const countries = await this.getCountryList(true);
      if (!Array.isArray(countries)) return { synced: 0 };

      let totalSynced = 0;

      // For each country, fetch cities
      for (const country of countries) {
        const countryCode = country.CountryCode || country.code;
        if (!countryCode) continue;

        const cities = await this.getCityList(countryCode, true);
        if (!Array.isArray(cities)) continue;

        for (const city of cities) {
          const cityCode = city.CityCode || city.code;
          const cityName = city.CityName || city.name;
          if (!cityCode || !cityName) continue;

          // Upsert to tbo_cities
          await db.query(
            `INSERT INTO tbo_cities (
              city_code, city_name, country_code, country_name, type, last_seen_at, synced_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (city_code) DO UPDATE SET
              last_seen_at = NOW(),
              synced_at = NOW(),
              is_active = true`,
            [
              cityCode,
              cityName,
              countryCode,
              country.CountryName || country.name,
              "CITY",
            ],
          );
          totalSynced++;
        }
      }

      this.logger.info("TBO cities synced", { synced: totalSynced });
      return { synced: totalSynced };
    } catch (e) {
      this.logger.error("TBO city sync failed", { error: e.message });
      return { synced: 0, error: e.message };
    }
  }

  /**
   * Seed top global cities into tbo_cities table
   * Used as fallback when table is empty
   */
  async seedTopCities() {
    try {
      const db = require("../../database/connection");
      const TOP_CITIES = [
        // Europe
        {
          code: "PAR",
          name: "Paris",
          country: "FR",
          countryName: "France",
          lat: 48.8566,
          lng: 2.3522,
        },
        {
          code: "LON",
          name: "London",
          country: "GB",
          countryName: "United Kingdom",
          lat: 51.5074,
          lng: -0.1278,
        },
        {
          code: "ROM",
          name: "Rome",
          country: "IT",
          countryName: "Italy",
          lat: 41.9028,
          lng: 12.4964,
        },
        {
          code: "BCN",
          name: "Barcelona",
          country: "ES",
          countryName: "Spain",
          lat: 41.3874,
          lng: 2.1686,
        },
        {
          code: "MAD",
          name: "Madrid",
          country: "ES",
          countryName: "Spain",
          lat: 40.4168,
          lng: -3.7038,
        },
        // Asia
        {
          code: "DXB",
          name: "Dubai",
          country: "AE",
          countryName: "United Arab Emirates",
          lat: 25.2048,
          lng: 55.2708,
        },
        {
          code: "BKK",
          name: "Bangkok",
          country: "TH",
          countryName: "Thailand",
          lat: 13.7563,
          lng: 100.5018,
        },
        {
          code: "SIN",
          name: "Singapore",
          country: "SG",
          countryName: "Singapore",
          lat: 1.3521,
          lng: 103.8198,
        },
        {
          code: "TYO",
          name: "Tokyo",
          country: "JP",
          countryName: "Japan",
          lat: 35.6762,
          lng: 139.6503,
        },
        {
          code: "DEL",
          name: "Delhi",
          country: "IN",
          countryName: "India",
          lat: 28.7041,
          lng: 77.1025,
        },
        {
          code: "BOM",
          name: "Mumbai",
          country: "IN",
          countryName: "India",
          lat: 19.076,
          lng: 72.8777,
        },
        // Americas
        {
          code: "NYC",
          name: "New York",
          country: "US",
          countryName: "United States",
          lat: 40.7128,
          lng: -74.006,
        },
        {
          code: "LAX",
          name: "Los Angeles",
          country: "US",
          countryName: "United States",
          lat: 34.0522,
          lng: -118.2437,
        },
        {
          code: "MIA",
          name: "Miami",
          country: "US",
          countryName: "United States",
          lat: 25.7617,
          lng: -80.1918,
        },
        // Middle East
        {
          code: "AUH",
          name: "Abu Dhabi",
          country: "AE",
          countryName: "United Arab Emirates",
          lat: 24.4539,
          lng: 54.3773,
        },
      ];

      for (const city of TOP_CITIES) {
        try {
          await db.query(
            `INSERT INTO tbo_cities (
              city_code, city_name, country_code, country_name,
              type, latitude, longitude, is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            ON CONFLICT (city_code) DO UPDATE SET
              updated_at = NOW(),
              is_active = true`,
            [
              city.code,
              city.name,
              city.country,
              city.countryName,
              "CITY",
              city.lat,
              city.lng,
              true,
            ],
          );
        } catch (e) {
          this.logger.warn(`Failed to seed city ${city.code}:`, e.message);
        }
      }

      this.logger.info("Top cities seeded successfully", {
        count: TOP_CITIES.length,
      });
    } catch (e) {
      this.logger.error("Failed to seed top cities:", e.message);
    }
  }

  /**
   * Search cities by text with ranking
   * Ranking: starts-with > contains; break ties by longer match
   * Optionally filter by country
   */
  async searchCities(searchText, limit = 15, countryCode = null) {
    try {
      const db = require("../../database/connection");
      const text = (searchText || "").trim().toLowerCase();

      // Check if table exists
      const tableCheckResult = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'tbo_cities'
        ) as table_exists;
      `);

      if (!tableCheckResult.rows[0].table_exists) {
        this.logger.warn("tbo_cities table does not exist");
        return [];
      }

      // Check if table is empty and seed with top destinations if needed
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM tbo_cities WHERE is_active = true`,
      );

      if (countResult.rows[0].count === 0) {
        this.logger.info(
          "TBO cities table is empty, seeding with top destinations",
        );
        await this.seedTopCities();
      }

      // If no search text, return popular cities
      if (!text || text.length < 1) {
        const result = await db.query(
          `
          SELECT
            city_code, city_name, country_code, country_name,
            region_code, region_name, type, latitude, longitude
          FROM tbo_cities
          WHERE is_active = true
          ORDER BY city_name ASC
          LIMIT $1
        `,
          [limit],
        );

        return result.rows.map((row) => ({
          id: row.city_code,
          code: row.city_code,
          name: row.city_name,
          region: row.region_name || null,
          countryCode: row.country_code,
          countryName: row.country_name,
          lat: row.latitude,
          lng: row.longitude,
        }));
      }

      let query = `
        SELECT
          city_code, city_name, country_code, country_name,
          region_code, region_name, type, latitude, longitude
        FROM tbo_cities
        WHERE is_active = true
      `;
      const params = [];

      // Optional country filter
      if (countryCode) {
        query += ` AND country_code = $1`;
        params.push(countryCode.toUpperCase());
      }

      // Text search with ranking (starts-with > contains)
      const paramIndex = params.length + 1;
      query += `
        AND (
          LOWER(city_name) LIKE $${paramIndex}
          OR LOWER(city_code) LIKE $${paramIndex}
        )
        ORDER BY
          CASE
            WHEN LOWER(city_name) LIKE $${paramIndex} THEN 0  -- exact/prefix match
            ELSE 1                                              -- contains match
          END,
          LENGTH(city_name) DESC,  -- longer names first (tie-breaker)
          city_name ASC
        LIMIT $${paramIndex + 1}
      `;
      params.push(`${text}%`, limit);

      const result = await db.query(query, params);

      return result.rows.map((row) => ({
        id: row.city_code,
        code: row.city_code,
        name: row.city_name,
        region: row.region_name || null,
        countryCode: row.country_code,
        countryName: row.country_name,
        lat: row.latitude,
        lng: row.longitude,
        type: row.type || "CITY",
        displayLabel: `${row.city_name}${row.country_name ? ", " + row.country_name : ""}`,
      }));
    } catch (e) {
      this.logger.error("TBO city search failed", {
        search: searchText,
        error: e.message,
      });
      return [];
    }
  }

  /**
   * Convert raw TBO search result to UnifiedHotel format
   * Handles room pricing, taxes, fees, and cancellation rules
   */
  static toUnifiedHotel(rawHotel, searchContext = {}) {
    try {
      const hotelId = String(
        rawHotel.HotelCode || rawHotel.HotelId || rawHotel.Id || "",
      );

      // Build rates/rooms from Rooms[].Rates[]
      const rooms = [];
      const roomsArr = Array.isArray(rawHotel.Rooms) ? rawHotel.Rooms : [];

      for (const room of roomsArr) {
        const rates = Array.isArray(room.Rates) ? room.Rates : [];

        for (const rate of rates) {
          const basePrice =
            parseFloat(rate.NetFare || rate.BasePrice || 0) || 0;
          const totalPrice =
            parseFloat(rate.PublishedPrice || rate.TotalPrice || basePrice) ||
            basePrice;
          const taxes = totalPrice - basePrice;

          const cancellationPolicies = [];
          if (Array.isArray(rate.CancellationPolicies)) {
            cancellationPolicies.push(...rate.CancellationPolicies);
          } else if (rate.CancellationPolicy) {
            cancellationPolicies.push(rate.CancellationPolicy);
          }

          rooms.push({
            roomId:
              room.RoomTypeCode ||
              room.RoomTypeName ||
              `room_${hotelId}_${room.RoomType || "standard"}`,
            roomName: room.RoomTypeName || room.RoomType || "Room",
            board: rate.MealType || rate.BoardType || rate.Board || "RO",
            occupants: {
              adults: parseInt(searchContext.adults || 2),
              children: parseInt(searchContext.children || 0),
            },
            price: {
              base: basePrice,
              taxes: taxes,
              total: totalPrice,
              currency: rate.Currency || searchContext.currency || "INR",
            },
            cancellation: cancellationPolicies,
            payType: rate.PayType || "at_hotel",
            rateKey:
              rate.RateKey ||
              rate.Token ||
              `${hotelId}_${room.RoomTypeCode || room.RoomTypeName}`,
          });
        }
      }

      // Images
      const images = [];
      if (Array.isArray(rawHotel.Images)) {
        rawHotel.Images.forEach((img) => {
          if (typeof img === "string" && img) images.push(img);
          else if (img?.Url) images.push(img.Url);
          else if (img?.url) images.push(img.url);
        });
      }
      if (rawHotel.ImageUrl) images.push(rawHotel.ImageUrl);
      if (rawHotel.ThumbnailUrl) images.push(rawHotel.ThumbnailUrl);

      // Amenities
      const amenities = rawHotel.Amenities || rawHotel.Facilities || [];

      return {
        supplier: "TBO",
        supplierHotelId: hotelId,
        name: rawHotel.HotelName || rawHotel.Name || "",
        address: rawHotel.Address || rawHotel.address || "",
        city: searchContext.destination || rawHotel.CityName || "",
        countryCode: rawHotel.CountryCode || rawHotel.CountryName || "",
        location: {
          lat: parseFloat(rawHotel.Latitude) || null,
          lng: parseFloat(rawHotel.Longitude) || null,
        },
        rating: parseFloat(rawHotel.StarRating) || 0,
        images,
        amenities,
        minTotal:
          rooms.length > 0 ? Math.min(...rooms.map((r) => r.price.total)) : 0,
        currency: searchContext.currency || "INR",
        taxesAndFees: {
          included: rooms.length > 0,
          excluded:
            rooms.length > 0 &&
            rooms.some((r) => r.price.taxes > 0) &&
            !rawHotel.TaxesIncluded,
          text:
            rooms.length > 0 && rooms.some((r) => r.payType === "at_hotel")
              ? "Taxes & fees payable at hotel"
              : "",
        },
        refundable:
          rooms.length > 0 &&
          rooms.some((r) => r.cancellation && r.cancellation.length > 0),
        rooms,
      };
    } catch (e) {
      console.error("Error converting TBO hotel to UnifiedHotel", {
        hotel: rawHotel,
        error: e.message,
      });
      return null;
    }
  }

  /**
   * Persist search snapshot to database for later retrieval
   * Stores hotel_unified and room_offer_unified records
   */
  async persistSearchSnapshot(searchId, hotels, searchContext) {
    try {
      const db = require("../../database/connection");

      for (const hotel of hotels) {
        const unifiedHotel = TBOAdapter.toUnifiedHotel(hotel, searchContext);
        if (!unifiedHotel) continue;

        // Insert/upsert hotel_unified
        await db.query(
          `INSERT INTO hotel_unified (
            property_id, supplier_code, supplier_hotel_id, hotel_name,
            address, city, country, lat, lng, star_rating, amenities_json
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          ) ON CONFLICT (supplier_code, supplier_hotel_id) DO UPDATE SET
            updated_at = NOW()
          RETURNING property_id`,
          [
            "TBO",
            unifiedHotel.supplierHotelId,
            unifiedHotel.name,
            unifiedHotel.address,
            unifiedHotel.city,
            unifiedHotel.countryCode,
            unifiedHotel.location.lat,
            unifiedHotel.location.lng,
            unifiedHotel.rating,
            JSON.stringify(unifiedHotel.amenities),
          ],
        );

        // Insert room offers
        for (const room of unifiedHotel.rooms) {
          await db.query(
            `INSERT INTO room_offer_unified (
              offer_id, property_id, supplier_code, room_name,
              board_basis, refundable, occupancy_adults, occupancy_children,
              currency, price_base, price_taxes, price_total,
              rate_key_or_token, search_checkin, search_checkout,
              hotel_name, city, created_at
            ) VALUES (
              gen_random_uuid(),
              (SELECT property_id FROM hotel_unified
               WHERE supplier_code = 'TBO' AND supplier_hotel_id = $1),
              $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
            )`,
            [
              unifiedHotel.supplierHotelId,
              "TBO",
              room.roomName,
              room.board,
              unifiedHotel.refundable,
              room.occupants.adults,
              room.occupants.children,
              room.price.currency,
              room.price.base,
              room.price.taxes,
              room.price.total,
              room.rateKey,
              searchContext.checkIn,
              searchContext.checkOut,
              unifiedHotel.name,
              unifiedHotel.city,
            ],
          );
        }
      }
    } catch (e) {
      this.logger.warn("Failed to persist search snapshot", {
        error: e.message,
      });
    }
  }
}

module.exports = TBOAdapter;
