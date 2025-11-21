/**
 * Map Hotelbeds Cities to TBO Cities
 *
 * Usage: node api/scripts/map-hotelbeds-to-tbo-cities.js [--limit=50] [--verify]
 *
 * This script:
 * 1. Reads all unique cities from hotelbeds_destinations table
 * 2. For each city, finds the best matching TBO city
 * 3. Creates entries in city_mapping table
 * 4. Reports coverage and any cities that couldn't be mapped
 */

const db = require("../database/connection");
const CityMappingService = require("../services/cityMappingService");

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 500;
const verify = args.includes("--verify");

async function main() {
  try {
    console.log("🚀 Hotelbeds ↔ TBO City Mapping Script");
    console.log(`Options: limit=${limit}, verify=${verify}\n`);

    // Initialize DB
    await db.initialize();
    await db.initializeSchema();

    // Check if TBO cities exist
    const tboCount = await db.query(
      "SELECT COUNT(*) as count FROM public.tbo_cities",
    );
    if (tboCount.rows[0].count === 0) {
      throw new Error("No TBO cities found. Run populate-tbo-cities.js first.");
    }

    console.log(`✅ TBO cities available: ${tboCount.rows[0].count} cities`);

    // ============================================================
    // Step 1: Get Hotelbeds cities
    // ============================================================
    console.log("\n📥 Fetching Hotelbeds destinations...");

    // Assuming hotelbeds_destinations table exists with columns: code, destination_name, country_code
    const hbResult = await db.query(
      `
      SELECT DISTINCT ON (code)
        code as city_code,
        destination_name as city_name,
        country_code
      FROM public.hotelbeds_destinations
      WHERE code IS NOT NULL AND destination_name IS NOT NULL
      ORDER BY code
      LIMIT $1
    `,
      [limit],
    );

    const hbCities = hbResult.rows;
    console.log(
      `✅ Found ${hbCities.length} unique Hotelbeds cities (limit: ${limit})`,
    );

    // ============================================================
    // Step 2: Map each city to TBO
    // ============================================================
    console.log("\n🔗 Mapping cities...");

    let mapped = 0;
    let unmapped = 0;
    const unmappedCities = [];

    for (let i = 0; i < hbCities.length; i++) {
      const hb = hbCities[i];
      const progress = `[${i + 1}/${hbCities.length}]`;

      try {
        const result = await CityMappingService.getOrCreateMapping(
          hb.city_code,
          hb.city_name,
          hb.country_code,
        );

        if (result) {
          if (verify) {
            await CityMappingService.verifyMapping(
              hb.city_code,
              "map-hotelbeds-script",
            );
          }
          mapped++;
        } else {
          unmapped++;
          unmappedCities.push(hb);
        }

        if ((i + 1) % 25 === 0) {
          console.log(
            `  ${progress} Processed ${i + 1}/${hbCities.length} (${mapped} mapped, ${unmapped} unmapped)`,
          );
        }
      } catch (error) {
        console.error(
          `  ❌ ${progress} Error mapping ${hb.city_code} (${hb.city_name}): ${error.message}`,
        );
        unmapped++;
        unmappedCities.push(hb);
      }
    }

    console.log(`\n✅ Complete!`);
    console.log(`  ✓ Mapped: ${mapped}`);
    console.log(`  ✗ Unmapped: ${unmapped}`);

    if (unmappedCities.length > 0 && unmappedCities.length <= 10) {
      console.log(`\n⚠️  Unmapped cities (manual review needed):`);
      unmappedCities.forEach((city) => {
        console.log(
          `  - ${city.city_code} (${city.city_name}) in ${city.country_code}`,
        );
      });
    }

    // ============================================================
    // Step 3: Statistics
    // ============================================================
    const stats = await db.query(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN match_confidence = 100 THEN 1 ELSE 0 END) as exact_matches,
        SUM(CASE WHEN match_confidence >= 85 AND match_confidence < 100 THEN 1 ELSE 0 END) as high_confidence,
        SUM(CASE WHEN match_confidence >= 60 AND match_confidence < 85 THEN 1 ELSE 0 END) as medium_confidence,
        SUM(CASE WHEN match_confidence < 60 THEN 1 ELSE 0 END) as low_confidence,
        SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified_count
      FROM public.city_mapping
      WHERE is_active = true
    `,
    );

    const s = stats.rows[0];
    console.log(`\n📊 Mapping Quality Stats:`);
    console.log(`  Total mappings: ${s.total}`);
    console.log(
      `  Exact (100%): ${s.exact_matches} (${((s.exact_matches / s.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  High (85-99%): ${s.high_confidence} (${((s.high_confidence / s.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  Medium (60-84%): ${s.medium_confidence} (${((s.medium_confidence / s.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  Low (<60%): ${s.low_confidence} (${((s.low_confidence / s.total) * 100).toFixed(1)}%)`,
    );
    console.log(`  Verified: ${s.verified_count}`);

    // Show sample high-quality mappings
    const samples = await db.query(
      `
      SELECT 
        hotelbeds_city_code, hotelbeds_city_name,
        tbo_city_id, tbo_city_name,
        match_confidence, match_method
      FROM public.city_mapping
      WHERE is_active = true AND match_confidence >= 85
      ORDER BY match_confidence DESC, hotelbeds_city_code
      LIMIT 10
    `,
    );

    if (samples.rows.length > 0) {
      console.log(`\n🎯 Sample High-Quality Mappings (confidence ≥ 85%):`);
      samples.rows.forEach((row) => {
        console.log(
          `  ${row.hotelbeds_city_code.padEnd(10)} → TBO ${row.tbo_city_id} [${row.match_confidence}% via ${row.match_method}]`,
        );
      });
    }

    console.log(`\n✨ Mapping complete. Ready for cache pre-seeding!`);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
