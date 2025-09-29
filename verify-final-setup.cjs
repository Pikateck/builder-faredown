const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : false
});

async function verifyFinalSetup() {
  try {
    console.log('🔍 Verifying final database setup...\n');
    
    // Check packages table structure
    const packagesStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'packages' AND column_name IN ('id', 'region_id', 'country_id', 'city_id')
      ORDER BY column_name
    `);
    
    console.log('PACKAGES TABLE KEY COLUMNS:');
    packagesStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Check package_departures structure
    const departuresStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'package_departures' AND column_name = 'package_id'
    `);
    
    console.log('\nPACKAGE_DEPARTURES TABLE:');
    console.log(`- package_id: ${departuresStructure.rows[0]?.data_type || 'NOT FOUND'}`);
    
    // Check Dubai packages with proper destinations
    console.log('\n🏙️ Dubai Packages Status:');
    const dubaiPackages = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.package_category,
        ci.name as city_name,
        c.name as country_name,
        r.name as region_name,
        p.base_price_pp,
        p.status
      FROM packages p
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN countries c ON p.country_id = c.id  
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE LOWER(p.title) LIKE '%dubai%' OR ci.name = 'Dubai'
      ORDER BY p.package_category
    `);
    
    if (dubaiPackages.rows.length > 0) {
      dubaiPackages.rows.forEach(row => {
        console.log(`✅ ${row.title} (${row.package_category})`);
        console.log(`   Location: ${row.city_name || 'N/A'}, ${row.country_name || 'N/A'} (${row.region_name || 'N/A'})`);
        console.log(`   Price: ₹${row.base_price_pp} | Status: ${row.status}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No Dubai packages found');
    }
    
    // Test the filtering query that the API will use
    console.log('🧪 Testing API filtering query for Dubai, October 1-5, 2025:');
    
    try {
      const testQuery = `
        SELECT 
          p.id,
          p.title,
          p.package_category,
          p.base_price_pp,
          ci.name as city_name,
          c.name as country_name,
          r.name as region_name
        FROM packages p
        LEFT JOIN cities ci ON p.city_id = ci.id
        LEFT JOIN countries c ON p.country_id = c.id
        LEFT JOIN regions r ON p.region_id = r.id
        WHERE p.status = 'active'
          AND ci.name = 'Dubai'
        ORDER BY p.package_category
      `;
      
      const filterTest = await pool.query(testQuery);
      
      console.log(`✅ Found ${filterTest.rows.length} Dubai packages that can be filtered:`);
      filterTest.rows.forEach(row => {
        console.log(`- ${row.title} (${row.package_category}) - ₹${row.base_price_pp}`);
      });
      
      // Test date-specific filtering (this will be used by the API)
      console.log('\n📅 Testing date filtering (departures in October 1-5):');
      
      const dateFilterTest = await pool.query(`
        SELECT 
          p.title,
          p.package_category,
          pd.departure_date,
          pd.price_per_person
        FROM packages p
        LEFT JOIN cities ci ON p.city_id = ci.id
        JOIN package_departures pd ON p.id::text = pd.package_id::text
        WHERE p.status = 'active'
          AND ci.name = 'Dubai'
          AND pd.departure_date BETWEEN '2025-10-01' AND '2025-10-05'
          AND pd.is_active = TRUE
        ORDER BY p.package_category, pd.departure_date
      `);
      
      console.log(`✅ Found ${dateFilterTest.rows.length} departures for Dubai Oct 1-5:`);
      dateFilterTest.rows.forEach(row => {
        console.log(`- ${row.title} (${row.package_category}) - ${row.departure_date} - ₹${row.price_per_person}`);
      });
      
    } catch (err) {
      console.log('❌ Filtering test failed:', err.message);
      
      // Try a simpler approach
      console.log('\n🔧 Trying simplified filtering...');
      const simpleTest = await pool.query(`
        SELECT title, package_category, base_price_pp
        FROM packages 
        WHERE status = 'active' AND LOWER(title) LIKE '%dubai%'
        ORDER BY package_category
      `);
      
      console.log(`✅ Found ${simpleTest.rows.length} Dubai packages (title-based):`);
      simpleTest.rows.forEach(row => {
        console.log(`- ${row.title} (${row.package_category}) - ₹${row.base_price_pp}`);
      });
    }
    
    // Check overall package distribution
    console.log('\n📊 Overall Package Distribution:');
    const distribution = await pool.query(`
      SELECT 
        COALESCE(r.name, 'Unassigned') as region_name,
        COUNT(p.id) as package_count,
        COUNT(DISTINCT p.package_category) as category_varieties
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE p.status = 'active'
      GROUP BY r.id, r.name
      ORDER BY package_count DESC
    `);
    
    distribution.rows.forEach(row => {
      console.log(`- ${row.region_name}: ${row.package_count} packages (${row.category_varieties} categories)`);
    });
    
    console.log('\n✅ Database setup verification completed!');
    
  } catch (error) {
    console.error('❌ Error verifying setup:', error.message);
  } finally {
    await pool.end();
  }
}

verifyFinalSetup();
