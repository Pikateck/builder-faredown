/**
 * PostgreSQL Database Connection and Configuration
 * Handles database connectivity for Faredown booking system
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      console.log("🔌 Initializing PostgreSQL connection...");

      // Database configuration - use DATABASE_URL if available (Render/Heroku style)
      let config;

      if (process.env.DATABASE_URL) {
        // Use DATABASE_URL for production (Render, Heroku, etc.)
        config = {
          connectionString: process.env.DATABASE_URL,
          // Connection pool settings optimized for Render
          max: 10, // Reduced max connections for stability
          min: 1, // Reduced minimum connections
          idleTimeoutMillis: 60000, // Increased idle timeout
          connectionTimeoutMillis: 30000, // Increased connection timeout for Render
          acquireTimeoutMillis: 60000, // Time to wait for connection from pool
          createTimeoutMillis: 30000, // Time to wait for new connection creation
          destroyTimeoutMillis: 5000, // Time to wait for connection to close
          reapIntervalMillis: 1000, // How often to check for idle connections
          createRetryIntervalMillis: 200, // Time between connection creation attempts
          // SSL configuration for Render PostgreSQL
          ssl: {
            rejectUnauthorized: false, // Required for Render PostgreSQL
          },
        };
      } else {
        // Fallback to individual environment variables
        config = {
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || "faredown_bookings",
          user: process.env.DB_USER || "faredown_user",
          password: process.env.DB_PASSWORD || "faredown_password",

          // Connection pool settings
          max: 20,
          min: 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,

          // SSL configuration for production
          ssl:
            process.env.NODE_ENV === "production"
              ? {
                  rejectUnauthorized: false,
                }
              : false,
        };
      }

      this.pool = new Pool(config);

      // Test connection
      await this.testConnection();

      // Set up event handlers
      this.setupEventHandlers();

      console.log("✅ PostgreSQL connection established successfully");
      this.isConnected = true;

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize database connection:", error);

      if (this.connectionAttempts < this.maxRetries) {
        this.connectionAttempts++;
        console.log(
          `🔄 Retrying connection (${this.connectionAttempts}/${this.maxRetries}) in ${this.retryDelay}ms...`,
        );

        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.initialize();
      }

      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    const client = await this.pool.connect();
    try {
      const result = await client.query("SELECT NOW() as current_time");
      console.log(`📅 Database time: ${result.rows[0].current_time}`);
      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Set up database event handlers
   */
  setupEventHandlers() {
    this.pool.on("connect", (client) => {
      console.log("🔗 New database client connected");
    });

    this.pool.on("error", (err, client) => {
      console.error("❌ Database client error:", err);
      this.isConnected = false;
    });

    this.pool.on("remove", (client) => {
      console.log("🔌 Database client removed from pool");
    });
  }

  /**
   * Execute a query with parameters
   */
  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error("Database not connected");
    }

    const start = Date.now();

    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      // Log slow queries (over 1 second)
      if (duration > 1000) {
        console.warn(
          `🐌 Slow query detected (${duration}ms):`,
          text.substring(0, 100),
        );
      }

      return result;
    } catch (error) {
      console.error("❌ Database query error:", error);
      console.error("Query:", text);
      console.error("Params:", params);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Initialize database schema if needed
   */
  async initializeSchema() {
    try {
      console.log("🏗️ Checking database schema...");

      // Check if tables exist
      const tableCheck = await this.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('hotel_bookings', 'payments', 'vouchers', 'suppliers')
      `);

      if (tableCheck.rows.length === 0) {
        console.log("📋 Creating database schema...");

        // Read and execute schema file
        const schemaPath = path.join(__dirname, "schema.sql");
        const schemaSQL = fs.readFileSync(schemaPath, "utf8");

        // Execute the entire schema as one transaction to handle functions properly
        try {
          await this.query(schemaSQL);
        } catch (error) {
          // If that fails, try splitting carefully
          if (error.message.includes("already exists")) {
            console.log("✅ Some schema elements already exist");
          } else {
            console.error("Schema error:", error.message);

            // As fallback, try executing individual statements that are safe
            const safeStatements = schemaSQL
              .split(/;\s*(?=CREATE TABLE|CREATE INDEX|INSERT INTO)/g)
              .map((stmt) => stmt.trim())
              .filter(
                (stmt) =>
                  stmt.length > 0 &&
                  !stmt.includes("FUNCTION") &&
                  !stmt.includes("TRIGGER"),
              );

            for (const statement of safeStatements) {
              try {
                await this.query(statement);
              } catch (err) {
                if (!err.message.includes("already exists")) {
                  console.error("Individual statement error:", err.message);
                }
              }
            }
          }
        }

        console.log("✅ Database schema created successfully");
      } else {
        console.log("✅ Database schema already exists");
      }

      await this.ensureUserVerificationColumns();
      await this.ensureSystemMonitorTable();
      await this.ensureRecentSearchesTable();
      await this.ensureThirdPartyApiLogsTable();
      await this.ensureHotelCacheTables();
    } catch (error) {
      console.error("❌ Failed to initialize schema:", error);
      throw error;
    }
  }

  async ensureHotelCacheTables() {
    try {
      console.log("🏨 Ensuring hotel cache tables...");

      // Create hotel_search_cache table
      await this.query(`
        CREATE TABLE IF NOT EXISTS public.hotel_search_cache (
          id BIGSERIAL PRIMARY KEY,
          search_hash VARCHAR(64) NOT NULL UNIQUE,
          city_id VARCHAR(50) NOT NULL,
          country_code VARCHAR(10),
          check_in_date DATE NOT NULL,
          check_out_date DATE NOT NULL,
          guest_nationality VARCHAR(10),
          num_rooms INTEGER,
          room_config JSONB,
          hotel_count INTEGER,
          cache_source VARCHAR(50),
          is_fresh BOOLEAN DEFAULT true,
          cached_at TIMESTAMPTZ DEFAULT NOW(),
          ttl_expires_at TIMESTAMPTZ,
          last_price_refresh_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create indexes for hotel_search_cache
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON public.hotel_search_cache(search_hash)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_search_cache_city_date ON public.hotel_search_cache(city_id, check_in_date, check_out_date)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_search_cache_freshness ON public.hotel_search_cache(is_fresh, cached_at DESC)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_search_cache_nationality ON public.hotel_search_cache(guest_nationality)`,
      );

      // Create tbo_hotels_normalized table
      await this.query(`
        CREATE TABLE IF NOT EXISTS public.tbo_hotels_normalized (
          id BIGSERIAL PRIMARY KEY,
          tbo_hotel_code VARCHAR(100) NOT NULL UNIQUE,
          city_id VARCHAR(50) NOT NULL,
          city_name VARCHAR(255),
          country_code VARCHAR(10),
          name VARCHAR(500) NOT NULL,
          description TEXT,
          address TEXT,
          latitude NUMERIC(10, 8),
          longitude NUMERIC(11, 8),
          star_rating NUMERIC(3, 1),
          check_in_time TIME,
          check_out_time TIME,
          amenities JSONB,
          facilities JSONB,
          images JSONB,
          main_image_url TEXT,
          phone VARCHAR(50),
          email VARCHAR(100),
          website VARCHAR(500),
          total_rooms INTEGER,
          popularity INTEGER DEFAULT 0,
          last_synced_at TIMESTAMPTZ,
          tbo_response_blob JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create indexes for tbo_hotels_normalized
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotels_normalized_city ON public.tbo_hotels_normalized(city_id)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotels_normalized_code ON public.tbo_hotels_normalized(tbo_hotel_code)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotels_normalized_name ON public.tbo_hotels_normalized(name)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotels_normalized_rating ON public.tbo_hotels_normalized(star_rating DESC)`,
      );

      // Create tbo_rooms_normalized table
      await this.query(`
        CREATE TABLE IF NOT EXISTS public.tbo_rooms_normalized (
          id BIGSERIAL PRIMARY KEY,
          tbo_hotel_code VARCHAR(100) NOT NULL,
          room_type_id VARCHAR(100),
          room_type_name VARCHAR(255),
          room_description TEXT,
          max_occupancy INTEGER,
          adults_max INTEGER,
          children_max INTEGER,
          room_size_sqm NUMERIC(6, 2),
          bed_types JSONB,
          room_features JSONB,
          amenities JSONB,
          images JSONB,
          base_price_per_night NUMERIC(12, 2),
          currency VARCHAR(3),
          cancellation_policy JSONB,
          meal_plan TEXT,
          breakfast_included BOOLEAN DEFAULT false,
          tbo_response_blob JSONB,
          last_synced_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          FOREIGN KEY (tbo_hotel_code) REFERENCES public.tbo_hotels_normalized(tbo_hotel_code) ON DELETE CASCADE
        )
      `);

      // Create indexes for tbo_rooms_normalized
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_rooms_normalized_hotel ON public.tbo_rooms_normalized(tbo_hotel_code)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_rooms_normalized_room_type ON public.tbo_rooms_normalized(room_type_name)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_rooms_normalized_occupancy ON public.tbo_rooms_normalized(max_occupancy)`,
      );

      // Create hotel_search_cache_results table
      await this.query(`
        CREATE TABLE IF NOT EXISTS public.hotel_search_cache_results (
          id BIGSERIAL PRIMARY KEY,
          search_hash VARCHAR(64) NOT NULL,
          tbo_hotel_code VARCHAR(100) NOT NULL,
          result_rank INTEGER,
          price_offered_per_night NUMERIC(12, 2),
          price_published_per_night NUMERIC(12, 2),
          available_rooms INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          FOREIGN KEY (search_hash) REFERENCES public.hotel_search_cache(search_hash) ON DELETE CASCADE,
          FOREIGN KEY (tbo_hotel_code) REFERENCES public.tbo_hotels_normalized(tbo_hotel_code) ON DELETE CASCADE
        )
      `);

      // Create indexes for hotel_search_cache_results
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_cache_results_hash ON public.hotel_search_cache_results(search_hash)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_cache_results_hotel ON public.hotel_search_cache_results(tbo_hotel_code)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_cache_results_rank ON public.hotel_search_cache_results(search_hash, result_rank)`,
      );

      // Create hotel_supplier_api_logs table
      await this.query(`
        CREATE TABLE IF NOT EXISTS public.hotel_supplier_api_logs (
          id BIGSERIAL PRIMARY KEY,
          supplier_code VARCHAR(50) NOT NULL,
          endpoint VARCHAR(255) NOT NULL,
          request_payload JSONB,
          request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          response_payload JSONB,
          response_timestamp TIMESTAMPTZ,
          response_time_ms INTEGER,
          trace_id UUID,
          search_hash VARCHAR(64),
          cache_hit BOOLEAN DEFAULT FALSE,
          check_in_date DATE,
          check_out_date DATE,
          city_id VARCHAR(50),
          country_code VARCHAR(10),
          nationality VARCHAR(10),
          num_rooms INTEGER,
          total_guests INTEGER,
          error_message TEXT,
          error_code VARCHAR(50),
          success BOOLEAN,
          http_status_code INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create indexes for hotel_supplier_api_logs
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotel_logs_supplier_timestamp ON public.hotel_supplier_api_logs(supplier_code, request_timestamp DESC)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotel_logs_trace_id ON public.hotel_supplier_api_logs(trace_id)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotel_logs_search_hash ON public.hotel_supplier_api_logs(search_hash)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotel_logs_city_id ON public.hotel_supplier_api_logs(city_id)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotel_logs_error ON public.hotel_supplier_api_logs(error_code, request_timestamp DESC) WHERE error_message IS NOT NULL`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotel_logs_cache_hit ON public.hotel_supplier_api_logs(cache_hit, request_timestamp DESC)`,
      );

      // Create hotels_master_inventory table
      await this.query(`
        CREATE TABLE IF NOT EXISTS public.hotels_master_inventory (
          id BIGSERIAL PRIMARY KEY,
          supplier_code VARCHAR(50) NOT NULL,
          supplier_hotel_code VARCHAR(100) NOT NULL,
          unified_hotel_code VARCHAR(100),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          city_id VARCHAR(50),
          city_name VARCHAR(100),
          country_code VARCHAR(10),
          country_name VARCHAR(100),
          region_code VARCHAR(50),
          region_name VARCHAR(100),
          latitude NUMERIC(10, 8),
          longitude NUMERIC(11, 8),
          star_rating NUMERIC(3, 1),
          phone VARCHAR(50),
          email VARCHAR(100),
          website VARCHAR(255),
          address_line_1 VARCHAR(255),
          address_line_2 VARCHAR(255),
          postal_code VARCHAR(20),
          amenities JSONB,
          supplier_metadata JSONB,
          last_synced_at TIMESTAMPTZ,
          sync_status VARCHAR(20),
          sync_error TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create indexes for hotels_master_inventory
      await this.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_hotels_supplier_code_unique ON public.hotels_master_inventory(supplier_code, supplier_hotel_code)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotels_city_id ON public.hotels_master_inventory(city_id, is_active)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotels_country_code ON public.hotels_master_inventory(country_code, is_active)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotels_coordinates ON public.hotels_master_inventory(latitude, longitude) WHERE is_active = TRUE`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotels_sync_status ON public.hotels_master_inventory(sync_status, last_synced_at DESC)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_hotels_name_search ON public.hotels_master_inventory USING GIN(to_tsvector('english', name))`,
      );

      console.log("✅ Hotel cache tables ensured successfully");
    } catch (error) {
      console.warn("⚠️  Failed to ensure hotel cache tables:", error.message);
      // Don't throw - hotel cache tables are optional for some deployments
    }
  }

  async ensureRecentSearchesTable() {
    try {
      // Create table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.recent_searches (
          id                 BIGSERIAL PRIMARY KEY,
          user_id            UUID NULL,
          device_id          TEXT NULL,
          module             TEXT NOT NULL CHECK (module IN ('flights','hotels','flight_hotel','cars','activities','taxis','sightseeing','transfers')),
          query_hash         TEXT NOT NULL,
          query              JSONB NOT NULL,
          created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await this.query(createTableSQL);

      // Create indexes
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_recent_searches_user_id ON public.recent_searches (user_id DESC, created_at DESC)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_recent_searches_device_id ON public.recent_searches (device_id DESC, created_at DESC)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_recent_searches_module ON public.recent_searches (module, created_at DESC)`,
      );
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_recent_searches_query_hash ON public.recent_searches (query_hash)`,
      );
      await this.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_recent_searches_unique_query
         ON public.recent_searches (COALESCE(user_id::text, device_id), query_hash)`,
      );

      // Try to add check constraint (ignore error if it already exists)
      try {
        // First check if constraint exists
        const constraintCheck = await this.query(`
          SELECT constraint_name FROM information_schema.table_constraints
          WHERE table_name = 'recent_searches' AND constraint_name = 'chk_recent_searches_identity'
        `);

        if (constraintCheck.rows.length === 0) {
          await this.query(
            `ALTER TABLE public.recent_searches ADD CONSTRAINT chk_recent_searches_identity
             CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)`,
          );
        }
      } catch (e) {
        // Ignore "already exists" errors (code 42710)
        if (e.code !== "42710" && !e.message.includes("already exists")) {
          console.warn("⚠️  Could not add constraint:", e.message);
        }
      }

      // Create function and trigger
      try {
        await this.query(`
          CREATE OR REPLACE FUNCTION update_recent_searches_updated_at()
          RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$ LANGUAGE plpgsql
        `);

        await this.query(
          `DROP TRIGGER IF EXISTS tr_recent_searches_updated_at ON public.recent_searches`,
        );

        await this.query(`
          CREATE TRIGGER tr_recent_searches_updated_at
          BEFORE UPDATE ON public.recent_searches
          FOR EACH ROW EXECUTE FUNCTION update_recent_searches_updated_at()
        `);
      } catch (e) {
        console.warn("⚠️  Could not create trigger:", e.message);
      }

      console.log("✅ recent_searches table ensured successfully");
    } catch (error) {
      console.warn(
        "⚠️  Failed to ensure recent_searches table:",
        error.message,
      );
      // Don't throw - recent searches is optional
    }
  }

  async ensureUserVerificationColumns() {
    try {
      const result = await this.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`,
      );
      const columns = new Set(result.rows.map((row) => row.column_name));
      const alterations = [];

      if (!columns.has("is_verified")) {
        alterations.push(
          "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false",
        );
      }
      if (!columns.has("verification_token")) {
        alterations.push(
          "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)",
        );
      }
      if (!columns.has("verification_token_expires_at")) {
        alterations.push(
          "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP WITH TIME ZONE",
        );
      }
      if (!columns.has("verification_sent_at")) {
        alterations.push(
          "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE",
        );
      }
      if (!columns.has("verified_at")) {
        alterations.push(
          "ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE",
        );
      }

      for (const statement of alterations) {
        try {
          await this.query(statement);
        } catch (error) {
          console.warn("⚠️  Column alteration warning:", error.message);
        }
      }

      if (alterations.length > 0) {
        await this.query(
          "UPDATE users SET is_verified = COALESCE(is_verified, false) WHERE is_verified IS NULL",
        );
      }
    } catch (error) {
      console.error(
        "❌ Failed ensuring user verification columns:",
        error.message,
      );
    }
  }

  async ensureSystemMonitorTable() {
    try {
      await this.query(
        `CREATE TABLE IF NOT EXISTS system_monitor_logs (
          id BIGSERIAL PRIMARY KEY,
          component VARCHAR(64) NOT NULL,
          status VARCHAR(32) NOT NULL,
          latency_ms INTEGER,
          detail JSONB,
          checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
      );

      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_system_monitor_checked_at
          ON system_monitor_logs (checked_at DESC)`,
      );

      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_system_monitor_component
          ON system_monitor_logs (component)`,
      );
    } catch (error) {
      console.error("❌ Failed to ensure system monitor table:", error.message);
    }
  }

  async ensureThirdPartyApiLogsTable() {
    try {
      // Create table
      await this.query(`
        CREATE TABLE IF NOT EXISTS public.third_party_api_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          supplier_name VARCHAR(100) NOT NULL,
          endpoint VARCHAR(500) NOT NULL,
          method VARCHAR(10) DEFAULT 'POST',
          request_payload JSONB,
          request_headers JSONB,
          response_payload JSONB,
          response_headers JSONB,
          status_code INTEGER,
          error_message TEXT,
          error_stack TEXT,
          request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          response_timestamp TIMESTAMPTZ,
          duration_ms INTEGER,
          trace_id VARCHAR(255),
          correlation_id VARCHAR(255),
          environment VARCHAR(50) DEFAULT 'production',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Create indexes
      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_third_party_logs_supplier
         ON public.third_party_api_logs (supplier_name, created_at DESC)`,
      );

      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_third_party_logs_timestamp
         ON public.third_party_api_logs (request_timestamp DESC)`,
      );

      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_third_party_logs_status
         ON public.third_party_api_logs (status_code, created_at DESC)`,
      );

      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_third_party_logs_trace
         ON public.third_party_api_logs (trace_id)
         WHERE trace_id IS NOT NULL`,
      );

      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_third_party_logs_correlation
         ON public.third_party_api_logs (correlation_id)
         WHERE correlation_id IS NOT NULL`,
      );

      await this.query(
        `CREATE INDEX IF NOT EXISTS idx_third_party_logs_errors
         ON public.third_party_api_logs (supplier_name, created_at DESC)
         WHERE error_message IS NOT NULL`,
      );

      console.log("✅ third_party_api_logs table ensured successfully");
    } catch (error) {
      console.warn(
        "⚠️  Failed to ensure third_party_api_logs table:",
        error.message,
      );
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    if (!this.pool) {
      return { connected: false };
    }

    return {
      connected: this.isConnected,
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: this.pool.options.max,
      connectionAttempts: this.connectionAttempts,
    };
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      console.log("🔌 Closing database connections...");
      await this.pool.end();
      this.isConnected = false;
      console.log("✅ Database connections closed");
    }
  }

  /**
   * Health check for monitoring
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { healthy: false, error: "Not connected" };
      }

      const result = await this.query("SELECT 1 as health_check");
      return {
        healthy: true,
        timestamp: new Date().toISOString(),
        responseTime: "fast",
        connections: this.getStats(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create singleton instance
const db = new DatabaseConnection();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT, closing database connections...");
  await db.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Received SIGTERM, closing database connections...");
  await db.close();
  process.exit(0);
});

module.exports = db;
