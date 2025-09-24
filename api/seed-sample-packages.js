const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seedSamplePackages() {
  console.log('🌱 Seeding sample packages...');
  
  const seedSQL = `
BEGIN;

-- Helper: fetch IDs by name
WITH
europe_region AS (
  SELECT id FROM regions WHERE name='Europe' LIMIT 1
),
north_india AS (
  SELECT id FROM regions WHERE name='North India' LIMIT 1
),
africa_region AS (
  SELECT id FROM regions WHERE name='Africa' LIMIT 1
),
france AS ( SELECT id FROM countries WHERE name='France' LIMIT 1 ),
spain  AS ( SELECT id FROM countries WHERE name='Spain'  LIMIT 1 ),
egypt_country AS ( SELECT id FROM countries WHERE name='Egypt' LIMIT 1 ),
india_country AS ( SELECT id FROM countries WHERE name='India' LIMIT 1 ),
paris AS ( SELECT id FROM cities WHERE name='Paris' LIMIT 1 ),
delhi AS ( SELECT id FROM cities WHERE name='Delhi' LIMIT 1 ),
cairo_city    AS (SELECT id FROM cities WHERE name='Cairo' LIMIT 1)

-- Europe Highlights Package
;
WITH pkg AS (
  INSERT INTO packages (
    slug, title, region_id, country_id, city_id, region,
    duration_days, base_price_pp, currency,
    overview, status, supplier_source
  )
  SELECT
    'europe-highlights-11d',
    'Europe Highlights 10N/11D',
    (SELECT id FROM europe_region),
    (SELECT id FROM france),
    (SELECT id FROM paris),
    'Europe',
    11,
    150000, 'INR',
    'France • Switzerland • Italy. Iconic cities with guided sightseeing, visas support, and daily breakfast.',
    'active','manual'
  ON CONFLICT (slug) DO UPDATE
    SET status='active'
  RETURNING id
)
INSERT INTO package_departures (package_id, city_code, city_name, depart_date, seats_total, seats_sold, price_pp, currency)
SELECT p.id, 'BOM', 'Mumbai', '2026-03-15', 40, 0, 150000, 'INR'
FROM packages p WHERE p.slug = 'europe-highlights-11d'
ON CONFLICT (package_id, city_code, depart_date) DO NOTHING;

-- Golden Triangle Package  
WITH pkg AS (
  INSERT INTO packages (
    slug, title, region_id, country_id, city_id, region,
    duration_days, base_price_pp, currency,
    overview, status, supplier_source
  )
  SELECT
    'golden-triangle-7d',
    'North India Golden Triangle 6N/7D',
    (SELECT id FROM north_india),
    (SELECT id FROM india_country),
    (SELECT id FROM delhi),
    'India',
    7,
    55000,'INR',
    'Delhi • Agra • Jaipur. Guided monuments, sunrise Taj, Amber Fort with local experiences.',
    'active','manual'
  ON CONFLICT (slug) DO UPDATE
    SET status='active'
  RETURNING id
)
INSERT INTO package_departures (package_id, city_code, city_name, depart_date, seats_total, seats_sold, price_pp, currency)
SELECT p.id, 'DEL', 'Delhi', '2026-02-05', 30, 0, 55000, 'INR'
FROM packages p WHERE p.slug = 'golden-triangle-7d'
ON CONFLICT (package_id, city_code, depart_date) DO NOTHING;

-- Egypt Package
WITH pkg AS (
  INSERT INTO packages (
    slug, title, region_id, country_id, city_id, region,
    duration_days, base_price_pp, currency,
    overview, status, supplier_source
  )
  SELECT
    'egypt-essentials-8d',
    'Egypt Essentials 7N/8D',
    (SELECT id FROM africa_region),
    (SELECT id FROM egypt_country),
    (SELECT id FROM cairo_city),
    'Africa',
    8,
    98000,'INR',
    'Explore Cairo, Giza Pyramids, Luxor, Aswan and a 3N Nile Cruise. Includes flights, hotels, daily breakfast, and guided sightseeing.',
    'active','manual'
  ON CONFLICT (slug) DO UPDATE
    SET status='active'
  RETURNING id
)
INSERT INTO package_departures (package_id, city_code, city_name, depart_date, seats_total, seats_sold, price_pp, currency)
SELECT p.id, 'DEL', 'Delhi', '2026-03-18', 30, 0, 98000, 'INR'
FROM packages p WHERE p.slug = 'egypt-essentials-8d'
ON CONFLICT (package_id, city_code, depart_date) DO NOTHING;

COMMIT;
`;

  try {
    await pool.query(seedSQL);
    console.log('✅ Sample packages seeded successfully');
    
    // Verify the packages were created
    const checkQuery = `
      SELECT p.slug, p.title, r.name as region_name, c.name as country_name, ci.name as city_name, p.base_price_pp
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE p.slug IN ('europe-highlights-11d', 'golden-triangle-7d', 'egypt-essentials-8d')
    `;
    
    const result = await pool.query(checkQuery);
    console.log('📋 Created packages:');
    result.rows.forEach(pkg => {
      console.log(`   - ${pkg.title} (${pkg.slug}) - ${pkg.region_name}/${pkg.country_name}/${pkg.city_name} - ₹${pkg.base_price_pp}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding packages:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
  }
  
  await pool.end();
}

seedSamplePackages();
