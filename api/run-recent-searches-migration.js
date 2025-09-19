const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  try {
    console.log("🚀 Starting recent searches migration...");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "database/migrations/V2025_09_19_recent_searches.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Execute the entire migration as one transaction
    console.log("📋 Executing migration SQL...");

    try {
      await pool.query(migrationSQL);
      console.log("✅ Migration executed successfully");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("⚠️  Migration skipped (objects already exist)");
      } else {
        throw error;
      }
    }

    console.log("🎉 Recent searches migration completed successfully!");

    // Test the table was created
    const testQuery = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'recent_searches' AND table_schema = 'public'
    `);

    if (testQuery.rows[0].count > 0) {
      console.log("✅ recent_searches table verified");
    } else {
      console.error("❌ recent_searches table not found");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();
