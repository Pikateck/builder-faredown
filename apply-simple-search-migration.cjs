#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applySimpleSearchMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Applying simple search performance migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'api/database/migrations/simple-search-performance.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Executing migration SQL...');
    const start = Date.now();
    
    // Execute the entire migration as one block
    await client.query(migrationSQL);
    
    const duration = Date.now() - start;
    console.log(`✅ Migration completed in ${duration}ms!\n`);
    
    // Verify the migration worked
    console.log('🔍 Verifying migration results...\n');
    
    // Check if pg_trgm extension is available
    const extResult = await client.query("SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';");
    console.log(`📋 pg_trgm extension: ${extResult.rows.length > 0 ? '✅ Available' : '❌ Missing'}`);
    
    // Check new indexes
    const indexResult = await client.query(`
      SELECT count(*) as index_count 
      FROM pg_indexes 
      WHERE indexname LIKE '%_trgm' OR indexname LIKE '%search%';
    `);
    console.log(`📋 Search indexes created: ${indexResult.rows[0].index_count}`);
    
    // Check search_tokens columns
    const tokensCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'search_tokens' 
      AND table_name IN ('regions', 'countries', 'cities');
    `);
    console.log(`📋 Tables with search_tokens: ${tokensCheck.rows.length}/3`);
    
    // Test search performance
    console.log('\n🏃‍♂️ Testing search performance...\n');
    
    // Test Dubai search
    const dubaiStart = Date.now();
    const dubaiResult = await client.query(`
      SELECT 'city' as type, c.name || ', ' || co.name as label, r.name as region
      FROM cities c
      JOIN countries co ON c.country_id = co.id
      JOIN regions r ON co.region_id = r.id
      WHERE c.search_text ILIKE '%dubai%' OR 'dubai' = ANY(c.search_tokens)
      LIMIT 3;
    `);
    const dubaiDuration = Date.now() - dubaiStart;
    console.log(`⚡ Dubai search: ${dubaiDuration}ms (${dubaiResult.rows.length} results)`);
    dubaiResult.rows.forEach(row => console.log(`   ${row.type}: ${row.label} • ${row.region}`));
    
    // Test UAE alias
    const uaeStart = Date.now();
    const uaeResult = await client.query(`
      SELECT 'country' as type, co.name as label, r.name as region
      FROM countries co
      JOIN regions r ON co.region_id = r.id
      WHERE co.search_text ILIKE '%uae%' OR 'uae' = ANY(co.search_tokens)
      LIMIT 3;
    `);
    const uaeDuration = Date.now() - uaeStart;
    console.log(`⚡ UAE alias search: ${uaeDuration}ms (${uaeResult.rows.length} results)`);
    uaeResult.rows.forEach(row => console.log(`   ${row.type}: ${row.label} • ${row.region}`));
    
    // Test Europe search
    const europeStart = Date.now();
    const europeResult = await client.query(`
      SELECT 'region' as type, name as label, name as region
      FROM regions
      WHERE search_text ILIKE '%europe%' OR 'europe' = ANY(search_tokens)
      LIMIT 3;
    `);
    const europeDuration = Date.now() - europeStart;
    console.log(`⚡ Europe search: ${europeDuration}ms (${europeResult.rows.length} results)`);
    europeResult.rows.forEach(row => console.log(`   ${row.type}: ${row.label}`));
    
    // Test Paris search
    const parisStart = Date.now();
    const parisResult = await client.query(`
      SELECT 'city' as type, c.name || ', ' || co.name as label, r.name as region
      FROM cities c
      JOIN countries co ON c.country_id = co.id
      JOIN regions r ON co.region_id = r.id
      WHERE c.search_text ILIKE '%paris%' OR 'paris' = ANY(c.search_tokens)
      LIMIT 3;
    `);
    const parisDuration = Date.now() - parisStart;
    console.log(`⚡ Paris search: ${parisDuration}ms (${parisResult.rows.length} results)`);
    parisResult.rows.forEach(row => console.log(`   ${row.type}: ${row.label} • ${row.region}`));
    
    console.log('\n✅ Migration verification complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applySimpleSearchMigration().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
