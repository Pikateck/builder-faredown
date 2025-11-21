#!/usr/bin/env node

/**
 * TBO Hotel Precaching Script
 *
 * Purpose:
 * Pre-warm the hotel_search_cache with fresh TBO hotel data for our top cities.
 * Run nightly via cron to ensure DB always has recent hotel data, even before real users search.
 *
 * Usage:
 *   node api/scripts/tbo-precache-hotels.js [--cities=Mumbai,Delhi,Dubai] [--days=30]
 *
 * Options:
 *   --cities=CITY1,CITY2  Comma-separated list of cities to precache (default: top 10)
 *   --days=N              Days ahead to search (default: 30)
 *   --dry-run             Log what would be cached without actually writing to DB
 *
 * Environment Variables Required:
 *   DATABASE_URL          PostgreSQL connection string
 *   TBO_CLIENT_ID         TBO API client ID
 *   TBO_USERNAME          TBO API username
 *   TBO_PASSWORD          TBO API password
 */

const db = require("../lib/db");
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");
const hotelCacheService = require("../services/hotelCacheService");

// List of top cities to precache (ordered by volume)
const TOP_CITIES_TO_PRECACHE = [
  { city: "Mumbai", country: "IN", countryCode: "IN" },
  { city: "New Delhi", country: "IN", countryCode: "IN" },
  { city: "Dubai", country: "AE", countryCode: "AE" },
  { city: "London", country: "GB", countryCode: "GB" },
  { city: "Paris", country: "FR", countryCode: "FR" },
  { city: "New York", country: "US", countryCode: "US" },
  { city: "Bangkok", country: "TH", countryCode: "TH" },
  { city: "Singapore", country: "SG", countryCode: "SG" },
  { city: "Vienna", country: "AT", countryCode: "AT" },
  { city: "Goa", country: "IN", countryCode: "IN" },
];

/**
 * Calculate future check-in and check-out dates
 */
function getSearchDates(daysAhead = 30) {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + daysAhead);

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);

  return {
    checkIn: checkIn.toISOString().split("T")[0],
    checkOut: checkOut.toISOString().split("T")[0],
  };
}

/**
 * Precache hotels for a single city
 */
async function precacheCityHotels(city, daysAhead = 30, dryRun = false) {
  try {
    const adapter = supplierAdapterManager.getAdapter("TBO");
    if (!adapter) {
      throw new Error("TBO adapter not initialized");
    }

    const { checkIn, checkOut } = getSearchDates(daysAhead);

    console.log(`\n📍 Precaching ${city.city} (${city.country})...`);
    console.log(`   Dates: ${checkIn} → ${checkOut}`);

    // Search parameters (2 adults, 1 room - standard precache)
    const searchRequest = {
      destination: city.city,
      city: city.city,
      country: city.country,
      countryCode: city.countryCode,
      checkIn,
      checkOut,
      adults: 2,
      children: 0,
      rooms: 1,
      currency: "INR",
      guestNationality: "IN", // Use default for precache
    };

    // Execute search
    const startTime = Date.now();
    const searchResult = await adapter.searchHotels(searchRequest);
    const duration = Date.now() - startTime;

    // Extract hotels array from response
    // The caching integration wrapper returns: { results: { hotels: [...], sessionMetadata }, cacheHit, traceId, searchHash }
    // Navigate through the wrapping layers
    let results = [];
    let sessionMetadata = {};

    if (searchResult?.results?.hotels) {
      // From caching service wrapper around TBO adapter
      results = searchResult.results.hotels;
      sessionMetadata = searchResult.results.sessionMetadata || {};
    } else if (searchResult?.results && Array.isArray(searchResult.results)) {
      // If results is directly an array (fallback)
      results = searchResult.results;
    } else if (searchResult?.hotels) {
      // Direct from TBO adapter (if not wrapped)
      results = searchResult.hotels;
      sessionMetadata = searchResult.sessionMetadata || {};
    }

    const hotelCount = results.length;

    console.log(`   ✓ Found ${hotelCount} hotels (${duration}ms)`);

    if (!dryRun && hotelCount > 0) {
      // Cache the results using hotelCacheService
      // This will populate hotel_search_cache and hotel_search_cache_results
      const cached = await hotelCacheService.cacheSearchResults(
        results,
        searchRequest,
        "precache_nightly",
        sessionMetadata,
      );

      if (cached) {
        console.log(`   ✅ Cached ${hotelCount} hotels for ${city.city}`);
      } else {
        console.warn(`   ⚠️  Cache write may have failed for ${city.city}`);
      }

      // Also store normalized hotel metadata
      for (const hotel of results) {
        try {
          await hotelCacheService.storeNormalizedHotel({
            tboHotelCode: hotel.hotelCode || hotel.code,
            cityId: hotel.city,
            cityName: city.city,
            countryCode: city.countryCode,
            name: hotel.name,
            description: hotel.description,
            address: hotel.address,
            latitude: hotel.latitude,
            longitude: hotel.longitude,
            starRating: hotel.starRating,
            checkInTime: hotel.checkInTime,
            checkOutTime: hotel.checkOutTime,
            amenities: hotel.amenities,
            facilities: hotel.facilities,
            images: hotel.images,
            mainImageUrl: hotel.mainImageUrl,
            phone: hotel.phone,
            email: hotel.email,
            website: hotel.website,
            totalRooms: hotel.totalRooms,
            tboResponseBlob: hotel, // Full TBO response
          });
        } catch (normalizeErr) {
          console.warn(
            `   ⚠️  Failed to normalize hotel ${hotel.hotelCode}:`,
            normalizeErr.message,
          );
        }
      }

      // Log precache operation
      try {
        await db.query(
          `INSERT INTO tbo_sync_log (sync_type, status, country_code, records_processed, records_inserted, error_message, completed_at, duration_ms, created_at)
           VALUES ('precache_hotels', 'success', $1, $2, $3, NULL, NOW(), $4, NOW())`,
          [city.countryCode, results.length, results.length, duration],
        );
      } catch (logErr) {
        console.warn("Failed to log precache operation:", logErr.message);
      }
    } else if (dryRun) {
      console.log(`   🔍 [DRY RUN] Would cache ${results.length} hotels`);
    }

    return results.length;
  } catch (error) {
    console.error(`   ❌ Error precaching ${city.city}:`, error.message);

    // Log failure
    try {
      await db.query(
        `INSERT INTO tbo_sync_log (sync_type, status, country_code, error_message, completed_at, created_at)
         VALUES ('precache_hotels', 'failed', $1, $2, NOW(), NOW())`,
        [city.countryCode, error.message],
      );
    } catch (logErr) {
      console.warn("Failed to log precache error:", logErr.message);
    }

    return 0;
  }
}

