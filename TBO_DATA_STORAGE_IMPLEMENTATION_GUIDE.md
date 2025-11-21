# TBO Data Storage & Unified Cache Implementation Guide

**Status**: Post-sync infrastructure ready (city data synced successfully)  
**Next Phase**: Implement local mapping lookup, cache unification, and precaching

---

## 📋 Overview

This guide implements the TBO data storage design you specified:

1. **City Master**: Use existing Hotelbeds cities table + TBO mappings via `city_mapping`
2. **City Resolution**: Prefer local pre-synced mappings over live TBO API calls
3. **Hotel Cache**: Store all TBO hotel search results in unified cache tables
4. **Precaching**: Optional nightly warming of cache for top cities

---

## ✅ Completed Milestones

### ✓ Step 1: City Sync (DONE)
- Synced **~17,500+ TBO cities** across 8 countries
- Created `tbo_countries`, `tbo_cities` tables
- Generated city mappings via `city_mapping` table (4 main cities mapped)
- SQL verification script created: `api/scripts/verify-tbo-data-storage.sql`

**Action**: Run the verification script to check what's in the database:
```bash
psql $DATABASE_URL < api/scripts/verify-tbo-data-storage.sql
```

---

## 🔧 Implementation Tasks

### Task 1: Verify Database State (5 minutes)

**Files**: 
- `api/scripts/verify-tbo-data-storage.sql` ← **Run this first**

**Steps**:
1. Copy the SQL verification script to your Render shell
2. Run it to verify:
   - ✅ `tbo_countries` has entries for IN, AE, GB, US, FR, AT, TH, SG
   - ✅ `tbo_cities` has correct counts per country (IN: 1058, AE: 31, etc.)
   - ✅ `city_mapping` has mappings for key cities
   - ✅ Hotel cache tables exist with schema

**Expected Output**:
- tbo_countries: 8 rows
- tbo_cities: 17,500+ rows
- city_mapping: 4+ rows (Mumbai, Delhi, Dubai, and others)

---

### Task 2: Add Local City Mapping Lookup to TBO Adapter (15-20 minutes)

**Files**:
- `api/services/adapters/tboAdapter-local-mapping.patch.md` ← **Implementation guide**
- Target: `api/services/adapters/tboAdapter.js`

**What This Does**:
- ✅ First tries to resolve city ID from pre-synced `city_mapping` table (fast, ~10-50ms)
- ✅ Falls back to TBO live API if local mapping not found (backward compatible)
- ✅ Reduces TBO API dependency and improves performance

**How to Apply**:
1. Read the patch guide: `api/services/adapters/tboAdapter-local-mapping.patch.md`
2. Add the `getLocalCityMapping()` method to TBOAdapter class
3. Modify `getCityId()` to call local mapping first, then API fallback
4. Test with a synced city (Mumbai, Delhi, Dubai)

**Expected Behavior**:
```
[TBO] Local city mapping found
  destination: Mumbai
  country: IN
  destinationId: 130452  ← TBO DestinationId
  confidence: 100
```

---

### Task 3: Enhance Hotel Cache to Store Prices (10-15 minutes)

**Files**:
- `api/services/hotelCacheService-enhanced.patch.md` ← **Implementation guide**
- Target: `api/services/hotelCacheService.js`

**What This Does**:
- ✅ Populates `price_offered_per_night` and `price_published_per_night` in cache
- ✅ Stores hotel inventory snapshots for future queries
- ✅ Enables price history tracking

**How to Apply**:
1. Read the patch guide: `api/services/hotelCacheService-enhanced.patch.md`
2. Modify `cacheSearchResults()` to extract and store prices
3. Update the INSERT statement to include price columns
4. Test by running a TBO search and checking cache tables

**Expected Behavior**:
```sql
SELECT price_offered_per_night, price_published_per_night 
FROM hotel_search_cache_results 
LIMIT 5;

-- Should show actual prices, not all NULLs
```

---

### Task 4: Unify TBO Search Route Caching (10-15 minutes)

