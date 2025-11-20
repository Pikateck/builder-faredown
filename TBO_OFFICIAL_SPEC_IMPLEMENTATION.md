# TBO Hotel API Implementation Guide
## Based on Official API_SPECIFICATION.md

---

## ✅ CORRECTED URLs (Per Official Spec)

### What Changed

**BEFORE (INCORRECT):**
```javascript
hotelSearchUrl: "https://affiliate.travelboutiqueonline.com/HotelAPI/"
```

**AFTER (CORRECT - Per API_SPECIFICATION.md):**
```javascript
hotelSearchUrl: "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult"
```

---

## Official TBO Endpoints

| Function | URL | Auth Method |
|----------|-----|-------------|
| **Authenticate** | `https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate` | ClientId/UserName/Password |
| **GetDestinationSearchStaticData** | `https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData` | TokenId |
| **GetHotelResult (Search)** | `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult` | TokenId |
| **GetHotelRoom** | `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelRoom` | TokenId |
| **BlockRoom** | `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom` | TokenId |
| **Book** | `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book` | TokenId |
| **GenerateVoucher** | `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GenerateVoucher` | TokenId |
| **GetBookingDetails** | `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetBookingDetails` | TokenId |

---

## Credentials (from Zubin)

### Dynamic API (Hotel Search/Booking)
```
ClientId: tboprod
UserName: BOMF145
Password: @Bo#4M-Api@
EndUserIp: 52.5.155.132 or 52.87.82.133
```

### Static Data (Hotels) - CountryList/CityList endpoints
**NOTE:** These are for `https://apiwr.tboholidays.com/HotelAPI/` endpoints (NOT GetDestinationSearchStaticData)
```
UserName: travelcategory
Password: Tra@59334536
```

---

## Current Implementation Status

### ✅ Fixed in Code

1. **Search URL**: Now uses `hotelbooking.travelboutiqueonline.com` (not affiliate)
2. **Rooms Normalization**: Converts string to array before caching
3. **Enhanced Logging**: Shows full Static Data request/response
4. **IP Address**: Added EndUserIp to Static Data requests

### 🔄 Next Steps

1. **Deploy Updated Code** to Render
2. **Set Environment Variables** (if not set):
   ```
   TBO_STATIC_USER=travelcategory
   TBO_STATIC_PASSWORD=Tra@59334536
   ```
3. **Test Dubai Search** and check logs for:
   - Static Data response structure
   - CityId matching logic
   - Hotel search call

---

## GetDestinationSearchStaticData - How It Works

### Request Format (Per Spec)
```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[from Authenticate]"
}
```

**NOTE:** Request does NOT include CountryCode or SearchQuery - it returns ALL countries/cities in one response.

### Response Format (Per Spec)
```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "Country": [
    {
      "CountryCode": "AE",
      "CountryName": "United Arab Emirates",
      "City": [
        {
          "CityId": 130443,
          "CityName": "Dubai",
          "CountryCode": "AE"
        },
        {
          "CityId": 130444,
          "CityName": "Abu Dhabi",
          "CountryCode": "AE"
        }
      ]
    }
  ]
}
```

### Current Code Issue

The adapter is calling:
```javascript
const staticRequest = {
  TokenId: this.tokenId,
  CountryCode: countryCode,        // ❌ NOT in official spec
  SearchQuery: destination,         // ❌ NOT in official spec
  EndUserIp: this.config.endUserIp,
};
```

**Should be:**
```javascript
const staticRequest = {
  TokenId: this.tokenId,
  EndUserIp: this.config.endUserIp,
  // That's it! No CountryCode or SearchQuery
};
```

Then client-side filtering is needed to match destination against returned cities.

---

## Dubai City ID Resolution

### Problem
We send: `destination: "Dubai, United Arab Emirates"`
TBO expects: `CityName: "Dubai"` (exact match)

### Solution Options

#### Option 1: Pre-process Destination String
```javascript
// Strip common suffixes before matching
function normalizeDestination(destination) {
  return destination
    .replace(/,.*$/, '')  // Remove everything after comma
    .trim();
}

// "Dubai, United Arab Emirates" → "Dubai"
```

#### Option 2: Hardcode Common City Mappings
```javascript
const CITY_ID_MAPPINGS = {
  'DXB': { cityId: 130443, cityName: 'Dubai', countryCode: 'AE' },
  'AUH': { cityId: 130444, cityName: 'Abu Dhabi', countryCode: 'AE' },
  'BOM': { cityId: 10449, cityName: 'Mumbai', countryCode: 'IN' },
  'DEL': { cityId: 10448, cityName: 'Delhi', countryCode: 'IN' },
};
```

#### Option 3: Fuzzy String Matching
```javascript
// Use Levenshtein distance or similar to find closest match
function findBestCityMatch(searchQuery, cities) {
  // Find city with shortest edit distance to searchQuery
}
```

---

## Immediate Action Plan

### Step 1: Fix Static Data Request Format
**File:** `api/services/adapters/tboAdapter.js` (getCityId method)

Remove CountryCode and SearchQuery from request, implement client-side filtering.

### Step 2: Deploy to Render
**Environment: Render Dashboard (Web Browser)**

1. Ensure env vars are set (if needed)
2. Click **Manual Deploy** → **Deploy latest commit**

### Step 3: Test Dubai Search
**Environment: PowerShell**

```powershell
$body = @{
    cityId = "DXB"
    destination = "Dubai"  # Try simplified name
    countryCode = "AE"
    checkIn = "2025-11-30"
    checkOut = "2025-12-04"
    rooms = "1"
    adults = "1"
    children = "0"
    currency = "INR"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 10
```

### Step 4: Check Render Logs
**Environment: Render Dashboard Logs (Web Browser)**

Look for:
```
📥 TBO Static Data Response {
  statusOk: true,
  ResponseStatus: 1,
  dataCount: ???,
  firstCity: "...",
  fullResponse: {...}
}
```

This will show us:
1. Is Static Data call working?
2. What does TBO actually return?
3. How many cities/countries are in the response?
4. What format is the data?

---

## Expected Flow After Fix

### 1. Authenticate
```
POST https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate
→ Get TokenId
```

### 2. Get All Cities (Static Data)
```
POST https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData
Body: { TokenId, EndUserIp }
→ Get full list of countries/cities
→ Client-side filter: Find CityId for "Dubai" in "AE"
```

### 3. Search Hotels
```
POST https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult
Body: { TokenId, CityId: 130443, CheckInDate, NoOfNights, ... }
→ Get hotel results
```

### 4. Return to Frontend
```json
{
  "success": true,
  "source": "tbo",
  "hotels": [...100+ hotels...],
  "totalResults": 150
}
```

---

## Testing Checklist

- [ ] Code deployed to Render
- [ ] Static Data call returns full country/city list
- [ ] CityId for "Dubai" is found in response
- [ ] Hotel search called with correct CityId
- [ ] Hotels array is non-empty
- [ ] Frontend displays hotels

---

## Reference

All implementation details based on:
- **File:** `api/tbo/API_SPECIFICATION.md`
- **Section:** "Authentication & Static Data" → "Get Destination Search Static Data"
- **Official TBO Documentation:** https://www.tboholidays.com/developer-api
