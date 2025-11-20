# Cache-Backed Hotel Search - Staging Test Guide

## ✅ Status: READY FOR TESTING

All code changes deployed to staging:
- ✅ Migration: `20250205_hotel_cache_layer.sql` (tables created)
- ✅ Backend: `api/services/hotelCacheService.js` (cache service)
- ✅ API Endpoint: `api/routes/hotels-search.js` (POST /api/hotels/search)
- ✅ Frontend: `client/pages/HotelResults.tsx` (updated to use cache endpoint)
- ✅ Parameter mapping fixed (destination, cityName, cityId)

---

## 🧪 Test Plan

### Test 1: First Search (Cache Miss)
**Scenario**: User searches for hotels first time
**Expected**: TBO API called, results stored in cache, `source="tbo"`, `cacheHit=false`

**Steps**:
1. Go to: `https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/hotels`
2. Search: Dubai, Nov 30 - Dec 3, 2 adults, 1 room
3. Check browser console:
   ```
   ✅ Results from TBO API (fresh)
   📡 API Call: /api/hotels/search
   ```
4. Verify hotels display with correct data:
   - Hotel names
   - Star ratings
   - Amenities
   - Prices

**Backend Check**:
```bash
# SSH into Render and check DB
psql $DATABASE_URL << 'EOF'
SELECT search_hash, is_fresh, hotel_count, cached_at, cache_source 
FROM hotel_search_cache 
WHERE cached_at > NOW() - INTERVAL '5 minutes'
ORDER BY cached_at DESC
LIMIT 5;
EOF
```

Expected: One row with `is_fresh=true`, `cache_source='tbo'`, `hotel_count > 0`

---

### Test 2: Repeat Search (Cache Hit)
**Scenario**: User makes identical search immediately after
**Expected**: Results from cache, `source="cache"`, `cacheHit=true`, <200ms response

**Steps**:
1. Without clearing filters, click "Search" again (or refresh page)
2. Check console:
   ```
   ✅ Results from CACHE (fast)
   📅 Cached at: 10:30:45 AM
   ⏰ Expires at: 2:30:45 PM
   ```
3. Compare response times:
   - First search: ~2-5 seconds
   - Second search: ~100-200ms ✅

**Backend Check**:
```bash
psql $DATABASE_URL << 'EOF'
SELECT 
  search_hash,
  COUNT(*) as attempts,
  SUM(CASE WHEN is_fresh THEN 1 ELSE 0 END) as cache_hits,
  hotel_count,
  ttl_expires_at
FROM hotel_search_cache 
WHERE cached_at > NOW() - INTERVAL '5 minutes'
GROUP BY search_hash, hotel_count, ttl_expires_at
LIMIT 5;
EOF
```

Expected: Same search_hash appears, cache_hits=1

---

### Test 3: Different Search (Cache Miss)
**Scenario**: User searches different city
**Expected**: New TBO call, new cache entry created

**Steps**:
1. Change destination to Paris or London
2. Search
3. Console should show: `⚠️ CACHE MISS`
4. New hotels should load (different from Dubai)

**Backend Check**:
```bash
psql $DATABASE_URL << 'EOF'
SELECT COUNT(DISTINCT search_hash) as unique_searches
FROM hotel_search_cache 
WHERE cached_at > NOW() - INTERVAL '5 minutes';
EOF
```

Expected: 2+ unique search hashes

---

### Test 4: Hotel Details Page
**Scenario**: User clicks "View Details" on a hotel
**Expected**: Room details load from cache with pricing

**Steps**:
1. From search results, click "View Details" on any hotel
2. Check console: Should see room details with:
   - Room type
   - Bed configuration
   - Amenities
   - Cancellation policy
   - Price

**Backend Check**:
```bash
psql $DATABASE_URL << 'EOF'
SELECT 
  h.name,
  COUNT(r.id) as room_types,
  h.last_synced_at
FROM tbo_hotels_normalized h
LEFT JOIN tbo_rooms_normalized r ON h.tbo_hotel_code = r.tbo_hotel_code
WHERE h.last_synced_at > NOW() - INTERVAL '5 minutes'
GROUP BY h.id, h.name, h.last_synced_at
LIMIT 5;
EOF
```

Expected: Hotels with room_types > 0

---

### Test 5: Cache Statistics
**Scenario**: Monitor cache performance metrics
**Expected**: Hit rate, hotel count, search patterns

**Manual Test**:
```bash
# Make multiple searches
curl -X POST https://builder-faredown-pricing.onrender.com/api/hotels/cache/stats \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "stats": {
    "total_searches": 5,
    "fresh_searches": 3,
    "hit_rate": 60.0,
    "total_hotels_cached": 150
  }
}
```

---

## 📊 Performance Benchmarks

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| **First search** | 2-5s | _____ | 🔄 |
| **Repeat search** | <200ms | _____ | 🔄 |
| **Speed improvement** | 25-30x | _____ | 🔄 |
| **Cache hit rate** | >80% | _____ | 🔄 |
| **Hotels per search** | 20-50 | _____ | 🔄 |
| **Room details load** | <300ms | _____ | 🔄 |

---

## 🔍 Debugging Checks

