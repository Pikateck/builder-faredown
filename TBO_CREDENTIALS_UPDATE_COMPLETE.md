# TBO Credentials & Endpoint Update - COMPLETE ✅

## 🔧 Changes Made

### 1. TBO Adapter Updated (`api/services/adapters/tboAdapter.js`)

**CRITICAL CHANGE**: TBO uses **TWO separate base URLs**

#### Old Configuration (INCORRECT):

```javascript
baseUrl: "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest";
```

#### New Configuration (CORRECT):

```javascript
searchUrl: "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest";
bookingUrl: "https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest";
```

**Reason**: TBO separates operations across two domains with REST endpoints:

- **Search Domain** (`tboapi.travelboutiqueonline.com/rest`): Search, FareQuote, FareRule, SSR, CalendarFare
- **Booking Domain** (`booking.travelboutiqueonline.com/rest`): Book, Ticket, GetBookingDetails, SendChangeRequest
- **REST path required**: All endpoints use `/rest` as per official TBO documentation

### 2. Dual HTTP Clients Created

```javascript
this.searchClient; // For search/pricing operations
this.bookingClient; // For booking operations
```

**Updated Methods to Use Booking Client:**

- `bookFlight()` → `/Book`
- `ticketBooking()` → `/Ticket`
- `getBookingDetails()` → `/GetBookingDetails`
- `sendChangeRequest()` → `/SendChangeRequest`

**Methods Using Search Client:**

- `searchFlights()` → `/Search`
- `getFareQuote()` → `/FareQuote`
- `getFareRules()` → `/FareRule`
- `getSSR()` → `/SSR`
- `getCalendarFare()` → `/CalendarFare`

### 3. Credentials Added to Environment

**Your TBO Credentials (from Zubin):**

```bash
User ID: BOMF145
Password: travel/live-18@@
```

**Environment Variables Set:**

```bash
TBO_SEARCH_URL=https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest
TBO_BOOKING_URL=https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest
TBO_AGENCY_ID=BOMF145
TBO_CLIENT_ID=BOMF145
TBO_USERNAME=BOMF145
TBO_PASSWORD=travel/live-18@@
TBO_CREDENTIAL_MODE=runtime
FLIGHTS_SUPPLIERS=AMADEUS,TBO
```

---

## 🚀 Deployment Instructions for Render

### Step 1: Add Environment Variables to Render

Go to Render Dashboard → Your Service → Environment

**Add these exact values:**

| Variable              | Value                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| `TBO_SEARCH_URL`      | `https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest`  |
| `TBO_BOOKING_URL`     | `https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest` |
| `TBO_AGENCY_ID`       | `BOMF145`                                                                 |
| `TBO_CLIENT_ID`       | `BOMF145`                                                                 |
| `TBO_USERNAME`        | `BOMF145`                                                                 |
| `TBO_PASSWORD`        | `travel/live-18@@`                                                        |
| `TBO_CREDENTIAL_MODE` | `runtime`                                                                 |
| `FLIGHTS_SUPPLIERS`   | `AMADEUS,TBO`                                                             |

### Step 2: Run Database Migration

**Option A: Using psql**

```bash
psql $DATABASE_URL -f api/database/migrations/20250315_add_tbo_supplier_integration.sql
```

**Option B: Using Render Shell**

1. Open Render Shell for your service
2. Run:

```bash
psql $DATABASE_URL -f api/database/migrations/20250315_add_tbo_supplier_integration.sql
```

### Step 3: Deploy Code

```bash
git add .
git commit -m "feat: Update TBO integration with correct dual-endpoint configuration and credentials"
git push origin main
```

Render will auto-deploy.

### Step 4: Verify TBO Initialization

**Check Render Logs for:**

```
✅ [ADAPTER_MANAGER] TBO adapter initialized
✅ [ADAPTER_MANAGER] Amadeus adapter initialized
✅ [ADAPTER_MANAGER] Initialized 2 supplier adapters
```

**If you see this warning:**

```
⚠️ TBO credentials not found, adapter not initialized
```

→ Double-check environment variables are saved in Render

---

## 🧪 Test TBO Integration

### Test 1: TBO Authentication

**Expected Behavior:**

- TBO adapter initializes on startup
- Token is fetched from `/Authenticate` endpoint
- Token cached in `tbo_token_cache` table

**Check Logs for:**

```
[TBO] Authenticating with TBO (runtime mode)
[TBO] TBO authentication successful
```

