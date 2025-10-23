/**
 * Fixed Packages Migration Script
 * Runs the complete database schema and seed data for the packages module
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'faredown_booking_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com') ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('ðŸš€ Starting Fixed Packages migration...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. Run schema migration
    console.log('ðŸ“Š Creating database schema...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'fixed-packages-schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('âœ… Schema created successfully');
    
    // 2. Run seed data
    console.log('ðŸŒ± Inserting seed data...');
    const seedSQL = fs.readFileSync(path.join(__dirname, 'fixed-packages-seed.sql'), 'utf8');
    await client.query(seedSQL);
    console.log('âœ… Seed data inserted successfully');
    
    // 3. Verify the migration
    console.log('ðŸ” Verifying migration...');
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'package%' 
        OR table_name IN ('regions', 'countries', 'cities')
      ORDER BY table_name
    `);
    
    console.log('ðŸ“‹ Created tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check sample data
    const packageCount = await client.query('SELECT COUNT(*) FROM packages');
    const regionCount = await client.query('SELECT COUNT(*) FROM regions');
    const countryCount = await client.query('SELECT COUNT(*) FROM countries');
    const cityCount = await client.query('SELECT COUNT(*) FROM cities');
    const departureCount = await client.query('SELECT COUNT(*) FROM package_departures');
    
    console.log('ðŸ“Š Data summary:');
    console.log(`   - Packages: ${packageCount.rows[0].count}`);
    console.log(`   - Regions: ${regionCount.rows[0].count}`);
    console.log(`   - Countries: ${countryCount.rows[0].count}`);
    console.log(`   - Cities: ${cityCount.rows[0].count}`);
    console.log(`   - Departures: ${departureCount.rows[0].count}`);
    
    // Test views
    const listingView = await client.query('SELECT COUNT(*) FROM v_packages_listing');
    const hierarchyView = await client.query('SELECT COUNT(*) FROM v_destination_hierarchy');
    
    console.log('ðŸ‘ï¸ Views verification:');
    console.log(`   - v_packages_listing: ${listingView.rows[0].count} packages`);
    console.log(`   - v_destination_hierarchy: ${hierarchyView.rows[0].count} root regions`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('âœ… Fixed Packages migration completed successfully!');
    console.log('');
    console.log('ðŸŽ¯ Next steps:');
    console.log('   1. Create API routes for packages');
    console.log('   2. Build frontend components');
    console.log('   3. Integrate bargain system');
    console.log('   4. Create admin panel');
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('âŒ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function rollbackMigration() {
  const client = await pool.connect();
  
  try {
    console.log('ðŸ”„ Rolling back Fixed Packages migration...');
    
    await client.query('BEGIN');
    
    // Drop tables in reverse dependency order
    const dropTables = [
      'package_supplier_sync',
      'package_reviews',
      'package_bookings',
      'package_pricing_tiers',
      'package_tags',
      'package_departures',
      'package_itinerary_days',
      'package_media',
      'packages',
      'cities',
      'countries',
      'regions'
    ];
    
    for (const table of dropTables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   - Dropped table: ${table}`);
      } catch (error) {
        console.log(`   - Table ${table} did not exist or could not be dropped`);
      }
    }
    
    // Drop views
    const dropViews = [
      'v_packages_listing',
      'v_destination_hierarchy', 
      'v_package_details'
    ];
    
    for (const view of dropViews) {
      try {
        await client.query(`DROP VIEW IF EXISTS ${view} CASCADE`);
        console.log(`   - Dropped view: ${view}`);
      } catch (error) {
        console.log(`   - View ${view} did not exist or could not be dropped`);
      }
    }
    
    await client.query('COMMIT');
    console.log('âœ… Rollback completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('âŒ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    rollbackMigration()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    runMigration()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  runMigration,
  rollbackMigration
};
