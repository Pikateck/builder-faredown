const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applySchema() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Reading SQL schema...');
    const sql = fs.readFileSync('create-airport-master-table.sql', 'utf8');
    
    console.log('🔧 Creating airport_master table and inserting data...');
    await client.query(sql);
    
    console.log('✅ Schema applied successfully!');
    
    // Verify
    const result = await client.query('SELECT COUNT(*) as total FROM airport_master WHERE is_active = true');
    console.log(`📊 Total active airports in database: ${result.rows[0].total}`);
    
    // Test search function
    console.log('\n🔍 Testing search function with "dub":');
    const searchResult = await client.query("SELECT * FROM search_airports('dub', 5, 0)");
    console.log(`   Found ${searchResult.rows.length} airports:`);
    searchResult.rows.forEach(row => {
      console.log(`   - ${row.iata}: ${row.name}, ${row.city}, ${row.country}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Details:', error.detail || error.hint || '');
  } finally {
    client.release();
    await pool.end();
  }
}

applySchema().catch(console.error);
