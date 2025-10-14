#!/usr/bin/env node

/**
 * Reset RateHawk Circuit Breaker
 * Forces circuit breaker to CLOSED state
 */

const https = require('https');

const API_BASE = 'https://builder-faredown-pricing.onrender.com';
const ADMIN_KEY = '8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1';

console.log('🔧 Resetting RateHawk Circuit Breaker...\n');

// Test RateHawk hotel search to reset circuit breaker
const searchParams = new URLSearchParams({
  destination: 'Dubai',
  checkIn: '2025-12-01',
  checkOut: '2025-12-05',
  rooms: JSON.stringify([{ adults: 2, children: 0 }]),
  currency: 'USD'
});

const options = {
  hostname: 'builder-faredown-pricing.onrender.com',
  path: `/api/hotels/search?${searchParams}`,
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      console.log(`Status: ${res.statusCode}`);
      
      if (json.meta && json.meta.suppliers) {
        console.log('\n📊 Supplier Status:');
        Object.entries(json.meta.suppliers).forEach(([supplier, metrics]) => {
          const status = metrics.success ? '✅' : '❌';
          console.log(`  ${status} ${supplier}:`);
          console.log(`     Success: ${metrics.success}`);
          console.log(`     Results: ${metrics.resultCount || 0}`);
          if (metrics.error) {
            console.log(`     Error: ${metrics.error}`);
          }
        });
        
        // Check RateHawk specifically
        if (json.meta.suppliers.RATEHAWK) {
          const rh = json.meta.suppliers.RATEHAWK;
          if (rh.success) {
            console.log('\n✅ RateHawk Circuit Breaker RESET SUCCESSFUL!');
            process.exit(0);
          } else {
            console.log('\n❌ RateHawk still failing:', rh.error);
            console.log('\nTroubleshooting steps:');
            console.log('1. Check environment variables:');
            console.log('   RATEHAWK_API_ID=3635');
            console.log('   RATEHAWK_API_KEY=d020d57a-b31d-4696-bc9a-3b90dc84239f');
            console.log('   RATEHAWK_BASE_URL=https://api.worldota.net/api/b2b/v3/');
            console.log('2. Restart Render service to reload env vars');
            console.log('3. Verify RateHawk API credentials are valid');
            process.exit(1);
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      console.log('Raw response:', data.substring(0, 500));
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.end();
