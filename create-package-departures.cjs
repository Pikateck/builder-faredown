const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : false
});

async function createPackageDepartures() {
  const client = await pool.connect();
  
  try {
    console.log('📅 Creating package departures for October 2025...\n');
    
    await client.query('BEGIN');
    
    // Get all active packages
    const packages = await client.query(`
      SELECT p.id, p.title, p.duration_days, p.base_price_pp
      FROM packages p
      WHERE p.status = 'active'
    `);
    
    console.log(`Found ${packages.rows.length} active packages`);
    
    const departureDates = [
      '2025-10-01',
      '2025-10-03', 
      '2025-10-05',
      '2025-10-08',
      '2025-10-15'
    ];
    
    let totalCreated = 0;
    
    for (const pkg of packages.rows) {
      // Check if departures already exist
      const existingDepartures = await client.query(`
        SELECT COUNT(*) as count
        FROM package_departures 
        WHERE package_id = $1 AND departure_date >= CURRENT_DATE
      `, [pkg.id]);
      
      if (existingDepartures.rows[0].count > 0) {
        console.log(`⏭️ ${pkg.title} already has departures, skipping...`);
        continue;
      }
      
      for (const depDate of departureDates) {
        const returnDate = new Date(depDate);
        returnDate.setDate(returnDate.getDate() + pkg.duration_days);
        
        await client.query(`
          INSERT INTO package_departures (
            package_id, departure_city_code, departure_city_name,
            departure_date, return_date, total_seats, booked_seats,
            price_per_person, single_supplement, child_price, infant_price,
            currency, is_active, is_guaranteed, special_notes,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
          )
        `, [
          pkg.id, 'BOM', 'Mumbai',
          depDate, returnDate.toISOString().split('T')[0], 20, 0,
          pkg.base_price_pp, 5000, Math.round(pkg.base_price_pp * 0.8), 0,
          'INR', true, true, 'Guaranteed departure with minimum 2 passengers'
        ]);
        
        totalCreated++;
      }
      
      console.log(`✅ Created departures for: ${pkg.title}`);
    }
    
    await client.query('COMMIT');
    
    console.log(`\n🎉 Successfully created ${totalCreated} departures!`);
    
    // Verification - check Dubai packages specifically
    console.log('\n🔍 Verifying Dubai packages for October 1-5, 2025:');
    
    const dubaiVerification = await client.query(`
      SELECT 
        p.title,
        p.package_category,
        ci.name as city_name,
        COUNT(pd.id) as departure_count
      FROM packages p
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN package_departures pd ON p.id = pd.package_id 
          AND pd.departure_date BETWEEN '2025-10-01' AND '2025-10-05'
          AND pd.is_active = TRUE
      WHERE ci.name = 'Dubai'
      GROUP BY p.id, p.title, p.package_category, ci.name
      ORDER BY p.package_category
    `);
    
    if (dubaiVerification.rows.length > 0) {
      dubaiVerification.rows.forEach(row => {
        console.log(`✅ ${row.title} (${row.package_category}) - ${row.departure_count} departures`);
      });
    } else {
      console.log('⚠️ No Dubai packages found');
    }
    
    // Overall verification
    console.log('\n📊 Overall package statistics:');
    const stats = await client.query(`
      SELECT 
        r.name as region_name,
        COUNT(DISTINCT p.id) as packages_count,
        COUNT(pd.id) as departures_count
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN package_departures pd ON p.id = pd.package_id 
          AND pd.departure_date BETWEEN '2025-10-01' AND '2025-10-05'
          AND pd.is_active = TRUE
      WHERE p.status = 'active'
      GROUP BY r.id, r.name
      HAVING COUNT(DISTINCT p.id) > 0
      ORDER BY packages_count DESC
    `);
    
    stats.rows.forEach(row => {
      console.log(`- ${row.region_name}: ${row.packages_count} packages, ${row.departures_count} departures`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating package departures:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createPackageDepartures().catch(console.error);
