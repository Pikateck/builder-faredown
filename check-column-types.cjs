const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL || 'postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl?.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function checkColumnTypes() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking packages table column types...\n');
    
    const result = await client.query(`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'packages'
      AND column_name IN ('description', 'overview', 'highlights', 'inclusions', 'exclusions')
      ORDER BY column_name;
    `);
    
    console.log('Column Types:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.udt_name})`);
    });
    
    // Also check actual data
    console.log('\n📊 Sample data from dubai-luxury-experience:');
    const data = await client.query(`
      SELECT 
        description,
        overview,
        highlights,
        pg_typeof(highlights) as highlights_type,
        pg_typeof(inclusions) as inclusions_type
      FROM packages 
      WHERE slug = 'dubai-luxury-experience'
    `);
    
    if (data.rows.length > 0) {
      const pkg = data.rows[0];
      console.log('  Description:', pkg.description?.substring(0, 100) + '...');
      console.log('  Overview:', pkg.overview?.substring(0, 100) + '...');
      console.log('  Highlights type:', pkg.highlights_type);
      console.log('  Highlights value:', JSON.stringify(pkg.highlights, null, 2));
      console.log('  Inclusions type:', pkg.inclusions_type);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumnTypes().catch(console.error);
