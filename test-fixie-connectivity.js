/**
 * FIXIE CONNECTIVITY TEST
 * 
 * Simple diagnostic to verify outbound connectivity through Fixie proxy
 * from Render environment.
 * 
 * USAGE (on Render):
 *   cd /opt/render/project/src
 *   node test-fixie-connectivity.js
 * 
 * EXPECTED RESULTS:
 *   ✅ Success: Returns your public IP via Fixie
 *   ❌ Timeout: Fixie is unreachable from Render
 */

require('dotenv').config({ path: 'api/.env', override: true });
require('dotenv').config({ override: true });

const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

console.log('\n' + '='.repeat(80));
console.log('FIXIE CONNECTIVITY TEST');
console.log('='.repeat(80));

// Check environment
const USE_PROXY = process.env.USE_SUPPLIER_PROXY === 'true';
const FIXIE_URL = process.env.FIXIE_URL;

console.log('\n🔧 ENVIRONMENT:');
console.log('  USE_SUPPLIER_PROXY:', USE_PROXY ? '✅ true' : '❌ false');
console.log('  FIXIE_URL:', FIXIE_URL ? '✅ configured' : '❌ missing');

if (!FIXIE_URL) {
  console.log('\n❌ ERROR: FIXIE_URL not set in environment');
  console.log('   Set FIXIE_URL in Render dashboard environment variables\n');
  process.exit(1);
}

// Parse Fixie URL
let proxyHost, proxyPort, proxyAuth;
try {
  const url = new URL(FIXIE_URL);
  proxyHost = url.hostname;
  proxyPort = url.port || '80';
  proxyAuth = url.username && url.password ? `${url.username}:${url.password}` : null;
  
  console.log('\n🔗 PROXY CONFIGURATION:');
  console.log('  Host:', proxyHost);
  console.log('  Port:', proxyPort);
  console.log('  Auth:', proxyAuth ? '✅ configured' : '❌ missing');
} catch (err) {
  console.log('\n❌ ERROR: Invalid FIXIE_URL format');
  console.log('   Expected format: http://username:password@host:port');
  console.log('   Actual:', FIXIE_URL);
  process.exit(1);
}

// Create proxy agent
const proxyAgent = new HttpsProxyAgent(FIXIE_URL);

console.log('\n🧪 TEST 1: Basic HTTP request via Fixie');
console.log('  Target: https://api.ipify.org?format=json');
console.log('  Timeout: 10 seconds');
console.log('  Starting...\n');

axios({
  method: 'GET',
  url: 'https://api.ipify.org?format=json',
  httpsAgent: proxyAgent,
  timeout: 10000,
  headers: {
    'User-Agent': 'Faredown-Fixie-Test/1.0'
  }
})
  .then(response => {
    console.log('✅ SUCCESS: Fixie proxy is reachable!');
    console.log('  Status:', response.status);
    console.log('  Your public IP via Fixie:', response.data.ip);
    console.log('\n🧪 TEST 2: TBO endpoint connectivity');
    console.log('  Target: https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate');
    console.log('  Timeout: 20 seconds');
    console.log('  Starting...\n');
    
    // Test TBO endpoint connectivity (without actual auth)
    return axios({
      method: 'POST',
      url: 'https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate',
      httpsAgent: proxyAgent,
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Faredown-TBO-Test/1.0'
      },
      data: {
        ClientId: 'test',
        UserName: 'test',
        Password: 'test',
        EndUserIp: '1.1.1.1'
      },
      validateStatus: () => true // Accept any status code
    });
  })
  .then(response => {
    console.log('✅ SUCCESS: TBO endpoint is reachable via Fixie!');
    console.log('  Status:', response.status);
    console.log('  Response:', JSON.stringify(response.data, null, 2));
    console.log('\n✅ RESULT: Fixie connectivity is working');
    console.log('   The timeout in test-tbo-full-booking-flow.js may be due to:');
    console.log('   - Incorrect TBO credentials');
    console.log('   - TBO rate limiting');
    console.log('   - Need to increase timeout beyond 20s\n');
  })
  .catch(error => {
    if (error.code === 'ECONNABORTED') {
      console.log('❌ TIMEOUT: Request timed out');
      console.log('  Error:', error.message);
      console.log('\n🔍 DIAGNOSIS:');
      console.log('  Fixie proxy is not reachable from this Render service');
      console.log('\n📋 ACTION ITEMS:');
      console.log('  1. Verify FIXIE_URL credentials in Render dashboard');
      console.log('  2. Check Fixie dashboard for IP whitelist requirements');
      console.log('  3. Open Render support ticket about outbound connectivity');
      console.log('  4. Try connecting from Render shell: curl -x $FIXIE_URL https://api.ipify.org\n');
    } else if (error.response) {
      console.log('✅ CONNECTION SUCCESSFUL (but got error response)');
      console.log('  Status:', error.response.status);
      console.log('  Data:', error.response.data);
      console.log('\n✅ RESULT: Fixie connectivity is working');
      console.log('   The error response indicates network connectivity is fine\n');
    } else {
      console.log('❌ ERROR:', error.message);
      console.log('  Code:', error.code);
      console.log('\n🔍 DIAGNOSIS:');
      console.log('  Network error occurred (not a timeout)');
      console.log('  This may indicate DNS or routing issues\n');
    }
  });
