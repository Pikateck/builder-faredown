#!/usr/bin/env node

const { Pool } = require("pg");

// Database connection
const dbUrl = process.env.DATABASE_URL;
const sslConfig =
  dbUrl && (dbUrl.includes("render.com") || dbUrl.includes("postgres://"))
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function checkLondonDepartures() {
  try {
    console.log("🔍 Checking London Royal Experience departures...");

    // 1. Check package details
    const packageQuery = `
      SELECT id, slug, title 
      FROM packages 
      WHERE slug = 'london-royal-experience'
    `;
    const packageResult = await pool.query(packageQuery);
    console.log("📦 Package found:", packageResult.rows[0]);

    if (packageResult.rows.length === 0) {
      console.log("❌ Package not found!");
      return;
    }

    const packageId = packageResult.rows[0].id;

    // 2. Check departures for this package
    const departuresQuery = `
      SELECT id, package_id, departure_date, return_date, 
             departure_city_code, departure_city_name,
             price_per_person, currency, available_seats,
             total_seats, is_active, is_guaranteed
      FROM package_departures 
      WHERE package_id = $1
      ORDER BY departure_date
    `;
    const departuresResult = await pool.query(departuresQuery, [packageId]);

    console.log(`📅 Departures found: ${departuresResult.rows.length}`);

    if (departuresResult.rows.length === 0) {
      console.log("❌ No departures found for London Royal Experience!");
      console.log(
        "💡 This is why the buttons are disabled - need to add departure data",
      );
    } else {
      console.log("✅ Departures data:");
      departuresResult.rows.forEach((dep) => {
        console.log(
          `   - ${dep.departure_date} from ${dep.departure_city_name} (${dep.departure_city_code})`,
        );
        console.log(
          `     Price: ${dep.price_per_person} ${dep.currency}, Seats: ${dep.available_seats}/${dep.total_seats}`,
        );
      });
    }
  } catch (error) {
    console.error("❌ Error checking departures:", error);
  } finally {
    await pool.end();
  }
}

checkLondonDepartures();
