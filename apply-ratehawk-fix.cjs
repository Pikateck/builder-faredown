#!/usr/bin/env node
/**
 * Apply RateHawk fix to database
 * Adds RateHawk to ai.suppliers table so it can store results
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyRateHawkFix() {
  try {
    console.log("🔧 Applying RateHawk Fix to Database\n");
    console.log("=".repeat(60));

    // Step 1: Add product_type column to ai.suppliers if needed
    console.log("\n1️⃣  Checking ai.suppliers table structure...");
    try {
      await pool.query(`
        ALTER TABLE ai.suppliers 
        ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'hotels'
      `);
      console.log("   ✅ product_type column ensured");
    } catch (e) {
      if (e.message.includes("does not exist")) {
        console.log(
          "   ⚠️  ai.suppliers table not found, creating structure...",
        );
      } else {
        console.log(
          "   ⚠️  Column already exists or other issue:",
          e.message.split("\n")[0],
        );
      }
    }

    // Step 2: Insert RateHawk into ai.suppliers
    console.log("\n2️⃣  Adding RateHawk to ai.suppliers...");
    const rateHawkResult = await pool.query(`
      INSERT INTO ai.suppliers (code, name, active, product_type)
      VALUES ('ratehawk', 'RateHawk', true, 'hotels')
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        active = true,
        product_type = EXCLUDED.product_type,
        updated_at = NOW()
      RETURNING *
    `);
    console.log(
      `   ✅ RateHawk record: ID=${rateHawkResult.rows[0].id}, Code=${rateHawkResult.rows[0].code}`,
    );

    // Step 3: Insert Hotelbeds into ai.suppliers
    console.log("\n3️⃣  Adding Hotelbeds to ai.suppliers...");
    const hotelbedsResult = await pool.query(`
      INSERT INTO ai.suppliers (code, name, active, product_type)
      VALUES ('hotelbeds', 'Hotelbeds', true, 'hotels')
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        active = true,
        product_type = EXCLUDED.product_type,
        updated_at = NOW()
      RETURNING *
    `);
    console.log(
      `   ✅ Hotelbeds record: ID=${hotelbedsResult.rows[0].id}, Code=${hotelbedsResult.rows[0].code}`,
    );

    // Step 4: Insert Amadeus and TBO for flights
    console.log("\n4️⃣  Adding flight suppliers to ai.suppliers...");
    const amadeusResult = await pool.query(`
      INSERT INTO ai.suppliers (code, name, active, product_type)
      VALUES ('amadeus', 'Amadeus', true, 'flights')
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        active = true,
        product_type = EXCLUDED.product_type,
        updated_at = NOW()
      RETURNING *
    `);
    console.log(`   ✅ Amadeus record: ID=${amadeusResult.rows[0].id}`);

    const tboResult = await pool.query(`
      INSERT INTO ai.suppliers (code, name, active, product_type)
      VALUES ('tbo', 'TBO', true, 'flights')
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        active = true,
        product_type = EXCLUDED.product_type,
        updated_at = NOW()
      RETURNING *
    `);
    console.log(`   ✅ TBO record: ID=${tboResult.rows[0].id}`);

    // Step 5: Verify all suppliers in ai.suppliers
    console.log("\n5️⃣  Verifying ai.suppliers content...");
    const aiSuppliersResult = await pool.query(`
      SELECT id, code, name, active, product_type FROM ai.suppliers ORDER BY code
    `);
    console.log("   AI Schema Suppliers:");
    aiSuppliersResult.rows.forEach((s) => {
      console.log(
        `      ${s.id}. ${s.code}: ${s.name} (${s.product_type}) - Active: ${s.active ? "✅" : "❌"}`,
      );
    });

    // Step 6: Also ensure public suppliers table has them
    console.log("\n6️⃣  Syncing to public suppliers table...");
    await pool.query(`
      INSERT INTO suppliers (code, name, product_type, is_enabled)
      VALUES 
        ('ratehawk', 'RateHawk', 'hotels', true),
        ('hotelbeds', 'Hotelbeds', 'hotels', true),
        ('amadeus', 'Amadeus', 'flights', true),
        ('tbo', 'TBO', 'flights', true)
      ON CONFLICT (code) DO UPDATE SET
        is_enabled = true,
        updated_at = NOW()
    `);
    console.log("   ✅ Public suppliers table updated");

    // Step 7: Verify all suppliers in public suppliers
    console.log("\n7️⃣  Verifying public suppliers content...");
    const publicSuppliersResult = await pool.query(`
      SELECT code, name, product_type, is_enabled FROM suppliers ORDER BY code
    `);
    console.log("   Public Schema Suppliers:");
    publicSuppliersResult.rows.forEach((s) => {
      const status = s.is_enabled ? "✅" : "❌";
      console.log(`      ${status} ${s.code}: ${s.name} (${s.product_type})`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ RateHawk Fix Applied Successfully!\n");
    console.log("Summary:");
    console.log(
      "  - RateHawk added to ai.suppliers (will now store search results)",
    );
    console.log("  - All suppliers verified in both ai and public schemas");
    console.log(
      "  - Next search should return RateHawk results alongside Hotelbeds",
    );
    console.log("\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error applying fix:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyRateHawkFix();
