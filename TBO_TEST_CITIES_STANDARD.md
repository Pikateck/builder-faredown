# TBO Testing Standard - Delhi & Dubai

## Standard Test Cities

### 🇮🇳 Domestic Testing: DELHI
- **City:** Delhi (or New Delhi)
- **Country Code:** IN
- **DestinationId:** 130443
- **Use for:** All domestic India testing

### 🇦🇪 International Testing: DUBAI
- **City:** Dubai
- **Country Code:** AE
- **DestinationId:** 115936
- **Use for:** All international testing

---

## PowerShell Test Commands

### Test 1: Domestic (Delhi)
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

### Test 2: International (Dubai)
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

---

## All Supported Cities (Hardcoded)

### India (Domestic)
| City | Code | DestinationId |
|------|------|---------------|
| **Delhi** ⭐ | IN | 130443 |
| New Delhi | IN | 130443 |
| Mumbai | IN | 10449 |
| Bangalore | IN | 127394 |
| Kolkata | IN | 129880 |

### Middle East
| City | Code | DestinationId |
|------|------|---------------|
| **Dubai** ⭐ | AE | 115936 |
| Abu Dhabi | AE | 110394 |

### Europe
| City | Code | DestinationId |
|------|------|---------------|
| London | GB | 100264 |
| Paris | FR | 121909 |

### Americas
| City | Code | DestinationId |
|------|------|---------------|
| New York | US | 113646 |

⭐ = Primary test city

---

## Expected Test Results

### First Call (Live TBO)
```json
{
  "success": true,
  "source": "tbo_live",
  "cacheHit": false,
  "hotels": [...],
  "totalResults": 150,
  "session": {
    "sessionStartedAt": "2025-06-10T12:00:00Z",
    "sessionExpiresAt": "2025-06-10T12:10:00Z",
    "sessionStatus": "active",
    "sessionTtlSeconds": 600,
    "supplier": "TBO"
  },
  "duration": "2345ms",
  "traceId": "..."
}
```

### Second Call (Cache Hit)
```json
{
  "success": true,
  "source": "cache_tbo",
  "cacheHit": true,
  "hotels": [...],  // Same hotels
  "session": {
    // Same session data
  },
  "duration": "123ms",  // Much faster!
  "traceId": "..."
}
```

---

## Testing Workflow

1. **Always start with Delhi** for domestic testing
2. **Use Dubai** for international testing
3. **First call** verifies TBO integration works
4. **Second call** verifies caching works
5. **Check session timer** shows countdown from 10 minutes

---

## When to Add New Cities

If you need to test a city not in the list:

1. Search for the city on TBO to get DestinationId
2. Add to `KNOWN_CITIES` map in `api/services/adapters/tboAdapter.js`:
   ```javascript
   'CITY NAME-COUNTRY': destinationId,
   ```
3. Deploy and test

---

## Logs to Check on Render

### Success Pattern
```
🏙️  TBO Static Data Request { destination: "Delhi", countryCode: "IN" }
✅ Using hardcoded DestinationId for known city { destinationId: 130443 }
🔍 TBO Hotel Search Request { cityId: 130443 }
📥 TBO Search Response { hotelCount: 150 }
✅ TBO returned 150 hotels
```

### Cache Hit Pattern
```
🔍 Hotel search [uuid] - Hash: a1b2c3...
✅ CACHE HIT [uuid] - 150 hotels cached
```

---

**Last Updated:** June 2025
**Standard:** Use Delhi for all testing unless specifically testing international destinations
