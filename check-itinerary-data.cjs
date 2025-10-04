const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function checkItinerary() {
  try {
    // Get package ID
    const pkgResult = await pool.query(`
      SELECT id, slug, title 
      FROM packages 
      WHERE slug = 'dubai-luxury-experience-5-days'
    `);
    
    if (pkgResult.rows.length === 0) {
      console.log('Package not found');
      await pool.end();
      return;
    }
    
    const pkg = pkgResult.rows[0];
    console.log('Package:', pkg.title);
    console.log('ID:', pkg.id);
    
    // Check itinerary days
    const itineraryResult = await pool.query(`
      SELECT * FROM package_itinerary_days
      WHERE package_id = $1
      ORDER BY day_number
    `, [pkg.id]);
    
    console.log('\nItinerary days count:', itineraryResult.rows.length);
    
    if (itineraryResult.rows.length > 0) {
      console.log('\nItinerary days:');
      itineraryResult.rows.forEach(day => {
        console.log(`\nDay ${day.day_number}: ${day.title}`);
        console.log(`Description: ${day.description?.substring(0, 100)}...`);
      });
    } else {
      console.log('\n❌ No itinerary days found for this package');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkItinerary();
