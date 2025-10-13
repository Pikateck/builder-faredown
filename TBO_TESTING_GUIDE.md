# TBO Flight Supplier Testing Guide

## ✅ Fixes Applied

### 1. Calendar Consistency Fixed
- **Changed**: FlightResults now uses `StableBookingCalendar` (same as main page)
- **Before**: Used `BookingCalendar` which looked different
- **Result**: Consistent calendar appearance across all pages

### 2. Modify Search Button Fixed  
- **Changed**: Modal only shows on mobile devices (`md:hidden`)
- **Before**: Opened mobile-style modal on desktop
- **Result**: Desktop users keep using the visible filter panel

---

## 🧪 TBO Test Destinations

### Recommended Test Routes for TBO:

**Domestic India (High TBO Coverage):**
```
Mumbai (BOM) → Delhi (DEL)
Delhi (DEL) → Bangalore (BLR)  
Mumbai (BOM) → Chennai (MAA)
Delhi (DEL) → Hyderabad (HYD)
```

**International from India (TBO Active):**
```
Mumbai (BOM) → Dubai (DXB)
Delhi (DEL) → Singapore (SIN)
Mumbai (BOM) → London (LHR)
Delhi (DEL) → Bangkok (BKK)
```

**Best for Testing:**
- **BOM → DEL** (highest availability, fastest response)
- **DEL → DXB** (international, good prices)

---

## 🔍 Why Results Might Not Show

### Check 1: Verify TBO is Initialized on Render

1. Go to **Render Logs** → `builder-faredown-pricing`
2. Look for:
   ```
   [ADAPTER_MANAGER] TBO adapter initialized
   [ADAPTER_MANAGER] Initialized 2 supplier adapters
   ```
3. If you see `Initialized 1 supplier adapters` → TBO is NOT initialized

### Check 2: Test API Directly

```bash
# Test if TBO is working
curl "https://builder-faredown-pricing.onrender.com/api/flights/search?origin=BOM&destination=DEL&departureDate=2025-11-01&adults=1&cabinClass=ECONOMY"
```

**Look for in response:**
```json
{
  "meta": {
    "suppliers": {
      "AMADEUS": { "success": true, "resultCount": 25 },
      "TBO": { "success": true, "resultCount": 20 }
    }
  }
}
```

### Check 3: Common Issues

| Issue | Solution |
|-------|----------|
| **"Initialized 1 supplier"** | TBO_AGENCY_ID not set on Render → Add environment variables |
| **TBO returns 0 results** | Route not available → Try BOM→DEL or DEL→DXB |
| **Authentication error** | TBO credentials wrong → Verify TBO_USERNAME, TBO_PASSWORD |
| **Fallback data shown** | API timeout or error → Check Render logs for TBO errors |

---

## 🚀 Testing Steps

### Frontend Testing (Netlify):

1. **Go to**: https://spontaneous-biscotti-da44bc.netlify.app
2. **Search**: BOM → DEL, Tomorrow, 1 adult, Economy
3. **Check results**: Should see mixed airlines from both suppliers
4. **Look for**: Different prices, multiple airlines (IndiGo, Air India, SpiceJet = TBO; Emirates, Lufthansa = Amadeus)

### Backend Verification:

1. **Check response in browser DevTools**:
   - Open Network tab
   - Search flights
   - Find `/api/flights/search` request
   - Check response JSON for `meta.suppliers`

2. **Verify both suppliers show**:
   ```json
   "suppliers": {
     "AMADEUS": { "success": true, "resultCount": X },
     "TBO": { "success": true, "resultCount": Y }
   }
   ```

---

## 🐛 Current Status Check

Run this query in your database to verify TBO supplier exists:

```sql
SELECT * FROM supplier_master WHERE code = 'tbo';
```

**Expected result:**
| code | name | enabled | weight |
|------|------|---------|--------|
| tbo | TBO (Travel Boutique Online) | true | 90 |

---

## 📊 Expected Behavior

### Working TBO Integration Shows:

✅ **Search Results Page:**
- Results from BOTH Amadeus and TBO
- Mixed airlines in results list
- Different price points
- `supplier` field in flight data

✅ **API Response:**
- `meta.suppliers` shows 2 suppliers
- Both have `success: true`
- Both have `resultCount > 0`

✅ **Render Logs:**
```
[ADAPTER_MANAGER] TBO adapter initialized
[ADAPTER_MANAGER] Amadeus adapter initialized
[ADAPTER_MANAGER] Initialized 2 supplier adapters
[TBO] TBO authentication successful
```

---

## 🔑 Next Steps

1. **Check Render logs** for "Initialized 2 supplier adapters"
2. **If not**: Add TBO environment variables and redeploy
3. **Test with**: BOM → DEL or DEL → DXB
4. **Verify**: See results from both suppliers in browser

**TBO should work for most Indian domestic and international routes!** 🛫
