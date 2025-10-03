/**
 * Cleanup Old Duplicate Markup Records
 *
 * This script removes old duplicate markup records to keep only
 * the clean class-specific ones
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function cleanupOldMarkups() {
  const client = await pool.connect();

  try {
    console.log("🧹 Starting cleanup of old duplicate markup records...\n");

    // Begin transaction
    await client.query("BEGIN");

    // Remove the old "BOM→DXB | EK | Y" duplicate records
    const deleteResult = await client.query(`
      DELETE FROM markup_rules 
      WHERE module = 'air' 
        AND route_from = 'BOM' 
        AND route_to = 'DXB'
        AND rule_name LIKE '%| EK | Y%'
      RETURNING id, rule_name;
    `);

    if (deleteResult.rowCount > 0) {
      console.log(
        `🗑️  Removed ${deleteResult.rowCount} old duplicate record(s):\n`,
      );
      deleteResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.rule_name} (ID: ${row.id})`);
      });
      console.log("");
    } else {
      console.log("✅ No old duplicate records found to clean up\n");
    }

    // Commit transaction
    await client.query("COMMIT");

    // Verify the remaining records
    const verifyQuery = await client.query(`
      SELECT id, rule_name, booking_class, m_value, is_active
      FROM markup_rules
      WHERE module = 'air' 
        AND route_from = 'BOM' 
        AND route_to = 'DXB'
      ORDER BY 
        CASE booking_class
          WHEN 'economy' THEN 1
          WHEN 'premium-economy' THEN 2
          WHEN 'business' THEN 3
          WHEN 'first' THEN 4
        END;
    `);

    console.log("═══════════════════════════════════════════════════════");
    console.log("📊 Current BOM → DXB markup records (cleaned):\n");

    verifyQuery.rows.forEach((row, index) => {
      const classLabel =
        row.booking_class === "economy"
          ? "Economy"
          : row.booking_class === "premium-economy"
            ? "Premium Economy"
            : row.booking_class === "business"
              ? "Business"
              : row.booking_class === "first"
                ? "First"
                : row.booking_class;

      console.log(`${index + 1}. ${row.rule_name}`);
      console.log(`   Class: All – ${classLabel} Class`);
      console.log(`   Markup: ${row.m_value}%`);
      console.log(
        `   Status: ${row.is_active ? "Active ✅" : "Inactive ❌"}\n`,
      );
    });

    console.log("═══════════════════════════════════════════════════════");
    console.log("✨ Cleanup completed successfully!");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\nYou should now see exactly 4 clean markup records:");
    console.log("1. Mumbai-Dubai Economy Markup (15%)");
    console.log("2. Mumbai-Dubai Premium Economy Markup (12%)");
    console.log("3. Mumbai-Dubai Business Class Markup (10%)");
    console.log("4. Mumbai-Dubai First Class Markup (8%)\n");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error during cleanup:", error);
    console.error("\nError details:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
cleanupOldMarkups()
  .then(() => {
    console.log("✅ Cleanup script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Cleanup script failed:", error.message);
    process.exit(1);
  });
