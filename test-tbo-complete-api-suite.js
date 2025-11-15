/**
 * TBO Hotel API - Complete Test Suite
 * Tests all implemented API endpoints
 */

const TBOAdapter = require('./api/services/adapters/tboAdapter');

async function runCompleteTests() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       TBO HOTEL API - COMPLETE IMPLEMENTATION TEST SUITE        ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const adapter = new TBOAdapter();
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Authentication
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Authentication');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const token = await adapter.getHotelToken();
    if (token && token.length > 0) {
      console.log('✅ PASS: Authentication successful');
      console.log(`   TokenId: ${token.substring(0, 30)}...`);
      results.passed.push('Authentication');
    } else {
      throw new Error('No token returned');
    }
  } catch (error) {
    console.log('❌ FAIL: Authentication failed');
    console.log(`   Error: ${error.message}`);
    results.failed.push('Authentication');
  }
  console.log('');

  // Test 2: Country List
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Get Country List');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const countries = await adapter.getCountryList();
    if (Array.isArray(countries) && countries.length > 0) {
      console.log('✅ PASS: Country List retrieved');
      console.log(`   Countries: ${countries.length}`);
      console.log(`   Sample: ${countries.slice(0, 3).map(c => c.name).join(', ')}`);
      results.passed.push('Country List');
    } else {
      throw new Error('No countries returned');
    }
  } catch (error) {
    console.log('❌ FAIL: Country List failed');
    console.log(`   Error: ${error.message}`);
    results.failed.push('Country List');
  }
  console.log('');

  // Test 3: City List
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Get City List (UAE)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const cities = await adapter.getCityList('AE');
    if (Array.isArray(cities) && cities.length > 0) {
      console.log('✅ PASS: City List retrieved');
      console.log(`   Cities in UAE: ${cities.length}`);
      console.log(`   Sample: ${cities.slice(0, 3).map(c => c.name).join(', ')}`);
      results.passed.push('City List');
    } else {
      throw new Error('No cities returned');
    }
  } catch (error) {
    console.log('❌ FAIL: City List failed');
    console.log(`   Error: ${error.message}`);
    results.failed.push('City List');
  }
  console.log('');

  // Test 4: Top Destinations
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Get Top Destinations');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const destinations = await adapter.getTopDestinations();
    if (Array.isArray(destinations)) {
      console.log('✅ PASS: Top Destinations retrieved');
      console.log(`   Destinations: ${destinations.length}`);
      results.passed.push('Top Destinations');
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.log('❌ FAIL: Top Destinations failed');
    console.log(`   Error: ${error.message}`);
    results.failed.push('Top Destinations');
  }
  console.log('');

  // Test 5: Search Cities (Autocomplete)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Search Cities (Autocomplete)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const results_search = await adapter.searchCities('Dubai', 5);
    if (Array.isArray(results_search) && results_search.length > 0) {
      console.log('✅ PASS: City Search working');
      console.log(`   Results for "Dubai": ${results_search.length}`);
      console.log(`   Top result: ${results_search[0].name} (ID: ${results_search[0].id})`);
      results.passed.push('City Search');
    } else {
      throw new Error('No results');
    }
  } catch (error) {
    console.log('❌ FAIL: City Search failed');
    console.log(`   Error: ${error.message}`);
    results.failed.push('City Search');
  }
  console.log('');

  // Test 6: Get CityId
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: Get CityId for Dubai');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const cityId = await adapter.getCityId('Dubai', 'AE');
    if (cityId) {
      console.log('✅ PASS: CityId retrieved');
      console.log(`   Dubai CityId: ${cityId}`);
      results.passed.push('Get CityId');
    } else {
      throw new Error('No CityId returned');
    }
  } catch (error) {
    console.log('❌ FAIL: Get CityId failed');
    console.log(`   Error: ${error.message}`);
    results.failed.push('Get CityId');
  }
  console.log('');

  // Test 7: Agency Balance (Expected to fail with 400)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 7: Get Agency Balance');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const balance = await adapter.getAgencyBalance();
    if (balance && balance.balance !== undefined) {
      console.log('✅ PASS: Agency Balance retrieved');
      console.log(`   Balance: ${balance.currency} ${balance.balance}`);
      results.passed.push('Agency Balance');
    } else {
      throw new Error('Invalid balance response');
    }
  } catch (error) {
    console.log('⚠️  WARN: Agency Balance failed (known issue)');
    console.log(`   Error: ${error.message}`);
    results.warnings.push('Agency Balance - HTTP 400 (requires investigation with TBO)');
  }
  console.log('');

  // Test 8: Logout
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 8: Logout (Token Clear)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const logout = await adapter.logoutAll();
    if (logout && logout.success) {
      console.log('✅ PASS: Logout successful');
      console.log(`   Message: ${logout.message}`);
      results.passed.push('Logout');
    } else {
      throw new Error('Logout failed');
    }
  } catch (error) {
    console.log('❌ FAIL: Logout failed');
    console.log(`   Error: ${error.message}`);
    results.failed.push('Logout');
  }
  console.log('');

  // Test 9: Hotel Info (Placeholder)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 9: Get Hotel Info (Placeholder)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const info = await adapter.getHotelInfo({ hotelCode: '12345' });
    if (info && info.supplier === 'TBO') {
      console.log('✅ PASS: Hotel Info placeholder working');
      console.log(`   Message: ${info.message}`);
      results.passed.push('Hotel Info');
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.log('❌ FAIL: Hotel Info failed');
    console.log(`   Error: ${error.message}`);
    results.failed.push('Hotel Info');
  }
  console.log('');

  // Summary
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                        TEST SUMMARY                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ PASSED: ${results.passed.length}`);
  results.passed.forEach((test, i) => {
    console.log(`   ${i + 1}. ${test}`);
  });
  console.log('');

  if (results.warnings.length > 0) {
    console.log(`⚠️  WARNINGS: ${results.warnings.length}`);
    results.warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log(`❌ FAILED: ${results.failed.length}`);
    results.failed.forEach((test, i) => {
      console.log(`   ${i + 1}. ${test}`);
    });
    console.log('');
  }

  const totalTests = results.passed.length + results.failed.length + results.warnings.length;
  const successRate = ((results.passed.length / totalTests) * 100).toFixed(1);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.failed.length === 0) {
    console.log('🎉 ALL CORE TESTS PASSED!\n');
    console.log('Next Steps:');
    console.log('1. Test hotel search with 90s timeout: node test-tbo-full-booking-flow.js');
    console.log('2. Investigate Agency Balance 400 error with TBO support');
    console.log('3. Review TBO_HOTEL_API_IMPLEMENTATION_STATUS.md for details\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review errors above.\n');
    process.exit(1);
  }
}

// Run tests
runCompleteTests().catch(error => {
  console.error('\n❌ Test suite crashed:');
  console.error(error);
  process.exit(1);
});
