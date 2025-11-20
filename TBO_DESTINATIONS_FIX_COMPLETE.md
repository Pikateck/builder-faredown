# TBO Destinations Array Fix - Complete

## Problem Identified

From Render logs, TBO was successfully returning destination data:

```json
{
  "Status": 1,
  "Destinations": [
    {
      "CityName": "Dubai",
      "CountryCode": "AE   ",
      "CountryName": "United Arab Emirates",
      "DestinationId": 115936
    },
    {
      "CityName": "Abu Dhabi",
      ...
    }
  ]
}
```

**But our code was looking for:**
```javascript
const { Country = [] } = response.data;
// Then: targetCountry.City.find(...)
// Then: return matchingCity.CityId
```

**Result:** `⚠️ No countries found - TBO returned empty Country array` → returning `tbo_empty`

## Root Cause

The `getCityId` function in `api/services/adapters/tboAdapter.js` was using the **wrong response structure**:
- ❌ Looking for `Country[]` array → TBO returns `Destinations[]`
- ❌ Looking for `City[]` within Country → TBO has flat `Destinations[]`
- ❌ Looking for `CityId` → TBO uses `DestinationId`

## Fix Applied

### Updated `getCityId` function (Lines 314-386)

**Changed response parsing:**
```javascript
// Before:
const { Country = [], ResponseStatus, Status, Error: ApiError } = response.data || {};

// After:
const { Destinations, ResponseStatus, Status, Error: ApiError } = response.data || {};
const destinations = Array.isArray(Destinations) ? Destinations : [];
```

**Changed city matching logic:**
```javascript
// Before:
const targetCountry = Country.find(c => c.CountryCode === normalizedCountryCode);
const matchingCity = targetCountry.City.find(city => 
  city.CityName.toLowerCase() === normalizedDestination.toLowerCase()
);
return matchingCity.CityId;

// After:
const requestedCity = normalizedDestination.trim().toLowerCase();      // "dubai"
const requestedCountry = normalizedCountryCode.trim().toUpperCase();  // "AE"

const match = destinations.find(d =>
  d.CityName?.trim().toLowerCase() === requestedCity &&
  d.CountryCode?.trim().toUpperCase() === requestedCountry
);

if (!match) {
  logger.warn("[TBO] ⚠️  No destination match", { 
    requestedCity, 
    requestedCountry, 
    destinationsCount: destinations.length 
  });
  return null; // ✅ Let caller return tbo_empty without crashing
}

logger.info("[TBO] ✅ CityId resolved", {
  cityName: match.CityName,
  countryCode: match.CountryCode,
  destinationId: match.DestinationId,
});

return match.DestinationId;
```

### Error Handling (Already in place)

**getCityId catch block (Lines 387-402):**
```javascript
// ✅ Return null instead of throwing to prevent Node crash
return null;
```

**searchHotels null handling (Lines 443-471):**
```javascript
if (!cityId) {
  this.logger.error("❌ CityId not found - TBO Static Data returned no matches", {
    returning: "empty array (tbo_empty)",
  });
  return []; // ✅ Return empty array, don't crash
}
```

## Expected Results

### Before Fix:
```
[TBO] 📥 TBO Static Data Response { Status: 1, Destinations: [...] }
[TBO] ⚠️  No countries found - TBO returned empty Country array
[TBO] ❌ CityId not found - TBO Static Data returned no matches
→ Response: { "success": true, "source": "tbo_empty", "hotels": [] }
```

### After Fix:
```
[TBO] 📥 TBO Static Data Response { Status: 1, destinationsCount: 200 }
[TBO] ✅ CityId resolved { cityName: "Dubai", countryCode: "AE", destinationId: 115936 }
[TBO] 🔍 TBO Hotel Search Request { cityId: 115936, destination: "Dubai" }
[TBO] 📥 TBO Search Response { hotelCount: 150 }
→ Response: { "success": true, "source": "tbo", "hotels": [...150 hotels...], "totalResults": 150 }
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

### Expected Logs in Render:
```
[TBO] 🏙️  TBO Static Data Request {
  endpoint: "GetDestinationSearchStaticData",
  countryCode: "AE",
  destination: "Dubai"
}

[TBO] 📥 TBO Static Data Response {
  Status: 1,
  destinationsCount: 200
}

[TBO] ✅ CityId resolved {
  cityName: "Dubai",
  countryCode: "AE",
  destinationId: 115936
}

[TBO] 🔍 TBO Hotel Search Request {
  cityId: 115936,
  destination: "Dubai",
  checkIn: "28/02/2025",
  noOfNights: 4
}

[TBO] 📥 TBO Search Response {
  hotelCount: 150
}
```

### Expected Response:
```json
{
  "success": true,
  "source": "tbo",
  "hotels": [
    {
      "hotelId": "123456",
      "name": "Burj Al Arab",
      "city": "Dubai",
      "countryCode": "AE",
      "starRating": 5,
      "price": {
        "offered": 12500,
        "published": 15000,
        "currency": "INR"
      }
    }
    // ... 149 more hotels
  ],
  "totalResults": 150,
  "cacheHit": false,
  "traceId": "..."
}
```

## Files Modified

1. **api/services/adapters/tboAdapter.js** 
   - `getCityId` function (lines 314-386): Use `Destinations[]` and `DestinationId`
   - Error handling already in place to prevent Node crashes

## What's Used Where

| Field Name | Where Used | Value Example |
|------------|------------|---------------|
| `DestinationId` | Returned by `getCityId()` | `115936` |
| `CityId` | Used in `GetHotelResult` request | `115936` (same value) |
| `cityId` | Variable name in `searchHotels` | `115936` (from getCityId) |

**Note:** TBO uses `DestinationId` in static data but `CityId` in search requests. They're the same numeric value, just different field names in different APIs.

## Deployment Checklist

- [x] Code changes complete
- [ ] Deploy to Render
- [ ] Verify Render logs show `[TBO] ✅ CityId resolved ... destinationId: 115936`
- [ ] Test PowerShell command
- [ ] Verify 200 response with non-empty hotels array
- [ ] Test from live Faredown UI
- [ ] Confirm no CORS errors in browser console

## Next Steps

1. **Deploy to Render** (automatic on git push)
2. **Wait for deployment** (check Render dashboard)
3. **Test with PowerShell** (run command above)
4. **Verify logs** (check Render logs for success messages)
5. **Test from UI** (visit https://spontaneous-biscotti-da44bc.netlify.app)
6. **Search for Dubai hotels** and verify real results appear
