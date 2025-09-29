/**
 * Check Countries Table Structure
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkCountriesStructure() {
  const client = await pool.connect();

  try {
    console.log("🔍 Checking countries table structure...");

    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'countries'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log("❌ Countries table does not exist!");
      return;
    }

    // Get table structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'countries' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log("📋 Countries table structure:");
    console.log("=====================================");
    structure.rows.forEach((col) => {
      console.log(
        `${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "NOT NULL" : ""} ${col.column_default ? `DEFAULT ${col.column_default}` : ""}`,
      );
    });

    // Get sample data
    const sampleData = await client.query("SELECT * FROM countries LIMIT 5");
    console.log("\n📊 Sample data:");
    console.log("=====================================");
    sampleData.rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });

    // Get count
    const count = await client.query("SELECT COUNT(*) as total FROM countries");
    console.log(`\n📈 Total countries: ${count.rows[0].total}`);
  } catch (error) {
    console.error("❌ Error checking structure:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCountriesStructure();
