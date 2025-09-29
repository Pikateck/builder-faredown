/**
 * Test London Search Query Directly
 * Test the exact SQL query that should find London packages
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testLondonQuery() {
  try {
    console.log("🧪 Testing London search query logic...");

    // Test the query logic from the updated API
    const destinationName = "London";

    // This is the smart query from my fix
    const smartQuery = `
      SELECT 
        p.id,
        p.title,
        p.base_price_pp,
        c.name as country_name,
        ci.name as city_name
      FROM packages p
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE p.status = 'active'
      AND (
        -- Direct city match
        EXISTS (
          SELECT 1 FROM cities ci2 
          WHERE ci2.id = p.city_id 
          AND ci2.name ILIKE $1
        )
        OR
        -- Country match for major cities (e.g., London -> United Kingdom)
        EXISTS (
          SELECT 1 FROM countries c2 
          WHERE c2.id = p.country_id 
          AND (
            -- Direct country name match
            c2.name ILIKE $1
            OR
            -- Major city to country mapping
            (
              ($1 ILIKE '%London%' AND c2.name ILIKE '%United Kingdom%') OR
              ($1 ILIKE '%Paris%' AND c2.name ILIKE '%France%') OR
              ($1 ILIKE '%Tokyo%' AND c2.name ILIKE '%Japan%') OR
              ($1 ILIKE '%Sydney%' AND c2.name ILIKE '%Australia%') OR
              ($1 ILIKE '%New York%' AND c2.name ILIKE '%United States%') OR
              ($1 ILIKE '%Dubai%' AND c2.name ILIKE '%United Arab Emirates%') OR
              ($1 ILIKE '%Bangkok%' AND c2.name ILIKE '%Thailand%') OR
              ($1 ILIKE '%Singapore%' AND c2.name ILIKE '%Singapore%') OR
              ($1 ILIKE '%Rome%' AND c2.name ILIKE '%Italy%') OR
              ($1 ILIKE '%Madrid%' AND c2.name ILIKE '%Spain%') OR
              ($1 ILIKE '%Berlin%' AND c2.name ILIKE '%Germany%') OR
              ($1 ILIKE '%Amsterdam%' AND c2.name ILIKE '%Netherlands%')
            )
          )
        )
      )
    `;

    const result = await pool.query(smartQuery, [`%${destinationName}%`]);

    console.log(
      `✅ Smart query found ${result.rows.length} packages for "${destinationName}"`,
    );
    result.rows.forEach((pkg) => {
      console.log(
        `- ${pkg.title} (${pkg.country_name}) - ₹${pkg.base_price_pp?.toLocaleString()}`,
      );
    });

    // Test simpler query to verify UK packages exist
    const simpleQuery = `
      SELECT 
        p.title,
        c.name as country_name,
        p.base_price_pp
      FROM packages p
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE p.status = 'active'
      AND c.name ILIKE '%United Kingdom%'
    `;

    const simpleResult = await pool.query(simpleQuery);
    console.log(
      `\n📋 Simple UK query found ${simpleResult.rows.length} packages:`,
    );
    simpleResult.rows.forEach((pkg) => {
      console.log(
        `- ${pkg.title} (${pkg.country_name}) - ₹${pkg.base_price_pp?.toLocaleString()}`,
      );
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

testLondonQuery();
