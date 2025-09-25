const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applyComprehensiveSchema() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== APPLYING COMPREHENSIVE DESTINATIONS SCHEMA ===\n');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'api/database/migrations/comprehensive-destinations-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('1. Reading schema file...');
    console.log(`   File size: ${schemaSQL.length} characters`);
    
    console.log('\n2. Applying schema to database...');
    await client.query(schemaSQL);
    console.log('✅ Schema applied successfully');
    
    // Test the new schema
    console.log('\n3. Testing new schema...');
    
    // Check tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('regions', 'countries', 'cities')
      ORDER BY table_name;
    `;
    const tablesResult = await client.query(tablesQuery);
    console.log('✅ Tables created:', tablesResult.rows.map(r => r.table_name));
    
    // Check enum exists
    const enumQuery = `
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'geo_level';
    `;
    const enumResult = await client.query(enumQuery);
    console.log('✅ Enum created:', enumResult.rows.length > 0 ? 'geo_level' : 'none');
    
    // Check functions exist
    const functionsQuery = `
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN ('upsert_region', 'upsert_country', 'upsert_city', 'get_destination_stats')
      ORDER BY proname;
    `;
    const functionsResult = await client.query(functionsQuery);
    console.log('✅ Functions created:', functionsResult.rows.map(r => r.proname));
    
    // Test stats function
    const statsResult = await client.query('SELECT get_destination_stats() as stats');
    const stats = statsResult.rows[0].stats;
    console.log('✅ Initial stats:', stats);
    
    console.log('\n✅ COMPREHENSIVE SCHEMA APPLIED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyComprehensiveSchema();
