/**
 * Apply Missing Package Tables to Database
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function applyMissingTables() {
  const client = await pool.connect();

  try {
    console.log("🛠️ Creating missing package tables...");

    // Read the SQL file
    const sqlFilePath = path.join(
      __dirname,
      "create-missing-package-tables.sql",
    );
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    // Execute the SQL
    console.log("📝 Executing missing tables SQL script...");
    await client.query(sqlContent);

    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'package_%'
      ORDER BY table_name
    `);

    console.log("✅ Missing tables creation completed!");
    console.log("📋 Package-related tables:");
    tables.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check tags
    const tagsResult = await client.query(
      "SELECT COUNT(*) as count FROM package_tags",
    );
    console.log(`🏷️ Package tags created: ${tagsResult.rows[0].count}`);

    return true;
  } catch (error) {
    console.error("❌ Error creating missing tables:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
if (require.main === module) {
  applyMissingTables()
    .then(() => {
      console.log("\n🎉 All missing package tables created successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Failed to create missing tables:", error.message);
      process.exit(1);
    });
}

module.exports = { applyMissingTables };
