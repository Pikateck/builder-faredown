# TBO Cache-Backed Hotel Search - Deployment Guide

## ✅ Implementation Complete (Phase 1)

All code for the cache-backed hotel search architecture has been implemented. This guide covers deployment and testing.

---

## 📦 Deliverables

### 1. **Database Migration**

**File**: `api/database/migrations/20250205_hotel_cache_layer.sql`

Creates 4 new tables:

- `hotel_search_cache` – tracks search parameters and freshness
- `tbo_hotels_normalized` – normalized hotel metadata from TBO
- `tbo_rooms_normalized` – room type and rate details
- `hotel_search_cache_results` – maps searches to hotels with ranking

**Key Features**:

- TTL = 4 hours (cache expires, forced refresh after)
- Full TBO response blob stored for debugging
- Comprehensive indexes for fast lookups
- ON CONFLICT clauses for upsert safety

### 2. **Backend Service**

**File**: `api/services/hotelCacheService.js`

Manages all cache operations:

- `generateSearchHash()` – SHA256 of search parameters
- `getCachedSearch()` – check cache freshness
- `cacheSearchResults()` – store normalized hotel data
- `storeNormalizedHotel()` – persist hotel metadata
- `storeNormalizedRoom()` – persist room details
- `getCacheStats()` – monitoring and insights

### 3. **API Endpoint**

**File**: `api/routes/hotels-search.js`

Three endpoints:

1. **POST /api/hotels/search** – cache-first hotel search
   - Returns: `{success, source, hotels, totalResults, cacheHit, duration, traceId}`
   - Source: `'cache'` (4h TTL) or `'tbo'` (fresh API call)

2. **POST /api/hotels/rooms/:hotelId** – room details + prices
   - Returns: `{success, hotelId, hotel, rooms, source, traceId}`
   - Serves from `tbo_rooms_normalized` cache

3. **GET /api/hotels/cache/stats** – cache metrics
   - Returns: `{total_searches, fresh_searches, hit_rate, avg_hotels_per_search}`

### 4. **Frontend Integration**

**File**: `client/pages/HotelResults.tsx`

Updated `fetchTBOHotels()` function:

- Changed from GET to POST `/api/hotels/search`
- Passes structured payload: `{cityId, checkIn, checkOut, rooms, adults, children, currency}`
- Handles new response format with `success` flag, `source`, and `cacheHit` metadata
- Updated response parsing for new hotel object structure

### 5. **Route Registration**

**File**: `api/server.js`

Registered new endpoint:

```javascript
app.use("/api/hotels/search", hotelsSearchRoutes);
```

Priority mounting (before other hotel routes) ensures cache-backed endpoint is called first.

---

## 🚀 Deployment Steps

### Step 1: Apply Database Migration

```bash
# SSH into Render backend
# Or apply migration manually:

cd /path/to/api
psql $DATABASE_URL < database/migrations/20250205_hotel_cache_layer.sql

# Verify tables created
psql $DATABASE_URL -c "\dt public.hotel_search_cache"
psql $DATABASE_URL -c "\dt public.tbo_hotels_normalized"
psql $DATABASE_URL -c "\dt public.tbo_rooms_normalized"
psql $DATABASE_URL -c "\dt public.hotel_search_cache_results"
```

### Step 2: Deploy Code to Staging

```bash
git add api/services/hotelCacheService.js
git add api/routes/hotels-search.js
git add api/server.js
git add client/pages/HotelResults.tsx
git add api/database/migrations/20250205_hotel_cache_layer.sql

git commit -m "feat: implement cache-backed hotel search architecture

- Add HotelCacheService for cache management
- Create POST /api/hotels/search endpoint (cache-first)
- Add hotel + room normalization tables
- Update HotelResults.tsx to use cache endpoint
- 4-hour TTL for search results
- Full TBO response blob for debugging"

git push origin main
```

### Step 3: Restart API Server

- On Render: Deployment will trigger automatically
- Watch logs for table creation:
  ```
  ✅ Cached search: {hash} with {count} hotels
  ✅ Results from CACHE (fast) / TBO API (fresh)
  ```

### Step 4: Verify Deployment

```bash
# Check if endpoint is available
curl -X POST https://builder-faredown-pricing.onrender.com/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "cityId": "1",
    "countryCode": "AE",
    "checkIn": "2025-06-15",
    "checkOut": "2025-06-20",
    "rooms": "1",
    "adults": "2",
    "children": "0",
    "currency": "INR"
  }'

# Expected response:
# {
#   "success": true,
#   "source": "tbo",
#   "hotels": [...],
#   "totalResults": 25,
#   "cacheHit": false,
#   "duration": "2543ms"
# }
```

---

## 🧪 Testing Checklist

### Test 1: First Search (Cache Miss)

```bash
# Make initial search → should call TBO
curl -X POST http://localhost:3000/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "cityId": "1",
    "countryCode": "AE",
    "checkIn": "2025-06-15",
    "checkOut": "2025-06-20",
    "rooms": "1",
    "adults": "2",
    "children": "0"
  }'

# Expected: source="tbo", cacheHit=false, hotels populated
```

