/**
 * TBO Static Data Service
 * Syncs TBO static data to hotels_master_inventory table
 * Handles: Countries, Cities, Hotels, Hotel Details
 */

const axios = require("axios");
const pool = require("../database/connection");
const { tboVia } = require("../lib/tboRequest");
const winston = require("winston");
const { v4: uuidv4 } = require("uuid");

class TBOStaticDataService {
  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] [TBO_SYNC] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
        }),
      ),
      transports: [new winston.transports.Console()],
    });

    // TBO configuration
    this.config = {
      staticUserName: process.env.TBO_STATIC_USER || "travelcategory",
      staticPassword: process.env.TBO_STATIC_PASSWORD || "Tra@59334536",
      baseUrl:
        process.env.TBO_HOTEL_STATIC_DATA ||
        "https://apiwr.tboholidays.com/HotelAPI/",
      timeout: 30000,
    };

    this.traceId = null;
  }

  /**
   * Get TBO authentication token for static data APIs
   */
  async getStaticAuthToken() {
    try {
      const authUrl = `${this.config.baseUrl}SharedData.svc/rest/Authenticate`;

      const requestPayload = {
        ClientId: "tboprod",
        UserName: this.config.staticUserName,
        Password: this.config.staticPassword,
        EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
      };

      this.logger.info("Fetching TBO static data auth token", { authUrl });

      const response = await tboVia(
        axios.post(authUrl, requestPayload, {
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );

      if (response.data?.TokenId) {
        this.logger.info("TBO auth token obtained successfully");
        return response.data.TokenId;
      }

      throw new Error(
        `Failed to get auth token: ${response.data?.Error || "Unknown error"}`,
      );
    } catch (error) {
      this.logger.error("Failed to get static auth token:", error.message);
      throw error;
    }
  }

  /**
   * Fetch countries from TBO static API
   */
  async fetchCountries(tokenId) {
    try {
      const url = `${this.config.baseUrl}StaticData.svc/rest/GetCountries`;

      const requestPayload = {
        TokenId: tokenId,
        EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
      };

      this.logger.info("Fetching countries from TBO", { url });

      const response = await tboVia(
        axios.post(url, requestPayload, {
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );

      if (response.data?.Countries) {
        this.logger.info("Countries fetched successfully", {
          count: response.data.Countries.length,
        });
        return response.data.Countries;
      }

      return [];
    } catch (error) {
      this.logger.error("Failed to fetch countries:", error.message);
      return [];
    }
  }

  /**
   * Fetch cities for a country from TBO static API
   */
  async fetchCities(tokenId, countryCode) {
    try {
      const url = `${this.config.baseUrl}StaticData.svc/rest/GetCities`;

      const requestPayload = {
        TokenId: tokenId,
        CountryCode: countryCode,
        EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
      };

      this.logger.info("Fetching cities for country", { countryCode, url });

      const response = await tboVia(
        axios.post(url, requestPayload, {
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );

      if (response.data?.Cities) {
        this.logger.info("Cities fetched successfully", {
          countryCode,
          count: response.data.Cities.length,
        });
        return response.data.Cities;
      }

      return [];
    } catch (error) {
      this.logger.error("Failed to fetch cities:", {
        countryCode,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Fetch hotels for a city from TBO static API
   */
  async fetchHotelsForCity(tokenId, cityId) {
    try {
      const url = `${this.config.baseUrl}StaticData.svc/rest/GetHotels`;

      const requestPayload = {
        TokenId: tokenId,
        CityId: cityId,
        EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
      };

      this.logger.info("Fetching hotels for city", { cityId, url });

      const response = await tboVia(
        axios.post(url, requestPayload, {
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );

      if (response.data?.Hotels) {
        this.logger.info("Hotels fetched successfully", {
          cityId,
          count: response.data.Hotels.length,
        });
        return response.data.Hotels;
      }

      return [];
    } catch (error) {
      this.logger.error("Failed to fetch hotels:", {
        cityId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Fetch hotel details from TBO static API
   */
  async fetchHotelDetails(tokenId, hotelCode) {
    try {
      const url = `${this.config.baseUrl}StaticData.svc/rest/GetHotelDetails`;

      const requestPayload = {
        TokenId: tokenId,
        HotelCode: hotelCode,
        EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
      };

      this.logger.debug("Fetching hotel details", { hotelCode });

      const response = await tboVia(
        axios.post(url, requestPayload, {
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );

      if (response.data?.HotelDetails) {
        return response.data.HotelDetails;
      }

      return null;
    } catch (error) {
      this.logger.debug("Failed to fetch hotel details:", {
        hotelCode,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Upsert a hotel into hotels_master_inventory
   */
  async upsertHotel(supplierCode, hotel, cityInfo) {
    try {
      const query = `
        INSERT INTO public.hotels_master_inventory (
          supplier_code,
          supplier_hotel_code,
          unified_hotel_code,
          name,
          description,
          city_id,
          city_name,
          country_code,
          country_name,
          region_code,
          region_name,
          latitude,
          longitude,
          star_rating,
          phone,
          email,
          website,
          address_line_1,
          address_line_2,
          postal_code,
          amenities,
          supplier_metadata,
          last_synced_at,
          sync_status,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        ON CONFLICT (supplier_code, supplier_hotel_code) 
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          star_rating = EXCLUDED.star_rating,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          website = EXCLUDED.website,
          address_line_1 = EXCLUDED.address_line_1,
          address_line_2 = EXCLUDED.address_line_2,
          postal_code = EXCLUDED.postal_code,
          amenities = EXCLUDED.amenities,
          supplier_metadata = EXCLUDED.supplier_metadata,
          last_synced_at = EXCLUDED.last_synced_at,
          sync_status = EXCLUDED.sync_status,
          is_active = EXCLUDED.is_active
        RETURNING id
      `;

      const values = [
        supplierCode,
        hotel.HotelCode || hotel.hotelCode,
        hotel.HotelCode || hotel.hotelCode, // For now, unified = supplier code
        hotel.HotelName || hotel.name || "",
        hotel.Description || hotel.description || "",
        cityInfo?.CityId || hotel.CityId || null,
        cityInfo?.CityName || hotel.CityName || "",
        cityInfo?.CountryCode || hotel.CountryCode || null,
        cityInfo?.CountryName || hotel.CountryName || "",
        cityInfo?.RegionCode || null,
        cityInfo?.RegionName || null,
        hotel.Latitude || null,
        hotel.Longitude || null,
        hotel.StarRating || null,
        hotel.Phone || null,
        hotel.Email || null,
        hotel.Website || null,
        hotel.AddressLine1 || hotel.Address || null,
        hotel.AddressLine2 || null,
        hotel.PostalCode || null,
        hotel.Amenities ? JSON.stringify(hotel.Amenities) : null,
        JSON.stringify({
          tboHotelCode: hotel.HotelCode,
          tboCountryCode: hotel.CountryCode,
          tboCityCode: hotel.CityId,
          originalData: hotel,
        }),
        new Date().toISOString(),
        "success",
        true,
      ];

      const result = await pool.query(query, values);
      return result.rows[0]?.id;
    } catch (error) {
      this.logger.error("Failed to upsert hotel:", {
        hotelCode: hotel.HotelCode,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Sync all hotels for a city
   */
  async syncCityHotels(tokenId, cityInfo) {
    try {
      this.logger.info("Starting city hotel sync", {
        cityId: cityInfo.CityId,
        cityName: cityInfo.CityName,
      });

      const hotels = await this.fetchHotelsForCity(tokenId, cityInfo.CityId);
      let syncedCount = 0;
      let failedCount = 0;

      for (const hotel of hotels) {
        try {
          const hotelId = await this.upsertHotel("TBO", hotel, cityInfo);
          if (hotelId) {
            syncedCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
          this.logger.error("Failed to sync hotel:", {
            hotelCode: hotel.HotelCode,
            error: error.message,
          });
        }
      }

      this.logger.info("City hotel sync completed", {
        cityId: cityInfo.CityId,
        synced: syncedCount,
        failed: failedCount,
      });

      return {
        cityId: cityInfo.CityId,
        synced: syncedCount,
        failed: failedCount,
      };
    } catch (error) {
      this.logger.error("Failed to sync city hotels:", error.message);
      return {
        cityId: cityInfo.CityId,
        synced: 0,
        failed: hotels.length,
      };
    }
  }

  /**
   * Full sync workflow: Countries -> Cities -> Hotels
   */
  async fullSync(options = {}) {
    const startTime = Date.now();
    this.traceId = uuidv4();

    this.logger.info("Starting full TBO static data sync", {
      traceId: this.traceId,
      options,
    });

    const results = {
      traceId: this.traceId,
      startTime: new Date().toISOString(),
      countriesProcessed: 0,
      citiesProcessed: 0,
      hotelsProcessed: 0,
      errors: [],
    };

    try {
      // Step 1: Get auth token
      const tokenId = await this.getStaticAuthToken();
      if (!tokenId) {
        throw new Error("Failed to get authentication token");
      }

      // Step 2: Fetch countries
      const countries = await this.fetchCountries(tokenId);
      if (countries.length === 0) {
        throw new Error("No countries returned from TBO");
      }

      results.countriesProcessed = countries.length;
      this.logger.info(`Processing ${countries.length} countries`);

      // Limit to specific countries if provided in options
      const countriesToProcess = options.countryCodes
        ? countries.filter((c) => options.countryCodes.includes(c.CountryCode))
        : countries.slice(0, options.countryLimit || 5); // Default: first 5 countries

      // Step 3: For each country, fetch cities and hotels
      for (const country of countriesToProcess) {
        try {
          this.logger.info(`Processing country: ${country.CountryName}`);

          const cities = await this.fetchCities(tokenId, country.CountryCode);
          results.citiesProcessed += cities.length;

          // Limit cities if provided
          const citiesToProcess = options.cityLimit
            ? cities.slice(0, options.cityLimit)
            : cities;

          for (const city of citiesToProcess) {
            try {
              const syncResult = await this.syncCityHotels(tokenId, city);
              results.hotelsProcessed += syncResult.synced;

              if (syncResult.failed > 0) {
                results.errors.push({
                  city: city.CityName,
                  failedCount: syncResult.failed,
                });
              }

              // Add a small delay between city syncs to avoid overwhelming the API
              await this.delay(500);
            } catch (error) {
              this.logger.error("Failed to process city:", {
                city: city.CityName,
                error: error.message,
              });
              results.errors.push({
                city: city.CityName,
                error: error.message,
              });
            }
          }
        } catch (error) {
          this.logger.error("Failed to process country:", {
            country: country.CountryName,
            error: error.message,
          });
          results.errors.push({
            country: country.CountryName,
            error: error.message,
          });
        }
      }

      const durationMs = Date.now() - startTime;
      results.endTime = new Date().toISOString();
      results.durationMs = durationMs;

      this.logger.info("Full sync completed successfully", {
        traceId: this.traceId,
        durationMs,
        hotelsProcessed: results.hotelsProcessed,
        errors: results.errors.length,
      });

      return results;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      results.endTime = new Date().toISOString();
      results.durationMs = durationMs;
      results.error = error.message;

      this.logger.error("Full sync failed:", {
        traceId: this.traceId,
        error: error.message,
        durationMs,
      });

      return results;
    }
  }

  /**
   * Sync specific cities
   */
  async syncSpecificCities(countryCodes, cityIds = null) {
    const startTime = Date.now();
    this.traceId = uuidv4();

    const results = {
      traceId: this.traceId,
      startTime: new Date().toISOString(),
      citiesProcessed: 0,
      hotelsProcessed: 0,
      errors: [],
    };

    try {
      const tokenId = await this.getStaticAuthToken();
      if (!tokenId) {
        throw new Error("Failed to get authentication token");
      }

      for (const countryCode of countryCodes) {
        try {
          const cities = await this.fetchCities(tokenId, countryCode);
          const citiesToSync = cityIds
            ? cities.filter((c) => cityIds.includes(c.CityId))
            : cities;

          for (const city of citiesToSync) {
            try {
              const syncResult = await this.syncCityHotels(tokenId, city);
              results.citiesProcessed++;
              results.hotelsProcessed += syncResult.synced;

              if (syncResult.failed > 0) {
                results.errors.push({
                  city: city.CityName,
                  failedCount: syncResult.failed,
                });
              }

              await this.delay(500);
            } catch (error) {
              results.errors.push({
                city: city.CityName,
                error: error.message,
              });
            }
          }
        } catch (error) {
          results.errors.push({
            country: countryCode,
            error: error.message,
          });
        }
      }

      const durationMs = Date.now() - startTime;
      results.endTime = new Date().toISOString();
      results.durationMs = durationMs;

      return results;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      results.endTime = new Date().toISOString();
      results.durationMs = durationMs;
      results.error = error.message;

      return results;
    }
  }

  /**
   * Utility: delay function
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get sync status from database
   */
  async getSyncStatus() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_hotels,
          COUNT(*) FILTER (WHERE sync_status = 'success') as synced_hotels,
          COUNT(*) FILTER (WHERE sync_status = 'failed') as failed_hotels,
          MAX(last_synced_at) as last_sync_time,
          COUNT(DISTINCT city_id) as cities
        FROM public.hotels_master_inventory
        WHERE supplier_code = 'TBO'
      `;

      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      this.logger.error("Failed to get sync status:", error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new TBOStaticDataService();
