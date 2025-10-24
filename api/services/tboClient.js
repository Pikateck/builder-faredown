/**
 * TBO Content API Client
 * Fetches and manages country, city, and hotel master data from TBO
 */

const axios = require("axios");

const baseURL = process.env.TBO_CONTENT_BASE_URL; // e.g. https://api.test.hotelbeds.com/hotel-content-api/1.0/
const apiKey = process.env.TBO_API_KEY;
const apiSecret = process.env.TBO_API_SECRET;

if (!baseURL || !apiKey || !apiSecret) {
  console.warn(
    "⚠️  TBO Content API credentials not fully configured. Sync may fail.",
    {
      baseURL: !!baseURL,
      apiKey: !!apiKey,
      apiSecret: !!apiSecret,
    },
  );
}

const tbo = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "api-key": apiKey,
    "api-secret": apiSecret,
  },
});

/**
 * Generic paginator for TBO endpoints
 * Returns async generator that yields items page by page
 */
async function* fetchPages(endpoint, params = {}) {
  try {
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const resp = await tbo.get(endpoint, {
        params: { ...params, offset, limit },
      });

      const items = resp.data?.data || resp.data?.items || [];

      if (Array.isArray(items)) {
        for (const item of items) {
          yield item;
        }
      }

      // Check if there are more pages
      hasMore = items.length === limit;
      offset += limit;

      // Rate limiting: 100ms between requests
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error(`TBO Content API error on ${endpoint}:`, error.message);
    throw error;
  }
}

module.exports = {
  tbo,
  fetchPages,
};
