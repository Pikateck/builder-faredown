#!/usr/bin/env node
/**
 * TBO Cities Cache Migration Fix
 * Drops existing tbo_cities table and recreates with correct schema
 */

const { Client } = require("pg");

class TBOCitiesMigrationFix {
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

  async fixMigration() {
    console.log("🚀 Fixing TBO Cities Cache migration...\n");

    try {
      // Step 1: Drop existing table (if exists)
      console.log("1️⃣ Dropping existing tbo_cities table...");
      await this.client.query("DROP TABLE IF EXISTS tbo_cities CASCADE;");
      console.log("✅ Dropped tbo_cities table (if it existed)\n");

      // Step 2: Create table with correct schema
      console.log("2️⃣ Creating tbo_cities table with correct schema...");
      const createTableSQL = `
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
      `;
      
      await this.client.query(createTableSQL);
      console.log("✅ Created tbo_cities table\n");

      // Step 3: Create indexes
      console.log("3️⃣ Creating indexes...");
      const indexSQL = `
        CREATE INDEX idx_tbo_cities_code ON tbo_cities(city_code);
        CREATE INDEX idx_tbo_cities_name ON tbo_cities(city_name);
        CREATE INDEX idx_tbo_cities_country ON tbo_cities(country_code);
        CREATE INDEX idx_tbo_cities_type ON tbo_cities(type);
        CREATE INDEX idx_tbo_cities_active ON tbo_cities(is_active);
        CREATE INDEX idx_tbo_cities_code_country ON tbo_cities(city_code, country_code);
      `;
      
      await this.client.query(indexSQL);
      console.log("✅ Created all indexes\n");

      // Step 4: Verify
      console.log("4️⃣ Verifying table...");
      const result = await this.client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'tbo_cities'"
      );
      
      if (result.rows.length > 0) {
        console.log("✅ tbo_cities table verified!\n");
        
        // Show columns
        const columns = await this.client.query(
          "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tbo_cities' ORDER BY ordinal_position;"
        );
        
        console.log("📋 Table columns:");
        columns.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
        console.log();
        
        return true;
      } else {
        console.log("❌ Failed to create tbo_cities table");
        return false;
      }
    } catch (error) {
      console.error("❌ Migration fix failed:", error.message);
      if (error.detail) console.error("Details:", error.detail);
      return false;
    }
  }

  async run() {
    try {
      await this.connect();
      const success = await this.fixMigration();
      await this.disconnect();
      
      if (success) {
        console.log("🎉 Migration fix completed successfully!");
        console.log("\nNext: Run the original migration to populate data:");
        console.log("   node api/database/run-tbo-cities-migration.js");
      } else {
        process.exit(1);
      }
    } catch (error) {
      console.error("Fatal error:", error);
      process.exit(1);
    }
  }
}

const runner = new TBOCitiesMigrationFix();
runner.run();
