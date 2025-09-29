/**
 * Apply Comprehensive Countries Data to Database
 * This script will populate the countries table with all 195 countries
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyCountriesData() {
  const client = await pool.connect();
  
  try {
    console.log('🌍 Starting comprehensive countries data import...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'simple-countries-insert.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    console.log('📝 Executing countries SQL script...');
    await client.query(sqlContent);
    
    // Get final count
    const result = await client.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE sort_order < 100) as popular FROM countries');
    const { total, popular } = result.rows[0];

    console.log('✅ Countries data import completed successfully!');
    console.log(`📊 Total countries: ${total}`);
    console.log(`🌟 Popular destinations: ${popular}`);

    // Show some sample countries
    const sampleResult = await client.query(`
      SELECT iso2, iso3, name, sort_order
      FROM countries
      WHERE sort_order < 100
      ORDER BY sort_order
      LIMIT 10
    `);

    console.log('\n🌟 Sample popular countries:');
    sampleResult.rows.forEach(country => {
      console.log(`${country.iso2}: ${country.name} (priority: ${country.sort_order})`);
    });
    
    return { success: true, total, popular };
    
  } catch (error) {
    console.error('❌ Error applying countries data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
if (require.main === module) {
  applyCountriesData()
    .then(({ total, popular }) => {
      console.log(`\n🎉 Success! Database now has ${total} countries (${popular} popular destinations)`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Failed to apply countries data:', error.message);
      process.exit(1);
    });
}

module.exports = { applyCountriesData };
