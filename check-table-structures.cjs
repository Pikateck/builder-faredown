const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
});

async function checkTableStructures() {
  try {
    console.log("🔍 Checking table structures for data type mismatches...\n");

    // Check packages table foreign key columns
    const packagesFK = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'packages' 
        AND column_name IN ('region_id', 'country_id', 'city_id')
      ORDER BY column_name
    `);

    console.log("PACKAGES TABLE FOREIGN KEYS:");
    packagesFK.rows.forEach((row) => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // Check destination tables primary keys
    const regionsPK = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'regions' AND column_name = 'id'
    `);

    const countriesPK = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'countries' AND column_name = 'id'
    `);

    const citiesPK = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cities' AND column_name = 'id'
    `);

    console.log("\nDESTINATION TABLES PRIMARY KEYS:");
    console.log(`- regions.id: ${regionsPK.rows[0]?.data_type || "NOT FOUND"}`);
    console.log(
      `- countries.id: ${countriesPK.rows[0]?.data_type || "NOT FOUND"}`,
    );
    console.log(`- cities.id: ${citiesPK.rows[0]?.data_type || "NOT FOUND"}`);

    // Check constraints
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'packages'
        AND kcu.column_name IN ('region_id', 'country_id', 'city_id')
    `);

    console.log("\nFOREIGN KEY CONSTRAINTS:");
    if (constraints.rows.length > 0) {
      constraints.rows.forEach((row) => {
        console.log(
          `- ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`,
        );
      });
    } else {
      console.log("- No foreign key constraints found");
    }

    // Sample data from each table to see actual IDs
    console.log("\nSAMPLE DATA:");

    try {
      const regionsData = await pool.query(
        "SELECT id, name FROM regions LIMIT 3",
      );
      console.log("Regions sample:");
      regionsData.rows.forEach((row) =>
        console.log(`  ${row.id} (${typeof row.id}): ${row.name}`),
      );
    } catch (err) {
      console.log("Regions: Error -", err.message);
    }

    try {
      const countriesData = await pool.query(
        "SELECT id, name FROM countries LIMIT 3",
      );
      console.log("Countries sample:");
      countriesData.rows.forEach((row) =>
        console.log(`  ${row.id} (${typeof row.id}): ${row.name}`),
      );
    } catch (err) {
      console.log("Countries: Error -", err.message);
    }

    try {
      const citiesData = await pool.query(
        "SELECT id, name FROM cities LIMIT 3",
      );
      console.log("Cities sample:");
      citiesData.rows.forEach((row) =>
        console.log(`  ${row.id} (${typeof row.id}): ${row.name}`),
      );
    } catch (err) {
      console.log("Cities: Error -", err.message);
    }
  } catch (error) {
    console.error("❌ Error checking table structures:", error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructures();
