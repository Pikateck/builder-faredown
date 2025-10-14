# Deploy TBO & RateHawk Fixes

## ✅ Fixes Applied (Code Changes)

### 1. SupplierAdapterManager - RateHawk for Hotels ✅
**File:** `api/services/adapters/supplierAdapterManager.js` (Lines 108-117)

**Change:** Now includes RateHawk when returning hotel suppliers

```javascript
// Fixed: Returns both Hotelbeds and RateHawk for hotels
case "hotel":
  const hotelAdapters = [];
  if (this.adapters.has("HOTELBEDS")) {
    hotelAdapters.push(this.adapters.get("HOTELBEDS"));
  }
  if (this.adapters.has("RATEHAWK")) {
    hotelAdapters.push(this.adapters.get("RATEHAWK"));
  }
  return hotelAdapters;
```

---

### 2. Circular JSON Error Fix ✅
**File:** `api/services/adapters/baseSupplierAdapter.js`

**Changes Made:**

**Line 281:** Fixed error throw in executeWithCircuitBreaker
```javascript
// OLD: throw error; (contains circular refs)
// NEW: throw new Error(error.message || `${this.supplierCode} request failed`);
```

**Line 324:** Fixed error throw in executeWithRetry
```javascript
// OLD: throw error;
// NEW: throw new Error(error.message || `${this.supplierCode} request failed after ${retries} retries`);
```

---

## 🚀 Deployment Steps

### Option 1: Git Push (Recommended)

If you have git configured:

```bash
# 1. Commit the changes
git add api/services/adapters/supplierAdapterManager.js
git add api/services/adapters/baseSupplierAdapter.js
git commit -m "Fix: Add RateHawk to hotel suppliers and resolve circular JSON error"

# 2. Push to main branch
git push origin main

# 3. Render will auto-deploy (2-3 minutes)
```

---

### Option 2: Manual Deploy in Render

If git push doesn't trigger auto-deploy:

1. Go to Render Dashboard
2. Select `builder-faredown-pricing` service
3. Click **"Manual Deploy"** button (top right)
4. Select **"Deploy latest commit"** or **"Clear build cache & deploy"**
5. Wait for deployment to complete (~2-3 minutes)

---

### Option 3: Restart Service (Quick Test)

If code is already deployed but not loaded:

1. Go to Render Dashboard → Settings
2. Scroll to bottom
3. Click **"Restart Service"**
4. Wait 30 seconds

---

## ✅ Verification After Deployment

### 1. Check Supplier Health (30 sec after deploy)

```bash
curl -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
  "https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health"
```

**Expected:**
- No more circular JSON errors
- Circuit breaker states shown correctly
- Error messages clean and readable

---

### 2. Wait for Circuit Breaker Auto-Reset

Circuit breakers will auto-reset:
- **After 30 seconds** of no requests
- **OR** on first successful request

**Check Status:**
```bash
# Run every 10 seconds to monitor
watch -n 10 'curl -s -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
  "https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health" | grep -E "circuit_breaker_state|supplier"'
```

---

### 3. Test TBO Flight Search

Once TBO circuit breaker is CLOSED:

```bash
curl "https://builder-faredown-pricing.onrender.com/api/flights/search?\
origin=BOM&destination=DXB&departureDate=2025-11-25&adults=1"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [ /* Real TBO flight offers, not fallback */ ],
  "meta": {
    "suppliers": {
      "TBO": {
        "success": true,
        "resultCount": 10,
        "responseTime": 3200
      }
    }
  }
}
```

---

### 4. Test RateHawk Hotel Search

Once RateHawk circuit breaker is CLOSED:

```bash
curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?\
destination=Dubai&checkIn=2025-12-15&checkOut=2025-12-20&rooms=%5B%7B%22adults%22%3A2%7D%5D"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [ /* Real RateHawk hotel offers */ ],
  "meta": {
    "suppliers": {
      "RATEHAWK": {
        "success": true,
        "resultCount": 15,
        "responseTime": 2500
      },
      "HOTELBEDS": {
        "success": true,
        "resultCount": 12,
        "responseTime": 2800
      }
    }
  }
}
```

