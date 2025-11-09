# TBO Connectivity Test Guide

**Date:** Oct 25, 2025  
**Status:** Ready for Testing  
**Next Step:** Update Render env vars → Run connectivity test → Implement STEP 2

---

## What's Been Done ✅

I have updated the backend code to use the **new standardized environment variable names** (no hard-coding):

### 1. Environment Variable Names Updated

**Files Modified:**

- ✅ `api/services/adapters/tboAdapter.js` (lines 72-78)
- ✅ `api/routes/tbo-diagnostics.js` (lines 78-82)
- ✅ `api/services/tboClient.js` (lines 12-13)

**Changes:**
| Old Variable | New Variable | Purpose |
|--------------|--------------|---------|
| `TBO_HOTEL_CLIENT_ID` | `TBO_CLIENT_ID` | Hotel API Client ID |
| `TBO_HOTEL_USER_ID` | `TBO_API_USER_ID` | Hotel API User ID |
| `TBO_HOTEL_PASSWORD` | `TBO_API_PASSWORD` | Hotel API Password |
| `TBO_STATIC_DATA_CREDENTIALS_USERNAME` | `TBO_STATIC_USER` | Static data user (countries, cities) |
| `TBO_STATIC_DATA_CREDENTIALS_PASSWORD` | `TBO_STATIC_PASSWORD` | Static data password |

**No Hard-Coded Values:** All credentials are now read from environment variables only.

### 2. Connectivity Test Script Created

**File:** `api/scripts/test-tbo-connectivity.js` (276 lines)

**Tests:**

- ✅ Verifies all 5 environment variables are set
- ✅ Authenticates with TBO Hotel API (SharedData.svc)
- ✅ Performs a sample hotel search (Dubai, 2 nights)
- ✅ Logs full request/response for debugging
- ✅ Provides clear error messages if any step fails

---

## Your Action Plan

### STEP 1: Update Render Environment Variables

**Important:** You must rename the existing environment variables on Render to the new names.

**Instructions:**

1. Go to Render Dashboard: https://dashboard.render.com/
2. Select: `builder-faredown-pricing` service
3. Click: **Environment** tab
4. **For each variable below:**
   - Delete the old name
   - Add new name with same value

**Variables to Update:**

```
OLD NAME: TBO_HOTEL_CLIENT_ID
NEW NAME: TBO_CLIENT_ID
VALUE: tboprod
───────────────────────────────────────

OLD NAME: TBO_HOTEL_USER_ID
NEW NAME: TBO_API_USER_ID
VALUE: BOMF145
───────────────────────────────────────

OLD NAME: TBO_HOTEL_PASSWORD
NEW NAME: TBO_API_PASSWORD
VALUE: @Bo#4M-Api@
───────────────────────────────────────

OLD NAME: TBO_STATIC_DATA_CREDENTIALS_USERNAME
NEW NAME: TBO_STATIC_USER
VALUE: travelcategory
───────────────────────────────────────

OLD NAME: TBO_STATIC_DATA_CREDENTIALS_PASSWORD
NEW NAME: TBO_STATIC_PASSWORD
VALUE: Tra@59334536
```

**Verification:** After adding, confirm all 5 new variables are visible in the Environment tab.

---

### STEP 2: Deploy Updated Code

```bash
# 1. The code changes are already in your local repo
# 2. Push to git
git add -A
git commit -m "refactor: standardize TBO environment variable names"
git push origin main

# 3. Wait for Render auto-deploy (2-3 minutes)
# Monitor: https://dashboard.render.com/d/builder-faredown-pricing → Logs
```

---

### STEP 3: Run Connectivity Test

**Option A: Via SSH on Render**

```bash
# SSH into Render service
render connect builder-faredown-pricing

# Run the test
cd /opt/render/project
node api/scripts/test-tbo-connectivity.js
```

**Option B: Create Temporary Test Endpoint**

If SSH is not available, I can add a temporary `/api/test/tbo-connectivity` endpoint that returns the test results.

**Expected Output if Successful:**

```
[2025-10-25T10:30:00.000Z] ✓ Step 1: Checking environment variables
[2025-10-25T10:30:00.100Z] ✓   ✓ TBO_CLIENT_ID: SET
[2025-10-25T10:30:00.200Z] ✓   ✓ TBO_API_USER_ID: SET
[2025-10-25T10:30:00.300Z] ✓   ✓ TBO_API_PASSWORD: SET
[2025-10-25T10:30:00.400Z] ✓   ✓ TBO_STATIC_USER: SET
[2025-10-25T10:30:00.500Z] ✓   ✓ TBO_STATIC_PASSWORD: SET

[2025-10-25T10:30:00.600Z] ✓ Step 2: Testing TBO Authentication (Dynamic API)
[2025-10-25T10:30:01.200Z] ✓ Authentication successful!
[2025-10-25T10:30:01.300Z] ✓   Token: Xk7mP2qL9vN8oR5sT3u...
[2025-10-25T10:30:01.400Z] ✓   Token expires in: ~55 minutes

[2025-10-25T10:30:01.500Z] ✓ Step 3: Testing TBO Hotel Search (Dynamic Search)
[2025-10-25T10:30:02.800Z] ✓ Hotel search successful!
[2025-10-25T10:30:02.900Z] ✓   Total hotels found: 47
[2025-10-25T10:30:03.000Z] ✓   Sample hotel:
[2025-10-25T10:30:03.100Z] ✓     - Name: Taj Beachfront Dubai
[2025-10-25T10:30:03.200Z] ✓     - Rating: 5 stars
[2025-10-25T10:30:03.300Z] ✓     - Code: 12345
[2025-10-25T10:30:03.400Z] ✓     - Price (per night): INR 4500

[2025-10-25T10:30:03.500Z] ✓ ✓ TBO connectivity test PASSED - All systems operational!
[2025-10-25T10:30:03.600Z] ✓ You can now proceed with implementing the STEP 2 canonical endpoints.
```

