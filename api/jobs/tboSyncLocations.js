/**
 * TBO Locations Sync Job
 * Fetches countries, cities, and hotels from TBO Static Data API
 * and syncs them into the faredown_booking_db
 */

const db = require("../database/connection.js");
const {
  fetchCountries,
  fetchCitiesForCountry,
  fetchHotelCodesForCity,
  fetchHotelDetails,
} = require("../services/tboClient.js");

async function normalizeString(str) {
  return (str || "").toLowerCase().replace(/\s+/g, "").trim();
}

/**
 * Sync all TBO countries
 */
async function syncCountries() {
  console.log("🌍 Syncing TBO countries...");
  let count = 0;

  try {
    for await (const country of fetchCountries()) {
      const supplierId = String(country.CountryCode || country.code || country.id);
      const name = country.CountryName || country.name;
      const iso2 = country.CountryCode || country.code;

      if (!supplierId || !name) {
        console.log("⏭️  Skipping country with missing data:", country);
        continue;
      }

      await db.query(
        `INSERT INTO tbo_countries (supplier_id, name, normalized_name, iso2, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (supplier_id)
         DO UPDATE SET name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name,
                       iso2 = EXCLUDED.iso2, updated_at = NOW()`,
        [supplierId, name, await normalizeString(name), iso2],
      );
      count++;
      if (count % 10 === 0) {
        console.log(`  → Synced ${count} countries so far...`);
      }
    }

    console.log(`✅ Synced ${count} countries total`);
    return count;
  } catch (error) {
    console.error("❌ Error syncing countries:", error.message);
    throw error;
  }
}

/**
 * Sync all TBO cities (per country)
 */
async function syncCities() {
  console.log("🏙️  Syncing TBO cities...");
  let count = 0;

  try {
    // First get all countries
    const countriesResult = await db.query(
      "SELECT supplier_id FROM tbo_countries ORDER BY supplier_id",
    );
    const countries = countriesResult.rows;

    if (countries.length === 0) {
      console.warn("⚠️  No countries found. Run syncCountries() first.");
      return count;
    }

    console.log(`📍 Syncing cities for ${countries.length} countries...`);

    for (const country of countries) {
      const countryCode = country.supplier_id;
      let countryCount = 0;

      try {
        for await (const city of fetchCitiesForCountry(countryCode)) {
          const supplierId = String(city.CityCode || city.code || city.id);
          const cityName = city.CityName || city.name;

          if (!supplierId || !cityName) {
            continue;
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
              0, // TBO doesn't provide popularity in city list
            ],
          );
          count++;
          countryCount++;
        }
        console.log(
          `  ✓ Synced ${countryCount} cities for country ${countryCode}`,
        );
      } catch (error) {
        console.warn(
          `⚠️  Failed to sync cities for country ${countryCode}:`,
          error.message,
        );
        // Continue with next country
      }
    }

    console.log(`✅ Synced ${count} cities total`);
    return count;
  } catch (error) {
    console.error("❌ Error syncing cities:", error.message);
    throw error;
  }
}

/**
 * Sync all TBO hotels (per city)
 */
async function syncHotels() {
  console.log("🏨 Syncing TBO hotels...");
  let count = 0;

  try {
    // Get all cities with their countries
    const citiesResult = await db.query(
      `SELECT tbc.supplier_id, tbc.country_supplier_id
       FROM tbo_cities tbc
       ORDER BY tbc.country_supplier_id, tbc.supplier_id`,
    );
    const cities = citiesResult.rows;

    if (cities.length === 0) {
      console.warn("⚠️  No cities found. Run syncCities() first.");
      return count;
    }

    console.log(`🏨 Syncing hotels for ${cities.length} cities...`);

    let processedCities = 0;
    for (const city of cities) {
      const cityCode = city.supplier_id;
      const countryCode = city.country_supplier_id;
      let cityHotelCount = 0;

      try {
        for await (const hotelCode of fetchHotelCodesForCity(cityCode)) {
          // Get full hotel details
          let hotelId, hotelName, hotelAddress, stars;

          // hotelCode might be a string or object depending on API response
          if (typeof hotelCode === "object") {
            hotelId = String(hotelCode.HotelCode || hotelCode.code);
            hotelName = hotelCode.HotelName || hotelCode.name;
            hotelAddress = hotelCode.Address || hotelCode.address || "";
            stars = hotelCode.Category || hotelCode.stars || null;
          } else {
            hotelId = String(hotelCode);
            // Fetch details for this hotel
            const details = await fetchHotelDetails(hotelId);
            if (!details) {
              console.warn(
                `  ⚠️  Could not fetch details for hotel ${hotelId}`,
              );
              continue;
            }
            hotelName = details.HotelName || details.name;
            hotelAddress = details.Address || details.address || "";
            stars = details.Category || details.stars || null;
          }

          if (!hotelId || !hotelName) {
            continue;
          }

          await db.query(
            `INSERT INTO tbo_hotels (supplier_id, city_supplier_id, country_supplier_id, name,
                                    normalized_name, address, lat, lng, stars, popularity, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
             ON CONFLICT (supplier_id)
             DO UPDATE SET city_supplier_id = EXCLUDED.city_supplier_id,
                           country_supplier_id = EXCLUDED.country_supplier_id,
                           name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name,
                           address = EXCLUDED.address, lat = EXCLUDED.lat,
                           lng = EXCLUDED.lng, stars = EXCLUDED.stars,
                           popularity = EXCLUDED.popularity, updated_at = NOW()`,
            [
              hotelId,
              cityCode,
              countryCode,
              hotelName,
              await normalizeString(hotelName),
              hotelAddress,
              null,
              null,
              stars,
              0,
            ],
          );
          count++;
          cityHotelCount++;
        }

        processedCities++;
        if (cityHotelCount > 0) {
          console.log(
            `  ✓ Synced ${cityHotelCount} hotels for city ${cityCode}`,
          );
        }

        if (processedCities % 50 === 0) {
          console.log(
            `  → Progress: ${processedCities}/${cities.length} cities processed`,
          );
        }
      } catch (error) {
        console.warn(
          `⚠️  Failed to sync hotels for city ${cityCode}:`,
          error.message,
        );
        // Continue with next city
      }
    }

    console.log(`✅ Synced ${count} hotels total`);
    return count;
  } catch (error) {
    console.error("❌ Error syncing hotels:", error.message);
    throw error;
  }
}

/**
 * Main sync function - syncs all locations
 */
async function syncTboLocations() {
  const startTime = Date.now();

  try {
    console.log("\n🔄 Starting TBO locations sync...\n");

    const countriesCount = await syncCountries();
    const citiesCount = await syncCities();
    const hotelsCount = await syncHotels();

    const elapsed = Date.now() - startTime;

    console.log("\n✅ Sync completed successfully!");
    console.log(`⏱️  Total time: ${(elapsed / 1000).toFixed(2)}s\n`);

    return {
      success: true,
      elapsed_ms: elapsed,
      countries: countriesCount,
      cities: citiesCount,
      hotels: hotelsCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("\n❌ Sync failed:", error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = {
  syncTboLocations,
  syncCountries,
  syncCities,
  syncHotels,
};
