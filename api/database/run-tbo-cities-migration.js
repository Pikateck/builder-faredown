#!/usr/bin/env node
/**
 * TBO Cities Cache Migration Runner
 * Creates tbo_cities table for fast typeahead search
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

class TBOCitiesMigrationRunner {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  async connect() {
    await this.client.connect();
    console.log("🔌 Connected to PostgreSQL");
  }

  async disconnect() {
    await this.client.end();
    console.log("🔌 Disconnected from PostgreSQL");
  }

  async runMigration() {
    console.log("🚀 Running TBO Cities Cache migration...\n");

    try {
      // Step 1: Drop existing table if it exists
      console.log("1️⃣ Dropping existing tbo_cities table...");
      await this.client.query("DROP TABLE IF EXISTS tbo_cities CASCADE;");
      console.log("✅ Old table dropped\n");

      // Step 2: Read migration SQL
      console.log("2️⃣ Creating new tbo_cities table...");
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, "migrations/20251023_create_tbo_cities_cache.sql"),
        "utf8",
      );

      // Execute migration
      await this.client.query(migrationSQL);

      console.log("✅ TBO Cities Cache migration completed successfully\n");

      // Verify tables and indexes
      await this.verifyMigration();

      return true;
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      throw error;
    }
  }

  async verifyMigration() {
    console.log("🔍 Verifying migration...\n");

    try {
      // Check if table exists
      const tableResult = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'tbo_cities'
        ) as table_exists;
      `);

      if (tableResult.rows[0].table_exists) {
        console.log("✅ Table tbo_cities created successfully");
      } else {
        console.warn("⚠️  Table tbo_cities not found");
        return false;
      }

      // Check indexes
      const indexResult = await this.client.query(`
        SELECT count(*) as index_count FROM pg_indexes 
        WHERE tablename = 'tbo_cities';
      `);

      console.log(
        `✅ ${indexResult.rows[0].index_count} indexes created for tbo_cities`,
      );

      // Count rows (should be 0 initially)
      const rowResult = await this.client.query(
        `SELECT count(*) as row_count FROM tbo_cities;`,
      );

      console.log(
        `✅ Table ready: ${rowResult.rows[0].row_count} rows (will populate on first cities API call)\n`,
      );

      console.log("📊 Migration verification complete!");
      return true;
    } catch (error) {
      console.error("⚠️  Verification failed:", error.message);
      return false;
    }
  }

  async run() {
    try {
      await this.connect();
      const success = await this.runMigration();
      await this.disconnect();

      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const runner = new TBOCitiesMigrationRunner();
  runner.run();
}

module.exports = TBOCitiesMigrationRunner;
