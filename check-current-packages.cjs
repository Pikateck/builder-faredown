/**
 * Check Current Packages in Database
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkPackages() {
  try {
    console.log("🔍 Checking current packages in database...");

    // Get packages count
    const packages = await pool.query("SELECT COUNT(*) as count FROM packages");
    console.log(`📦 Total packages: ${packages.rows[0].count}`);

    // Get sample packages
    const samplePackages = await pool.query(
      "SELECT title, city_id, country_id, region_id, status FROM packages LIMIT 10",
    );
    console.log("\n📋 Sample packages:");
    samplePackages.rows.forEach((pkg) => {
      console.log(`- ${pkg.title} (status: ${pkg.status})`);
    });

    // Get destinations with packages
    const destinations = await pool.query(`
      SELECT DISTINCT 
        c.name as country_name,
        ci.name as city_name,
        r.name as region_name,
        COUNT(p.id) as package_count
      FROM packages p
      LEFT JOIN countries c ON p.country_id = c.id  
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE p.status = 'active'
      GROUP BY c.name, ci.name, r.name
      ORDER BY package_count DESC
    `);

    console.log("\n🌍 Current destinations with packages:");
    destinations.rows.forEach((dest) => {
      console.log(
        `- ${dest.city_name || "N/A"}, ${dest.country_name || "N/A"} (${dest.region_name || "N/A"}): ${dest.package_count} packages`,
      );
    });

    // Check package structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'packages' 
      ORDER BY ordinal_position
    `);

    console.log("\n🏗️ Packages table structure:");
    structure.rows.forEach((col) => {
      console.log(
        `- ${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "(required)" : ""}`,
      );
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

checkPackages();
