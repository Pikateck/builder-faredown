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

    // If everything looks good, let's try to add a simple Dubai package
    if (dubaiResult.rows.length > 0 && uaeResult.rows.length > 0) {
      console.log('✅ Required data exists, attempting to add Dubai package...');

      const dubaiCity = dubaiResult.rows[0];
      const uaeCountry = uaeResult.rows[0];

      await pool.query(`
        INSERT INTO packages (
          slug, title, country_id, city_id, duration_days, duration_nights,
          overview, base_price_pp, currency, category, status
        ) VALUES (
          'dubai-luxury-experience-5-days',
          'Dubai Luxury Experience',
          $1, $2, 5, 4,
          'Experience the ultimate luxury in Dubai with 5-star accommodations, desert safari, and city tours.',
          179998, 'INR',
          'luxury',
          'active'
        )
        ON CONFLICT (slug) DO NOTHING
      `, [uaeCountry.id, dubaiCity.id]);

      console.log('✅ Dubai package added successfully');
    } else {
      console.log('❌ Missing required data - need to create UAE/Dubai entries first');
    }

    // Verify the packages were added
    const result = await pool.query(`
      SELECT p.title, ci.name as city_name, c.name as country_name
      FROM packages p
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE LOWER(ci.name) LIKE '%dubai%'
    `);

    console.log('📦 Dubai packages in database:', result.rows);
    
  } catch (error) {
    console.error('❌ Error adding Dubai packages:', error);
  } finally {
    await pool.end();
  }
}

addDubaiPackages();
