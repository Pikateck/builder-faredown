/**
 * Update pricing compatibility views
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function updateViews() {
  console.log("🔄 Updating pricing compatibility views...");

  try {
    // Drop and recreate promo codes view with fixed date handling
    console.log("1️⃣ Dropping existing pricing_promo_codes view...");
    await pool.query(`DROP VIEW IF EXISTS pricing_promo_codes`);

    console.log("2️⃣ Creating new pricing_promo_codes view...");
    await pool.query(`
      CREATE VIEW pricing_promo_codes AS
      SELECT
        id::text as id,
        code,
        discount_type as type,
        (discount_min + discount_max) / 2 as value,
        module,
        min_fare_amount as min_fare,
        null::numeric as max_discount,
        null::integer as usage_limit,
        0::integer as usage_count,
        1::integer as user_limit,
        status,
        CURRENT_DATE as valid_from,
        expires_on as valid_to,
        created_at,
        updated_at
      FROM promo_codes
      WHERE status = 'active'
    `);
    console.log("✅ pricing_promo_codes view updated");

    // Test the view
    console.log("3️⃣ Testing new view...");
    const testResult = await pool.query(`
      SELECT code, type, value, valid_from, valid_to 
      FROM pricing_promo_codes 
      LIMIT 3
    `);

    console.log("✅ View test successful, sample data:");
    testResult.rows.forEach((row) => {
      console.log(
        `   ${row.code}: ${row.type} ${row.value} (${row.valid_from} to ${row.valid_to})`,
      );
    });

    console.log("\n🎉 Views updated successfully!");
  } catch (error) {
    console.error("❌ Failed to update views:", error.message);
  } finally {
    await pool.end();
  }
}

updateViews();
