#!/usr/bin/env node

/**
 * TBO Supplier Integration Migration Runner
 * Applies the TBO migration to add multi-supplier support
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting TBO migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'api/database/migrations/20250315_add_tbo_supplier_integration_safe.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Running migration SQL...');
    await client.query(migrationSQL);
    
    console.log('✅ TBO migration completed successfully!');
    
    // Verify suppliers
    const result = await client.query(`
      SELECT code, name, enabled, weight, supports_gds, supports_lcc 
      FROM supplier_master 
      ORDER BY weight DESC
    `);
    
    console.log('\n📊 Supplier Master Table:');
    console.table(result.rows);
    
    // Verify TBO entry specifically
    const tboCheck = await client.query(`
      SELECT * FROM supplier_master WHERE code = 'tbo'
    `);
    
    if (tboCheck.rows.length > 0) {
      console.log('\n✅ TBO supplier verified in database:');
      console.log(JSON.stringify(tboCheck.rows[0], null, 2));
    } else {
      console.log('\n⚠️ TBO supplier not found! Inserting manually...');
      await client.query(`
        INSERT INTO supplier_master (code, name, enabled, weight, supports_gds, supports_lcc, supports_ndc, online_cancel)
        VALUES ('tbo', 'TBO (Travel Boutique Online)', TRUE, 90, TRUE, TRUE, TRUE, TRUE)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          enabled = EXCLUDED.enabled,
          supports_lcc = EXCLUDED.supports_lcc
      `);
      console.log('✅ TBO supplier inserted successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