**Files**:
- Target: `api/routes/tbo-hotels.js` (POST /search endpoint)

**What This Does**:
- ✅ Uses same caching as generic hotel search routes
- ✅ Ensures TBO-specific searches populate `hotel_search_cache` and `hotel_search_cache_results`
- ✅ Enables snapshot-based queries across TBO searches

**How to Apply**:
1. In `/tbo/search` POST endpoint (around line 260-290):
2. After `adapter.searchHotels(searchRequest)` completes, call caching:

```javascript
// After line 269 (rawResults obtained):
const hotelCacheService = require("../services/hotelCacheService");

const cached = await hotelCacheService.cacheSearchResults(
  unifiedResults,      // hotels to cache
  searchRequest,       // search params
  "tbo_search",        // source
  { /* sessionMetadata from adapter */ }
);

if (cached) {
  console.log(`✅ Cached ${unifiedResults.length} hotels`);
}
```

3. Optional: Store normalized hotel metadata:
```javascript
for (const hotel of unifiedResults) {
  await hotelCacheService.storeNormalizedHotel({
    tboHotelCode: hotel.hotelCode,
    cityId: hotel.city,
    // ... other fields from hotel object
  });
}
```

**Expected Behavior**:
```
SELECT COUNT(*) FROM hotel_search_cache WHERE supplier = 'TBO';
-- Should increase after each search
```

---

### Task 5: Test Local Mapping & Cache Flow (10 minutes)

**Steps**:
1. **Restart backend** (apply all changes above)
2. **Run a hotel search** via frontend or API:
```bash
curl -X POST http://localhost:3000/api/tbo-hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Mumbai",
    "checkIn": "2025-12-25",
    "checkOut": "2025-12-26",
    "adults": 2,
    "children": 0,
    "rooms": 1,
    "currency": "INR"
  }'
```

3. **Check logs** for:
   ```
   [TBO] Local city mapping found (or: falling back to TBO API)
   [TBO] ✅ CityId resolved
   [TBO] hotel search completed with X results
   ✅ Cached X hotels (if caching enabled)
   ```

4. **Verify database**:
```sql
-- Check if search was cached
SELECT search_hash, city_id, hotel_count FROM hotel_search_cache 
ORDER BY created_at DESC LIMIT 1;

-- Check cached results
SELECT tbo_hotel_code, result_rank, price_offered_per_night 
FROM hotel_search_cache_results 
ORDER BY search_hash DESC LIMIT 10;
```

---

## 🌙 Task 6: Setup Nightly Precaching (Optional but Recommended)

**Files**:
- `api/scripts/tbo-precache-hotels.js` ← **Ready to use**

**What This Does**:
- ✅ Runs nightly to pre-warm cache for top 10 cities
- ✅ Uses local city mappings (Task 2 benefit)
- ✅ Stores normalized hotel data for fast retrieval
- ✅ Reduces load on TBO API and improves user search speed

**How to Setup**:

#### Option A: Manual Testing
```bash
cd api
node scripts/tbo-precache-hotels.js --cities=Mumbai,Delhi,Dubai --dry-run

# See what would be cached, then remove --dry-run to actually cache:
node scripts/tbo-precache-hotels.js --cities=Mumbai,Delhi,Dubai
```

#### Option B: Render Cron Job
Add to `render.yaml`:
```yaml
services:
  - type: cron
    name: tbo-nightly-precache
    buildCommand: "cd api && npm install"
    startCommand: "node scripts/tbo-precache-hotels.js"
    schedule: "0 2 * * *"  # 2 AM UTC daily
```

#### Option C: Linux Cron
```bash
# Add to Render shell crontab
crontab -e

# Add this line (run daily at 2 AM UTC):
0 2 * * * cd /opt/render/project/src/api && node scripts/tbo-precache-hotels.js >> /tmp/precache.log 2>&1
```

**Expected Output**:
```
📍 Precaching Mumbai (IN)...
   Dates: 2025-12-25 → 2025-12-26
   ✓ Found 125 hotels (2340ms)
   ✅ Cached 125 hotels for Mumbai

✅ Cities precached: 3
Total hotels cached: 385
Duration: 7.25s
```

