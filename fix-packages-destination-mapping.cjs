const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
});

async function fixPackagesDestinationMapping() {
  const client = await pool.connect();

  try {
    console.log("🔧 Starting package destination mapping fix...\n");

    await client.query("BEGIN");

    // STEP 1: Update existing packages with proper destination linkage
    console.log(
      "📍 Step 1: Updating existing packages with destination linkage...",
    );

    // Update Dubai packages
    const dubaiUpdate = await client.query(`
      UPDATE packages 
      SET 
        city_id = (SELECT id FROM cities WHERE name = 'Dubai' LIMIT 1),
        country_id = (SELECT id FROM countries WHERE name = 'United Arab Emirates' LIMIT 1),
        region_id = (SELECT id FROM regions WHERE name = 'Middle East' LIMIT 1)
      WHERE LOWER(title) LIKE '%dubai%'
    `);
    console.log(`✅ Updated ${dubaiUpdate.rowCount} Dubai packages`);

    // Update India packages
    const indiaUpdate = await client.query(`
      UPDATE packages 
      SET 
        country_id = (SELECT id FROM countries WHERE name = 'India' LIMIT 1),
        region_id = (SELECT id FROM regions WHERE name = 'North India' LIMIT 1)
      WHERE LOWER(title) LIKE '%north india%' OR LOWER(title) LIKE '%golden triangle%'
    `);
    console.log(`✅ Updated ${indiaUpdate.rowCount} India packages`);

    // Update Europe packages
    const europeUpdate = await client.query(`
      UPDATE packages 
      SET 
        region_id = (SELECT id FROM regions WHERE name = 'Europe' LIMIT 1)
      WHERE LOWER(title) LIKE '%europe%' OR LOWER(title) LIKE '%european%'
    `);
    console.log(`✅ Updated ${europeUpdate.rowCount} Europe packages`);

    // STEP 2: Add package category column if not exists
    console.log("\n📂 Step 2: Setting up package categories...");

    try {
      await client.query(
        "ALTER TABLE packages ADD COLUMN IF NOT EXISTS package_category VARCHAR(50)",
      );
      console.log("✅ Added package_category column");
    } catch (err) {
      console.log("ℹ️ package_category column already exists");
    }

    // Update existing packages with categories
    await client.query(
      `UPDATE packages SET package_category = 'luxury' WHERE LOWER(title) LIKE '%luxury%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'explorer' WHERE LOWER(title) LIKE '%explorer%' OR LOWER(title) LIKE '%city%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'cultural' WHERE LOWER(title) LIKE '%highlights%' OR LOWER(title) LIKE '%triangle%' OR LOWER(title) LIKE '%essentials%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'standard' WHERE package_category IS NULL`,
    );

    console.log("✅ Updated package categories");

    // STEP 3: Create regional packages to ensure 3 types per region
    console.log("\n🌍 Step 3: Ensuring 3 package types per major region...");

    const majorRegions = [
      { name: "Middle East", city_name: "Dubai" },
      { name: "Europe", city_name: null },
      { name: "Asia", city_name: null },
      { name: "North India", city_name: null },
    ];

    const packageTypes = ["luxury", "standard", "budget"];

    for (const region of majorRegions) {
      const regionResult = await client.query(
        "SELECT id FROM regions WHERE name = $1",
        [region.name],
      );
      if (regionResult.rows.length === 0) continue;

      const regionId = regionResult.rows[0].id;

      for (const packageType of packageTypes) {
        // Check if package type exists for this region
        const existing = await client.query(
          `
          SELECT COUNT(*) as count
          FROM packages 
          WHERE region_id = $1 AND package_category = $2 AND status = 'active'
        `,
          [regionId, packageType],
        );

        if (existing.rows[0].count === "0") {
          // Create missing package type
          const basePrice =
            packageType === "luxury"
              ? 125000
              : packageType === "standard"
                ? 75000
                : 45000;
          const duration =
            packageType === "luxury" ? 7 : packageType === "standard" ? 5 : 4;

          // Get city_id if specified
          let cityId = null;
          if (region.city_name) {
            const cityResult = await client.query(
              "SELECT id FROM cities WHERE name = $1",
              [region.city_name],
            );
            if (cityResult.rows.length > 0) {
              cityId = cityResult.rows[0].id;
            }
          }

          // Get country_id based on region
          let countryId = null;
          if (region.name === "Middle East") {
            const countryResult = await client.query(
              "SELECT id FROM countries WHERE name = $1",
              ["United Arab Emirates"],
            );
            if (countryResult.rows.length > 0) {
              countryId = countryResult.rows[0].id;
            }
          }

          await client.query(
            `
            INSERT INTO packages (
              slug, title, region_id, country_id, city_id,
              duration_days, duration_nights, overview, description,
              base_price_pp, currency, category, package_category,
              status, is_featured, inclusions, exclusions,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9,
              $10, $11, $12, $13,
              $14, $15, $16, $17,
              NOW(), NOW()
            )
          `,
            [
              `${region.name.toLowerCase().replace(/ /g, "-")}-${packageType}-package`,
              `${region.name} ${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package`,
              regionId,
              countryId,
              cityId,
              duration,
              duration - 1,
              `Experience the best of ${region.name} with our ${packageType} package.`,
              `A carefully curated ${packageType} travel experience showcasing the highlights of ${region.name}.`,
              basePrice,
              "INR",
              packageType,
              packageType,
              "active",
              packageType === "luxury",
              JSON.stringify(
                packageType === "luxury"
                  ? [
                      "5-star accommodation",
                      "Private transfers",
                      "Personal guide",
                      "Premium experiences",
                    ]
                  : packageType === "standard"
                    ? [
                        "3-star accommodation",
                        "Group transfers",
                        "Guided tours",
                        "Cultural experiences",
                      ]
                    : [
                        "Budget accommodation",
                        "Local transport",
                        "Basic sightseeing",
                        "Authentic experiences",
                      ],
              ),
              JSON.stringify([
                "International flights",
                "Personal expenses",
                "Travel insurance",
                "Optional activities",
              ]),
            ],
          );

          console.log(`✅ Created ${packageType} package for ${region.name}`);
        }
      }
    }

    // STEP 4: Create departures for packages that don't have them
    console.log("\n📅 Step 4: Creating departures for packages...");

    const packagesWithoutDepartures = await client.query(`
      SELECT p.id, p.title, p.duration_days, p.base_price_pp
      FROM packages p
      LEFT JOIN package_departures pd ON p.id = pd.package_id 
        AND pd.departure_date >= CURRENT_DATE
      WHERE p.status = 'active' AND pd.id IS NULL
    `);

    const departureDates = [
      "2025-10-01",
      "2025-10-08",
      "2025-10-15",
      "2025-10-22",
      "2025-10-29",
    ];

    for (const pkg of packagesWithoutDepartures.rows) {
      for (const depDate of departureDates) {
        const returnDate = new Date(depDate);
        returnDate.setDate(returnDate.getDate() + pkg.duration_days);

        await client.query(
          `
          INSERT INTO package_departures (
            package_id, departure_city_code, departure_city_name,
            departure_date, return_date, total_seats, booked_seats,
            price_per_person, single_supplement, child_price, infant_price,
            currency, early_bird_discount, early_bird_deadline,
            is_active, is_guaranteed, special_notes,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
          )
        `,
          [
            pkg.id,
            "BOM",
            "Mumbai",
            depDate,
            returnDate.toISOString().split("T")[0],
            20,
            0,
            pkg.base_price_pp,
            5000,
            pkg.base_price_pp * 0.8,
            0,
            "INR",
            10,
            new Date(new Date(depDate).getTime() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            true,
            true,
            "Guaranteed departure with minimum 2 passengers",
          ],
        );
      }
      console.log(`✅ Created departures for: ${pkg.title}`);
    }

    // STEP 5: Create indexes for efficient filtering
    console.log("\n🗂️ Step 5: Creating optimization indexes...");

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_packages_destination_status 
        ON packages(region_id, country_id, city_id, status)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_packages_category_region 
        ON packages(package_category, region_id, status)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_departures_date_city_available 
        ON package_departures(departure_date, departure_city_code, is_active)
      `);

      console.log("✅ Created optimization indexes");
    } catch (err) {
      console.log("ℹ️ Indexes may already exist");
    }

    // STEP 6: Create views for efficient queries
    console.log("\n👁️ Step 6: Creating database views...");

    await client.query(`
      CREATE OR REPLACE VIEW v_packages_with_destinations AS
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
          (
              SELECT MIN(pd.price_per_person)
              FROM package_departures pd 
              WHERE pd.package_id = p.id 
                AND pd.is_active = TRUE 
                AND pd.departure_date >= CURRENT_DATE
                AND pd.available_seats > 0
          ) as from_price,
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
    `);

    console.log("✅ Created v_packages_with_destinations view");

    await client.query("COMMIT");

    // Verification
    console.log("\n🔍 Verification Results:");

    const verification = await client.query(`
      SELECT 
        r.name as region_name,
        COUNT(p.id) as total_packages,
        COUNT(CASE WHEN p.package_category = 'luxury' THEN 1 END) as luxury_count,
        COUNT(CASE WHEN p.package_category = 'standard' THEN 1 END) as standard_count,
        COUNT(CASE WHEN p.package_category = 'budget' THEN 1 END) as budget_count
      FROM regions r
      LEFT JOIN packages p ON r.id = p.region_id AND p.status = 'active'
      WHERE r.name IN ('Middle East', 'Europe', 'Asia', 'North India')
      GROUP BY r.id, r.name
      ORDER BY total_packages DESC
    `);

    console.log("\nRegional Package Distribution:");
    verification.rows.forEach((row) => {
      console.log(
        `${row.region_name}: ${row.total_packages} total (${row.luxury_count} luxury, ${row.standard_count} standard, ${row.budget_count} budget)`,
      );
    });

    // Check Dubai packages specifically
    const dubaiPackages = await client.query(`
      SELECT 
        p.title,
        p.package_category,
        ci.name as city_name,
        COUNT(pd.id) as departure_count
      FROM packages p
      JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN package_departures pd ON p.id = pd.package_id 
          AND pd.departure_date BETWEEN '2025-10-01' AND '2025-10-05'
          AND pd.is_active = TRUE
      WHERE ci.name = 'Dubai'
      GROUP BY p.id, p.title, p.package_category, ci.name
    `);

    console.log("\nDubai Packages Ready for October 1-5, 2025:");
    dubaiPackages.rows.forEach((row) => {
      console.log(
        `- ${row.title} (${row.package_category}) - ${row.departure_count} departures`,
      );
    });

    console.log("\n✅ Package destination mapping fix completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error fixing package destination mapping:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixPackagesDestinationMapping().catch(console.error);
