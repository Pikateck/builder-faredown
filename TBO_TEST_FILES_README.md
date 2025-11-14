# TBO Test Files

## Canonical Test File ✅

**File**: `test-tbo-full-booking-flow.js`

This is the **OFFICIAL** end-to-end test for TBO hotel integration.

### What it tests:
1. ✅ Authentication → TokenId
2. ✅ GetDestinationSearchStaticData → Real CityId
3. ✅ Hotel Search → Hotels with TraceId
4. ✅ Room Details → Available rooms
5. ✅ Block Room → Pre-booking validation
6. ✅ Book Hotel → Booking confirmation
7. ✅ Generate Voucher → Voucher URL
8. ✅ Get Booking Details → Verification

### How to run:
```bash
# Install dependencies (first time only)
npm install

# Run the test
node test-tbo-full-booking-flow.js
```

### Output:
- **Console**: Real-time progress logs
- **File**: `tbo-full-booking-flow-results.json` (complete results with all request/response data)

---

## Other Test Files

### `test-tbo-complete-pipeline.js`
**Status**: Legacy partial test

Tests only partial flow:
- Authentication
- Static data (old approach)
- Hotel search

**Not recommended** - Use `test-tbo-full-booking-flow.js` instead.

### `test-tbo-auth-direct.js`
**Status**: Unit test for authentication only

Tests just authentication step in isolation.

---

## Which File to Use?

| Scenario | File |
|----------|------|
| Complete end-to-end booking test | `test-tbo-full-booking-flow.js` ✅ |
| Quick auth check | `test-tbo-auth-direct.js` |
| Legacy reference | `test-tbo-complete-pipeline.js` |

---

## Expected Results Structure

The canonical test (`test-tbo-full-booking-flow.js`) outputs this JSON structure:

```json
{
  "timestamp": "2025-01-XX...",
  "testParams": {
    "destination": "Dubai",
    "countryCode": "AE",
    "checkInDate": "2025-06-15",
    "checkOutDate": "2025-06-20",
    "nationality": "AE",
    "adults": 2,
    "children": 0,
    "rooms": 1,
    "passengers": [...]
  },
  "steps": {
    "authentication": {
      "success": true,
      "tokenId": "...",
      "endpoint": "..."
    },
    "staticData": {
      "success": true,
      "cityId": 130443,
      "destination": "Dubai",
      "countryCode": "AE"
    },
    "hotelSearch": {
      "success": true,
      "traceId": "...",
      "totalHotels": 2429,
      "selectedHotel": {...}
    },
    "roomDetails": {
      "success": true,
      "totalRooms": 12,
      "selectedRoom": {...}
    },
    "blockRoom": {
      "success": true,
      "status": 1,
      "isPriceChanged": false,
      "isPolicyChanged": false
    },
    "booking": {
      "success": true,
      "bookingId": "...",
      "confirmationNo": "...",
      "bookingRefNo": "...",
      "status": 1
    },
    "voucher": {
      "success": true,
      "voucherUrl": "https://...",
      "status": 1
    },
    "bookingDetails": {
      "success": true,
      "status": 1,
      "bookingStatus": "Confirmed"
    }
  },
  "overallSuccess": true
}
```

---

## Troubleshooting

### Error: Cannot find module 'https-proxy-agent'

**Solution**: Run `npm install` first

### Error: Authentication timeout

**Cause**: Fixie proxy not accessible or env vars not set

**Solution**: 
- Verify `FIXIE_URL` in `.env` or `api/.env`
- Verify `USE_SUPPLIER_PROXY=true`
- Ensure you're running in environment with Fixie access (Render/staging, not local)

### No hotels found

**Cause**: CityId lookup failed or search parameters invalid

**Solution**: Check console logs for static data step (step 2)

---

## Summary

✅ **Use**: `test-tbo-full-booking-flow.js`
✅ **Run**: `npm install && node test-tbo-full-booking-flow.js`
✅ **Check**: `tbo-full-booking-flow-results.json` for complete results
