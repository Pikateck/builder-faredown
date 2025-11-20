# TBO CountryCode Fix - Complete

## Problem Identified

From Render logs, when calling `POST /api/hotels/search` with:
```json
{
  "destination": "Dubai, United Arab Emirates",
  "countryCode": "AE",
  "checkIn": "2025-12-01",
  "checkOut": "2025-12-04",
  "rooms": "1",
  "adults": "1",
  "children": "0",
  "currency": "INR"
}
```

TBO rejected the request with:
```
[TBO] 📥 TBO Static Data Response {"Status":2,"Error":{"ErrorMessage":"CountryCode can not be null"}}
Error: Static data failed: CountryCode can not be null
```

**Root Cause:** The `getCityId` function in `api/services/adapters/tboAdapter.js` was NOT sending `CountryCode` in the request payload to TBO's `GetDestinationSearchStaticData` endpoint.

## Fixes Applied

### 1. Added CountryCode to TBO Static Data Request (Lines 262-294)

**Before:**
```javascript
const staticRequest = {
  TokenId: this.tokenId,
  EndUserIp: this.config.endUserIp,
  // NO CountryCode or SearchQuery - returns all countries/cities
};
```

**After:**
```javascript
// Normalize and validate countryCode
const normalizedCountryCode = (countryCode || "").trim().toUpperCase();
if (!normalizedCountryCode) {
  this.logger.error("❌ CountryCode is required for GetDestinationSearchStaticData");
  return null;
}

const staticRequest = {
  TokenId: this.tokenId,
  EndUserIp: this.config.endUserIp,
  CountryCode: normalizedCountryCode, // ✅ Required by TBO
};
```

### 2. Improved Error Handling to Prevent Node Crashes (Lines 382-404, 443-469)

**Changed `getCityId` catch block:**
```javascript
// Before: throw error (crashes Node)
throw error;

// After: return null (graceful failure)
return null;
```

**Changed `searchHotels` catch block:**
```javascript
// Before: throw err (crashes Node)
throw err;

// After: return [] (graceful failure)
return [];
```

### 3. Normalized destination and countryCode early

- Extract city name: `"Dubai, United Arab Emirates"` → `"Dubai"`
- Uppercase countryCode: `"ae"` → `"AE"`
- Validate before sending to TBO

## Expected Results

### Before Fix:
```
POST /api/hotels/search
→ 500 Internal Server Error
→ Node process restarts
→ Error: "CountryCode can not be null"
```

### After Fix:
```
POST /api/hotels/search
→ 200 OK
→ { "success": true, "hotels": [...], "totalResults": 150 }
→ Node process continues running
```

## Testing Instructions

### PowerShell Test:
```powershell
$body = @{
    destination = "Dubai"
    countryCode = "AE"
    checkIn = "2025-02-28"
    checkOut = "2025-03-04"
    rooms = "1"
    adults = "2"
    children = "0"
    currency = "INR"
    guestNationality = "IN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body -ContentType "application/json"
```

### Expected Response:
```json
{
  "success": true,
  "source": "tbo",
  "hotels": [
    {
      "hotelId": "123456",
      "name": "Hotel Name",
      "city": "Dubai",
      "starRating": 5,
      "price": {
        "offered": 1200,
        "published": 1500,
        "currency": "INR"
      }
    }
  ],
  "totalResults": 150,
  "traceId": "..."
}
```

## Files Modified

1. `api/services/adapters/tboAdapter.js` - Fixed `getCityId` function and error handling

## Deployment Checklist

- [x] Code changes complete
- [ ] Deploy to Render
- [ ] Test PowerShell command
- [ ] Verify Render logs show successful TBO static data call
- [ ] Test from live Faredown UI
- [ ] Confirm Node process doesn't restart on errors

## Next Steps

1. Deploy this fix to Render
2. Run PowerShell test command
3. Verify 200 response with hotels array
4. Test from live UI at https://spontaneous-biscotti-da44bc.netlify.app
