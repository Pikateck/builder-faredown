const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
});

async function finalSchemaFix() {
  const client = await pool.connect();

  try {
    console.log("🔧 Final schema fix - aligning data types...\n");

    await client.query("BEGIN");

    // Option 1: Change packages foreign keys to UUID (recommended since destinations are UUID)
    console.log("📝 Step 1: Converting packages foreign keys to UUID...");

    // First, set all foreign keys to NULL to avoid constraint issues
    await client.query(
      "UPDATE packages SET region_id = NULL, country_id = NULL, city_id = NULL",
    );

    // Drop existing constraints if any
    await client.query(
      "ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_region_id_fkey",
    );
    await client.query(
      "ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_country_id_fkey",
    );
    await client.query(
      "ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_city_id_fkey",
    );

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

    console.log("✅ Converted foreign keys to UUID");

    // Step 2: Now properly link packages to destinations
    console.log("\n📍 Step 2: Linking packages to destinations...");

    // Get Dubai city UUID
    const dubaiCity = await client.query(
      "SELECT id FROM cities WHERE name = $1",
      ["Dubai"],
    );
    const uaeCountry = await client.query(
      "SELECT id FROM countries WHERE name = $1",
      ["United Arab Emirates"],
    );
    const middleEastRegion = await client.query(
      "SELECT id FROM regions WHERE name = $1",
      ["Middle East"],
    );

    if (
      dubaiCity.rows.length > 0 &&
      uaeCountry.rows.length > 0 &&
      middleEastRegion.rows.length > 0
    ) {
      const dubaiCityId = dubaiCity.rows[0].id;
      const uaeCountryId = uaeCountry.rows[0].id;
      const middleEastRegionId = middleEastRegion.rows[0].id;

      // Update Dubai packages
      const dubaiUpdate = await client.query(
        `
        UPDATE packages 
        SET 
          city_id = $1,
          country_id = $2,
          region_id = $3
        WHERE LOWER(title) LIKE '%dubai%'
      `,
        [dubaiCityId, uaeCountryId, middleEastRegionId],
      );

      console.log(`✅ Updated ${dubaiUpdate.rowCount} Dubai packages`);
    }

    // Update other packages with regions only (since we may not have all cities)
    const europeRegion = await client.query(
      "SELECT id FROM regions WHERE name = $1",
      ["Europe"],
    );
    if (europeRegion.rows.length > 0) {
      const europeUpdate = await client.query(
        `
        UPDATE packages 
        SET region_id = $1
        WHERE LOWER(title) LIKE '%europe%' OR LOWER(title) LIKE '%paris%' OR LOWER(title) LIKE '%swiss%'
      `,
        [europeRegion.rows[0].id],
      );
      console.log(`✅ Updated ${europeUpdate.rowCount} Europe packages`);
    }

    const asiaRegion = await client.query(
      "SELECT id FROM regions WHERE name = $1",
      ["Asia"],
    );
    if (asiaRegion.rows.length > 0) {
      const asiaUpdate = await client.query(
        `
        UPDATE packages 
        SET region_id = $1
        WHERE LOWER(title) LIKE '%bali%' OR LOWER(title) LIKE '%thailand%' OR LOWER(title) LIKE '%maldives%'
      `,
        [asiaRegion.rows[0].id],
      );
      console.log(`✅ Updated ${asiaUpdate.rowCount} Asia packages`);
    }

    const indiaRegion = await client.query(
      "SELECT id FROM regions WHERE name = $1",
      ["India"],
    );
    if (indiaRegion.rows.length > 0) {
      const indiaUpdate = await client.query(
        `
        UPDATE packages 
        SET region_id = $1
        WHERE LOWER(title) LIKE '%india%' OR LOWER(title) LIKE '%kerala%' OR LOWER(title) LIKE '%goa%' OR LOWER(title) LIKE '%himachal%'
      `,
        [indiaRegion.rows[0].id],
      );
      console.log(`✅ Updated ${indiaUpdate.rowCount} India packages`);
    }

    // Add package_category if not exists
    try {
      await client.query(
        "ALTER TABLE packages ADD COLUMN IF NOT EXISTS package_category VARCHAR(50)",
      );
    } catch (err) {
      // Column already exists
    }

    // Set package categories
    await client.query(
      `UPDATE packages SET package_category = 'luxury' WHERE LOWER(title) LIKE '%luxury%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'explorer' WHERE LOWER(title) LIKE '%explorer%' OR LOWER(title) LIKE '%city%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'adventure' WHERE LOWER(title) LIKE '%adventure%' OR LOWER(title) LIKE '%trek%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'cultural' WHERE LOWER(title) LIKE '%highlights%' OR LOWER(title) LIKE '%triangle%' OR LOWER(title) LIKE '%essentials%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'beach' WHERE LOWER(title) LIKE '%beach%' OR LOWER(title) LIKE '%paradise%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'romantic' WHERE LOWER(title) LIKE '%romantic%' OR LOWER(title) LIKE '%getaway%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'family' WHERE LOWER(title) LIKE '%family%'`,
    );
    await client.query(
      `UPDATE packages SET package_category = 'standard' WHERE package_category IS NULL`,
    );

    console.log("✅ Updated package categories");

    // Step 3: Add foreign key constraints
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

    // Step 4: Ensure we have varied Dubai packages
    console.log("\n🏙️ Step 4: Ensuring Dubai package variety...");

    if (dubaiCity.rows.length > 0) {
      const dubaiCityId = dubaiCity.rows[0].id;
      const uaeCountryId = uaeCountry.rows[0].id;
      const middleEastRegionId = middleEastRegion.rows[0].id;

      // Check existing Dubai packages
      const existingDubai = await client.query(
        `
        SELECT package_category, COUNT(*) as count
        FROM packages 
        WHERE city_id = $1 AND status = 'active'
        GROUP BY package_category
      `,
        [dubaiCityId],
      );

      const existingCategories = existingDubai.rows.map(
        (row) => row.package_category,
      );
      console.log("Existing Dubai categories:", existingCategories);

      // Ensure we have luxury, standard, and budget packages
      const requiredCategories = [
        { category: "luxury", price: 179998, title: "Dubai Luxury Experience" },
        { category: "standard", price: 89999, title: "Dubai Standard Package" },
        { category: "budget", price: 49999, title: "Dubai Budget Explorer" },
      ];

      for (const req of requiredCategories) {
        if (!existingCategories.includes(req.category)) {
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
              `dubai-${req.category}-2025`,
              req.title,
              middleEastRegionId,
              uaeCountryId,
              dubaiCityId,
              req.category === "luxury"
                ? 7
                : req.category === "standard"
                  ? 5
                  : 4,
              req.category === "luxury"
                ? 6
                : req.category === "standard"
                  ? 4
                  : 3,
              `Experience Dubai with our ${req.category} package`,
              `A ${req.category} travel experience in Dubai`,
              req.price,
              "INR",
              req.category,
              req.category,
              "active",
              req.category === "luxury",
              JSON.stringify([
                req.category === "luxury"
                  ? "5-star accommodation"
                  : req.category === "standard"
                    ? "4-star accommodation"
                    : "3-star accommodation",
                "Airport transfers",
                "City tour",
                "Desert safari",
              ]),
              JSON.stringify(["International flights", "Personal expenses"]),
            ],
          );

          console.log(`✅ Created ${req.category} package for Dubai`);
        }
      }
    }

    await client.query("COMMIT");

    // Verification
    console.log("\n🔍 Final Verification:");

    const dubaiPackages = await client.query(`
      SELECT 
        p.title,
        p.package_category,
        p.base_price_pp,
        ci.name as city_name,
        c.name as country_name,
        r.name as region_name
      FROM packages p
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE ci.name = 'Dubai' AND p.status = 'active'
      ORDER BY p.base_price_pp DESC
    `);

    console.log("\n✅ Dubai Packages Ready:");
    dubaiPackages.rows.forEach((row) => {
      console.log(
        `- ${row.title} (${row.package_category}) - ₹${row.base_price_pp}`,
      );
      console.log(
        `  📍 ${row.city_name}, ${row.country_name} (${row.region_name})`,
      );
    });

    console.log("\n🎉 Schema fix completed successfully!");
    console.log("✅ Dubai packages now have proper destination mapping");
    console.log("✅ Foreign key relationships are properly established");
    console.log("✅ Package categories are set");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error in final schema fix:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

finalSchemaFix().catch(console.error);
