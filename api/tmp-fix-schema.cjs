const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    console.log("Adding missing columns to unified tables...\n");

    await client.query(
      "ALTER TABLE room_offer_unified ADD COLUMN IF NOT EXISTS hotel_name TEXT",
    );
    console.log("✓ Added hotel_name to room_offer_unified");

    await client.query(
      "ALTER TABLE room_offer_unified ADD COLUMN IF NOT EXISTS city TEXT",
    );
    console.log("✓ Added city to room_offer_unified");

    // Verify columns exist
    const columns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'room_offer_unified' 
      AND column_name IN ('hotel_name', 'city')
    `);

    console.log("\nVerified columns:");
    columns.rows.forEach((row) => {
      console.log(`  ✓ ${row.column_name}`);
    });

    process.exitCode = 0;
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
    setTimeout(() => process.exit(), 300);
  }
})();
