const http = require('http');

// Test URL for Dubai packages
const queryParams = new URLSearchParams({
  destination: 'Dubai, United Arab Emirates',
  destination_type: 'city',
  page: '1',
  page_size: '20'
});

const options = {
  hostname: 'localhost',
  port: 8000,
  path: `/api/packages?${queryParams.toString()}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
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
      
      if (response.data && response.data.packages) {
        console.log('📦 Packages found:', response.data.packages.length);
        response.data.packages.forEach((pkg, index) => {
          console.log(`  ${index + 1}. ${pkg.title} - ${pkg.base_price_pp} ${pkg.currency || 'USD'}`);
        });
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.end();
