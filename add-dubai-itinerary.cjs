const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function addItinerary() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get package ID
    const pkgResult = await client.query(`
      SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'
    `);
    
    if (pkgResult.rows.length === 0) {
      throw new Error('Package not found');
    }
    
    const packageId = pkgResult.rows[0].id;
    console.log('📦 Adding itinerary for package ID:', packageId);
    
    // Delete existing itinerary if any
    await client.query('DELETE FROM package_itinerary_days WHERE package_id = $1', [packageId]);
    
    // Insert itinerary days
    const itineraryDays = [
      {
        day_number: 1,
        title: 'Arrival in Dubai',
        description: 'Welcome to Dubai! Upon arrival at Dubai International Airport, you will be greeted by our representative and transferred to your luxury hotel. Check-in and relax after your journey. In the evening, enjoy a welcome dinner at the hotel with stunning views of the Dubai skyline.',
        cities: 'Dubai',
        meals_included: 'Dinner',
        accommodation: '5-star hotel - Burj Al Arab or similar',
        transport: 'Private airport transfer in luxury vehicle'
      },
      {
        day_number: 2,
        title: 'Dubai City Tour & Burj Khalifa',
        description: 'Start your day with a guided city tour covering the historic Al Fahidi District, Dubai Museum, and the iconic Gold and Spice Souks. Cross Dubai Creek on a traditional Abra boat. In the afternoon, visit the world\'s tallest building - Burj Khalifa with skip-the-line access to the observation deck on the 124th floor. Evening at leisure to explore Dubai Mall.',
        cities: 'Dubai',
        meals_included: 'Breakfast',
        accommodation: '5-star hotel',
        transport: 'Private vehicle with driver'
      },
      {
        day_number: 3,
        title: 'Desert Safari Adventure',
        description: 'Morning at leisure to relax at the hotel or enjoy optional activities. In the afternoon, embark on an exciting desert safari adventure with dune bashing, camel riding, and sandboarding. Experience a traditional Bedouin camp with falcon show, henna painting, and a delicious BBQ dinner under the stars with live entertainment.',
        cities: 'Desert Safari Camp',
        meals_included: 'Breakfast, BBQ Dinner',
        accommodation: '5-star hotel',
        transport: '4x4 desert safari vehicle'
      },
      {
        day_number: 4,
        title: 'Marina Yacht Cruise & Shopping',
        description: 'Enjoy a luxurious yacht cruise at Dubai Marina, cruising past iconic landmarks and modern architecture. Return for lunch, followed by a shopping experience at Dubai Mall with a personal shopper to guide you through the best stores. Evening at leisure or optional visit to the Dubai Fountain show.',
        cities: 'Dubai Marina, Downtown Dubai',
        meals_included: 'Breakfast',
        accommodation: '5-star hotel',
        transport: 'Private yacht and vehicle'
      },
      {
        day_number: 5,
        title: 'Leisure Day & Optional Activities',
        description: 'Day at leisure to explore Dubai at your own pace. Optional activities include visiting Atlantis The Palm, Palm Jumeirah, or relaxing at the hotel spa. You can also opt for a visit to the Miracle Garden or Global Village (seasonal). Evening farewell dinner at a rooftop restaurant with panoramic city views.',
        cities: 'Dubai',
        meals_included: 'Breakfast, Dinner',
        accommodation: '5-star hotel',
        transport: 'Hotel facilities and optional transfers'
      },
      {
        day_number: 6,
        title: 'Departure',
        description: 'Enjoy a final breakfast at the hotel and check-out. Depending on your flight time, you may have time for last-minute shopping or sightseeing. Our representative will transfer you to Dubai International Airport for your departure flight, taking with you unforgettable memories of your Dubai luxury experience.',
        cities: 'Dubai',
        meals_included: 'Breakfast',
        accommodation: 'N/A',
        transport: 'Private airport transfer'
      }
    ];
    
    for (const day of itineraryDays) {
      await client.query(`
        INSERT INTO package_itinerary_days (
          package_id, day_number, title, description,
          cities, meals_included, accommodation, transport
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        packageId,
        day.day_number,
        day.title,
        day.description,
        day.cities,
        day.meals_included,
        day.accommodation,
        day.transport
      ]);
      
      console.log(`✅ Added Day ${day.day_number}: ${day.title}`);
    }
    
    await client.query('COMMIT');
    console.log('\n🎉 Successfully added all itinerary days!');
    
    // Verify
    const verifyResult = await client.query(`
      SELECT day_number, title 
      FROM package_itinerary_days 
      WHERE package_id = $1 
      ORDER BY day_number
    `, [packageId]);
    
    console.log('\n📋 Verification - Total itinerary days:', verifyResult.rows.length);
    verifyResult.rows.forEach(day => {
      console.log(`   Day ${day.day_number}: ${day.title}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addItinerary().catch(console.error);
