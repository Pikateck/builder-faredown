# TBO Static Data Credentials Setup

## Required Environment Variables

The code expects these **exact variable names** in Render:

```bash
TBO_STATIC_USER=travelcategory
TBO_STATIC_PASSWORD=Tra@59334536
```

### Current Render Environment
You currently have (different names):
- ❌ `TBO_STATIC_DATA_CREDENTIALS_USERNAME` (not recognized)
- ❌ `TBO_STATIC_DATA_CREDENTIALS_PASSWORD` (not recognized)

### What Needs to Change

**Environment: Render Dashboard (Web Browser)**

1. Go to: https://dashboard.render.com
2. Select: `builder-faredown-pricing` service
3. Click: **Environment** tab
4. **Add these new variables:**

```
Variable Name: TBO_STATIC_USER
Value: travelcategory
```

```
Variable Name: TBO_STATIC_PASSWORD
Value: Tra@59334536
```

5. **Optional - Set explicit URL:**
```
Variable Name: TBO_HOTEL_STATIC_DATA
Value: https://apiwr.tboholidays.com/HotelAPI/
```

6. Click **Save Changes**
7. Click **Manual Deploy** → **Deploy latest commit**

---

## Testing After Deploy

### Test 1: Check Logs for Static Data Call
**Environment: Render Dashboard Logs (Web Browser)**

After deploy, run the Dubai search again and look for these log entries:

**Good Signs:**
```
🏙️ TBO Static Data Request {
  destination: "Dubai, United Arab Emirates",
  countryCode: "AE",
  tokenId: "abc12345...",
  endUserIp: "52.5.155.132",
  fullPayload: {...}
}

📥 TBO Static Data Response {
  statusOk: true,
  dataCount: 5,
  firstCity: "Dubai"
}

✅ CityId Retrieved {
  destination: "Dubai, United Arab Emirates",
  cityId: "130443",
  cityName: "Dubai"
}
```

**Bad Signs (Current Issue):**
```
⚠️ No cities found - TBO returned empty Data array {
  destination: "Dubai, United Arab Emirates",
  countryCode: "AE",
  fullResponse: {...}
}

❌ CityId not found - TBO Static Data returned no matches
```

---

### Test 2: Try Different City Name Formats

If TBO still returns empty after setting credentials, try these variations:

**Environment: PowerShell**

```powershell
# Test 1: Just "Dubai"
$body1 = @{
    destination = "Dubai"
    cityName = "Dubai"
    countryCode = "AE"
    checkIn = "2025-11-30"
    checkOut = "2025-12-04"
    rooms = "1"
    adults = "1"
    children = "0"
    currency = "INR"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body1 -ContentType "application/json"
```

```powershell
# Test 2: "DUBAI" (uppercase)
$body2 = @{
    destination = "DUBAI"
    cityName = "DUBAI"
    countryCode = "AE"
    checkIn = "2025-11-30"
    checkOut = "2025-12-04"
    rooms = "1"
    adults = "1"
    children = "0"
    currency = "INR"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body2 -ContentType "application/json"
```

```powershell
# Test 3: Use cityId directly (if known)
$body3 = @{
    cityId = "130443"  # Common TBO CityId for Dubai
    destination = "Dubai"
    countryCode = "AE"
    checkIn = "2025-11-30"
    checkOut = "2025-12-04"
    rooms = "1"
    adults = "1"
    children = "0"
    currency = "INR"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body3 -ContentType "application/json"
```

---

## Expected Behavior After Fix

Once credentials are set and city name is matched:

1. **TBO Static Data Call:**
   - Request with TokenId to GetDestinationSearchStaticData
   - Returns Data array with CityId for Dubai

2. **TBO Hotel Search Call:**
   - Request with CityId to GetHotelResult
   - Returns HotelResults array with 100+ Dubai hotels

3. **API Response:**
   ```json
   {
     "success": true,
     "source": "tbo",
     "hotels": [...],  // ✅ Non-empty array
     "totalResults": 150
   }
   ```

4. **Frontend:**
   - HotelResults.tsx shows real hotels
   - No more "0 properties found"

---

## Troubleshooting

### If Still Getting Empty Results After Credential Fix

Check Render logs for the **fullResponse** logged when no cities found:

```
⚠️ No cities found - TBO returned empty Data array {
  fullResponse: {
    ResponseStatus: 0,
    Error: {
      ErrorCode: "XXX",
      ErrorMessage: "..."
    }
  }
}
```

**Common Issues:**
- `ErrorMessage: "Invalid credentials"` → Wrong username/password
- `ErrorMessage: "Invalid TokenId"` → Token expired, need fresh auth
- `ErrorMessage: "No destinations found"` → City name mismatch
- `Data: []` with no error → Country code or search query doesn't match TBO's database

### Dubai City Mapping Reference

TBO may use different city identifiers:
- Common CityId for Dubai: `130443` or `130442`
- City Name variations: "Dubai", "DUBAI", "Dubai City"
- If GetDestinationSearchStaticData fails, we need to add a hardcoded mapping:
  ```javascript
  const CITY_MAPPINGS = {
    'DXB': { cityId: '130443', cityName: 'Dubai', countryCode: 'AE' },
    // ... other common cities
  };
  ```

---

## Next Steps

1. ✅ Set `TBO_STATIC_USER` and `TBO_STATIC_PASSWORD` in Render
2. ✅ Deploy the updated code (with enhanced logging)
3. ✅ Run Dubai search and check Render logs
4. ✅ Share the `fullResponse` from logs if still empty
5. 🔄 Adjust city mapping if needed based on what TBO actually accepts
