# TBO Integration - Final Deployment Guide

## ✅ Completed Code Changes

### 1. Supplier-Aware Markup Logic (`api/routes/markup.js`)
- ✅ Updated `GET /api/markup/air` to filter by `supplier_scope`
- ✅ Updated `POST /api/markup/air` to accept `supplierScope` parameter
- ✅ Updated `PUT /api/markup/air/:id` to update `supplier_scope`
- ✅ Markup rules now apply based on supplier (amadeus/tbo/all)

### 2. Supplier-Aware Promo Code Logic (`api/routes/promo.js`)
- ✅ Updated `applyPromoCode()` to filter by `supplier_scope`
- ✅ Promo codes now validate against supplier

### 3. Flight Search Aggregation (`api/routes/flights.js`)
- ✅ Replaced direct Amadeus API call with `supplierAdapterManager.searchAllFlights()`
- ✅ Now searches both **AMADEUS** and **TBO** in parallel
- ✅ Applies supplier-specific markups and promos
- ✅ Returns aggregated results with supplier tags

---

## 🚀 Deployment Steps

### Step 1: Set Environment Variables on Render

Add these variables to your Render dashboard (Environment section):

```bash
# TBO Configuration - DUAL URLs
# Search/Pricing Operations (Search, FareQuote, FareRule, SSR, CalendarFare)
TBO_SEARCH_URL=https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc

# Booking Operations (Book, Ticket, GetBookingDetails, SendChangeRequest)
TBO_BOOKING_URL=https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc

# Credentials
TBO_AGENCY_ID=BOMF145
TBO_CLIENT_ID=BOMF145
TBO_USERNAME=BOMF145
TBO_PASSWORD=travel/live-18@@
TBO_END_USER_IP=192.168.5.56
TBO_CREDENTIAL_MODE=runtime
TBO_TIMEOUT_MS=15000

# Multi-Supplier Configuration
FLIGHTS_SUPPLIERS=AMADEUS,TBO
```

**Important Notes:**
- TBO uses **two different base URLs**: one for search/pricing, one for booking
- Credentials are the same for both endpoints
- Do NOT add `/rest` suffix to the URLs

### Step 2: Run Database Migration

**Option A: Using psql (Recommended)**
```bash
psql $DATABASE_URL -f api/database/migrations/20250315_add_tbo_supplier_integration.sql
```

**Option B: Using Node.js**
```bash
node -e "
const pool = require('./api/database/connection');
const fs = require('fs');
const sql = fs.readFileSync('./api/database/migrations/20250315_add_tbo_supplier_integration.sql', 'utf8');
pool.query(sql)
  .then(() => console.log('✅ Migration complete'))
  .catch(err => console.error('❌ Migration failed:', err))
  .finally(() => pool.end());
"
```

**Option C: Manual SQL Execution**
1. Connect to your PostgreSQL database
2. Copy and paste the SQL from `api/database/migrations/20250315_add_tbo_supplier_integration.sql`
3. Execute it

### Step 3: Verify Database Changes

Check that the following changes were applied:

```sql
-- 1. Check TBO token cache table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'tbo_token_cache';

-- 2. Check supplier_scope column added to markup_rules
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'markup_rules' AND column_name = 'supplier_scope';

-- 3. Check supplier column added to bookings
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'supplier';

-- 4. Check supplier_master table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'supplier_master';

-- 5. Verify initial supplier data
SELECT code, name, enabled, product_types FROM supplier_master;
```

Expected output should show both `amadeus` and `tbo` suppliers.

### Step 4: Deploy Code to Render

```bash
git add .
git commit -m "feat: Complete TBO supplier integration with multi-supplier search"
git push origin main
```

Render will automatically deploy the new code.

### Step 5: Monitor Deployment Logs

Watch for these log messages in Render:

```
✅ [ADAPTER_MANAGER] Amadeus adapter initialized
✅ [ADAPTER_MANAGER] TBO adapter initialized
✅ [ADAPTER_MANAGER] Initialized 2 supplier adapters
```

If you see warnings about missing credentials:
```
⚠️ [ADAPTER_MANAGER] TBO credentials not found, adapter not initialized
```
→ Check that `TBO_AGENCY_ID` environment variable is set correctly.

---

## 🧪 Testing & Verification

### Test 1: Verify Supplier Initialization

**API Call:**
```bash
curl https://builder-faredown-pricing.onrender.com/api/admin/suppliers
```

**Expected Response:**
```json
{
  "success": true,
  "suppliers": [
    {
      "code": "amadeus",
      "name": "Amadeus",
      "enabled": true,
      "productTypes": ["flight"],
      "health": "healthy"
    },
    {
      "code": "tbo",
      "name": "TBO",
      "enabled": true,
      "productTypes": ["flight"],
      "health": "healthy"
    }
  ]
}
```

### Test 2: Flight Search Aggregation

**API Call:**
```bash
curl "https://builder-faredown-pricing.onrender.com/api/flights/search?origin=BOM&destination=DXB&departureDate=2025-04-01&adults=1&cabinClass=ECONOMY"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "supplier": "amadeus",
      "airline": "Emirates",
      "price": { ... },
      "markupApplied": { ... }
    },
    {
      "id": "...",
      "supplier": "tbo",
      "airline": "Air India",
      "price": { ... },
      "markupApplied": { ... }
    }
  ],
  "meta": {
    "totalResults": 45,
    "source": "multi_supplier",
    "suppliers": {
      "AMADEUS": {
        "success": true,
        "resultCount": 23,
        "responseTime": 1234
      },
      "TBO": {
        "success": true,
        "resultCount": 22,
        "responseTime": 987
      }
    }
  }
}
```

### Test 3: Supplier-Scoped Markup

