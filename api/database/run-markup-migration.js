const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

(async () => {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error("DATABASE_URL not set");
      process.exit(1);
    }
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log("🔌 Connected to Postgres");

    const filePath = path.join(__dirname, "migrations", "V2025_09_01_markup_system.sql");
    const sql = fs.readFileSync(filePath, "utf8");

    console.log("📄 Executing migration V2025_09_01_markup_system.sql ...");
    await client.query(sql);
    console.log("✅ Migration executed");

    const check = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('markup_rules','pricing_quotes') ORDER BY table_name");
    console.log("📋 Tables:", check.rows.map(r => r.table_name).join(", "));

    await client.end();
    process.exit(0);
  } catch (e) {
    console.error("❌ Migration error:", e.message);
    process.exit(1);
  }
})();
