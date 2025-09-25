const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testDestinationsQueries() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== TESTING DESTINATIONS QUERIES ===\n');
    
    // Test 1: Get regions (API query simulation)
    console.log('1. Testing regions query (API simulation)...');
    const regionsQuery = `
      SELECT 
        r.*,
        pr.name as parent_name,
        (
          SELECT COUNT(*)
          FROM regions cr
          WHERE cr.parent_id = r.id AND cr.is_active = TRUE
        ) as children_count,
        (
          SELECT COUNT(*)
          FROM countries c
          WHERE c.region_id = r.id
        ) as countries_count
      FROM regions r
      LEFT JOIN regions pr ON r.parent_id = pr.id
      WHERE r.is_active = TRUE
      ORDER BY r.level, r.sort_order, r.name
    `;
    
    const regionsResult = await client.query(regionsQuery);
    console.log('Regions found:', regionsResult.rows.length);
    console.log('Regions data:', regionsResult.rows);
    
    // Test 2: Get cities for Europe (API query simulation)
    console.log('\n2. Testing cities for Europe query...');
    const europeId = 2; // From our previous check, Europe has ID 2
    
    const citiesQuery = `
      SELECT
        ci.id, ci.name, ci.code,
        jsonb_build_object(
          'id', co.id,
          'name', co.name,
          'iso', co.iso2
        ) as country
      FROM cities ci
      JOIN countries co ON co.id = ci.country_id
      WHERE ci.is_active = TRUE
        AND (co.region_id = $1 OR ci.region_id = $1)
      ORDER BY ci.name
      LIMIT 50
    `;
    
    const citiesResult = await client.query(citiesQuery, [europeId]);
    console.log('Cities found for Europe:', citiesResult.rows.length);
    console.log('Cities data:', citiesResult.rows);
    
    // Test 3: Check countries linked to Europe
    console.log('\n3. Testing countries linked to Europe...');
    const europeCountriesQuery = `
      SELECT c.id, c.name, c.iso2, c.region_id
      FROM countries c
      WHERE c.region_id = $1
      ORDER BY c.name
      LIMIT 20
    `;
    
    const europeCountriesResult = await client.query(europeCountriesQuery, [europeId]);
    console.log('Countries linked to Europe:', europeCountriesResult.rows.length);
    console.log('Europe countries data:', europeCountriesResult.rows);
    
    // Test 4: Check what countries exist with NULL region_id
    console.log('\n4. Checking countries with NULL region_id...');
    const nullRegionCountriesQuery = `
      SELECT c.id, c.name, c.iso2, c.region_id
      FROM countries c
      WHERE c.region_id IS NULL
      ORDER BY c.name
      LIMIT 10
    `;
    
    const nullRegionResult = await client.query(nullRegionCountriesQuery);
    console.log('Countries with NULL region_id:', nullRegionResult.rows.length);
    console.log('Sample countries with NULL region_id:', nullRegionResult.rows);
    
  } catch (error) {
    console.error('Error testing queries:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDestinationsQueries();
