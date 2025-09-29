const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
});

async function checkDatabaseStructure() {
  try {
    console.log("=== CHECKING DATABASE STRUCTURE ===\n");

    // Check existing tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%region%' 
             OR table_name LIKE '%package%' 
             OR table_name LIKE '%destination%'
             OR table_name LIKE '%countr%'
             OR table_name LIKE '%cit%') 
      ORDER BY table_name
    `);

    console.log("EXISTING TABLES:");
    tablesResult.rows.forEach((row) => console.log(`- ${row.table_name}`));

    // Check packages table structure if exists
    try {
      const packagesStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'packages' 
        ORDER BY ordinal_position
      `);

      if (packagesStructure.rows.length > 0) {
        console.log("\n=== PACKAGES TABLE STRUCTURE ===");
        packagesStructure.rows.forEach((row) => {
          console.log(
            `${row.column_name}: ${row.data_type} (${row.is_nullable === "YES" ? "nullable" : "not null"})`,
          );
        });
      } else {
        console.log("\n=== PACKAGES TABLE DOES NOT EXIST ===");
      }
    } catch (err) {
      console.log("\n=== PACKAGES TABLE CHECK ERROR ===");
      console.log(err.message);
    }

    // Check for existing package data
    try {
      const packagesCount = await pool.query(
        "SELECT COUNT(*) as count FROM packages",
      );
      console.log(
        `\n=== EXISTING PACKAGES COUNT: ${packagesCount.rows[0].count} ===`,
      );

      if (packagesCount.rows[0].count > 0) {
        const samplePackages = await pool.query(`
          SELECT id, title, region_id, country_id, city_id, status 
          FROM packages 
          LIMIT 5
        `);
        console.log("\nSAMPLE PACKAGES:");
        samplePackages.rows.forEach((pkg) => {
          console.log(
            `- ${pkg.title} (region: ${pkg.region_id}, country: ${pkg.country_id}, city: ${pkg.city_id}, status: ${pkg.status})`,
          );
        });
      }
    } catch (err) {
      console.log("\n=== NO PACKAGES TABLE OR DATA ===");
      console.log(err.message);
    }
  } catch (error) {
    console.error("Database connection error:", error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure();
