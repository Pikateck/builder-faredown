#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applySearchPerformanceMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Applying search performance migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'api/database/migrations/add-search-performance-indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Executing migration SQL...');
    
    // Execute migration in a transaction
    await client.query('BEGIN');
    
    // Split migration into individual statements (avoid COMMIT in transaction)
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim() && !stmt.trim().toUpperCase().includes('COMMIT'))
      .map(stmt => stmt.trim());
    
    let completedStatements = 0;
    
    for (const statement of statements) {
      if (statement) {
        try {
          await client.query(statement);
          completedStatements++;
          
          // Log progress for major operations
          if (statement.includes('CREATE EXTENSION')) {
            console.log('✅ Extension enabled');
          } else if (statement.includes('CREATE INDEX CONCURRENTLY')) {
            console.log('✅ Index created');
          } else if (statement.includes('UPDATE')) {
            console.log('✅ Data updated');
          } else if (statement.includes('CREATE MATERIALIZED VIEW')) {
            console.log('✅ Materialized view created');
          }
        } catch (err) {
          // Ignore "already exists" errors for indexes and extensions
          if (err.message.includes('already exists') || 
              err.message.includes('relation') && err.message.includes('already exists')) {
            console.log(`⚠️  Skipped existing: ${statement.substring(0, 50)}...`);
          } else {
            console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
            console.error(`   Error: ${err.message}`);
          }
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Migration completed! Processed ${completedStatements} statements.\n`);
    
    // Verify the migration worked
    console.log('🔍 Verifying migration results...\n');
    
    // Check if pg_trgm extension is available
    const extResult = await client.query("SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';");
    console.log(`📋 pg_trgm extension: ${extResult.rows.length > 0 ? '✅ Available' : '❌ Missing'}`);
    
    // Check new indexes
    const indexResult = await client.query(`
      SELECT count(*) as index_count 
      FROM pg_indexes 
      WHERE indexname LIKE '%_trgm' OR indexname LIKE '%search%';
    `);
    console.log(`📋 Search indexes created: ${indexResult.rows[0].index_count}`);
    
    // Check search_tokens columns
    const tokensCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'search_tokens' 
      AND table_name IN ('regions', 'countries', 'cities');
    `);
    console.log(`📋 Tables with search_tokens: ${tokensCheck.rows.length}/3`);
    
    // Test search performance with a quick query
    console.log('\n🏃‍♂️ Testing search performance...');
    
    const start = Date.now();
    const testResult = await client.query(`
      SELECT type, label FROM popular_destinations 
      WHERE search_text ILIKE '%dubai%' OR 'dubai' = ANY(search_tokens)
      LIMIT 5;
    `);
    const duration = Date.now() - start;
    
    console.log(`⚡ Search test completed in ${duration}ms`);
    console.log(`📊 Results found: ${testResult.rows.length}`);
    testResult.rows.forEach(row => {
      console.log(`   ${row.type}: ${row.label}`);
    });
    
    // Test aliases
    console.log('\n🔄 Testing aliases...');
    const aliasTest = await client.query(`
      SELECT type, label FROM popular_destinations 
      WHERE search_text ILIKE '%uae%' OR 'uae' = ANY(search_tokens)
      LIMIT 3;
    `);
    console.log(`📊 UAE alias results: ${aliasTest.rows.length}`);
    aliasTest.rows.forEach(row => {
      console.log(`   ${row.type}: ${row.label}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applySearchPerformanceMigration().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
