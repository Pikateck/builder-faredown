/**
 * Pricing Engine Migration Runner
 * Sets up the pricing engine database schema and seed data
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runPricingMigration() {
  console.log('🚀 Starting Pricing Engine Migration...');

  try {
    // Check if pricing tables already exist
    console.log('🔍 Checking existing tables...');
    const tablesCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('markup_rules', 'promo_codes', 'tax_policies', 'price_checkpoints')
    `);

    console.log(`📊 Found ${tablesCheck.rows.length}/4 pricing tables already exist`);
    tablesCheck.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));

    if (tablesCheck.rows.length === 4) {
      console.log('✅ All pricing tables already exist - skipping migration');
      console.log('🌱 Verifying seed data...');

      // Check and add seed data if missing
      await ensureSeedData();

    } else {
      // Read the migration SQL file
      const migrationPath = path.join(__dirname, 'migrations', 'V2025_09_06_pricing_engine.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      console.log('📁 Migration file loaded:', migrationPath);

      // Execute the migration
      console.log('⚡ Executing migration...');
      await pool.query(migrationSQL);
    }
    
    console.log('✅ Pricing Engine migration completed successfully!');
    console.log('');
    console.log('📊 Created tables:');
    console.log('  - markup_rules (pricing rules by route/airline/class)');
    console.log('  - promo_codes (discount codes)');
    console.log('  - tax_policies (tax calculation rules)');
    console.log('  - price_checkpoints (price tracking logs)');
    console.log('');
    console.log('🌱 Seed data inserted:');
    console.log('  - Basic markup rules for all modules');
    console.log('  - Sample route-specific markups');
    console.log('  - Demo promo codes (WELCOME10, FIRST50, SAVE100)');
    console.log('  - Tax policies for all modules');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  1. Start the pricing server: npm run start:pricing');
    console.log('  2. Run tests: npm run test:pricing');
    console.log('  3. Test API endpoints at /api/pricing/*');
    console.log('');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('  - Check DATABASE_URL environment variable');
    console.error('  - Ensure PostgreSQL is running and accessible');
    console.error('  - Verify database credentials');
    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Check if this script is being run directly
if (require.main === module) {
  runPricingMigration().catch(console.error);
}

module.exports = { runPricingMigration };
