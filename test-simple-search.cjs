#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testSimpleSearch() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing basic search functionality...\n');
    
    // Test 1: Simple city search without any complex features
    console.log('=== Test 1: Basic City Search ===');
    const citySearch = await client.query(`
      SELECT 
        'city' as type,
        ci.name || ', ' || co.name as label,
        r.name as region
      FROM cities ci
      JOIN countries co ON ci.country_id = co.id
      JOIN regions r ON co.region_id = r.id
      WHERE ci.is_active = TRUE 
        AND ci.name ILIKE '%dubai%'
      LIMIT 3;
    `);
    
    console.log(`City search results: ${citySearch.rows.length}`);
    citySearch.rows.forEach(row => {
      console.log(`   ${row.type}: ${row.label} • ${row.region}`);
    });
    
    // Test 2: Country search with aliases
    console.log('\n=== Test 2: Country Search with Aliases ===');
    const countrySearch = await client.query(`
      SELECT 
        'country' as type,
        co.name as label,
        r.name as region
      FROM countries co
      JOIN regions r ON co.region_id = r.id
      WHERE co.is_active = TRUE 
        AND ('uae' = ANY(co.search_tokens) OR co.name ILIKE '%uae%')
      LIMIT 3;
    `);
    
    console.log(`Country search results: ${countrySearch.rows.length}`);
    countrySearch.rows.forEach(row => {
      console.log(`   ${row.type}: ${row.label} • ${row.region}`);
    });
    
    // Test 3: Region search
    console.log('\n=== Test 3: Region Search ===');
    const regionSearch = await client.query(`
      SELECT 
        'region' as type,
        r.name as label
      FROM regions r
      WHERE r.is_active = TRUE 
        AND r.name ILIKE '%europe%'
      LIMIT 3;
    `);
    
    console.log(`Region search results: ${regionSearch.rows.length}`);
    regionSearch.rows.forEach(row => {
      console.log(`   ${row.type}: ${row.label}`);
    });
    
    // Test 4: Performance test
    console.log('\n=== Test 4: Performance Test ===');
    const start = Date.now();
    
    const performanceTest = await client.query(`
      SELECT COUNT(*) as total_cities FROM cities WHERE is_active = TRUE;
    `);
    
    const duration = Date.now() - start;
    console.log(`Database query took: ${duration}ms`);
    console.log(`Total active cities: ${performanceTest.rows[0].total_cities}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testSimpleSearch().catch(console.error);
