/**
 * Check London/UK Packages in Database
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLondonPackages() {
  try {
    console.log('🔍 Checking London/UK packages in database...');
    
    // Check UK country and its packages
    const ukPackages = await pool.query(`
      SELECT 
        p.title,
        p.slug,
        c.name as country_name,
        c.iso2,
        ci.name as city_name,
        r.name as region_name,
        p.base_price_pp,
        p.status
      FROM packages p
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id  
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE c.iso2 = 'GB' OR c.name ILIKE '%United Kingdom%' OR c.name ILIKE '%UK%'
      ORDER BY p.base_price_pp DESC
    `);
    
    console.log(`📦 UK/London packages found: ${ukPackages.rows.length}`);
    ukPackages.rows.forEach(pkg => {
      console.log(`- ${pkg.title} (${pkg.country_name}) - ₹${pkg.base_price_pp?.toLocaleString()} - ${pkg.status}`);
    });
    
    // Check if UK country exists
    const ukCountry = await pool.query(`
      SELECT id, iso2, iso3, name 
      FROM countries 
      WHERE iso2 = 'GB' OR name ILIKE '%United Kingdom%' OR name ILIKE '%UK%'
    `);
    
    console.log(`\n🌍 UK country records found: ${ukCountry.rows.length}`);
    ukCountry.rows.forEach(country => {
      console.log(`- ${country.name} (${country.iso2}): ${country.id}`);
    });
    
    // Check all packages with their country info
    const allPackages = await pool.query(`
      SELECT 
        p.title,
        c.name as country_name,
        c.iso2,
        p.status
      FROM packages p
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE p.status = 'active'
      ORDER BY c.name, p.title
    `);
    
    console.log(`\n📋 All active packages by country:`);
    const byCountry = {};
    allPackages.rows.forEach(pkg => {
      const country = pkg.country_name || 'Unknown';
      if (!byCountry[country]) byCountry[country] = [];
      byCountry[country].push(pkg.title);
    });
    
    Object.keys(byCountry).forEach(country => {
      console.log(`${country}: ${byCountry[country].length} packages`);
      byCountry[country].forEach(title => console.log(`  - ${title}`));
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkLondonPackages();
