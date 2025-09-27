const { Pool } = require("pg");

// Database connection - Configure SSL properly for production databases
const dbUrl = process.env.DATABASE_URL;
const sslConfig =
  dbUrl && (dbUrl.includes("render.com") || dbUrl.includes("postgres://"))
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function addMorePackages() {
  try {
    console.log("🚀 Adding more packages to achieve 3 packages per region...");

    // Check current packages
    const currentQuery = `
      SELECT id, title, base_price_pp, category
      FROM packages 
      WHERE status = 'active'
      ORDER BY title
    `;

    const currentResult = await pool.query(currentQuery);
    console.log("\n📦 Current packages:");
    currentResult.rows.forEach((pkg, index) => {
      console.log(
        `  ${index + 1}. ${pkg.title} - ${pkg.base_price_pp} INR - ${pkg.category}`,
      );
    });

    // Add one more Dubai package (3rd Dubai package)
    const dubaiPackage = `
      INSERT INTO packages (
        slug, title, duration_days, duration_nights, overview,
        base_price_pp, currency, category, status, is_featured,
        rating, review_count, created_at, updated_at
      ) VALUES (
        'dubai-adventure-weekender-3-days',
        'Dubai Adventure Weekender',
        3,
        2, 
        'Action-packed 3-day Dubai adventure with skydiving, dune bashing, and water sports for thrill seekers.',
        '89998.00',
        'INR',
        'adventure',
        'active',
        false,
        4.5,
        12,
        NOW(),
        NOW()
      )
    `;

    // Add 2 more Europe packages (currently has 1)
    const europePackage1 = `
      INSERT INTO packages (
        slug, title, duration_days, duration_nights, overview,
        base_price_pp, currency, category, status, is_featured,
        rating, review_count, created_at, updated_at
      ) VALUES (
        'paris-romantic-getaway-5-days',
        'Paris Romantic Getaway',
        5,
        4, 
        'Romantic escape to Paris with Eiffel Tower visits, Seine cruises, and charming bistro experiences.',
        '135000.00',
        'INR',
        'honeymoon',
        'active',
        true,
        4.8,
        24,
        NOW(),
        NOW()
      )
    `;

    const europePackage2 = `
      INSERT INTO packages (
        slug, title, duration_days, duration_nights, overview,
        base_price_pp, currency, category, status, is_featured,
        rating, review_count, created_at, updated_at
      ) VALUES (
        'swiss-alps-adventure-6-days',
        'Swiss Alps Adventure',
        6,
        5, 
        'Breathtaking Swiss mountain adventure with skiing, scenic train rides, and Alpine village experiences.',
        '195000.00',
        'INR',
        'adventure',
        'active',
        false,
        4.7,
        18,
        NOW(),
        NOW()
      )
    `;

    // Add 2 more Southeast Asia packages (to go with potential Bali/similar)
    const seAsiaPackage1 = `
      INSERT INTO packages (
        slug, title, duration_days, duration_nights, overview,
        base_price_pp, currency, category, status, is_featured,
        rating, review_count, created_at, updated_at
      ) VALUES (
        'bali-family-adventure-7-days',
        'Bali Family Adventure',
        7,
        6, 
        'Family-friendly Bali adventure with kid-friendly resorts and monkey forest visits.',
        '109998.00',
        'INR',
        'family',
        'active',
        true,
        4.6,
        35,
        NOW(),
        NOW()
      )
    `;

    const seAsiaPackage2 = `
      INSERT INTO packages (
        slug, title, duration_days, duration_nights, overview,
        base_price_pp, currency, category, status, is_featured,
        rating, review_count, created_at, updated_at
      ) VALUES (
        'thailand-beach-bliss-8-days',
        'Thailand Beach Bliss',
        8,
        7, 
        'Tropical Thailand escape with pristine beaches, island hopping, and traditional Thai experiences.',
        '125000.00',
        'INR',
        'beach',
        'active',
        false,
        4.4,
        28,
        NOW(),
        NOW()
      )
    `;

    // Add 1 more South India package (to go with existing Kerala-style package)
    const southIndiaPackage1 = `
      INSERT INTO packages (
        slug, title, duration_days, duration_nights, overview,
        base_price_pp, currency, category, status, is_featured,
        rating, review_count, created_at, updated_at
      ) VALUES (
        'kerala-backwaters-culture-6-days',
        'Kerala Backwaters & Culture',
        6,
        5, 
        'Peaceful stay in mountain lodges with Ayurvedic treatments and backwater cruises.',
        '87998.00',
        'INR',
        'cultural',
        'active',
        false,
        4.3,
        22,
        NOW(),
        NOW()
      )
    `;

    const southIndiaPackage2 = `
      INSERT INTO packages (
        slug, title, duration_days, duration_nights, overview,
        base_price_pp, currency, category, status, is_featured,
        rating, review_count, created_at, updated_at
      ) VALUES (
        'goa-beach-paradise-5-days',
        'Goa Beach Paradise',
        5,
        4, 
        'Relaxing Goa beach vacation with water sports, beach clubs, and Portuguese heritage tours.',
        '65000.00',
        'INR',
        'beach',
        'active',
        true,
        4.2,
        41,
        NOW(),
        NOW()
      )
    `;

    // Add 1 more Maldives-style package
    const maldivesPackage = `
      INSERT INTO packages (
        slug, title, duration_days, duration_nights, overview,
        base_price_pp, currency, category, status, is_featured,
        rating, review_count, created_at, updated_at
      ) VALUES (
        'maldives-beach-paradise-6-days',
        'Maldives Beach Paradise',
        6,
        5, 
        'Overwater villa accommodation with snorkeling and diving.',
        '250000.00',
        'INR',
        'luxury',
        'active',
        true,
        4.9,
        15,
        NOW(),
        NOW()
      )
    `;

    // Add 1 more Himalayan package (to go with existing mountain packages)
    const himalayanPackage = `
      INSERT INTO packages (
        slug, title, duration_days, duration_nights, overview,
        base_price_pp, currency, category, status, is_featured,
        rating, review_count, created_at, updated_at
      ) VALUES (
        'himachal-adventure-trek-7-days',
        'Himachal Adventure Trek',
        7,
        6, 
        'Guided mountain trekking with stays in mountain lodges and scenic valley walks.',
        '71998.00',
        'INR',
        'adventure',
        'active',
        false,
        4.1,
        19,
        NOW(),
        NOW()
      )
    `;

    // Execute all insertions
    const insertQueries = [
      dubaiPackage,
      europePackage1,
      europePackage2,
      seAsiaPackage1,
      seAsiaPackage2,
      southIndiaPackage1,
      southIndiaPackage2,
      maldivesPackage,
      himalayanPackage,
    ];

    console.log("\n🔨 Adding new packages...");

    for (const query of insertQueries) {
      await pool.query(query);
    }

    console.log("✅ Successfully added 9 new packages!");

    // Check final count
    const finalQuery = `
      SELECT COUNT(*) as total, 
             string_agg(title, ', ' ORDER BY title) as all_titles
      FROM packages 
      WHERE status = 'active'
    `;

    const finalResult = await pool.query(finalQuery);
    console.log("\n📊 Final package count:", finalResult.rows[0].total);
    console.log("📝 All packages:", finalResult.rows[0].all_titles);

    await pool.end();
  } catch (error) {
    console.error("❌ Error adding packages:", error);
    await pool.end();
  }
}

addMorePackages();
