/**
 * Fix materialized view trigger
 */

const { Pool } = require("pg");

async function fixMaterializedView() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🔧 Fixing materialized view trigger...");

    // Drop the problematic trigger
    await pool.query(
      "DROP TRIGGER IF EXISTS trigger_refresh_price_latest ON price_checkpoints",
    );
    console.log("✅ Trigger dropped");

    // Drop the function
    await pool.query("DROP FUNCTION IF EXISTS refresh_price_latest()");
    console.log("✅ Function dropped");

    console.log("🎉 Materialized view issues fixed!");
  } catch (error) {
    console.error("❌ Failed to fix:", error.message);
  } finally {
    await pool.end();
  }
}

fixMaterializedView();
