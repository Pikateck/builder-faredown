const http = require('http');

// Test admin user endpoints
async function testAdminUserEndpoints() {
  console.log('🧪 Testing Admin User Management Endpoints...\n');
  
  // Test 1: Get users endpoint
  console.log('1️⃣ Testing GET /api/admin/users');
  await testApiCall('/api/admin/users?page=1&limit=10');
  
  // Test 2: Get user stats endpoint
  console.log('\n2️⃣ Testing GET /api/admin/users/stats');
  await testApiCall('/api/admin/users/stats');
  
  console.log('\n✅ Admin user endpoints test completed!');
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
            if (response.data && response.data.users) {
              console.log(`👥 Users found: ${response.data.users.length}`);
              response.data.users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.role})`);
              });
              console.log(`📊 Total: ${response.data.total || 'unknown'}`);
            } else if (response.data && typeof response.data === 'object') {
              console.log(`📋 Data: ${JSON.stringify(response.data, null, 2)}`);
            } else {
              console.log(`✅ Success: ${response.message || 'OK'}`);
            }
          } else {
            console.log(`❌ Error: ${response.message || 'Unknown error'}`);
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

testAdminUserEndpoints().catch(console.error);
