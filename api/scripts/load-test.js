/**
 * k6 Load Test Script for AI Bargaining Platform
 * Tests 150 VUs for 3 minutes with <300ms p95 requirement
 * 
 * Usage: k6 run --duration 3m --vus 150 load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const bargainLatency = new Trend('bargain_latency');

// Test configuration
export const options = {
  vus: 150, // 150 Virtual Users
  duration: '3m', // 3 minutes
  thresholds: {
    // Performance gates
    'http_req_duration{endpoint:bargain}': ['p(95)<300'], // <300ms p95
    'http_req_failed': ['rate<0.005'], // <0.5% error rate
    'errors': ['rate<0.005'],
    
    // Specific thresholds
    'bargain_latency': ['p(95)<300', 'avg<150'],
    'http_req_duration': ['avg<150', 'p(90)<250', 'p(95)<300'],
  },
};

// Test data pools
const USERS = [
  { id: 'loadtest_u1', tier: 'standard', device_type: 'desktop' },
  { id: 'loadtest_u2', tier: 'GOLD', device_type: 'mobile' },
  { id: 'loadtest_u3', tier: 'PLATINUM', device_type: 'desktop' },
];

const HOTEL_CPOS = [
  {
    type: 'hotel',
    supplier: 'hotelbeds',
    product_id: 'HT_001_DLX',
    city: 'mumbai',
    check_in: '2024-06-15',
    check_out: '2024-06-17',
    guest_count: 2
  },
  {
    type: 'hotel',
    supplier: 'hotelbeds', 
    product_id: 'HT_002_SUP',
    city: 'goa',
    check_in: '2024-07-01',
    check_out: '2024-07-03',
    guest_count: 1
  },
  {
    type: 'hotel',
    supplier: 'hotelbeds',
    product_id: 'HT_003_STD', 
    city: 'bangalore',
    check_in: '2024-06-20',
    check_out: '2024-06-22',
    guest_count: 4
  }
];

const FLIGHT_CPOS = [
  {
    type: 'flight',
    supplier: 'amadeus',
    product_id: 'AI_101_DEL_BOM',
    route: 'DEL-BOM',
    class_of_service: 'economy'
  },
  {
    type: 'flight',
    supplier: 'amadeus',
    product_id: 'EK_500_BOM_DXB', 
    route: 'BOM-DXB',
    class_of_service: 'business'
  },
  {
    type: 'flight',
    supplier: 'amadeus',
    product_id: 'UK_955_DEL_BLR',
    route: 'DEL-BLR', 
    class_of_service: 'economy'
  }
];

const PROMO_CODES = ['SAVE10', 'SAVE20', 'WELCOME', '', ''];

// Base URL - can be overridden with environment variable
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.API_TOKEN || 'loadtest_token';

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateSignals() {
  return {
    time_on_page: Math.floor(Math.random() * 120) + 10, // 10-130 seconds
    scroll_depth: Math.floor(Math.random() * 100), // 0-100%
    previous_searches: Math.floor(Math.random() * 5), // 0-5 searches
    device_type: Math.random() > 0.6 ? 'mobile' : 'desktop',
    user_agent: 'k6-load-test/1.0'
  };
}

export default function() {
  // Random test data
  const user = getRandomElement(USERS);
  const isHotel = Math.random() > 0.5;
  const productCPO = isHotel ? getRandomElement(HOTEL_CPOS) : getRandomElement(FLIGHT_CPOS);
  const promoCode = getRandomElement(PROMO_CODES);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'User-Agent': 'k6-loadtest/1.0'
  };

  // 1. Start bargain session
  const sessionPayload = {
    user: user,
    productCPO: productCPO
  };
  
  if (promoCode) {
    sessionPayload.promo_code = promoCode;
  }

  const sessionStart = Date.now();
  const sessionResponse = http.post(
    `${BASE_URL}/api/bargain/v1/session/start`,
    JSON.stringify(sessionPayload),
    { 
      headers: headers,
      tags: { endpoint: 'bargain', operation: 'start' }
    }
  );
  
  const sessionLatency = Date.now() - sessionStart;
  bargainLatency.add(sessionLatency);

  const sessionCheck = check(sessionResponse, {
    'session start status is 200': (r) => r.status === 200,
    'session has session_id': (r) => r.json('session_id') !== undefined,
    'session has initial_offer': (r) => r.json('initial_offer') !== undefined,
    'session has min_floor': (r) => r.json('min_floor') !== undefined,
    'session start latency < 300ms': () => sessionLatency < 300,
  });

  if (!sessionCheck || sessionResponse.status !== 200) {
    errorRate.add(1);
    return;
  }

  const sessionData = sessionResponse.json();
  
  // Small delay to simulate user thinking
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds

  // 2. Make an offer (70% of sessions)
  if (Math.random() < 0.7) {
    const offerAmount = Math.round(sessionData.min_floor * (0.8 + Math.random() * 0.3)); // 80-110% of floor
    
    const offerStart = Date.now();
    const offerResponse = http.post(
      `${BASE_URL}/api/bargain/v1/session/offer`,
      JSON.stringify({
        session_id: sessionData.session_id,
        user_offer: offerAmount,
        signals: generateSignals()
      }),
      { 
        headers: headers,
        tags: { endpoint: 'bargain', operation: 'offer' }
      }
    );
    
    const offerLatency = Date.now() - offerStart;
    bargainLatency.add(offerLatency);

    const offerCheck = check(offerResponse, {
      'offer status is 200': (r) => r.status === 200,
      'offer has decision': (r) => r.json('decision') !== undefined,
      'offer latency < 300ms': () => offerLatency < 300,
    });

    if (!offerCheck) {
      errorRate.add(1);
      return;
    }

    const offerData = offerResponse.json();
    
    // Small delay
    sleep(Math.random() * 1 + 0.3);

    // 3. Accept offer (30% of offers)
    if (Math.random() < 0.3 && (offerData.decision === 'accept' || offerData.counter_offer)) {
      const acceptStart = Date.now();
      const acceptResponse = http.post(
        `${BASE_URL}/api/bargain/v1/session/accept`,
        JSON.stringify({
          session_id: sessionData.session_id
        }),
        { 
          headers: headers,
          tags: { endpoint: 'bargain', operation: 'accept' }
        }
      );
      
      const acceptLatency = Date.now() - acceptStart;
      bargainLatency.add(acceptLatency);

      const acceptCheck = check(acceptResponse, {
        'accept status is 200 or 409': (r) => r.status === 200 || r.status === 409,
        'accept latency < 300ms': () => acceptLatency < 300,
      });

      if (!acceptCheck && acceptResponse.status !== 409) {
        errorRate.add(1);
      }
    }
  }

  // Random sleep between requests (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

// Setup function to warm up
export function setup() {
  console.log('🔥 Starting load test setup...');
  console.log(`Target: ${BASE_URL}`);
  console.log(`VUs: 150, Duration: 3m`);
  console.log(`Requirements: p95 < 300ms, error rate < 0.5%`);
  
  // Health check
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    console.warn(`⚠️ Health check failed: ${healthResponse.status}`);
  } else {
    console.log('✅ Health check passed');
  }
  
  return {};
}

// Teardown function to summarize
export function teardown(data) {
  console.log('📊 Load test completed');
}

// Handle summary for CI/CD
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    vus: data.options.vus,
    duration: data.options.duration,
    metrics: {
      http_req_duration: {
        avg: data.metrics.http_req_duration.values.avg,
        p95: data.metrics.http_req_duration.values['p(95)'],
        p99: data.metrics.http_req_duration.values['p(99)']
      },
      http_req_failed: {
        rate: data.metrics.http_req_failed.values.rate
      },
      bargain_latency: data.metrics.bargain_latency ? {
        avg: data.metrics.bargain_latency.values.avg,
        p95: data.metrics.bargain_latency.values['p(95)']
      } : null,
      errors: data.metrics.errors ? {
        rate: data.metrics.errors.values.rate
      } : null
    },
    thresholds: data.root_group.checks || {},
    passed: !data.metrics.http_req_failed || data.metrics.http_req_failed.values.rate < 0.005
  };

  // Return both text and JSON summaries
  return {
    'stdout': generateTextSummary(summary),
    'load-test-results.json': JSON.stringify(summary, null, 2)
  };
}

function generateTextSummary(summary) {
  const status = summary.passed ? '✅ PASSED' : '❌ FAILED';
  const p95 = summary.metrics.http_req_duration.p95;
  const errorRate = summary.metrics.http_req_failed.rate * 100;
  
  return `
🚀 LOAD TEST RESULTS ${status}
==========================================
Target: ${BASE_URL}
VUs: ${summary.vus} | Duration: ${summary.duration}

📊 Performance Metrics:
• Average Response Time: ${summary.metrics.http_req_duration.avg.toFixed(1)}ms
• P95 Response Time: ${p95.toFixed(1)}ms (requirement: <300ms)
• P99 Response Time: ${summary.metrics.http_req_duration.p99.toFixed(1)}ms
• Error Rate: ${errorRate.toFixed(3)}% (requirement: <0.5%)

${summary.metrics.bargain_latency ? `
🎯 Bargain API Specific:
• Bargain P95: ${summary.metrics.bargain_latency.p95.toFixed(1)}ms
• Bargain Avg: ${summary.metrics.bargain_latency.avg.toFixed(1)}ms
` : ''}

🎯 Requirements Check:
• P95 < 300ms: ${p95 < 300 ? '✅' : '❌'} (${p95.toFixed(1)}ms)
• Error Rate < 0.5%: ${errorRate < 0.5 ? '✅' : '❌'} (${errorRate.toFixed(3)}%)

${status === '✅ PASSED' ? 'Ready for production traffic! 🚀' : 'Performance issues detected - investigate before go-live ⚠️'}
`;
}
