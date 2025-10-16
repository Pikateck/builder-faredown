#!/usr/bin/env node

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyAndEnableRateHawk() {
  try {
    console.log("🔍 Checking suppliers table structure...");

    // Check if suppliers table exists and has expected columns
    const tableCheckResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'suppliers'
      ORDER BY ordinal_position
    `);

    console.log("✅ Suppliers table columns:");
    tableCheckResult.rows.forEach((col) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // Check all suppliers
    console.log("\n🔍 Current suppliers in database:");
    const suppliersResult = await pool.query(`
      SELECT code, name, product_type, is_enabled, environment, last_sync_at
      FROM suppliers
      ORDER BY code
    `);

    suppliersResult.rows.forEach((s) => {
      console.log(
        `   - ${s.code}: ${s.name} (${s.product_type}) - Enabled: ${s.is_enabled ? "✅" : "❌"} [${s.environment}] Last sync: ${s.last_sync_at || "Never"}`,
      );
    });

    // Check if RateHawk exists and is enabled
    const rateHawkResult = await pool.query(`
      SELECT * FROM suppliers WHERE code = 'ratehawk'
    `);

    if (rateHawkResult.rows.length === 0) {
      console.log("\n⚠️  RateHawk not found in suppliers table. Inserting...");
      await pool.query(`
        INSERT INTO suppliers (code, name, product_type, is_enabled, environment)
        VALUES ('ratehawk', 'RateHawk', 'hotels', TRUE, 'sandbox')
        ON CONFLICT (code) DO UPDATE SET
          is_enabled = TRUE,
          updated_at = NOW()
      `);
      console.log("✅ RateHawk inserted and enabled");
    } else {
      const rateHawk = rateHawkResult.rows[0];
      console.log(`\n📋 RateHawk found:`);
      console.log(`   - Enabled: ${rateHawk.is_enabled ? "✅ YES" : "❌ NO"}`);
      console.log(`   - Environment: ${rateHawk.environment}`);

      if (!rateHawk.is_enabled) {
        console.log("\n⚠️  RateHawk is DISABLED. Enabling...");
        await pool.query(`
          UPDATE suppliers 
          SET is_enabled = TRUE, updated_at = NOW()
          WHERE code = 'ratehawk'
        `);
        console.log("✅ RateHawk enabled");
      } else {
        console.log("\n✅ RateHawk is already enabled");
      }
    }

    // Verify environment variables
    console.log("\n🔑 Environment variables for RateHawk:");
    console.log(
      `   - RATEHAWK_API_ID: ${process.env.RATEHAWK_API_ID ? "✅ Set" : "❌ Missing"}`,
    );
    console.log(
      `   - RATEHAWK_API_KEY: ${process.env.RATEHAWK_API_KEY ? "✅ Set" : "❌ Missing"}`,
    );
    console.log(
      `   - RATEHAWK_BASE_URL: ${process.env.RATEHAWK_BASE_URL || "https://api.worldota.net/api/b2b/v3/"} ✅`,
    );

    // Verify Hotelbeds is also enabled
    console.log("\n🔍 Checking Hotelbeds status:");
    const hotelBedsResult = await pool.query(`
      SELECT * FROM suppliers WHERE code = 'hotelbeds'
    `);

    if (hotelBedsResult.rows.length > 0) {
      const hb = hotelBedsResult.rows[0];
      console.log(`   - Enabled: ${hb.is_enabled ? "✅ YES" : "❌ NO"}`);
    } else {
      console.log("   ❌ Hotelbeds not found in database");
    }

    console.log("\n✅ Verification complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyAndEnableRateHawk();
