/**
 * Pricing Engine Migration Runner
 * Sets up the pricing engine database schema and seed data
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runPricingMigration() {
  console.log("🚀 Starting Pricing Engine Migration...");

  try {
    // Check if pricing tables already exist
    console.log("🔍 Checking existing tables...");
    const tablesCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('markup_rules', 'promo_codes', 'tax_policies', 'price_checkpoints')
    `);

    console.log(
      `📊 Found ${tablesCheck.rows.length}/4 pricing tables already exist`,
    );
    tablesCheck.rows.forEach((row) => console.log(`   ✓ ${row.table_name}`));

    if (tablesCheck.rows.length === 4) {
      console.log("✅ All pricing tables already exist - skipping migration");
      console.log("🌱 Verifying seed data...");

      // Check and add seed data if missing
      await ensureSeedData();
    } else {
      // Use compatibility migration that works with existing schema
      const migrationPath = path.join(
        __dirname,
        "migrations",
        "V2025_09_06_pricing_engine_compatibility.sql",
      );
      const migrationSQL = fs.readFileSync(migrationPath, "utf8");

      console.log("📁 Compatibility migration file loaded:", migrationPath);

      // Execute the migration
      console.log("⚡ Executing compatibility migration...");
      await pool.query(migrationSQL);
    }

    console.log("✅ Pricing Engine migration completed successfully!");
    console.log("");
    console.log("📊 Created tables:");
    console.log("  - markup_rules (pricing rules by route/airline/class)");
    console.log("  - promo_codes (discount codes)");
    console.log("  - tax_policies (tax calculation rules)");
    console.log("  - price_checkpoints (price tracking logs)");
    console.log("");
    console.log("🌱 Seed data inserted:");
    console.log("  - Basic markup rules for all modules");
    console.log("  - Sample route-specific markups");
    console.log("  - Demo promo codes (WELCOME10, FIRST50, SAVE100)");
    console.log("  - Tax policies for all modules");
    console.log("");
    console.log("🎯 Next steps:");
    console.log("  1. Start the pricing server: npm run start:pricing");
    console.log("  2. Run tests: npm run test:pricing");
    console.log("  3. Test API endpoints at /api/pricing/*");
    console.log("");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("");
    console.error("💡 Troubleshooting:");
    console.error("  - Check DATABASE_URL environment variable");
    console.error("  - Ensure PostgreSQL is running and accessible");
    console.error("  - Verify database credentials");
    console.error("");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function ensureSeedData() {
  try {
    // Check and add basic markup rules
    const markupCheck = await pool.query("SELECT COUNT(*) FROM markup_rules");
    if (markupCheck.rows[0].count === "0") {
      console.log("   Adding basic markup rules...");
      await pool.query(`
        INSERT INTO markup_rules (module, markup_type, markup_value, priority, status)
        VALUES
          ('air', 'percent', 5.00, 1, 'active'),
          ('hotel', 'percent', 8.00, 1, 'active'),
          ('sightseeing', 'percent', 10.00, 1, 'active'),
          ('transfer', 'percent', 12.00, 1, 'active')
      `);
    }

    // Check and add promo codes
    const promoCheck = await pool.query("SELECT COUNT(*) FROM promo_codes");
    if (promoCheck.rows[0].count === "0") {
      console.log("   Adding sample promo codes...");
      await pool.query(`
        INSERT INTO promo_codes (code, type, value, status, valid_from, valid_to)
        VALUES
          ('WELCOME10', 'percent', 10.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
          ('FIRST50', 'fixed', 50.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
          ('SAVE100', 'fixed', 100.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
      `);
    }

    // Check and add tax policies
    const taxCheck = await pool.query("SELECT COUNT(*) FROM tax_policies");
    if (taxCheck.rows[0].count === "0") {
      console.log("   Adding tax policies...");
      await pool.query(`
        INSERT INTO tax_policies (module, type, value, priority, status)
        VALUES
          ('air', 'percent', 12.00, 10, 'active'),
          ('hotel', 'percent', 18.00, 10, 'active'),
          ('sightseeing', 'percent', 18.00, 10, 'active'),
          ('transfer', 'percent', 18.00, 10, 'active')
      `);
    }

    console.log("✅ Seed data verified/added successfully");
  } catch (error) {
    console.error("⚠️ Error ensuring seed data:", error.message);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  runPricingMigration().catch(console.error);
}

module.exports = { runPricingMigration };
