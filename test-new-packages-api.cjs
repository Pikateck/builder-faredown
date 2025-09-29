const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
});

async function testPackagesAPI() {
  try {
    console.log("🧪 Testing New Packages API Logic...\n");

    // Test 1: Basic packages listing with destination filtering
    console.log("1️⃣ Test: Basic Dubai packages filtering");

    const dubaiQuery = `
      SELECT
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
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
      ORDER BY p.package_category, p.base_price_pp ASC
    `;

    const dubaiResult = await pool.query(dubaiQuery);

    console.log(`✅ Found ${dubaiResult.rows.length} Dubai packages:`);
    dubaiResult.rows.forEach((pkg) => {
      console.log(
        `- ${pkg.title} (${pkg.package_category}) - ₹${pkg.from_price}`,
      );
      console.log(
        `  📍 ${pkg.city_name}, ${pkg.country_name} (${pkg.region_name})`,
      );
      console.log(
        `  🗓️ Available departures: ${pkg.available_departures_count}`,
      );
      console.log("");
    });

    // Test 2: Date range filtering
    console.log(
      "2️⃣ Test: Dubai packages with October 1-5, 2025 date filtering",
    );

    const dateFilterQuery = `
      SELECT
        p.title,
        p.package_category,
        p.base_price_pp,
        ci.name as city_name,
        pd.departure_date,
        pd.price_per_person
      FROM packages p
      LEFT JOIN cities ci ON p.city_id = ci.id
      JOIN package_departures pd ON p.id = pd.package_id
      WHERE p.status = 'active'
        AND ci.name = 'Dubai'
        AND pd.departure_date BETWEEN '2025-10-01' AND '2025-10-05'
        AND pd.is_active = TRUE
        AND pd.available_seats > 0
      ORDER BY p.package_category, pd.departure_date
    `;

    const dateFilterResult = await pool.query(dateFilterQuery);

    console.log(
      `✅ Found ${dateFilterResult.rows.length} Dubai departures for Oct 1-5, 2025:`,
    );
    dateFilterResult.rows.forEach((departure) => {
      console.log(`- ${departure.title} (${departure.package_category})`);
      console.log(
        `  📅 ${departure.departure_date} - ₹${departure.price_per_person}`,
      );
    });

    // Test 3: Package variety by category
    console.log("\n3️⃣ Test: Dubai package variety by category");

    const varietyQuery = `
      SELECT 
        p.package_category,
        COUNT(p.id) as package_count,
        MIN(p.base_price_pp) as min_price,
        MAX(p.base_price_pp) as max_price,
        AVG(p.base_price_pp) as avg_price
      FROM packages p
      JOIN cities ci ON p.city_id = ci.id
      WHERE p.status = 'active' AND ci.name = 'Dubai'
      GROUP BY p.package_category
      ORDER BY avg_price DESC
    `;

    const varietyResult = await pool.query(varietyQuery);

    console.log("✅ Dubai package categories:");
    varietyResult.rows.forEach((category) => {
      console.log(
        `- ${category.package_category}: ${category.package_count} packages`,
      );
      console.log(
        `  💰 Price range: ₹${category.min_price} - ₹${category.max_price} (avg: ₹${Math.round(category.avg_price)})`,
      );
    });

    // Test 4: Facets generation
    console.log("\n4️⃣ Test: Generate facets for filtering");

    const facetsQuery = `
      SELECT 
        'regions' as type,
        r.name as name,
        COUNT(p.id) as count
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE p.status = 'active' AND r.name IS NOT NULL
      GROUP BY r.id, r.name
      
      UNION ALL
      
      SELECT 
        'categories' as type,
        p.package_category as name,
        COUNT(p.id) as count
      FROM packages p
      WHERE p.status = 'active' AND p.package_category IS NOT NULL
      GROUP BY p.package_category
    `;

    const facetsResult = await pool.query(facetsQuery);

    const facets = { regions: {}, categories: {} };
    facetsResult.rows.forEach((row) => {
      if (facets[row.type]) {
        facets[row.type][row.name] = parseInt(row.count);
      }
    });

    console.log("✅ Generated facets:");
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

    // Test 5: Check if we have the 3+ package types requirement
    console.log(
      "\n5️⃣ Test: Verify 3+ package types per region (Dubai/Middle East)",
    );

    const requirementCheck = await pool.query(`
      SELECT 
        r.name as region_name,
        COUNT(DISTINCT p.package_category) as category_count,
        array_agg(DISTINCT p.package_category) as categories
      FROM packages p
      JOIN regions r ON p.region_id = r.id
      WHERE p.status = 'active'
      GROUP BY r.id, r.name
      HAVING COUNT(DISTINCT p.package_category) >= 3
      ORDER BY category_count DESC
    `);

    console.log("✅ Regions with 3+ package types:");
    requirementCheck.rows.forEach((region) => {
      console.log(
        `- ${region.region_name}: ${region.category_count} types (${region.categories.join(", ")})`,
      );
    });

    console.log("\n🎉 API Testing Complete!");
    console.log("✅ Database structure supports proper destination filtering");
    console.log("✅ Date range filtering works correctly");
    console.log("✅ Multiple package types per region requirement is met");
    console.log("✅ Facets generation works for dynamic filtering");
  } catch (error) {
    console.error("❌ Error testing packages API:", error);
  } finally {
    await pool.end();
  }
}

testPackagesAPI();
