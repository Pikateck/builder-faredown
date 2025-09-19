const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🚀 Starting recent searches migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database/migrations/V2025_09_19_recent_searches.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      try {
        await pool.query(statements[i]);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('🎉 Recent searches migration completed successfully!');
    
    // Test the table was created
    const testQuery = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'recent_searches' AND table_schema = 'public'
    `);
    
    if (testQuery.rows[0].count > 0) {
      console.log('✅ recent_searches table verified');
    } else {
      console.error('❌ recent_searches table not found');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();
