/**
 * Populate TBO Cities Master from TBO Static Data APIs
 *
 * Usage: node api/scripts/populate-tbo-cities.js [--countries-only] [--reset]
 *
 * This script:
 * 1. Fetches TBO's CountryList API
 * 2. For each country, fetches CityList API
 * 3. Stores results in tbo_countries and tbo_cities tables
 * 4. Logs progress and any errors
 */

const db = require("../database/connection");
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");

const args = process.argv.slice(2);
const countriesOnly = args.includes("--countries-only");
const reset = args.includes("--reset");

async function main() {
  try {
    console.log("🚀 TBO Cities Master Population Script");
    console.log(`Options: countriesOnly=${countriesOnly}, reset=${reset}\n`);

    // Initialize DB
    await db.initialize();
    await db.initializeSchema();

    // Get TBO adapter
    const adapter = supplierAdapterManager.getAdapter("TBO");
    if (!adapter) {
      throw new Error("TBO adapter not available");
    }

    console.log("🔐 Authenticating with TBO...");
    await adapter.authenticate();

    // ============================================================
    // Step 1: Fetch CountryList
    // ============================================================
    console.log("\n📥 Fetching TBO CountryList...");
    const countryListResponse = await adapter.getCountryList();
    const countries = countryListResponse.CountryList || [];

    if (!countries.length) {
      throw new Error("No countries returned from TBO CountryList");
    }

    console.log(`✅ Received ${countries.length} countries from TBO`);

    // Optional: Reset tables
    if (reset) {
      console.log("🔄 Resetting tbo_cities and tbo_countries tables...");
      await db.query("TRUNCATE public.tbo_cities");
      await db.query("TRUNCATE public.tbo_countries");
    }

    // ============================================================
    // Step 2: Insert countries
    // ============================================================
    console.log("\n💾 Storing countries in database...");
    let countryCount = 0;

    for (const country of countries) {
      const { CountryCode, CountryName } = country;
      if (!CountryCode) continue;

      const normalized = CountryName
        ? CountryName.toLowerCase().trim()
        : CountryCode.toLowerCase();

      await db.query(
        `
        INSERT INTO public.tbo_countries
          (country_code, country_name, country_name_normalized, tbo_response)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (country_code) DO UPDATE SET
          country_name = $2,
          country_name_normalized = $3,
          tbo_response = $4,
          updated_at = NOW()
      `,
        [
          CountryCode,
          CountryName || CountryCode,
          normalized,
          JSON.stringify(country),
        ],
      );

      countryCount++;
      if (countryCount % 10 === 0) {
        console.log(`  ✓ Processed ${countryCount} countries...`);
      }
    }

    console.log(`✅ Stored ${countryCount} countries`);

    if (countriesOnly) {
      console.log("\n✅ Countries-only mode. Exiting.");
      process.exit(0);
    }

    // ============================================================
    // Step 3: Fetch and store cities for each country
    // ============================================================
    console.log("\n📥 Fetching TBO CityList for each country...");
    let cityCount = 0;
    let errorCount = 0;

    for (const country of countries) {
      const { CountryCode } = country;
      if (!CountryCode) continue;

      try {
        console.log(`  → Fetching cities for ${CountryCode}...`);
        const cityListResponse = await adapter.getCityList(CountryCode);
        const cities = cityListResponse.CityList || [];

        console.log(`    ✓ ${cities.length} cities received`);

        // Store cities
        for (const city of cities) {
          const { CityId, CityName, Latitude, Longitude } = city;
          if (!CityId) continue;

          const normalized = CityName ? CityName.toLowerCase().trim() : "";

          await db.query(
            `
            INSERT INTO public.tbo_cities
              (tbo_city_id, city_name, city_name_normalized, country_code, 
               latitude, longitude, tbo_response, last_synced_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (tbo_city_id) DO UPDATE SET
              city_name = $2,
              city_name_normalized = $3,
              latitude = $5,
              longitude = $6,
              tbo_response = $7,
              updated_at = NOW()
          `,
            [
              CityId,
              CityName || `City_${CityId}`,
              normalized,
              CountryCode,
              Latitude || null,
              Longitude || null,
              JSON.stringify(city),
            ],
          );

          cityCount++;
        }
      } catch (error) {
        console.error(
          `  ❌ Error fetching cities for ${CountryCode}: ${error.message}`,
        );
        errorCount++;
      }

      // Rate limit: 1 second between country requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `\n✅ Stored ${cityCount} cities (${errorCount} country errors)`,
    );

    // ============================================================
    // Step 4: Summary statistics
    // ============================================================
    const countResult = await db.query(
      "SELECT COUNT(*) as count FROM public.tbo_cities",
    );
    const countryCountResult = await db.query(
      "SELECT COUNT(*) as count FROM public.tbo_countries",
    );

    console.log(`\n📊 Final Counts:`);
    console.log(`  Countries: ${countryCountResult.rows[0].count}`);
    console.log(`  Cities: ${countResult.rows[0].count}`);

    // Show sample
    const sampleResult = await db.query(
      `
      SELECT country_code, COUNT(*) as city_count
      FROM public.tbo_cities
      GROUP BY country_code
      ORDER BY city_count DESC
      LIMIT 10
    `,
    );

    console.log(`\n🌍 Top 10 Countries by City Count:`);
    sampleResult.rows.forEach((row) => {
      console.log(`  ${row.country_code}: ${row.city_count} cities`);
    });

    console.log(`\n✅ Complete!`);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
