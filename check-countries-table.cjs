/**
 * Check existing countries table structure
 */

const { Pool } = require('pg');

async function checkCountriesTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking countries table structure...');
    
    // Get table columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'countries'
      ORDER BY ordinal_position;
    `);
    
    console.log('Countries table columns:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Get sample data
    const sampleData = await pool.query('SELECT * FROM countries LIMIT 3');
    console.log('\nSample data:');
    sampleData.rows.forEach(row => {
      console.log(row);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkCountriesTable();
