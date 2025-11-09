# 🚀 Immediate Actions Required

**Status:** Code refactored ✅ | Test ready ✅ | Awaiting your actions ⏳

---

## What I've Done ✅

1. ✅ Updated `api/services/adapters/tboAdapter.js` - New env var names only
2. ✅ Updated `api/routes/tbo-diagnostics.js` - New env var names only
3. ✅ Updated `api/services/tboClient.js` - New env var names only
4. ✅ Created `api/scripts/test-tbo-connectivity.js` - Comprehensive test script
5. ✅ Created `TBO_CONNECTIVITY_TEST_GUIDE.md` - Step-by-step instructions
6. ✅ Created `TBO_ENV_VAR_REFACTOR_COMPLETE.md` - Complete summary

**All code is environment-variable-driven. No credentials hard-coded.**

---

## What You Need to Do Now

### 🔴 CRITICAL: Update Render Environment Variables

**Go to:** https://dashboard.render.com/d/builder-faredown-pricing/environment

**Action:** Replace old variable names with new ones

```
OLD → NEW                      | VALUE
───────────────────────────────────────────────────────
TBO_HOTEL_CLIENT_ID            → TBO_CLIENT_ID
    Keep value: tboprod

TBO_HOTEL_USER_ID              → TBO_API_USER_ID
    Keep value: BOMF145

TBO_HOTEL_PASSWORD             → TBO_API_PASSWORD
    Keep value: @Bo#4M-Api@

TBO_STATIC_DATA_CREDENTIALS_USERNAME → TBO_STATIC_USER
    Keep value: travelcategory

TBO_STATIC_DATA_CREDENTIALS_PASSWORD → TBO_STATIC_PASSWORD
    Keep value: Tra@59334536
```

**Verification:**

- [ ] All 5 new variables visible
- [ ] All 5 old variables removed
- [ ] Values match exactly

---

### 📦 Deploy Code Changes

```bash
# 1. Commit changes
git add -A
git commit -m "refactor: standardize TBO environment variable names"

# 2. Push (auto-deploys to Render)
git push origin main

# 3. Wait for deployment (2-3 minutes)
# Monitor: https://dashboard.render.com/d/builder-faredown-pricing → Logs
```

---

### 🧪 Run Connectivity Test

**Once deployment is complete:**

**Option A: SSH into Render (Recommended)**

```bash
render connect builder-faredown-pricing
cd /opt/render/project
node api/scripts/test-tbo-connectivity.js
```

**Option B: Use Existing Diagnostics Endpoint**

```bash
curl https://builder-faredown-pricing.onrender.com/api/tbo/diagnostics
```

---

## Expected Test Output ✓

If successful, you should see:

```
[timestamp] ✓ Step 1: Checking environment variables
[timestamp] ✓   ✓ TBO_CLIENT_ID: SET
[timestamp] ✓   ✓ TBO_API_USER_ID: SET
[timestamp] ✓   ✓ TBO_API_PASSWORD: SET
[timestamp] ✓   ✓ TBO_STATIC_USER: SET
[timestamp] ✓   ✓ TBO_STATIC_PASSWORD: SET

[timestamp] ✓ Step 2: Testing TBO Authentication
[timestamp] ✓ Authentication successful!
[timestamp] ✓   Token: Xk7mP2qL9vN8oR5sT3u...

[timestamp] ✓ Step 3: Testing TBO Hotel Search
[timestamp] ✓ Hotel search successful!
[timestamp] ✓   Total hotels found: 47
[timestamp] ✓ ✓ TBO connectivity test PASSED
```

---

## Timeline

| Step                         | Time        | Status         |
| ---------------------------- | ----------- | -------------- |
| Update Render env vars       | 5 min       | ⏳ Your action |
| Deploy code                  | 3 min       | Auto           |
| Run test                     | 5 min       | ⏳ Your action |
| **Total Time to Production** | **~30 min** |                |

---

## If Test Passes ✅

Proceed immediately with STEP 2:

```bash
# 1. Run database migration
psql $DATABASE_URL < api/database/migrations/20250401_hotel_canonical_indexes.sql

# 2. Test canonical endpoints using Postman
# File: api/postman/Canonical-Hotel-API.postman_collection.json

# 3. 4 endpoints now live:
#    - GET /api/hotels/autocomplete
#    - POST /api/hotels/search
#    - GET /api/hotels/:propertyId
#    - POST /api/hotels/:propertyId/rates
```

**Documentation:**

- Postman tests: `api/postman/Canonical-Hotel-API.postman_collection.json`
- OpenAPI spec: `api/openapi/hotels-canonical-openapi.yaml`
- Implementation guide: `STEP_2_SUMMARY_FOR_ZUBIN.md`

---

## If Test Fails ❌

Check these in order:

1. **All 5 env vars set?**
   - Go to Render Environment tab
   - Verify: TBO_CLIENT_ID, TBO_API_USER_ID, TBO_API_PASSWORD, TBO_STATIC_USER, TBO_STATIC_PASSWORD

2. **Values correct?**
   - TBO_CLIENT_ID = tboprod
   - TBO_API_USER_ID = BOMF145
   - TBO_API_PASSWORD = @Bo#4M-Api@
   - TBO_STATIC_USER = travelcategory
   - TBO_STATIC_PASSWORD = Tra@59334536

3. **Code deployed?**
   - Check Render Logs: should show no error
   - Verify git push succeeded

4. **Still failing?**
   - Share test output (logs)
   - Check if IPs are whitelisted: 52.5.155.132, 52.87.82.133
   - Verify Fixie proxy is active

---

## Documentation Reference

| Document                                                  | Purpose                       | When to Read              |
| --------------------------------------------------------- | ----------------------------- | ------------------------- |
| `TBO_CONNECTIVITY_TEST_GUIDE.md`                          | Detailed test instructions    | Before running test       |
| `TBO_ENV_VAR_REFACTOR_COMPLETE.md`                        | What was changed and why      | For understanding changes |
| `STEP_2_SUMMARY_FOR_ZUBIN.md`                             | STEP 2 implementation details | After test passes         |
| `api/postman/Canonical-Hotel-API.postman_collection.json` | Test requests                 | For endpoint testing      |

---

## Success Criteria

✅ Test passes when:

1. All 5 environment variables are set
2. TBO authentication returns a TokenId
3. Hotel search returns 40+ hotels for Dubai
4. No error codes (401, 403, 5xx)

---

## Next Phase (After Test Passes)

Once connectivity is confirmed:

**STEP 2 is ready to deploy immediately:**

- 4 canonical endpoints implemented
- Database migration ready
- All documentation provided
- Postman tests ready

**No additional development needed** - just run migration and test.

---

## Summary

**You have:**

- ✅ Standardized environment variable names
- ✅ Zero hard-coded credentials
- ✅ Ready-to-run connectivity test
- ✅ Comprehensive documentation

**You need to:**

1. Update 5 env vars on Render (5 min)
2. Deploy code (automatic)
3. Run test (5 min)
4. Report results

**Then:** Proceed with STEP 2 implementation (ready to deploy)

---

## Quick Links

- **Render Dashboard:** https://dashboard.render.com/d/builder-faredown-pricing
- **Environment Tab:** https://dashboard.render.com/d/builder-faredown-pricing/environment
- **Test Script:** `api/scripts/test-tbo-connectivity.js`
- **Test Guide:** `TBO_CONNECTIVITY_TEST_GUIDE.md`

---

**Ready to proceed?** Start with updating the Render environment variables above. ⬆️
