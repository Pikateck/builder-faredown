const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL || 'postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl?.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function verifyAndFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Dubai Luxury Experience package data...\n');
    
    // Check current data
    const check = await client.query(`
      SELECT 
        slug, 
        title,
        description IS NOT NULL as has_description,
        overview IS NOT NULL as has_overview,
        highlights,
        inclusions,
        exclusions
      FROM packages 
      WHERE slug = 'dubai-luxury-experience'
    `);
    
    if (check.rows.length === 0) {
      console.log('❌ Package not found!');
      return;
    }
    
    const pkg = check.rows[0];
    console.log('Current data:');
    console.log('  Title:', pkg.title);
    console.log('  Has description:', pkg.has_description);
    console.log('  Has overview:', pkg.has_overview);
    console.log('  Highlights:', pkg.highlights ? `Array with ${pkg.highlights.length} items` : 'NULL/Empty');
    console.log('  Inclusions:', pkg.inclusions ? `Array with ${pkg.inclusions.length} items` : 'NULL/Empty');
    console.log('  Exclusions:', pkg.exclusions ? `Array with ${pkg.exclusions.length} items` : 'NULL/Empty');
    
    // If description is missing but overview exists, copy overview to description
    if (!pkg.has_description && pkg.has_overview) {
      console.log('\n📝 Copying overview to description...');
      await client.query(`
        UPDATE packages 
        SET description = overview 
        WHERE slug = 'dubai-luxury-experience'
      `);
      console.log('✅ Description updated');
    }
    
    // If highlights/inclusions/exclusions are empty, populate them
    if (!pkg.highlights || pkg.highlights.length === 0) {
      console.log('\n📝 Adding highlights...');
      await client.query(`
        UPDATE packages 
        SET highlights = $1
        WHERE slug = 'dubai-luxury-experience'
      `, [JSON.stringify([
        '5-star hotel accommodation at Burj Al Arab',
        'Skip-the-line access to Burj Khalifa',
        'Premium desert safari with falcon show',
        'Dubai Marina luxury yacht cruise',
        'Private guided city tour',
        'Shopping at Dubai Mall with personal shopper'
      ])]);
      console.log('✅ Highlights added');
    }
    
    if (!pkg.inclusions || pkg.inclusions.length === 0) {
      console.log('\n📝 Adding inclusions...');
      await client.query(`
        UPDATE packages 
        SET inclusions = $1
        WHERE slug = 'dubai-luxury-experience'
      `, [JSON.stringify([
        '6 nights accommodation in 5-star hotels',
        'Daily breakfast and 3 dinners',
        'Airport transfers in luxury vehicles',
        'All sightseeing as per itinerary',
        'Professional English-speaking guide',
        'Entry tickets to all mentioned attractions'
      ])]);
      console.log('✅ Inclusions added');
    }
    
    if (!pkg.exclusions || pkg.exclusions.length === 0) {
      console.log('\n📝 Adding exclusions...');
      await client.query(`
        UPDATE packages 
        SET exclusions = $1
        WHERE slug = 'dubai-luxury-experience'
      `, [JSON.stringify([
        'International flights',
        'UAE visa fees',
        'Personal expenses and shopping',
        'Travel insurance',
        'Lunch (except where specified)',
        'Tips and gratuities'
      ])]);
      console.log('✅ Exclusions added');
    }
    
    // Verify final state
    console.log('\n✅ Final verification:');
    const final = await client.query(`
      SELECT 
        description IS NOT NULL as has_description,
        jsonb_array_length(highlights) as highlights_count,
        jsonb_array_length(inclusions) as inclusions_count,
        jsonb_array_length(exclusions) as exclusions_count
      FROM packages 
      WHERE slug = 'dubai-luxury-experience'
    `);
    
    const result = final.rows[0];
    console.log('  Description:', result.has_description ? 'YES' : 'NO');
    console.log('  Highlights:', result.highlights_count || 0, 'items');
    console.log('  Inclusions:', result.inclusions_count || 0, 'items');
    console.log('  Exclusions:', result.exclusions_count || 0, 'items');
    
    console.log('\n🎉 Package data is now complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyAndFix().catch(console.error);
