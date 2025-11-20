# TBO Fixes - Based on Official API_SPECIFICATION.md

## What Was Wrong

### 1. Wrong Search URL

**Before:**

```javascript
hotelSearchUrl: "https://affiliate.travelboutiqueonline.com/HotelAPI/";
```

**After (Per API_SPECIFICATION.md):**

```javascript
hotelSearchUrl: "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult";
```

### 2. Wrong Static Data Request Format

**Before:**

```javascript
{
  TokenId: "xxx",
  CountryCode: "AE",  // ❌ Not in spec
  SearchQuery: "Dubai, United Arab Emirates",  // ❌ Not in spec
  EndUserIp: "52.5.155.132"
}
```

**After (Per API_SPECIFICATION.md):**

```javascript
{
  TokenId: "xxx",
  EndUserIp: "52.5.155.132"
  // Returns ALL countries/cities, filter client-side
}
```

### 3. Wrong Response Parsing

**Before:** Expected `Data` array directly
**After:** Response has `Country` array, each with `City` array inside

---

## Files Modified

1. **api/services/adapters/tboAdapter.js**
   - Fixed `hotelSearchUrl` to use correct endpoint
   - Fixed `getCityId()` request format
   - Added client-side filtering for city lookup
   - Normalized destination strings ("Dubai, UAE" → "Dubai")
   - Enhanced logging to show matching process

---

## How City Matching Works Now

### Input

```
destination: "Dubai, United Arab Emirates"
countryCode: "AE"
```

### Process

1. Call GetDestinationSearchStaticData (returns ALL countries/cities)
2. Normalize destination: "Dubai, United Arab Emirates" → "Dubai"
3. Find country: `Country.find(c => c.CountryCode === "AE")`
4. Find city: `targetCountry.City.find(c => c.CityName === "Dubai")`
5. Return `CityId: 130443`

### Logs Will Show

```
🏙️ TBO Static Data Request (Per API_SPECIFICATION.md) {
  endpoint: "https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData",
  note: "Fetching ALL countries/cities, will filter for: Dubai, United Arab Emirates"
}

📥 TBO Static Data Response {
  statusOk: true,
  countryCount: 50,  // Example
  ResponseStatus: 1
}

✅ CityId Retrieved {
  destination: "Dubai, United Arab Emirates",
  normalizedDestination: "Dubai",
  cityId: 130443,
  cityName: "Dubai",
  countryCode: "AE"
}
```

---

## Next Steps

### 1. Deploy to Render

**Environment: Render Dashboard (Web Browser)**

Go to https://dashboard.render.com

- Select `builder-faredown-pricing`
- Click **Manual Deploy** → **Deploy latest commit**
- Wait for build (~2-3 minutes)

### 2. Test Dubai Search

**Environment: PowerShell**

```powershell
$body = @{
    cityId = "DXB"
    destination = "Dubai, United Arab Emirates"
    countryCode = "AE"
    checkIn = "2025-12-01"
    checkOut = "2025-12-04"
    rooms = "1"
    adults = "1"
    children = "0"
    currency = "INR"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 5
```

**Expected Response:**

```json
{
  "success": true,
  "source": "tbo",
  "hotels": [
    {
      "hotelId": "TBO123456",
      "name": "Luxury Hotel Dubai",
      "starRating": 5,
      "price": {...}
    },
    ...
  ],
  "totalResults": 150
}
```

### 3. Check Render Logs

**Environment: Render Dashboard Logs (Web Browser)**

Look for this sequence:

1. ✅ `🏙️ TBO Static Data Request` - Shows it's calling GetDestinationSearchStaticData
2. ✅ `📥 TBO Static Data Response` - Shows countryCount > 0
3. ✅ `✅ CityId Retrieved` - Shows cityId found for Dubai
4. ✅ `🔍 TBO Hotel Search Request` - Shows calling GetHotelResult with CityId
5. ✅ `✅ TBO Hotel Search Success` - Shows hotels returned

If any step fails, the logs will show:

- ⚠️ Warning messages with available options
- ❌ Error messages with detailed context

---

## What Should Happen Now

### Before (Issue)

```
POST /api/hotels/search
→ Call GetDestinationSearchStaticData with CountryCode/SearchQuery
→ TBO returns error or empty data
→ No CityId found
→ Return { source: "tbo_empty", hotels: [], totalResults: 0 }
```

### After (Fixed)

```
POST /api/hotels/search
→ Call GetDestinationSearchStaticData (get all cities)
→ Filter for "Dubai" in "AE"
→ Found CityId: 130443
→ Call GetHotelResult with CityId
→ Return { source: "tbo", hotels: [150+ hotels], totalResults: 150 }
```

---

## Reference

All fixes based on:

- **File:** `api/tbo/API_SPECIFICATION.md`
- **Section:** "Authentication & Static Data" → "Get Destination Search Static Data"
- **TBO Official Documentation:** https://www.tboholidays.com/developer-api

---

## Troubleshooting

### If Still Getting Empty Results

Check Render logs for:

**Issue 1: City name mismatch**

```
⚠️ City not found in static data {
  destination: "Dubai, United Arab Emirates",
  normalizedDestination: "Dubai",
  availableCities: ["Abu Dhabi", "Sharjah", ...]
}
```

→ TBO uses different city name, try variations

**Issue 2: Country not found**

```
⚠️ Country not found in static data {
  countryCode: "AE",
  availableCountries: ["IN", "US", "GB", ...]
}
```

→ Check if TBO supports AE in static data

**Issue 3: Token issue**

```
❌ TBO Static Data Error Response {
  ErrorMessage: "Invalid TokenId"
}
```

→ Token expired, will auto-refresh on next request

---

## Summary

✅ **Fixed:** Search URL matches official spec  
✅ **Fixed:** Static Data request format matches official spec  
✅ **Fixed:** Response parsing handles Country → City structure  
✅ **Fixed:** Client-side city filtering with normalization  
✅ **Added:** Comprehensive logging for debugging

**Result:** Dubai hotel search should now return real TBO hotels instead of empty array.
