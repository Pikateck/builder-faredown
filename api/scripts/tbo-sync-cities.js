#!/usr/bin/env node

/**
 * TBO City Sync Script
 *
 * Purpose:
 * 1. Fetch countries and cities from TBO's documented StaticData API
 * 2. Populate tbo_countries and tbo_cities tables
 * 3. Create mappings from Hotelbeds cities to TBO cities
 *
 * Usage:
 *   node api/scripts/tbo-sync-cities.js [--country=IN] [--full]
 *
 * Options:
 *   --country=XX   Sync only specific country (e.g., IN, AE, GB)
 *   --full         Perform full sync with country detection
 *   --mapping      Only create/update mappings (skip city fetch)
 *
 * Environment Variables Required:
 *   DATABASE_URL   PostgreSQL connection string
 *   TBO_CLIENT_ID  TBO API client ID
 *   TBO_USERNAME   TBO API username
 *   TBO_PASSWORD   TBO API password
 */

const db = require("../lib/db");
const { getDestinationSearchStaticData } = require("../tbo/static");
const { authenticateTBO } = require("../tbo/auth");

// Normalize string for matching
function normalizeString(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Calculate simple similarity score (0-100)
function calculateSimilarity(str1, str2) {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);

  if (norm1 === norm2) return 100;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 85;

  // Levenshtein distance-based similarity
  const maxLen = Math.max(norm1.length, norm2.length);
  const minLen = Math.min(norm1.length, norm2.length);
  let distance = 0;

  for (let i = 0; i < minLen; i++) {
    if (norm1[i] !== norm2[i]) distance++;
  }
  distance += maxLen - minLen;

  return Math.max(0, 100 - (distance / maxLen) * 100);
}

/**
 * Sync TBO countries from StaticData API
 */
async function syncTBOCountries() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 1: Syncing TBO Countries from API");
  console.log("=".repeat(80));

  try {
    // Get TokenId
    const authData = await authenticateTBO();
    const tokenId = authData.TokenId;
    console.log("✅ Authenticated with TBO");

    // Fetch static data for multiple countries
    const countriesToSync = ["IN", "AE", "GB", "US", "FR", "AT", "TH", "SG"];
    const syncedCountries = new Set();

    for (const countryCode of countriesToSync) {
      try {
        console.log(`\n  Fetching cities for country: ${countryCode}`);
        const staticData = await getDestinationSearchStaticData(
          countryCode,
          tokenId,
        );

        // First, ensure country exists
        const countryName =
          staticData.destinations?.[0]?.countryName || countryCode;
        const countryNorm = normalizeString(countryName);

        await db.query(
          `INSERT INTO tbo_countries (country_code, country_name, country_name_normalized, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           ON CONFLICT (country_code)
           DO UPDATE SET country_name = EXCLUDED.country_name, country_name_normalized = EXCLUDED.country_name_normalized, updated_at = NOW()`,
          [countryCode, countryName, countryNorm, true],
        );

        console.log(`  ✓ Country ${countryCode} (${countryName}) synced`);
        syncedCountries.add(countryCode);

        // Now sync cities for this country
        const cities = staticData.destinations || [];
        console.log(`  ✓ Found ${cities.length} cities`);

        let cityCount = 0;
        for (const city of cities) {
          const tboCity = {
            tbo_city_id: String(city.destinationId || city.cityId),
            city_name: city.cityName,
            city_name_normalized: normalizeString(city.cityName),
            country_code: city.countryCode?.trim() || countryCode,
            region_name: city.stateProvince || null,
            latitude: city.latitude || null,
            longitude: city.longitude || null,
            is_active: true,
            last_synced_at: new Date().toISOString(),
            tbo_response: city,
          };

          try {
            await db.query(
              `INSERT INTO tbo_cities (tbo_city_id, city_name, city_name_normalized, country_code, region_name, latitude, longitude, is_active, last_synced_at, tbo_response, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
               ON CONFLICT (tbo_city_id)
               DO UPDATE SET city_name = EXCLUDED.city_name, city_name_normalized = EXCLUDED.city_name_normalized, region_name = EXCLUDED.region_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, last_synced_at = EXCLUDED.last_synced_at, updated_at = NOW()`,
              [
                tboCity.tbo_city_id,
                tboCity.city_name,
                tboCity.city_name_normalized,
                tboCity.country_code,
                tboCity.region_name,
                tboCity.latitude,
                tboCity.longitude,
                tboCity.is_active,
                tboCity.last_synced_at,
                JSON.stringify(tboCity.tbo_response),
              ],
            );
            cityCount++;
          } catch (cityError) {
            console.error(
              `    ⚠️  Failed to sync city ${city.cityName}:`,
              cityError.message,
            );
          }
        }

        console.log(`  ✓ Synced ${cityCount} cities for ${countryCode}`);
      } catch (countryError) {
        console.warn(
          `⚠️  Failed to fetch data for country ${countryCode}:`,
          countryError.message,
        );
      }
    }

    console.log(`\n✅ Synced ${syncedCountries.size} countries`);
    return syncedCountries;
  } catch (error) {
    console.error("❌ Error syncing TBO countries:", error.message);
    throw error;
  }
}

/**
 * Create mappings from Hotelbeds cities to TBO cities
 */
