const fs = require("fs");
const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("✓ Connected\n");

    console.log("Applying Phase 1 master schema migration...\n");

    const migrationSQL = fs.readFileSync(
      require("path").join(__dirname, "database/migrations/20250315_unified_hotel_master_schema_v2.sql"),
      "utf-8",
    );

    // Execute migration
    await client.query(migrationSQL);

    console.log("✅ Migration applied successfully!\n");

    // Verify tables exist
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('supplier_master', 'hotel_master', 'hotel_supplier_map', 'room_offer', 'supplier_field_mapping', 'hotel_dedup_audit')
      ORDER BY table_name
    `);

    console.log("Created tables:");
    tables.rows.forEach((row) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Count rows
    const suppliers = await client.query(
      "SELECT COUNT(*) as count FROM supplier_master",
    );
    console.log(`\nSupplier master initialized with ${suppliers.rows[0].count} rows`);

    const mappings = await client.query(
      "SELECT COUNT(*) as count FROM supplier_field_mapping",
    );
    console.log(
      `Field mapping registry initialized with ${mappings.rows[0].count} rows\n`,
    );

    process.exitCode = 0;
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
    setTimeout(() => process.exit(), 300);
  }
})();
