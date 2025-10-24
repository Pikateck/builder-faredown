# Hotel Search Returning 0 Properties - Complete Fix

**Date:** October 25, 2025  
**Issue:** Hotel search results page showing "0 properties found"  
**Root Cause:** Missing `countryCode` parameter in hotel search flow

---

## 🔍 Root Cause Analysis

The frontend was calling `/api/hotels?cityId=DXB&...` without passing a country code. The backend defaulted `countryCode` to `"IN"` (India).

When TBO adapter tried to find DXB in India (via `getCityId("DXB", "IN")`), it failed and returned 0 results.

**Issue Flow:**

```
Frontend sends: ?cityId=DXB
Backend defaults: countryCode="IN"
getCityId("DXB", "IN") → No match found (DXB is in UAE, not India)
Result: 0 hotels returned
```

---

## ✅ Solution Implemented

### 1. Frontend Changes (client/pages/HotelResults.tsx)

**Added:** City-to-Country mapping (lines 428-443)

```javascript
const countryCodeMap: { [key: string]: string } = {
  "DXB": "AE", "AUH": "AE", "RAK": "AE", // UAE
  "DEL": "IN", "BLR": "IN", "BOM": "IN", // India
  "PAR": "FR", "CDG": "FR", // France
  "LDN": "GB", "LGW": "GB", "STN": "GB", // UK
  "NYC": "US", "LAX": "US", "SFO": "US", // US
  "TYO": "JP", "KIX": "JP", // Japan
  "SYD": "AU", // Australia
  "SGP": "SG", // Singapore
  "BKK": "TH", // Thailand
  "HKG": "HK", // Hong Kong
};

const countryCode = countryCodeMap[destCode] || "IN"; // Default to India
```

**Updated:** API call to include countryCode (line 448)

```javascript
const metadataResponse = await fetch(
  `${apiBaseUrl}/hotels?cityId=${destCode}&checkIn=${checkInStr}&checkOut=${checkOutStr}&adults=${adultsCount}&children=${childrenCount}&countryCode=${countryCode}`,
);
```

### 2. Backend Changes (api/routes/hotels-metadata.js)

**Updated:** Parameter extraction (line 70)

```javascript
const countryCode = req.query.countryCode || "IN"; // Accept from frontend
```

**Updated:** Search parameters (line 110)

```javascript
const searchParams = {
  destination: cityId,
  checkIn: finalCheckIn,
  checkOut: finalCheckOut,
  adults,
  children,
  currency: "INR",
  countryCode, // Now passed to TBO adapter
  maxResults: 50,
};
```

**Updated:** Debug logging (line 82)

```javascript
console.log(
  `   City: ${cityId} | Country: ${countryCode} | CheckIn: ${checkIn} | CheckOut: ${checkOut}`,
);
```

---

## 🔄 How It Works Now

```
1. User searches for "Dubai" (DXB)
   ↓
2. Frontend:
   - Maps DXB → AE (United Arab Emirates)
   - Calls /api/hotels?cityId=DXB&countryCode=AE&...
   ↓
3. Backend:
   - Receives countryCode=AE
   - Creates searchParams with countryCode
   - Passes to adapter.searchHotels()
   ↓
4. TBO Adapter:
   - Calls getCityId("DXB", "AE")
   - Correctly finds Dubai's DestinationId
   - Calls TBO Search API
   - Returns hotels
   ↓
5. Results:
   - Hotels displayed in search results
   - Room-wise details populated from enriched data
```

---

## 📋 Supported Cities

| Code | City      | Country   | Code |
| ---- | --------- | --------- | ---- |
| DXB  | Dubai     | UAE       | AE   |
| AUH  | Abu Dhabi | UAE       | AE   |
| DEL  | Delhi     | India     | IN   |
| BLR  | Bangalore | India     | IN   |
| BOM  | Mumbai    | India     | IN   |
| PAR  | Paris     | France    | FR   |
| LDN  | London    | UK        | GB   |
| NYC  | New York  | USA       | US   |
| TYO  | Tokyo     | Japan     | JP   |
| SYD  | Sydney    | Australia | AU   |
| SGP  | Singapore | Singapore | SG   |
| BKK  | Bangkok   | Thailand  | TH   |
| HKG  | Hong Kong | Hong Kong | HK   |

---

## ✨ Additional Enhancements

### Room-wise Data Enrichment (Implemented Earlier)

The search now also enriches top 10 hotels with room-wise details:

**What's Included:**

- ✅ Room type names
- ✅ Bed types
- ✅ Pricing per room
- ✅ Tax breakdown
- ✅ Amenities per room
- ✅ Cancellation policies (actual, from API)
- ✅ Payment terms (at hotel vs. prepaid)
- ✅ Room descriptions

**Implementation:** `api/services/adapters/tboAdapter.js`

- Lines 1376-1420: Enrichment with timeout protection
- Lines 1460-1507: `_enrichHotelWithRoomDetails()` method

---

## 🧪 Testing

### Frontend Test

1. Navigate to hotel search
2. Enter: Destination: "Dubai", Dates: Oct 31 - Nov 3, Guests: 2 adults, 0 children
3. Click Search
4. Verify: Results page shows hotels (not 0 properties)

### Backend Test (via curl)

```bash
curl "https://builder-faredown-pricing.onrender.com/api/hotels?cityId=DXB&checkIn=2025-10-31&checkOut=2025-11-03&adults=2&children=0&countryCode=AE"
```

**Expected Response:**

```json
{
  "success": true,
  "hotels": [
    {
      "id": "DXBHOTEL001",
      "name": "Hotel Name",
      "stars": 5,
      "image": "...",
      "currentPrice": 15000,
      "originalPrice": 17500,
      "currency": "INR",
      "supplier": "TBO",
      "isLiveData": true,
      "rates": [...],
      "amenities": [...]
    },
    ...
  ],
  "totalResults": 50,
  "source": "tbo_live"
}
```

---

## 📊 Files Modified

| File                          | Changes                                      | Lines       |
| ----------------------------- | -------------------------------------------- | ----------- |
| client/pages/HotelResults.tsx | Added countryCodeMap, updated API call       | 428-448     |
| api/routes/hotels-metadata.js | Added countryCode parameter, pass to adapter | 70, 82, 110 |

---

## ✅ Build Status

✅ Frontend build successful (no errors)
✅ Backend syntax verified (no errors)
✅ All changes deployed

---

## 🚀 Next Steps

1. User refreshes hotel search results page
2. Hotels from Dubai should now display
3. Room-wise details populated from API
4. Test other destinations (Paris, London, etc.)
5. Verify on mobile design as well

---

## 🔄 Rollback Plan

If issues occur:

1. Remove countryCode from frontend API call (line 448 in HotelResults.tsx)
2. Remove countryCodeMap (lines 428-443)
3. Revert api/routes/hotels-metadata.js to default countryCode="IN"

---

**Status:** ✅ DEPLOYED AND READY FOR TESTING

Test the fix by navigating to the hotel results page again with:

- Destination: Dubai (DXB)
- Dates: Oct 31 - Nov 3, 2025
- Guests: 2 adults, 0 children

Expected: Hotels should now display instead of "0 properties found"
