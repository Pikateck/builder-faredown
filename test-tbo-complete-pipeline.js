/**
 * TBO Universal JSON Hotel API - Complete Pipeline Test
 * 
 * Tests the full flow:
 * 1. Authentication (get TokenId)
 * 2. Country List (with TokenId)
 * 3. City List (with TokenId)
 * 4. Hotel Search (with TokenId)
 * 
 * This verifies all endpoints are correct and working
 */

const axios = require('axios');

// Configuration from environment
const config = {
  authUrl: 'https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate',
  staticBase: 'https://apiwr.tboholidays.com/HotelAPI/',
  searchBase: 'https://affiliate.travelboutiqueonline.com/HotelAPI/',
  
  clientId: process.env.TBO_CLIENT_ID || 'tboprod',
  userId: process.env.TBO_API_USER_ID || 'BOMF145',
  password: process.env.TBO_API_PASSWORD || '@Bo#4M-Api@',
  endUserIp: process.env.TBO_END_USER_IP || '52.5.155.132'
};

let tokenId = null;

/**
 * Format date as dd/MM/yyyy (TBO requirement)
 */
function formatDateForTBO(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * 1. Test Authentication
 */
async function testAuthentication() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: JSON AUTHENTICATION');
  console.log('='.repeat(60) + '\n');

  const authRequest = {
    ClientId: config.clientId,
    UserName: config.userId,
    Password: config.password,
    EndUserIp: config.endUserIp
  };

  console.log('📤 Request:');
  console.log('  URL:', config.authUrl);
  console.log('  ClientId:', authRequest.ClientId);
  console.log('  UserName:', authRequest.UserName);
  console.log('  Password:', '***');
  console.log('  EndUserIp:', authRequest.EndUserIp);
  console.log('');

  try {
    const response = await axios.post(config.authUrl, authRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      },
      timeout: 15000
    });

    console.log('📥 Response:');
    console.log('  HTTP Status:', response.status);
    console.log('  Status:', response.data?.Status);
    console.log('  TokenId:', response.data?.TokenId ? `✅ PRESENT (${response.data.TokenId.length} chars)` : '❌ MISSING');
    console.log('  Member ID:', response.data?.Member?.MemberId);
    console.log('  Agency ID:', response.data?.Member?.AgencyId);
    console.log('  Error Code:', response.data?.Error?.ErrorCode);
    console.log('  Error Message:', response.data?.Error?.ErrorMessage);
    console.log('');

    if (response.data?.Status === 1 && response.data?.TokenId) {
      tokenId = response.data.TokenId;
      console.log('✅ SUCCESS: Authentication worked!\n');
      return true;
    } else {
      console.log('❌ FAILED: Authentication returned non-success status\n');
      console.log('Full Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('  HTTP Status:', error.response?.status);
    console.log('  Response:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

/**
 * 2. Test Country List (with TokenId)
 */
async function testCountryList() {
  if (!tokenId) {
    console.log('⏭️  Skipping Country List test (no TokenId)\n');
    return false;
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: COUNTRY LIST (with TokenId)');
  console.log('='.repeat(60) + '\n');

  const request = {
    ClientId: config.clientId,
    TokenId: tokenId,
    EndUserIp: config.endUserIp
  };

  console.log('📤 Request:');
  console.log('  URL:', config.staticBase + 'CountryList');
  console.log('  TokenId:', tokenId.substring(0, 20) + '...');
  console.log('');

  try {
    const response = await axios.post(config.staticBase + 'CountryList', request, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      },
      timeout: 15000
    });

    console.log('📥 Response:');
    console.log('  HTTP Status:', response.status);
    console.log('  Status:', response.data?.Status);
    console.log('  Country Count:', response.data?.Countries?.length || 0);
    console.log('  Error:', response.data?.Error?.ErrorMessage || 'None');
    console.log('');

    if (response.data?.Status === 1) {
      const countries = response.data?.Countries || [];
      console.log('Sample Countries:');
      countries.slice(0, 5).forEach(c => {
        console.log(`  - ${c.Name} (${c.Code})`);
      });
      console.log('\n✅ SUCCESS: Country List retrieved!\n');
      return true;
    } else {
      console.log('❌ FAILED:', response.data?.Error?.ErrorMessage);
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('  Response:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

/**
 * 3. Test City List (with TokenId)
 */
async function testCityList() {
  if (!tokenId) {
    console.log('⏭️  Skipping City List test (no TokenId)\n');
    return false;
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: CITY LIST for UAE (with TokenId)');
  console.log('='.repeat(60) + '\n');

  const request = {
    ClientId: config.clientId,
    TokenId: tokenId,
    EndUserIp: config.endUserIp,
    CountryCode: 'AE'
  };

  console.log('📤 Request:');
  console.log('  URL:', config.staticBase + 'DestinationCityList');
  console.log('  CountryCode: AE');
  console.log('  TokenId:', tokenId.substring(0, 20) + '...');
  console.log('');

  try {
    const response = await axios.post(config.staticBase + 'DestinationCityList', request, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      },
      timeout: 15000
    });

    console.log('📥 Response:');
    console.log('  HTTP Status:', response.status);
    console.log('  Status:', response.data?.Status);
    console.log('  City Count:', response.data?.Cities?.length || 0);
    console.log('  Error:', response.data?.Error?.ErrorMessage || 'None');
    console.log('');

    if (response.data?.Status === 1) {
      const cities = response.data?.Cities || [];
      console.log('UAE Cities:');
      cities.slice(0, 10).forEach(c => {
        console.log(`  - ${c.Name} (ID: ${c.Id || c.Code})`);
      });
      console.log('\n✅ SUCCESS: City List retrieved!\n');
      return cities;
    } else {
      console.log('❌ FAILED:', response.data?.Error?.ErrorMessage);
      return [];
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('  Response:', JSON.stringify(error.response?.data, null, 2));
    return [];
  }
}

/**
 * 4. Test Hotel Search (with TokenId)
 */
async function testHotelSearch(cities) {
  if (!tokenId) {
    console.log('⏭️  Skipping Hotel Search test (no TokenId)\n');
    return false;
  }

  if (!cities || cities.length === 0) {
    console.log('⏭️  Skipping Hotel Search test (no cities)\n');
    return false;
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: HOTEL SEARCH in Dubai (with TokenId)');
  console.log('='.repeat(60) + '\n');

  // Find Dubai
  const dubai = cities.find(c => c.Name.toLowerCase().includes('dubai'));
  if (!dubai) {
    console.log('❌ Dubai not found in city list');
    return false;
  }

  const cityId = dubai.Id || dubai.Code;
  const checkInDate = '15/12/2025';
  const checkOutDate = new Date('2025-12-18');
  const checkInDateObj = new Date('2025-12-15');
  const noOfNights = Math.ceil((checkOutDate - checkInDateObj) / (1000 * 60 * 60 * 24));

  const searchRequest = {
    EndUserIp: config.endUserIp,
    TokenId: tokenId,
    CheckInDate: checkInDate,
    NoOfNights: noOfNights,
    CountryCode: 'AE',
    CityId: parseInt(cityId),
    PreferredCurrency: 'INR',
    GuestNationality: 'IN',
    NoOfRooms: 1,
    RoomGuests: [
      {
        NoOfAdults: 2,
        NoOfChild: 0,
        ChildAge: []
      }
    ]
  };

  console.log('📤 Request:');
  console.log('  URL:', config.searchBase + 'Search');
  console.log('  City: Dubai (ID:', cityId + ')');
  console.log('  Check-in:', checkInDate);
  console.log('  Nights:', noOfNights);
  console.log('  Rooms: 1 (2 adults)');
  console.log('  TokenId:', tokenId.substring(0, 20) + '...');
  console.log('');
  console.log('Full Request:', JSON.stringify({...searchRequest, TokenId: 'HIDDEN'}, null, 2));
  console.log('');

  try {
    const response = await axios.post(config.searchBase + 'Search', searchRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      },
      timeout: 30000
    });

    console.log('📥 Response:');
    console.log('  HTTP Status:', response.status);
    console.log('  ResponseStatus:', response.data?.ResponseStatus);
    console.log('  Hotel Count:', response.data?.HotelResults?.length || 0);
    console.log('  TraceId:', response.data?.TraceId ? 'PRESENT' : 'MISSING');
    console.log('  Error Code:', response.data?.Error?.ErrorCode);
    console.log('  Error Message:', response.data?.Error?.ErrorMessage);
    console.log('');

    if (response.data?.ResponseStatus === 1 && response.data?.HotelResults?.length > 0) {
      console.log('✅ SUCCESS: Hotels found!\n');
      console.log('Sample Hotels:');
      response.data.HotelResults.slice(0, 3).forEach((h, i) => {
        console.log(`\n${i + 1}. ${h.HotelName}`);
        console.log(`   Code: ${h.HotelCode}`);
        console.log(`   Stars: ${h.StarRating}`);
        console.log(`   Price: ${h.Price?.OfferedPrice} ${h.Price?.CurrencyCode}`);
      });
      console.log('');
      return true;
    } else {
      console.log('❌ FAILED: No hotels or non-success status');
      console.log('Full Response:', JSON.stringify(response.data, null, 2).substring(0, 1000));
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('  HTTP Status:', error.response?.status);
    console.log('  Response:', JSON.stringify(error.response?.data, null, 2).substring(0, 1000));
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '█'.repeat(60));
  console.log('TBO UNIVERSAL JSON HOTEL API - COMPLETE PIPELINE TEST');
  console.log('█'.repeat(60));

  const results = {
    auth: false,
    countries: false,
    cities: false,
    search: false
  };

  // Test 1: Authentication
  results.auth = await testAuthentication();
  if (!results.auth) {
    console.log('\n❌ Authentication failed - stopping tests\n');
    printSummary(results);
    return;
  }

  // Test 2: Country List
  results.countries = await testCountryList();

  // Test 3: City List
  const cities = await testCityList();
  results.cities = cities && cities.length > 0;

  // Test 4: Hotel Search
  results.search = await testHotelSearch(cities);

  // Summary
  printSummary(results);
}

function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  console.log('1. Authentication:', results.auth ? '✅ PASS' : '❌ FAIL');
  console.log('2. Country List:', results.countries ? '✅ PASS' : '❌ FAIL');
  console.log('3. City List:', results.cities ? '✅ PASS' : '❌ FAIL');
  console.log('4. Hotel Search:', results.search ? '✅ PASS' : '❌ FAIL');

  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;

  console.log('');
  console.log(`Overall: ${passCount}/${totalCount} tests passed`);
  console.log('');

  if (passCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED - TBO Integration is working!\n');
  } else {
    console.log('⚠️  Some tests failed - check errors above\n');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
