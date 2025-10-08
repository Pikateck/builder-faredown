const https = require('https');

const API_BASE_URL = 'https://builder-faredown-pricing.onrender.com';

async function registerUser() {
  const userData = {
    email: 'zubin0478@gmail.com',
    password: 'Pkfd@0405#',
    firstName: 'Zubin',
    lastName: 'Aibara',
    role: 'user'
  };

  const postData = JSON.stringify(userData);

  const options = {
    hostname: 'builder-faredown-pricing.onrender.com',
    port: 443,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    console.log('📝 Registering user:', {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName
    });

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n✅ Response Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log('\n📋 Response Body:');
          console.log(JSON.stringify(response, null, 2));
          resolve(response);
        } catch (e) {
          console.error('❌ Failed to parse response:', data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function checkUserInDatabase() {
  const options = {
    hostname: 'builder-faredown-pricing.onrender.com',
    port: 443,
    path: '/api/admin/users?search=zubin0478@gmail.com&limit=10',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': 'admin123'
    }
  };

  return new Promise((resolve, reject) => {
    console.log('\n🔍 Checking user in database via Admin API...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n✅ Admin API Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log('\n📋 Admin API Response:');
          console.log(JSON.stringify(response, null, 2));
          
          if (response.users && response.users.length > 0) {
            console.log('\n✅ User found in database!');
            console.log('User details:', {
              id: response.users[0].id,
              email: response.users[0].email,
              name: `${response.users[0].firstName} ${response.users[0].lastName}`,
              status: response.users[0].status,
              isVerified: response.users[0].isVerified
            });
          } else {
            console.log('\n❌ User not found in database');
          }
          resolve(response);
        } catch (e) {
          console.error('❌ Failed to parse response:', data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function runTest() {
  console.log('🧪 Starting User Registration Test\n');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Register user
    const registerResponse = await registerUser();
    
    if (registerResponse.success) {
      console.log('\n✅ Registration successful!');
      console.log('📧 Verification email should be sent to: zubin0478@gmail.com');
    } else {
      console.log('\n❌ Registration failed:', registerResponse.message);
    }

    // Wait a bit for database write
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Check user in database
    await checkUserInDatabase();

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Test completed!');
    console.log('\nNext steps:');
    console.log('1. Check email (zubin0478@gmail.com) for verification link');
    console.log('2. Click verification link to activate account');
    console.log('3. Check Admin Panel User Management to see user');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