---

## 📊 Implementation Checklist

- [ ] **Task 1**: Run `verify-tbo-data-storage.sql` and confirm city counts
- [ ] **Task 2**: Apply TBO Adapter local mapping patch
- [ ] **Task 2 Test**: Search for "Mumbai" and see local mapping log
- [ ] **Task 3**: Apply Hotel Cache price snapshot patch
- [ ] **Task 4**: Add caching to tbo-hotels.js /search endpoint
- [ ] **Task 5**: Run test search and verify cache tables populated
- [ ] **Task 6**: Setup nightly precaching (optional)
- [ ] **Final**: Run `tbo-precache-hotels.js` manually to verify
- [ ] **Final**: Commit and push all changes

---

## 🔍 Verification Queries

Use these to verify everything is working:

```sql
-- 1. Verify city mappings created
SELECT COUNT(*) FROM city_mapping WHERE is_active = true;
-- Should be: 4+ (at least Mumbai, Delhi, Dubai)

-- 2. Verify searches are being cached
SELECT supplier, COUNT(*) as search_count FROM hotel_search_cache 
GROUP BY supplier;
-- Should have rows for 'TBO' if precaching or live searches ran

-- 3. Verify hotel data is normalized
SELECT COUNT(*) FROM tbo_hotels_normalized;
-- Should increase with precache/searches

-- 4. Verify prices are cached (if Task 3 implemented)
SELECT COUNT(*) FROM hotel_search_cache_results 
WHERE price_offered_per_night IS NOT NULL;
-- Should be > 0 after Task 3

-- 5. Check hotel details from a cached search
SELECT h.name, h.star_rating, cr.price_offered_per_night
FROM tbo_hotels_normalized h
JOIN hotel_search_cache_results cr ON h.tbo_hotel_code = cr.tbo_hotel_code
LIMIT 10;
```

---

## 🚀 Production Deployment

1. **Test all changes locally/staging** before pushing to production
2. **Commit all modified files**:
   - `api/services/adapters/tboAdapter.js` (+ local mapping)
   - `api/services/hotelCacheService.js` (+ price snapshots)
   - `api/routes/tbo-hotels.js` (+ caching calls)
   - `api/scripts/tbo-precache-hotels.js` (new file)
   - `api/scripts/verify-tbo-data-storage.sql` (new file)

3. **Deploy to Render**
4. **Run precache script once** to warm cache:
   ```bash
   cd /opt/render/project/src/api
   node scripts/tbo-precache-hotels.js
   ```

5. **Monitor logs** for any errors in first 24 hours

---

## ❓ Troubleshooting

### Issue: Local mapping returns NULL
- **Cause**: City name doesn't match exactly in `city_mapping` table
- **Fix**: Check `city_mapping` table for exact spelling, or add manual mapping
- **Query**: `SELECT * FROM city_mapping WHERE hotelbeds_city_name LIKE '%Dubai%';`

### Issue: Caching not working
- **Cause**: `hotelCacheService.cacheSearchResults()` not being called
- **Fix**: Verify Task 4 caching code is added to `/tbo-hotels.js`
- **Query**: `SELECT COUNT(*) FROM hotel_search_cache;` (should increase)

### Issue: Precache script errors
- **Cause**: Missing TBO adapter initialization or database connection
- **Fix**: Ensure TBO env vars are set and database is accessible
- **Log**: Check `/tmp/precache.log` for detailed errors

---

## 📝 Notes

- All changes are backward compatible (fallback to TBO API if local mapping fails)
- Price snapshot feature is optional (works without it, but recommended)
- Precaching is optional but recommended for performance
- All changes preserve existing functionality while adding new features

---

## Next Steps After Implementation

1. Monitor TBO API call volume (should decrease due to local mapping)
2. Monitor search response times (should improve due to cache hits)
3. Add metrics/dashboards for cache hit ratio
4. Consider expanding precache list based on user search patterns
5. Implement admin UI for manual city mapping verification

