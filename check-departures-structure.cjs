const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
});

async function checkDeparturesStructure() {
  try {
    console.log("🔍 Checking package_departures table structure...\n");

    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'package_departures'
      ORDER BY ordinal_position
    `);

    console.log("PACKAGE_DEPARTURES TABLE STRUCTURE:");
    structure.rows.forEach((row) => {
      console.log(
        `- ${row.column_name}: ${row.data_type} (${row.is_nullable === "YES" ? "nullable" : "not null"})`,
      );
    });

    // Check if any departures exist
    const count = await pool.query(
      "SELECT COUNT(*) as count FROM package_departures",
    );
    console.log(`\nExisting departures: ${count.rows[0].count}`);

    if (count.rows[0].count > 0) {
      const sample = await pool.query(
        "SELECT * FROM package_departures LIMIT 3",
      );
      console.log("\nSample departures:");
      sample.rows.forEach((row, i) => {
        console.log(
          `${i + 1}. Package ID: ${row.package_id}, Date: ${row.departure_date}, Price: ${row.price_per_person}`,
        );
      });
    }
  } catch (error) {
    console.error("❌ Error checking departures structure:", error.message);
  } finally {
    await pool.end();
  }
}

checkDeparturesStructure();
