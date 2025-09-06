/**
 * Check existing pricing table schemas
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('🔍 Checking existing pricing table schemas...\n');
    
    // Check markup_rules table structure
    const markupColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'markup_rules' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 markup_rules table structure:');
    markupColumns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check promo_codes table structure
    const promoColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'promo_codes' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 promo_codes table structure:');
    promoColumns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check if tax_policies and price_checkpoints exist
    const otherTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tax_policies', 'price_checkpoints')
    `);
    
    console.log('\n📊 Other pricing tables:');
    if (otherTables.rows.length === 0) {
      console.log('   None found - need to create tax_policies and price_checkpoints');
    } else {
      otherTables.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
