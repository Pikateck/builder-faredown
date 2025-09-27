const http = require('http');

// Test admin packages endpoints
async function testAdminPackageEndpoints() {
  console.log('🧪 Testing Admin Package Management Endpoints...\n');
  
  // Test 1: Get packages endpoint
  console.log('1️⃣ Testing GET /api/admin/packages');
  await testApiCall('/api/admin/packages?page=1&page_size=10');
  
  // Test 2: Get package stats endpoint
  console.log('\n2️⃣ Testing GET /api/admin/packages/stats');
  await testApiCall('/api/admin/packages/stats');
  
  console.log('\n✅ Admin package endpoints test completed!');
}

async function testApiCall(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': 'admin123', // Add admin key for testing
      }
    };

    console.log(`📡 Request: ${path}`);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          
          if (response.success) {
            if (response.data && response.data.packages) {
              console.log(`📦 Packages found: ${response.data.packages.length}`);
              response.data.packages.forEach((pkg, index) => {
                console.log(`   ${index + 1}. ${pkg.title} (${pkg.category || 'N/A'})`);
              });
              console.log(`📊 Total: ${response.data.pagination?.total || 'unknown'}`);
            } else if (response.data && typeof response.data === 'object') {
              console.log(`📋 Data: ${JSON.stringify(response.data, null, 2)}`);
            } else {
              console.log(`✅ Success: ${response.message || 'OK'}`);
            }
          } else {
            console.log(`❌ Error: ${response.message || response.error || 'Unknown error'}`);
          }
          resolve(response);
        } catch (error) {
          console.error(`❌ JSON Parse Error: ${error.message}`);
          console.log(`Raw response: ${data}`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request Error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

testAdminPackageEndpoints().catch(console.error);
