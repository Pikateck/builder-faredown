const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
});

async function fixForeignKeyDataTypes() {
  const client = await pool.connect();

  try {
    console.log("🔧 Fixing foreign key data type mismatches...\n");

    await client.query("BEGIN");

    // STEP 1: Change packages table foreign key columns from integer to UUID
    console.log("📝 Step 1: Updating packages table foreign key data types...");

    // Drop any existing foreign key constraints first (if they exist)
    try {
      await client.query(
        "ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_region_id_fkey",
      );
      await client.query(
        "ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_country_id_fkey",
      );
      await client.query(
        "ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_city_id_fkey",
      );
      console.log("✅ Dropped existing foreign key constraints");
    } catch (err) {
      console.log("ℹ️ No existing foreign key constraints to drop");
    }

    // Change data types to UUID
    await client.query(
      "ALTER TABLE packages ALTER COLUMN region_id TYPE UUID USING NULL",
    );
    await client.query(
      "ALTER TABLE packages ALTER COLUMN country_id TYPE UUID USING NULL",
    );
    await client.query(
      "ALTER TABLE packages ALTER COLUMN city_id TYPE UUID USING NULL",
    );

    console.log("✅ Changed foreign key columns to UUID type");

    // STEP 2: Now update packages with proper destination linkage using UUIDs
    console.log("\n📍 Step 2: Linking packages to destinations using UUIDs...");

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

    // Update Egypt packages
    const egyptUpdate = await client.query(`
      UPDATE packages 
      SET 
        country_id = (SELECT id FROM countries WHERE name = 'Egypt' LIMIT 1),
        region_id = (SELECT id FROM regions WHERE name = 'Africa' LIMIT 1)
      WHERE LOWER(title) LIKE '%egypt%'
    `);
    console.log(`✅ Updated ${egyptUpdate.rowCount} Egypt packages`);

    // STEP 3: Add proper foreign key constraints
    console.log("\n🔗 Step 3: Adding foreign key constraints...");

    await client.query(`
      ALTER TABLE packages 
      ADD CONSTRAINT packages_region_id_fkey 
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
    `);

    await client.query(`
      ALTER TABLE packages 
      ADD CONSTRAINT packages_country_id_fkey 
      FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL
    `);

    await client.query(`
      ALTER TABLE packages 
      ADD CONSTRAINT packages_city_id_fkey 
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL
    `);

    console.log("✅ Added foreign key constraints");

    // STEP 4: Add package_category column and set categories
    console.log("\n📂 Step 4: Setting up package categories...");

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

    // STEP 5: Create additional regional packages for better distribution
    console.log("\n🌍 Step 5: Creating additional regional packages...");

    // Get Middle East region ID
    const middleEastRegion = await client.query(
      "SELECT id FROM regions WHERE name = $1",
      ["Middle East"],
    );
    const dubaiCity = await client.query(
      "SELECT id FROM cities WHERE name = $1",
      ["Dubai"],
    );
    const uaeCountry = await client.query(
      "SELECT id FROM countries WHERE name = $1",
      ["United Arab Emirates"],
    );

    if (middleEastRegion.rows.length > 0 && dubaiCity.rows.length > 0) {
      const regionId = middleEastRegion.rows[0].id;
      const cityId = dubaiCity.rows[0].id;
      const countryId =
        uaeCountry.rows.length > 0 ? uaeCountry.rows[0].id : null;

      // Check how many Dubai packages exist per category
      const dubaiPackages = await client.query(
        `
        SELECT package_category, COUNT(*) as count
        FROM packages 
        WHERE city_id = $1 AND status = 'active'
        GROUP BY package_category
      `,
        [cityId],
      );

      console.log("Current Dubai packages by category:");
      dubaiPackages.rows.forEach((row) => {
        console.log(`- ${row.package_category}: ${row.count}`);
      });

      // Ensure we have luxury, standard, and budget packages for Dubai
      const requiredCategories = ["luxury", "standard", "budget"];
      const existingCategories = dubaiPackages.rows.map(
        (row) => row.package_category,
      );

      for (const category of requiredCategories) {
        if (!existingCategories.includes(category)) {
          const basePrice =
            category === "luxury"
              ? 179998
              : category === "standard"
                ? 89999
                : 49999;
          const duration =
            category === "luxury" ? 7 : category === "standard" ? 5 : 4;

          await client.query(
            `
            INSERT INTO packages (
              slug, title, region_id, country_id, city_id,
              duration_days, duration_nights, overview, description,
              base_price_pp, currency, category, package_category,
              status, is_featured, inclusions, exclusions,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
            )
          `,
            [
              `dubai-${category}-experience`,
              `Dubai ${category.charAt(0).toUpperCase() + category.slice(1)} Experience`,
              regionId,
              countryId,
              cityId,
              duration,
              duration - 1,
              `Experience the best of Dubai with our ${category} package.`,
              `A carefully curated ${category} Dubai experience showcasing the city's highlights.`,
              basePrice,
              "INR",
              category,
              category,
              "active",
              category === "luxury",
              JSON.stringify(
                category === "luxury"
                  ? [
                      "5-star hotel accommodation",
                      "Private airport transfers",
                      "Personal guide",
                      "Premium experiences",
                      "Burj Khalifa At The Top",
                    ]
                  : category === "standard"
                    ? [
                        "4-star hotel accommodation",
                        "Group transfers",
                        "Guided tours",
                        "Dubai Mall visits",
                        "Desert safari",
                      ]
                    : [
                        "3-star hotel accommodation",
                        "Shared transfers",
                        "Basic sightseeing",
                        "Dubai Marina walk",
                        "Local experiences",
                      ],
              ),
              JSON.stringify([
                "International flights",
                "Personal expenses",
                "Travel insurance",
                "Optional activities",
                "Meals not specified",
              ]),
            ],
          );

          console.log(`✅ Created ${category} package for Dubai`);
        }
      }
    }

    // STEP 6: Create departures for all packages
    console.log("\n📅 Step 6: Creating departures for packages...");

    const packagesWithoutDepartures = await client.query(`
      SELECT p.id, p.title, p.duration_days, p.base_price_pp
      FROM packages p
      LEFT JOIN package_departures pd ON p.id = pd.package_id 
        AND pd.departure_date >= CURRENT_DATE
      WHERE p.status = 'active' AND pd.id IS NULL
    `);

    const departureDates = [
      "2025-10-01",
      "2025-10-03",
      "2025-10-05",
      "2025-10-08",
      "2025-10-15",
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
            Math.round(pkg.base_price_pp * 0.8),
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

    // STEP 7: Create optimized view
    console.log("\n👁️ Step 7: Creating optimized view...");

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

    console.log("✅ Created optimized view");

    await client.query("COMMIT");

    // Verification
    console.log("\n🔍 Verification Results:");

    const verification = await client.query(`
      SELECT 
        p.title,
        p.package_category,
        ci.name as city_name,
        c.name as country_name,
        r.name as region_name,
        COUNT(pd.id) as departure_count
      FROM packages p
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN package_departures pd ON p.id = pd.package_id 
          AND pd.departure_date BETWEEN '2025-10-01' AND '2025-10-05'
          AND pd.is_active = TRUE
      WHERE p.status = 'active' AND ci.name = 'Dubai'
      GROUP BY p.id, p.title, p.package_category, ci.name, c.name, r.name
      ORDER BY p.package_category
    `);

    console.log("\n✅ Dubai Packages for October 1-5, 2025:");
    verification.rows.forEach((row) => {
      console.log(`- ${row.title} (${row.package_category})`);
      console.log(
        `  Location: ${row.city_name}, ${row.country_name} (${row.region_name})`,
      );
      console.log(`  Departures: ${row.departure_count}`);
      console.log("");
    });

    console.log("🎉 Foreign key data type fix completed successfully!");
    console.log(
      "🎯 Now Dubai packages should filter correctly by destination and date!",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error fixing foreign key data types:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixForeignKeyDataTypes().catch(console.error);
