const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding iso_country column...');
    
    // Add iso_country column (safe - does nothing if already exists)
    await client.query(`
      ALTER TABLE airport_master 
      ADD COLUMN IF NOT EXISTS iso_country VARCHAR(2)
    `);
    
    console.log('✅ Column added');
    
    // Update iso_country from existing country codes
    console.log('📝 Populating iso_country from country codes...');
    await client.query(`
      UPDATE airport_master 
      SET iso_country = country 
      WHERE iso_country IS NULL AND LENGTH(country) = 2
    `);
    
    console.log('✅ iso_country populated');
    
    // Update major airports with full country names
    console.log('📝 Updating major airports with full country names...');
    
    const updates = [
      // India
      { iata: 'BOM', country: 'India', iso: 'IN' },
      { iata: 'DEL', country: 'India', iso: 'IN' },
      { iata: 'BLR', country: 'India', iso: 'IN' },
      { iata: 'MAA', country: 'India', iso: 'IN' },
      { iata: 'CCU', country: 'India', iso: 'IN' },
      { iata: 'HYD', country: 'India', iso: 'IN' },
      { iata: 'AMD', country: 'India', iso: 'IN' },
      { iata: 'GOI', country: 'India', iso: 'IN' },
      { iata: 'COK', country: 'India', iso: 'IN' },
      { iata: 'PNQ', country: 'India', iso: 'IN' },
      // UAE
      { iata: 'DXB', country: 'United Arab Emirates', iso: 'AE' },
      { iata: 'AUH', country: 'United Arab Emirates', iso: 'AE' },
      { iata: 'SHJ', country: 'United Arab Emirates', iso: 'AE' },
      // UK
      { iata: 'LHR', country: 'United Kingdom', iso: 'GB' },
      { iata: 'LGW', country: 'United Kingdom', iso: 'GB' },
      { iata: 'MAN', country: 'United Kingdom', iso: 'GB' },
      // USA
      { iata: 'JFK', country: 'United States', iso: 'US' },
      { iata: 'LAX', country: 'United States', iso: 'US' },
      { iata: 'ORD', country: 'United States', iso: 'US' },
      { iata: 'MIA', country: 'United States', iso: 'US' },
      // Others
      { iata: 'SIN', country: 'Singapore', iso: 'SG' },
      { iata: 'SYD', country: 'Australia', iso: 'AU' },
      { iata: 'MEL', country: 'Australia', iso: 'AU' },
      { iata: 'CDG', country: 'France', iso: 'FR' },
      { iata: 'FRA', country: 'Germany', iso: 'DE' },
      { iata: 'DOH', country: 'Qatar', iso: 'QA' },
      { iata: 'DUB', country: 'Ireland', iso: 'IE' },
      { iata: 'BKK', country: 'Thailand', iso: 'TH' },
      { iata: 'KUL', country: 'Malaysia', iso: 'MY' },
      { iata: 'HKG', country: 'Hong Kong', iso: 'HK' },
      { iata: 'NRT', country: 'Japan', iso: 'JP' },
      { iata: 'HND', country: 'Japan', iso: 'JP' },
    ];
    
    let updated = 0;
    for (const { iata, country, iso } of updates) {
      const result = await client.query(`
        UPDATE airport_master 
        SET country = $1, iso_country = $2
        WHERE iata = $3
      `, [country, iso, iata]);
      if (result.rowCount > 0) updated++;
    }
    
    console.log(`✅ Updated ${updated} major airports with full country names`);
    
    // Create search function
    console.log('🔍 Creating search function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION search_airports(
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
          a.iso_country::VARCHAR(2)
        FROM airport_master a
        WHERE a.is_active = true
          AND (
            a.name ILIKE '%' || search_query || '%'
            OR a.iata ILIKE '%' || search_query || '%'
            OR a.city ILIKE '%' || search_query || '%'
            OR a.country ILIKE '%' || search_query || '%'
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
    
    console.log('✅ Search function created');
    
    // Test it
    console.log('\n🧪 Testing search for "dub":');
    const testResult = await client.query("SELECT * FROM search_airports('dub', 5, 0)");
    testResult.rows.forEach(row => {
      console.log(`   ${row.iata}: ${row.name}, ${row.city}, ${row.country} (${row.iso_country})`);
    });
    
    console.log('\n✅ All done! Airport API should work now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema().catch(console.error);
