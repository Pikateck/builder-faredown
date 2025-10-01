#!/usr/bin/env node

/**
 * Simple test script to verify airport API integration
 * Tests the key functionality requested in the requirements
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-admin-token';

console.log('🧪 Testing Airport API Integration');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log('================================\n');

/**
 * Make HTTP request helper
 */
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = BASE_URL.startsWith('https://');
    const client = isHttps ? https : http;
    const url = new URL(path, BASE_URL);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Test cases
 */
async function runTests() {
  const tests = [
    {
      name: 'Health Check',
      path: '/api/admin/airports/health',
      expect: (result) => result.status === 200 && result.data.status === 'ok'
    },
    {
      name: 'Get All Airports (limit 5)',
      path: '/api/admin/airports?limit=5',
      expect: (result) => {
        return result.status === 200 && 
               Array.isArray(result.data.items) && 
               result.data.items.length <= 5 &&
               typeof result.data.total === 'number';
      }
    },
    {
      name: 'Search Dubai (q=dub)',
      path: '/api/admin/airports?q=dub&limit=10',
      expect: (result) => {
        return result.status === 200 && 
               Array.isArray(result.data.items) &&
               result.data.items.some(airport => 
                 airport.iata === 'DXB' || 
                 airport.name.toLowerCase().includes('dubai')
               );
      }
    },
    {
      name: 'Search Mumbai (q=bom)',
      path: '/api/admin/airports?q=bom&limit=10',
      expect: (result) => {
        return result.status === 200 && 
               Array.isArray(result.data.items) &&
               result.data.items.some(airport => 
                 airport.iata === 'BOM' || 
                 airport.name.toLowerCase().includes('mumbai')
               );
      }
    },
    {
      name: 'Search exact IATA (q=DXB)',
      path: '/api/admin/airports?q=DXB&limit=5',
      expect: (result) => {
        return result.status === 200 && 
               Array.isArray(result.data.items) &&
               result.data.items.some(airport => airport.iata === 'DXB');
      }
    },
    {
      name: 'Minimum Query Length (q=a)',
      path: '/api/admin/airports?q=a&limit=5',
      expect: (result) => {
        return result.status === 200 && 
               Array.isArray(result.data.items) &&
               result.data.items.length === 0 &&
               result.data.message && 
               result.data.message.includes('at least');
      }
    },
    {
      name: 'Limit Clamping (limit=500)',
      path: '/api/admin/airports?limit=500',
      expect: (result) => {
        return result.status === 200 && 
               result.data.limit <= 200; // Should be clamped to max
      }
    },
    {
      name: 'Negative Offset Rejection',
      path: '/api/admin/airports?offset=-1',
      expect: (result) => {
        return result.status === 400 && 
               result.data.error && 
               result.data.error.includes('offset');
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`   URL: ${test.path}`);
      
      const result = await makeRequest(test.path);
      const success = test.expect(result);
      
      if (success) {
        console.log(`   ✅ PASS`);
        passed++;
      } else {
        console.log(`   ❌ FAIL`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Data:`, JSON.stringify(result.data, null, 2));
        failed++;
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('================================');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { makeRequest, runTests };
