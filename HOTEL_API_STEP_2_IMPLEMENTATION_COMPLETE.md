# STEP 2 Implementation: Canonical Hotel API Endpoints

**Status:** ✅ COMPLETE AND READY FOR TESTING  
**Date:** April 2025  
**Implementation:** 4 canonical hotel endpoints with TBO-first, supplier-agnostic design

---

## Executive Summary

This document describes the complete implementation of **STEP 2** - the 4 canonical hotel API endpoints as specified by Zubin. The implementation follows all requirements:

1. ✅ **4 canonical endpoints** implemented and registered
2. ✅ **TBO-first design** with supplier-agnostic schema
3. ✅ **Rate caching** with 15-minute TTL (configurable)
4. ✅ **Graceful error handling** - return content even if TBO fails
5. ✅ **Database schema** optimized with indexes
6. ✅ **Postman collection** for testing
7. ✅ **OpenAPI 3.0 specification** for documentation
8. ✅ **Migration file** for schema enhancements

---

## The 4 Canonical Endpoints

### Endpoint 1: GET /api/hotels/autocomplete

**Purpose:** City/destination autocomplete for search form  
**Supplier:** TBO  
**Cache:** Search results cached via TBO adapter  
**Error Handling:** Returns empty suggestions on error (non-blocking)

**Request:**

```bash
GET /api/hotels/autocomplete?q=Dubai&limit=15&country=AE
```

**Response (200):**

```json
{
  "success": true,
  "suggestions": [
    {
      "city_code": "DXB",
      "city_name": "Dubai",
      "country_code": "AE",
      "country_name": "United Arab Emirates",
      "type": "CITY",
      "lat": 25.2048,
      "lng": 55.2708
    }
  ]
}
```

---

### Endpoint 2: POST /api/hotels/search

**Purpose:** Search hotels by destination, dates, and guests  
**Supplier:** TBO  
**Returns:** Hotel list with cheapest room rate (if available)  
**Pagination:** Supported via limit/offset  
**Error Handling:** Hotels returned even if TBO fails; pricing_available flag indicates status

**Request:**

```bash
POST /api/hotels/search
Content-Type: application/json

{
  "city_code": "DXB",
  "country_code": "AE",
  "check_in": "2025-10-31",
  "check_out": "2025-11-03",
  "adults": 2,
  "children": 0,
  "rooms": 1,
  "guest_nationality": "IN",
  "preferred_currency": "INR",
  "limit": 50,
  "offset": 0
}
```

**Response (200 - with pricing):**

```json
{
  "success": true,
  "hotels": [
    {
      "property_id": "uuid-1",
      "supplier_code": "TBO",
      "supplier_hotel_id": "123456",
      "hotel_name": "Burj Al Arab",
      "city": "Dubai",
      "star_rating": 5,
      "review_score": 9.2,
      "review_count": 5432,
      "images": ["https://example.com/image.jpg"],
      "amenities": ["WiFi", "Pool", "Spa"],
      "pricing": {
        "currency": "INR",
        "base_price": 45000,
        "taxes": 5400,
        "total_price": 50400,
        "per_night": 16800,
        "refundable": true,
        "free_cancellation": true
      },
      "pricing_available": true,
      "room_count": 3,
      "search_params": {
        "check_in": "2025-10-31",
        "check_out": "2025-11-03",
        "nights": 3,
        "adults": 2,
        "children": 0,
        "rooms": 1
      }
    }
  ],
  "total": 1,
  "pricing_available": true,
  "message": "Success"
}
```

**Response (200 - pricing unavailable):**

```json
{
  "success": true,
  "hotels": [
    {
      "property_id": "uuid-1",
      "hotel_name": "Burj Al Arab",
      "pricing": null,
      "pricing_available": false,
      "room_count": 0
    }
  ],
  "total": 1,
  "pricing_available": false,
  "message": "Live pricing temporarily unavailable"
}
```

---

