/**
 * Script to add Dubai packages to the database
 */

const { Pool } = require("pg");

// Configure SSL properly for production
const dbUrl = process.env.DATABASE_URL;
const sslConfig = dbUrl && (dbUrl.includes('render.com') || dbUrl.includes('postgres://'))
  ? { rejectUnauthorized: false }
  : false;

console.log('Database URL configured:', !!dbUrl);
console.log('SSL config:', sslConfig);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function addDubaiPackages() {
  try {
    console.log('Adding Dubai packages to database...');

    // First, let's check what tables exist
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('countries', 'cities', 'regions', 'packages')
    `);
    console.log('Available tables:', tablesResult.rows);

    // Check countries table structure
    const countriesStructure = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'countries'
    `);
    console.log('Countries table structure:', countriesStructure.rows);

    // Check if UAE exists
    const uaeResult = await pool.query(`SELECT * FROM countries WHERE name LIKE '%Arab%' OR name LIKE '%UAE%'`);
    console.log('UAE/Arab countries:', uaeResult.rows);

    // Check if Dubai city exists
    const dubaiResult = await pool.query(`SELECT * FROM cities WHERE name LIKE '%Dubai%'`);
    console.log('Dubai cities:', dubaiResult.rows);

    // Check if Middle East region exists
    const regionResult = await pool.query(`SELECT * FROM regions WHERE name LIKE '%Middle%'`);
    console.log('Middle East regions:', regionResult.rows);

    // Add Dubai City Explorer package
    await pool.query(`
      INSERT INTO packages (
        slug, title, region_id, country_id, city_id, duration_days, duration_nights,
        overview, base_price_pp, currency, category, status, is_featured,
        inclusions, exclusions, highlights
      ) VALUES (
        'dubai-city-explorer-4-days',
        'Dubai City Explorer',
        (SELECT id FROM regions WHERE name = 'Middle East'),
        (SELECT id FROM countries WHERE iso_code = 'AE'),
        (SELECT id FROM cities WHERE name = 'Dubai'),
        4, 3,
        'Discover the best of Dubai in 4 days with modern attractions and traditional culture.',
        85000, 'INR',
        'cultural',
        'active',
        FALSE,
        '["Return airfare from Mumbai/Delhi", "3 nights 4-star hotel accommodation", "Daily breakfast", "Airport transfers", "Half-day city tour", "Dubai Marina walk", "Local guide"]',
        '["Lunch and dinner meals", "Visa fees", "Personal expenses", "Optional tours", "Tips and gratuities", "Travel insurance"]',
        '["Explore Old Dubai heritage sites", "Visit Dubai Museum", "Walk through spice and gold souks", "Modern Dubai Marina area", "Traditional Arabic culture", "Stunning skyline views"]'
      )
      ON CONFLICT (slug) DO NOTHING
    `);

    // Add departures for Dubai Luxury Experience
    await pool.query(`
      INSERT INTO package_departures (
        package_id, departure_city_code, departure_city_name, departure_date, return_date,
        total_seats, price_per_person, currency, is_guaranteed
      ) VALUES 
      (
        (SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'),
        'BOM', 'Mumbai', '2025-10-01', '2025-10-05',
        25, 179998, 'INR', TRUE
      ),
      (
        (SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'),
        'DEL', 'Delhi', '2025-10-01', '2025-10-05',
        30, 185000, 'INR', TRUE
      ),
      (
        (SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'),
        'BLR', 'Bangalore', '2025-10-02', '2025-10-06',
        20, 175000, 'INR', FALSE
      )
      ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING
    `);

    // Add departures for Dubai City Explorer
    await pool.query(`
      INSERT INTO package_departures (
        package_id, departure_city_code, departure_city_name, departure_date, return_date,
        total_seats, price_per_person, currency, is_guaranteed
      ) VALUES 
      (
        (SELECT id FROM packages WHERE slug = 'dubai-city-explorer-4-days'),
        'BOM', 'Mumbai', '2025-10-01', '2025-10-04',
        30, 109998, 'INR', TRUE
      ),
      (
        (SELECT id FROM packages WHERE slug = 'dubai-city-explorer-4-days'),
        'DEL', 'Delhi', '2025-10-02', '2025-10-05',
        25, 115000, 'INR', TRUE
      ),
      (
        (SELECT id FROM packages WHERE slug = 'dubai-city-explorer-4-days'),
        'COK', 'Kochi', '2025-10-03', '2025-10-06',
        15, 120000, 'INR', FALSE
      )
      ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING
    `);

    console.log('✅ Successfully added Dubai packages to database');
    
    // Verify the packages were added
    const result = await pool.query(`
      SELECT p.title, ci.name as city_name, c.name as country_name 
      FROM packages p
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE LOWER(ci.name) = 'dubai'
    `);
    
    console.log('📦 Dubai packages in database:', result.rows);
    
  } catch (error) {
    console.error('❌ Error adding Dubai packages:', error);
  } finally {
    await pool.end();
  }
}

addDubaiPackages();
