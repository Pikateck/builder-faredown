# RateHawk Circular JSON Error - FIXED ✅

## Problem Identified

RateHawk adapter was throwing: `Converting circular structure to JSON`

**Root Cause:** Axios error objects contain circular TLSSocket references that can't be serialized.

## Issues Fixed

### 1. ✅ Unwrapped HTTP Calls
**Before:** Direct `httpClient.post()` and `httpClient.get()` calls threw raw axios errors
```javascript
// ❌ Line 155 - Direct call
const response = await this.httpClient.post("search/serp/hotels/", requestPayload);

// ❌ Line 246 - Direct call  
const response = await this.httpClient.get("search/serp/region/", { params: {...} });
```

**After:** All HTTP calls wrapped in `executeWithRetry` for proper error handling
```javascript
// ✅ Line 155-160 - Wrapped with retry/circuit breaker
const response = await this.executeWithRetry(async () => {
  return await this.httpClient.post("search/serp/hotels/", requestPayload);
});

// ✅ Line 248-255 - Wrapped with retry/circuit breaker
const response = await this.executeWithRetry(async () => {
  return await this.httpClient.get("search/serp/region/", { params: {...} });
});
```

### 2. ✅ Safe Error Logging
**Before:** Full error objects logged (circular references)
```javascript
// ❌ Line 522
this.logger.error("Failed to transform RateHawk hotel:", error);

// ❌ Line 565
this.logger.error("RateHawk health check failed:", error);
```

**After:** Only safe properties extracted before logging
```javascript
// ✅ Line 526-529
this.logger.error("Failed to transform RateHawk hotel:", {
  message: error.message,
  hotelId: hotel?.id
});
throw new Error(error.message || "Failed to transform hotel data");

// ✅ Line 564-567
this.logger.error("RateHawk health check failed:", {
  message: error.message,
  code: error.code
});
```

## Files Changed

1. **api/services/adapters/ratehawkAdapter.js**
   - Line 155-160: Wrapped `searchHotels` HTTP call in `executeWithRetry`
   - Line 248-255: Wrapped `searchRegions` HTTP call in `executeWithRetry`
   - Line 526-530: Fixed error logging in `transformRateHawkHotel`
   - Line 564-567: Fixed error logging in `performHealthCheck`

## How the Fix Works

### executeWithRetry Protection
When wrapped in `executeWithRetry`:
1. **Circuit Breaker**: Prevents repeated failures
2. **Retry Logic**: Exponential backoff (3 attempts by default)
3. **Clean Errors**: Converts axios errors to simple Error objects with just `.message`

### Error Flow (Fixed)
```
Axios Error (circular refs)
  ↓
executeWithRetry catches it
  ↓
Extracts error.message only
  ↓
Throws new Error(message)
  ↓
No circular refs ✅
```

## Next Steps

### 1. Deploy to Render
```bash
git add api/services/adapters/ratehawkAdapter.js
git commit -m "fix: RateHawk circular JSON error - wrap HTTP calls and fix error logging"
git push origin main
```

Render will auto-deploy in ~2 minutes.

### 2. Verify Fix
After deployment, run:
```bash
node reset-circuit-breakers.cjs
```

**Expected Output:**
```
✅ RATEHAWK: CLOSED (healthy)
   No circular JSON error
   Circuit breaker reset
```

### 3. Test RateHawk Hotels
```bash
curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?\
destination=Dubai&checkIn=2025-12-20&checkOut=2025-12-25&\
rooms=%5B%7B%22adults%22%3A2%7D%5D"
```

Look for:
```json
{
  "meta": {
    "suppliers": {
      "RATEHAWK": {
        "success": true,
        "resultCount": 15  // Should have real results
      }
    }
  }
}
```

## Current Status

✅ **Code Fixed** - All circular JSON issues resolved  
⏳ **Deployment Pending** - Push to Render required  
⏳ **Verification Pending** - Test after deployment

## Related Fixes

- `api/services/adapters/supplierAdapterManager.js` - Already includes RateHawk for hotels
- `api/services/adapters/baseSupplierAdapter.js` - Already has safe error handling in circuit breaker

## TBO Status

✅ **TBO is ready** - All HTTP calls already wrapped in `executeWithRetry`
⚠️ **Circuit Breaker OPEN** - Will auto-reset after successful request (30s timeout)

The TBO adapter was correctly implemented from the start with all HTTP calls wrapped.
