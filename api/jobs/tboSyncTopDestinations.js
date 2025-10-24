/**
 * TBO Sync Top Destinations
 * Pre-seeds 50-100 top global travel cities for instant autocomplete
 * Called on deploy and caches results for warm startup
 */

const db = require("../database/connection.js");
const redis = require("../lib/redisClient.js");

/**
 * List of top 100 global travel destinations (cities)
 * Ordered by popularity/booking volume
 */
const TOP_DESTINATIONS = [
  // Europe
  { city: "Paris", country: "FR", region: "Europe" },
  { city: "London", country: "GB", region: "Europe" },
  { city: "Rome", country: "IT", region: "Europe" },
  { city: "Barcelona", country: "ES", region: "Europe" },
  { city: "Madrid", country: "ES", region: "Europe" },
  { city: "Berlin", country: "DE", region: "Europe" },
  { city: "Amsterdam", country: "NL", region: "Europe" },
  { city: "Vienna", country: "AT", region: "Europe" },
  { city: "Prague", country: "CZ", region: "Europe" },
  { city: "Istanbul", country: "TR", region: "Europe" },
  { city: "Venice", country: "IT", region: "Europe" },
  { city: "Florence", country: "IT", region: "Europe" },
  { city: "Milan", country: "IT", region: "Europe" },
  { city: "Athens", country: "GR", region: "Europe" },
  { city: "Lisbon", country: "PT", region: "Europe" },
  { city: "Munich", country: "DE", region: "Europe" },
  { city: "Dublin", country: "IE", region: "Europe" },
  { city: "Brussels", country: "BE", region: "Europe" },
  { city: "Zurich", country: "CH", region: "Europe" },
  { city: "Geneva", country: "CH", region: "Europe" },

  // Asia Pacific
  { city: "Dubai", country: "AE", region: "Asia" },
  { city: "Bangkok", country: "TH", region: "Asia" },
  { city: "Singapore", country: "SG", region: "Asia" },
  { city: "Tokyo", country: "JP", region: "Asia" },
  { city: "Hong Kong", country: "HK", region: "Asia" },
  { city: "Seoul", country: "KR", region: "Asia" },
  { city: "Mumbai", country: "IN", region: "Asia" },
  { city: "Delhi", country: "IN", region: "Asia" },
  { city: "Bangalore", country: "IN", region: "Asia" },
  { city: "Goa", country: "IN", region: "Asia" },
  { city: "Bali", country: "ID", region: "Asia" },
  { city: "Jakarta", country: "ID", region: "Asia" },
  { city: "Manila", country: "PH", region: "Asia" },
  { city: "Ho Chi Minh City", country: "VN", region: "Asia" },
  { city: "Hanoi", country: "VN", region: "Asia" },
  { city: "Phuket", country: "TH", region: "Asia" },
  { city: "Chiang Mai", country: "TH", region: "Asia" },
  { city: "Kuala Lumpur", country: "MY", region: "Asia" },
  { city: "Sydney", country: "AU", region: "Asia" },
  { city: "Melbourne", country: "AU", region: "Asia" },

  // Americas
  { city: "New York", country: "US", region: "Americas" },
  { city: "Los Angeles", country: "US", region: "Americas" },
  { city: "San Francisco", country: "US", region: "Americas" },
  { city: "Las Vegas", country: "US", region: "Americas" },
  { city: "Miami", country: "US", region: "Americas" },
  { city: "Chicago", country: "US", region: "Americas" },
  { city: "Boston", country: "US", region: "Americas" },
  { city: "Washington DC", country: "US", region: "Americas" },
  { city: "Toronto", country: "CA", region: "Americas" },
  { city: "Vancouver", country: "CA", region: "Americas" },
  { city: "Mexico City", country: "MX", region: "Americas" },
  { city: "Cancun", country: "MX", region: "Americas" },
  { city: "Buenos Aires", country: "AR", region: "Americas" },
  { city: "Rio de Janeiro", country: "BR", region: "Americas" },
  { city: "Sao Paulo", country: "BR", region: "Americas" },
  { city: "Lima", country: "PE", region: "Americas" },
  { city: "Bogota", country: "CO", region: "Americas" },

  // Middle East & North Africa
  { city: "Cairo", country: "EG", region: "Africa" },
  { city: "Abu Dhabi", country: "AE", region: "Middle East" },
  { city: "Doha", country: "QA", region: "Middle East" },
  { city: "Casablanca", country: "MA", region: "Africa" },
  { city: "Marrakech", country: "MA", region: "Africa" },
  { city: "Fez", country: "MA", region: "Africa" },
  { city: "Riyadh", country: "SA", region: "Middle East" },

  // Additional Global Hubs
  { city: "Cape Town", country: "ZA", region: "Africa" },
  { city: "Johannesburg", country: "ZA", region: "Africa" },
  { city: "Bangkok", country: "TH", region: "Asia" },
  { city: "Antalya", country: "TR", region: "Europe" },
  { city: "Palma", country: "ES", region: "Europe" },
  { city: "Ibiza", country: "ES", region: "Europe" },
  { city: "Mykonos", country: "GR", region: "Europe" },
  { city: "Santorini", country: "GR", region: "Europe" },
];

async function normalizeString(str) {
  return (str || "").toLowerCase().replace(/\s+/g, "").trim();
}

/**
 * Main sync function for top destinations
 */
