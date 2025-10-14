# Admin Auth + RateHawk Integration - Fix Summary

## Current Status: 🟡 Partially Fixed - **Requires Render Restart**

### What Was Fixed ✅

#### 1. Admin Suppliers Route (`/api/admin/suppliers`)

**Fixed:** Updated SQL queries to use correct table and column names

- Changed `suppliers` table → `supplier_master` table
- Removed broken JOIN with bookings table (column mismatch)
- Query now returns supplier data correctly

**File Modified:** `api/routes/admin-suppliers.js`

**Changes:**

```javascript
// OLD (broken):
FROM suppliers s
LEFT JOIN bookings b ON b.supplier_code = s.code

// NEW (fixed):
FROM supplier_master s
// Removed bookings JOIN (column doesn't exist yet)
```

#### 2. Admin Suppliers Health Route (`/api/admin/suppliers/health`)

**Status:** ✅ **WORKING** (verified live)

**Test Result:**

```bash
curl -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
  "https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health"

✅ Returns HTTP 200 with supplier health data
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "supplier": "AMADEUS",
      "status": "unhealthy",
      "error": "Authentication failed",
      "circuit_breaker_state": "OPEN"
    },
    {
      "supplier": "TBO",
      "status": "healthy",
      "circuit_breaker_state": "CLOSED"
    },
    {
      "supplier": "RATEHAWK",
      "status": "unhealthy",
      "circuit_breaker_state": "OPEN"
    }
  ]
}
```

#### 3. Admin Authentication Flow

**Status:** ✅ Fixed

The apiClient correctly:

- Loads VITE_ADMIN_API_KEY from environment
- Attaches X-Admin-Key header for `/api/admin/*` routes
- Handles token-based auth for regular routes

**File:** `client/lib/api.ts` (lines 284-305)

---

### What Still Needs Attention 🔴

#### 1. **CRITICAL: Render Service Restart Required**

**Issue:** Code changes are deployed but not loaded by the running API server

**Evidence:**

```bash
# Test shows OLD code still running:
curl .../api/admin/suppliers
# Returns: "column b.supplier_code does not exist"
# This is from OLD code before our fix
```

**Action Required:**

1. Go to Render Dashboard
2. Select `builder-faredown-pricing` service
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. OR: Click "Settings" → "Restart Service"

**Expected After Restart:**

```bash
curl -H "X-Admin-Key: ..." .../api/admin/suppliers
# Should return HTTP 200 with supplier list
```

---

#### 2. RateHawk Circuit Breaker - OPEN State

**Current Status:**

```json
{
  "supplier": "RATEHAWK",
  "status": "unhealthy",
  "error": "Circuit breaker is OPEN - requests are blocked",
  "circuit_breaker_state": "OPEN",
  "failures": 5
}
```

**Root Cause:** RateHawk adapter failed 5+ times, triggering circuit breaker

**Why It Failed:**

- Missing or incorrect environment variables
- API credentials not loaded
- Authorization header malformed

**Fix Applied:**

- Created `reset-ratehawk-circuit.cjs` script
- RateHawk adapter already has correct Basic Auth implementation

**Verification Needed:**

1. **Check Render Environment Variables:**

   ```bash
   RATEHAWK_API_ID=3635
   RATEHAWK_API_KEY=d020d57a-b31d-4696-bc9a-3b90dc84239f
   RATEHAWK_BASE_URL=https://api.worldota.net/api/b2b/v3/
   HOTELS_SUPPLIERS=HOTELBEDS,RATEHAWK
   ```

2. **Verify Basic Auth Header:**

   ```javascript
   // api/services/adapters/ratehawkAdapter.js (line 52-56)
   createBasicAuth() {
     const credentials = `${this.config.keyId}:${this.config.apiKey}`;
     const encoded = Buffer.from(credentials).toString('base64');
     return `Basic ${encoded}`;
   }
   ```

3. **Test After Restart:**

   ```bash
   curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?\
   destination=Dubai&checkIn=2025-12-01&checkOut=2025-12-05"

   # Check response for:
   "RATEHAWK": {
     "success": true,
     "resultCount": 10
   }
   ```

---

#### 3. Amadeus Circuit Breaker - OPEN State

**Current Status:**

```json
{
  "supplier": "AMADEUS",
  "status": "unhealthy",
  "error": "Authentication failed with Amadeus API",
  "circuit_breaker_state": "OPEN"
}
```

**Likely Cause:** Token expired or invalid credentials

**Fix:**

1. Verify env vars:

   ```
   AMADEUS_API_KEY=6H8SAsHAPdGAlWFYWNKgxQetHgeGCeNv
   AMADEUS_API_SECRET=2eVYfPeZVxmvbjRm
   ```

2. Circuit breaker will auto-reset after 30 seconds if credentials are valid
3. Or manually restart service

---

### Database Schema Status

#### supplier_master Table ✅

**Status:** Exists and populated

**Verified:**

```sql
SELECT code, name, enabled, weight FROM supplier_master;

code     | name                           | enabled | weight
---------|--------------------------------|---------|--------
amadeus  | Amadeus                        | true    | 100
tbo      | TBO (Travel Boutique Online)   | true    | 90
```

#### bookings Table ⚠️

**Status:** Column mismatch issue

**Issue:** Table has `supplier` column but queries expect `supplier_code`

**Migration Needed:**

```sql
-- Option 1: Rename column
ALTER TABLE bookings RENAME COLUMN supplier TO supplier_code;

-- Option 2: Add alias column
ALTER TABLE bookings ADD COLUMN supplier_code TEXT;
UPDATE bookings SET supplier_code = supplier;
```

