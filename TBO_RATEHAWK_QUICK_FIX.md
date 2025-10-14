# TBO & RateHawk Quick Fix Guide

## Current Status Summary

### ✅ Fixed
1. **SupplierAdapterManager** - Now includes RateHawk for hotel searches
   - File: `api/services/adapters/supplierAdapterManager.js` (lines 108-117)
   - RateHawk now returned alongside Hotelbeds for hotel product type

### ⚠️ Issues Identified

#### Issue 1: TBO Circuit Breaker OPEN
- **Status:** Healthy auth, but circuit breaker blocking requests
- **Cause:** 5+ failed search attempts
- **Auto-fix:** Resets after 30 seconds OR first successful request
- **Action:** Wait or trigger search

#### Issue 2: RateHawk Circular JSON Error (CRITICAL)
- **Error:** "Converting circular structure to JSON" with TLSSocket
- **Location:** Error handling in axios responses
- **Impact:** Prevents proper error messages, keeps circuit breaker OPEN

---

## Fix #1: RateHawk JSON Circular Reference

### Root Cause
When RateHawk adapter encounters an error, it tries to serialize the axios error object which contains circular references (socket → parser → socket).

### Solution
Update error handling to extract safe properties only:

```javascript
// In api/services/adapters/ratehawkAdapter.js or baseSupplierAdapter.js
// Find all catch blocks and replace:

// ❌ BAD (causes circular JSON):
catch (error) {
  this.logger.error("Error:", error); // Circular!
  throw error; // Contains circular refs!
}

// ✅ GOOD (safe):
catch (error) {
  const safeError = {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data
  };
  
  this.logger.error("Error:", safeError);
  throw new Error(error.message || "Request failed");
}
```

### Files to Check
1. `api/services/adapters/baseSupplierAdapter.js` - Line 321-330 (executeWithRetry)
2. `api/services/adapters/ratehawkAdapter.js` - All catch blocks
3. `api/routes/admin-suppliers.js` - Health check endpoint (around line 160-200)

---

## Fix #2: Test After Fixes

### 1. Deploy to Render
```bash
# After fixing the code, Render will auto-deploy on git push
# Or manually trigger deploy in Render dashboard
```

### 2. Test TBO
```bash
curl "https://builder-faredown-pricing.onrender.com/api/flights/search?\
origin=BOM&destination=DXB&departureDate=2025-11-25&adults=1"

# Check meta.suppliers.TBO for:
{
  "TBO": {
    "success": true,  // Should be true
    "resultCount": 10  // Should have results
  }
}
```

### 3. Test RateHawk
```bash
curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?\
destination=Dubai&checkIn=2025-12-20&checkOut=2025-12-25&rooms=%5B%7B%22adults%22%3A2%7D%5D"

# Check meta.suppliers.RATEHAWK for:
{
  "RATEHAWK": {
    "success": true,  // Should be true
    "resultCount": 15  // Should have results
  }
}
```

### 4. Verify Circuit Breakers
```bash
curl -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
  "https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health"

# All should show:
{
  "supplier": "TBO",
  "circuit_breaker_state": "CLOSED"  // Not OPEN
}
```

---

## Environment Variables (All Present ✅)

### TBO
```
TBO_AGENCY_ID=BOMF145
TBO_CLIENT_ID=BOMF145  
TBO_USERNAME=BOMF145
TBO_PASSWORD=travel/live-18@@
TBO_SEARCH_URL=https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest
TBO_BOOKING_URL=https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest
FLIGHTS_SUPPLIERS=AMADEUS,TBO
```

### RateHawk
```
RATEHAWK_API_ID=3635
RATEHAWK_API_KEY=d020d57a-b31d-4696-bc9a-3b90dc84239f
RATEHAWK_BASE_URL=https://api.worldota.net/api/b2b/v3/
HOTELS_SUPPLIERS=HOTELBEDS,RATEHAWK
```

---

## Quick Diagnostic Commands

### Check Supplier Health
```bash
curl -s -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
  "https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health" | \
  grep -E '"supplier"|"status"|"circuit_breaker_state"'
```

### Reset Circuit Breakers
```bash
node reset-circuit-breakers.cjs
```

### Check Supplier List
```bash
curl -s -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
  "https://builder-faredown-pricing.onrender.com/api/admin/suppliers"
```

---

## Success Criteria

- [ ] RateHawk circular JSON error fixed
- [ ] TBO circuit breaker CLOSED
- [ ] RateHawk circuit breaker CLOSED  
- [ ] TBO returns real flight results
- [ ] RateHawk returns real hotel results
- [ ] Multi-supplier aggregation working

---

## Key Files Reference

**Adapters:**
- `api/services/adapters/tboAdapter.js` - TBO implementation
- `api/services/adapters/ratehawkAdapter.js` - RateHawk implementation
- `api/services/adapters/baseSupplierAdapter.js` - Base class (circuit breaker)
- `api/services/adapters/supplierAdapterManager.js` - Orchestration (FIXED)

**Routes:**
- `api/routes/flights.js` - Flight search
- `api/routes/hotels-multi-supplier.js` - Hotel search
- `api/routes/admin-suppliers.js` - Admin endpoints

**Utilities:**
- `reset-circuit-breakers.cjs` - Circuit breaker reset
- `TBO_RATEHAWK_STATUS_REPORT.md` - Full status report
