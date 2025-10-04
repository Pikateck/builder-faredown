const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function testAPI() {
  try {
    const slug = 'dubai-luxury-experience-5-days';
    
    // Simulate the API query
    const query = `
      SELECT
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        (
          SELECT json_agg(
            json_build_object(
              'day_number', pid.day_number,
              'title', pid.title,
              'description', pid.description,
              'cities', pid.cities,
              'meals_included', pid.meals_included,
              'accommodation', pid.accommodation,
              'activities', pid.activities,
              'transport', pid.transport
            )
            ORDER BY pid.day_number
          )
          FROM package_itinerary_days pid
          WHERE pid.package_id = p.id
        ) as itinerary
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE p.slug = $1 AND p.status = 'active'
    `;

    const result = await pool.query(query, [slug]);

    if (result.rows.length === 0) {
      console.log('❌ Package not found');
      await pool.end();
      return;
    }

    const packageData = result.rows[0];
    
    console.log('Package:', packageData.title);
    console.log('\n--- ITINERARY DATA ---');
    
    if (packageData.itinerary) {
      console.log('Itinerary exists: YES');
      console.log('Number of days:', packageData.itinerary.length);
      console.log('\nItinerary JSON:');
      console.log(JSON.stringify(packageData.itinerary, null, 2));
    } else {
      console.log('Itinerary exists: NO');
      console.log('Itinerary value:', packageData.itinerary);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAPI();
