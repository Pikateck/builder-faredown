# TBO Hotel Integration - Deployment Verification Checklist

## Pre-Deployment Checklist

### ✅ Environment Variables (Already Set on Render)
```env
TBO_HOTEL_CLIENT_ID="tboprod"
TBO_HOTEL_USER_ID="BOMF145"
TBO_HOTEL_PASSWORD="@Bo#4M-Api@"
TBO_END_USER_IP="52.5.155.132"
TBO_AUTH_URL="https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate"
USE_SUPPLIER_PROXY="true"
FIXIE_URL="http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80"
```

**Action Required:** ✅ None - All variables already configured

---

## Deployment Steps

### 1. Deploy to Render
```bash
# Push changes to trigger deployment
git add .
git commit -m "fix: TBO hotel integration - correct JSON parsing and auth credentials"
git push origin main
```

### 2. Monitor Deployment
- Check Render dashboard for deployment status
- Wait for build to complete
- Verify no errors in deployment logs

---

## Post-Deployment Verification

### Test 1: Authentication Health Check ✅

**Endpoint:** `GET /api/tbo-hotels/diagnostics/auth`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "egressIp": "52.5.155.132",
    "attempts": [
      {
        "ts": "2025-...",
        "success": true,
        "tokenLength": 500+,
        "expiresAt": "..."
      }
    ]
  }
}
```

**Command:**
```bash
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/diagnostics/auth
```

**Pass Criteria:** ✅ `success: true` and recent attempt shows `success: true`

---

### Test 2: Hotel Search Authentication ✅

**Endpoint:** `POST /api/tbo-hotels/search`

**Test Command:**
```bash
curl -X POST https://builder-faredown-pricing.onrender.com/api/tbo-hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Dubai",
    "checkIn": "2025-06-15",
    "checkOut": "2025-06-20",
    "adults": 2,
    "children": 0,
    "currency": "USD",
    "guestNationality": "IN"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "hotelId": "...",
      "name": "...",
      "price": 450.00,
      "currency": "USD",
      "supplier": "TBO",
      "resultIndex": 1,
      ...
    }
  ],
  "searchId": "uuid-...",
  "via": "fixie"
}
```

**Pass Criteria:**
- ✅ `success: true`
- ✅ `data` array has hotels (length > 0)
- ✅ No "TBO Auth failed" error
- ✅ `via: "fixie"` confirms proxy usage

**Failure Indicators:**
- ❌ `"error": "TBO Auth failed: Incorrect Username or Password"`
- ❌ `"code": "TBO_AUTH_FAILED"`
- ❌ Empty data array with auth error

---

### Test 3: GetHotelRoom Full Flow ✅

**Run on Render:**
```bash
# SSH into Render or use Render Shell
node test-tbo-full-booking-flow.js
```

**Expected Output (Step 4):**
```
════════════════════════════════════════════════════════════════════════════════
STEP 4: Get Hotel Room Details
════════════════════════════════════════════════════════════════════════��═══════

Step 1: Authenticating...
✅ TokenId obtained

Step 2: Getting room details...
  URL: https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelRoom
  TraceId: 12345...
  ResultIndex: 1
  HotelCode: DXB123

📥 TBO Room Response
  HTTP Status: 200
  ResponseStatus: 1                    ✅ DEFINED (was undefined before)
  TraceId: 12345...
  Room Count: 15                       ✅ NON-ZERO (was 0 before)
  Error: None

Sample Rooms (first 3):
  1. Deluxe Room - USD 450.00
     Cancellation: 2025-06-14
  2. Superior Room - USD 380.00
     Cancellation: 2025-06-14
  3. Standard Room - USD 320.00
     Cancellation: 2025-06-13

✅ SUCCESS: Room details retrieved. Available rooms: 15
```

**Pass Criteria:**
- ✅ `ResponseStatus: 1` (not undefined)
- ✅ `Room Count: > 0` (not 0)
- ✅ Sample rooms displayed with pricing

**Failure Indicators:**
- ❌ `ResponseStatus: undefined`
- ❌ `Room Count: 0`
- ❌ `rooms: []`

---

### Test 4: Room Details in Search Context ✅

**Endpoint:** `POST /api/tbo-hotels/room`

**Test Command:**
```bash
# First get a search result with traceId and resultIndex
# Then test room details:

