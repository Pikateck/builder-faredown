/**
 * Service Worker to handle admin API calls
 * Bypasses FullStory by intercepting fetch at the service worker level
 */

const ADMIN_API_BASE = "https://builder-faredown-pricing.onrender.com/api";
const ADMIN_API_KEY =
  "8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1";

self.addEventListener("install", (event) => {
  console.log("✅ Admin Fetch Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Admin Fetch Worker activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only intercept admin API calls
  if (!url.pathname.includes("/admin")) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const requestUrl = event.request.url.replace(
          url.origin,
          ADMIN_API_BASE,
        );

        const headers = new Headers(event.request.headers);
        headers.set("X-Admin-Key", ADMIN_API_KEY);

        const method = event.request.method || "GET";
        const hasBody =
          method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

        if (hasBody && !headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }

        // Remove request-id style headers that Chrome injects (avoid CORS issues)
        if (headers.has("request-id")) {
          headers.delete("request-id");
        }
        if (headers.has("x-request-id")) {
          headers.delete("x-request-id");
        }

        console.log("[SW] intercept", requestUrl, {
          method,
          hasAdminKey: headers.has("X-Admin-Key"),
          outgoingHeaders: Array.from(headers.keys()),
        });

        const requestInit = {
          method,
          headers,
          credentials: "omit",
          mode: "cors",
          cache: "no-store",
        };

        if (hasBody) {
          requestInit.body = await event.request.text();
        }

        const response = await fetch(requestUrl, requestInit);

        console.log("[SW] response", requestUrl, {
          status: response.status,
          statusText: response.statusText,
        });

        return response;
      } catch (error) {
        console.error("❌ Service Worker fetch failed:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message || "Service Worker fetch failed",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    })(),
  );
});
