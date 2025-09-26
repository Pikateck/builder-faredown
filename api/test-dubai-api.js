/**
 * Test script to debug Dubai packages API
 */

const http = require('http');

function testDubaiAPI() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/packages?destination=Dubai%2C%20United%20Arab%20Emirates&destination_code=DXB&destination_type=city&departure_date=2025-10-01&return_date=2025-10-04&category=any&adults=2&children=0',
    method: 'GET'
  };

  console.log('🔍 Testing Dubai API call...');
  console.log('Path:', options.path);

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('🔍 Response Status:', res.statusCode);
    console.log('🔍 Full Response:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error testing Dubai API:', error.message);
  });

  req.end();
}

testDubaiAPI();