### Endpoint 3: GET /api/hotels/:propertyId

**Purpose:** Detailed hotel information with images and amenities  
**Supplier:** TBO  
**Image Gallery:** Returns up to 20 images from hotel_images table  
**Fallback:** Uses thumbnail_url if no images in gallery  
**Error Handling:** 404 if hotel not found; images are optional

**Request:**

```bash
GET /api/hotels/uuid-1?include_images=true&include_reviews=false
```

**Response (200):**

```json
{
  "success": true,
  "hotel": {
    "property_id": "uuid-1",
    "supplier_code": "TBO",
    "supplier_hotel_id": "123456",
    "hotel_name": "Burj Al Arab",
    "address": "Jumeirah Beach Road",
    "city": "Dubai",
    "country": "United Arab Emirates",
    "postal_code": "00000",
    "star_rating": 5,
    "review_score": 9.2,
    "review_count": 5432,
    "images": [
      { "url": "https://example.com/image1.jpg", "order": 0 },
      { "url": "https://example.com/image2.jpg", "order": 1 }
    ],
    "amenities": ["WiFi", "Pool", "Spa", "Restaurant", "Beach Access"],
    "location": {
      "lat": 25.1412,
      "lng": 55.1858,
      "district": "Jumeirah",
      "zone": "Beach"
    },
    "checkin_from": "15:00",
    "checkout_until": "11:00",
    "chain_code": "BJ",
    "brand_code": "BJAL",
    "giata_id": "123456"
  }
}
```

---

### Endpoint 4: POST /api/hotels/:propertyId/rates

**Purpose:** Get available room types and rates for specific hotel and dates  
**Supplier:** TBO  
**Cache:** 15-minute TTL (stores to room_offer_unified table)  
**Refresh:** Pass `"refresh": true` to force re-fetch from TBO  
**Error Handling:** Empty rates array with pricing_available=false if TBO fails and no cache

**Request (use cache):**

```bash
POST /api/hotels/uuid-1/rates
Content-Type: application/json

{
  "check_in": "2025-10-31",
  "check_out": "2025-11-03",
  "adults": 2,
  "children": 0,
  "rooms": 1,
  "preferred_currency": "INR",
  "refresh": false
}
```

**Request (force refresh):**

```bash
POST /api/hotels/uuid-1/rates
Content-Type: application/json

{
  "check_in": "2025-10-31",
  "check_out": "2025-11-03",
  "refresh": true
}
```

**Response (200):**

```json
{
  "success": true,
  "property_id": "uuid-1",
  "hotel_name": "Burj Al Arab",
  "check_in": "2025-10-31",
  "check_out": "2025-11-03",
  "rates": [
    {
      "offer_id": "offer-uuid-1",
      "room_name": "Deluxe Room",
      "board_basis": "RO",
      "bed_type": "Double",
      "refundable": true,
      "free_cancellation": true,
      "occupancy": {
        "adults": 2,
        "children": 0
      },
      "pricing": {
        "currency": "INR",
        "base": 45000,
        "taxes": 5400,
        "total": 50400,
        "per_night": 16800
      },
      "rate_key": "rate-key-123",
      "inclusions": ["WiFi", "Breakfast"],
      "cancellable_until": "2025-10-30"
    },
    {
      "offer_id": "offer-uuid-2",
      "room_name": "Suite",
      "board_basis": "BB",
      "bed_type": "King",
      "refundable": true,
      "free_cancellation": false,
      "occupancy": {
        "adults": 2,
        "children": 0
      },
      "pricing": {
        "currency": "INR",
        "base": 65000,
        "taxes": 7800,
        "total": 72800,
        "per_night": 24267
      },
      "rate_key": "rate-key-456",
      "inclusions": ["WiFi", "Breakfast", "Minibar"],
      "cancellable_until": "2025-10-29"
    }
  ],
  "total_rooms": 2,
  "pricing_available": true,
  "from_cache": true,
  "message": "Success"
}
```

