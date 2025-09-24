const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seedSamplePackages() {
  console.log('🌱 Seeding sample packages...');
  
  const packages = [
    {
      slug: 'europe-highlights-11d',
      title: 'Europe Highlights 10N/11D',
      region: 'Europe',
      duration_days: 11,
      base_price_pp: 150000,
      currency: 'INR',
      overview: 'France • Switzerland • Italy. Iconic cities with guided sightseeing, visas support, and daily breakfast.',
      status: 'active',
      supplier_source: 'manual'
    },
    {
      slug: 'golden-triangle-7d',
      title: 'North India Golden Triangle 6N/7D',
      region: 'India',
      duration_days: 7,
      base_price_pp: 55000,
      currency: 'INR',
      overview: 'Delhi • Agra • Jaipur. Guided monuments, sunrise Taj, Amber Fort with local experiences.',
      status: 'active',
      supplier_source: 'manual'
    },
    {
      slug: 'egypt-essentials-8d',
      title: 'Egypt Essentials 7N/8D',
      region: 'Africa',
      duration_days: 8,
      base_price_pp: 98000,
      currency: 'INR',
      overview: 'Explore Cairo, Giza Pyramids, Luxor, Aswan and a 3N Nile Cruise. Includes flights, hotels, daily breakfast, and guided sightseeing.',
      status: 'active',
      supplier_source: 'manual'
    }
  ];

  for (const pkg of packages) {
    const insertSQL = `
      INSERT INTO packages (
        slug, title, region, duration_days, base_price_pp, currency,
        overview, status, supplier_source, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        overview = EXCLUDED.overview,
        status = EXCLUDED.status,
        updated_at = NOW()
    `;

    await pool.query(insertSQL, [
      pkg.slug, pkg.title, pkg.region, pkg.duration_days,
      pkg.base_price_pp, pkg.currency, pkg.overview,
      pkg.status, pkg.supplier_source
    ]);
  }

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
