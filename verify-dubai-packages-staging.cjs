const { Pool } = require("pg");

async function verifyDubaiPackages() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    console.log("🔍 STAGING VALIDATION: DUBAI PACKAGES DATABASE QUERY");
    console.log("==================================================");

    // Query for Dubai packages with Oct 1-10, 2025 departures
    const dubaiQuery = `
      SELECT 
        p.id, p.title, p.package_category, p.base_price_pp,
        r.name as region_name,
        c.name as country_name, 
        ci.name as city_name,
        pd.departure_date, pd.return_date, pd.available_seats
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id  
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN package_departures pd ON p.id = pd.package_id
      WHERE ci.name = 'Dubai'
        AND p.status = 'active'
        AND pd.departure_date >= '2025-10-01'
        AND pd.departure_date <= '2025-10-10'
        AND pd.is_active = TRUE
        AND pd.available_seats > 0
      ORDER BY p.package_category, pd.departure_date;
    `;

    const dubaiResult = await pool.query(dubaiQuery);

    console.log(`✅ DUBAI PACKAGES FOUND: ${dubaiResult.rows.length}`);
    console.log("");

    dubaiResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. 📦 ${row.title} (${row.package_category})`);
      console.log(
        `   🏙️ Location: ${row.city_name}, ${row.country_name} (${row.region_name})`,
      );
      console.log(
        `   💰 Price: ₹${row.base_price_pp?.toLocaleString() || "N/A"} per person`,
      );
      console.log(
        `   📅 Departure: ${row.departure_date} - Return: ${row.return_date}`,
      );
      console.log(`   💺 Available Seats: ${row.available_seats}`);
      console.log(`   🆔 Package ID: ${row.id}`);
      console.log("");
    });

    // Query for NON-Dubai packages to verify they should NOT appear
    const nonDubaiQuery = `
      SELECT 
        p.id, p.title, p.package_category,
        r.name as region_name,
        c.name as country_name, 
        ci.name as city_name,
        COUNT(pd.id) as departure_count
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id  
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN package_departures pd ON p.id = pd.package_id
      WHERE ci.name != 'Dubai' 
        AND p.status = 'active'
        AND pd.departure_date >= '2025-10-01'
        AND pd.departure_date <= '2025-10-10'
        AND pd.is_active = TRUE
      GROUP BY p.id, p.title, p.package_category, r.name, c.name, ci.name
      ORDER BY ci.name, p.title;
    `;

    const nonDubaiResult = await pool.query(nonDubaiQuery);

    console.log("🚫 NON-DUBAI PACKAGES (SHOULD NOT APPEAR IN DUBAI SEARCH):");
    console.log("====================================================");
    console.log(`Found: ${nonDubaiResult.rows.length} non-Dubai packages`);
    console.log("");

    nonDubaiResult.rows.slice(0, 5).forEach((row, index) => {
      console.log(`${index + 1}. ❌ ${row.title} (${row.package_category})`);
      console.log(
        `   🏙️ Location: ${row.city_name}, ${row.country_name} (${row.region_name})`,
      );
      console.log(`   📅 Departures in range: ${row.departure_count}`);
      console.log("");
    });

    if (nonDubaiResult.rows.length > 5) {
      console.log(
        `... and ${nonDubaiResult.rows.length - 5} more non-Dubai packages`,
      );
      console.log("");
    }

    // Test the exact API call that should be made
    console.log("🧪 API TEST: Simulating frontend API call");
    console.log("========================================");

    const apiTestQuery = `
      SELECT DISTINCT
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        p.base_price_pp as from_price,
        (
          SELECT COUNT(*)
          FROM package_departures pd2 
          WHERE pd2.package_id = p.id 
            AND pd2.is_active = TRUE 
            AND pd2.departure_date >= CURRENT_DATE
            AND pd2.available_seats > 0
            AND pd2.departure_date >= '2025-10-01'
            AND pd2.departure_date <= '2025-10-10'
        ) as available_departures_count
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      JOIN cities ci2 ON p.city_id = ci2.id
      WHERE p.status = 'active' 
        AND ci2.name ILIKE '%Dubai%'
        AND EXISTS (
          SELECT 1 FROM package_departures pd 
          WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.available_seats > 0
          AND pd.departure_date >= '2025-10-01'
          AND pd.departure_date <= '2025-10-10'
        )
      ORDER BY 
        p.package_category,
        p.is_featured DESC,
        p.base_price_pp ASC
      LIMIT 20;
    `;

    const apiTestResult = await pool.query(apiTestQuery);

    console.log(
      `✅ API SIMULATION RESULT: ${apiTestResult.rows.length} packages should be returned`,
    );
    console.log("");

    apiTestResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ✅ ${row.title} (${row.package_category})`);
      console.log(
        `   🏙️ ${row.city_name}, ${row.country_name} (${row.region_name})`,
      );
      console.log(
        `   💰 ₹${row.base_price_pp?.toLocaleString() || "N/A"} per person`,
      );
      console.log(
        `   📅 Available departures: ${row.available_departures_count}`,
      );
      console.log("");
    });

    console.log("🏁 VALIDATION SUMMARY:");
    console.log("====================");
    console.log(`✅ Dubai packages in DB: ${dubaiResult.rows.length}`);
    console.log(`❌ Non-Dubai packages in DB: ${nonDubaiResult.rows.length}`);
    console.log(
      `🧪 API should return: ${apiTestResult.rows.length} Dubai packages only`,
    );
    console.log("");

    if (
      apiTestResult.rows.length > 0 &&
      apiTestResult.rows.every((pkg) => pkg.city_name === "Dubai")
    ) {
      console.log(
        "✅ DATABASE IS CORRECT: Only Dubai packages match the criteria",
      );
    } else {
      console.log(
        "❌ DATABASE ISSUE: Non-Dubai packages are matching Dubai search",
      );
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Database verification failed:", error.message);
    await pool.end();
    process.exit(1);
  }
}

verifyDubaiPackages();
