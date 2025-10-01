# Airport Dropdown - Staging Verification Checklist

## Manual Verification Required

The following items require manual verification on the staging environment as they involve live database queries, authenticated API calls, and runtime behavior.

---

## 1. ✅ Effective DB Host (Confirmed)

**Current Environment Value:**
```
Host: dpg-d2806mdniese739731t0-a.singapore-postgres.render.com
Port: 5432
Database: faredown_booking_db
```

**Source:** `process.env.DATABASE_URL`
**Hard-coding:** ✅ None found - all connections use environment variable

---

## 2. 🔍 Live API Sample (Requires Admin Token)

**Command:**
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/admin/airports?q=dub&limit=10&offset=0"
```

**Expected Response:**
```json
{
  "items": [
    {
      "iata": "DXB",
      "name": "Dubai International",
      "city": "Dubai",
      "country": "United Arab Emirates",
      "iso_country": "AE"
    },
    {
      "iata": "DUB",
      "name": "Dublin Airport",
      "city": "Dublin",
      "country": "Ireland",
      "iso_country": "IE"
    }
  ],
  "total": 2,
  "query": "dub",
  "limit": 10,
  "offset": 0
}
```

**Validation Points:**
- ✅ `country` field shows full name ("United Arab Emirates" not "UAE")
- ✅ `iso_country` field present with 2-letter code
- ✅ `total` count included
- ✅ Results sorted (IATA match first, then alphabetical)

---

## 3. 🔍 429 Rate Limit Example (Requires 61+ Requests)

**Trigger:** Make 61 requests within 60 seconds

**Expected Headers:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
Content-Type: application/json
Cache-Control: no-cache
```

**Expected Body:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 60 requests per minute allowed",
  "retryAfter": 45
}
```

**Validation Points:**
- ✅ `Retry-After` header present
- ✅ Retry value matches remaining window time
- ✅ Response includes `retryAfter` in JSON body

---

## 4. 🔍 EXPLAIN ANALYZE (Requires Database Access)

**Query to Run:**
```sql
EXPLAIN ANALYZE
SELECT iata, name, city, country, iso_country 
FROM search_airports('dub', 50, 0);
```

**Alternative if function doesn't exist:**
```sql
EXPLAIN ANALYZE
SELECT iata, name, city, country, 
       COALESCE(iso_country, country_code) as iso_country
FROM airport_master
WHERE is_active = true
  AND (name ILIKE '%dub%' OR iata ILIKE '%dub%' OR city ILIKE '%dub%' OR country ILIKE '%dub%')
ORDER BY 
  CASE WHEN iata ILIKE '%dub%' THEN 1 ELSE 2 END,
  name
LIMIT 50 OFFSET 0;
```

**Performance Target:**
- ✅ p95 execution time < 200ms
- ✅ Index usage confirmed
- ✅ No sequential scans on large tables

---

## 5. 🔍 Persistence Checks (Requires Admin UI Access)

### Test Case 1: "All" Selection
**Steps:**
1. Navigate to `/admin/markup-management-air`
2. Create new markup with:
   - Origin: "All Origins"
   - Destination: "All Destinations"
3. Save

**Expected Database Result:**
```sql
SELECT origin_iata, dest_iata FROM markup_rules ORDER BY id DESC LIMIT 1;
-- Expected: NULL, NULL
```

### Test Case 2: Specific Airports
**Steps:**
1. Navigate to `/admin/markup-management-air`
2. Create new markup with:
   - Origin: "BOM - Chhatrapati Shivaji Maharaj International"
   - Destination: "DXB - Dubai International"
3. Save

**Expected Database Result:**
```sql
SELECT origin_iata, dest_iata FROM markup_rules ORDER BY id DESC LIMIT 1;
-- Expected: 'BOM', 'DXB'
```

### Test Case 3: Promo Codes (Same Semantics)
**Steps:**
1. Navigate to `/admin/promo-codes`
2. Create flight promo with:
   - Origin: "All Origins"
   - Destination: "DXB - Dubai International"
3. Save

**Expected Database Result:**
```sql
SELECT origin, destination FROM promo_codes ORDER BY id DESC LIMIT 1;
-- Expected: NULL, 'DXB'
```

---

## 6. ✅ Authentication & Mocks (Code-Level Confirmed)

### Authentication
**Middleware Stack:**
```javascript
router.use(authenticateToken);  // ✅ JWT verification
router.use(requireAdmin);        // ✅ Admin role check
```

**Test:** Unauthenticated Request
```bash
curl "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/admin/airports?q=dub"
```
**Expected:** HTTP 401 or 403

### Mock Configuration
**Code Check:**
```javascript
const USE_MOCK_AIRPORTS = process.env.USE_MOCK_AIRPORTS === "true";
```

**Environment Variables:**
- Staging: `USE_MOCK_AIRPORTS=false` ✅
- Production: `USE_MOCK_AIRPORTS=false` ✅

**Fallback Behavior:**
- If DB fails AND `USE_MOCK_AIRPORTS=false` AND `NODE_ENV=production`: Returns HTTP 503
- Mocks only used in development or if explicitly enabled

---

## Additional Validation Tests

### Search Query Tests
```bash
# Test 1: Short query (< 2 chars) - should return 400
curl -H "Authorization: Bearer <token>" \
  "BASE_URL/api/admin/airports?q=d&limit=10"
# Expected: 400 Bad Request

# Test 2: City search
curl -H "Authorization: Bearer <token>" \
  "BASE_URL/api/admin/airports?q=Mumbai&limit=10"
# Expected: Returns BOM and other Mumbai airports

# Test 3: Country search
curl -H "Authorization: Bearer <token>" \
  "BASE_URL/api/admin/airports?q=United%20Arab%20Emirates&limit=10"
# Expected: Returns DXB, AUH, SHJ, etc.

# Test 4: Limit clamping (request 1000, get max 200)
curl -H "Authorization: Bearer <token>" \
  "BASE_URL/api/admin/airports?q=a&limit=1000"
# Expected: Returns max 200 items

# Test 5: Negative offset - should return 400
curl -H "Authorization: Bearer <token>" \
  "BASE_URL/api/admin/airports?q=dub&offset=-1"
# Expected: 400 Bad Request
```

### Response Headers
```bash
# Check caching header on successful response
curl -I -H "Authorization: Bearer <token>" \
  "BASE_URL/api/admin/airports?q=dub&limit=10"
# Expected: Cache-Control: private, max-age=60
```

---

## Summary

**Code-Level Verification:** ✅ Complete
- Database connection uses `process.env.DATABASE_URL` (no hard-coding)
- Authentication middleware properly applied
- Country normalization implemented with ISO codes
- Rate limiting with `Retry-After` header
- Input validation (min query, limit clamping, offset validation)
- Mock safeguards in production

**Runtime Verification Required:** 🔍 Pending
1. Live API response with actual data
2. Rate limit trigger and header verification
3. Database query performance (EXPLAIN ANALYZE)
4. Persistence behavior (NULL for "All", IATA for specific)
5. Authentication rejection for unauthenticated requests

Once runtime verification is complete, the airport dropdown implementation will be fully signed off.
