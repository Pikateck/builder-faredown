/**
 * Debug database connection
 */

const { Pool } = require("pg");

async function testDbConnection() {
  console.log("🔍 Testing database connection...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Test basic connection
    console.log("1️⃣ Testing basic connection...");
    const result = await pool.query("SELECT 1 as test");
    console.log("✅ Basic connection works:", result.rows[0]);

    // Test pricing views exist
    console.log("2️⃣ Testing pricing views...");
    const viewsCheck = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%pricing%'
      ORDER BY table_name
    `);
    console.log("📊 Pricing views found:");
    viewsCheck.rows.forEach((row) => {
      console.log(`   ${row.table_name} (${row.table_type})`);
    });

    // Test querying the compatibility view
    console.log("3️⃣ Testing pricing_markup_rules view...");
    const markupTest = await pool.query(`
      SELECT COUNT(*) as count FROM pricing_markup_rules
    `);
    console.log(
      "✅ pricing_markup_rules query works, count:",
      markupTest.rows[0].count,
    );

    // Test a simple pricing engine query
    console.log("4️⃣ Testing specific query from PricingEngine...");
    const testQuery = await pool.query(
      `
      SELECT *
      FROM pricing_markup_rules
      WHERE status = 'active'
        AND module = $1
      LIMIT 1
    `,
      ["air"],
    );

    console.log(
      "✅ PricingEngine-style query works, results:",
      testQuery.rows.length,
    );
    if (testQuery.rows.length > 0) {
      console.log("   Sample result:", testQuery.rows[0]);
    }
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

testDbConnection();