### Issue: Hotels not loading
```bash
# Check if endpoint is working
curl -X POST https://builder-faredown-pricing.onrender.com/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "cityId": "1",
    "destination": "Dubai, United Arab Emirates",
    "countryCode": "AE",
    "checkIn": "2025-11-30",
    "checkOut": "2025-12-03",
    "rooms": "1",
    "adults": "2",
    "children": "0",
    "currency": "INR"
  }' | jq .
```

Expected: `"success": true`, `"hotels": [...]`

### Issue: Cache not hit after first search
```bash
# Check cache table
psql $DATABASE_URL << 'EOF'
SELECT * FROM hotel_search_cache 
WHERE cached_at > NOW() - INTERVAL '10 minutes'
LIMIT 10;
EOF
```

Verify:
- `is_fresh = true`
- `ttl_expires_at > NOW()`
- `hotel_count > 0`

### Issue: Slow responses even on cache hit
```bash
# Check if indexes are being used
psql $DATABASE_URL << 'EOF'
EXPLAIN ANALYZE
SELECT h.* FROM tbo_hotels_normalized h
JOIN hotel_search_cache_results cr ON h.tbo_hotel_code = cr.tbo_hotel_code
WHERE cr.search_hash = 'test_hash'
ORDER BY cr.result_rank;
EOF
```

Look for "Index Scan" (good) not "Seq Scan" (bad)

---

## 🧮 Test Data Requirements

To properly test the cache, we need:
1. **Consistent search parameters** (to test cache hits)
2. **Different destinations** (to test different cache entries)
3. **Multiple searches** (to build hit rate statistics)

### Suggested Test Searches:
```
1. Dubai, Nov 30 - Dec 3, 2 adults, 1 room
2. Dubai, Nov 30 - Dec 3, 2 adults, 1 room (REPEAT - should hit cache)
3. Paris, Dec 10 - Dec 15, 2 adults, 1 room
4. London, Jan 5 - Jan 10, 4 adults, 2 rooms
5. Dubai, Nov 30 - Dec 3, 2 adults, 1 room (REPEAT - should hit cache)
```

Expected: 3 cache misses, 2 cache hits = 40% hit rate

---

## ✅ Acceptance Criteria

The cache-backed search is **PASS** when:

- [ ] **Cache miss**: First search returns TBO results in 2-5 seconds
- [ ] **Cache hit**: Repeat search returns cached results in <200ms
- [ ] **Speed improvement**: Repeat searches are 25-30x faster
- [ ] **Hotel data**: All fields present (name, rating, amenities, images, price)
- [ ] **Room details**: Room types and rates load correctly
- [ ] **Cache stats**: API returns accurate hit rate and metrics
- [ ] **No errors**: Console has no red errors (warnings OK)
- [ ] **Database**: All 4 tables have data
- [ ] **Fallback**: If cache fails, system falls back gracefully
- [ ] **TTL**: Cache expires after 4 hours (can test by checking `ttl_expires_at`)

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Test 1: First Search (Cache Miss)
✅ / ❌ Hotel data loads correctly
✅ / ❌ Source shows "tbo"
✅ / ❌ Response time 2-5 seconds
Duration: _____ ms

Test 2: Repeat Search (Cache Hit)
✅ / ❌ Source shows "cache"
✅ / ❌ Response time <200ms
✅ / ❌ Cache metadata displayed (cached at, expires at)
Duration: _____ ms
Speed improvement: _____x faster

Test 3: Different Search (Cache Miss)
✅ / ❌ New hotels load
✅ / ❌ Source shows "tbo"
✅ / ❌ Different from first search

Test 4: Hotel Details
✅ / ❌ Room types display
✅ / ❌ Pricing visible
✅ / ❌ Cancellation policies shown

Test 5: Cache Statistics
✅ / ❌ API returns hit rate
✅ / ❌ Metrics accurate
Hit rate: _____ %

Overall Result:
🟢 PASS / 🔴 FAIL / 🟡 INCONCLUSIVE

Issues Found:
- ___________
- ___________

Notes:
___________
```

---

## 🚀 Next Steps After Tests Pass

1. **Monitor in staging** (24 hours):
   - Watch cache hit rate
   - Monitor response times
   - Check error logs

2. **Run certification tests**:
   - Full booking flow with cached hotels
   - Price consistency checks
   - Cancellation policy accuracy

3. **Prepare production deployment**:
   - Create deployment checklist
   - Plan rollback strategy
   - Communicate to team

---

## 📞 Support

If tests fail or issues arise:

1. **Check logs**:
   ```bash
   # Render logs
   render logs --name=api --tail=100
   
   # Database logs
   psql $DATABASE_URL -c "SELECT * FROM public.hotel_supplier_api_logs WHERE request_timestamp > NOW() - INTERVAL '1 hour' ORDER BY request_timestamp DESC LIMIT 10;"
   ```

2. **Verify migration applied**:
   ```bash
   psql $DATABASE_URL -c "\dt public.hotel_search_cache"
   ```

3. **Check endpoint health**:
   ```bash
   curl https://builder-faredown-pricing.onrender.com/api/hotels/cache/stats | jq .
   ```

---

## Summary

✅ **Code Ready**: All changes deployed to staging
✅ **Database Ready**: Migration applied, 4 tables created
✅ **Parameter Mapping Fixed**: destination, cityName properly passed
🔄 **Testing**: Ready to begin staging verification

**Next Action**: Execute tests and document results using the template above.