### Test 2: Flight Search with TBO

```bash
curl "https://builder-faredown-pricing.onrender.com/api/flights/search?origin=BOM&destination=DXB&departureDate=2025-04-15&adults=1"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "supplier": "tbo",
      "airline": "...",
      "price": { ... }
    },
    {
      "supplier": "amadeus",
      "airline": "...",
      "price": { ... }
    }
  ],
  "meta": {
    "suppliers": {
      "TBO": {
        "success": true,
        "resultCount": 25,
        "responseTime": 1234
      },
      "AMADEUS": {
        "success": true,
        "resultCount": 22,
        "responseTime": 987
      }
    }
  }
}
```

### Test 3: Verify Dual-Endpoint Usage

**Monitor logs during a complete booking flow:**

1. **Search** (should use `tboapi.travelboutiqueonline.com`):

   ```
   POST https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/Search
   ```

2. **Book** (should use `booking.travelboutiqueonline.com`):

   ```
   POST https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc/Book
   ```

3. **Ticket** (should use `booking.travelboutiqueonline.com`):
   ```
   POST https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc/Ticket
   ```

---

## 🔍 Key Differences from Previous Implementation

| Aspect               | Old (WRONG)         | New (CORRECT)                      |
| -------------------- | ------------------- | ---------------------------------- |
| **Base URL**         | Single URL          | Dual URLs with `/rest`             |
| **Search Endpoint**  | Single domain       | `tboapi.../rest/Search`            |
| **Booking Endpoint** | Single domain       | `booking.../rest/Book`             |
| **Client Structure** | Single `httpClient` | `searchClient` + `bookingClient`   |
| **Credentials**      | Placeholder values  | Actual: BOMF145 / travel/live-18@@ |
| **REST Path**        | Missing             | Required `/rest` per docs          |

---

## ⚠️ Critical Notes

1. **`/rest` IS REQUIRED**: TBO REST API requires `/rest` in the path (per official documentation)
2. **Two domains**: Search and Booking use different base URLs
3. **Same credentials**: Both endpoints use the same User ID and Password
4. **Runtime authentication**: Token is fetched dynamically using `/Authenticate`
5. **Token caching**: Tokens stored in `tbo_token_cache` table for reuse
6. **Official docs**: https://apidoc.tektravels.com/flight/NewReleases2025.aspx

---

## 📊 Expected Database State After Migration

```sql
-- 1. TBO token cache table exists
SELECT COUNT(*) FROM tbo_token_cache;

-- 2. Supplier master has TBO entry
SELECT * FROM supplier_master WHERE code = 'tbo';
-- Expected: code='tbo', name='TBO', enabled=true

-- 3. Markup rules support supplier scope
SELECT column_name FROM information_schema.columns
WHERE table_name = 'markup_rules' AND column_name = 'supplier_scope';
-- Expected: supplier_scope

-- 4. Bookings support supplier tagging
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name IN ('supplier', 'supplier_pnr');
-- Expected: supplier, supplier_pnr
```

---

## 🎯 Success Checklist

- [ ] Environment variables added to Render
- [ ] Database migration executed successfully
- [ ] Code deployed to production
- [ ] Logs show TBO adapter initialized
- [ ] Flight search returns TBO results
- [ ] Search uses `tboapi.travelboutiqueonline.com`
- [ ] Booking uses `booking.travelboutiqueonline.com`
- [ ] No authentication errors in logs
- [ ] Admin panel shows TBO in Supplier Master

---

## 📞 Troubleshooting

### Issue: "TBO credentials not found"

**Solution**: Verify `TBO_AGENCY_ID` is set in Render environment

### Issue: "Authentication failed with TBO API"

**Solutions**:

1. Verify password is exactly: `travel/live-18@@`
2. Check username is: `BOMF145`
3. Ensure `TBO_CREDENTIAL_MODE=runtime`

### Issue: "404 Not Found" on TBO endpoints

**Solution**: Verify URLs INCLUDE `/rest` suffix (per official TBO documentation):

- ✅ Correct: `https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest/Search`
- ❌ Wrong: `https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/Search`

### Issue: Booking fails but search works

**Solution**: Verify `TBO_BOOKING_URL` points to `booking.travelboutiqueonline.com` (not `tboapi`)

---

**Status**: ✅ **READY FOR DEPLOYMENT**  
**Updated**: March 15, 2025  
**Credentials Provided By**: Zubin Aibara  
**Implementation**: Complete with correct dual-endpoint architecture
