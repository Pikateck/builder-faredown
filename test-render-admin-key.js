const https = require('https');

const options = {
  hostname: 'builder-faredown-pricing.onrender.com',
  path: '/api/admin/users?limit=1',
  method: 'GET',
  headers: {
    'X-Admin-Key': '8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1',
    'Content-Type': 'application/json'
  },
  timeout: 10000
};

console.log('Testing Render API with admin key...');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Admin Key:', options.headers['X-Admin-Key'].substring(0, 20) + '...');

const req = https.request(options, (res) => {
  console.log('\nStatus Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 500 && parsed.message === 'Admin API key is not configured') {
        console.log('\n❌ RENDER MISSING ADMIN_API_KEY ENVIRONMENT VARIABLE!');
        console.log('You need to add ADMIN_API_KEY to Render environment variables');
      } else if (res.statusCode === 401) {
        console.log('\n❌ ADMIN KEY MISMATCH!');
        console.log('The ADMIN_API_KEY on Render does not match the frontend key');
      } else if (res.statusCode === 200) {
        console.log('\n✅ Admin API working correctly!');
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error.message);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
});

req.end();