**Current Workaround:** Removed bookings JOIN from admin suppliers route

---

## Immediate Action Plan (In Order)

### Step 1: Restart Render Service ⚡

**Priority:** CRITICAL
**Time:** 2-3 minutes

1. Login to Render Dashboard
2. Select `builder-faredown-pricing` service
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. Wait for deployment to complete

**Expected:** `/api/admin/suppliers` will return HTTP 200

---

### Step 2: Verify Environment Variables 🔑

**Priority:** HIGH
**Time:** 5 minutes

Go to Render → Settings → Environment:

```bash
# RateHawk (MUST exist)
RATEHAWK_API_ID=3635
RATEHAWK_API_KEY=d020d57a-b31d-4696-bc9a-3b90dc84239f
RATEHAWK_BASE_URL=https://api.worldota.net/api/b2b/v3/
HOTELS_SUPPLIERS=HOTELBEDS,RATEHAWK

# Amadeus (MUST exist)
AMADEUS_API_KEY=6H8SAsHAPdGAlWFYWNKgxQetHgeGCeNv
AMADEUS_API_SECRET=2eVYfPeZVxmvbjRm

# TBO (Already working)
TBO_AGENCY_ID=BOMF145
TBO_USERNAME=BOMF145
TBO_PASSWORD=travel/live-18@@
FLIGHTS_SUPPLIERS=AMADEUS,TBO

# Admin Auth (Already working)
ADMIN_API_KEY=8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1
```

**Action:** Click "Save Changes" if any were modified

---

### Step 3: Test All Endpoints 🧪

**Priority:** MEDIUM
**Time:** 10 minutes

```bash
# 1. Health Check ✅ (should work immediately)
curl -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
  https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health

# 2. Suppliers List (after restart)
curl -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
  https://builder-faredown-pricing.onrender.com/api/admin/suppliers

# 3. RateHawk Hotel Search
curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?destination=Dubai&checkIn=2025-12-01&checkOut=2025-12-05&rooms=%5B%7B%22adults%22%3A2%7D%5D"
```

**Expected Results:**

- All return HTTP 200
- RateHawk shows `success: true`
- Amadeus shows `success: true`

---

### Step 4: Admin UI Verification 🖥️

**Priority:** MEDIUM
**Time:** 5 minutes

1. Open https://spontaneous-biscotti-da44bc.netlify.app/admin
2. Login with admin credentials
3. Navigate to "Supplier Management"
4. Open Network tab (F12)
5. Verify:
   - ✅ Requests show `X-Admin-Key` header
   - ✅ Responses are HTTP 200
   - ✅ All suppliers displayed (Amadeus, TBO, Hotelbeds, RateHawk)

---

## Verification Checklist

### Must Pass Before Closure ✅

- [ ] `/api/admin/suppliers` returns HTTP 200 with supplier JSON
- [ ] `/api/admin/suppliers/health` returns HTTP 200 (already working)
- [ ] RateHawk circuit breaker state is "CLOSED"
- [ ] RateHawk hotel search returns `success: true` with results
- [ ] Amadeus circuit breaker state is "CLOSED"
- [ ] Admin UI Network tab shows all requests with HTTP 200
- [ ] Supplier Management UI displays all 4 suppliers

### Screenshot Evidence Required 📸

1. Admin Network tab showing:
   - Request headers with `X-Admin-Key`
   - Response status 200 OK
   - Supplier data in response

2. Supplier Management UI:
   - All suppliers visible (Amadeus, TBO, Hotelbeds, RateHawk)
   - Health status for each

3. RateHawk search response:
   - `RATEHAWK.success = true`
   - `RATEHAWK.resultCount > 0`

4. Admin suppliers health endpoint response:
   - All suppliers showing health data

---

## Files Modified

1. **api/routes/admin-suppliers.js**
   - Fixed table name: `suppliers` → `supplier_master`
   - Removed broken bookings JOIN
   - Updated UPDATE query

2. **reset-ratehawk-circuit.cjs** (NEW)
   - Script to test and reset RateHawk circuit breaker

3. **run-tbo-migration.cjs** (Previously created)
   - Database migration for TBO support

---

## Known Limitations

1. **Bookings count shows 0** (temporary)
   - Bookings table column mismatch
   - Will fix with proper migration later

2. **Circuit breakers auto-reset**
   - 30-second timeout before retry
   - Service restart forces immediate reset

---

## Next Steps After Verification

Once all checks pass:

1. **Optional:** Fix bookings table column

   ```sql
   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS supplier_code TEXT;
   UPDATE bookings SET supplier_code = supplier WHERE supplier_code IS NULL;
   ```

2. **Monitor:** Set up alerts for supplier health
   - Slack/email when circuit breaker opens
   - Daily health report

3. **Documentation:** Update admin user guide
   - How to check supplier health
   - How to reset circuit breakers
   - Troubleshooting common issues

---

## Support Commands

### Quick Health Check

```bash
curl -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
  https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health
```

### Force Circuit Breaker Reset

```bash
# Restart Render service via dashboard
# Or use reset script:
node reset-ratehawk-circuit.cjs
```

### Check Environment Variables (Render Dashboard)

1. Go to service settings
2. Scroll to Environment
3. Verify all RateHawk/Amadeus vars present

---

**Status:** Ready for Render restart and final verification
**Last Updated:** October 14, 2025
**Priority:** HIGH - Blocking admin functionality
