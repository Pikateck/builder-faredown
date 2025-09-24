/**
 * Simple packages database setup with dependency handling
 */

const { Pool } = require('pg');

async function setupPackagesSimple() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Setting up packages database (simplified)...');
    
    // Create suppliers table first (if not exists)
    console.log('📋 Creating suppliers table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'manual',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create regions table
    console.log('📋 Creating regions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS regions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        parent_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
        level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
        sort_order INTEGER DEFAULT 0,
        slug VARCHAR(100) UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create countries table (might already exist, so use IF NOT EXISTS)
    console.log('📋 Creating/updating countries table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS countries (
        id SERIAL PRIMARY KEY,
        iso_code VARCHAR(3) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        calling_code VARCHAR(10),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add region_id to countries if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE countries 
        ADD COLUMN IF NOT EXISTS region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL;
      `);
    } catch (e) {
      console.log('Column region_id might already exist in countries table');
    }
    
    // Create cities table
    console.log('📋 Creating cities table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
        region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        timezone VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(country_id, name)
      );
    `);
    
    // Create main packages table
    console.log('📋 Creating packages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        region_id INTEGER REFERENCES regions(id),
        country_id INTEGER REFERENCES countries(id),
        city_id INTEGER REFERENCES cities(id),
        duration_days INTEGER NOT NULL CHECK (duration_days > 0),
        duration_nights INTEGER NOT NULL CHECK (duration_nights >= 0),
        overview TEXT,
        description TEXT,
        highlights JSONB,
        base_price_pp DECIMAL(12,2) NOT NULL CHECK (base_price_pp >= 0),
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        hero_image_url TEXT,
        category VARCHAR(100),
        status VARCHAR(20) DEFAULT 'draft',
        is_featured BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 0.00,
        review_count INTEGER DEFAULT 0,
        inclusions JSONB,
        exclusions JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create package departures table
    console.log('📋 Creating package_departures table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS package_departures (
        id SERIAL PRIMARY KEY,
        package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        departure_city_code VARCHAR(10) NOT NULL,
        departure_city_name VARCHAR(100) NOT NULL,
        departure_date DATE NOT NULL,
        return_date DATE,
        total_seats INTEGER NOT NULL CHECK (total_seats >= 0),
        booked_seats INTEGER NOT NULL DEFAULT 0 CHECK (booked_seats >= 0),
        available_seats INTEGER GENERATED ALWAYS AS (total_seats - booked_seats) STORED,
        price_per_person DECIMAL(12,2) NOT NULL CHECK (price_per_person >= 0),
        single_supplement DECIMAL(12,2) DEFAULT 0,
        child_price DECIMAL(12,2),
        infant_price DECIMAL(12,2) DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        is_active BOOLEAN DEFAULT TRUE,
        is_guaranteed BOOLEAN DEFAULT FALSE,
        special_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(package_id, departure_city_code, departure_date)
      );
    `);
    
    console.log('✅ Tables created successfully');
    
    // Insert basic sample data
    console.log('🌱 Inserting sample data...');
    
    // Insert sample regions
    await pool.query(`
      INSERT INTO regions (name, parent_id, level, sort_order, slug, description) VALUES
      ('International', NULL, 1, 1, 'international', 'International destinations'),
      ('Europe', 1, 2, 1, 'europe', 'European countries')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Insert sample countries
    await pool.query(`
      INSERT INTO countries (iso_code, name, region_id, currency) VALUES
      ('ES', 'Spain', 2, 'EUR'),
      ('PT', 'Portugal', 2, 'EUR')
      ON CONFLICT (iso_code) DO NOTHING;
    `);
    
    // Insert sample cities
    await pool.query(`
      INSERT INTO cities (country_id, region_id, name, code) VALUES
      ((SELECT id FROM countries WHERE iso_code = 'ES'), 2, 'Madrid', 'MAD'),
      ((SELECT id FROM countries WHERE iso_code = 'ES'), 2, 'Barcelona', 'BCN'),
      ((SELECT id FROM countries WHERE iso_code = 'PT'), 2, 'Lisbon', 'LIS')
      ON CONFLICT (country_id, name) DO NOTHING;
    `);
    
    // Insert sample package
    await pool.query(`
      INSERT INTO packages (
        slug, title, region_id, country_id, duration_days, duration_nights,
        overview, base_price_pp, currency, category, status, is_featured,
        inclusions, exclusions, highlights
      ) VALUES (
        'spain-portugal-13-days',
        'Spain Portugal - 13 Days',
        2,
        (SELECT id FROM countries WHERE iso_code = 'ES'),
        13, 12,
        'Discover the charm of Iberian Peninsula with this comprehensive Spain Portugal tour.',
        315000, 'INR',
        'cultural',
        'active',
        TRUE,
        '["Flights", "Hotels", "Breakfast", "Transfers", "Sightseeing"]',
        '["Lunch", "Dinner", "Personal expenses", "Tips"]',
        '["Visit Madrid and Barcelona", "Explore Lisbon and Porto", "Cultural experiences"]'
      )
      ON CONFLICT (slug) DO NOTHING;
    `);
    
    // Insert sample departures
    await pool.query(`
      INSERT INTO package_departures (
        package_id, departure_city_code, departure_city_name, departure_date, return_date,
        total_seats, price_per_person, currency, is_guaranteed
      ) VALUES 
      (
        (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
        'BOM', 'Mumbai', '2025-03-15', '2025-03-27',
        40, 315000, 'INR', TRUE
      ),
      (
        (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
        'DEL', 'Delhi', '2025-04-10', '2025-04-22',
        45, 320000, 'INR', TRUE
      )
      ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING;
    `);
    
    console.log('✅ Sample data inserted successfully');
    
    // Verify setup
    const packagesCount = await pool.query('SELECT COUNT(*) FROM packages');
    const departuresCount = await pool.query('SELECT COUNT(*) FROM package_departures');
    
    console.log(`📦 Total packages: ${packagesCount.rows[0].count}`);
    console.log(`🛫 Total departures: ${departuresCount.rows[0].count}`);
    
    // Show sample data
    const samplePackages = await pool.query(`
      SELECT p.slug, p.title, p.status, p.base_price_pp, p.currency,
             COUNT(pd.id) as departure_count
      FROM packages p
      LEFT JOIN package_departures pd ON p.id = pd.package_id
      GROUP BY p.id, p.slug, p.title, p.status, p.base_price_pp, p.currency
      LIMIT 3
    `);
    
    console.log('\n📋 Sample packages:');
    samplePackages.rows.forEach(pkg => {
      console.log(`- ${pkg.slug}: ${pkg.title} (₹${pkg.base_price_pp}) - ${pkg.departure_count} departures`);
    });
    
    console.log('\n🎉 Packages database setup complete!');
    console.log('🔗 You can now test the API at: /api/packages');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

setupPackagesSimple();
