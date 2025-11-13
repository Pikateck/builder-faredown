/**
 * TBO (Travel Boutique Online) Universal JSON Hotel API Adapter
 * Fully aligned with TBO's JSON API specification
 * 
 * CRITICAL: This adapter uses ONLY the Universal JSON API with TokenId
 * NO legacy UserName/Password static endpoints
 * 
 * Reference: TBO email from Pavneet Kaur (Oct 17, 2025)
 */

const BaseSupplierAdapter = require("./baseSupplierAdapter");
const axios = require("axios");
const pool = require("../../database/connection");
const { tboRequest, tboVia } = require("../../lib/tboRequest");
const HotelNormalizer = require("../normalization/hotelNormalizer");

class TBOAdapter extends BaseSupplierAdapter {
  constructor(config = {}) {
    super("TBO", {
      // Flight API URLs (from TBO email)
      searchUrl: "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc",
      bookingUrl: "https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc",
      
      // Hotel API URLs (from TBO email - EXACT MATCH)
      hotelAuthUrl: "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate",
      hotelStaticBase: "https://apiwr.tboholidays.com/HotelAPI/",
      hotelSearchBase: "https://affiliate.travelboutiqueonline.com/HotelAPI/",
      hotelBookingBase: "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/",
      
      // Credentials (from TBO email)
      clientId: process.env.TBO_CLIENT_ID || "tboprod",
      userId: process.env.TBO_API_USER_ID || "BOMF145",
      password: process.env.TBO_API_PASSWORD || "@Bo#4M-Api@",
      
      // Static data credentials (DEPRECATED - will use TokenId instead)
      staticUserName: process.env.TBO_STATIC_USER || "travelcategory",
      staticPassword: process.env.TBO_STATIC_PASSWORD || "Tra@59334536",
      
      // Fixie proxy IPs (whitelisted by TBO)
      endUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
      
      timeout: 30000,
      ...config,
    });

    // Token management
    this.tokenId = null;
    this.tokenExpiry = null;
    
    // Diagnostics
    this._authAttempts = [];
    this._egressIp = null;

    this.logger.info("🏨 TBO Universal JSON Hotel API Adapter initialized", {
      authUrl: this.config.hotelAuthUrl,
      searchBase: this.config.hotelSearchBase,
      clientId: this.config.clientId,
      userId: this.config.userId,
      endUserIp: this.config.endUserIp
    });
  }

  /**
   * ========================================
   * 1. JSON AUTHENTICATION (Universal API)
   * ========================================
   * 
   * Follows TBO's JSON Auth spec EXACTLY:
   * - Request: { ClientId, UserName, Password, EndUserIp }
   * - Response: { Status, TokenId, Member, Error }
   * - TokenId valid for 24 hours
   */
  async getHotelToken(force = false) {
    // Return cached token if valid
    if (!force && this.tokenId && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      this.logger.info("✅ Using cached TBO TokenId", {
        expiresIn: Math.round((this.tokenExpiry - Date.now()) / 1000 / 60) + " minutes"
      });
      return this.tokenId;
    }

    // Try DB cache
    if (!force) {
      try {
        const cached = await this.getCachedHotelToken();
        if (cached && Date.now() < cached.expires_at) {
          this.tokenId = cached.token_id;
          this.tokenExpiry = cached.expires_at;
          this.logger.info("✅ Using DB-cached TBO TokenId");
          return this.tokenId;
        }
      } catch (err) {
        this.logger.warn("DB cache check failed:", err.message);
      }
    }

    // Authenticate - EXACT JSON format from TBO docs
    const authRequest = {
      ClientId: this.config.clientId,        // "tboprod"
      UserName: this.config.userId,          // "BOMF145"
      Password: this.config.password,        // "@Bo#4M-Api@"
      EndUserIp: this.config.endUserIp       // "52.5.155.132"
    };

    this.logger.info("🔐 TBO JSON Authentication Request", {
      url: this.config.hotelAuthUrl,
      clientId: authRequest.ClientId,
      userName: authRequest.UserName,
      endUserIp: authRequest.EndUserIp,
      via: tboVia()
    });

    // Log exact request (sanitized)
    this.logger.debug("📤 Auth Request JSON:", {
      ...authRequest,
      Password: "***"
    });

    try {
      const response = await tboRequest(this.config.hotelAuthUrl, {
        method: "POST",
        data: authRequest,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate" // COMPRESSION SUPPORT
        },
        timeout: this.config.timeout
      });

      this.logger.info("📥 TBO Auth Response", {
        httpStatus: response.status,
        status: response.data?.Status,
        hasTokenId: !!response.data?.TokenId,
        memberId: response.data?.Member?.MemberId,
        agencyId: response.data?.Member?.AgencyId,
        errorCode: response.data?.Error?.ErrorCode,
        errorMessage: response.data?.Error?.ErrorMessage
      });

      // Log full response for debugging
      this.logger.debug("📄 Full Auth Response:", JSON.stringify(response.data, null, 2));

      // Check success
      if (response.data?.Status !== 1) {
        const error = new Error(`TBO Auth failed: ${response.data?.Error?.ErrorMessage || "Unknown error"}`);
        error.code = "TBO_AUTH_FAILED";
        error.tboStatus = response.data?.Status;
        error.tboError = response.data?.Error;
        
        this._recordAuthAttempt({
          success: false,
          error: error.message,
          status: response.data?.Status
        });
        
        throw error;
      }

      if (!response.data?.TokenId) {
        throw new Error("TBO Auth succeeded but no TokenId returned");
      }

      // Store token (valid for 24 hours)
      this.tokenId = response.data.TokenId;
      this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);

