/**
 * Script to add Dubai packages to the database
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function addDubaiPackages() {
  try {
    console.log('Adding Dubai packages to database...');

    // Add Dubai Luxury Experience package
    await pool.query(`
      INSERT INTO packages (
        slug, title, region_id, country_id, city_id, duration_days, duration_nights,
        overview, base_price_pp, currency, category, status, is_featured,
        inclusions, exclusions, highlights
      ) VALUES (
        'dubai-luxury-experience-5-days',
        'Dubai Luxury Experience',
        (SELECT id FROM regions WHERE name = 'Middle East'),
        (SELECT id FROM countries WHERE iso_code = 'AE'),
        (SELECT id FROM cities WHERE name = 'Dubai'),
        5, 4,
        'Experience the ultimate luxury in Dubai with 5-star accommodations, desert safari, and city tours.',
        125000, 'INR',
        'luxury',
        'active',
        TRUE,
        '["Return airfare from Mumbai/Delhi", "4 nights 5-star hotel accommodation", "Daily breakfast", "Airport transfers", "Desert safari with BBQ dinner", "Dubai city tour", "Burj Khalifa visit", "Local English-speaking guide"]',
        '["Lunch and dinner (except BBQ)", "Visa fees", "Personal expenses", "Optional tours", "Tips and gratuities", "Travel insurance"]',
        '["Visit iconic Burj Khalifa", "Explore Dubai Mall and Gold Souk", "Desert safari with camel riding", "Luxury shopping experience", "Traditional dhow cruise", "Modern architectural marvels"]'
      )
      ON CONFLICT (slug) DO NOTHING
    `);

    // Add Dubai City Explorer package
    await pool.query(`
      INSERT INTO packages (
        slug, title, region_id, country_id, city_id, duration_days, duration_nights,
        overview, base_price_pp, currency, category, status, is_featured,
        inclusions, exclusions, highlights
      ) VALUES (
        'dubai-city-explorer-4-days',
        'Dubai City Explorer',
        (SELECT id FROM regions WHERE name = 'Middle East'),
        (SELECT id FROM countries WHERE iso_code = 'AE'),
        (SELECT id FROM cities WHERE name = 'Dubai'),
        4, 3,
        'Discover the best of Dubai in 4 days with modern attractions and traditional culture.',
        85000, 'INR',
        'cultural',
        'active',
        FALSE,
        '["Return airfare from Mumbai/Delhi", "3 nights 4-star hotel accommodation", "Daily breakfast", "Airport transfers", "Half-day city tour", "Dubai Marina walk", "Local guide"]',
        '["Lunch and dinner meals", "Visa fees", "Personal expenses", "Optional tours", "Tips and gratuities", "Travel insurance"]',
        '["Explore Old Dubai heritage sites", "Visit Dubai Museum", "Walk through spice and gold souks", "Modern Dubai Marina area", "Traditional Arabic culture", "Stunning skyline views"]'
      )
      ON CONFLICT (slug) DO NOTHING
    `);

    // Add departures for Dubai Luxury Experience
    await pool.query(`
      INSERT INTO package_departures (
        package_id, departure_city_code, departure_city_name, departure_date, return_date,
        total_seats, price_per_person, currency, is_guaranteed
      ) VALUES 
      (
        (SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'),
        'BOM', 'Mumbai', '2025-10-01', '2025-10-05',
        25, 179998, 'INR', TRUE
      ),
      (
        (SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'),
        'DEL', 'Delhi', '2025-10-01', '2025-10-05',
        30, 185000, 'INR', TRUE
      ),
      (
        (SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'),
        'BLR', 'Bangalore', '2025-10-02', '2025-10-06',
        20, 175000, 'INR', FALSE
      )
      ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING
    `);

    // Add departures for Dubai City Explorer
    await pool.query(`
      INSERT INTO package_departures (
        package_id, departure_city_code, departure_city_name, departure_date, return_date,
        total_seats, price_per_person, currency, is_guaranteed
      ) VALUES 
      (
        (SELECT id FROM packages WHERE slug = 'dubai-city-explorer-4-days'),
        'BOM', 'Mumbai', '2025-10-01', '2025-10-04',
        30, 109998, 'INR', TRUE
      ),
      (
        (SELECT id FROM packages WHERE slug = 'dubai-city-explorer-4-days'),
        'DEL', 'Delhi', '2025-10-02', '2025-10-05',
        25, 115000, 'INR', TRUE
      ),
      (
        (SELECT id FROM packages WHERE slug = 'dubai-city-explorer-4-days'),
        'COK', 'Kochi', '2025-10-03', '2025-10-06',
        15, 120000, 'INR', FALSE
      )
      ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING
    `);

    console.log('✅ Successfully added Dubai packages to database');
    
    // Verify the packages were added
    const result = await pool.query(`
      SELECT p.title, ci.name as city_name, c.name as country_name 
      FROM packages p
      LEFT JOIN cities ci ON p.city_id = ci.id
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE LOWER(ci.name) = 'dubai'
    `);
    
    console.log('📦 Dubai packages in database:', result.rows);
    
  } catch (error) {
    console.error('❌ Error adding Dubai packages:', error);
  } finally {
    await pool.end();
  }
}

addDubaiPackages();
