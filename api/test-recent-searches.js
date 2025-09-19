const { Pool } = require('pg');

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testRecentSearches() {
  try {
    console.log('🧪 Testing recent searches functionality...');
    
    // Test 1: Check if table exists and is accessible
    console.log('\n1. Testing table access...');
    const tableCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'recent_searches' AND table_schema = 'public'
    `);
    
    if (tableCheck.rows[0].count > 0) {
      console.log('✅ recent_searches table exists');
    } else {
      console.log('❌ recent_searches table not found');
      return;
    }
    
    // Test 2: Insert a test search
    console.log('\n2. Testing insert functionality...');
    const testQuery = {
      tripType: 'round_trip',
      from: { code: 'BOM', name: 'Mumbai' },
      to: { code: 'DXB', name: 'Dubai' },
      dates: { depart: '2025-10-01T00:00:00.000Z', return: '2025-10-10T00:00:00.000Z' },
      cabin: 'economy',
      adults: 1,
      children: 0,
      directOnly: false
    };
    
    const queryHash = require('crypto')
      .createHash('sha256')
      .update(`flights:${JSON.stringify(testQuery)}`)
      .digest('hex');
    
    const insertResult = await pool.query(`
      INSERT INTO recent_searches (device_id, module, query_hash, query)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (COALESCE(user_id::text, device_id), query_hash) 
      DO UPDATE SET updated_at = NOW()
      RETURNING id, created_at
    `, ['test-device-123', 'flights', queryHash, JSON.stringify(testQuery)]);
    
    console.log('✅ Insert successful:', insertResult.rows[0]);
    
    // Test 3: Retrieve searches
    console.log('\n3. Testing retrieve functionality...');
    const selectResult = await pool.query(`
      SELECT id, module, query, created_at, updated_at
      FROM recent_searches
      WHERE device_id = $1 AND module = $2
      ORDER BY updated_at DESC
      LIMIT 6
    `, ['test-device-123', 'flights']);
    
    console.log('✅ Retrieved searches:', selectResult.rows.length);
    selectResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.query.from.name} → ${row.query.to.name} (${row.query.tripType})`);
    });
    
    // Test 4: Delete test data
    console.log('\n4. Cleaning up test data...');
    await pool.query(`DELETE FROM recent_searches WHERE device_id = $1`, ['test-device-123']);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All recent searches tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Run the test
testRecentSearches();
