# Debugging Cache-Backed Search Error

## Error Summary
```
❌ TBO API returned error: [object Object]
⚠️ PRICE DISCREPANCY WARNING: Falling back to mock data with different prices!
```

This means the `/api/hotels/search` endpoint is returning a 500 error (or other non-200 status).

---

## Step 1: Run Diagnostic Script (5 minutes)

```bash
# SSH into the Render backend (or run locally if testing)
node api/scripts/diagnose-cache-error.js
```

This will check:
- ✅ Environment variables (TBO credentials, database)
- ✅ Database connection and cache tables
- ✅ TBO adapter initialization
- ✅ Token retrieval
- ✅ Cache service functionality

**Expected Output**: All checks should show ✅ green. If any show ❌ red, that's the issue.

---

## Step 2: Test the API Endpoint Directly

```bash
# Make a direct HTTP request to the cache search endpoint
curl -X POST https://builder-faredown-pricing.onrender.com/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "cityId": "1",
    "destination": "Dubai, United Arab Emirates",
    "cityName": "Dubai",
    "countryCode": "AE",
    "checkIn": "2025-11-30",
    "checkOut": "2025-12-03",
    "rooms": "1",
    "adults": "2",
    "children": "0",
    "currency": "INR",
    "guestNationality": "IN"
  }' | jq .
```

**Expected Response**:
```json
{
  "success": true,
  "source": "tbo",
  "hotels": [ ... ],
  "totalResults": 25,
  "cacheHit": false,
  "duration": "3500ms",
  "traceId": "..."
}
```

**If Error**: The response will show `"success": false` with an error message. Copy the error message.

---

## Step 3: Check Server Logs

```bash
# View Render logs (last 100 lines)
render logs --name=api --tail=100

# Look for these patterns:
# - "❌ Hotel search error" - shows the actual exception
# - "❌ TBO adapter error" - adapter-specific issue
# - "Database error" - database connection problem
# - "TBO Token error" - authentication issue
```

---

## Common Issues & Fixes

### Issue 1: Database Connection Error

**Symptom**: "Database error" in diagnostics

**Fix**:
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# If fails, check Render PostgreSQL connection
# In Render dashboard: Settings → PostgreSQL → Copy connection string
```

---

### Issue 2: TBO Token Error

**Symptom**: "TBO Token error" in diagnostics or "Token not obtained" in logs

**Probable Cause**: TBO credentials are incorrect or TBO API is down

**Fix**:
```bash
# Verify TBO credentials are set
echo "Client ID: $TBO_HOTEL_CLIENT_ID"
echo "User ID: $TBO_HOTEL_USER_ID"
echo "URL: $TBO_HOTEL_SEARCH_URL"

# All three must be set. If missing, update in Render environment:
# 1. Go to Render dashboard
# 2. Select API service
# 3. Settings → Environment
# 4. Verify:
#    - TBO_HOTEL_CLIENT_ID = tboprod
#    - TBO_HOTEL_USER_ID = BOMF145
#    - TBO_HOTEL_PASSWORD = @Bo#4M-Api@
```

---

### Issue 3: Cache Tables Missing

**Symptom**: Tables not found in diagnostics

**Fix**:
```bash
# Re-apply migration
psql $DATABASE_URL < api/database/migrations/20250205_hotel_cache_layer.sql

# Verify
psql $DATABASE_URL -c "\dt public.hotel_search_cache"
```

---

### Issue 4: TBO Adapter Not Initialized

**Symptom**: "TBO adapter not initialized" in logs

**Fix**:
```bash
# Check that TBO_HOTEL_USER_ID is set
echo $TBO_HOTEL_USER_ID

# If empty, set it in Render environment and restart
```

---

## Step 4: Enable Verbose Logging

If diagnostics pass but error still occurs, add more logging:

Edit `api/routes/hotels-search.js` around line 110 and add:

```javascript
console.log('🔍 DEBUG: About to call TBO adapter', {
  hasAdapter: !!adapter,
  params: tboSearchParams
});
```

Restart server and check logs again.

---

## Step 5: Check if TBO API is Accessible

The TBO API might be unreachable from Render (firewall, IP blocking, etc.)

```bash
# Test connectivity to TBO endpoint
curl -I https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult

# Should return 405 (Method Not Allowed) or 200, NOT timeout or refused connection
```

---

## Step 6: Test with Mock Data

As a temporary workaround, verify the endpoint works by forcing mock data response:

In `api/routes/hotels-search.js`, replace the TBO call with:

```javascript
const tboHotels = [
  {
    hotelId: 'mock_1',
    name: 'Test Hotel',
    starRating: 5,
    price: 5000,
    location: 'Dubai',
    images: []
  }
];
```

If this works, the issue is definitely with TBO, not the cache system.

---

## Complete Debugging Checklist

- [ ] Run `diagnose-cache-error.js` script
- [ ] All checks show ✅ green
- [ ] Test endpoint directly with curl
- [ ] Check Render logs for error message
- [ ] Verify TBO credentials are set
- [ ] Verify database connection
- [ ] Verify cache tables exist
- [ ] Test TBO API connectivity

---

## If Still Stuck

Please provide:
1. **Output of diagnostic script** (full output)
2. **curl response** from the endpoint test
3. **Last 50 lines from Render logs**
4. **Console error from browser** (full JSON)

With this information, I can pinpoint the exact issue.

---

## Quick Status Check

```bash
# One-line status check
node api/scripts/diagnose-cache-error.js 2>&1 | grep -E "✅|❌"
```

---

## Next Steps

Once diagnostic passes:
1. Make a test search on the UI
2. Check browser console for error details
3. Check Render API logs for matching trace ID
4. Compare request vs expected format
