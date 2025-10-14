# Render Environment Variables - Required Fixes

## 🔴 CRITICAL: Missing Environment Variables

The code expects different variable names than what's currently set in Render.

---

## Issue 1: Amadeus Base URL

**Problem:** Amadeus authentication is failing

**Current in Render:**
```
AMADEUS_API_URL=test.api.amadeus.com
```

**Code Expects:**
```
AMADEUS_BASE_URL=https://test.api.amadeus.com
```

**Fix Required:**

### Option A: Add Missing Variable
1. Go to Render → Settings → Environment
2. Click "Add Environment Variable"
3. Add:
   ```
   Key: AMADEUS_BASE_URL
   Value: https://test.api.amadeus.com
   ```

### Option B: Update Code (Not Recommended)
Modify `api/services/adapters/amadeusAdapter.js` line 12 to use `AMADEUS_API_URL`

**Recommendation:** Use Option A (add the variable)

---

## Verification After Fix

Once `AMADEUS_BASE_URL` is added:

1. **Save Changes** in Render (this auto-restarts the service)

2. **Wait 30 seconds** for restart

3. **Test Authentication:**
   ```bash
   curl -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
     "https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health"
   ```

4. **Expected Result:**
   ```json
   {
     "supplier": "AMADEUS",
     "status": "healthy",
     "circuit_breaker_state": "CLOSED"
   }
   ```

---

## Current Working Suppliers ✅

| Supplier | Status | Credentials |
|----------|--------|-------------|
| TBO | ✅ Working | All correct |
| HOTELBEDS | ✅ Configured | Credentials present |
| RATEHAWK | ✅ Configured | Credentials present |
| AMADEUS | ❌ Failing | Missing AMADEUS_BASE_URL |

---

## All Required Environment Variables

### Amadeus (Flights)
```bash
AMADEUS_BASE_URL=https://test.api.amadeus.com  # ⚠️ ADD THIS
AMADEUS_API_KEY=6H8SAsHAPdGAlWFYWNKgxQetHgeGCeNv  # ✅ Present
AMADEUS_API_SECRET=2eVYfPeZVxmvbjRm  # ✅ Present
```

### TBO (Flights)
```bash
TBO_AGENCY_ID=BOMF145  # ✅ Present
TBO_CLIENT_ID=BOMF145  # ✅ Present
TBO_USERNAME=BOMF145  # ✅ Present
TBO_PASSWORD=travel/live-18@@  # ✅ Present
TBO_SEARCH_URL=https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest  # ✅ Present
TBO_BOOKING_URL=https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest  # ✅ Present
```

### RateHawk (Hotels)
```bash
RATEHAWK_API_ID=3635  # ✅ Present
RATEHAWK_API_KEY=d020d57a-b31d-4696-bc9a-3b90dc84239f  # ✅ Present
RATEHAWK_BASE_URL=https://api.worldota.net/api/b2b/v3/  # ✅ Present
```

### Hotelbeds (Hotels/Transfers/Sightseeing)
```bash
HOTELBEDS_BASE_URL=https://api.test.hotelbeds.com  # ✅ Present
HOTELBEDS_API_KEY=91d2368789abdb5beec101ce95a9d185  # ✅ Present
HOTELBEDS_API_SECRET=a9ffaaecce  # ✅ Present
```

### Supplier Lists
```bash
FLIGHTS_SUPPLIERS=AMADEUS,TBO  # ✅ Present
HOTELS_SUPPLIERS=HOTELBEDS,RATEHAWK  # ✅ Present
```

---

## Quick Fix Steps

1. **Add Missing Variable:**
   - Go to Render Dashboard
   - Select `builder-faredown-pricing` service
   - Click Settings → Environment
   - Add:
     ```
     AMADEUS_BASE_URL = https://test.api.amadeus.com
     ```
   - Click "Save Changes"

2. **Wait for Auto-Restart:**
   - Render automatically restarts when env vars change
   - Wait ~30-60 seconds

3. **Verify Fix:**
   ```bash
   curl -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
     "https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health"
   ```

4. **Expected Output:**
   ```json
   {
     "success": true,
     "data": [
       {
         "supplier": "AMADEUS",
         "status": "healthy",
         "circuit_breaker_state": "CLOSED"
       },
       {
         "supplier": "TBO",
         "status": "healthy",
         "circuit_breaker_state": "CLOSED"
       }
     ]
   }
   ```

---

## Testing After Fix

### Test Flight Search (Amadeus + TBO)
```bash
curl "https://builder-faredown-pricing.onrender.com/api/flights/search?\
origin=BOM&destination=DXB&departureDate=2025-11-15&adults=1"
```

**Expected:** Results from both AMADEUS and TBO

### Test Hotel Search (RateHawk + Hotelbeds)
```bash
curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?\
destination=Dubai&checkIn=2025-12-01&checkOut=2025-12-05&rooms=%5B%7B%22adults%22%3A2%7D%5D"
```

**Expected:** Results from both RATEHAWK and HOTELBEDS

---

## Admin UI Verification

After fix is applied:

1. Open: https://spontaneous-biscotti-da44bc.netlify.app/admin
2. Navigate to: **Supplier Management**
3. Verify all suppliers show:
   - ✅ Amadeus - Healthy
   - ✅ TBO - Healthy
   - ✅ RateHawk - Healthy
   - ✅ Hotelbeds - Healthy

---

## Summary

**Issue:** `AMADEUS_BASE_URL` environment variable missing in Render

**Impact:** Amadeus authentication fails, no flight results from Amadeus

**Fix:** Add `AMADEUS_BASE_URL=https://test.api.amadeus.com` to Render environment variables

**Time to Fix:** 2 minutes (add variable + auto-restart)

**Verification:** All 4 suppliers should show healthy status in admin panel

---

**Status:** Ready for deployment - Add `AMADEUS_BASE_URL` and verify
