/**
 * Create module_markups Table in PostgreSQL
 * Run this to fix the 500 error in Admin Panel Markup Management
 * 
 * Usage: node create-module-markups-table.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CREATE_TABLE_SQL = `
-- Create suppliers_master table first (if doesn't exist)
CREATE TABLE IF NOT EXISTS suppliers_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create module_markups table
CREATE TABLE IF NOT EXISTS module_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers_master(id) ON DELETE SET NULL,
  module TEXT NOT NULL,
  is_domestic BOOLEAN,
  cabin TEXT,
  airline_code TEXT,
  city_code TEXT,
  star_rating INT,
  hotel_chain TEXT,
  hotel_id TEXT,
  room_type TEXT,
  origin_city TEXT,
  dest_city TEXT,
  transfer_type TEXT,
  vehicle_type TEXT,
  experience_type TEXT,
  attraction_id TEXT,
  markup_type TEXT NOT NULL CHECK (markup_type IN ('PERCENT','FIXED')),
  markup_value NUMERIC(12,4) NOT NULL,
  fixed_currency CHAR(3) DEFAULT 'USD',
  bargain_min_pct NUMERIC(5,2),
  bargain_max_pct NUMERIC(5,2),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_module_markups_module ON module_markups(module);
CREATE INDEX IF NOT EXISTS idx_module_markups_status ON module_markups(status);
CREATE INDEX IF NOT EXISTS idx_module_markups_airline ON module_markups(airline_code);
CREATE INDEX IF NOT EXISTS idx_module_markups_city ON module_markups(city_code);
CREATE INDEX IF NOT EXISTS idx_module_markups_supplier ON module_markups(supplier_id);

-- Insert sample data for testing
INSERT INTO module_markups (
  module, airline_code, cabin, markup_type, markup_value, 
  bargain_min_pct, bargain_max_pct, status, created_by
) VALUES 
  ('AIR', 'AI', 'ECONOMY', 'PERCENT', 15.0, 8.0, 15.0, true, 'system'),
  ('AIR', 'AI', 'BUSINESS', 'PERCENT', 12.0, 6.0, 12.0, true, 'system'),
  ('AIR', 'EK', 'ECONOMY', 'PERCENT', 18.0, 10.0, 18.0, true, 'system'),
  ('HOTEL', NULL, NULL, 'PERCENT', 20.0, 10.0, 20.0, true, 'system')
ON CONFLICT DO NOTHING;
`;

async function createTable() {
  console.log('\n' + '='.repeat(70));
  console.log('CREATE module_markups TABLE');
  console.log('='.repeat(70) + '\n');

  try {
    console.log('1. Connecting to database...');
    const connResult = await pool.query('SELECT current_database()');
    console.log('   ✅ Connected to:', connResult.rows[0].current_database);

    console.log('\n2. Checking if table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'module_markups'
      )
    `);

    if (tableCheck.rows[0].exists) {
      console.log('   ⚠️  Table module_markups already exists');
      console.log('   💡 Skipping creation');
    } else {
      console.log('   ℹ️  Table does not exist, creating...');
      
      console.log('\n3. Creating suppliers_master and module_markups tables...');
      await pool.query(CREATE_TABLE_SQL);
      console.log('   ✅ Tables created successfully');
    }

    console.log('\n4. Verifying table structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'module_markups'
      ORDER BY ordinal_position
    `);
    console.log(`   ✅ Table has ${columns.rows.length} columns`);

    console.log('\n5. Checking data...');
    const count = await pool.query('SELECT COUNT(*) FROM module_markups');
    console.log(`   ✅ Table has ${count.rows[0].count} records`);

    if (count.rows[0].count > 0) {
      const sample = await pool.query(`
        SELECT module, COUNT(*) as count 
        FROM module_markups 
        GROUP BY module
      `);
      console.log('\n   Records by module:');
      sample.rows.forEach(row => {
        console.log(`      - ${row.module}: ${row.count}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS - module_markups Table Ready!');
    console.log('='.repeat(70));
    console.log('✅ Admin Panel Markup Management will now work');
    console.log('✅ No more 500 errors when accessing /api/markups');
    console.log('✅ Full sync between Admin Panel and PgAdmin enabled');
    console.log('='.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
    
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check DATABASE_URL is set correctly');
    console.log('   2. Ensure PostgreSQL is accessible');
    console.log('   3. Verify user has CREATE TABLE permissions\n');
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTable();
