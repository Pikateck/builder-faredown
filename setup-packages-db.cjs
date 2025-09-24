/**
 * Set up packages database schema and seed data
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupPackagesDB() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Setting up packages database...');
    
    // Read and execute schema
    console.log('📋 Applying packages schema...');
    const schemaPath = path.join(__dirname, 'api/database/fixed-packages-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schemaSQL);
    console.log('✅ Schema applied successfully');
    
    // Read and execute seed data
    console.log('🌱 Seeding packages data...');
    const seedPath = path.join(__dirname, 'api/database/fixed-packages-seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    await pool.query(seedSQL);
    console.log('✅ Seed data applied successfully');
    
    // Verify setup
    console.log('🔍 Verifying setup...');
    
    const packagesCount = await pool.query('SELECT COUNT(*) FROM packages');
    const departuresCount = await pool.query('SELECT COUNT(*) FROM package_departures');
    const regionsCount = await pool.query('SELECT COUNT(*) FROM regions');
    
    console.log(`📦 Created ${packagesCount.rows[0].count} packages`);
    console.log(`🛫 Created ${departuresCount.rows[0].count} departures`);
    console.log(`🌍 Created ${regionsCount.rows[0].count} regions`);
    
    // Show sample packages
    const samplePackages = await pool.query(`
      SELECT slug, title, status, base_price_pp, currency 
      FROM packages 
      WHERE status = 'active' 
      LIMIT 3
    `);
    
    console.log('\n📋 Sample packages:');
    samplePackages.rows.forEach(pkg => {
      console.log(`- ${pkg.slug}: ${pkg.title} (₹${pkg.base_price_pp})`);
    });
    
    console.log('\n🎉 Packages database setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    // More detailed error info
    if (error.message.includes('does not exist')) {
      console.log('💡 This might be a table dependency issue. Some tables may already exist.');
    }
  } finally {
    await pool.end();
  }
}

setupPackagesDB();
