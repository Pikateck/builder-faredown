const jwt = require('jsonwebtoken');
const http = require('http');

// Create a valid admin JWT token for testing
function createAdminToken() {
  const JWT_SECRET = process.env.JWT_SECRET || "faredown-secret-key-2025";
  
  const adminPayload = {
    id: "admin",
    firstName: "Admin",
    lastName: "User",
    email: "admin@faredown.com",
    role: "super_admin",
    department: "administration",
    permissions: ["all"], // Super admin has all permissions
  };

  return jwt.sign(adminPayload, JWT_SECRET, {
    expiresIn: "7d",
    issuer: "faredown-api",
    audience: "faredown-frontend",
  });
}

// Test admin user endpoints with valid authentication
async function testAdminUserEndpointsWithAuth() {
  console.log('🧪 Testing Admin User Management Endpoints with Valid Auth...\n');
  
  const adminToken = createAdminToken();
  console.log('🔑 Generated admin JWT token for testing');
  
  // Test 0: Test basic admin dashboard endpoint first
  console.log('\n0️⃣ Testing GET /api/admin/dashboard (basic admin test)');
  await testApiCallWithAuth('/api/admin/dashboard', adminToken);

  // Test 1: Get users endpoint
  console.log('\n1️⃣ Testing GET /api/admin/users');
  await testApiCallWithAuth('/api/admin/users?page=1&limit=10', adminToken);

  // Test 2: Get user stats endpoint
  console.log('\n2️⃣ Testing GET /api/admin/users/stats');
  await testApiCallWithAuth('/api/admin/users/stats', adminToken);
  
  console.log('\n✅ Admin user endpoints with auth test completed!');
}

async function testApiCallWithAuth(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${token}`,
      }
    };

    console.log(`📡 Request: ${path}`);
    console.log(`🔐 Auth: Bearer ${token.substring(0, 20)}...`);

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

testAdminUserEndpointsWithAuth().catch(console.error);
