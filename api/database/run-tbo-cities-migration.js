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
      // Step 1: Drop existing table
      console.log("1️⃣ Dropping existing tbo_cities table...");
      await this.client.query("DROP TABLE IF EXISTS tbo_cities CASCADE;");
      console.log("✅ Old table dropped\n");

      // Step 2: Create table
      console.log("2️⃣ Creating tbo_cities table...");
      await this.client.query(`
        CREATE TABLE tbo_cities (
          id SERIAL PRIMARY KEY,
          city_code VARCHAR(50) NOT NULL,
          city_name VARCHAR(255) NOT NULL,
          country_code VARCHAR(10),
          country_name VARCHAR(255),
          region_code VARCHAR(50),
          region_name VARCHAR(255),
          type VARCHAR(50) DEFAULT 'CITY',
          latitude NUMERIC(10, 8),
          longitude NUMERIC(11, 8),
          is_active BOOLEAN DEFAULT true,
          last_seen_at TIMESTAMPTZ DEFAULT NOW(),
          synced_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("✅ Table created\n");

      // Step 3: Create indexes
      console.log("3️⃣ Creating indexes...");
      await this.client.query(`
        CREATE INDEX idx_tbo_cities_code ON tbo_cities(city_code);
        CREATE INDEX idx_tbo_cities_name ON tbo_cities(city_name);
        CREATE INDEX idx_tbo_cities_country ON tbo_cities(country_code);
        CREATE INDEX idx_tbo_cities_type ON tbo_cities(type);
        CREATE INDEX idx_tbo_cities_active ON tbo_cities(is_active);
        CREATE INDEX idx_tbo_cities_code_country ON tbo_cities(city_code, country_code);
      `);
      console.log("✅ Indexes created\n");

      // Step 4: Create FTS index
      console.log("4️⃣ Creating full-text search index...");
      await this.client.query(`
        CREATE INDEX idx_tbo_cities_fts ON tbo_cities USING GIN (
          to_tsvector('english', city_name || ' ' || COALESCE(country_name, ''))
        );
      `);
      console.log("✅ FTS index created\n");

      console.log("✅ TBO Cities Cache migration completed successfully\n");

      // Verify tables and indexes
      await this.verifyMigration();

      return true;
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      if (error.detail) console.error("Detail:", error.detail);
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
        console.warn("���️  Table tbo_cities not found");
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
