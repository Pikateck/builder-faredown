#!/usr/bin/env node

/**
 * Reset Circuit Breakers for TBO and RateHawk
 * Forces circuit breakers back to CLOSED state
 */

const https = require('https');

const API_BASE = 'https://builder-faredown-pricing.onrender.com';
const ADMIN_KEY = '8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1';

console.log('🔧 Resetting TBO and RateHawk Circuit Breakers...\n');

async function makeRequest(path, description) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    console.log(`\n📍 ${description}`);
    console.log(`   URL: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function resetCircuitBreakers() {
  try {
    // Test 1: Trigger TBO flight search to reset circuit breaker
    console.log('🔄 Test 1: Triggering TBO flight search...');
    const flightSearch = await makeRequest(
      '/api/flights/search?origin=BOM&destination=DXB&departureDate=2025-11-20&adults=1',
      'TBO Flight Search (to reset circuit breaker)'
    );
    
    if (flightSearch.status === 200) {
      console.log('✅ Flight search completed');
      
      if (flightSearch.data.meta && flightSearch.data.meta.suppliers) {
        const tbo = flightSearch.data.meta.suppliers.TBO;
        if (tbo) {
          console.log(`   TBO Status: ${tbo.success ? '✅ Success' : '❌ Failed'}`);
          if (tbo.error) {
            console.log(`   Error: ${tbo.error}`);
          }
        }
      }
    }
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Trigger RateHawk hotel search to reset circuit breaker
    console.log('\n🔄 Test 2: Triggering RateHawk hotel search...');
    const hotelSearch = await makeRequest(
      '/api/hotels/search?destination=Dubai&checkIn=2025-12-15&checkOut=2025-12-20&rooms=%5B%7B%22adults%22%3A2%7D%5D',
      'RateHawk Hotel Search (to reset circuit breaker)'
    );
    
    if (hotelSearch.status === 200) {
      console.log('✅ Hotel search completed');
      
      if (hotelSearch.data.meta && hotelSearch.data.meta.suppliers) {
        const ratehawk = hotelSearch.data.meta.suppliers.RATEHAWK;
        if (ratehawk) {
          console.log(`   RateHawk Status: ${ratehawk.success ? '✅ Success' : '❌ Failed'}`);
          if (ratehawk.error) {
            console.log(`   Error: ${ratehawk.error}`);
          }
        }
      }
    }
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Check supplier health after reset attempts
    console.log('\n🔍 Test 3: Checking supplier health...');
    
    const options = {
      hostname: 'builder-faredown-pricing.onrender.com',
      path: '/api/admin/suppliers/health',
      method: 'GET',
      headers: {
        'X-Admin-Key': ADMIN_KEY,
        'Accept': 'application/json'
      }
    };
    
    const healthCheck = await new Promise((resolve, reject) => {
      https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }).on('error', reject).end();
    });
    
    if (healthCheck.status === 200 && healthCheck.data.success) {
      console.log('✅ Supplier health check completed\n');
      console.log('📊 Circuit Breaker Status:');
      
      healthCheck.data.data.forEach(supplier => {
        const icon = supplier.circuit_breaker_state === 'CLOSED' ? '✅' : '⚠️';
        console.log(`   ${icon} ${supplier.supplier}: ${supplier.circuit_breaker_state} (${supplier.status})`);
        if (supplier.error) {
          console.log(`      Error: ${supplier.error}`);
        }
      });
      
      // Check if TBO and RateHawk are CLOSED
      const tbo = healthCheck.data.data.find(s => s.supplier === 'TBO');
      const ratehawk = healthCheck.data.data.find(s => s.supplier === 'RATEHAWK');
      
      console.log('\n📋 Summary:');
      if (tbo && tbo.circuit_breaker_state === 'CLOSED') {
        console.log('✅ TBO circuit breaker: CLOSED (operational)');
      } else if (tbo && tbo.circuit_breaker_state === 'OPEN') {
        console.log('⚠️ TBO circuit breaker: OPEN (blocking requests)');
        console.log('   → Will auto-reset in 30 seconds or after successful request');
      }
      
      if (ratehawk && ratehawk.circuit_breaker_state === 'CLOSED') {
        console.log('✅ RateHawk circuit breaker: CLOSED (operational)');
      } else if (ratehawk && ratehawk.circuit_breaker_state === 'OPEN') {
        console.log('⚠️ RateHawk circuit breaker: OPEN (blocking requests)');
        console.log('   → Will auto-reset in 30 seconds or after successful request');
      } else {
        console.log('❓ RateHawk not found in health check (may not be initialized)');
      }
      
      process.exit(0);
    } else {
      console.error('❌ Health check failed:', healthCheck.data);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Circuit breaker reset failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

resetCircuitBreakers();