async function createCityMappings() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 2: Creating Hotelbeds → TBO City Mappings");
  console.log("=".repeat(80));

  try {
    // Get all Hotelbeds cities
    const hotelbedsCitiesResult = await db.query(
      `SELECT c.id, c.name, c.country_id, co.iso2 AS iso_code
       FROM cities c
       JOIN countries co ON c.country_id = co.id
       WHERE c.is_active = true
       ORDER BY co.iso2, c.name`,
    );

    const hotelbedsCities = hotelbedsCitiesResult.rows;
    console.log(`\n📍 Found ${hotelbedsCities.length} Hotelbeds cities to map`);

    let mappedCount = 0;
    let failedCount = 0;

    for (const hbCity of hotelbedsCities) {
      try {
        // Find best matching TBO city
        const tboCitiesResult = await db.query(
          `SELECT tbo_city_id, city_name, city_name_normalized, country_code
           FROM tbo_cities
           WHERE country_code = $1 AND is_active = true
           ORDER BY city_name_normalized`,
          [hbCity.iso_code],
        );

        const tboCities = tboCitiesResult.rows;

        if (tboCities.length === 0) {
          console.log(
            `  ⚠️  No TBO cities found for Hotelbeds city: ${hbCity.name} (${hbCity.iso_code})`,
          );
          failedCount++;
          continue;
        }

        // Find best match using similarity scoring
        let bestMatch = null;
        let bestScore = 0;

        for (const tboCity of tboCities) {
          const score = calculateSimilarity(hbCity.name, tboCity.city_name);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = tboCity;
          }
        }

        if (!bestMatch) {
          console.log(
            `  ⚠️  Could not find match for: ${hbCity.name} (${hbCity.iso_code})`,
          );
          failedCount++;
          continue;
        }

        // Determine match method
        const matchMethod =
          bestScore === 100
            ? "exact_name"
            : bestScore >= 85
              ? "normalized_name"
              : "fuzzy_match";

        // Insert or update mapping
        await db.query(
          `INSERT INTO city_mapping (hotelbeds_city_code, hotelbeds_city_name, hotelbeds_country_code, tbo_city_id, tbo_city_name, tbo_country_code, match_confidence, match_method, match_notes, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           ON CONFLICT (hotelbeds_city_code)
           DO UPDATE SET tbo_city_id = EXCLUDED.tbo_city_id, tbo_city_name = EXCLUDED.tbo_city_name, match_confidence = EXCLUDED.match_confidence, match_method = EXCLUDED.match_method, updated_at = NOW()`,
          [
            hbCity.name,
            hbCity.name,
            hbCity.iso_code,
            bestMatch.tbo_city_id,
            bestMatch.city_name,
            bestMatch.country_code,
            bestScore,
            matchMethod,
            `Matched: ${hbCity.name} (${hbCity.iso_code}) → ${bestMatch.city_name} (${bestMatch.tbo_city_id})`,
            true,
          ],
        );

        mappedCount++;

        if (bestScore < 80) {
          console.log(
            `  ℹ️  Low confidence match (${bestScore}): ${hbCity.name} → ${bestMatch.city_name}`,
          );
        }
      } catch (mapError) {
        console.error(
          `  ❌ Error mapping city ${hbCity.name}:`,
          mapError.message,
        );
        failedCount++;
      }
    }

    console.log(`\n✅ Created ${mappedCount} mappings`);
    if (failedCount > 0) {
      console.log(`⚠️  ${failedCount} cities could not be mapped`);
    }

    return mappedCount;
  } catch (error) {
    console.error("❌ Error creating city mappings:", error.message);
    throw error;
  }
}

/**
 * Log sync operation to audit table
 */
async function logSyncOperation(
  syncType,
  status,
  countryCode,
  recordsProcessed,
  recordsInserted,
  recordsUpdated,
  errorMessage,
  durationMs,
) {
  try {
    await db.query(
      `INSERT INTO tbo_sync_log (sync_type, status, country_code, records_processed, records_inserted, records_updated, error_message, started_at, completed_at, duration_ms, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '1 millisecond' * $8, NOW(), $8, NOW())`,
      [
        syncType,
        status,
        countryCode,
        recordsProcessed,
        recordsInserted,
        recordsUpdated,
        errorMessage,
        durationMs,
      ],
    );
  } catch (logError) {
    console.error("Failed to log sync operation:", logError.message);
  }
}

/**
 * Main function
 */
async function main() {
  const startTime = Date.now();
  console.log("\n" + "═".repeat(80));
  console.log("TBO CITY SYNC - Using Documented TBO API");
  console.log("═".repeat(80));
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    // Step 1: Sync TBO countries and cities
    const syncedCountries = await syncTBOCountries();

    // Step 2: Create mappings
    const mappedCount = await createCityMappings();

    const duration = Date.now() - startTime;
    console.log("\n" + "=".repeat(80));
    console.log("SYNC COMPLETE ✅");
    console.log("=".repeat(80));
    console.log(`Countries synced: ${syncedCountries.size}`);
    console.log(`Cities mapped: ${mappedCount}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Completed at: ${new Date().toISOString()}\n`);

    // Log final status
    await logSyncOperation(
      "cities_and_mapping",
      "success",
      null,
      syncedCountries.size,
      0,
      0,
      null,
      duration,
    );

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("SYNC FAILED ❌");
    console.error("=".repeat(80));
    console.error("Error:", error.message);
    console.error(error.stack);

    const duration = Date.now() - startTime;
    await logSyncOperation(
      "cities_and_mapping",
      "failed",
      null,
      0,
      0,
      0,
      error.message,
      duration,
    );

    await db.end();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  syncTBOCountries,
  createCityMappings,
  normalizeString,
  calculateSimilarity,
};