/**
 * Main precaching function
 */
async function main() {
  const startTime = Date.now();
  console.log("\n" + "═".repeat(80));
  console.log("TBO HOTEL PRECACHE - Warm cache for top cities");
  console.log("═".repeat(80));
  console.log(`Started at: ${new Date().toISOString()}`);

  // Parse command line arguments
  const args = process.argv.slice(2);
  const citiesArg = args.find((a) => a.startsWith("--cities="));
  const daysArg = args.find((a) => a.startsWith("--days="));
  const dryRun = args.includes("--dry-run");

  let citiesToCache = TOP_CITIES_TO_PRECACHE;
  let daysAhead = 30;

  if (citiesArg) {
    const cityNames = citiesArg.replace("--cities=", "").split(",");
    citiesToCache = TOP_CITIES_TO_PRECACHE.filter((c) =>
      cityNames.some((name) =>
        c.city.toLowerCase().includes(name.toLowerCase()),
      ),
    );
  }

  if (daysArg) {
    daysAhead = parseInt(daysArg.replace("--days=", ""), 10);
  }

  console.log(`\nPrecache Settings:`);
  console.log(`  Cities to precache: ${citiesToCache.length}`);
  console.log(`  Search dates: +${daysAhead} days ahead`);
  console.log(`  Dry run: ${dryRun}`);
  console.log(`  Cities: ${citiesToCache.map((c) => c.city).join(", ")}`);

  try {
    // Initialize TBO adapter (authenticate if needed)
    const adapter = supplierAdapterManager.getAdapter("TBO");
    if (!adapter) {
      throw new Error("TBO adapter failed to initialize");
    }

    console.log("\n✅ TBO adapter initialized\n");

    // Precache each city
    let totalCached = 0;
    for (const city of citiesToCache) {
      const count = await precacheCityHotels(city, daysAhead, dryRun);
      totalCached += count;
    }

    const duration = Date.now() - startTime;
    console.log("\n" + "═".repeat(80));
    console.log("PRECACHE COMPLETE ✅");
    console.log("═".repeat(80));
    console.log(`Cities precached: ${citiesToCache.length}`);
    console.log(`Total hotels cached: ${totalCached}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Completed at: ${new Date().toISOString()}\n`);

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error("\n" + "═".repeat(80));
    console.error("PRECACHE FAILED ❌");
    console.error("═".repeat(80));
    console.error("Error:", error.message);
    console.error(error.stack);

    const duration = Date.now() - startTime;
    try {
      await db.query(
        `INSERT INTO tbo_sync_log (sync_type, status, error_message, completed_at, duration_ms, created_at)
         VALUES ('precache_hotels_main', 'failed', $1, NOW(), $2, NOW())`,
        [error.message, duration],
      );
    } catch (logErr) {
      console.error("Failed to log main precache error:", logErr.message);
    }

    await db.end();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  precacheCityHotels,
  getSearchDates,
};
