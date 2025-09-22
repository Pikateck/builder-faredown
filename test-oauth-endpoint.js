// Simple test script to verify OAuth endpoint accessibility
const testOAuthEndpoint = async () => {
  try {
    console.log('🔍 Testing OAuth endpoint...');
    
    // Test the proxy endpoint directly
    const response = await fetch('https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/oauth/google/url', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OAuth endpoint working!');
      console.log('Response data:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ OAuth endpoint failed:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing OAuth endpoint:', error.message);
    return false;
  }
};

// For browser console testing
if (typeof window !== 'undefined') {
  window.testOAuth = testOAuthEndpoint;
  console.log('🧪 OAuth test function loaded. Run: testOAuth()');
} else {
  // Node.js environment
  testOAuthEndpoint();
}
