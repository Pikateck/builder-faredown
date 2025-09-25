const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDestinationsData() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== DESTINATIONS DATA VERIFICATION ===\n');
    
    // Check if tables exist
    console.log('1. Checking if destination tables exist...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('regions', 'countries', 'cities')
      ORDER BY table_name;
    `;
    const tablesResult = await client.query(tablesQuery);
    console.log('Existing destination tables:', tablesResult.rows.map(r => r.table_name));
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ NO destination tables found!');
      return;
    }
    
    // Check regions data
    if (tablesResult.rows.some(r => r.table_name === 'regions')) {
      console.log('\n2. Checking regions data...');
      const regionsCount = await client.query('SELECT COUNT(*) as count FROM regions');
      console.log('Total regions:', regionsCount.rows[0].count);
      
      if (parseInt(regionsCount.rows[0].count) > 0) {
        const sampleRegions = await client.query('SELECT id, name, level FROM regions ORDER BY name LIMIT 10');
        console.log('Sample regions:', sampleRegions.rows);
        
        // Check for Europe specifically
        const europeRegion = await client.query("SELECT id, name, level FROM regions WHERE name = 'Europe'");
        console.log('Europe region:', europeRegion.rows);
      }
    }
    
    // Check countries data
    if (tablesResult.rows.some(r => r.table_name === 'countries')) {
      console.log('\n3. Checking countries data...');
      const countriesCount = await client.query('SELECT COUNT(*) as count FROM countries');
      console.log('Total countries:', countriesCount.rows[0].count);
      
      if (parseInt(countriesCount.rows[0].count) > 0) {
        const sampleCountries = await client.query('SELECT id, name, iso2, region_id FROM countries ORDER BY name LIMIT 10');
        console.log('Sample countries:', sampleCountries.rows);
        
        // Check countries linked to Europe
        const europeCountries = await client.query(`
          SELECT c.id, c.name, c.iso2 
          FROM countries c
          JOIN regions r ON r.id = c.region_id
          WHERE r.name = 'Europe'
          ORDER BY c.name
          LIMIT 10
        `);
        console.log('Europe countries:', europeCountries.rows);
      }
    }
    
    // Check cities data
    if (tablesResult.rows.some(r => r.table_name === 'cities')) {
      console.log('\n4. Checking cities data...');
      const citiesCount = await client.query('SELECT COUNT(*) as count FROM cities');
      console.log('Total cities:', citiesCount.rows[0].count);
      
      if (parseInt(citiesCount.rows[0].count) > 0) {
        const sampleCities = await client.query('SELECT id, name, code, country_id FROM cities ORDER BY name LIMIT 10');
        console.log('Sample cities:', sampleCities.rows);
        
        // Check cities for Europe
        const europeCities = await client.query(`
          SELECT ci.id, ci.name, ci.code, co.name as country_name
          FROM cities ci
          JOIN countries co ON co.id = ci.country_id
          JOIN regions r ON r.id = co.region_id
          WHERE r.name = 'Europe'
          ORDER BY ci.name
          LIMIT 10
        `);
        console.log('Europe cities:', europeCities.rows);
      }
    }
    
    // Check schema for each table
    console.log('\n5. Checking table schemas...');
    for (const table of ['regions', 'countries', 'cities']) {
      if (tablesResult.rows.some(r => r.table_name === table)) {
        const schemaQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
        const schemaResult = await client.query(schemaQuery, [table]);
        console.log(`\n${table} schema:`, schemaResult.rows);
      }
    }
    
  } catch (error) {
    console.error('Error checking destinations data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDestinationsData();