---

## Implementation Details

### File Structure

```
api/
├── routes/
│   └── hotels-canonical.js          ← NEW: 4 canonical endpoints (658 lines)
├── database/
│   └── migrations/
│       └── 20250401_hotel_canonical_indexes.sql  ← NEW: Schema enhancements
├── postman/
│   └── Canonical-Hotel-API.postman_collection.json  ← NEW: Testing collection
└── openapi/
    └── hotels-canonical-openapi.yaml  ← NEW: OpenAPI 3.0 spec

api/server.js                         ← MODIFIED: Route registration
```

### Key Design Decisions

#### 1. TBO-First Implementation

- All endpoints filter `supplier_code = 'TBO'` in STEP 2
- Code is supplier-agnostic; ready for multi-supplier expansion
- Future: Add Hotelbeds/RateHawk by adding supplier filter logic

#### 2. Graceful Error Handling

- **Autocomplete:** Returns empty suggestions on TBO error (non-blocking)
- **Search:** Returns hotel content from DB even if TBO fails; sets `pricing_available=false`
- **Details:** Returns hotel metadata; images optional
- **Rates:** Returns empty array with message if TBO fails and no cache
- **Policy:** Only return 5xx for core DB failures; never for TBO timeouts

#### 3. Rate Caching Strategy

- **TTL:** 15 minutes (configurable via `ROOM_OFFER_TTL_MINUTES` env var)
- **Storage:** `room_offer_unified` table with `expires_at > NOW()` filter
- **Lookup:** Composite index on (property_id, supplier_code, search_checkin, search_checkout)
- **Refresh:** Client can pass `refresh=true` to bypass cache
- **Cleanup:** Relies on query-time filtering; optional background cleanup job later

#### 4. Supplier-Agnostic Schema

- All tables use `supplier_code` column
- Queries filter by supplier for STEP 2, but can be extended
- Foreign keys avoid breaking on multi-supplier
- Example future query: `WHERE supplier_code IN ('TBO', 'HOTELBEDS')`

#### 5. Image Handling

- **Primary:** `hotel_images` table (multiple images, ordered)
- **Fallback:** `hotel_master.thumbnail_url` (single image)
- **Gallery:** Up to 20 images returned for details endpoint
- **Search:** Only cheapest rate image (if available)

#### 6. Amenities Handling

- **Source:** `hotel_master.amenities_json` (canonical)
- **Format:** Array of strings
- **Future:** Can normalize to separate `hotel_amenities` table if needed

---

## Database Schema

### New Table: hotel_images (if missing)

```sql
CREATE TABLE hotel_images (
  image_id UUID PRIMARY KEY,
  property_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotel_images_property ON hotel_images (property_id);
```

### Enhanced Indexes

Run migration: `api/database/migrations/20250401_hotel_canonical_indexes.sql`

Creates:

- `idx_room_offer_rates_query` - Optimizes /rates endpoint queries
- `idx_hotel_unified_city_supplier` - Optimizes search queries
- `idx_hotel_images_property_order` - Optimizes gallery lookups

### Column Additions to room_offer_unified

- `ttl_minutes INT DEFAULT 15` - Track configured TTL
- `refreshed_at TIMESTAMPTZ` - Track when rate was last refreshed

---

## TBO Integration

### Adapter Methods Used

- `getTboAdapter().searchCities(q, limit, country)` - Autocomplete
- `getTboAdapter().searchHotels(params)` - Hotel search
- `getTboAdapter().getHotelRoom(params)` - Room details and rates

### Error Handling in Adapter

- Timeouts: 30-second default (configurable)
- 401/403: Logs auth issue; returns empty array to trigger fallback
- 500+: Logs error; returns empty array
- Parse errors: Logs and returns empty array

### TBO Credentials (from env)

