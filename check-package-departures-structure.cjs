/**
 * Check Package Departures Table Structure
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkStructure() {
  try {
    console.log("🔍 Checking package_departures table structure...");

    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'package_departures'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log("❌ package_departures table does not exist!");
      return;
    }

    // Get table structure
    const structure = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        generation_expression IS NOT NULL as is_generated
      FROM information_schema.columns 
      WHERE table_name = 'package_departures' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log("📋 package_departures table structure:");
    console.log("=====================================");
    structure.rows.forEach((col) => {
      const generated = col.is_generated ? " (GENERATED)" : "";
      console.log(
        `${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "NOT NULL" : ""} ${col.column_default ? `DEFAULT ${col.column_default}` : ""}${generated}`,
      );
    });

    // Get sample data if any exists
    const sampleData = await pool.query(
      "SELECT * FROM package_departures LIMIT 3",
    );
    console.log("\n📊 Sample data:");
    console.log("=====================================");
    if (sampleData.rows.length > 0) {
      sampleData.rows.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    } else {
      console.log("No data found in package_departures table");
    }

    // Get count
    const count = await pool.query(
      "SELECT COUNT(*) as total FROM package_departures",
    );
    console.log(`\n📈 Total departures: ${count.rows[0].total}`);
  } catch (error) {
    console.error("❌ Error checking structure:", error.message);
  } finally {
    await pool.end();
  }
}

checkStructure();
