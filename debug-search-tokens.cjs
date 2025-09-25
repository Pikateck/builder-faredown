#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugSearchTokens() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging search tokens and queries...\n');
    
    // Check UAE-related records
    console.log('=== UAE-related Countries ===');
    const uaeCountries = await client.query(`
      SELECT name, search_tokens, search_text 
      FROM countries 
      WHERE name ILIKE '%emirates%' OR 'uae' = ANY(search_tokens);
    `);
    
    uaeCountries.rows.forEach(row => {
      console.log(`📍 ${row.name}`);
      console.log(`   tokens: ${JSON.stringify(row.search_tokens)}`);
      console.log(`   search_text: "${row.search_text}"`);
    });
    
    // Test array search directly
    console.log('\n=== Direct Array Search Test ===');
    const arrayTest = await client.query(`
      SELECT name, search_tokens
      FROM countries 
      WHERE 'uae' = ANY(search_tokens);
    `);
    
    console.log(`Direct array search results: ${arrayTest.rows.length}`);
    arrayTest.rows.forEach(row => {
      console.log(`   ${row.name}: ${JSON.stringify(row.search_tokens)}`);
    });
    
    // Test ILIKE search
    console.log('\n=== ILIKE Search Test ===');
    const ilikeTest = await client.query(`
      SELECT name, search_text
      FROM countries 
      WHERE search_text ILIKE '%uae%';
    `);
    
    console.log(`ILIKE search results: ${ilikeTest.rows.length}`);
    ilikeTest.rows.forEach(row => {
      console.log(`   ${row.name}: "${row.search_text}"`);
    });
    
    // Test combined search like in the API
    console.log('\n=== Combined Search Test (like API) ===');
    const combinedTest = await client.query(`
      SELECT 
        'country' as type,
        co.name as label,
        r.name as region_name,
        co.search_tokens,
        co.search_text
      FROM countries co
      JOIN regions r ON co.region_id = r.id
      WHERE co.is_active = TRUE 
        AND r.is_active = TRUE
        AND (
          co.search_text ILIKE '%uae%'
          OR 'uae' = ANY(co.search_tokens)
        );
    `);
    
    console.log(`Combined search results: ${combinedTest.rows.length}`);
    combinedTest.rows.forEach(row => {
      console.log(`   ${row.label} (${row.region_name})`);
      console.log(`   tokens: ${JSON.stringify(row.search_tokens)}`);
      console.log(`   search_text: "${row.search_text}"`);
    });
    
    // Check Dubai city record
    console.log('\n=== Dubai City Check ===');
    const dubaiTest = await client.query(`
      SELECT 
        ci.name,
        ci.search_tokens,
        ci.search_text,
        co.name as country_name
      FROM cities ci
      JOIN countries co ON ci.country_id = co.id
      WHERE ci.name ILIKE '%dubai%';
    `);
    
    dubaiTest.rows.forEach(row => {
      console.log(`🏙️  ${row.name}, ${row.country_name}`);
      console.log(`   tokens: ${JSON.stringify(row.search_tokens)}`);
      console.log(`   search_text: "${row.search_text}"`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugSearchTokens().catch(console.error);