      this._recordAuthAttempt({
        success: true,
        tokenLength: this.tokenId.length,
        expiresAt: new Date(this.tokenExpiry).toISOString()
      });

      // Cache in DB
      try {
        await this.cacheHotelToken(this.tokenId, this.tokenExpiry);
      } catch (err) {
        this.logger.warn("Failed to cache token in DB:", err.message);
      }

      this.logger.info("✅ TBO Authentication SUCCESS - TokenId obtained", {
        tokenLength: this.tokenId.length,
        expiresAt: new Date(this.tokenExpiry).toISOString()
      });

      return this.tokenId;

    } catch (error) {
      this.logger.error("❌ TBO Authentication FAILED", {
        message: error.message,
        httpStatus: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        url: this.config.hotelAuthUrl
      });

      this._recordAuthAttempt({
        success: false,
        error: error.message,
        httpStatus: error.response?.status
      });

      throw error;
    }
  }

  /**
   * ========================================
   * 2. DATE FORMATTING (dd/MM/yyyy)
   * ========================================
   */
  formatDateForTBO(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * ========================================
   * 3. STATIC DATA API (with TokenId)
   * ========================================
   * 
   * ALL static endpoints now use TokenId (not UserName/Password)
   */
  
  async getTboCountries(force = false) {
    const tokenId = await this.getHotelToken();
    
    const request = {
      ClientId: this.config.clientId,
      TokenId: tokenId,
      EndUserIp: this.config.endUserIp
    };

    this.logger.info("📍 Fetching TBO Country List (JSON)", { force });

    try {
      const response = await tboRequest(this.config.hotelStaticBase + "CountryList", {
        method: "POST",
        data: request,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate"
        },
        timeout: this.config.timeout
      });

      if (response.data?.Status !== 1) {
        throw new Error(`Country List failed: ${response.data?.Error?.ErrorMessage}`);
      }

      const countries = response.data?.Countries || [];
      this.logger.info(`✅ Retrieved ${countries.length} countries`);

      return countries.map(c => ({
        code: c.Code || c.CountryCode,
        name: c.Name || c.CountryName
      }));

    } catch (error) {
      this.logger.error("❌ TBO Country List failed:", error.message);
      return [];
    }
  }

  async getTboCities(countryCode, force = false) {
    if (!countryCode) return [];
    
    const tokenId = await this.getHotelToken();
    
    const request = {
      ClientId: this.config.clientId,
      TokenId: tokenId,
      EndUserIp: this.config.endUserIp,
      CountryCode: countryCode
    };

    this.logger.info("📍 Fetching TBO City List (JSON)", { countryCode, force });

    try {
      const response = await tboRequest(this.config.hotelStaticBase + "DestinationCityList", {
        method: "POST",
        data: request,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate"
        },
        timeout: this.config.timeout
      });

      if (response.data?.Status !== 1) {
        throw new Error(`City List failed: ${response.data?.Error?.ErrorMessage}`);
      }

      const cities = response.data?.Cities || [];
      this.logger.info(`✅ Retrieved ${cities.length} cities for ${countryCode}`);

      return cities.map(c => ({
        code: c.Code || c.CityCode || c.Id,
        name: c.Name || c.CityName,
        countryCode
      }));

    } catch (error) {
      this.logger.error("❌ TBO City List failed:", error.message);
      return [];
    }
  }

  /**
   * ========================================
   * 4. HOTEL SEARCH (GetHotelResult JSON)
   * ========================================
   * 
   * EXACT match with TBO's JSON specification:
   * - Endpoint: https://affiliate.travelboutiqueonline.com/HotelAPI/Search
   * - Date format: dd/MM/yyyy
   * - Uses TokenId + EndUserIp
   * - Field names EXACTLY as per docs
   */
  async searchHotels(searchParams) {
    const tokenId = await this.getHotelToken();

    const {
      destination,
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      rooms = 1,
      currency = "INR",
      guestNationality = "IN",
      countryCode = "AE"
    } = searchParams;

    // Get CityId from TBO (must be numeric ID, not code)
    let cityId;
    try {
      cityId = await this.getCityId(destination, countryCode);
      if (!cityId) {
        this.logger.warn("⚠️ CityId not found", { destination });
        return [];
      }
    } catch (err) {
      this.logger.error("Failed to get CityId:", err.message);
      throw err;
    }

    // Calculate NoOfNights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const noOfNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (noOfNights < 1) {
      throw new Error(`Invalid dates: ${checkIn} to ${checkOut}`);
    }

    // Build RoomGuests array
    const roomGuests = Array.isArray(rooms) 
      ? rooms.map(r => ({
          NoOfAdults: Number(r.adults) || 1,
          NoOfChild: Number(r.children) || 0,
          ChildAge: Array.isArray(r.childAges) ? r.childAges.map(a => Number(a)) : []
        }))
      : [{
          NoOfAdults: Number(adults) || 1,
          NoOfChild: Number(children) || 0,
          ChildAge: []
        }];

    // EXACT JSON request format from TBO docs
    const searchRequest = {
      EndUserIp: this.config.endUserIp,
      TokenId: tokenId,
      CheckInDate: this.formatDateForTBO(checkIn),
      NoOfNights: noOfNights,
      CountryCode: countryCode,
      CityId: cityId,
      PreferredCurrency: currency,
      GuestNationality: guestNationality,
      NoOfRooms: roomGuests.length,
      RoomGuests: roomGuests
    };

    this.logger.info("🔍 TBO Hotel Search Request (JSON)", {
      endpoint: this.config.hotelSearchBase + "Search",
      destination,
      cityId,
      checkIn: searchRequest.CheckInDate,
      noOfNights: searchRequest.NoOfNights,
      currency,
      via: tboVia()
    });

    // Log exact request (sanitized)
    this.logger.debug("📤 Search Request JSON:", {
      ...searchRequest,
      TokenId: tokenId.substring(0, 20) + "..."
    });

    try {
      const response = await tboRequest(this.config.hotelSearchBase + "Search", {
        method: "POST",
        data: searchRequest,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate"
        },
        timeout: this.config.timeout
      });

      this.logger.info("📥 TBO Search Response", {
        httpStatus: response.status,
        responseStatus: response.data?.ResponseStatus,
        hasHotelResults: !!response.data?.HotelResults,
        hotelCount: Array.isArray(response.data?.HotelResults) ? response.data.HotelResults.length : 0,
        hasTraceId: !!response.data?.TraceId,
        errorCode: response.data?.Error?.ErrorCode,
        errorMessage: response.data?.Error?.ErrorMessage
      });

      // Log full response for debugging (first time)
      if (!this._hasLoggedSearchResponse) {
        this.logger.debug("📄 Sample Search Response:", JSON.stringify(response.data, null, 2).substring(0, 2000));
        this._hasLoggedSearchResponse = true;
      }

      // Check ResponseStatus
      if (response.data?.ResponseStatus !== 1) {
        this.logger.warn("❌ TBO Search returned non-success status", {
          responseStatus: response.data?.ResponseStatus,
          error: response.data?.Error
        });
        return [];
      }

      const hotels = response.data?.HotelResults || [];
      
      if (hotels.length === 0) {
        this.logger.info("ℹ️ TBO returned 0 hotels for this search");
        return [];
      }

      this.logger.info(`✅ TBO Search SUCCESS - ${hotels.length} hotels found`);

      // Transform to our format
      return this.transformHotelResults(hotels, searchParams);

    } catch (error) {
      this.logger.error("❌ TBO Hotel Search FAILED", {
        message: error.message,
        httpStatus: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      return [];
    }
  }

  /**
   * ========================================
   * 5. TRANSFORM RESULTS
   * ========================================
   */
  transformHotelResults(hotels, searchParams) {
    const { checkIn, checkOut, currency = "INR", destination } = searchParams;

    return hotels.map((h, index) => {
      const hotelId = String(h.HotelCode || h.HotelId || index);
      const price = h.Price || {};

      return {
        hotelId,
        name: h.HotelName || h.Name || "Hotel",
        city: destination,
        price: parseFloat(price.OfferedPrice || price.PublishedPrice || 0),
        originalPrice: parseFloat(price.PublishedPrice || 0),
        currency: price.CurrencyCode || currency,
        supplier: "TBO",
        checkIn,
        checkOut,
        images: this.extractImages(h),
        amenities: h.HotelFacilities || [],
        starRating: parseFloat(h.StarRating) || 3,
        reviewScore: h.TripAdvisor?.Rating || 0,
        reviewCount: 0,
        location: h.HotelAddress || h.HotelLocation || "",
        isLiveData: true
      };
    });
  }

  extractImages(hotel) {
    const images = [];
    if (hotel.HotelPicture) images.push(hotel.HotelPicture);
    if (Array.isArray(hotel.Images)) {
      hotel.Images.forEach(img => {
        if (typeof img === "string") images.push(img);
        else if (img?.Url) images.push(img.Url);
      });
    }
    return images;
  }

  /**
   * ========================================
   * 6. HELPER METHODS
   * ========================================
   */
  
  async getCityId(cityCode, countryCode = "AE") {
    // Try cache first
    const cacheKey = `tbo_city_${cityCode}_${countryCode}`;
    
    try {
      const cached = await pool.query(
        `SELECT city_id FROM tbo_city_cache WHERE cache_key = $1 AND expires_at > NOW()`,
        [cacheKey]
      );
      if (cached.rows[0]) {
        return cached.rows[0].city_id;
      }
    } catch (err) {
      this.logger.warn("City cache check failed:", err.message);
    }

    // Fetch from TBO
    const cities = await this.getTboCities(countryCode);
    const city = cities.find(c => 
      c.code === cityCode || 
      c.name.toLowerCase() === cityCode.toLowerCase()
    );

    if (city && city.code) {
      // Cache for 7 days
      try {
        await pool.query(
          `INSERT INTO tbo_city_cache (cache_key, city_id, expires_at) 
           VALUES ($1, $2, NOW() + INTERVAL '7 days')
           ON CONFLICT (cache_key) DO UPDATE SET city_id = $2, expires_at = NOW() + INTERVAL '7 days'`,
          [cacheKey, city.code]
        );
      } catch (err) {
        this.logger.warn("City cache insert failed:", err.message);
      }

      return city.code;
    }

    return null;
  }

  async getCachedHotelToken() {
    try {
      const result = await pool.query(
        `SELECT token_id, expires_at FROM tbo_hotel_tokens 
         WHERE supplier = 'TBO' AND expires_at > NOW() 
         ORDER BY created_at DESC LIMIT 1`
      );
      return result.rows[0] || null;
    } catch (err) {
      return null;
    }
  }

  async cacheHotelToken(tokenId, expiresAt) {
    try {
      await pool.query(
        `INSERT INTO tbo_hotel_tokens (supplier, token_id, expires_at) 
         VALUES ('TBO', $1, $2)`,
        [tokenId, new Date(expiresAt)]
      );
    } catch (err) {
      this.logger.warn("Token cache failed:", err.message);
    }
  }

  _recordAuthAttempt(entry) {
    try {
      this._authAttempts.push({
        ts: new Date().toISOString(),
        supplier: "TBO",
        ...entry
      });
      if (this._authAttempts.length > 50) this._authAttempts.shift();
    } catch (err) {
      // Ignore
    }
  }
}

module.exports = TBOAdapter;
