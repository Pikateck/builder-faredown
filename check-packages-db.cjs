/**
 * Check if packages database tables and data exist
 */

const { Pool } = require('pg');

async function checkPackagesDB() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking packages database setup...');
    
    // Check if packages table exists
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('packages', 'package_departures', 'regions', 'countries', 'cities')
      ORDER BY table_name
    `);
    
    console.log('Found tables:', tablesResult.rows.map(r => r.table_name));
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No packages tables found. Need to run schema migration.');
      console.log('\nTo fix this, run:');
      console.log('psql $DATABASE_URL -f api/database/fixed-packages-schema.sql');
      console.log('psql $DATABASE_URL -f api/database/fixed-packages-seed.sql');
      return;
    }
    
    // Check packages data
    if (tablesResult.rows.find(r => r.table_name === 'packages')) {
      const packagesCount = await pool.query('SELECT COUNT(*) FROM packages');
      console.log('Packages in database:', packagesCount.rows[0].count);
      
      if (parseInt(packagesCount.rows[0].count) === 0) {
        console.log('❌ No packages data found. Need to run seed data.');
        console.log('\nTo fix this, run:');
        console.log('psql $DATABASE_URL -f api/database/fixed-packages-seed.sql');
        return;
      }
      
      // Show sample packages
      const samplePackages = await pool.query('SELECT slug, title, status FROM packages LIMIT 3');
      console.log('\nSample packages:');
      samplePackages.rows.forEach(pkg => {
        console.log(`- ${pkg.slug}: ${pkg.title} (${pkg.status})`);
      });
    }
    
    // Check departures data  
    if (tablesResult.rows.find(r => r.table_name === 'package_departures')) {
      const departuresCount = await pool.query('SELECT COUNT(*) FROM package_departures');
      console.log('Package departures:', departuresCount.rows[0].count);
    }
    
    console.log('\n✅ Database setup looks good!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkPackagesDB();
