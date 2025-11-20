# Hotel Search API - 400 Bad Request Fix

## Problem

PowerShell test was failing with **400 Bad Request** error:

```powershell
$body = @{
    destination = "Dubai"
    countryCode = "AE"
    checkIn = "2025-07-01"
    checkOut = "2025-07-05"
    ...
}

Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search"
# Error: (400) Bad Request
```

## Root Cause

The API route validation was expecting `cityId` but the request was sending `destination`:

**Before (api/routes/hotels-search.js line 34):**
```javascript
const { cityId, checkIn, checkOut } = req.body;
if (!cityId || !checkIn || !checkOut) {
  return res.status(400).json({ error: 'Missing cityId...' });
}
```

**But the TBO adapter call (line 178) actually uses:**
```javascript
destination: searchParams.destination || searchParams.cityName || "Dubai"
```

This was a **mismatch** - validation required `cityId`, but the adapter needed `destination`.

## Fix Applied

### 1. Updated Route Validation (api/routes/hotels-search.js)

**Changed from:**
```javascript
const { cityId, checkIn, checkOut } = req.body;
if (!cityId || !checkIn || !checkOut) { ... }
```

**Changed to:**
```javascript
const { cityId, destination, cityName, checkIn, checkOut } = req.body;
const cityIdentifier = cityId || destination || cityName;

if (!cityIdentifier || !checkIn || !checkOut) {
  return res.status(400).json({
    error: 'Missing required fields. Need: (cityId OR destination OR cityName) AND checkIn AND checkOut',
    received: { cityId, destination, cityName, checkIn, checkOut }
  });
}
```

Now accepts **any of**: `cityId`, `destination`, or `cityName`

### 2. Updated Search Hash Generation (api/services/hotelCacheService.js)

**Changed from:**
```javascript
generateSearchHash(params) {
  const hashKey = JSON.stringify({
    cityId: params.cityId,  // ❌ Only worked with cityId
    ...
  });
}
```

**Changed to:**
```javascript
generateSearchHash(params) {
  const cityIdentifier = params.cityId || params.destination || params.cityName || "unknown";
  
  const hashKey = JSON.stringify({
    cityId: cityIdentifier,  // ✅ Works with any city identifier
    ...
  });
}
```

### 3. Updated Cache Storage (api/services/hotelCacheService.js)

**Changed from:**
```javascript
params.cityId || destinationId
```

**Changed to:**
```javascript
params.cityId || destinationId || params.destination || params.cityName
```

## How It Works Now

1. **Request arrives** with `destination: "Dubai"` and `countryCode: "AE"`
2. **Validation passes** because we accept `destination` as a city identifier
3. **TBO adapter** calls `getCityId("Dubai", "AE")` to get numeric DestinationId (e.g., 115936)
4. **Search happens** with the numeric ID
5. **Cache stores** both the `destination` and the resolved `destinationId`
6. **Future requests** with same destination hit cache instantly

## Test Commands

### Test 1: First Search (Live TBO Call)
```powershell
$body = @{
    destination = "Dubai"
    countryCode = "AE"
    checkIn = "2025-07-01"
    checkOut = "2025-07-05"
    rooms = "1"
    adults = "2"
    currency = "INR"
    guestNationality = "IN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "source": "tbo_live",
  "cacheHit": false,
  "hotels": [...],
  "session": {
    "sessionStartedAt": "...",
    "sessionExpiresAt": "...",
    "sessionStatus": "active",
    "sessionTtlSeconds": 600,
    "supplier": "TBO"
  },
  "traceId": "..."
}
```

### Test 2: Repeat Search (Cache Hit)

Run the same command again immediately:

**Expected Response:**
```json
{
  "success": true,
  "source": "cache_tbo",
  "cacheHit": true,
  "hotels": [...],  // Same hotels, instant response
  "session": {
    // Same session data
  }
}
```

## Files Modified

1. ✅ `api/routes/hotels-search.js` - Updated validation to accept destination/cityId/cityName
2. ✅ `api/services/hotelCacheService.js` - Updated hash generation and cache storage
3. ✅ `api/services/adapters/tboAdapter.js` - Already returns session metadata (previous fix)

## Deployment

All changes are in the repository. After deploying to Render:

1. Test with PowerShell command above
2. Verify logs show `[TBO] ✅ CityId resolved`
3. Confirm response includes `session` metadata
4. Test cache hit on second call

## Status

- [x] Database migration applied
- [x] TBO adapter returns session metadata
- [x] Route validation accepts destination
- [x] Cache service handles destination
- [ ] Deploy to Render
- [ ] Test PowerShell command
- [ ] Verify cache behavior

Ready for deployment! 🚀
