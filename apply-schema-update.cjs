#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applySchemaUpdate() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Applying schema updates for CSV ID format...\n');
    
    const schemaSQL = fs.readFileSync('api/database/migrations/update-schema-for-csv-ids.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.toUpperCase() !== 'COMMIT');
    
    for (const statement of statements) {
      if (statement) {
        try {
          await client.query(statement);
          
          if (statement.includes('ALTER TABLE')) {
            console.log('✅ Table altered');
          } else if (statement.includes('CREATE INDEX')) {
            console.log('✅ Index created');
          } else if (statement.includes('DROP')) {
            console.log('✅ Dropped constraint/index');
          } else if (statement.includes('SET')) {
            console.log('✅ Session setting updated');
          }
        } catch (err) {
          if (err.message.includes('already exists') || 
              err.message.includes('does not exist')) {
            console.log(`⚠️  Skipped: ${statement.substring(0, 50)}...`);
          } else {
            console.error(`❌ Error: ${statement.substring(0, 50)}...`);
            console.error(`   ${err.message}`);
          }
        }
      }
    }
    
    // Verify the schema changes worked
    console.log('\n🔍 Verifying schema changes...');
    
    const regionsCheck = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'regions' AND column_name = 'id'
    `);
    
    const citiesCheck = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cities' AND column_name = 'id'
    `);
    
    console.log(`📊 Regions ID type: ${regionsCheck.rows[0]?.data_type}`);
    console.log(`📊 Cities ID type: ${citiesCheck.rows[0]?.data_type}`);
    
    // Check for search columns
    const searchColumnsCheck = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('regions', 'countries', 'cities') 
      AND column_name IN ('search_tokens', 'search_text')
      ORDER BY table_name, column_name
    `);
    
    console.log('\n📋 Search columns available:');
    searchColumnsCheck.rows.forEach(row => {
      console.log(`   ${row.table_name}.${row.column_name}`);
    });
    
    console.log('\n✅ Schema update completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema update failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applySchemaUpdate().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