### Test 2: Repeat Search (Cache Hit)

```bash
# Make identical search immediately after
# Expected: source="cache", cacheHit=true, 100x faster response

# Check logs:
# ✅ CACHE HIT [trace-id] - 25 hotels cached
# ✅ Results from CACHE (fast)
```

### Test 3: Room Details

```bash
curl -X POST http://localhost:3000/api/hotels/rooms/1234 \
  -H "Content-Type: application/json" \
  -d '{
    "checkIn": "2025-06-15",
    "checkOut": "2025-06-20",
    "currency": "INR"
  }'

# Expected: room types, prices, cancellation policies
```

### Test 4: Cache Statistics

```bash
curl http://localhost:3000/api/hotels/cache/stats

# Expected:
# {
#   "stats": {
#     "total_searches": 10,
#     "fresh_searches": 9,
#     "hit_rate": 90.0,
#     "total_hotels_cached": 250
#   }
# }
```

### Test 5: Frontend Integration

1. Go to hotel search page
2. Search for Dubai (DXB)
3. Check browser console:
   - First search: `✅ Results from TBO API (fresh)` + duration ~2-5 seconds
   - Repeat search immediately: `✅ Results from CACHE (fast)` + duration ~50-200ms
4. Verify hotel cards display correctly with:
   - Hotel name, rating, amenities
   - Price (offered/published)
   - Images

### Test 6: Cache Expiration

1. Perform search at time T
2. Wait 4 hours
3. Perform identical search
4. Should trigger TBO call again (cache expired)
5. Logs: `⚠️ CACHE MISS [trace-id] - Calling TBO API`

---

## 📊 Monitoring & Metrics

### Cache Hit Rate

```sql
SELECT
  DATE(cached_at) as date,
  COUNT(*) as searches,
  ROUND(100.0 * SUM(CASE WHEN is_fresh THEN 1 ELSE 0 END) / COUNT(*), 2) as hit_rate
FROM hotel_search_cache
WHERE cached_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE(cached_at)
ORDER BY date DESC;
```

Expected: >80% hit rate after first day

### Response Times

```sql
-- This would be from API logs or APM tools
-- Expected:
-- - Cache hit: <200ms
-- - TBO call: 2-5 seconds
```

### Hotel Data Quality

```sql
SELECT
  COUNT(*) as cached_hotels,
  AVG(array_length(amenities::jsonb || '[]'::jsonb, 1)) as avg_amenities,
  COUNT(DISTINCT city_id) as cities_covered
FROM tbo_hotels_normalized;
```

---

## 🔍 Troubleshooting

### Issue: "hotel_search_cache" table not found

**Solution**: Run migration file

```bash
psql $DATABASE_URL < api/database/migrations/20250205_hotel_cache_layer.sql
```

### Issue: Cache hit rate is 0%

**Solution**: Check TTL settings and ensure cache is being written

```sql
SELECT * FROM hotel_search_cache
WHERE cached_at > NOW() - INTERVAL '1 hour'
LIMIT 5;
```

### Issue: Very slow cache hit responses

**Solution**: Add missing indexes

```sql
CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON public.hotel_search_cache(search_hash);
CREATE INDEX IF NOT EXISTS idx_hotels_normalized_city ON public.tbo_hotels_normalized(city_id);
```

### Issue: TBO adapter not initialized

**Solution**: Verify TBO adapter is registered in `supplierAdapterManager`

```javascript
const adapter = supplierAdapterManager.getAdapter("TBO");
console.log(adapter); // Should not be null
```

### Issue: Frontend showing old API format

**Solution**: Clear browser cache, ensure latest HotelResults.tsx is deployed

```bash
# Check browser console for:
✅ Cache-backed search with config
📡 API Call: /api/hotels/search
```

---

## 🎯 Performance Improvements Expected

| Metric            | Before       | After       | Improvement          |
| ----------------- | ------------ | ----------- | -------------------- |
| First search      | ~3-5s        | ~3-5s       | - (same)             |
| Repeat search     | ~3-5s        | ~200ms      | **25-30x faster**    |
| TBO API calls     | Every search | Once per 4h | **95% reduction**    |
| Database load     | Low          | Medium      | Due to normalization |
| P95 response time | 5s           | 300ms       | **16x faster**       |

---

## 📋 Next Steps (Optional Enhancements)

### Phase 2: Stale-While-Revalidate

- Serve cached results instantly
- Background job refreshes cache
- Next search gets updated data

### Phase 3: Redis Layer

- Cache hot searches (last 100) in Redis
- Sub-100ms response times for popular searches
- Postgres remains source of truth

### Phase 4: Price-Only Refresh

- Implement `/api/hotels/rooms/:hotelId` with live TBO calls
- Only fetch prices when user expands hotel
- Keep descriptions/images from cache

---

## Summary

✅ **Cache-backed hotel search is ready for staging deployment.**

All files are in place:

- 1 database migration
- 1 backend service
- 1 API route
- 1 frontend component update

**Next action**: Run migration on staging database and test with real TBO data.

For questions or issues, refer to architecture document: `TBO_CACHE_ARCHITECTURE_PROPOSAL.md`
