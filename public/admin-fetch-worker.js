/**
 * Service Worker to handle admin API calls
 * Bypasses FullStory by intercepting fetch at the service worker level
 */

const ADMIN_API_BASE = 'https://builder-faredown-pricing.onrender.com/api';
const ADMIN_API_KEY = '8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1';

self.addEventListener('install', (event) => {
  console.log('✅ Admin Fetch Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Admin Fetch Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept admin API calls
  if (!url.pathname.includes('/admin')) {
    return;
  }
  
  console.log('🔧 Service Worker intercepting admin request:', url.pathname);
  
  event.respondWith(
    (async () => {
      try {
        // Clone the request
        const requestUrl = event.request.url.replace(url.origin, ADMIN_API_BASE);
        
        // Create new request with admin key
        const headers = new Headers(event.request.headers);
        headers.set('X-Admin-Key', ADMIN_API_KEY);
        headers.set('Content-Type', 'application/json');
        
        const requestInit = {
          method: event.request.method,
          headers: headers,
          credentials: 'include',
          mode: 'cors',
          cache: 'no-store'
        };
        
        // Add body for POST/PUT
        if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
          requestInit.body = await event.request.text();
        }
        
        console.log('🚀 Service Worker making request:', {
          url: requestUrl,
          method: event.request.method,
          headers: Object.fromEntries(headers.entries())
        });
        
        // Make the actual fetch - this bypasses FullStory completely
        const response = await fetch(requestUrl, requestInit);
        
        console.log('✅ Service Worker received response:', {
          status: response.status,
          statusText: response.statusText
        });
        
        return response;
      } catch (error) {
        console.error('❌ Service Worker fetch failed:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message || 'Service Worker fetch failed'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })()
  );
});
