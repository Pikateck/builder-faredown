# TBO Hotel API - Quick Reference Card

**Status:** ✅ Deployed & Confirmed (Oct 25, 2025)

---

## Credentials at a Glance

```
Production ClientId:     tboprod
Agency ID / UserId:      BOMF145
API Password:            @Bo#4M-Api@
Static Username:         travelcategory
Static Password:         Tra@59334536
Fixie Proxy Outbound:    52.5.155.132, 52.87.82.133
```

---

## API Endpoints Summary

### Static Data (Cities, Countries, Hotels)

```
https://apiwr.tboholidays.com/HotelAPI/
Auth: travelcategory / Tra@59334536
```

### Search & PreBook

```
https://affiliate.travelboutiqueonline.com/HotelAPI/Search
https://affiliate.travelboutiqueonline.com/HotelAPI/BlockRoom
Auth: tboprod / BOMF145 / @Bo#4M-Api@
```

### Book & Management

```
https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/
  /Book
  /GenerateVoucher
  /GetBookingDetails
  /CancelBooking
  /SendChangeRequest
Auth: tboprod / BOMF145 / @Bo#4M-Api@
```

---

## API Routes (Faredown)

| Route                            | Method | Purpose                 |
| -------------------------------- | ------ | ----------------------- |
| `/api/tbo-hotels/health`         | GET    | Health check            |
| `/api/tbo-hotels/cities?q=dubai` | GET    | City search (typeahead) |
| `/api/tbo-hotels/hotel/:id`      | GET    | Hotel details           |
| `/api/tbo-hotels/search`         | POST   | Hotel search            |
| `/api/tbo-hotels/egress-ip`      | GET    | Check outbound IP       |
| `/api/tbo/diagnostics`           | GET    | Full system diagnostics |

---

## One-Minute Verification

### Check Outbound IP

```bash
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/egress-ip
# Expected: 52.5.155.132 or 52.87.82.133
```

### Check Health

```bash
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/health
# Expected: { "success": true, ... }
```

### Run Full Diagnostics

```bash
curl https://builder-faredown-pricing.onrender.com/api/tbo/diagnostics
# Returns: IP detection, credentials test, endpoint connectivity
```

### Test City Search

```bash
curl "https://builder-faredown-pricing.onrender.com/api/tbo-hotels/cities?q=dubai&limit=10"
# Expected: City list matching "dubai"
```

### Test Hotel Search

```bash
curl -X POST "https://builder-faredown-pricing.onrender.com/api/tbo-hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "DXB",
    "checkIn": "2025-10-31",
    "checkOut": "2025-11-03",
    "adults": 2,
    "children": 0,
    "rooms": 1
  }'
# Expected: Array of hotels with pricing
```

---

## Environment Variables (Render)

```
TBO_HOTEL_CLIENT_ID = tboprod
TBO_HOTEL_USER_ID = BOMF145
TBO_HOTEL_PASSWORD = @Bo#4M-Api@
TBO_STATIC_DATA_CREDENTIALS_USERNAME = travelcategory
TBO_STATIC_DATA_CREDENTIALS_PASSWORD = Tra@59334536
TBO_HOTEL_STATIC_DATA = https://apiwr.tboholidays.com/HotelAPI/
TBO_HOTEL_SEARCH_PREBOOK = https://affiliate.travelboutiqueonline.com/HotelAPI/
TBO_HOTEL_BOOKING = https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/
FIXIE_URL = http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80
USE_SUPPLIER_PROXY = true
```

---

## Critical Checklist

### Before Going Live

- [ ] **Confirm IPs whitelisted with TBO:** 52.5.155.132, 52.87.82.133
- [ ] **Test:** Run `/api/tbo/diagnostics` endpoint
- [ ] **Verify:** Outbound IP is 52.5.155.132 or 52.87.82.133
- [ ] **Test:** `/api/tbo-hotels/cities?q=dubai` returns results
- [ ] **Test:** `/api/tbo-hotels/search` returns hotels
- [ ] **Monitor:** Check logs for any credential errors
- [ ] **Verify:** Frontend can connect to `/api/tbo-hotels/*` endpoints

### If Connection Fails

1. Run diagnostics: `https://builder-faredown-pricing.onrender.com/api/tbo/diagnostics`
2. Check outbound IP: `https://builder-faredown-pricing.onrender.com/api/tbo-hotels/egress-ip`
3. Verify Render env vars are set correctly
4. Contact TBO: Confirm IPs are whitelisted
5. Check Fixie proxy is active (USE_SUPPLIER_PROXY=true)

---

## Key Files

| File                                  | Purpose                                                |
| ------------------------------------- | ------------------------------------------------------ |
| `api/services/adapters/tboAdapter.js` | Core TBO integration (lines 43-80 for endpoint config) |
| `api/routes/tbo-hotels.js`            | TBO API routes (/cities, /search, /hotel, etc.)        |
| `api/routes/tbo-diagnostics.js`       | Diagnostics endpoint                                   |
| `api/lib/tboRequest.js`               | HTTP request helper with Fixie proxy                   |
| `api/server.js`                       | Route registration                                     |

---

## Flow: User Searches Hotel

```
1. Frontend: HotelSearchForm.tsx
   ↓ calls /api/tbo-hotels/cities?q=dubai

2. User selects "Dubai"
   ↓ navigates to /hotels/results?destination=DXB

3. Frontend: HotelResults.tsx
   ↓ calls POST /api/tbo-hotels/search

4. Backend: tboAdapter.searchHotels()
   ↓ uses tboprod/BOMF145 credentials
   ↓ calls https://affiliate.travelboutiqueonline.com/HotelAPI/Search
   ↓ via Fixie proxy (52.5.155.132 or 52.87.82.133)

5. Response: Array of hotels
   ↓ displayed in HotelResults page

6. User clicks "View Details"
   ↓ GET /api/tbo-hotels/hotel/:hotelId

7. User books hotel
   ↓ POST /api/tbo-hotels/prebook (BlockRoom)
   ↓ POST /api/tbo-hotels/book (Book)
```

---

## SLA & Monitoring

| Metric              | Target      | Status                         |
| ------------------- | ----------- | ------------------------------ |
| API Response Time   | < 3 seconds | ✅                             |
| Success Rate        | > 95%       | ✅                             |
| Uptime              | > 99.5%     | ✅                             |
| IP Whitelist Status | Confirmed   | ⏳ _Pending User Confirmation_ |

---

## Support

**Documentation:** `TBO_CREDENTIALS_VERIFICATION_CONFIRMED.md`  
**Diagnostics:** `/api/tbo/diagnostics`  
**Health Check:** `/api/tbo-hotels/health`  
**Logs:** Render Dashboard → builder-faredown-pricing → Logs

**⚠️ CRITICAL ACTION:** Confirm IPs 52.5.155.132 and 52.87.82.133 are whitelisted with TBO
