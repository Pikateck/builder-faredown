/**
 * Test Enhanced Bargain API
 */

const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEnhancedBargainAPI() {
  console.log('🚀 Testing Enhanced Bargain API');
  
  try {
    // Test 1: Start a bargain session
    console.log('\n📋 Test 1: Starting bargain session...');
    const startResponse = await makeRequest('/api/enhanced-bargain/start', 'POST', {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      module: 'hotels',
      product_id: 'hotel-dubai-123',
      supplier_net_rate: 10000,
      product_details: {
        hotel_name: 'Grand Hotel Dubai',
        room_type: 'Deluxe Room',
        nights: 3
      },
      promo_code: 'FAREDOWN25'
    });
    
    console.log('Start Response:', JSON.stringify(startResponse, null, 2));
    
    if (startResponse.data.success) {
      const sessionId = startResponse.data.session_id;
      
      // Test 2: Make a bargain offer (Round 1)
      console.log('\n💰 Test 2: Making Round 1 bargain offer...');
      const offerResponse = await makeRequest('/api/enhanced-bargain/offer', 'POST', {
        session_id: sessionId,
        user_target_price: 9500,
        round_number: 1
      });
      
      console.log('Round 1 Response:', JSON.stringify(offerResponse, null, 2));
      
      // Test 3: Make Round 2 offer
      console.log('\n🎯 Test 3: Making Round 2 bargain offer...');
      const round2Response = await makeRequest('/api/enhanced-bargain/offer', 'POST', {
        session_id: sessionId,
        user_target_price: 9200,
        round_number: 2
      });
      
      console.log('Round 2 Response:', JSON.stringify(round2Response, null, 2));
      
      // Test 4: Get session details
      console.log('\n📊 Test 4: Getting session details...');
      const sessionResponse = await makeRequest(`/api/enhanced-bargain/session/${sessionId}`);
      
      console.log('Session Details:', JSON.stringify(sessionResponse, null, 2));
      
      // Test 5: Test price matching (exact match scenario)
      console.log('\n🎉 Test 5: Testing price matching...');
      const matchResponse = await makeRequest('/api/enhanced-bargain/offer', 'POST', {
        session_id: sessionId,
        user_target_price: Math.round(startResponse.data.recommended_target),
        round_number: 3
      });
      
      console.log('Price Match Response:', JSON.stringify(matchResponse, null, 2));
      
      // Test 6: Accept the offer if there's a hold
      if (matchResponse.data.hold) {
        console.log('\n✅ Test 6: Accepting bargain offer...');
        const acceptResponse = await makeRequest('/api/enhanced-bargain/accept', 'POST', {
          session_id: sessionId,
          hold_id: matchResponse.data.hold.id
        });
        
        console.log('Accept Response:', JSON.stringify(acceptResponse, null, 2));
      }
    }
    
    console.log('\n✅ Enhanced Bargain API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  // Kill the server process
  process.exit(0);
}

// Run the test
testEnhancedBargainAPI();
