#!/usr/bin/env node

/**
 * Profile System Migration Runner
 * Executes the complete profile system database schema
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runProfileMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Profile System Migration...');
    
    // Set passport encryption key
    const passportKey = process.env.PASSPORT_ENCRYPTION_KEY || 'faredown_default_passport_key_2024';
    await client.query(`SELECT set_config('app.passport_key', $1, false)`, [passportKey]);
    
    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'profile-system-schema.sql'),
      'utf8'
    );
    
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Profile System Migration completed successfully!');
    
    // Verify the migration by checking key tables
    const tables = [
      'faredown.addresses',
      'faredown.travelers', 
      'faredown.passports',
      'faredown.payment_methods',
      'faredown.user_preferences',
      'faredown.bookings'
    ];
    
    console.log('\n📋 Verifying created tables:');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ✓ ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      }
    }
    
    // Check if views were created
    try {
      const viewResult = await client.query(`SELECT COUNT(*) FROM faredown.v_passports_masked`);
      console.log(`   ✓ faredown.v_passports_masked view: ${viewResult.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ faredown.v_passports_masked view: Error - ${error.message}`);
    }
    
    console.log('\n🎉 Profile System is ready!');
    console.log('\nNext steps:');
    console.log('1. Create API endpoints for profile management');
    console.log('2. Build Profile UI components');
    console.log('3. Integrate with booking flow');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Profile Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function rollbackMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Rolling back Profile System Migration...');
    
    const rollbackSQL = `
      -- Drop views first
      DROP VIEW IF EXISTS faredown.v_passports_masked;
      
      -- Drop tables in reverse dependency order
      DROP TABLE IF EXISTS faredown.transfer_passengers;
      DROP TABLE IF EXISTS faredown.transfer_bookings;
      DROP TABLE IF EXISTS faredown.activity_participants;
      DROP TABLE IF EXISTS faredown.activity_bookings;
      DROP TABLE IF EXISTS faredown.stay_guests;
      DROP TABLE IF EXISTS faredown.hotel_bookings;
      DROP TABLE IF EXISTS faredown.seat_assignments;
      DROP TABLE IF EXISTS faredown.booking_passengers;
      DROP TABLE IF EXISTS faredown.bookings;
      DROP TABLE IF EXISTS faredown.saved_searches;
      DROP TABLE IF EXISTS faredown.profile_activity_log;
      DROP TABLE IF EXISTS faredown.user_preferences;
      DROP TABLE IF EXISTS faredown.payment_methods;
      DROP TABLE IF EXISTS faredown.passports;
      DROP TABLE IF EXISTS faredown.travelers;
      DROP TABLE IF EXISTS faredown.addresses;
      
      -- Drop functions
      DROP FUNCTION IF EXISTS faredown.encrypt_passport_number(text);
      DROP FUNCTION IF EXISTS faredown.decrypt_passport_number(bytea);
      DROP FUNCTION IF EXISTS faredown.update_updated_at_column();
      
      -- Remove added columns from existing users table
      ALTER TABLE users 
      DROP COLUMN IF EXISTS uuid,
      DROP COLUMN IF EXISTS full_name,
      DROP COLUMN IF EXISTS phone_e164,
      DROP COLUMN IF EXISTS dob,
      DROP COLUMN IF EXISTS nationality_iso2,
      DROP COLUMN IF EXISTS gender,
      DROP COLUMN IF EXISTS address_id,
      DROP COLUMN IF EXISTS display_name,
      DROP COLUMN IF EXISTS profile_picture_url,
      DROP COLUMN IF EXISTS email_verified,
      DROP COLUMN IF EXISTS phone_verified;
      
      -- Drop schema if empty
      DROP SCHEMA IF EXISTS faredown CASCADE;
    `;
    
    await client.query('BEGIN');
    await client.query(rollbackSQL);
    await client.query('COMMIT');
    
    console.log('✅ Profile System Migration rolled back successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'rollback') {
  rollbackMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration rollback failed:', error);
      process.exit(1);
    });
} else {
  runProfileMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
