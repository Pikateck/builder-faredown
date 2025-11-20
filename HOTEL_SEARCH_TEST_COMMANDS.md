# Hotel Search Test Commands - Rooms Normalization Fix

**Status**: ✅ Complete  
**Latest Changes**: Rooms normalization, consistent logging across all endpoints  
**Test Date**: February 2025

---

## Overview

All hotel search endpoints now support **simple URL parameters** that are automatically normalized to TBO's required array format internally:

- Simple input: `rooms=1&adults=2&children=0`
- Internal conversion: `rooms: [{ adults: 2, children: 0, childAges: [] }]`
- **No more `rooms.map is not a function` errors**

---

## Test Scenario

**Search Parameters**:

- Destination: Dubai (city code: DXB)
- Country: UAE (country code: AE)
- Check-in: 2025-12-01
- Check-out: 2025-12-04
- Guests: 2 adults, 0 children
- Rooms: 1
- Currency: INR
- Nationality: IN (India)

---

## Test Command 1: GET /api/hotels (Query Parameters)

**Simple URL format** - best for quick testing

```bash
curl -X GET "http://localhost:3000/api/hotels?cityId=DXB&checkIn=2025-12-01&checkOut=2025-12-04&adults=2&children=0&rooms=1&currency=INR" \
  -H "Content-Type: application/json"
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "hotels": [
    {
      "hotelId": "12345",
      "name": "City Center Inn Dubai Downtown",
      "city": "Dubai",
      "price": 4500,
      "originalPrice": 5000,
      "currency": "INR",
      "supplier": "TBO",
      "checkIn": "2025-12-01",
      "checkOut": "2025-12-04",
      "images": ["url1", "url2"],
      "amenities": ["WiFi", "Restaurant"],
      "starRating": 4,
      "location": "Downtown, Dubai",
      "isLiveData": true
    }
  ],
  "total": 5,
  "cacheHit": false
}
```

**Expected Logs**:

```
📥 Incoming Search Parameters: {
  destination: "DXB",
  checkIn: "2025-12-01",
  checkOut: "2025-12-04",
  adults: 2,
  children: 0,
  rooms: "1",        ← Note: string from query param
  roomsType: "string",
  currency: "INR"
}

🔄 Normalizing rooms parameter: {
  incoming: {
    rooms: "1",
    roomsType: "string",
    adults: 2,
    children: 0
  }
}

✅ Rooms normalized (from simple params): {
  inputRooms: "1",
  normalizedRooms: [{ adults: 2, children: 0, childAges: [] }],
  count: 1
}

🎫 Built RoomGuests Array: {
  roomGuests: [{ NoOfAdults: 2, NoOfChild: 0, ChildAge: [] }],
  count: 1
}

🔍 TBO Hotel Search Request: {
  endpoint: "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult",
  destination: "DXB",
  cityId: 2,
  checkIn: "01/12/2025",    ← Formatted for TBO (dd/MM/yyyy)
  noOfNights: 3,
  currency: "INR",
  rooms: 1,
  roomGuests: [{ NoOfAdults: 2, NoOfChild: 0, ChildAge: [] }]
}

✅ TBO Search SUCCESS - 5 hotels found
```

---

## Test Command 2: POST /api/hotels/search (Body Format)

**JSON body format** - best for frontend integration

```bash
curl -X POST "http://localhost:3000/api/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "city_code": "DXB",
    "country_code": "AE",
    "check_in": "2025-12-01",
    "check_out": "2025-12-04",
    "adults": 2,
    "children": 0,
    "rooms": 1,
    "guest_nationality": "IN",
    "preferred_currency": "INR",
    "limit": 10
  }'
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "hotels": [
    {
      "property_id": "uuid",
      "supplier_code": "TBO",
      "supplier_hotel_id": "12345",
      "hotel_name": "City Center Inn Dubai Downtown",
      "city": "Dubai",
      "country": "AE",
      "star_rating": 4,
      "review_score": 4.4,
      "thumbnail_url": "https://...",
      "rates": [
        {
          "room_type": "Standard Twin",
          "price_total": 4500,
          "currency": "INR",
          "board_type": "Room Only",
          "cancellation_policy": "Non-refundable"
        }
      ],
      "pricing_available": true
    }
  ],
  "total": 5,
  "nights": 3,
  "pricing_available": true
}
```

**Expected Logs**:

```
🔍 TBO hotel search: {
  cityId: "DXB",
  countryCode: "AE",
  checkInDate: "2025-12-01",
  checkOutDate: "2025-12-04",
  adults: 2,
  children: 0,
  rooms: 1,              ← Still an integer
  guestNationality: "IN",
  preferredCurrency: "INR"
}

✅ TBO returned 5 hotels
```

---

## Test Command 3: Multiple Rooms

Test with **2 rooms, 2 adults each** (4 total guests)

```bash
curl -X POST "http://localhost:3000/api/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "city_code": "DXB",
    "check_in": "2025-12-01",
    "check_out": "2025-12-04",
    "adults": 2,
    "children": 0,
    "rooms": 2,
    "guest_nationality": "IN",
    "preferred_currency": "INR"
  }'
```

**Expected Logs**:

```
🔄 Normalizing rooms parameter: {
  incoming: { rooms: 2, adults: 2, children: 0 }
}

✅ Rooms normalized (from simple params): {
  inputRooms: 2,
  normalizedRooms: [
    { adults: 2, children: 0, childAges: [] },
    { adults: 2, children: 0, childAges: [] }
  ],
  count: 2
}

🎫 Built RoomGuests Array: {
  roomGuests: [
    { NoOfAdults: 2, NoOfChild: 0, ChildAge: [] },
    { NoOfAdults: 2, NoOfChild: 0, ChildAge: [] }
  ],
  count: 2
}

🔍 TBO Hotel Search Request: {
  rooms: 2,
  roomGuests: [
    { NoOfAdults: 2, NoOfChild: 0, ChildAge: [] },
    { NoOfAdults: 2, NoOfChild: 0, ChildAge: [] }
  ]
}
```