---

## What Happens if Test Fails

### Error 1: Authentication Failed (401/403)

**Message:** `Authentication failed: Invalid ClientId/UserName/Password`

**Likely Causes:**

1. ❌ Credentials are incorrect → Verify values match TBO email
2. ❌ Outbound IPs not whitelisted → Confirm 52.5.155.132, 52.87.82.133 are whitelisted
3. ❌ Account not enabled for TBO Hotel API → Contact TBO support

**Debug:** Check response for specific error message

### Error 2: Environment Variable Missing

**Message:** `MISSING` next to any variable name

**Solution:** Ensure all 5 new variables are added to Render (Step 1)

### Error 3: Network/Timeout Error

**Message:** `Request timeout` or `ECONNREFUSED`

**Likely Causes:**

1. Fixie proxy not active → Check USE_SUPPLIER_PROXY=true
2. Network connectivity issue → Check Render logs
3. TBO API temporarily down → Check TBO status page

**Solution:**

- Retry after 5 minutes
- Check Render service logs for detailed errors
- Contact support if persistent

---

## Successful Test → Next Step

Once the connectivity test **PASSES**, you can proceed with:

### STEP 2 Implementation: Canonical Hotel API Endpoints

The 4 canonical endpoints are already implemented in:

- **File:** `api/routes/hotels-canonical.js` (658 lines)
- **Endpoints:**
  1. `GET /api/hotels/autocomplete?q=<city>` - City search
  2. `POST /api/hotels/search` - Hotel search
  3. `GET /api/hotels/:propertyId` - Hotel details
  4. `POST /api/hotels/:propertyId/rates` - Room rates & availability

**Implementation Status:** ✅ Complete and ready to deploy

**Quick Start:**

```bash
# 1. Code is already implemented
# 2. Run database migration
psql $DATABASE_URL < api/database/migrations/20250401_hotel_canonical_indexes.sql

# 3. Code is ready - endpoints will be live after env vars are set
# 4. Test using Postman collection
# File: api/postman/Canonical-Hotel-API.postman_collection.json
```

---

## Timeline

| Step      | Action                   | Time       | Status         |
| --------- | ------------------------ | ---------- | -------------- |
| 1         | Update Render env vars   | 5 min      | ⏳ Your action |
| 2         | Deploy code changes      | 3 min      | Auto-deploy    |
| 3         | Run connectivity test    | 5 min      | ⏳ Your action |
| 4         | Run database migration   | 2 min      | ⏳ Your action |
| 5         | Test STEP 2 endpoints    | 15 min     | ⏳ Your action |
| **Total** | **Implementation Ready** | **30 min** |                |

---

## Key Files Reference

| File                                                      | Purpose                       | Status     |
| --------------------------------------------------------- | ----------------------------- | ---------- |
| `api/services/adapters/tboAdapter.js`                     | TBO adapter with new env vars | ✅ Updated |
| `api/routes/tbo-diagnostics.js`                           | Diagnostics endpoint          | ✅ Updated |
| `api/services/tboClient.js`                               | TBO client with new env vars  | ✅ Updated |
| `api/scripts/test-tbo-connectivity.js`                    | Connectivity test script      | ✅ Created |
| `api/routes/hotels-canonical.js`                          | STEP 2 endpoints              | ✅ Ready   |
| `api/postman/Canonical-Hotel-API.postman_collection.json` | Postman tests                 | ✅ Ready   |
| `api/openapi/hotels-canonical-openapi.yaml`               | OpenAPI spec                  | ✅ Ready   |

---

## Support

If you encounter any errors during testing:

1. **Check logs:** https://dashboard.render.com/d/builder-faredown-pricing → Logs
2. **Share full error output** from the connectivity test
3. **Verify credentials** match values from TBO email
4. **Confirm IPs** 52.5.155.132 and 52.87.82.133 are whitelisted

---

## Summary

✅ **Code Updated:** All references to old env var names are updated  
✅ **Test Script Created:** Ready to verify TBO connectivity  
✅ **STEP 2 Ready:** 4 canonical endpoints waiting for deployment

**Your Next Actions:**

1. Update Render environment variables (Step 1)
2. Deploy code (automatic after git push)
3. Run connectivity test (Step 3)
4. Proceed with STEP 2 (once test passes)

**Estimated Time to Production:** 30 minutes from env var update