```
TBO_HOTEL_CLIENT_ID="tboprod"
TBO_HOTEL_USER_ID="BOMF145"
TBO_HOTEL_PASSWORD="@Bo#4M-Api@"
TBO_HOTEL_BASE_URL_AUTHENTICATION="https://api.travelboutiqueonline.com/..."
TBO_HOTEL_STATIC_DATA="https://apiwr.tboholidays.com/HotelAPI/"
TBO_HOTEL_SEARCH_PREBOOK="https://affiliate.travelboutiqueonline.com/HotelAPI/"
TBO_HOTEL_BOOKING="https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/..."
```

---

## Testing

### Postman Collection

File: `api/postman/Canonical-Hotel-API.postman_collection.json`

Includes test requests for all 4 endpoints:

1. Autocomplete: `GET /api/hotels/autocomplete?q=Dubai`
2. Search: `POST /api/hotels/search` with full payload
3. Details: `GET /api/hotels/:propertyId`
4. Rates: `POST /api/hotels/:propertyId/rates` with cache/refresh options

### OpenAPI Specification

File: `api/openapi/hotels-canonical-openapi.yaml`

Comprehensive OpenAPI 3.0 spec with:

- Endpoint descriptions
- Full request/response schemas
- Example values
- Error responses
- Query parameters documented

### Manual Testing Workflow

1. **Test Autocomplete:**

   ```bash
   curl "https://builder-faredown-pricing.onrender.com/api/hotels/autocomplete?q=Dubai&limit=15"
   ```

2. **Test Search:**

   ```bash
   curl -X POST "https://builder-faredown-pricing.onrender.com/api/hotels/search" \
     -H "Content-Type: application/json" \
     -d '{
       "city_code": "DXB",
       "check_in": "2025-10-31",
       "check_out": "2025-11-03",
       "adults": 2,
       "children": 0,
       "rooms": 1
     }'
   ```

3. **Test Details:**

   ```bash
   curl "https://builder-faredown-pricing.onrender.com/api/hotels/{{property_id}}"
   ```

4. **Test Rates:**
   ```bash
   curl -X POST "https://builder-faredown-pricing.onrender.com/api/hotels/{{property_id}}/rates" \
     -H "Content-Type: application/json" \
     -d '{
       "check_in": "2025-10-31",
       "check_out": "2025-11-03",
       "adults": 2,
       "refresh": false
     }'
   ```

---

## Configuration

### Environment Variables

```bash
# STEP 2: TBO only (will add more suppliers later)
HOTELS_SUPPLIERS="TBO"

# Rate caching TTL (minutes)
ROOM_OFFER_TTL_MINUTES=15

# TBO credentials (already set)
TBO_HOTEL_CLIENT_ID="tboprod"
TBO_HOTEL_USER_ID="BOMF145"
TBO_HOTEL_PASSWORD="@Bo#4M-Api@"

# Optional: Proxy settings
USE_SUPPLIER_PROXY=true
FIXIE_URL="..."
```

---

## Migration Path to Multi-Supplier

The design supports adding additional suppliers without breaking changes:

### Step 1: Add Hotelbeds (future)

```typescript
// In hotels-canonical.js, line 30 change:
const USE_SUPPLIER_FILTER = "TBO"; // Current
// To:
const USE_SUPPLIER_FILTER = null; // Null = all suppliers

// Then update queries to include supplier-specific logic
```

### Step 2: Merge Duplicate Hotels

```typescript
// Implement hotel deduplication across suppliers
// Example: If TBO and Hotelbeds return same hotel, merge and show best rate
```

### Step 3: Supplier Preference Settings

```typescript
// Allow users to prefer specific suppliers
// Example: "Show me TBO hotels first, then Hotelbeds"
```

---

## Deprecated Endpoints

The following existing endpoints are now **DEPRECATED**:

- `/api/hotels-metadata` (moved to `/api/hotels`)
- `/api/tbo-hotels/search` (now POST `/api/hotels/search`)
- Old `/api/hotels-live`, `/api/hotels-legacy` (use `/api/hotels`)

