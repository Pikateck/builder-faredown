/**
 * Apply Comprehensive Packages to Database
 * This script will populate the packages table with 25+ destination packages
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function applyPackages() {
  const client = await pool.connect();

  try {
    console.log("📦 Starting comprehensive packages import...");

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, "comprehensive-packages-seed.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    // Execute the SQL
    console.log("🚀 Executing packages SQL script...");
    await client.query(sqlContent);

    // Get final count and sample data
    const packagesResult = await pool.query(
      "SELECT COUNT(*) as total FROM packages",
    );
    const departuresResult = await pool.query(
      "SELECT COUNT(*) as total FROM package_departures",
    );
    const countriesResult = await pool.query(
      "SELECT COUNT(DISTINCT country_id) as total FROM packages WHERE country_id IS NOT NULL",
    );

    console.log("✅ Packages import completed successfully!");
    console.log(`📦 Total packages: ${packagesResult.rows[0].total}`);
    console.log(`🗓️ Total departures: ${departuresResult.rows[0].total}`);
    console.log(`🌍 Countries with packages: ${countriesResult.rows[0].total}`);

    // Show sample packages by country
    const sampleResult = await pool.query(`
      SELECT 
        p.title,
        c.name as country_name,
        p.base_price_pp,
        p.package_category,
        p.is_featured
      FROM packages p
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.base_price_pp DESC
      LIMIT 15
    `);

    console.log("\n🌟 Sample packages by destination:");
    sampleResult.rows.forEach((pkg) => {
      const featured = pkg.is_featured ? "⭐" : "  ";
      console.log(
        `${featured} ${pkg.title} (${pkg.country_name}) - ₹${pkg.base_price_pp.toLocaleString()} - ${pkg.package_category}`,
      );
    });

    return {
      packages: packagesResult.rows[0].total,
      departures: departuresResult.rows[0].total,
      countries: countriesResult.rows[0].total,
    };
  } catch (error) {
    console.error("❌ Error applying packages:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
if (require.main === module) {
  applyPackages()
    .then(({ packages, departures, countries }) => {
      console.log(
        `\n🎉 Success! Database now has ${packages} packages with ${departures} departures across ${countries} countries`,
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Failed to apply packages:", error.message);
      process.exit(1);
    });
}

module.exports = { applyPackages };
