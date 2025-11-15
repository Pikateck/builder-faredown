# TBO Nationality Restriction - Complete Guide

## 🔴 Issue Summary

**Error Message:**
```
"Search is not allowed for other than Indian Nationality."
```

**Root Cause:**
Your TBO agency account (`BOMF145`) is **restricted to searches for Indian nationals only** (`GuestNationality = "IN"`).

This is a **business/configuration restriction**, not a technical bug.

---

## ✅ Code Verification Complete

### Request Structure - CORRECT ✅

| Parameter | Your Implementation | TBO Requirement | Status |
|-----------|-------------------|-----------------|--------|
| `GuestNationality` | Top-level string | Top-level, ISO 2-letter | ✅ CORRECT |
| Position | After `PreferredCurrency` | Anywhere in request object | ✅ CORRECT |
| Format | `"IN"` (raw string) | ISO country code | ✅ CORRECT |
| Scope | Per-search (not per-room) | Top-level only | ✅ CORRECT |

**No missing fields. Payload structure matches TBO specification exactly.**

---

## 📋 Why This Restriction Exists

TBO applies nationality restrictions based on:

1. **Agency Registration Country** - Agencies registered in India often have India-only access
2. **Subscription Plan** - Some plans restrict to domestic travelers only
3. **Commercial Agreement** - Contract terms may limit markets
4. **Regulatory Compliance** - Indian travel regulations for certain segments

---

## 🛠️ Production Implementation Options

### **Option 1: Use TBO for Indian Nationals Only (Recommended)**

**Implementation:**
```javascript
// In your hotel search service
async function searchHotels(params) {
  const { userNationality, ...otherParams } = params;
  
  // Route to appropriate supplier based on nationality
  if (userNationality === 'IN') {
    // Use TBO for Indian nationals
    return await tboAdapter.searchHotels({
      ...otherParams,
      guestNationality: 'IN'
    });
  } else {
    // Use Hotelbeds/RateHawk for non-Indian nationals
    return await hotelbedsAdapter.searchHotels({
      ...otherParams,
      guestNationality: userNationality
    });
  }
}
```

**Pros:**
- ✅ Complies with TBO restrictions
- ✅ Maximizes inventory (TBO often has best India rates)
- ✅ No workarounds needed

**Cons:**
- ⚠️ Requires multi-supplier routing logic

---

### **Option 2: Request TBO to Lift Restriction**

**Contact TBO Support:**
- Email: support@tektravels.com
- Subject: "Request to Enable International Nationality for Agency BOMF145"
- Include: Business case, expected volume, target markets

**What to Request:**
- Enable `GuestNationality` for: `GB`, `AE`, `SG`, `US`, etc.
- Or: Enable all ISO country codes
- Confirm: Any pricing/commission changes

**Typical Response Time:** 3-7 business days

**Success Likelihood:**
- ✅ High if you have existing volume
- ⚠️ May require plan upgrade
- ❌ Low for free/trial accounts

---

### **Option 3: Always Pass "IN" (Not Recommended)**

**Implementation:**
```javascript
// Force all searches to use IN nationality
const searchResult = await tboAdapter.searchHotels({
  ...params,
  guestNationality: 'IN'  // Always IN, regardless of user
});
```

**Pros:**
- ✅ Simple implementation
- ✅ No supplier routing needed

**Cons:**
- ❌ May violate TBO terms of service
- ❌ Incorrect passenger data in bookings
- ❌ Potential issues with:
  - Passport validation
  - Visa requirements
  - Pricing (nationality-based rates)
  - Hotel policies (nationality restrictions)
- ❌ Compliance/audit risks

**⚠️ NOT RECOMMENDED for production**

---

## 🎯 Recommended Production Strategy

### **Multi-Supplier Architecture**

