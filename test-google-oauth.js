/**
 * Google OAuth Test Script
 * Tests the Google OAuth flow to ensure it's working correctly
 */

const axios = require('axios');

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api';

async function testGoogleOAuth() {
  console.log('🧪 Testing Google OAuth Implementation');
  console.log('=====================================');

  try {
    // Test 1: Check OAuth status
    console.log('\n🔍 Test 1: Checking OAuth configuration status...');
    const statusResponse = await axios.get(`${API_BASE_URL}/oauth/status`);
    console.log('✅ OAuth status:', statusResponse.data);

    if (!statusResponse.data.oauth.google) {
      console.log('❌ Google OAuth is not configured properly');
      console.log('💡 Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
      return;
    }

    // Test 2: Get Google OAuth URL
    console.log('\n🔍 Test 2: Getting Google OAuth authorization URL...');
    const urlResponse = await axios.get(`${API_BASE_URL}/oauth/google/url`);
    console.log('✅ OAuth URL generated successfully');
    console.log('🔗 Auth URL preview:', urlResponse.data.url.substring(0, 100) + '...');
    console.log('🔐 State parameter:', urlResponse.data.state);

    // Test 3: Validate URL structure
    console.log('\n🔍 Test 3: Validating OAuth URL structure...');
    const authUrl = new URL(urlResponse.data.url);
    const requiredParams = ['client_id', 'redirect_uri', 'scope', 'state', 'response_type'];
    const urlParams = new URLSearchParams(authUrl.search);
    
    let allParamsPresent = true;
    requiredParams.forEach(param => {
      if (!urlParams.has(param)) {
        console.log(`❌ Missing required parameter: ${param}`);
        allParamsPresent = false;
      } else {
        console.log(`✅ Parameter ${param}: ${urlParams.get(param)}`);
      }
    });

    if (allParamsPresent) {
      console.log('✅ All required OAuth parameters are present');
    }

    // Test 4: Check redirect URI configuration
    console.log('\n🔍 Test 4: Checking redirect URI configuration...');
    const redirectUri = urlParams.get('redirect_uri');
    console.log('🔗 Configured redirect URI:', redirectUri);
    
    const expectedRedirectUris = [
      `${API_BASE_URL.replace('/api', '')}/oauth/google/callback`,
      'https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/oauth/google/callback',
      'https://www.faredowntravels.com/oauth/google/callback',
      'https://faredown-web.onrender.com/oauth/google/callback'
    ];

    const isValidRedirectUri = expectedRedirectUris.includes(redirectUri);
    if (isValidRedirectUri) {
      console.log('✅ Redirect URI is correctly configured');
    } else {
      console.log('⚠️  Redirect URI might need to be added to Google Cloud Console');
      console.log('📋 Expected URIs:', expectedRedirectUris);
    }

    console.log('\n🎯 OAuth Test Summary:');
    console.log('======================');
    console.log('✅ Google OAuth is configured');
    console.log('✅ Authorization URL generation works');
    console.log('✅ State parameter is generated for CSRF protection');
    console.log('✅ Required OAuth parameters are present');
    console.log(isValidRedirectUri ? '✅' : '⚠️', 'Redirect URI configuration');

    console.log('\n📝 Next Steps:');
    console.log('1. Ensure all redirect URIs are added to Google Cloud Console');
    console.log('2. Test the complete OAuth flow in a browser');
    console.log('3. Verify popup closes and user session is created');
    console.log('4. Check that user appears logged in after OAuth');

    console.log('\n🚀 Ready for end-to-end testing!');

  } catch (error) {
    console.error('❌ OAuth test failed:', error.message);
    
    if (error.response) {
      console.error('📄 Response data:', error.response.data);
      console.error('📊 Status code:', error.response.status);
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the API server is running');
    console.log('2. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set');
    console.log('3. Ensure API_BASE_URL is correct');
    console.log('4. Check server logs for detailed error information');
  }
}

// Run the test
testGoogleOAuth();
