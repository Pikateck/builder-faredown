#!/usr/bin/env node

const { Pool } = require("pg");

// Database connection
const dbUrl = process.env.DATABASE_URL;
const sslConfig = dbUrl && (dbUrl.includes("render.com") || dbUrl.includes("postgres://"))
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function testLondonPackages() {
  try {
    console.log("🔍 Testing London packages in database...");

    // 1. Check if London exists in cities
    const londonCities = await pool.query(`
      SELECT id, name, country_id FROM cities 
      WHERE name ILIKE '%London%'
    `);
    console.log("📍 London cities found:", londonCities.rows);

    // 2. Check if UK exists in countries
    const ukCountries = await pool.query(`
      SELECT id, name FROM countries 
      WHERE name ILIKE '%United Kingdom%' OR name ILIKE '%UK%' OR name ILIKE '%Britain%'
    `);
    console.log("🏴󠁧󠁢󠁥󠁮󠁧󠁿 UK countries found:", ukCountries.rows);

    // 3. Check packages with London in city_id
    if (londonCities.rows.length > 0) {
      const londonCityPackages = await pool.query(`
        SELECT p.id, p.title, p.city_id, c.name as city_name
        FROM packages p
        LEFT JOIN cities c ON p.city_id = c.id
        WHERE p.city_id = ANY($1)
      `, [londonCities.rows.map(row => row.id)]);
      console.log("📦 Packages with London city_id:", londonCityPackages.rows);
    }

    // 4. Check packages with UK country_id
    if (ukCountries.rows.length > 0) {
      const ukCountryPackages = await pool.query(`
        SELECT p.id, p.title, p.country_id, co.name as country_name, p.city_id, ci.name as city_name
        FROM packages p
        LEFT JOIN countries co ON p.country_id = co.id
        LEFT JOIN cities ci ON p.city_id = ci.id
        WHERE p.country_id = ANY($1)
      `, [ukCountries.rows.map(row => row.id)]);
      console.log("🏴󠁧󠁢󠁥󠁮󠁧󠁿 Packages with UK country_id:", ukCountryPackages.rows);
    }

    // 5. Check all packages with London in title/overview
    const londonTitlePackages = await pool.query(`
      SELECT p.id, p.title, p.overview, p.city_id, p.country_id
      FROM packages p
      WHERE p.title ILIKE '%London%' OR p.overview ILIKE '%London%'
    `);
    console.log("🔍 Packages with 'London' in title/overview:", londonTitlePackages.rows);

    // 6. Test the exact API filtering logic
    console.log("\n🧪 Testing exact API filtering logic...");
    const destinationName = "London";
    const testQuery = `
      SELECT p.id, p.title, p.city_id, p.country_id, 
             ci.name as city_name, co.name as country_name
      FROM packages p
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN countries co ON p.country_id = co.id
      WHERE p.status = 'active' AND (
        -- Direct city match
        EXISTS (
          SELECT 1 FROM cities ci2 
          WHERE ci2.id = p.city_id 
          AND ci2.name ILIKE $1
        )
        OR
        -- Country match for major cities (e.g., London -> United Kingdom)
        EXISTS (
          SELECT 1 FROM countries c 
          WHERE c.id = p.country_id 
          AND (
            -- Direct country name match
            c.name ILIKE $1
            OR
            -- Major city to country mapping
            (
              ($1 ILIKE '%London%' AND c.name ILIKE '%United Kingdom%')
            )
          )
        )
      )
    `;
    
    const testResult = await pool.query(testQuery, [`%${destinationName}%`]);
    console.log("✅ API Logic Test Result:", testResult.rows);

  } catch (error) {
    console.error("❌ Error testing London packages:", error);
  } finally {
    await pool.end();
  }
}

testLondonPackages();
