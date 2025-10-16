const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Checking existing tables...\n");

    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('supplier_master', 'hotel_master', 'hotel_supplier_map', 'room_offer', 'supplier_field_mapping', 'hotel_dedup_audit')
    `);

    console.log("Existing master schema tables:");
    if (tables.rows.length === 0) {
      console.log("  (none)");
    } else {
      tables.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // Check supplier_master columns
    const supplier_cols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'supplier_master' AND table_schema = 'public'
    `);

    if (supplier_cols.rows.length > 0) {
      console.log("\nsupplier_master columns:");
      supplier_cols.rows.forEach((row) => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    }

    // Check constraints on supplier_master
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type FROM information_schema.table_constraints
      WHERE table_name = 'supplier_master' AND table_schema = 'public'
    `);

    if (constraints.rows.length > 0) {
      console.log("\nsupplier_master constraints:");
      constraints.rows.forEach((row) => {
        console.log(`  - ${row.constraint_name} (${row.constraint_type})`);
      });
    }

    process.exitCode = 0;
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
    setTimeout(() => process.exit(), 300);
  }
})();
