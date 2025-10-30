#!/usr/bin/env node

/**
 * P0 Migration Runner
 * Applies the complete Postgres integration migration
 * Ensures all tables, views, indexes, and triggers are created
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to Postgres...');
    await client.connect();
    console.log('✅ Connected to Postgres');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '20250405_p0_postgres_integration_complete.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📝 Running P0 Migration: Complete Postgres Integration');
    console.log('=' .repeat(60));

    // Execute migration
    await client.query(migrationSQL);

    console.log('\n✅ Migration completed successfully!');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const tables = [
      'customers',
      'pan_identifiers',
      'special_requests',
      'booking_documents',
      'bargain_rounds',
      'loyalty_events',
      'audit_logs',
    ];

    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS(
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    // Verify views
    console.log('\n📊 Verifying views...');
    const views = [
      'booking_summary_v2',
      'customer_loyalty_summary',
    ];

    for (const view of views) {
      const result = await client.query(
        `SELECT EXISTS(
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1 AND table_type = 'VIEW'
        )`,
        [view]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${view}`);
    }

    // Get table statistics
    console.log('\n📈 Table Statistics:');
    const stats = await client.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname = 'public' 
        AND tablename IN ('customers', 'pan_identifiers', 'special_requests', 'booking_documents', 'bargain_rounds', 'loyalty_events', 'audit_logs', 'hotel_bookings')
      ORDER BY tablename;
    `);

    for (const row of stats.rows) {
      console.log(`  ${row.tablename}: ${row.size}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 P0 Postgres Integration Complete!');
    console.log('=' .repeat(60));

    console.log('\n��� Next Steps:');
    console.log('1. Verify in PgAdmin: dpg-d2086mndiees739731t0-a.singapore-postgres.render.com');
    console.log('2. Test API endpoints: POST /api/v1/bookings/hotels/create');
    console.log('3. Verify Admin panel can access booking management');
    console.log('4. Confirm frontend workflows persist to Postgres');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
runMigration();