---

### 5. Verify Multi-Supplier Aggregation

```bash
# Should return combined results from both RATEHAWK and HOTELBEDS
curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?\
destination=London&checkIn=2026-01-10&checkOut=2026-01-15&rooms=%5B%7B%22adults%22%3A2%7D%5D"
```

---

## 🎯 Success Checklist

After deployment and circuit breaker reset:

- [ ] Supplier health shows no JSON errors
- [ ] TBO circuit breaker: CLOSED
- [ ] RateHawk circuit breaker: CLOSED
- [ ] TBO returns real flight results (not fallback)
- [ ] RateHawk returns real hotel results
- [ ] Hotelbeds still working
- [ ] Multi-supplier aggregation working
- [ ] Error messages are clean (no circular JSON)

---

## 🔧 Troubleshooting

### If Circuit Breakers Stay OPEN

**Solution:** Trigger searches to force reset

```bash
# Trigger TBO search
curl "https://builder-faredown-pricing.onrender.com/api/flights/search?\
origin=DEL&destination=BOM&departureDate=2025-12-01&adults=1"

# Trigger RateHawk search
curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?\
destination=Mumbai&checkIn=2025-12-10&checkOut=2025-12-12&rooms=%5B%7B%22adults%22%3A1%7D%5D"

# Wait 5 seconds, then check health again
```

---

### If Still Getting Fallback Data

**Check:**
1. Is the deployment complete? (check Render logs)
2. Are circuit breakers CLOSED? (check health endpoint)
3. Are credentials valid? (verify env vars in Render)

**Debug:**
```bash
# Check Render logs
# Render Dashboard → Logs → Look for:
# - "TBO authentication successful"
# - "RateHawk search successful"
# - No "Circuit breaker is OPEN" messages
```

---

### If RateHawk Still Not Appearing

**Verify SupplierAdapterManager fix deployed:**
```bash
# Test hotel search and check meta.suppliers
curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?\
destination=Paris&checkIn=2026-03-01&checkOut=2026-03-05" | grep -o '"suppliers":{[^}]*}'
```

Should show both RATEHAWK and HOTELBEDS.

---

## 📊 Expected Timeline

| Step | Duration | Details |
|------|----------|---------|
| Git push | 1 min | Commit and push changes |
| Render deploy | 2-3 min | Build and deploy |
| Service restart | 30 sec | Load new code |
| Circuit breaker reset | 30 sec | Auto-reset after no requests |
| First test | 5 sec | Trigger searches |
| **Total** | **5-7 min** | Full deployment to working |

---

## 🎉 Final Verification

Once everything is working:

1. **Admin Panel Check:**
   - Open: https://spontaneous-biscotti-da44bc.netlify.app/admin
   - Navigate to Supplier Management
   - Verify all suppliers show healthy status

2. **API Test:**
   ```bash
   # All suppliers healthy
   curl -H "X-Admin-Key: 8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1" \
     "https://builder-faredown-pricing.onrender.com/api/admin/suppliers/health"
   
   # TBO flights working
   curl ".../api/flights/search?origin=BOM&destination=DXB&departureDate=2025-11-25&adults=1"
   
   # RateHawk + Hotelbeds hotels working
   curl ".../api/hotels/search?destination=Dubai&checkIn=2025-12-15&checkOut=2025-12-20"
   ```

3. **Screenshot Proofs:**
   - Admin panel supplier health
   - Network tab showing successful requests
   - API responses with real data

---

**Status:** Ready for deployment 🚀  
**Files Modified:** 2  
**Expected Downtime:** None (rolling deploy)  
**Risk:** Low (bug fixes only, no breaking changes)
