#!/usr/bin/env node

/**
 * Bargain Engine Migration Runner
 * Applies the bargain engine database schema
 * 
 * Usage: node api/database/run-bargain-migration.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Bargain Engine migration...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '20250219_bargain_engine.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    await client.query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verify tables
    console.log('🔍 Verifying created tables...');
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'bargain%' 
      OR tablename = 'price_match_tickets'
      ORDER BY tablename
    `);
    
    console.log('\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.tablename}`);
    });
    
    // Verify seed data
    console.log('\n🌱 Verifying seed data...');
    const settingsResult = await client.query(`
      SELECT module, enabled, attempts, r1_timer_sec, r2_timer_sec 
      FROM bargain_settings 
      ORDER BY module
    `);
    
    console.log('\n📋 Module settings:');
    settingsResult.rows.forEach(row => {
      console.log(`   ${row.module.padEnd(12)} - ${row.enabled ? '✓ Enabled' : '✗ Disabled'} | Attempts: ${row.attempts} | R1: ${row.r1_timer_sec}s | R2: ${row.r2_timer_sec}s`);
    });
    
    console.log('\n🎉 Bargain Engine database is ready!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
