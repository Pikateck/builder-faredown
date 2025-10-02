const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixFunction() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Dropping old search function...');
    await client.query('DROP FUNCTION IF EXISTS search_airports(TEXT, INTEGER, INTEGER)');
    
    console.log('🔍 Creating new search function...');
    await client.query(`
      CREATE FUNCTION search_airports(
        search_query TEXT,
        result_limit INTEGER DEFAULT 50,
        result_offset INTEGER DEFAULT 0
      )
      RETURNS TABLE (
        iata VARCHAR(3),
        name TEXT,
        city TEXT,
        country TEXT,
        iso_country VARCHAR(2)
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          a.iata::VARCHAR(3),
          a.name,
          COALESCE(a.city, '')::TEXT,
          COALESCE(a.country, '')::TEXT,
          COALESCE(a.iso_country, '')::VARCHAR(2)
        FROM airport_master a
        WHERE a.is_active = true
          AND (
            a.name ILIKE '%' || search_query || '%'
            OR a.iata ILIKE '%' || search_query || '%'
            OR COALESCE(a.city, '') ILIKE '%' || search_query || '%'
            OR COALESCE(a.country, '') ILIKE '%' || search_query || '%'
          )
        ORDER BY 
          CASE 
            WHEN a.iata ILIKE search_query THEN 1
            WHEN a.iata ILIKE search_query || '%' THEN 2
            WHEN a.city ILIKE search_query || '%' THEN 3
            ELSE 4
          END,
          a.name
        LIMIT result_limit
        OFFSET result_offset;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Search function created successfully');
    
    // Test searches
    console.log('\n🧪 Testing searches:');
    
    const tests = ['dub', 'mum', 'United Arab'];
    for (const query of tests) {
      const result = await client.query("SELECT * FROM search_airports($1, 3, 0)", [query]);
      console.log(`\n   Search "${query}" (${result.rows.length} results):`);
      result.rows.forEach(row => {
        console.log(`      ${row.iata}: ${row.name}, ${row.city}, ${row.country} (${row.iso_country})`);
      });
    }
    
    console.log('\n✅ Airport search is working! The API should work now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixFunction().catch(console.error);