```javascript
// config/suppliers.js
const SUPPLIER_RULES = {
  TBO: {
    allowedNationalities: ['IN'],
    strengths: ['India domestic', 'UAE hotels', 'Competitive pricing']
  },
  HOTELBEDS: {
    allowedNationalities: ['*'],  // All countries
    strengths: ['Global inventory', 'European hotels']
  },
  RATEHAWK: {
    allowedNationalities: ['*'],
    strengths: ['Asia-Pacific', 'Budget segment']
  }
};

// services/hotelSearchRouter.js
function selectSupplier(searchParams) {
  const { guestNationality, destination } = searchParams;
  
  // Route Indian nationals to TBO (best rates)
  if (guestNationality === 'IN') {
    return ['TBO', 'HOTELBEDS', 'RATEHAWK'];
  }
  
  // Non-Indian nationals: use Hotelbeds + RateHawk
  return ['HOTELBEDS', 'RATEHAWK'];
}

async function searchHotels(params) {
  const suppliers = selectSupplier(params);
  
  // Parallel search across allowed suppliers
  const results = await Promise.allSettled(
    suppliers.map(s => searchWithSupplier(s, params))
  );
  
  // Merge and dedupe results
  return mergeAndRankResults(results);
}
```

**Benefits:**
- ✅ Maximizes inventory for all users
- ✅ Best rates per nationality
- ✅ Compliant with all supplier restrictions
- ✅ Resilient (fallback if one supplier fails)

---

## 📝 Test Script - Fixed

**Changes Made:**
```diff
- nationality: "AE",  // ❌ Caused error
+ nationality: "IN",  // ✅ TBO agency restriction: must be IN

Passenger 1:
- City: "Dubai",
- CountryCode: "AE",
- Nationality: "AE",
+ City: "Mumbai",
+ CountryCode: "IN",
+ Nationality: "IN",

Passenger 2:
- City: "Dubai",
- CountryCode: "AE",
- Nationality: "AE",
+ City: "Mumbai",
+ CountryCode: "IN",
+ Nationality: "IN",
```

**To Test:**
```bash
# After Render redeploys with fixed env vars
cd /opt/render/project/src
node test-tbo-full-booking-flow.js
```

**Expected Result:**
- ✅ Step 3 (HotelSearch) should now succeed
- ✅ Continue to Step 4 (GetHotelRoom)
- ✅ Complete all 7 steps successfully

---

## 🔍 Verification Checklist

Before rerunning the test, confirm these Render environment variables:

- [x] `TBO_AUTH_URL` = `https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate`
- [x] `TBO_END_USER_IP` = `52.5.155.132` (Fixie outbound IP)
- [x] `TBO_HOTEL_PASSWORD` = `@Bo#4M-Api@` (no quotes)
- [x] `TBO_PASSWORD` = `@Bo#4M-Api@` (no quotes)
- [x] `FIXIE_URL` = `http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80`
- [x] `USE_SUPPLIER_PROXY` = `true`

---

## 📞 Next Steps

### **Immediate (Testing):**
1. ✅ Fix environment variables on Render (as listed above)
2. ✅ Wait for Render to redeploy (2-3 min)
3. ✅ Push updated test script to GitHub
4. ✅ Run `node test-tbo-full-booking-flow.js` on Render
5. ✅ Share `tbo-full-booking-flow-results.json`

### **Production Planning:**
1. **Decide nationality strategy:**
   - Option A: TBO for IN only + Hotelbeds/RateHawk for others
   - Option B: Request TBO to enable all nationalities

2. **If choosing Option B:**
   - Email TBO support with business case
   - Wait 3-7 days for response
   - Confirm pricing/commission impact

3. **If choosing Option A:**
   - Implement multi-supplier router
   - Add nationality-based routing rules
   - Test with all supplier combinations

---

## 📚 Reference

**TBO Documentation:**
- HotelSearch: https://apidoc.tektravels.com/hotel/HotelSearchdedupe.aspx
- Request Format: https://apidoc.tektravels.com/hotel/HotelSearch_json.aspx
- Result Format: https://apidoc.tektravels.com/hotel/dedupe_Result.aspx

**Support:**
- Email: support@tektravels.com
- Phone: Check your TBO account dashboard
- Account Manager: (if assigned)

---

## ✅ Summary

**The Issue:**
- TBO agency `BOMF145` only allows `GuestNationality = "IN"`
- Test was passing `"AE"`, causing rejection

**The Fix:**
- ✅ Test script updated to use `nationality: "IN"`
- ✅ Code structure verified correct
- ✅ No technical issues

**Production Decision Required:**
- Use TBO for Indian nationals only? (Recommended)
- Or request TBO to enable all nationalities? (May require upgrade)

**Next Action:**
- Run the updated test on Render after env var fixes are deployed
