/**
 * TBO Locations Sync Job
 * Fetches countries, cities, and hotels from TBO Content API
 * and syncs them into the faredown_booking_db
 */

const db = require("../database/connection.js");
const { fetchPages } = require("../services/tboClient.js");

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
    for await (const country of fetchPages("lists/countries")) {
      const supplierId = String(country.id || country.code);
      const name = country.name || country.countryName;
      const iso2 = country.code || country.countryCode;

      if (!supplierId || !name) continue;

      await db.query(
        `INSERT INTO tbo_countries (supplier_id, name, normalized_name, iso2, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (supplier_id)
         DO UPDATE SET name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name,
                       iso2 = EXCLUDED.iso2, updated_at = NOW()`,
        [supplierId, name, await normalizeString(name), iso2],
      );
      count++;
    }

    console.log(`✅ Synced ${count} countries`);
    return count;
  } catch (error) {
    console.error("❌ Error syncing countries:", error.message);
    throw error;
  }
}

/**
 * Sync all TBO cities
 */
async function syncCities() {
  console.log("🏙️  Syncing TBO cities...");
  let count = 0;

  try {
    for await (const city of fetchPages("lists/cities")) {
      const supplierId = String(city.id || city.code);
      const countryId = String(city.countryId || city.countryCode);
      const name = city.name || city.cityName;
      const lat = city.latitude || city.lat;
      const lng = city.longitude || city.lng;
      const popularity = city.popularity || city.visitCount || 0;

      if (!supplierId || !countryId || !name) continue;

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
          countryId,
          name,
          await normalizeString(name),
          lat,
          lng,
          popularity,
        ],
      );
      count++;
    }

    console.log(`✅ Synced ${count} cities`);
    return count;
  } catch (error) {
    console.error("❌ Error syncing cities:", error.message);
    throw error;
  }
}

/**
 * Sync all TBO hotels
 */
async function syncHotels() {
  console.log("🏨 Syncing TBO hotels...");
  let count = 0;

  try {
    for await (const hotel of fetchPages("lists/hotels")) {
      const supplierId = String(hotel.id || hotel.code);
      const cityId = String(hotel.cityId || hotel.cityCode);
      const countryId = String(hotel.countryId || hotel.countryCode);
      const name = hotel.name || hotel.hotelName;
      const address = hotel.address || "";
      const lat = hotel.latitude || hotel.lat;
      const lng = hotel.longitude || hotel.lng;
      const stars = hotel.category || hotel.stars;
      const popularity = hotel.popularity || hotel.bookingCount || 0;

      if (!supplierId || !cityId || !countryId || !name) continue;

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
          supplierId,
          cityId,
          countryId,
          name,
          await normalizeString(name),
          address,
          lat,
          lng,
          stars,
          popularity,
        ],
      );
      count++;
    }

    console.log(`✅ Synced ${count} hotels`);
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