async function syncTopDestinations() {
  const startTime = Date.now();

  try {
    console.log("\n🌍 Seeding top destinations for instant autocomplete...\n");

    // Get all countries from DB
    const countriesRes = await db.query(
      "SELECT supplier_id, name FROM tbo_countries ORDER BY name",
    );
    const countries = countriesRes.rows || [];

    if (countries.length === 0) {
      console.warn(
        "⚠️  No countries in DB. Run tboSyncLocations first to populate countries.",
      );
      return {
        success: false,
        error: "No countries found in database",
      };
    }

    // Map country codes to supplier IDs
    const countryMap = {};
    for (const country of countries) {
      // Try to match by ISO2 or name
      countryMap[country.supplier_id] = country.supplier_id;
    }

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

    let citiesSeeded = 0;
    let hotelsSeeded = 0;

    // For each top destination, fetch from TBO and seed
    for (const dest of TOP_DESTINATIONS) {
      try {
        // Find matching country
        const matchingCountry = countries.find(
          (c) =>
            c.supplier_id === dest.country ||
            c.name
              .toLowerCase()
              .includes(dest.city.split(" ")[0].toLowerCase()),
        );

        if (!matchingCountry) {
          console.log(
            `⏭️  Skipping "${dest.city}" - country ${dest.country} not found`,
          );
          continue;
        }

        // Fetch cities from TBO for this country
        const cities = await adapter.getCityList(
          matchingCountry.supplier_id,
          true,
        );
        if (!Array.isArray(cities)) {
          console.warn(`⚠️  No cities returned for ${dest.country}`);
          continue;
        }

        // Find matching city
        const matchedCity = cities.find((c) => {
          const cityName = c.CityName || c.name || "";
          return cityName.toLowerCase().includes(dest.city.toLowerCase());
        });

        if (!matchedCity) {
          console.log(
            `⏭️  City "${dest.city}" not found in TBO for country ${dest.country}`,
          );
          continue;
        }

        const cityCode = matchedCity.CityCode || matchedCity.code;
        const cityName = matchedCity.CityName || matchedCity.name;

        if (!cityCode || !cityName) {
          console.warn(`⚠️  Invalid city data for "${dest.city}"`);
          continue;
        }

        // Insert city into DB
        await db.query(
          `INSERT INTO tbo_cities (supplier_id, country_supplier_id, name, normalized_name, lat, lng, popularity, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (supplier_id) DO UPDATE SET updated_at = NOW()`,
          [
            cityCode,
            matchingCountry.supplier_id,
            cityName,
            await normalizeString(cityName),
            matchedCity.Latitude || null,
            matchedCity.Longitude || null,
            100 - TOP_DESTINATIONS.indexOf(dest), // Higher popularity for top destinations
          ],
        );

        citiesSeeded++;

        // Fetch and seed hotels for this city
        try {
          const hotelCodes = await adapter.getHotelCodes(cityCode, true);
          if (Array.isArray(hotelCodes)) {
            for (const hcode of hotelCodes.slice(0, 50)) {
              // Limit to top 50 hotels per city
              const hotelId =
                typeof hcode === "string"
                  ? hcode
                  : hcode.HotelCode || hcode.code;
              const hotelName =
                typeof hcode === "object"
                  ? hcode.HotelName || hcode.name
                  : `Hotel ${cityCode}`;

              if (!hotelId) continue;

              await db.query(
                `INSERT INTO tbo_hotels (supplier_id, city_supplier_id, country_supplier_id, name, normalized_name, popularity, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                 ON CONFLICT (supplier_id) DO UPDATE SET updated_at = NOW()`,
                [
                  hotelId,
                  cityCode,
                  matchingCountry.supplier_id,
                  hotelName || `Hotel ${cityCode}`,
                  await normalizeString(hotelName || `Hotel ${cityCode}`),
                  0,
                ],
              );
              hotelsSeeded++;
            }
          }
        } catch (e) {
          console.warn(
            `⚠️  Hotel fetch failed for city ${cityCode}:`,
            e.message,
          );
        }

        console.log(`✅ Seeded "${cityName}" with ${hotelsSeeded} hotels`);
      } catch (error) {
        console.warn(`⚠️  Failed to seed "${dest.city}":`, error.message);
      }
    }

    // Warm Redis cache with top cities
    try {
      const citiesRes = await db.query(
        "SELECT * FROM tbo_cities ORDER BY popularity DESC LIMIT 50",
      );
      const topCities = citiesRes.rows || [];

      for (const city of topCities) {
        const cacheKey = `loc:search:${await normalizeString(city.name)}:all:10`;
        await redis.setJSON(
          cacheKey,
          {
            items: [
              {
                kind: "city",
                id: city.supplier_id,
                name: city.name,
                country_id: city.country_supplier_id,
              },
            ],
            count: 1,
            query: city.name,
            types: ["city"],
          },
          1800,
        );
      }

      console.log(`✨ Warmed Redis cache with ${topCities.length} top cities`);
    } catch (e) {
      console.warn("Redis cache warm failed:", e.message);
    }

    const elapsed = Date.now() - startTime;

    console.log("\n✅ Top destinations seeding completed!");
    console.log(`⏱️  Total time: ${(elapsed / 1000).toFixed(2)}s\n`);

    return {
      success: true,
      elapsed_ms: elapsed,
      cities_seeded: citiesSeeded,
      hotels_seeded: hotelsSeeded,
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
  syncTopDestinations,
};
