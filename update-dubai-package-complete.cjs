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
    
    console.log('✅ Updated Dubai Luxury Experience');

    // Note: Itinerary insertion skipped due to array type columns
    // Itinerary data can be added via admin panel or separate migration
    
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