**Create TBO-Only Markup:**
```bash
curl -X POST https://builder-faredown-pricing.onrender.com/api/markup/air \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TBO Special Markup",
    "airline": "6E",
    "markupType": "percentage",
    "markupValue": 12,
    "supplierScope": "tbo",
    "status": "active"
  }'
```

**Verify Filtering:**
```bash
# Should return TBO markup
curl "https://builder-faredown-pricing.onrender.com/api/markup/air?supplier=tbo"

# Should NOT return TBO markup (only 'all' scope markups)
curl "https://builder-faredown-pricing.onrender.com/api/markup/air?supplier=amadeus"
```

### Test 4: Supplier-Scoped Promo Code

**API Call:**
```bash
curl -X POST https://builder-faredown-pricing.onrender.com/api/promo/apply \
  -H "Content-Type: application/json" \
  -d '{
    "promoCode": "TBO100",
    "type": "flight",
    "supplier": "tbo",
    "fromCity": "Mumbai",
    "toCity": "Dubai"
  }'
```

**Expected Behavior:**
- ✅ Valid for TBO flights
- ❌ Invalid for Amadeus flights (if `supplier_scope = 'tbo'`)

### Test 5: Admin Panel Verification

1. **Supplier Master**
   - Navigate to Admin → Supplier Master
   - Verify both **Amadeus** and **TBO** are listed
   - Check health status, balance, and toggle switches

2. **Markup Management**
   - Navigate to Admin → Markup Management → Air
   - Create a new markup rule
   - Verify **Supplier Scope** dropdown shows: All, Amadeus, TBO

3. **Promo Code Management**
   - Navigate to Admin → Promo Codes
   - Create a new promo code
   - Verify **Supplier Scope** field is available

4. **Bookings Analytics**
   - Navigate to Admin → Bookings
   - Check that bookings show **Supplier** column (amadeus/tbo)
   - Verify supplier-specific PNR is displayed

---

## 📊 Database Queries for Verification

### Check Applied Markups by Supplier
```sql
SELECT 
  supplier,
  COUNT(*) as total_markups,
  SUM(applied_amount) as total_markup_revenue
FROM applied_markups
GROUP BY supplier
ORDER BY total_markup_revenue DESC;
```

### Check Bookings by Supplier
```sql
SELECT 
  supplier,
  COUNT(*) as total_bookings,
  SUM(total_amount) as total_revenue
FROM bookings
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY supplier;
```

### Check Supplier Performance
```sql
SELECT * FROM supplier_performance
WHERE search_date >= CURRENT_DATE - 7;
```

### Check Supplier Search Stats
```sql
SELECT * FROM supplier_search_stats
WHERE stat_date >= CURRENT_DATE - 7
ORDER BY stat_date DESC, supplier;
```

---

## 🐛 Troubleshooting

### Issue: TBO Adapter Not Initialized
**Symptoms:** Logs show "TBO credentials not found"

**Solutions:**
1. Verify `TBO_AGENCY_ID` is set in Render environment
2. Check other TBO credentials (CLIENT_ID, USERNAME, PASSWORD)
3. Restart the Render service after adding variables

### Issue: TBO Authentication Failing
**Symptoms:** "Authentication failed with TBO API"

**Solutions:**
1. Verify `TBO_CREDENTIAL_MODE=runtime`
2. Check credentials are correct
3. Try static mode if runtime fails:
   ```bash
   TBO_CREDENTIAL_MODE=static
   TBO_TOKEN_ID=<pre-generated-token>
   ```

### Issue: No TBO Results in Search
**Symptoms:** Only Amadeus results returned

**Solutions:**
1. Check supplier_master: `SELECT * FROM supplier_master WHERE code='tbo';`
2. Ensure `enabled = true` for TBO
3. Check TBO health: `GET /api/admin/suppliers/tbo/health`
4. Review logs for TBO errors

### Issue: Markup Not Applying to TBO Flights
**Symptoms:** TBO flights show no markup

**Solutions:**
1. Check markup rules have `supplier_scope = 'tbo'` or `'all'`
2. Verify `getMarkupData()` is called with correct supplier parameter
3. Check logs for markup application errors

---

## 📋 Post-Deployment Checklist

- [ ] Environment variables set in Render
- [ ] Database migration executed successfully
- [ ] Code deployed to production
- [ ] Supplier initialization logs verified
- [ ] Flight search returns results from both suppliers
- [ ] Supplier-scoped markups working
- [ ] Supplier-scoped promos working
- [ ] Admin panel shows TBO in all relevant sections
- [ ] Bookings table has supplier tags
- [ ] Analytics views show supplier breakdown
- [ ] No errors in production logs

---

## 🎉 Success Criteria

The TBO integration is successfully deployed when:

1. ✅ Flight search aggregates results from both **AMADEUS** and **TBO**
2. ✅ Each result is tagged with its supplier
3. ✅ Markups apply based on supplier scope
4. ✅ Promo codes validate against supplier scope
5. ✅ Admin panel displays TBO in:
   - Supplier Master
   - Markup Management (supplier dropdown)
   - Promo Code Management (supplier scope)
6. ✅ Bookings show supplier and supplier_pnr
7. ✅ Analytics dashboards show supplier breakdown
8. ✅ No degradation in search performance

---

## 📞 Support

- **TBO API Documentation**: https://apidoc.tektravels.com/
- **Database Issues**: Check `api/database/connection.js`
- **Adapter Issues**: Review `api/services/adapters/tboAdapter.js`
- **Integration Questions**: See `TBO_INTEGRATION_COMPLETE.md`

---

**Status**: Ready for deployment ✅  
**Last Updated**: 2025-03-15  
**Owner**: Zubin Aibara
