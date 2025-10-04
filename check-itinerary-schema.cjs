const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'package_itinerary_days'
      ORDER BY ordinal_position
    `);
    
    console.log('package_itinerary_days table schema:');
    console.log('=====================================\n');
    
    result.rows.forEach(col => {
      console.log(`${col.column_name}:`);
      console.log(`  Type: ${col.data_type} (${col.udt_name})`);
      console.log(`  Nullable: ${col.is_nullable}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