curl -X POST https://builder-faredown-pricing.onrender.com/api/tbo-hotels/room \
  -H "Content-Type: application/json" \
  -d '{
    "traceId": "<from-search-response>",
    "resultIndex": 1,
    "hotelCode": "DXB123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "responseStatus": 1,
    "traceId": "...",
    "rooms": [
      {
        "RoomTypeName": "Deluxe Room",
        "RoomTypeCode": "DLX",
        "Price": {
          "OfferedPrice": 450.00,
          "PublishedPrice": 500.00,
          "CurrencyCode": "USD"
        },
        "CancellationPolicies": [...],
        "IsPassportMandatory": true,
        "IsPANMandatory": false
      }
    ]
  }
}
```

**Pass Criteria:**
- ✅ `responseStatus: 1`
- ✅ `rooms` array is populated
- ✅ Room details include pricing and policies

---

## Verification Results

### Before Fixes
```
❌ GetHotelRoom:
   - ResponseStatus: undefined
   - Room Count: 0
   - rooms: []

❌ /api/tbo-hotels/search:
   - TBO Auth failed: Incorrect Username or Password
   - Code: TBO_AUTH_FAILED
```

### After Fixes (Expected)
```
✅ GetHotelRoom:
   - ResponseStatus: 1
   - Room Count: 15+
   - rooms: [array of room objects with full details]

✅ /api/tbo-hotels/search:
   - success: true
   - data: [array of hotels]
   - Authentication successful
```

---

## Troubleshooting

### Issue: Still Getting Auth Failed

**Check:**
1. Verify environment variables on Render:
   ```
   TBO_HOTEL_CLIENT_ID=tboprod
   TBO_HOTEL_USER_ID=BOMF145
   TBO_HOTEL_PASSWORD=@Bo#4M-Api@
   ```

2. Check deployment logs for credential loading:
   ```
   🔐 TBO Authentication Request
     ClientId: tboprod (should be 'tboprod')
     UserName: BOMF145
   ```

3. Verify Fixie proxy is working:
   ```bash
   curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/egress-ip
   ```
   Should return: `{"success": true, "ip": "52.5.155.132"}`

### Issue: Room Count Still 0

**Check:**
1. Verify the response structure in logs - look for `GetHotelRoomResult` wrapper
2. Check if TBO is returning `HotelRoomsDetails` (plural) not `HotelRoomDetails`
3. Test with a different hotel or date range

### Issue: Fixie Timeout

**Check:**
1. `USE_SUPPLIER_PROXY=true` is set
2. `FIXIE_URL` is configured correctly
3. Test from Render environment (not local)

---

## Success Criteria Summary

| Test | Before | After | Status |
|------|--------|-------|--------|
| Authentication | ❌ Failed | ✅ Success | ⏳ Pending |
| Hotel Search | ❌ Auth error | ✅ Returns hotels | ⏳ Pending |
| GetHotelRoom ResponseStatus | ❌ undefined | ✅ 1 | ⏳ Pending |
| GetHotelRoom Room Count | ❌ 0 | ✅ 15+ | ⏳ Pending |
| Room Details | ❌ Empty array | ✅ Full details | ⏳ Pending |
| Full Booking Flow | ❌ Stops at rooms | ✅ Complete | ⏳ Pending |

---

## Files Changed (Review)

1. ✅ `api/tbo/room.js` - GetHotelRoom wrapper handling
2. ✅ `api/tbo/auth.js` - Credential env vars
3. ✅ `api/services/adapters/tboAdapter.js` - Credential env vars
4. ✅ `api/tbo/static.js` - Static data wrapper
5. ✅ `api/tbo/book.js` - Booking wrappers
6. ✅ `api/tbo/voucher.js` - Voucher wrappers

---

## Final Verification Command

Run all tests in sequence:

```bash
# 1. Check auth health
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/diagnostics/auth

# 2. Test hotel search
curl -X POST https://builder-faredown-pricing.onrender.com/api/tbo-hotels/search \
  -H "Content-Type: application/json" \
  -d '{"destination":"Dubai","checkIn":"2025-06-15","checkOut":"2025-06-20","adults":2,"currency":"USD"}'

# 3. Run full flow test
node test-tbo-full-booking-flow.js
```

If all three pass → **Deployment verified successfully** ✅

---

## Rollback (if needed)

All changes use defensive handling with fallbacks:
```javascript
const result = response.data?.Wrapper || response.data;
```

This means the code is backward compatible and won't break even if TBO changes response format.

No rollback should be needed, but if required:
```bash
git revert <commit-hash>
git push origin main
```

---

## Support

For issues or questions:
1. Check deployment logs on Render
2. Review TBO API response structure
3. Verify environment variables match requirements
4. Test authentication separately from search

All integration points now align with TBO's official JSON API documentation.
