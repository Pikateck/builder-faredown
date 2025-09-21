/**
 * Quick Fix: Run Recent Searches Migration
 * Creates the recent_searches table if it doesn't exist
 * Fixes the "Failed to fetch" error in RecentSearches component
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function runRecentSearchesMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Running Recent Searches Migration...');

    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'create-recent-searches-table.sql'),
      'utf8'
    );

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Recent Searches Migration completed successfully!');
    console.log('📋 The recent_searches table has been created/updated');
    console.log('🔗 Recent searches API should now work properly');

    // Test the table by checking if it exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'recent_searches' 
      AND table_schema = 'public'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Verified: recent_searches table exists');
      
      // Check table structure
      const columnCheck = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'recent_searches' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      console.log('📋 Table structure:');
      columnCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

    } else {
      console.log('❌ Warning: recent_searches table not found after migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Details:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your PostgreSQL database is running');
      console.log('💡 Check your DATABASE_URL environment variable');
    } else if (error.code === '42P07') {
      console.log('ℹ️  Table already exists - this is normal');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  runRecentSearchesMigration()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runRecentSearchesMigration };
