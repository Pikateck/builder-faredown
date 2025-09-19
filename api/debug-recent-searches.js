const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function debugRecentSearches() {
  try {
    console.log("🔍 Debugging recent searches...\n");

    // Check what's in the table
    const allResults = await pool.query(`
      SELECT id, user_id, device_id, module, query_hash, created_at, updated_at 
      FROM recent_searches 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log("📋 Recent searches in DB:", allResults.rows.length);

    allResults.rows.forEach((row, i) => {
      console.log(
        `${i + 1}. ID: ${row.id}, User: ${row.user_id || "null"}, Device: ${row.device_id || "null"}`,
      );
      console.log(
        `   Module: ${row.module}, Hash: ${row.query_hash.substring(0, 16)}...`,
      );
      console.log(`   Created: ${row.created_at}`);
      console.log("");
    });

    // Test a specific device query
    console.log('🔍 Testing device query for "test-device-e2e"...');
    const deviceResults = await pool.query(
      `
      SELECT id, module, query, created_at, updated_at
      FROM recent_searches
      WHERE device_id = $1 AND module = $2
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 6
    `,
      ["test-device-e2e", "flights"],
    );

    console.log("Device query results:", deviceResults.rows.length);
    deviceResults.rows.forEach((row, i) => {
      console.log(
        `${i + 1}. ${row.query.from.name} → ${row.query.to.name} (${row.query.tripType})`,
      );
    });

    // Check constraints
    console.log("\n🔍 Checking table constraints...");
    const constraints = await pool.query(`
      SELECT conname, contype, confupdtype, confdeltype 
      FROM pg_constraint 
      WHERE conrelid = 'recent_searches'::regclass
    `);

    console.log("Table constraints:");
    constraints.rows.forEach((row) => {
      console.log(`- ${row.conname} (${row.contype})`);
    });
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

debugRecentSearches();
