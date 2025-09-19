const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function cleanupTestData() {
  try {
    console.log("🧹 Cleaning up test data...");

    // Delete test searches (keeping only real user searches)
    const result = await pool.query(`
      DELETE FROM recent_searches 
      WHERE device_id LIKE '%test%' 
         OR device_id LIKE '%debug%'
         OR device_id LIKE '%e2e%'
         OR created_at < NOW() - INTERVAL '1 hour'
    `);

    console.log(`✅ Cleaned up ${result.rowCount} test records`);

    // Show remaining records
    const remaining = await pool.query(
      "SELECT COUNT(*) as count FROM recent_searches",
    );
    console.log(`📋 Remaining records: ${remaining.rows[0].count}`);
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
  } finally {
    await pool.end();
  }
}

cleanupTestData();