These can be marked as deprecated in code comments but left functional for backwards compatibility if needed.

---

## Known Limitations (STEP 2)

1. **Single Supplier:** Only TBO in STEP 2 (Hotelbeds/RateHawk added in future phases)
2. **No Reviews:** `include_reviews` parameter reserved for future use
3. **No Pre-booking:** Pre-booking endpoint not yet implemented (STEP 3)
4. **No Booking:** Booking endpoint not yet implemented (STEP 3)
5. **Cache Cleanup:** Manual/background cleanup of expired rates (optional)
6. **Images:** Gallery depends on `hotel_images` table population

---

## Future Enhancements

### Phase 3 & Beyond

- [ ] Pre-booking validation (POST /api/hotels/:propertyId/pre-book)
- [ ] Booking confirmation (POST /api/hotels/:propertyId/book)
- [ ] Multi-supplier deduplication
- [ ] Guest reviews integration
- [ ] Wifi/amenity filtering
- [ ] Room variations (twin, suite, etc.) detailed selection
- [ ] Loyalty integration (points earning/redemption)
- [ ] Analytics and ranking by popularity

---

## Files Summary

| File                                                           | Purpose               | Status             |
| -------------------------------------------------------------- | --------------------- | ------------------ |
| `api/routes/hotels-canonical.js`                               | 4 canonical endpoints | ✅ New (658 lines) |
| `api/database/migrations/20250401_hotel_canonical_indexes.sql` | Schema enhancements   | ✅ New             |
| `api/postman/Canonical-Hotel-API.postman_collection.json`      | API testing           | ✅ New             |
| `api/openapi/hotels-canonical-openapi.yaml`                    | OpenAPI specification | ✅ New             |
| `api/server.js`                                                | Route registration    | ✅ Modified        |
| `HOTEL_API_STEP_2_IMPLEMENTATION_COMPLETE.md`                  | This document         | ✅ New             |

---

## Schema Gaps & Fixes

During implementation, the following potential gaps were addressed:

### Gap 1: Missing hotel_images table

**Status:** Added to migration file  
**Impact:** Image gallery returns empty if table not populated  
**Fallback:** Falls back to thumbnail_url

### Gap 2: Missing TTL tracking columns

**Status:** Added to migration: ttl_minutes, refreshed_at  
**Impact:** Optional; current implementation uses expires_at for filtering

### Gap 3: Amenities format

**Status:** Assumes JSONB array in hotel_master.amenities_json  
**Impact:** If column missing, amenities returned as empty array  
**Plan:** Normalize to separate table in future phase

### Gap 4: Hotel master data population

**Status:** Assumes hotel_unified table has TBO data  
**Impact:** Search returns empty hotels if DB not seeded  
**Plan:** Implement data import job (STEP 3)

---

## Deployment Checklist

- [ ] Run migration: `psql $DATABASE_URL < api/database/migrations/20250401_hotel_canonical_indexes.sql`
- [ ] Verify TBO credentials in Render env vars
- [ ] Test all 4 endpoints in staging
- [ ] Check error handling (TBO timeout scenarios)
- [ ] Load test: concurrent search requests
- [ ] Monitor Render logs for timeout/parse errors
- [ ] Verify cache TTL working (15-minute expiry)
- [ ] Document in API docs/wiki

---

## Support & Questions

For questions about STEP 2 implementation, refer to:

1. **Code:** `api/routes/hotels-canonical.js` (well-commented, 658 lines)
2. **API Docs:** `api/openapi/hotels-canonical-openapi.yaml` (interactive with Swagger UI)
3. **Tests:** `api/postman/Canonical-Hotel-API.postman_collection.json` (runnable examples)
4. **Schema:** `api/database/migrations/20250401_hotel_canonical_indexes.sql` (see table structures)

---

**Implementation by:** Assistant  
**Date:** April 2025  
**Reviewed by:** Zubin Aibara (to be confirmed)  
**Status:** Ready for Testing & Deployment
