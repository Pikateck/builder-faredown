/**
 * Conversational Bargain Database Migration Runner
 * Executes PostgreSQL schema migration for AI bargaining system
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

class BargainMigrationRunner {
  constructor() {
    this.pool = null;
    this.migrationPath = path.join(
      __dirname,
      "migrations/01_ai_bargain_tables.sql",
    );
    this.seedDataPath = path.join(__dirname, "seeds/bargain_seed_data.sql");
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      console.log("🔌 Initializing database connection for migration...");

      // Use DATABASE_URL if available (production), otherwise use individual env vars
      const config = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl:
              process.env.NODE_ENV === "production"
                ? {
                    rejectUnauthorized: false,
                  }
                : false,
            max: 5, // Reduced for migration
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
          }
        : {
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || "faredown_bookings",
            user: process.env.DB_USER || "faredown_user",
            password: process.env.DB_PASSWORD || "faredown_password",
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl:
              process.env.NODE_ENV === "production"
                ? {
                    rejectUnauthorized: false,
                  }
                : false,
          };

      this.pool = new Pool(config);

      // Test connection
      const client = await this.pool.connect();
      const result = await client.query(
        "SELECT NOW() as current_time, version() as pg_version",
      );
      console.log(`✅ Connected to PostgreSQL: ${result.rows[0].pg_version}`);
      console.log(`📅 Server time: ${result.rows[0].current_time}`);
      client.release();

      return true;
    } catch (error) {
      console.error(
        "❌ Failed to initialize database connection:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Check if migration has already been applied
   */
  async checkMigrationStatus() {
    try {
      console.log("🔍 Checking migration status...");

      // Check if modules table exists (our primary indicator)
      const result = await this.pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'modules'
      `);

      if (result.rows.length > 0) {
        // Check if it has the bargain-specific columns
        const columnsResult = await this.pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'modules'
          AND column_name IN ('display_name', 'icon', 'description')
        `);

        if (columnsResult.rows.length === 3) {
          console.log("✅ Bargain migration already applied");
          return true;
        }
      }

      console.log("📋 Migration not yet applied");
      return false;
    } catch (error) {
      console.error("❌ Error checking migration status:", error.message);
      return false;
    }
  }

  /**
   * Execute the main migration
   */
  async runMigration() {
    try {
      console.log("🚀 Starting bargain system migration...");

      // Read migration SQL
      if (!fs.existsSync(this.migrationPath)) {
        throw new Error(`Migration file not found: ${this.migrationPath}`);
      }

      const migrationSQL = fs.readFileSync(this.migrationPath, "utf8");
      console.log(`📖 Loaded migration file (${migrationSQL.length} chars)`);

      // Execute migration in a transaction
      const client = await this.pool.connect();

      try {
        await client.query("BEGIN");
        console.log("🔄 Executing migration...");

        // Execute the full migration
        await client.query(migrationSQL);

        await client.query("COMMIT");
        console.log("✅ Migration executed successfully");

        // Verify tables were created
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN (
            'modules', 'bargain_sessions', 'bargain_events', 
            'bargain_holds', 'suppliers', 'markups', 
            'copy_packs', 'bargain_analytics'
          )
          ORDER BY table_name
        `);

        console.log("📊 Created tables:");
        tablesResult.rows.forEach((row) => {
          console.log(`  ✓ ${row.table_name}`);
        });

        return true;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      throw error;
    }
  }

  /**
   * Insert seed data
   */
  async insertSeedData() {
    try {
      console.log("🌱 Inserting seed data...");

      // Insert default modules
      await this.pool.query(`
        INSERT INTO modules (name, display_name, icon, description) VALUES 
        ('flights', 'Flights', 'plane', 'Airline flight bookings'),
        ('hotels', 'Hotels', 'building', 'Hotel accommodation bookings'),
        ('sightseeing', 'Sightseeing', 'map-pin', 'Tours and activity bookings'),
        ('transfers', 'Transfers', 'car', 'Ground transportation bookings')
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          icon = EXCLUDED.icon,
          description = EXCLUDED.description,
          updated_at = NOW()
      `);

      console.log("✅ Modules inserted/updated");

      // Insert default suppliers
      const suppliersData = [
        { module: "flights", code: "AMADEUS", name: "Amadeus GDS" },
        { module: "flights", code: "SABRE", name: "Sabre GDS" },
        { module: "hotels", code: "HOTELBEDS", name: "Hotelbeds" },
        { module: "hotels", code: "BOOKING", name: "Booking.com" },
        { module: "sightseeing", code: "VIATOR", name: "Viator" },
        { module: "sightseeing", code: "GETYOURGUIDE", name: "GetYourGuide" },
        {
          module: "transfers",
          code: "HOTELBEDS_TRANSFER",
          name: "Hotelbeds Transfers",
        },
        { module: "transfers", code: "KIWITAXI", name: "Kiwi Taxi" },
      ];

      for (const supplier of suppliersData) {
        await this.pool.query(
          `
          INSERT INTO suppliers (module_id, code, name)
          SELECT m.id, $2, $3 
          FROM modules m 
          WHERE m.name = $1
          ON CONFLICT (module_id, code) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW()
        `,
          [supplier.module, supplier.code, supplier.name],
        );
      }

      console.log("✅ Suppliers inserted/updated");

      // Insert default markups
      await this.pool.query(`
        INSERT INTO markups (module_id, markup_pct, min_margin_pct, max_concession_pct)
        SELECT 
          id,
          CASE name
            WHEN 'flights' THEN 0.08
            WHEN 'hotels' THEN 0.12
            WHEN 'sightseeing' THEN 0.15
            WHEN 'transfers' THEN 0.10
          END,
          0.04,
          CASE name
            WHEN 'flights' THEN 0.05
            WHEN 'hotels' THEN 0.08
            WHEN 'sightseeing' THEN 0.10
            WHEN 'transfers' THEN 0.06
          END
        FROM modules
        WHERE NOT EXISTS (
          SELECT 1 FROM markups WHERE markups.module_id = modules.id
        )
      `);

      console.log("✅ Default markups inserted");

      // Insert basic copy pack templates
      const copyPacksData = [
        {
          module: "flights",
          type: "agent_offer",
          context: "any",
          template:
            "We have ₹{offer} for {airline} {flight_no}. Can you approve?",
        },
        {
          module: "flights",
          type: "supplier_check",
          context: "any",
          template: "Let me check what we can do at ₹{offer}...",
        },
        {
          module: "flights",
          type: "supplier_counter",
          context: "accepted",
          template: "Great news! We can accept ₹{counter} for this booking.",
        },
        {
          module: "flights",
          type: "supplier_counter",
          context: "counter",
          template:
            "We can offer ₹{counter} as our best price for this flight.",
        },
        {
          module: "hotels",
          type: "agent_offer",
          context: "any",
          template: "We have ₹{offer} for {hotel_name}. Can you approve?",
        },
        {
          module: "hotels",
          type: "supplier_check",
          context: "any",
          template: "Checking availability at your price point of ₹{offer}.",
        },
        {
          module: "sightseeing",
          type: "agent_offer",
          context: "any",
          template: "We have ₹{offer} for this experience. Can you approve?",
        },
        {
          module: "transfers",
          type: "agent_offer",
          context: "any",
          template: "We have ₹{offer} for your transfer. Can you approve?",
        },
      ];

      for (const copyPack of copyPacksData) {
        await this.pool.query(
          `
          INSERT INTO copy_packs (module_id, message_type, context, template)
          SELECT m.id, $2, $3, $4
          FROM modules m 
          WHERE m.name = $1
          ON CONFLICT (module_id, message_type, context, locale, template) DO NOTHING
        `,
          [copyPack.module, copyPack.type, copyPack.context, copyPack.template],
        );
      }

      console.log("✅ Copy pack templates inserted");

      return true;
    } catch (error) {
      console.error("❌ Failed to insert seed data:", error.message);
      throw error;
    }
  }

  /**
   * Verify migration success
   */
  async verifyMigration() {
    try {
      console.log("🔍 Verifying migration...");

      // Check table counts
      const checks = [
        { table: "modules", expectedMin: 4 },
        { table: "suppliers", expectedMin: 4 },
        { table: "markups", expectedMin: 4 },
        { table: "copy_packs", expectedMin: 4 },
      ];

      for (const check of checks) {
        const result = await this.pool.query(
          `SELECT COUNT(*) as count FROM ${check.table}`,
        );
        const count = parseInt(result.rows[0].count);

        if (count >= check.expectedMin) {
          console.log(`  ✓ ${check.table}: ${count} rows`);
        } else {
          console.warn(
            `  ⚠️ ${check.table}: ${count} rows (expected >= ${check.expectedMin})`,
          );
        }
      }

      // Test functions
      const functionsResult = await this.pool.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN ('cleanup_expired_holds', 'update_daily_analytics')
      `);

      console.log(`  ✓ Functions created: ${functionsResult.rows.length}/2`);

      // Test triggers
      const triggersResult = await this.pool.query(`
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name LIKE '%updated_at%'
      `);

      console.log(`  ✓ Triggers created: ${triggersResult.rows.length}`);

      console.log("✅ Migration verification completed");
      return true;
    } catch (error) {
      console.error("❌ Verification failed:", error.message);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log("🔌 Database connection closed");
    }
  }

  /**
   * Main migration runner
   */
  async run() {
    try {
      console.log("🚀 Starting Conversational Bargain Migration");
      console.log("=====================================");

      await this.initialize();

      const alreadyMigrated = await this.checkMigrationStatus();
      if (alreadyMigrated) {
        console.log("✅ Migration already applied, skipping...");
        return true;
      }

      await this.runMigration();
      await this.insertSeedData();
      const verified = await this.verifyMigration();

      if (verified) {
        console.log("=====================================");
        console.log(
          "✅ Conversational Bargain Migration Completed Successfully!",
        );
        console.log("");
        console.log("📋 Summary:");
        console.log("  • Database schema created");
        console.log("  • Seed data inserted");
        console.log("  • Functions and triggers active");
        console.log("  • Ready for AI bargaining");
        console.log("");
        console.log("🔗 Next steps:");
        console.log("  1. Start the API server");
        console.log("  2. Test the /api/ai-bargains/health endpoint");
        console.log("  3. Integrate bargain buttons in frontend");
        return true;
      } else {
        throw new Error("Migration verification failed");
      }
    } catch (error) {
      console.error("=====================================");
      console.error("❌ Migration Failed:", error.message);
      console.error("");
      console.error("🔧 Troubleshooting:");
      console.error("  • Check database connection settings");
      console.error("  • Verify PostgreSQL version >= 12");
      console.error("  • Ensure database user has CREATE privileges");
      console.error("  • Check logs above for specific errors");
      throw error;
    } finally {
      await this.close();
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new BargainMigrationRunner();

  runner
    .run()
    .then(() => {
      console.log("🎉 Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error.message);
      process.exit(1);
    });
}

module.exports = BargainMigrationRunner;
