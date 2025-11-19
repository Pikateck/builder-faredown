#!/usr/bin/env node

/**
 * Hotel Caching Infrastructure Migration Runner
 * Applies the hotel_supplier_api_logs and hotels_master_inventory schema
 *
 * Usage:
 *   node api/database/run-hotel-caching-migration.js
 *   npm run migrate:hotel-caching
 */

const fs = require("fs");
const path = require("path");
const pool = require("./connection");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, "migrations.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

async function runMigration() {
  const migrationFile = path.join(
    __dirname,
    "migrations",
    "20250220_hotel_caching_infrastructure.sql",
  );

  // Fallback: if migration file is not in migrations folder, look in current directory
  const fallbackFile = path.join(
    __dirname,
    "20250220_hotel_caching_infrastructure.sql",
  );

  let sqlFile = migrationFile;
  if (!fs.existsSync(migrationFile) && fs.existsSync(fallbackFile)) {
    sqlFile = fallbackFile;
  }

  if (!fs.existsSync(sqlFile)) {
    logger.error("❌ Migration file not found", {
      expectedPath: migrationFile,
      fallbackPath: fallbackFile,
    });
    process.exit(1);
  }

  try {
    logger.info("🚀 Starting Hotel Caching Infrastructure Migration", {
      file: sqlFile,
    });

    const sql = fs.readFileSync(sqlFile, "utf8");

    logger.info("📝 Executing SQL migration...");
    await pool.query(sql);

    logger.info("✅ Migration completed successfully", {
      file: sqlFile,
    });

    // Verify tables exist
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('hotel_supplier_api_logs', 'hotels_master_inventory')
      ORDER BY table_name
    `);

    logger.info("✅ Created tables:", {
      tables: tableCheck.rows.map((r) => r.table_name),
      count: tableCheck.rows.length,
    });

    // Get index information
    const indexCheck = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND (tablename = 'hotel_supplier_api_logs' OR tablename = 'hotels_master_inventory')
      ORDER BY tablename, indexname
    `);

    logger.info("✅ Created indexes:", {
      count: indexCheck.rows.length,
      indexes: indexCheck.rows.map((r) => `${r.tablename}.${r.indexname}`),
    });

    logger.info("🎉 Hotel Caching Infrastructure ready for use!");

    process.exit(0);
  } catch (error) {
    logger.error("❌ Migration failed", {
      error: error.message,
      code: error.code,
    });

    if (error.detail) {
      logger.error("Details:", { detail: error.detail });
    }

    process.exit(1);
  }
}

// Check database connection before running migration
async function checkConnection() {
  try {
    logger.info("🔍 Checking database connection...");
    const result = await pool.query("SELECT NOW()");
    logger.info("✅ Database connection OK", {
      time: result.rows[0].now,
    });
    return true;
  } catch (error) {
    logger.error("❌ Database connection failed", {
      error: error.message,
    });
    return false;
  }
}

async function main() {
  const connected = await checkConnection();

  if (!connected) {
    logger.error("❌ Cannot proceed without database connection");
    process.exit(1);
  }

  await runMigration();
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Migration interrupted by user");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Migration terminated");
  await pool.end();
  process.exit(0);
});

main();
