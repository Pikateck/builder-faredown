const { Pool } = require('pg');

// Database connection - Configure SSL properly for production databases
const dbUrl = process.env.DATABASE_URL;
const sslConfig = dbUrl && (dbUrl.includes('render.com') || dbUrl.includes('postgres://'))
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function checkDubaiPackages() {
  try {
    console.log('🔍 Checking Dubai packages in database...');
    
    // First, check if any packages exist
    const allPackagesQuery = `
      SELECT COUNT(*) as total, 
             string_agg(DISTINCT title, ', ') as sample_titles
      FROM packages 
      WHERE status = 'active'
    `;
    
    const allResult = await pool.query(allPackagesQuery);
    console.log('\n📦 Total active packages:', allResult.rows[0].total);
    console.log('📝 Sample titles:', allResult.rows[0].sample_titles);
    
    // Check for Dubai in titles
    const dubaiTitleQuery = `
      SELECT id, title, base_price_pp, currency, status
      FROM packages 
      WHERE LOWER(title) LIKE LOWER('%Dubai%')
      ORDER BY title
    `;
    
    const dubaiResult = await pool.query(dubaiTitleQuery);
    console.log('\n🏙️ Packages with "Dubai" in title:', dubaiResult.rows.length);
    
    dubaiResult.rows.forEach((pkg, index) => {
      console.log(`  ${index + 1}. ID: ${pkg.id} | ${pkg.title} | ${pkg.base_price_pp} ${pkg.currency || 'USD'} | Status: ${pkg.status}`);
    });
    
    // Test the exact filtering logic from the API
    const destination = 'Dubai, United Arab Emirates';
    const destinationName = destination.split(',')[0].trim();
    
    console.log('\n🎯 Testing exact API filtering logic...');
    console.log('Destination input:', destination);
    console.log('Extracted name:', destinationName);
    
    const apiFilterQuery = `
      SELECT id, title, base_price_pp, currency, status
      FROM packages 
      WHERE status = 'active' 
        AND LOWER(title) LIKE LOWER($1)
      ORDER BY title
    `;
    
    const apiResult = await pool.query(apiFilterQuery, [`%${destinationName}%`]);
    console.log('\n✅ API filter results:', apiResult.rows.length);
    
    apiResult.rows.forEach((pkg, index) => {
      console.log(`  ${index + 1}. ${pkg.title} | ${pkg.base_price_pp} ${pkg.currency || 'USD'}`);
    });
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

checkDubaiPackages();
