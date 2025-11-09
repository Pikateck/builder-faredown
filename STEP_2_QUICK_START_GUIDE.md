# STEP 2 Quick Start Guide

## What Was Built

✅ **4 Canonical Hotel Endpoints** for STEP 2 implementation:

1. `GET /api/hotels/autocomplete` - City search
2. `POST /api/hotels/search` - Hotel search by dates/guests
3. `GET /api/hotels/:propertyId` - Hotel details
4. `POST /api/hotels/:propertyId/rates` - Room rates with caching

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `api/routes/hotels-canonical.js` | Created | Main implementation (658 lines) |
| `api/server.js` | Modified | Register `/api/hotels` route |
| `api/database/migrations/20250401_hotel_canonical_indexes.sql` | Created | DB indexes + hotel_images table |
| `api/postman/Canonical-Hotel-API.postman_collection.json` | Created | Testing collection |
| `api/openapi/hotels-canonical-openapi.yaml` | Created | OpenAPI 3.0 spec |
| `HOTEL_API_STEP_2_IMPLEMENTATION_COMPLETE.md` | Created | Full documentation |

## Pre-Deployment Checklist

- [ ] Verify TBO credentials in Render environment:
  - `TBO_HOTEL_CLIENT_ID=tboprod`
  - `TBO_HOTEL_USER_ID=BOMF145`
  - `TBO_HOTEL_PASSWORD=@Bo#4M-Api@`

- [ ] Confirm database connection works:
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM hotel_unified;"
  ```

- [ ] Verify hotel data exists (at least a few TBO hotels):
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM hotel_unified WHERE supplier_code='TBO';"
  ```

## Deployment Steps

### 1. Apply Database Migration

```bash
# On Render or locally:
psql $DATABASE_URL -f api/database/migrations/20250401_hotel_canonical_indexes.sql
```

### 2. Verify Syntax (Local)

```bash
# From project root:
node -c api/routes/hotels-canonical.js
# If no errors, syntax is OK
```

### 3. Push to Git

```bash
git add api/routes/hotels-canonical.js \
         api/server.js \
         api/database/migrations/20250401_hotel_canonical_indexes.sql \
         api/postman/Canonical-Hotel-API.postman_collection.json \
         api/openapi/hotels-canonical-openapi.yaml \
         HOTEL_API_STEP_2_IMPLEMENTATION_COMPLETE.md \
         STEP_2_QUICK_START_GUIDE.md

git commit -m "feat: STEP 2 Canonical Hotel API Endpoints - 4 endpoints with TBO-first design, 15-min cache, graceful fallback"

git push origin main
```

### 4. Render Auto-Deploy

Render auto-deploys on push to main. Monitor:

```bash
# Watch Render logs:
# https://dashboard.render.com/d/builder-faredown-pricing
```

## Testing (After Deployment)

### Quick Test - Autocomplete

```bash
curl "https://builder-faredown-pricing.onrender.com/api/hotels/autocomplete?q=Dubai&limit=5"

# Expected response: 200 OK with 5 city suggestions
```

### Quick Test - Search

```bash
curl -X POST "https://builder-faredown-pricing.onrender.com/api/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "city_code": "DXB",
    "check_in": "2025-11-01",
    "check_out": "2025-11-05",
    "adults": 2,
    "children": 0,
    "rooms": 1
  }'

# Expected response: 200 OK with hotel list
# - If TBO works: pricing_available=true with prices
# - If TBO fails: pricing_available=false but hotels still returned
```

### Quick Test - Details

```bash
# From search results above, get a property_id, then:
curl "https://builder-faredown-pricing.onrender.com/api/hotels/{property_id}?include_images=true"

# Expected response: 200 OK with hotel details, images array
```

### Quick Test - Rates

```bash
curl -X POST "https://builder-faredown-pricing.onrender.com/api/hotels/{property_id}/rates" \
  -H "Content-Type: application/json" \
  -d '{
    "check_in": "2025-11-01",
    "check_out": "2025-11-05",
    "adults": 2,
    "children": 0,
    "rooms": 1,
    "refresh": false
  }'

# Expected response: 200 OK with rates array
# - If cached: from_cache=true
# - If fresh: from_cache=false
# - If unavailable: pricing_available=false, rates=[]
```

### Full Test Suite - Postman

```bash
# Import collection:
# api/postman/Canonical-Hotel-API.postman_collection.json

# Set variables:
# - base_url = https://builder-faredown-pricing.onrender.com
# - property_id = (from search results)

# Run all 4 requests in order
```

## Monitoring

### Log Watch

```bash
# Check server logs for errors:
# https://dashboard.render.com/d/builder-faredown-pricing > Logs tab

# Look for:
# - TBO search errors (⚠️ TBO search failed)
# - Database errors (❌ Hotel search error)
# - Cache hits (✅ Found N cached rates)
```

### Performance Checks

- **Autocomplete:** Should return < 100ms (TBO cached)
- **Search:** Should return < 2s with TBO (or < 100ms if DB only)
- **Details:** Should return < 100ms (DB lookup)
- **Rates:** Should return < 100ms (cache hit) or 2-3s (TBO call)

### Error Scenarios

| Error | Status | Expected Behavior |
|-------|--------|-------------------|
| TBO timeout | 200 | Hotel list returned; pricing_available=false |
| Invalid city | 200 | Empty suggestions/hotels with message |
| Invalid dates | 400 | Clear error message |
| Missing hotel | 404 | Clear error message |
| DB error | 500 | Error response |

## Configuration

To adjust TTL from default 15 minutes:

```bash
# Set in Render environment:
ROOM_OFFER_TTL_MINUTES=30  # or any value
```

## Rollback Plan

If issues occur:

1. **Quick Rollback:** Remove the route from `api/server.js`
   - Comment out: `app.use("/api/hotels", hotelCanonicalRoutes);`
   - Uncomment: `app.use("/api/hotels", require("./routes/hotels-metadata"));`
   - Push to git (Render auto-redeploys)

2. **Full Rollback:** Git revert
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

## Next Steps (STEP 3 & Beyond)

Once STEP 2 is validated:

- [ ] Pre-booking endpoint: `POST /api/hotels/:propertyId/pre-book`
- [ ] Booking confirmation: `POST /api/hotels/:propertyId/book`
- [ ] Multi-supplier expansion (Hotelbeds, RateHawk)
- [ ] Data import job (populate hotel_unified table)
- [ ] Guest reviews integration
- [ ] Advanced filtering (amenities, WiFi, etc.)

## Documentation

Full documentation available:

- **Implementation Details:** `HOTEL_API_STEP_2_IMPLEMENTATION_COMPLETE.md`
- **API Reference:** `api/openapi/hotels-canonical-openapi.yaml` (OpenAPI 3.0)
- **Code Reference:** `api/routes/hotels-canonical.js` (heavily commented, 658 lines)
- **Testing:** `api/postman/Canonical-Hotel-API.postman_collection.json`

## Support

For questions:

1. Review code comments in `api/routes/hotels-canonical.js`
2. Check OpenAPI spec: `api/openapi/hotels-canonical-openapi.yaml`
3. Test with Postman collection
4. Check Render logs for error details

---

**Status:** Ready for Deployment  
**Tested:** Locally (syntax validation)  
**Next Action:** Push to git and monitor Render deployment
