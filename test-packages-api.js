/**
 * Test script to verify packages API endpoint
 */

const API_BASE_URL = 'https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api';

async function testPackagesAPI() {
  console.log('🧪 Testing Packages API...');
  
  try {
    // Test 1: Basic packages list
    console.log('\n1. Testing /api/packages endpoint...');
    const response = await fetch(`${API_BASE_URL}/packages`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Packages API is working!');
      console.log(`Found ${data.data?.packages?.length || 0} packages`);
    } else {
      console.log('❌ Packages API returned an error');
    }
    
    // Test 2: API root endpoint to check if packages is listed
    console.log('\n2. Testing API root endpoint...');
    const rootResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/`);
    const rootData = await rootResponse.json();
    
    if (rootData.endpoints?.packages) {
      console.log('✅ Packages endpoint is documented in API root');
    } else {
      console.log('❌ Packages endpoint not found in API documentation');
    }
    
  } catch (error) {
    console.error('❌ Error testing packages API:', error.message);
  }
}

// Run the test
testPackagesAPI();
