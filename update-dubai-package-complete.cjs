const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL || 'postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl?.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function updateDubaiPackages() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Updating Dubai packages with complete data...');
    
    // Update Dubai Luxury Experience
    await client.query(`
      UPDATE packages SET
        description = 'Immerse yourself in the glitz and glamour of Dubai, where cutting-edge architecture meets timeless desert beauty. This luxury package includes stays at the finest hotels, visits to iconic landmarks, and unforgettable experiences that showcase the best of this magnificent city.',
        highlights = $1,
        inclusions = $2,
        exclusions = $3
      WHERE slug = 'dubai-luxury-experience'
    `, [
      JSON.stringify([
        '5-star hotel accommodation at Burj Al Arab',
        'Skip-the-line access to Burj Khalifa',
        'Premium desert safari with falcon show',
        'Dubai Marina luxury yacht cruise',
        'Private guided city tour',
        'Shopping at Dubai Mall with personal shopper'
      ]),
      JSON.stringify([
        '6 nights accommodation in 5-star hotels',
        'Daily breakfast and 3 dinners',
        'Airport transfers in luxury vehicles',
        'All sightseeing as per itinerary',
        'Professional English-speaking guide',
        'Entry tickets to all mentioned attractions'
      ]),
      JSON.stringify([
        'International flights',
        'UAE visa fees',
        'Personal expenses and shopping',
        'Travel insurance',
        'Lunch (except where specified)',
        'Tips and gratuities'
      ])
    ]);
    
    // Get the package ID
    const pkgResult = await client.query(
      "SELECT id FROM packages WHERE slug = 'dubai-luxury-experience'"
    );
    
    if (pkgResult.rows.length > 0) {
      const packageId = pkgResult.rows[0].id;
      
      // Delete existing itinerary
      await client.query('DELETE FROM package_itinerary_days WHERE package_id = $1', [packageId]);
      
      // Insert new itinerary
      const itinerary = [
        {
          day_number: 1,
          title: 'Arrival in Dubai',
          description: 'Upon arrival at Dubai International Airport, you will be greeted and transferred to your luxury hotel. Check-in and relax after your journey. Evening at leisure to explore the hotel amenities.',
          cities: 'Dubai',
          meals_included: 'Dinner',
          accommodation: 'Burj Al Arab - Royal Suite',
          transport: 'Private luxury car transfer'
        },
        {
          day_number: 2,
          title: 'Dubai City Tour & Burj Khalifa',
          description: 'After breakfast, embark on a comprehensive city tour visiting Dubai Museum, Gold Souk, and Spice Souk. In the evening, visit the iconic Burj Khalifa with skip-the-line access to the 124th and 125th floors for spectacular sunset views.',
          cities: 'Dubai',
          meals_included: 'Breakfast, Dinner',
          accommodation: 'Burj Al Arab - Royal Suite',
          transport: 'Private air-conditioned vehicle'
        },
        {
          day_number: 3,
          title: 'Desert Safari & Arabian Night',
          description: 'Morning at leisure for shopping or spa treatments. In the afternoon, experience an exhilarating desert safari with dune bashing, camel riding, and falcon photography. Enjoy a traditional BBQ dinner under the stars with cultural entertainment.',
          cities: 'Dubai Desert',
          meals_included: 'Breakfast, BBQ Dinner',
          accommodation: 'Burj Al Arab - Royal Suite',
          transport: '4x4 Desert Safari vehicle'
        },
        {
          day_number: 4,
          title: 'Dubai Marina & Palm Jumeirah',
          description: 'Explore Dubai Marina on a private yacht cruise. Visit the iconic Palm Jumeirah and Atlantis The Palm. Enjoy lunch at a beachfront restaurant. Evening shopping at Dubai Marina Mall.',
          cities: 'Dubai',
          meals_included: 'Breakfast, Lunch',
          accommodation: 'Burj Al Arab - Royal Suite',
          transport: 'Private yacht & car'
        },
        {
          day_number: 5,
          title: 'Shopping & Leisure',
          description: 'Full day dedicated to shopping at Dubai Mall with a personal shopper. Visit the Dubai Aquarium and Underwater Zoo. Watch the mesmerizing Dubai Fountain show. Optional spa treatment at the hotel.',
          cities: 'Dubai',
          meals_included: 'Breakfast',
          accommodation: 'Burj Al Arab - Royal Suite',
          transport: 'Private car with driver'
        },
        {
          day_number: 6,
          title: 'Abu Dhabi Day Trip',
          description: 'Full day excursion to Abu Dhabi visiting the stunning Sheikh Zayed Grand Mosque, Emirates Palace, and the Louvre Abu Dhabi. Enjoy lunch at a premium restaurant before returning to Dubai.',
          cities: 'Abu Dhabi',
          meals_included: 'Breakfast, Lunch',
          accommodation: 'Burj Al Arab - Royal Suite',
          transport: 'Private luxury car'
        },
        {
          day_number: 7,
          title: 'Departure',
          description: 'Enjoy a leisurely breakfast at the hotel. Check-out and transfer to Dubai International Airport for your departure flight with unforgettable memories of Dubai.',
          cities: 'Dubai',
          meals_included: 'Breakfast',
          transport: 'Private airport transfer'
        }
      ];
      
      for (const day of itinerary) {
        await client.query(`
          INSERT INTO package_itinerary_days (
            package_id, day_number, title, description,
            meals_included, accommodation, transport
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          packageId,
          day.day_number,
          day.title,
          day.description,
          day.meals_included,
          day.accommodation,
          day.transport
        ]);
      }
      
      console.log(`✅ Added ${itinerary.length} itinerary days for Dubai Luxury Experience`);
    }
    
    // Update Dubai Adventure Weekender
    await client.query(`
      UPDATE packages SET
        description = 'Pack your weekend with adrenaline-pumping activities in Dubai stunning desert landscape. Perfect for adventure seekers looking for thrilling experiences.',
        highlights = $1,
        inclusions = $2,
        exclusions = $3
      WHERE slug = 'dubai-adventure-weekender'
    `, [
      JSON.stringify([
        'Extreme desert safari with dune bashing',
        'Quad biking adventure',
        'Sandboarding experience',
        'Camel riding and falcon show',
        'Traditional Bedouin camp experience'
      ]),
      JSON.stringify([
        '3 nights hotel accommodation',
        'Daily breakfast',
        'Desert safari with BBQ dinner',
        'All adventure activities',
        'Airport transfers'
      ]),
      JSON.stringify([
        'International flights',
        'Visa fees',
        'Lunch and dinner (except safari BBQ)',
        'Personal expenses'
      ])
    ]);

    // Update Dubai Standard Package
    await client.query(`
      UPDATE packages SET
        description = 'Experience the essential highlights of Dubai with this well-balanced package offering the perfect blend of culture, adventure, and leisure.',
        highlights = $1,
        inclusions = $2,
        exclusions = $3
      WHERE slug = 'dubai-standard-package'
    `, [
      JSON.stringify([
        '4-star hotel in central Dubai',
        'Burj Khalifa at The Top',
        'Dubai Mall visit',
        'Desert safari with cultural show',
        'Traditional dhow cruise'
      ]),
      JSON.stringify([
        '4 nights accommodation',
        'Daily breakfast',
        'City tour with guide',
        'Desert safari dinner',
        'Dhow cruise with refreshments'
      ]),
      JSON.stringify([
        'Flights and visa',
        'Lunches and dinners (except mentioned)',
        'Optional tours',
        'Personal expenses'
      ])
    ]);
    
    await client.query('COMMIT');
    console.log('✅ Successfully updated all Dubai packages with complete data!');
    
    // Verify
    const verification = await client.query(`
      SELECT 
        p.slug, 
        p.title,
        jsonb_array_length(p.highlights) as highlights_count,
        jsonb_array_length(p.inclusions) as inclusions_count,
        jsonb_array_length(p.exclusions) as exclusions_count,
        (SELECT COUNT(*) FROM package_itinerary_days WHERE package_id = p.id) as itinerary_days
      FROM packages p
      WHERE p.slug LIKE 'dubai%'
    `);
    
    console.log('\n📋 Package Data Summary:');
    verification.rows.forEach(row => {
      console.log(`\n${row.title} (${row.slug}):`);
      console.log(`   - Highlights: ${row.highlights_count || 0}`);
      console.log(`   - Inclusions: ${row.inclusions_count || 0}`);
      console.log(`   - Exclusions: ${row.exclusions_count || 0}`);
      console.log(`   - Itinerary Days: ${row.itinerary_days || 0}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating packages:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateDubaiPackages().catch(console.error);
