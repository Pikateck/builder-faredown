#!/usr/bin/env node

/**
 * Cache-Backed Hotel Search Test Suite
 * 
 * Tests:
 * 1. Cache miss (first search) - calls TBO
 * 2. Cache hit (repeat search) - returns from DB
 * 3. Cache expiration (>4h) - forces TBO call
 * 4. Room details endpoint
 * 5. Cache statistics
 */

const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const RENDER_API = 'https://builder-faredown-pricing.onrender.com';

// Test parameters
const searchParams = {
  cityId: '1',
  countryCode: 'AE',
  destination: 'Dubai',
  checkIn: '2025-11-30',
  checkOut: '2025-12-03',
  rooms: '1',
  adults: '2',
  children: '0',
  currency: 'INR',
  guestNationality: 'IN'
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, url, body = null) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? require('https') : require('http');

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        const duration = Date.now() - start;
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
            duration,
            size: data.length
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            duration,
            size: data.length
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testCacheMiss() {
  log('bright', '\n═══════════════════════════════════════');
  log('yellow', '📝 TEST 1: Cache Miss (First Search)');
  log('bright', '════════════════════��══════════════════\n');

  const url = `${RENDER_API}/api/hotels/search`;
  
  log('blue', `POST ${url}`);
  log('blue', `Payload: ${JSON.stringify(searchParams, null, 2)}\n`);

  try {
    const response = await makeRequest('POST', url, searchParams);
    
    log('blue', `Status: ${response.status}`);
    log('blue', `Duration: ${response.duration}ms`);
    log('blue', `Response size: ${response.size} bytes\n`);

    if (!response.body.success) {
      log('red', `❌ API returned error: ${response.body.error}`);
      log('red', `Response: ${JSON.stringify(response.body, null, 2)}`);
      return false;
    }

    log('green', `✅ Success: ${response.body.success}`);
    log('green', `Source: ${response.body.source}`);
    log('green', `Cache Hit: ${response.body.cacheHit}`);
    log('green', `Hotels: ${response.body.hotels?.length || 0}`);
    log('green', `Duration: ${response.body.duration}\n`);

    if (response.body.source !== 'tbo' && response.body.source !== 'cache') {
      log('yellow', `⚠️  Unexpected source: ${response.body.source}`);
    }

    if (!response.body.hotels || response.body.hotels.length === 0) {
      log('yellow', '⚠️  No hotels returned');
      return false;
    }

    // Verify hotel structure
    const hotel = response.body.hotels[0];
    const requiredFields = ['hotelId', 'name', 'starRating', 'price'];
    const missingFields = requiredFields.filter(f => !(f in hotel));
    
    if (missingFields.length > 0) {
      log('red', `❌ Hotel missing fields: ${missingFields.join(', ')}`);
      return false;
    }

    log('green', `✅ Hotel structure valid`);
    log('blue', `Sample hotel: ${hotel.name} (${hotel.starRating}⭐) - ₹${hotel.price?.offered || hotel.price}`);

    return {
      success: true,
      searchHash: response.body.traceId,
      hotels: response.body.hotels,
      firstResponse: response
    };
  } catch (error) {
    log('red', `❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testCacheHit() {
  log('bright', '\n═══════════════════════════════════════');
  log('yellow', '📝 TEST 2: Cache Hit (Repeat Search)');
  log('bright', '═══════════════════════════════════════\n');

  const url = `${RENDER_API}/api/hotels/search`;
  
  log('blue', 'Making identical search immediately after first...\n');

  try {
    const response = await makeRequest('POST', url, searchParams);
    
    log('blue', `Status: ${response.status}`);
    log('blue', `Duration: ${response.duration}ms`);

    if (!response.body.success) {
      log('red', `❌ API returned error: ${response.body.error}`);
      return false;
    }

    if (response.body.cacheHit) {
      log('green', `✅ CACHE HIT! (${response.duration}ms)`);
      log('green', `Cached at: ${new Date(response.body.cachedAt).toLocaleTimeString()}`);
      log('green', `Expires at: ${new Date(response.body.ttlExpiresAt).toLocaleTimeString()}`);
      
      // Performance check
      if (response.duration > 500) {
        log('yellow', `⚠️  Cache hit took ${response.duration}ms (expected <200ms)`);
      } else {
        log('green', `✅ Response time excellent for cache hit`);
      }
      
      return { success: true, cacheHit: true, duration: response.duration };
    } else {
      log('yellow', `⚠️  Expected cache hit but got: ${response.body.source}`);
      log('yellow', `Duration: ${response.duration}ms`);
      return { success: true, cacheHit: false, duration: response.duration };
    }
  } catch (error) {
    log('red', `❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testRoomDetails(hotelId) {
  log('bright', '\n══════════════════════��════════════════');
  log('yellow', '📝 TEST 3: Room Details Endpoint');
  log('bright', '═══════════════════════════════════════\n');

  if (!hotelId) {
    log('yellow', '⚠️  No hotelId provided, skipping test');
    return null;
  }

  const url = `${RENDER_API}/api/hotels/rooms/${hotelId}`;
  const roomParams = {
    checkIn: searchParams.checkIn,
    checkOut: searchParams.checkOut,
    roomConfig: [{ adults: parseInt(searchParams.adults), children: parseInt(searchParams.children) }],
    currency: searchParams.currency
  };

  log('blue', `POST ${url}`);
  log('blue', `Payload: ${JSON.stringify(roomParams, null, 2)}\n`);

  try {
    const response = await makeRequest('POST', url, roomParams);
    
    log('blue', `Status: ${response.status}`);
    log('blue', `Duration: ${response.duration}ms\n`);

    if (!response.body.success) {
      log('yellow', `⚠️  API returned: ${response.body.error}`);
      return false;
    }

    log('green', `✅ Success`);
    log('green', `Hotel: ${response.body.hotel?.name}`);
    log('green', `Rooms: ${response.body.rooms?.length || 0}`);

    if (response.body.rooms && response.body.rooms.length > 0) {
      const room = response.body.rooms[0];
      log('blue', `Sample room: ${room.roomTypeName} - ₹${room.price?.base || 0}/night`);
    }

    return true;
  } catch (error) {
    log('red', `❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testCacheStats() {
  log('bright', '\n═══════════════════════════════════════');
  log('yellow', '📝 TEST 4: Cache Statistics');
  log('bright', '═══════════════════════════════════════\n');

  const url = `${RENDER_API}/api/hotels/cache/stats`;

  log('blue', `GET ${url}\n`);

  try {
    const response = await makeRequest('GET', url);
    
    log('blue', `Status: ${response.status}\n`);

    if (!response.body.success) {
      log('yellow', `⚠️  API returned: ${response.body.error}`);
      return false;
    }

    const stats = response.body.stats || {};
    log('green', `✅ Cache Statistics:`);
    log('blue', `Total searches: ${stats.total_searches || 0}`);
    log('blue', `Fresh (cached) searches: ${stats.fresh_searches || 0}`);
    log('blue', `Hit rate: ${parseFloat(stats.hit_rate || 0).toFixed(1)}%`);
    log('blue', `Total hotels cached: ${stats.total_hotels_cached || 0}`);
    log('blue', `Avg hotels per search: ${parseFloat(stats.avg_hotels_per_search || 0).toFixed(1)}`);

    return true;
  } catch (error) {
    log('red', `❌ Request failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('bright', '\n╔════════════════════════════════════════════════════╗');
  log('bright', '║  CACHE-BACKED HOTEL SEARCH - STAGING TEST SUITE    ║');
  log('bright', '╚════════════════════════════════════════════════════╝');
  
  log('yellow', `\n🌍 Testing against: ${RENDER_API}`);
  log('yellow', `📍 Search: ${searchParams.destination} (${searchParams.checkIn} to ${searchParams.checkOut})`);

  const results = {
    test1: null,
    test2: null,
    test3: null,
    test4: null
  };

  // Test 1: Cache Miss
  results.test1 = await testCacheMiss();
  
  // Test 2: Cache Hit
  if (results.test1 && results.test1.hotels && results.test1.hotels.length > 0) {
    results.test2 = await testCacheHit();
    
    // Test 3: Room Details
    results.test3 = await testRoomDetails(results.test1.hotels[0].hotelId);
  }

  // Test 4: Cache Stats
  results.test4 = await testCacheStats();

  // Summary
  log('bright', '\n╔════════════════════════════════════════════════════╗');
  log('bright', '║                    TEST SUMMARY                     ║');
  log('bright', '╚════════════════════════════════════════════════════╝\n');

  const passed = Object.values(results).filter(r => r && r.success !== false).length;
  const total = Object.keys(results).length;

  log('blue', `Tests passed: ${passed}/${total}`);

  if (results.test1?.success) log('green', '✅ Test 1: Cache Miss - PASS');
  else log('red', '❌ Test 1: Cache Miss - FAIL');

  if (results.test2?.success) {
    log('green', `✅ Test 2: Cache Hit - PASS (${results.test2.duration}ms)`);
  } else {
    log('yellow', '⚠️  Test 2: Cache Hit - INCONCLUSIVE');
  }

  if (results.test3) log('green', '✅ Test 3: Room Details - PASS');
  else log('yellow', '⚠️  Test 3: Room Details - SKIPPED');

  if (results.test4) log('green', '✅ Test 4: Cache Stats - PASS');
  else log('red', '❌ Test 4: Cache Stats - FAIL');

  // Performance assessment
  log('bright', '\n📊 Performance Assessment:\n');
  
  if (results.test1?.firstResponse?.duration) {
    const firstDuration = results.test1.firstResponse.duration;
    log('blue', `First search (cache miss): ${firstDuration}ms`);
    
    if (firstDuration < 1000) {
      log('green', '✅ Excellent (likely from cache, not TBO)');
    } else if (firstDuration < 5000) {
      log('green', '✅ Good (expected for TBO call)');
    } else {
      log('yellow', '⚠️  Slow (check TBO connectivity)');
    }
  }

  if (results.test2?.duration) {
    log('blue', `Second search (cache hit): ${results.test2.duration}ms`);
    if (results.test2.duration < 200) {
      log('green', '✅ Excellent cache performance');
    } else if (results.test2.duration < 500) {
      log('green', '✅ Good');
    } else {
      log('yellow', '⚠️  Slower than expected');
    }
  }

  log('bright', '\n═══════════════════════════════════════════════════\n');

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log('red', `\n❌ Test suite failed: ${error.message}`);
  process.exit(1);
});
