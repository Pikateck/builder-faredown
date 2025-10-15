# 🚀 Deploy RateHawk Fix - Step by Step

## What Was Fixed

Fixed the **RateHawk circular JSON error** that was blocking hotel searches.

**Problem:** `Converting circular structure to JSON` with TLSSocket
**Solution:** Wrapped HTTP calls in `executeWithRetry` and fixed error logging

## Deploy to Render (2 Options)

### Option 1: Git Push (Auto-Deploy) ⚡️
```bash
# Stage the fix
git add api/services/adapters/ratehawkAdapter.js

# Commit with descriptive message
git commit -m "fix: RateHawk circular JSON error - wrap HTTP calls in executeWithRetry"

# Push to trigger auto-deploy
git push origin main
```

**Render will auto-deploy in ~2 minutes**

### Option 2: Manual Deploy via Render Dashboard
1. Go to: https://dashboard.render.com
2. Select: `builder-faredown-pricing` service
3. Click: "Manual Deploy" → "Deploy latest commit"
4. Wait: ~2 minutes for deployment

---

## Verify the Fix (After Deploy)

### Step 1: Reset Circuit Breakers
```bash
node reset-circuit-breakers.cjs
```

**Expected Output:**
```
✅ RateHawk Hotel Search completed
✅ RATEHAWK: CLOSED (healthy)
   No circular JSON error ✨
```

### Step 2: Test RateHawk Hotel Search
```bash
curl "https://builder-faredown-pricing.onrender.com/api/hotels/search?destination=Dubai&checkIn=2025-12-20&checkOut=2025-12-25&rooms=%5B%7B%22adults%22%3A2%7D%5D" | jq '.meta.suppliers.RATEHAWK'
```

**Expected Response:**
```json
{
  "RATEHAWK": {
    "success": true,
    "resultCount": 15,
    "responseTime": 1200,
    "cached": false
  }
}
```

### Step 3: Verify Admin Panel
1. Visit: https://spontaneous-biscotti-da44bc.netlify.app/admin
2. Go to: Supplier Management
3. Check: RateHawk status should show **"Active" with circuit breaker CLOSED**

---

## What Changed

| File | Lines | Change |
|------|-------|--------|
| `ratehawkAdapter.js` | 155-160 | Wrapped `searchHotels` HTTP call |
| `ratehawkAdapter.js` | 248-255 | Wrapped `searchRegions` HTTP call |
| `ratehawkAdapter.js` | 526-530 | Fixed error logging (safe properties) |
| `ratehawkAdapter.js` | 564-567 | Fixed health check error logging |

---

## Success Criteria ✅

- [ ] Code deployed to Render (check deployment logs)
- [ ] Circuit breaker test shows RateHawk as **CLOSED**
- [ ] Hotel search returns real RateHawk results (not fallback)
- [ ] Admin panel shows RateHawk as **Active/Healthy**
- [ ] No "Converting circular structure to JSON" errors

---

## Rollback Plan (If Needed)

If something goes wrong:
```bash
# Revert the commit
git revert HEAD

# Push to trigger rollback deploy
git push origin main
```

---

## Quick Deploy Command (Copy-Paste)

```bash
git add api/services/adapters/ratehawkAdapter.js && \
git commit -m "fix: RateHawk circular JSON error" && \
git push origin main && \
echo "✅ Deployed! Wait 2 minutes then run: node reset-circuit-breakers.cjs"
```

---

## Timeline

1. **Deploy** - 2 minutes (Render build + deploy)
2. **Circuit Reset** - Instant (first successful request)
3. **Verification** - 1 minute (run test commands)

**Total: ~3 minutes to fully operational RateHawk** 🚀
