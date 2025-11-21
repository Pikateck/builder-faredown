#!/usr/bin/env node

const db = require("../lib/db");

async function testQuery() {
  try {
    console.log("Testing the fixed SQL query...\n");

    // Test the fixed query
    const result = await db.query(
      `SELECT c.id, c.name, c.country_id, co.iso2 AS iso_code
       FROM cities c
       JOIN countries co ON c.country_id = co.id
       WHERE c.is_active = true
       ORDER BY co.iso2, c.name
       LIMIT 5`,
    );

    console.log("✅ Query executed successfully!");
    console.log(`Found ${result.rows.length} cities`);
    console.log("\nSample results:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.name} (${row.iso_code})`);
    });

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await db.end();
    process.exit(1);
  }
}

testQuery();
