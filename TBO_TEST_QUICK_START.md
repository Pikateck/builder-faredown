# TBO Connectivity Test - Quick Start Guide

## What I've Prepared

I've created a **comprehensive end-to-end test script** that will:

1. ✅ **Test Authentication** against TBO's Shared Data API
   - Verify credentials are correct
   - Confirm token is returned
   - Check token expiry

2. ✅ **Test Hotel Search** against TBO's live Hotel API  
   - Search Dubai (DXB) for 30-45 days from today
   - Verify hotels are returned
   - Confirm rates, currency, board type, cancellation info present
   - Log timing and sample hotel data

3. ✅ **Provide Clear Logging**
   - Request payloads (with password masked)
   - Response times
   - Full error details if anything fails
   - Success/failure status for each step

---

## 3 Quick Steps to Run the Test

### Step 1: Open Render Dashboard
Go to: https://dashboard.render.com/d/builder-faredown-pricing

### Step 2: Click Shell
Click the **"Shell"** button in the top-right corner

### Step 3: Run Test
Paste this command and press Enter:

```bash
cd /opt/render/project && node api/scripts/run-tbo-test.js
```

---

## What Success Looks Like

You should see output like:

```
✓ STEP 1: Environment Variable Verification
  ✓ TBO Client ID: SET
  ✓ TBO User ID: SET
  ✓ TBO Password: SET

✓ STEP 2: Authentication Test
  ✓ Authentication successful! (XXXms)
  ✓ Token: [40-character token]...
  ✓ Expires in: ~55 minutes

✓ STEP 3: Hotel Search Test
  ✓ Hotel search completed! (XXXms)
  ✓ Hotels Found: 47+
  Sample Hotel (First Result):
    Name: [Hotel Name]
    Code: [Code]
    Rating: 5 stars
    Price (per night): INR [Amount]
    ✓ Has Rates: ✓ Yes
    ✓ Has Cancellation Info: ✓ Yes

════════════════════════════════════════════════════════════════════════════════
✓ TBO CONNECTIVITY TEST PASSED - All systems operational!
════════════════════════════════════════════════════════════════════════════════
```

---

## If Test Fails

### Missing Environment Variables
Check Render Dashboard → Settings → Environment variables

Should have (choose one set):
```
PRIMARY NAMES:
TBO_CLIENT_ID=tboprod
TBO_API_USER_ID=BOMF145
TBO_API_PASSWORD=@Bo#4M-Api@

OR

FALLBACK NAMES:
TBO_HOTEL_CLIENT_ID=tboprod
TBO_HOTEL_USER_ID=BOMF145
TBO_HOTEL_PASSWORD=@Bo#4M-Api@
```

### Authentication Failed (401)
- Credentials incorrect
- TBO account not enabled for Hotel API
- Action: Contact TBO support

### Hotel Search Failed
- TBO has no inventory for Dubai on those dates
- Try dates 45+ days from today instead of 30
- Check full error response in console output

---

## After Test Passes ✅

Once you see "TBO CONNECTIVITY TEST PASSED", reply with:
1. The final success message
2. Any key metrics (hotel count, timing)
3. Confirm ready to proceed

Then I'll implement:
- **4 STEP 2 Canonical Endpoints**
- **Database caching** with 15-minute TTL
- **Error handling** and fallbacks
- **Complete testing** with Postman collection

---

## Files Created

- ✅ `api/scripts/run-tbo-test.js` - Test script (413 lines)
- ✅ `TBO_TEST_EXECUTION_GUIDE.md` - Detailed guide
- ✅ `TBO_TEST_QUICK_START.md` - This file

---

## Estimated Timing

| Phase | Time |
|-------|------|
| Run test | 30 seconds |
| Review results | 2-5 minutes |
| **Total** | **~5 minutes** |

Then if all passes:
- **STEP 2 Implementation**: 60-90 minutes
- **Testing + Deployment**: 30 minutes

---

## Go! 🚀

1. Open Render Shell
2. Run: `cd /opt/render/project && node api/scripts/run-tbo-test.js`
3. Share the results
4. I'll implement STEP 2 endpoints

Good luck! 🎯
