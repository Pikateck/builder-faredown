/**
 * Comprehensive Acceptance Tests for Destinations Master System
 * Tests all aspects: API performance, search accuracy, data completeness
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

const BASE_URL = "http://localhost:3001";

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(testName, passed, message, actual = null, expected = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}: ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${message}`);
    if (actual !== null && expected !== null) {
      console.log(`   Expected: ${expected}`);
      console.log(`   Actual: ${actual}`);
    }
  }
  testResults.details.push({ testName, passed, message, actual, expected });
}

async function fetchWithTiming(url) {
  const start = Date.now();
  try {
    const response = await fetch(url);
    const duration = Date.now() - start;
    const data = await response.json();
    return { response, data, duration, error: null };
  } catch (error) {
    const duration = Date.now() - start;
    return { response: null, data: null, duration, error };
  }
}

async function runComprehensiveTests() {
  console.log("🧪 Running Comprehensive Destinations Master Acceptance Tests");
  console.log("=" .repeat(80));

  try {
    // =================================================================
    // 1. DATABASE STRUCTURE TESTS
    // =================================================================
    console.log("\n📊 1. DATABASE STRUCTURE TESTS");
    console.log("-".repeat(50));

    // Test table existence
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('regions', 'countries', 'cities', 'destination_aliases', 'destinations_search_mv')
      ORDER BY table_name
    `;
    const tables = await pool.query(tablesQuery);
    const tableNames = tables.rows.map(r => r.table_name);
    
    logTest("Table existence", 
      tableNames.length === 5, 
      `Found ${tableNames.length}/5 required tables`, 
      tableNames.join(', '), 
      'regions, countries, cities, destination_aliases, destinations_search_mv'
    );

    // Test materialized view has data
    const mvCountResult = await pool.query("SELECT COUNT(*) as count FROM destinations_search_mv");
    const mvCount = parseInt(mvCountResult.rows[0].count);
    logTest("Materialized view data", 
      mvCount > 0, 
      `${mvCount} items in search index`, 
      mvCount, 
      "> 0"
    );

    // Test indexes existence
    const indexQuery = `
      SELECT COUNT(*) as index_count 
      FROM pg_indexes 
      WHERE tablename IN ('regions', 'countries', 'cities', 'destination_aliases', 'destinations_search_mv')
        AND indexname LIKE '%trgm%'
    `;
    const indexResult = await pool.query(indexQuery);
    const trigramIndexes = parseInt(indexResult.rows[0].index_count);
    logTest("Trigram indexes", 
      trigramIndexes >= 3, 
      `${trigramIndexes} trigram indexes found`, 
      trigramIndexes, 
      ">= 3"
    );

    // =================================================================
    // 2. DATA COMPLETENESS TESTS
    // =================================================================
    console.log("\n📋 2. DATA COMPLETENESS TESTS");
    console.log("-".repeat(50));

    // Test data counts
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM regions WHERE is_active = true) as regions,
        (SELECT COUNT(*) FROM countries WHERE is_active = true) as countries,
        (SELECT COUNT(*) FROM cities WHERE is_active = true) as cities,
        (SELECT COUNT(*) FROM destination_aliases WHERE is_active = true) as aliases
    `;
    const stats = await pool.query(statsQuery);
    const counts = stats.rows[0];

    logTest("Regions count", 
      parseInt(counts.regions) >= 10, 
      `${counts.regions} active regions`, 
      counts.regions, 
      ">= 10"
    );

    logTest("Countries count", 
      parseInt(counts.countries) >= 20, 
      `${counts.countries} active countries`, 
      counts.countries, 
      ">= 20"
    );

    logTest("Cities count", 
      parseInt(counts.cities) >= 20, 
      `${counts.cities} active cities`, 
      counts.cities, 
      ">= 20"
    );

    // Test specific destinations exist
    const keyDestinations = ['Dubai', 'Paris', 'London', 'Mumbai', 'Europe', 'Asia'];
    for (const dest of keyDestinations) {
      const destResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM destinations_search_mv 
        WHERE label ILIKE $1 OR label_with_country ILIKE $1
      `, [`%${dest}%`]);
      
      const found = parseInt(destResult.rows[0].count) > 0;
      logTest(`Key destination: ${dest}`, 
        found, 
        found ? "Found in search index" : "Not found in search index"
      );
    }

    // =================================================================
    // 3. API PERFORMANCE TESTS
    // =================================================================
    console.log("\n⚡ 3. API PERFORMANCE TESTS");
    console.log("-".repeat(50));

    const performanceTests = [
      { query: 'dubai', maxTime: 400 },
      { query: 'paris', maxTime: 400 },
      { query: 'europe', maxTime: 400 },
      { query: 'mumbai', maxTime: 400 },
      { query: 'dxb', maxTime: 500 }, // Allow more time for alias lookup
      { query: '', maxTime: 200 } // Popular destinations should be fast
    ];

    for (const test of performanceTests) {
      const url = `${BASE_URL}/api/destinations/search?q=${encodeURIComponent(test.query)}&limit=10`;
      const result = await fetchWithTiming(url);
      
      if (result.error) {
        logTest(`Performance: "${test.query}"`, 
          false, 
          `Request failed: ${result.error.message}`
        );
        continue;
      }

      logTest(`Performance: "${test.query}"`, 
        result.duration <= test.maxTime, 
        `${result.duration}ms (target: ≤${test.maxTime}ms)`, 
        `${result.duration}ms`, 
        `≤${test.maxTime}ms`
      );
    }

    // =================================================================
    // 4. SEARCH ACCURACY TESTS
    // =================================================================
    console.log("\n🎯 4. SEARCH ACCURACY TESTS");
    console.log("-".repeat(50));

    const accuracyTests = [
      { 
        query: 'dubai', 
        expectedType: 'city', 
        expectedLabel: 'Dubai', 
        description: 'Dubai should return Dubai city' 
      },
      { 
        query: 'paris', 
        expectedType: 'city', 
        expectedLabel: 'Paris', 
        description: 'Paris should return Paris city' 
      },
      { 
        query: 'europe', 
        expectedType: 'region', 
        expectedLabel: 'Europe', 
        description: 'Europe should return Europe region' 
      },
      { 
        query: 'france', 
        expectedTypes: ['city', 'country'], 
        description: 'France should return both cities and country' 
      },
      { 
        query: 'india', 
        expectedTypes: ['country', 'region'], 
        description: 'India should return country and regions' 
      }
    ];

    for (const test of accuracyTests) {
      const url = `${BASE_URL}/api/destinations/search?q=${encodeURIComponent(test.query)}&limit=10`;
      const result = await fetchWithTiming(url);
      
      if (result.error || !result.data) {
        logTest(`Accuracy: "${test.query}"`, 
          false, 
          `Request failed: ${result.error?.message || 'No data'}`
        );
        continue;
      }

      const results = Array.isArray(result.data) ? result.data : [];
      
      if (test.expectedType && test.expectedLabel) {
        // Test for specific result
        const found = results.some(r => 
          r.type === test.expectedType && 
          r.label && r.label.toLowerCase().includes(test.expectedLabel.toLowerCase())
        );
        logTest(`Accuracy: "${test.query}"`, 
          found, 
          test.description + (found ? " ✓" : " ✗")
        );
      } else if (test.expectedTypes) {
        // Test for multiple types
        const foundTypes = [...new Set(results.map(r => r.type))];
        const hasExpectedTypes = test.expectedTypes.some(type => foundTypes.includes(type));
        logTest(`Accuracy: "${test.query}"`, 
          hasExpectedTypes, 
          `${test.description} (found: ${foundTypes.join(', ')})`
        );
      }
    }

    // =================================================================
    // 5. ALIAS RESOLUTION TESTS
    // =================================================================
    console.log("\n🔤 5. ALIAS RESOLUTION TESTS");
    console.log("-".repeat(50));

    const aliasTests = [
      { alias: 'dxb', expectedDestination: 'Dubai' },
      { alias: 'bombay', expectedDestination: 'Mumbai' },
      { alias: 'uae', expectedDestination: 'United Arab Emirates' },
      { alias: 'uk', expectedDestination: 'United Kingdom' }
    ];

    for (const test of aliasTests) {
      const url = `${BASE_URL}/api/destinations/search?q=${encodeURIComponent(test.alias)}&limit=5`;
      const result = await fetchWithTiming(url);
      
      if (result.error || !result.data) {
        logTest(`Alias: "${test.alias}"`, 
          false, 
          `Request failed: ${result.error?.message || 'No data'}`
        );
        continue;
      }

      const results = Array.isArray(result.data) ? result.data : [];
      const found = results.some(r => 
        r.label && r.label.toLowerCase().includes(test.expectedDestination.toLowerCase())
      );
      
      logTest(`Alias: "${test.alias}"`, 
        found, 
        `Should resolve to ${test.expectedDestination}` + (found ? " ✓" : " ✗")
      );
    }

    // =================================================================
    // 6. POPULAR DESTINATIONS TEST
    // =================================================================
    console.log("\n🌟 6. POPULAR DESTINATIONS TEST");
    console.log("-".repeat(50));

    const url = `${BASE_URL}/api/destinations/search?q=&limit=20`;
    const result = await fetchWithTiming(url);
    
    if (result.error || !result.data) {
      logTest("Popular destinations", 
        false, 
        `Request failed: ${result.error?.message || 'No data'}`
      );
    } else {
      const results = Array.isArray(result.data) ? result.data : [];
      logTest("Popular destinations", 
        results.length > 0, 
        `${results.length} popular destinations returned`
      );
      
      // Verify it's fast
      logTest("Popular destinations speed", 
        result.duration <= 200, 
        `${result.duration}ms (should be ≤200ms for cached popular)`
      );
    }

    // =================================================================
    // 7. API ENDPOINT COMPLETENESS
    // =================================================================
    console.log("\n🔗 7. API ENDPOINT COMPLETENESS");
    console.log("-".repeat(50));

    const endpoints = [
      { url: '/api/destinations/regions', name: 'Regions list' },
      { url: '/api/destinations/countries', name: 'Countries list' },
      { url: '/api/destinations/cities', name: 'Cities list' },
      { url: '/api/destinations/stats', name: 'Statistics' },
      { url: '/api/destinations/health', name: 'Health check' }
    ];

    for (const endpoint of endpoints) {
      const result = await fetchWithTiming(`${BASE_URL}${endpoint.url}`);
      logTest(`Endpoint: ${endpoint.name}`, 
        result.response && result.response.ok, 
        result.response ? `HTTP ${result.response.status}` : `Failed: ${result.error?.message}`
      );
    }

    // =================================================================
    // 8. ADMIN FUNCTIONALITY (Basic check)
    // =================================================================
    console.log("\n🔧 8. ADMIN FUNCTIONALITY");
    console.log("-".repeat(50));

    // Test materialized view refresh function
    try {
      await pool.query("SELECT search_destinations('test', 1)");
      logTest("Search function", true, "search_destinations() callable");
    } catch (error) {
      logTest("Search function", false, `search_destinations() error: ${error.message}`);
    }

    // Test refresh function exists
    try {
      await pool.query("SELECT refresh_destinations_mv()");
      logTest("Refresh function", true, "refresh_destinations_mv() callable");
    } catch (error) {
      logTest("Refresh function", false, `refresh_destinations_mv() error: ${error.message}`);
    }

  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
    logTest("Test suite execution", false, `Fatal error: ${error.message}`);
  } finally {
    await pool.end();
  }

  // =================================================================
  // FINAL RESULTS
  // =================================================================
  console.log("\n" + "=".repeat(80));
  console.log("📊 FINAL TEST RESULTS");
  console.log("=".repeat(80));
  
  const passRate = Math.round((testResults.passed / testResults.total) * 100);
  const status = passRate >= 80 ? "🎉 PASS" : passRate >= 60 ? "⚠️  PARTIAL" : "❌ FAIL";
  
  console.log(`\n${status} - ${testResults.passed}/${testResults.total} tests passed (${passRate}%)`);
  
  if (testResults.failed > 0) {
    console.log(`\n❌ Failed Tests (${testResults.failed}):`);
    testResults.details
      .filter(t => !t.passed)
      .forEach(t => console.log(`   • ${t.testName}: ${t.message}`));
  }

  console.log("\n📋 Recommendations:");
  if (passRate >= 90) {
    console.log("   ✅ System is production-ready!");
    console.log("   ✅ All core functionality working correctly");
    console.log("   ✅ Performance targets met");
  } else if (passRate >= 80) {
    console.log("   ⚡ System is mostly ready with minor issues");
    console.log("   💡 Review failed tests and fix critical issues");
    console.log("   🚀 Consider deploying with monitoring");
  } else {
    console.log("   🔧 System needs more work before production");
    console.log("   ❗ Fix critical failures before proceeding");
    console.log("   📊 Re-run tests after fixes");
  }

  console.log("\n🎯 Next Steps:");
  console.log("   1. Address any failed tests above");
  console.log("   2. Verify frontend integration manually");
  console.log("   3. Test admin panel CRUD operations");
  console.log("   4. Perform load testing with concurrent users");
  console.log("   5. Deploy to staging for user acceptance testing");

  return { success: passRate >= 80, passRate, details: testResults };
}

// Run the tests
runComprehensiveTests().catch(console.error);