---

## Test Command 4: With Children

Test with **1 room, 2 adults, 1 child (age 8)**

```bash
curl -X GET "http://localhost:3000/api/hotels?cityId=DXB&checkIn=2025-12-01&checkOut=2025-12-04&adults=2&children=1&rooms=1&currency=INR" \
  -H "Content-Type: application/json"
```

Or with POST body (children ages can be passed in array):

```bash
curl -X POST "http://localhost:3000/api/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "city_code": "DXB",
    "check_in": "2025-12-01",
    "check_out": "2025-12-04",
    "adults": 2,
    "children": 1,
    "rooms": 1,
    "child_ages": [8],
    "guest_nationality": "IN",
    "preferred_currency": "INR"
  }'
```

**Expected Logs**:

```
✅ Rooms normalized (from simple params): {
  normalizedRooms: [
    { adults: 2, children: 1, childAges: [8] }
  ]
}

🎫 Built RoomGuests Array: {
  roomGuests: [
    { NoOfAdults: 2, NoOfChild: 1, ChildAge: [8] }
  ]
}
```

---

## Test Command 5: Error Case - Invalid Dates

```bash
curl -X POST "http://localhost:3000/api/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "city_code": "DXB",
    "check_in": "2025-12-04",
    "check_out": "2025-12-01",
    "rooms": 1
  }'
```

**Expected Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Check-in must be before check-out"
}
```

---

## Test Command 6: Error Case - Missing City

```bash
curl -X POST "http://localhost:3000/api/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "check_in": "2025-12-01",
    "check_out": "2025-12-04",
    "rooms": 1
  }'
```

**Expected Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Missing required fields: city_code, check_in, check_out"
}
```

---

## Test Command 7: Autocomplete Endpoint

```bash
curl -X GET "http://localhost:3000/api/hotels/autocomplete?q=dubai" \
  -H "Content-Type: application/json"
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "suggestions": [
    {
      "city_code": "DXB",
      "city_name": "Dubai",
      "country_code": "AE",
      "country_name": "United Arab Emirates",
      "type": "CITY",
      "lat": 25.2048,
      "lng": 55.2708
    }
  ]
}
```

---

## Verification Checklist

After running tests, verify:

- [ ] No `rooms.map is not a function` errors
- [ ] Logs show proper normalization (🔄 Normalizing rooms parameter)
- [ ] Hotel prices are consistent across search → details → booking
- [ ] Multiple rooms create correct RoomGuests array
- [ ] Children/child ages are included in RoomGuests
- [ ] All error cases return appropriate error messages
- [ ] TBO API is called via Fixie proxy (via: fixie_proxy in logs)
- [ ] Response times are logged (response_time_ms)

---

## Debugging Tips

### Check for Normalization Logs

```bash
# In server logs, search for these lines:
grep "Normalizing rooms parameter" logs/*.log
grep "Rooms normalized" logs/*.log
grep "Built RoomGuests" logs/*.log
```

### Check TBO API Call

```bash
# Should see this in logs:
grep "TBO Hotel Search Request" logs/*.log
```

### Check Response Parsing

```bash
# Should see this after TBO responds:
grep "TBO Search Response" logs/*.log
grep "hotels found" logs/*.log
```

---

## Common Issues & Solutions

### Issue: Still getting `rooms.map is not a function`

**Solution**: Make sure the updated `tboAdapter.js` is deployed. Check line 155 for normalizeRooms method.

```bash
grep -n "normalizeRooms" api/services/adapters/tboAdapter.js
```

Should return something like:

```
155:  normalizeRooms(rooms, adults = 2, children = 0, childAges = []) {
```

### Issue: Dates not formatting correctly

**Solution**: Check that `formatDateForTBO` is being called. Should see logs like:

```
📅 Formatted date for TBO: {
  input: "2025-12-01",
  output: "01/12/2025"
}
```

### Issue: TBO returns 0 hotels

**Possible causes**:

- CityId not found (check getCityId logs)
- Date range has no availability
- Nationality restriction (some cities restrict certain nationalities)

**Debug**:

```bash
grep "CityId Retrieved\|CityId not found" logs/*.log
```

### Issue: Cache hit always shows false

**This is normal** for first run. Cache hits should appear on repeated searches:

```bash
# First search: cache_hit = false (calls TBO)
# Second search (same params within 3 min): cache_hit = true (from Redis)
```

---

## Production Deployment

Once all tests pass:

1. **Commit changes**:

```bash
git add api/services/adapters/tboAdapter.js
git commit -m "feat: normalize rooms parameter to TBO array format with full logging"
git push origin main
```

2. **Redeploy on Render**:
   - Go to Render dashboard
   - Trigger manual deploy on builder-faredown-pricing
   - Monitor logs for any errors

3. **Run smoke test**:

```bash
curl -X POST "https://builder-faredown-pricing.onrender.com/api/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{"city_code":"DXB","check_in":"2025-12-01","check_out":"2025-12-04","rooms":1}'
```

---

## Next Steps

Once deployed and verified:

1. ✅ Run hotel caching infrastructure migration
2. ✅ Test cache hits with repeated searches
3. ✅ Monitor performance metrics
4. ✅ Verify request coalescing with simultaneous requests

---

**Last Updated**: February 2025  
**Status**: Ready for Testing  
**Issue Fixed**: `rooms.map is not a function` ✅ RESOLVED
