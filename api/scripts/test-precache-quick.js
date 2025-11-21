const db = require("../lib/db");

async function testPrecache() {
  try {
    console.log("🔍 Testing TBO Precache...\n");

    // Test 1: Check database tables exist
    console.log("1️⃣  Checking database tables...");
    const tableCheck = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tbo_trace_logs', 'tbo_booking_sessions', 'hotel_search_cache')
    `);
    console.log(`   ✅ Found ${tableCheck.rows.length} tables\n`);

    // Test 2: Check cached searches
    console.log("2️⃣  Checking cached searches...");
    const cacheCheck = await db.query(`
      SELECT city_id, COUNT(*) as search_count, MAX(created_at) as last_search
      FROM hotel_search_cache
      GROUP BY city_id
      ORDER BY last_search DESC
    `);
    console.log(`   ✅ Found ${cacheCheck.rows.length} cities cached`);
    cacheCheck.rows.forEach((row) => {
      console.log(`      - ${row.city_id}: ${row.search_count} search(es)`);
    });
    console.log();

    // Test 3: Check trace logs
    console.log("3️⃣  Checking trace logs...");
    const traceCheck = await db.query(`
      SELECT COUNT(*) as total, request_type
      FROM tbo_trace_logs
      GROUP BY request_type
    `);
    console.log(`   ✅ Found ${traceCheck.rows.length} request types`);
    traceCheck.rows.forEach((row) => {
      console.log(`      - ${row.request_type}: ${row.total} trace(s)`);
    });
    console.log();

    // Test 4: Check booking sessions
    console.log("4️⃣  Checking booking sessions...");
    const sessionCheck = await db.query(`
      SELECT COUNT(*) as total, status
      FROM tbo_booking_sessions
      GROUP BY status
    `);
    console.log(`   ✅ Found ${sessionCheck.rows.length} session statuses`);
    sessionCheck.rows.forEach((row) => {
      console.log(`      - ${row.status}: ${row.total} session(s)`);
    });
    console.log();

    console.log("✅ Database schema test complete!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testPrecache();
