#!/usr/bin/env node

const https = require('https');

// Test the exact same URL that the frontend is calling
const url = 'https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/packages?departure_date=2025-10-01&return_date=2025-10-05&category=any&adults=2&destination=London%2C+United+Kingdom&destination_code=LON&destination_type=city&page=1';

console.log('🔍 Testing API response structure...');
console.log('URL:', url);

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n📋 Response Structure:');
      console.log('- response.success:', response.success);
      console.log('- response.packages exists:', !!response.packages);
      console.log('- response.data exists:', !!response.data);
      console.log('- response.data.packages exists:', !!(response.data && response.data.packages));
      
      if (response.data && response.data.packages) {
        console.log('- response.data.packages.length:', response.data.packages.length);
        console.log('- First package:', {
          id: response.data.packages[0]?.id,
          title: response.data.packages[0]?.title,
          country: response.data.packages[0]?.country_name
        });
      }

      console.log('\n📄 Full Response (truncated):');
      console.log(JSON.stringify(response, null, 2).substring(0, 1000) + '...');
    } catch (e) {
      console.error('❌ JSON Parse Error:', e);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error('❌ Request Error:', e);
});
