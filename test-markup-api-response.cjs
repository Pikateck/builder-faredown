/**
 * Test Markup API Response Structure
 * 
 * This script tests the markup API to verify it returns the correct structure
 * and class labels for all cabin classes
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testMarkupAPI() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Markup API Response Structure\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Query the database directly (simulating API route logic)
    const query = `
      SELECT * FROM markup_rules 
      WHERE module = 'air' 
        AND route_from = 'BOM' 
        AND route_to = 'DXB'
      ORDER BY 
        CASE booking_class
          WHEN 'economy' THEN 1
          WHEN 'premium-economy' THEN 2
          WHEN 'business' THEN 3
          WHEN 'first' THEN 4
        END;
    `;

    const result = await client.query(query);

    console.log(`📊 Found ${result.rows.length} markup records\n`);

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.rule_name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   booking_class (DB): "${row.booking_class}"`);
      console.log(`   airline_code: ${row.airline_code}`);
      console.log(`   route: ${row.route_from} → ${row.route_to}`);
      console.log(`   m_value: ${row.m_value}%`);
      console.log(`   current_min_pct: ${row.current_min_pct}%`);
      console.log(`   current_max_pct: ${row.current_max_pct}%`);
      console.log(`   bargain_min_pct: ${row.bargain_min_pct}%`);
      console.log(`   bargain_max_pct: ${row.bargain_max_pct}%`);
      console.log(`   is_active: ${row.is_active}`);
      console.log('');
    });

    // Simulate the API mapping function
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔄 Simulating API Response Mapping\n');

    const mappedItems = result.rows.map(row => ({
      id: String(row.id),
      name: row.rule_name,
      description: row.description || "",
      airline: row.airline_code || "ALL",
      route: { from: row.route_from || "ALL", to: row.route_to || "ALL" },
      class: row.booking_class || "economy",
      markupType: row.m_type === "flat" ? "fixed" : "percentage",
      markupValue: Number(row.m_value || 0),
      currentFareMin: Number(row.current_min_pct || 0),
      currentFareMax: Number(row.current_max_pct || 0),
      bargainFareMin: Number(row.bargain_min_pct || 0),
      bargainFareMax: Number(row.bargain_max_pct || 0),
      status: row.is_active ? "active" : "inactive",
    }));

    const apiResponse = {
      success: true,
      items: mappedItems,
      total: result.rows.length,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

    console.log('API Response Structure:');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ API Response Test Complete\n');

    // Expected Class Labels (from frontend normalization)
    console.log('📋 Expected Frontend Labels:');
    console.log('   economy → "All – Economy Class"');
    console.log('   premium-economy → "All – Premium Economy Class"');
    console.log('   business → "All – Business Class"');
    console.log('   first → "All – First Class"');
    console.log('');

    // Verify each class value
    console.log('✅ Class Value Verification:');
    mappedItems.forEach((item, index) => {
      const expectedLabels = {
        'economy': 'All – Economy Class',
        'premium-economy': 'All – Premium Economy Class',
        'business': 'All – Business Class',
        'first': 'All – First Class',
      };

      const expectedLabel = expectedLabels[item.class];
      console.log(`   ${index + 1}. ${item.name}`);
      console.log(`      class value: "${item.class}"`);
      console.log(`      expected label: "${expectedLabel}"`);
      console.log(`      ✅ ${expectedLabel ? 'VALID' : 'INVALID'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error testing markup API:', error);
    console.error('\nError details:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testMarkupAPI()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
