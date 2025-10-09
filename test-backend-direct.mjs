const ADMIN_KEY = '8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1';
const API_BASE = 'https://builder-faredown-pricing.onrender.com/api';

async function testBackend() {
  console.log('🔍 Testing Backend API Directly...\n');
  
  // Test 1: Health check
  try {
    console.log('1️⃣ Testing /api/health endpoint...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health check:', JSON.stringify(healthData, null, 2));
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Fetch users
  try {
    console.log('2️⃣ Testing /api/admin/users endpoint...');
    const usersRes = await fetch(`${API_BASE}/admin/users?limit=50`, {
      headers: {
        'X-Admin-Key': ADMIN_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', usersRes.status, usersRes.statusText);
    
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      console.log('✅ Users response:', JSON.stringify(usersData, null, 2));
      
      const users = usersData.users || usersData.data || [];
      console.log(`\n📊 Total users found: ${users.length}`);
      
      // Check if zubin0478@gmail.com exists
      const zubinUser = users.find(u => u.email === 'zubin0478@gmail.com');
      if (zubinUser) {
        console.log('\n✅ ZUBIN USER FOUND IN DATABASE:');
        console.log(JSON.stringify(zubinUser, null, 2));
      } else {
        console.log('\n⚠️ Zubin user (zubin0478@gmail.com) NOT found.');
        if (users.length > 0) {
          console.log('\nFirst 5 users in database:');
          users.slice(0, 5).forEach(u => {
            console.log(`  - ${u.email} (${u.firstName} ${u.lastName})`);
          });
        } else {
          console.log('\n❌ NO USERS IN DATABASE AT ALL');
        }
      }
    } else {
      const errorText = await usersRes.text();
      console.error('❌ Admin users failed:', errorText);
    }
  } catch (err) {
    console.error('❌ Admin users request failed:', err.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Try to register the user
  try {
    console.log('3️⃣ Testing user registration for zubin0478@gmail.com...');
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Zubin',
        lastName: 'Aibara',
        email: 'zubin0478@gmail.com',
        password: 'Pkfd@0405#'
      })
    });
    
    console.log('Status:', registerRes.status, registerRes.statusText);
    const registerData = await registerRes.json();
    console.log('Response:', JSON.stringify(registerData, null, 2));
    
    if (registerRes.status === 409 || registerData.message?.includes('already exists')) {
      console.log('\n✅ USER ALREADY EXISTS - Registration worked before!');
    } else if (registerRes.status === 201 || registerRes.ok) {
      console.log('\n✅ USER CREATED SUCCESSFULLY');
    } else {
      console.log('\n❌ Registration failed with status:', registerRes.status);
    }
  } catch (err) {
    console.error('❌ Registration test failed:', err.message);
  }
}

testBackend().catch(console.error);
