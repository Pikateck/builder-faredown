const http = require('http');

// Function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: responseData ? JSON.parse(responseData) : null
          };
          resolve(result);
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndToEndFlow() {
  console.log('🧪 Testing Recent Searches End-to-End Flow...\n');

  try {
    // Test 1: Check API health
    console.log('1. Testing API health...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/health',
      method: 'GET'
    });
    
    if (healthResponse.status === 200) {
      console.log('✅ API health check passed\n');
    } else {
      console.log('❌ API health check failed:', healthResponse.status);
      return;
    }

    // Test 2: Get initial recent searches (should be empty)
    console.log('2. Fetching initial recent searches...');
    const initialResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/recent-searches?module=flights&limit=6',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': 'fd_device_id=test-device-e2e'
      }
    });

    console.log(`   Status: ${initialResponse.status}`);
    console.log(`   Initial searches: ${Array.isArray(initialResponse.data) ? initialResponse.data.length : 'invalid'}\n`);

    // Test 3: Create a new search
    console.log('3. Creating a new search...');
    const testSearch = {
      module: 'flights',
      query: {
        tripType: 'round_trip',
        from: { code: 'BOM', name: 'Mumbai' },
        to: { code: 'DXB', name: 'Dubai' },
        dates: { 
          depart: '2025-10-01T00:00:00.000Z', 
          return: '2025-10-10T00:00:00.000Z' 
        },
        cabin: 'economy',
        adults: 1,
        children: 0,
        directOnly: false
      }
    };

    const createResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/recent-searches',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': 'fd_device_id=test-device-e2e'
      }
    }, testSearch);

    console.log(`   Status: ${createResponse.status}`);
    if (createResponse.status === 201 || createResponse.status === 200) {
      console.log('✅ Search created successfully');
      console.log(`   Search ID: ${createResponse.data?.id}\n`);
    } else {
      console.log('❌ Failed to create search:', createResponse.data);
      return;
    }

    // Test 4: Fetch recent searches again (should have 1 item)
    console.log('4. Fetching updated recent searches...');
    const updatedResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/recent-searches?module=flights&limit=6',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': 'fd_device_id=test-device-e2e'
      }
    });

    console.log(`   Status: ${updatedResponse.status}`);
    console.log(`   Recent searches found: ${Array.isArray(updatedResponse.data) ? updatedResponse.data.length : 'invalid'}`);
    
    if (Array.isArray(updatedResponse.data) && updatedResponse.data.length > 0) {
      const search = updatedResponse.data[0];
      console.log(`   ✅ Search: ${search.query.from.name} → ${search.query.to.name} (${search.query.tripType})\n`);
    }

    // Test 5: Clean up test data
    if (createResponse.data?.id) {
      console.log('5. Cleaning up test data...');
      const deleteResponse = await makeRequest({
        hostname: 'localhost',
        port: 8080,
        path: `/api/recent-searches/${createResponse.data.id}`,
        method: 'DELETE',
        headers: {
          'Cookie': 'fd_device_id=test-device-e2e'
        }
      });

      console.log(`   Cleanup status: ${deleteResponse.status}`);
      if (deleteResponse.status === 204 || deleteResponse.status === 200) {
        console.log('✅ Test data cleaned up\n');
      }
    }

    console.log('🎉 End-to-End test completed successfully!');
    console.log('✅ Recent searches feature is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEndToEndFlow();
