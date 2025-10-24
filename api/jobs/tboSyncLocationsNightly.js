/**
 * TBO Sync Locations Nightly
 * Runs daily at 02:00 IST for delta sync and cache refresh
 * Scheduled via Render Cron Job
 */

const db = require("../database/connection.js");
const redis = require("../lib/redisClient.js");

async function normalizeString(str) {
  return (str || "").toLowerCase().replace(/\s+/g, "").trim();
}

/**
 * Main nightly sync function for delta updates
 */
async function syncLocationsNightly() {
  const startTime = Date.now();

  try {
    console.log("\n⏰ [NIGHTLY SYNC] Starting at", new Date().toISOString());

    // Get TBO adapter
    let adapter;
    try {
      const adapterModule = require("../services/adapters/tboAdapter.js");
      adapter = adapterModule.getTboAdapter?.() || adapterModule;
    } catch (e) {
      console.error("Failed to load TBO adapter:", e.message);
      return {
        success: false,
        error: "TBO adapter not available",
      };
    }

    let countriesUpdated = 0;
    let citiesUpdated = 0;
    let hotelsUpdated = 0;

    // STEP 1: Sync countries (always quick)
    console.log("🌍 Syncing countries...");
    try {
      const countries = await adapter.getCountryList(true);
      if (Array.isArray(countries)) {
        for (const country of countries) {
          const supplierId = String(country.CountryCode || country.code || country.id);
          const name = country.CountryName || country.name;
          const iso2 = country.CountryCode || country.code;

          if (!supplierId || !name) continue;

          // Check if updated
          const existingRes = await db.query(
            "SELECT updated_at FROM tbo_countries WHERE supplier_id = $1",
            [supplierId],
          );

          const existing = existingRes.rows[0];
          if (existing) {
            const lastUpdate = new Date(existing.updated_at);
            const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate < 24) {
              // Skip if updated in last 24 hours
              continue;
            }
          }

          await db.query(
            `INSERT INTO tbo_countries (supplier_id, name, normalized_name, iso2, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (supplier_id)
             DO UPDATE SET name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name,
                           iso2 = EXCLUDED.iso2, updated_at = NOW()`,
            [supplierId, name, await normalizeString(name), iso2],
          );
          countriesUpdated++;
        }
      }
      console.log(`  ✅ Countries updated: ${countriesUpdated}`);
    } catch (error) {
      console.warn("⚠️  Country sync failed:", error.message);
    }

    // STEP 2: Sync popular cities only (delta)
    console.log("🏙️  Syncing popular cities (delta)...");
    try {
      const citiesRes = await db.query(
        "SELECT DISTINCT country_supplier_id FROM tbo_cities ORDER BY popularity DESC LIMIT 20",
      );
      const countries = citiesRes.rows || [];

      for (const row of countries) {
        const countryCode = row.country_supplier_id;
        let countryCount = 0;

        try {
          const cities = await adapter.getCityList(countryCode, true);
          if (!Array.isArray(cities)) continue;

          for (const city of cities.slice(0, 100)) {
            // Limit to top 100 cities per country
            const supplierId = String(city.CityCode || city.code || city.id);
            const cityName = city.CityName || city.name;

            if (!supplierId || !cityName) continue;

            // Check if needs update
            const existingRes = await db.query(
              "SELECT updated_at FROM tbo_cities WHERE supplier_id = $1",
              [supplierId],
            );

            const existing = existingRes.rows[0];
            if (existing) {
              const lastUpdate = new Date(existing.updated_at);
              const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
              if (hoursSinceUpdate < 24) {
                // Skip if updated in last 24 hours
                continue;
              }
            }

            await db.query(
              `INSERT INTO tbo_cities (supplier_id, country_supplier_id, name, normalized_name, 
                                       lat, lng, popularity, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
               ON CONFLICT (supplier_id)
               DO UPDATE SET country_supplier_id = EXCLUDED.country_supplier_id,
                             name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name,
                             lat = EXCLUDED.lat, lng = EXCLUDED.lng, 
                             popularity = EXCLUDED.popularity, updated_at = NOW()`,
              [
                supplierId,
                countryCode,
                cityName,
                await normalizeString(cityName),
                city.Latitude || null,
                city.Longitude || null,
                0,
              ],
            );
            countryCount++;
          }

          if (countryCount > 0) {
            citiesUpdated += countryCount;
            console.log(`  ✓ Updated ${countryCount} cities for ${countryCode}`);
          }
        } catch (error) {
          console.warn(`⚠️  City sync failed for ${countryCode}:`, error.message);
        }
      }

      console.log(`  ✅ Cities updated: ${citiesUpdated}`);
    } catch (error) {
      console.warn("⚠️  City sync failed:", error.message);
    }

    // STEP 3: Sync hotels for updated cities
    console.log("🏨 Syncing hotels for updated cities (delta)...");
    try {
      const citiesRes = await db.query(
        "SELECT supplier_id, country_supplier_id FROM tbo_cities WHERE updated_at > NOW() - INTERVAL '24 hours' LIMIT 50",
      );
      const cities = citiesRes.rows || [];

      for (const city of cities) {
        const cityCode = city.supplier_id;
        let cityHotelCount = 0;

        try {
          const hotelCodes = await adapter.getHotelCodes(cityCode, true);
          if (!Array.isArray(hotelCodes)) continue;

          for (const hcode of hotelCodes.slice(0, 50)) {
            // Limit to top 50 hotels per city
            const hotelId = typeof hcode === "string" ? hcode : hcode.HotelCode || hcode.code;
            const hotelName = typeof hcode === "object" ? hcode.HotelName || hcode.name : `Hotel ${cityCode}`;

            if (!hotelId) continue;

            // Check if needs update
            const existingRes = await db.query(
              "SELECT updated_at FROM tbo_hotels WHERE supplier_id = $1",
              [hotelId],
            );

            const existing = existingRes.rows[0];
            if (existing) {
              const lastUpdate = new Date(existing.updated_at);
              const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
              if (hoursSinceUpdate < 24) {
                // Skip if updated in last 24 hours
                continue;
              }
            }

            await db.query(
              `INSERT INTO tbo_hotels (supplier_id, city_supplier_id, country_supplier_id, name, 
                                      normalized_name, popularity, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
               ON CONFLICT (supplier_id)
               DO UPDATE SET city_supplier_id = EXCLUDED.city_supplier_id,
                             country_supplier_id = EXCLUDED.country_supplier_id,
                             name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name,
                             popularity = EXCLUDED.popularity, updated_at = NOW()`,
              [
                hotelId,
                cityCode,
                city.country_supplier_id,
                hotelName,
                await normalizeString(hotelName),
                0,
              ],
            );
            cityHotelCount++;
          }

          if (cityHotelCount > 0) {
            hotelsUpdated += cityHotelCount;
          }
        } catch (error) {
          console.warn(`⚠️  Hotel sync failed for city ${cityCode}:`, error.message);
        }
      }

      console.log(`  ✅ Hotels updated: ${hotelsUpdated}`);
    } catch (error) {
      console.warn("⚠️  Hotel sync failed:", error.message);
    }

    // STEP 4: Invalidate Redis cache for stale entries
    console.log("🗑️  Clearing stale Redis cache...");
    try {
      const keys = await redis.keys("loc:search:*");
      if (keys.length > 0) {
        await redis.delMany(keys);
        console.log(`  ✅ Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      console.warn("⚠️  Redis cache clear failed:", error.message);
    }

    // STEP 5: Log sync results
    try {
      await db.query(
        `INSERT INTO admin_sync_logs (sync_type, status, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [
          "tbo_locations_nightly",
          "success",
          JSON.stringify({
            countries_updated: countriesUpdated,
            cities_updated: citiesUpdated,
            hotels_updated: hotelsUpdated,
            elapsed_ms: Date.now() - startTime,
          }),
        ],
      );
    } catch (e) {
      console.warn("Log insert skipped:", e.message);
    }

    const elapsed = Date.now() - startTime;

    console.log("\n✅ Nightly sync completed!");
    console.log(`  Countries: ${countriesUpdated}, Cities: ${citiesUpdated}, Hotels: ${hotelsUpdated}`);
    console.log(`  ⏱️  Total time: ${(elapsed / 1000).toFixed(2)}s\n`);

    return {
      success: true,
      elapsed_ms: elapsed,
      countries: countriesUpdated,
      cities: citiesUpdated,
      hotels: hotelsUpdated,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("\n❌ Nightly sync failed:", error.message);

    // Log failure
    try {
      await db.query(
        `INSERT INTO admin_sync_logs (sync_type, status, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        ["tbo_locations_nightly", "failed", JSON.stringify({ error: error.message })],
      );
    } catch (e) {
      // Ignore log errors
    }

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = {
  syncLocationsNightly,
};
