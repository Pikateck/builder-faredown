const { Pool } = require("pg");

async function checkRegions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query("SELECT COUNT(*) FROM regions");
    console.log("Regions count:", result.rows[0].count);

    if (parseInt(result.rows[0].count) === 0) {
      console.log("❌ No regions found. Need to seed regions data.");
    } else {
      const sample = await pool.query(
        "SELECT id, name, level FROM regions LIMIT 5",
      );
      console.log("Sample regions:");
      sample.rows.forEach((r) => console.log(`- ${r.name} (level ${r.level})`));
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkRegions();
