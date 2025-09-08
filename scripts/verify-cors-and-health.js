#!/usr/bin/env node

/**
 * CORS and Health Check Verification Script
 * Verifies API connectivity and CORS configuration
 */

import fetch from 'node-fetch';

// Configuration
const environments = {
  development: 'http://localhost:3001',
  preview: process.env.PREVIEW_API_URL || 'auto-detect',
  production: process.env.PRODUCTION_API_URL || 'auto-detect'
};

const services = ['loyalty', 'hotels', 'flights', 'transfers', 'sightseeing'];

// CORS origins to test
const corsOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://your-domain.com',
  'https://test.builder.codes',
  'https://preview.builder.codes'
];

console.log('🔍 Starting CORS and Health Check Verification...\n');

// Test CORS for a specific origin and endpoint
async function testCors(baseUrl, origin, endpoint = '/health') {
  try {
    const response = await fetch(`${baseUrl}/api${endpoint}`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });

    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
    };

    return {
      success: response.ok,
      status: response.status,
      headers: corsHeaders,
      allowsOrigin: corsHeaders['access-control-allow-origin'] === '*' || 
                    corsHeaders['access-control-allow-origin'] === origin
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test health endpoint
async function testHealth(baseUrl, service = '') {
  const endpoint = service ? `/api/${service}/health` : '/api/health';
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    const responseTime = Date.now() - startTime;
    const data = response.ok ? await response.json() : null;

    return {
      success: response.ok,
      status: response.status,
      responseTime,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Auto-detect API URLs for preview/production
function detectApiUrl(environment) {
  if (environments[environment] !== 'auto-detect') {
    return environments[environment];
  }

  // Auto-detection logic based on current environment
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('builder.codes')) {
      return window.location.origin;
    }
    if (window.location.hostname !== 'localhost') {
      return window.location.origin;
    }
  }

  return null;
}

// Main verification function
async function runVerification() {
  const results = {
    cors: {},
    health: {},
    recommendations: []
  };

  console.log('📊 Testing Health Endpoints...\n');

  // Test health endpoints
  for (const [env, baseUrl] of Object.entries(environments)) {
    if (baseUrl === 'auto-detect') {
      console.log(`⏭️  Skipping ${env} (auto-detect not available in Node.js)`);
      continue;
    }

    console.log(`🌐 Testing ${env}: ${baseUrl}`);
    results.health[env] = {};

    // Test main health endpoint
    const mainHealth = await testHealth(baseUrl);
    results.health[env].main = mainHealth;
    
    console.log(`  ${mainHealth.success ? '✅' : '❌'} Main API health: ${mainHealth.success ? `${mainHealth.responseTime}ms` : mainHealth.error}`);

    // Test service-specific health endpoints
    for (const service of services) {
      const serviceHealth = await testHealth(baseUrl, service);
      results.health[env][service] = serviceHealth;
      
      console.log(`  ${serviceHealth.success ? '✅' : '❌'} ${service} health: ${serviceHealth.success ? `${serviceHealth.responseTime}ms` : serviceHealth.error}`);
    }

    console.log('');
  }

  console.log('🔒 Testing CORS Configuration...\n');

  // Test CORS configuration
  for (const [env, baseUrl] of Object.entries(environments)) {
    if (baseUrl === 'auto-detect') continue;

    console.log(`🌐 Testing CORS for ${env}: ${baseUrl}`);
    results.cors[env] = {};

    for (const origin of corsOrigins) {
      const corsTest = await testCors(baseUrl, origin);
      results.cors[env][origin] = corsTest;
      
      console.log(`  ${corsTest.success && corsTest.allowsOrigin ? '✅' : '❌'} Origin: ${origin}`);
      if (corsTest.success && !corsTest.allowsOrigin) {
        console.log(`    ⚠️  Origin not allowed. CORS header: ${corsTest.headers['access-control-allow-origin']}`);
      }
      if (!corsTest.success && corsTest.error) {
        console.log(`    ❌ Error: ${corsTest.error}`);
      }
    }

    console.log('');
  }

  // Generate recommendations
  console.log('💡 Recommendations:\n');

  // Check for health issues
  Object.entries(results.health).forEach(([env, envHealth]) => {
    Object.entries(envHealth).forEach(([service, health]) => {
      if (!health.success) {
        results.recommendations.push(`❌ ${env}/${service}: Health check failed - ${health.error}`);
      } else if (health.responseTime > 2000) {
        results.recommendations.push(`⚠️  ${env}/${service}: Slow response time (${health.responseTime}ms) - consider optimization`);
      }
    });
  });

  // Check for CORS issues
  Object.entries(results.cors).forEach(([env, envCors]) => {
    Object.entries(envCors).forEach(([origin, corsResult]) => {
      if (!corsResult.success) {
        results.recommendations.push(`❌ ${env}: CORS preflight failed for ${origin}`);
      } else if (!corsResult.allowsOrigin) {
        results.recommendations.push(`⚠️  ${env}: Origin ${origin} not allowed by CORS policy`);
      }
    });
  });

  // General recommendations
  if (results.recommendations.length === 0) {
    console.log('✅ All checks passed! Your API is properly configured.\n');
  } else {
    results.recommendations.forEach(rec => console.log(rec));
    console.log('');
  }

  // Configuration recommendations
  console.log('🔧 Configuration Recommendations:\n');
  console.log('1. Ensure your API server includes these CORS headers:');
  console.log('   Access-Control-Allow-Origin: * (or specific domains)');
  console.log('   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
  console.log('   Access-Control-Allow-Headers: Content-Type, Authorization');
  console.log('   Access-Control-Allow-Credentials: true\n');

  console.log('2. Add health check endpoints:');
  console.log('   GET /api/health - Overall system health');
  services.forEach(service => {
    console.log(`   GET /api/${service}/health - ${service} service health`);
  });
  console.log('');

  console.log('3. Environment variables to set:');
  console.log('   API_BASE_URL=https://your-api-domain.com/api');
  console.log('   VITE_API_BASE_URL=https://your-api-domain.com/api');
  console.log('   VITE_ENABLE_OFFLINE_FALLBACK=false (for production)');
  console.log('');

  // Export results for CI/CD
  if (process.env.CI) {
    console.log('📋 CI/CD Results:');
    console.log(JSON.stringify(results, null, 2));
  }

  // Exit with error code if there are failures
  const hasFailures = results.recommendations.some(rec => rec.includes('❌'));
  process.exit(hasFailures ? 1 : 0);
}

// Run verification
runVerification().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
