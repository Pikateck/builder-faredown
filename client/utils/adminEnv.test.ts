/**
 * Test for admin environment utilities
 * This can be run to verify environment variable access works correctly
 */

import { getAdminApiKey, getAdminHeaders, isAdminApiKeyConfigured } from './adminEnv';

// Test the admin environment utilities
export function testAdminEnv() {
  console.log('🧪 Testing Admin Environment Utilities...');
  
  try {
    // Test API key retrieval
    const apiKey = getAdminApiKey();
    console.log('✅ API Key retrieved:', apiKey ? 'SUCCESS' : 'FAILED');
    
    // Test headers generation
    const headers = getAdminHeaders();
    console.log('✅ Headers generated:', headers['X-Admin-Key'] ? 'SUCCESS' : 'FAILED');
    
    // Test configuration check
    const isConfigured = isAdminApiKeyConfigured();
    console.log('✅ Configuration check:', isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED');
    
    // Log environment details
    console.log('🔍 Environment Details:');
    console.log('  - Development mode:', import.meta.env.DEV);
    console.log('  - Production mode:', import.meta.env.PROD);
    console.log('  - VITE_ADMIN_API_KEY present:', !!import.meta.env.VITE_ADMIN_API_KEY);
    
    return true;
  } catch (error) {
    console.error('❌ Admin environment test failed:', error);
    return false;
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  testAdminEnv();
}
