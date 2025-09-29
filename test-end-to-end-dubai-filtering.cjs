const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
});

async function testDubaiFiltering() {
  try {
    console.log(
      "🧪 Testing End-to-End Dubai Filtering for October 1-5, 2025\n",
    );

    // Simulate the exact query that would be sent from frontend
    console.log("📋 Simulating frontend query...");
    const searchParams = new URLSearchParams();
    searchParams.set("destination", "Dubai, United Arab Emirates");
    searchParams.set("destination_type", "city");
    searchParams.set("departure_date", "2025-10-01");
    searchParams.set("return_date", "2025-10-05");
    searchParams.set("adults", "2");
    searchParams.set("children", "0");

    console.log(`Query: /packages?${searchParams.toString()}\n`);

    // Test the exact SQL query that the API would execute
    const testQuery = `
      SELECT
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        (
          SELECT MIN(pd.departure_date)
          FROM package_departures pd 
          WHERE pd.package_id = p.id 
            AND pd.is_active = TRUE 
            AND pd.departure_date >= CURRENT_DATE
            AND pd.available_seats > 0
        ) as next_departure_date,
        p.base_price_pp as from_price,
        (
          SELECT COUNT(*)
          FROM package_departures pd 
          WHERE pd.package_id = p.id 
            AND pd.is_active = TRUE 
            AND pd.departure_date >= CURRENT_DATE
            AND pd.available_seats > 0
        ) as available_departures_count
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE p.status = 'active'
        AND EXISTS (
          SELECT 1 FROM cities ci2 
          WHERE ci2.id = p.city_id 
          AND ci2.name ILIKE '%Dubai%'
        )
        AND EXISTS (
          SELECT 1 FROM package_departures pd 
          WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.available_seats > 0
          AND pd.departure_date >= $1
          AND pd.departure_date <= $2
        )
      ORDER BY p.is_featured DESC, p.rating DESC, p.review_count DESC, p.created_at DESC
    `;

    const result = await pool.query(testQuery, ["2025-10-01", "2025-10-05"]);

    console.log("🎯 FILTERING RESULTS:");
    console.log(`Found ${result.rows.length} packages\n`);

    if (result.rows.length > 0) {
      console.log("✅ PACKAGES MATCHING DUBAI + OCT 1-5, 2025:");
      result.rows.forEach((pkg, index) => {
        console.log(
          `${index + 1}. ${pkg.title} (${pkg.package_category || pkg.category})`,
        );
        console.log(
          `   📍 ${pkg.city_name}, ${pkg.country_name} (${pkg.region_name})`,
        );
        console.log(
          `   💰 ₹${pkg.from_price} | Rating: ${pkg.rating || "N/A"}`,
        );
        console.log(`   📅 Next departure: ${pkg.next_departure_date}`);
        console.log(
          `   🗓️ Available departures: ${pkg.available_departures_count}`,
        );
        console.log("");
      });

      // Verify all packages are Dubai packages
      const nonDubaiPackages = result.rows.filter(
        (pkg) => !pkg.city_name || pkg.city_name !== "Dubai",
      );
      if (nonDubaiPackages.length > 0) {
        console.log("❌ ERROR: Found non-Dubai packages:");
        nonDubaiPackages.forEach((pkg) => {
          console.log(`- ${pkg.title} (${pkg.city_name || "Unknown city"})`);
        });
      } else {
        console.log("✅ All packages are correctly filtered to Dubai only");
      }

      // Check package variety (should have different categories)
      const categories = [
        ...new Set(
          result.rows.map((pkg) => pkg.package_category || pkg.category),
        ),
      ];
      console.log(`\n📊 Package categories found: ${categories.join(", ")}`);

      if (categories.length >= 3) {
        console.log("✅ Requirement met: 3+ package types per region");
      } else {
        console.log("⚠️ Less than 3 package types found");
      }
    } else {
      console.log("❌ NO PACKAGES FOUND - This indicates a problem!");

      // Debug: Check if Dubai packages exist at all
      const dubaiCheck = await pool.query(`
        SELECT p.title, ci.name as city_name
        FROM packages p
        LEFT JOIN cities ci ON p.city_id = ci.id
        WHERE p.status = 'active' AND ci.name = 'Dubai'
      `);

      console.log(
        `\nDEBUG: Found ${dubaiCheck.rows.length} total Dubai packages:`,
      );
      dubaiCheck.rows.forEach((pkg) => {
        console.log(`- ${pkg.title}`);
      });

      // Check if any departures exist for the date range
      const departuresCheck = await pool.query(`
        SELECT COUNT(*) as count
        FROM package_departures pd
        JOIN packages p ON pd.package_id = p.id
        JOIN cities ci ON p.city_id = ci.id
        WHERE ci.name = 'Dubai' 
          AND pd.departure_date BETWEEN '2025-10-01' AND '2025-10-05'
          AND pd.is_active = TRUE
      `);

      console.log(
        `DEBUG: Found ${departuresCheck.rows[0].count} departures for Dubai Oct 1-5`,
      );
    }

    // Test what the header should display
    console.log("\n📋 EXPECTED FRONTEND DISPLAY:");
    console.log("Header should show:");
    console.log(`- Fixed Packages – ${result.rows.length} packages found`);
    console.log("- Destination: Dubai, United Arab Emirates");
    console.log("- Departure: Wed, Oct 1, 2025 – Sun, Oct 5, 2025");

    // Generate facets for the filtered results
    if (result.rows.length > 0) {
      const facets = {
        regions: {},
        categories: {},
      };

      result.rows.forEach((pkg) => {
        if (pkg.region_name) {
          facets.regions[pkg.region_name] =
            (facets.regions[pkg.region_name] || 0) + 1;
        }
        if (pkg.package_category) {
          facets.categories[pkg.package_category] =
            (facets.categories[pkg.package_category] || 0) + 1;
        }
      });

      console.log("\n🏷️ FACETS (for filters sidebar):");
      console.log(
        "Regions:",
        Object.entries(facets.regions)
          .map(([name, count]) => `${name}(${count})`)
          .join(", "),
      );
      console.log(
        "Categories:",
        Object.entries(facets.categories)
          .map(([name, count]) => `${name}(${count})`)
          .join(", "),
      );
    }

    console.log("\n🎉 End-to-End Test Complete!");
  } catch (error) {
    console.error("❌ Error testing Dubai filtering:", error);
  } finally {
    await pool.end();
  }
}

testDubaiFiltering();
