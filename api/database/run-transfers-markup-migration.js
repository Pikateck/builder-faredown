const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "faredown_db",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
};

async function runTransferMarkupMigration() {
  const pool = new Pool(dbConfig);

  try {
    console.log("🚀 Starting Transfer Markup Migration...");
    console.log("📊 Database Config:", { ...dbConfig, password: "***" });

    // Test connection
    const client = await pool.connect();
    console.log("✅ Database connection successful");

    // Read the SQL file
    const sqlFile = path.join(__dirname, "transfers-markup-schema.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    console.log("📝 Executing Transfer Markup Schema...");

    // Execute the SQL
    const result = await client.query(sql);

    console.log("✅ Transfer Markup Schema executed successfully");
    console.log(
      "📋 Result:",
      result[result.length - 1]?.rows || "Migration completed",
    );

    // Verify the table was created
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'transfer_markups';
    `);

    if (tableCheck.rows.length > 0) {
      console.log("✅ transfer_markups table created successfully");

      // Check if data was inserted
      const dataCheck = await client.query(
        "SELECT COUNT(*) FROM transfer_markups",
      );
      console.log(
        `📊 Transfer markups in database: ${dataCheck.rows[0].count}`,
      );
    } else {
      console.log("❌ transfer_markups table was not created");
    }

    client.release();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runTransferMarkupMigration()
    .then(() => {
      console.log("🎉 Transfer Markup Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

module.exports = runTransferMarkupMigration;
