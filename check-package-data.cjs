const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function checkPackageData() {
  try {
    const result = await pool.query(`
      SELECT 
        id, title, slug, 
        description, overview,
        highlights, inclusions, exclusions,
        base_price_pp
      FROM packages 
      WHERE slug LIKE '%dubai%'
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const pkg = result.rows[0];
      console.log('Package found:', pkg.title);
      console.log('Slug:', pkg.slug);
      console.log('\n--- DESCRIPTION ---');
      console.log(pkg.description || 'NULL');
      console.log('\n--- OVERVIEW ---');
      console.log(pkg.overview || 'NULL');
      console.log('\n--- HIGHLIGHTS ---');
      console.log(JSON.stringify(pkg.highlights, null, 2));
      console.log('\n--- INCLUSIONS ---');
      console.log(JSON.stringify(pkg.inclusions, null, 2));
      console.log('\n--- EXCLUSIONS ---');
      console.log(JSON.stringify(pkg.exclusions, null, 2));
    } else {
      console.log('No Dubai package found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPackageData();
