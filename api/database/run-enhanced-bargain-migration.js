/**
 * Enhanced Bargain System Migration Runner
 * Applies the comprehensive bargain logic database schema
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "faredown_booking_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com') ? { rejectUnauthorized: false } : false,
};

async function runEnhancedBargainMigration() {
  const client = new Client(dbConfig);
  
  try {
    console.log("🔄 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to database");

    // Read the migration file
    const migrationPath = path.join(__dirname, "migrations", "V2025_02_20_simple_enhanced_bargain.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("🔄 Running enhanced bargain system migration...");
    
    // Execute the migration in a transaction
    await client.query("BEGIN");
    
    try {
      await client.query(migrationSQL);
      await client.query("COMMIT");
      console.log("✅ Enhanced bargain system migration completed successfully");
      
      // Verify the migration by checking key tables
      console.log("🔍 Verifying migration...");
      
      const verificationQueries = [
        "SELECT COUNT(*) as count FROM modules",
        "SELECT COUNT(*) as count FROM markup_rules", 
        "SELECT COUNT(*) as count FROM promo_codes_enhanced",
        "SELECT table_name FROM information_schema.tables WHERE table_name IN ('bargain_holds_enhanced', 'bargain_rounds', 'promo_usage_log')"
      ];
      
      for (const query of verificationQueries) {
        const result = await client.query(query);
        console.log("  ✓", query, "->", result.rows);
      }
      
      // Test the calculation function
      console.log("🧪 Testing bargain calculation function...");
      const testResult = await client.query(`
        SELECT * FROM calculate_bargain_price(
          10000,  -- ₹10,000 supplier net rate
          (SELECT id FROM modules WHERE name = 'hotels' LIMIT 1),  -- Hotels module
          NULL,   -- No specific supplier
          '{}',   -- No filters
          'FAREDOWN25'  -- Test promo code
        )
      `);
      
      if (testResult.rows.length > 0) {
        console.log("  ✓ Bargain calculation function working:", testResult.rows[0]);
      }
      
      console.log("🎉 All verifications passed!");
      
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log("🔒 Database connection closed");
  }
}

// Run the migration
if (require.main === module) {
  console.log("🚀 Starting Enhanced Bargain System Migration");
  runEnhancedBargainMigration()
    .then(() => {
      console.log("✅ Migration process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration process failed:", error);
      process.exit(1);
    });
}

module.exports = { runEnhancedBargainMigration };
