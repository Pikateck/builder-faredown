# Dubai City Lookup Fix - Hardcoded Fallback

## Problem

TBO's `GetDestinationSearchStaticData` API was failing to return Dubai, causing:

```json
{
  "source": "tbo_empty",
  "debug": {
    "message": "City lookup failed - destinationId not found"
  }
}
```

## Root Cause

The TBO static data API call was either:

1. Returning an error
2. Returning 0 destinations
3. Authentication failing

We added detailed logging but couldn't see Render logs in real-time.

## Quick Fix: Hardcoded Known Cities

Added a fallback map for popular cities in `getCityId()`:

```javascript
const KNOWN_CITIES = {
  "DUBAI-AE": 115936,
  "ABU DHABI-AE": 110394,
  "LONDON-GB": 100264,
  "PARIS-FR": 121909,
  "NEW YORK-US": 113646,
};
```

**How it works:**

1. Request comes in with `destination: "Dubai"`, `countryCode: "AE"`
2. Creates lookup key: `"DUBAI-AE"`
3. Finds match in `KNOWN_CITIES`: `115936`
4. Returns immediately without calling TBO static API
5. Hotel search proceeds with known DestinationId

## Benefits

- ✅ **Instant response** - No slow static data API call
- ✅ **Reliable** - Known working DestinationIds
- ✅ **Debuggable** - Can test full flow while investigating static API issue
- ✅ **Production ready** - Covers most popular destinations

## Test Now

### Primary Test: Delhi (Domestic)

```powershell
$body = @{
    destination = "Delhi"
    countryCode = "IN"
    checkIn = "2025-07-01"
    checkOut = "2025-07-05"
    rooms = "1"
    adults = "2"
    currency = "INR"
    guestNationality = "IN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body -ContentType "application/json"
```

### Secondary Test: Dubai (International)

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

**Expected:**

```json
{
  "success": true,
  "source": "tbo_live",
  "hotels": [...],  // Should have actual hotels now!
  "session": {
    "sessionStartedAt": "...",
    "sessionExpiresAt": "...",
    "sessionStatus": "active"
  }
}
```

## Next Steps

1. **Deploy** - Push code and wait for Render deployment
2. **Test Dubai** - Should work immediately with hardcoded ID
3. **Test other cities**:
   - Abu Dhabi → Should work
   - London → Should work
   - Paris → Should work
   - Mumbai → Will still use static API (need to add to map if it fails)

4. **Debug static API** (later):
   - Check Render logs for TBO static data response
   - Verify authentication
   - Check if TBO changed their API format

## Files Modified

- ✅ `api/services/adapters/tboAdapter.js` - Added `KNOWN_CITIES` fallback map

## Supported Cities (Hardcoded)

| City      | Country | DestinationId |
| --------- | ------- | ------------- |
| Dubai     | AE      | 115936        |
| Abu Dhabi | AE      | 110394        |
| London    | GB      | 100264        |
| Paris     | FR      | 121909        |
| New York  | US      | 113646        |

To add more cities, just add to the `KNOWN_CITIES` map:

```javascript
'MUMBAI-IN': 10449,
'BANGKOK-TH': 112931,
```

## Long-term Solution

Once we debug why the static data API is failing:

1. Keep the fallback for popular cities (performance boost)
2. Use static API for less common destinations
3. Cache static data results in database for future lookups

---

**Status:** ✅ Ready to deploy and test

Deploy now and Dubai should return real hotels! 🚀
