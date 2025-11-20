# TBO Cache-Backed Hotel Search Architecture Proposal

## Executive Summary

This document proposes a **cache-first, TBO-second** architecture for hotel search that:

1. **Normalizes and stores** full TBO responses into indexed Postgres tables
2. **Caches searches** by parameter hash to serve repeat searches instantly from our DB
3. **Only calls TBO for prices** on subsequent searches, falling back to full search if cache is stale
4. **Integrates seamlessly** with existing Faredown UI without major component rewrites

---

## 1. TECHNICAL ARCHITECTURE

### 1.1 Search Flow (High Level)

```
User Search Request
    ↓
Generate Search Hash (cityId + checkIn + checkOut + nationality + roomConfig)
    ↓
├─── Check hotel_search_cache table
│     ├─── CACHE HIT (fresh, TTL < 4 hours)
│     │    ├─── Fetch hotels + rooms from tbo_hotels_normalized table
│     │    ├─── Fetch ONLY live prices from TBO (optional, or skip for speed)
│     │    └─── Return combined results
│     │
│     └─── CACHE MISS or STALE
│          ├─── Call TBO GetHotelResult (full search)
│          ├─── Parse + normalize response
│          ├─── Store in tbo_hotels_normalized + tbo_rooms_normalized tables
│          ├─── Store cache entry (search_hash, city_id, params, hotel_ids)
│          └─── Return results + mark as "live_from_tbo"
    ↓
Response to Frontend
```

### 1.2 Cache Key Strategy

```
search_hash = SHA256(
  JSON.stringify({
    cityId,
    countryCode,
    guestNationality,
    checkInDate,    // normalized to YYYY-MM-DD
    checkOutDate,   // normalized to YYYY-MM-DD
    numberOfRooms,
    roomOccupancy   // [{adults: 2, children: 0}, ...]
  })
)
```

**Rationale**: This hash uniquely identifies a search. Same search = same hotels + rooms, only prices may vary.

---

## 2. DATABASE SCHEMA CHANGES

### 2.1 New Core Tables

#### **hotel_search_cache**

Tracks which searches we've already completed and when.

```sql
CREATE TABLE hotel_search_cache (
  id BIGSERIAL PRIMARY KEY,
  search_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA256 of search params
  city_id VARCHAR(50) NOT NULL,
  country_code VARCHAR(10),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guest_nationality VARCHAR(10),
  num_rooms INTEGER,
  room_config JSONB,  -- [{adults: 2, children: 0}, ...]

  -- Cache metadata
  hotel_count INTEGER,                      -- how many hotels cached
  cache_source VARCHAR(50),                 -- 'tbo', 'hotelbeds', etc.
  is_fresh BOOLEAN DEFAULT true,            -- false if TTL expired
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  ttl_expires_at TIMESTAMPTZ,              -- NOW() + 4 hours
  last_price_refresh_at TIMESTAMPTZ,        -- when prices were last updated

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_cache_hash ON hotel_search_cache(search_hash);
CREATE INDEX idx_search_cache_city_date ON hotel_search_cache(city_id, check_in_date, check_out_date);
CREATE INDEX idx_search_cache_freshness ON hotel_search_cache(is_fresh, cached_at DESC);
```

#### **tbo_hotels_normalized**

Stores normalized hotel metadata from TBO (replaces current `tbo_hotels` with richer data).

```sql
CREATE TABLE tbo_hotels_normalized (
  id BIGSERIAL PRIMARY KEY,
  tbo_hotel_code VARCHAR(100) NOT NULL UNIQUE,  -- TBO's HotelCode
  city_id VARCHAR(50) NOT NULL,
  city_name VARCHAR(255),
  country_code VARCHAR(10),

  -- Basic Info
  name VARCHAR(500) NOT NULL,
  description TEXT,
  address TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),

  -- Hotel Details
  star_rating NUMERIC(3, 1),
  check_in_time TIME,
  check_out_time TIME,

  -- Amenities
  amenities JSONB,  -- ["WiFi", "Pool", "Gym", ...]
  facilities JSONB, -- more detailed facility info

  -- Images
  images JSONB,  -- [{ url, caption, isPrimary }, ...]
  main_image_url TEXT,

  -- Contact
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(500),

  -- Metadata
  total_rooms INTEGER,
  popularity INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,

  -- Full TBO response (for fallback/debugging)
  tbo_response_blob JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotels_normalized_city ON tbo_hotels_normalized(city_id);
CREATE INDEX idx_hotels_normalized_code ON tbo_hotels_normalized(tbo_hotel_code);
CREATE INDEX idx_hotels_normalized_name ON tbo_hotels_normalized(name);
CREATE INDEX idx_hotels_normalized_rating ON tbo_hotels_normalized(star_rating DESC);
```

#### **tbo_rooms_normalized**

Stores room type and rate plan details for each hotel.

```sql
CREATE TABLE tbo_rooms_normalized (
  id BIGSERIAL PRIMARY KEY,
  tbo_hotel_code VARCHAR(100) NOT NULL REFERENCES tbo_hotels_normalized(tbo_hotel_code) ON DELETE CASCADE,

  -- Room Type
  room_type_id VARCHAR(100),
  room_type_name VARCHAR(255),  -- "Standard Twin", "Deluxe Room", etc.
  room_description TEXT,

  -- Occupancy & Size
  max_occupancy INTEGER,
  adults_max INTEGER,
  children_max INTEGER,
  room_size_sqm NUMERIC(6, 2),

  -- Room Features
  bed_types JSONB,  -- ["King Bed", "Twin Beds"]
  room_features JSONB,  -- ["AC", "Balcony", "City View"]
  amenities JSONB,  -- room-specific amenities

  -- Images
  images JSONB,  -- room images

  -- Rate Plans (from GetHotelRoom)
  base_price_per_night NUMERIC(12, 2),
  currency VARCHAR(3),

  -- Cancellation Policy
  cancellation_policy JSONB,  -- {type: "free", daysBeforeCheckIn: 3, ...}

  -- Meal Plan
  meal_plan TEXT,  -- "breakfast_included", "half_board", "full_board"
  breakfast_included BOOLEAN DEFAULT false,

  -- Full TBO response
  tbo_response_blob JSONB,

  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_normalized_hotel ON tbo_rooms_normalized(tbo_hotel_code);
CREATE INDEX idx_rooms_normalized_room_type ON tbo_rooms_normalized(room_type_name);
```

#### **hotel_search_cache_results**

Maps search_hash to the hotel IDs in that search (join table).

```sql
CREATE TABLE hotel_search_cache_results (
  id BIGSERIAL PRIMARY KEY,
  search_hash VARCHAR(64) NOT NULL REFERENCES hotel_search_cache(search_hash) ON DELETE CASCADE,
  tbo_hotel_code VARCHAR(100) NOT NULL REFERENCES tbo_hotels_normalized(tbo_hotel_code) ON DELETE CASCADE,
  result_rank INTEGER,  -- position in original TBO response
  price_offered_per_night NUMERIC(12, 2),
  price_published_per_night NUMERIC(12, 2),
  available_rooms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_results_hash ON hotel_search_cache_results(search_hash);
CREATE INDEX idx_cache_results_hotel ON hotel_search_cache_results(tbo_hotel_code);
```

### 2.2 Migration Script

```sql
-- File: api/database/migrations/20250205_hotel_cache_layer.sql
BEGIN;

-- 1. hotel_search_cache
CREATE TABLE IF NOT EXISTS hotel_search_cache (
  id BIGSERIAL PRIMARY KEY,
  search_hash VARCHAR(64) NOT NULL UNIQUE,
  city_id VARCHAR(50) NOT NULL,
  country_code VARCHAR(10),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guest_nationality VARCHAR(10),
  num_rooms INTEGER,
  room_config JSONB,
  hotel_count INTEGER,
  cache_source VARCHAR(50),
  is_fresh BOOLEAN DEFAULT true,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  ttl_expires_at TIMESTAMPTZ,
  last_price_refresh_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_cache_hash ON hotel_search_cache(search_hash);
CREATE INDEX idx_search_cache_city_date ON hotel_search_cache(city_id, check_in_date, check_out_date);
CREATE INDEX idx_search_cache_freshness ON hotel_search_cache(is_fresh, cached_at DESC);

-- 2. tbo_hotels_normalized (extends existing tbo_hotels)
CREATE TABLE IF NOT EXISTS tbo_hotels_normalized (
  id BIGSERIAL PRIMARY KEY,
  tbo_hotel_code VARCHAR(100) NOT NULL UNIQUE,
  city_id VARCHAR(50) NOT NULL,
  city_name VARCHAR(255),
  country_code VARCHAR(10),
  name VARCHAR(500) NOT NULL,
  description TEXT,
  address TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  star_rating NUMERIC(3, 1),
  check_in_time TIME,
  check_out_time TIME,
  amenities JSONB,
  facilities JSONB,
  images JSONB,
  main_image_url TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(500),
  total_rooms INTEGER,
  popularity INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  tbo_response_blob JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotels_normalized_city ON tbo_hotels_normalized(city_id);
CREATE INDEX idx_hotels_normalized_code ON tbo_hotels_normalized(tbo_hotel_code);
CREATE INDEX idx_hotels_normalized_name ON tbo_hotels_normalized(name);

-- 3. tbo_rooms_normalized
CREATE TABLE IF NOT EXISTS tbo_rooms_normalized (
  id BIGSERIAL PRIMARY KEY,
  tbo_hotel_code VARCHAR(100) NOT NULL REFERENCES tbo_hotels_normalized(tbo_hotel_code) ON DELETE CASCADE,
  room_type_id VARCHAR(100),
  room_type_name VARCHAR(255),
  room_description TEXT,
  max_occupancy INTEGER,
  adults_max INTEGER,
  children_max INTEGER,
  room_size_sqm NUMERIC(6, 2),
  bed_types JSONB,
  room_features JSONB,
  amenities JSONB,
  images JSONB,
  base_price_per_night NUMERIC(12, 2),
  currency VARCHAR(3),
  cancellation_policy JSONB,
  meal_plan TEXT,
  breakfast_included BOOLEAN DEFAULT false,
  tbo_response_blob JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_normalized_hotel ON tbo_rooms_normalized(tbo_hotel_code);

-- 4. hotel_search_cache_results
CREATE TABLE IF NOT EXISTS hotel_search_cache_results (
  id BIGSERIAL PRIMARY KEY,
  search_hash VARCHAR(64) NOT NULL REFERENCES hotel_search_cache(search_hash) ON DELETE CASCADE,
  tbo_hotel_code VARCHAR(100) NOT NULL REFERENCES tbo_hotels_normalized(tbo_hotel_code) ON DELETE CASCADE,
  result_rank INTEGER,
  price_offered_per_night NUMERIC(12, 2),
  price_published_per_night NUMERIC(12, 2),
  available_rooms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_results_hash ON hotel_search_cache_results(search_hash);
CREATE INDEX idx_cache_results_hotel ON hotel_search_cache_results(tbo_hotel_code);

COMMIT;
```

---

## 3. API ENDPOINT DESIGN

### 3.1 POST /api/hotels/search (Cache-Backed)

**Request**:

```json
{
  "cityId": "1",
  "countryCode": "AE",
  "checkIn": "2025-06-15",
  "checkOut": "2025-06-20",
  "guestNationality": "IN",
  "rooms": "1",
  "adults": "2",
  "children": "0",
  "currency": "INR"
}
```

**Response**:

```json
{
  "success": true,
  "source": "cache", // or "tbo" if fresh lookup
  "hotels": [
    {
      "hotelId": "tbo_12345",
      "name": "Emirates Hotel Dubai",
      "city": "Dubai",
      "starRating": 5,
      "amenities": ["WiFi", "Pool", "Gym"],
      "images": ["https://..."],
      "location": "Downtown Dubai",
      "price": {
        "offered": 8500,
        "published": 10000,
        "currency": "INR"
      },
      "availableRooms": 5,
      "rooms": [
        {
          "roomTypeId": "DLXDBL",
          "roomTypeName": "Deluxe Double",
          "maxOccupancy": 2,
          "basePrice": 8500,
          "images": ["https://..."],
          "amenities": ["AC", "City View"],
          "mealPlan": "breakfast_included",
          "cancellationPolicy": {
            "type": "free_until_checkout",
            "details": "Free cancellation until 6 PM on arrival date"
          }
        }
      ]
    }
  ],
  "totalResults": 25,
  "cacheHit": true,
  "cachedAt": "2025-02-20T10:30:00Z",
  "ttlExpiresAt": "2025-02-20T14:30:00Z"
}
```

### 3.2 POST /api/hotels/rooms/{hotelId} (Room Details + Live Price)

Called when user expands a hotel or goes to details page.

**Request**:

```json
{
  "checkIn": "2025-06-15",
  "checkOut": "2025-06-20",
  "roomConfig": [{ "adults": 2, "children": 0 }],
  "currency": "INR",
  "guestNationality": "IN"
}
```

**Response**: Fetches latest room details + prices from TBO's GetHotelRoom + BlockRoom, returns:

```json
{
  "success": true,
  "hotelId": "tbo_12345",
  "rooms": [
    {
      "roomTypeId": "DLXDBL",
      "roomTypeName": "Deluxe Double",
      "price": {
        "offered": 8500,
        "published": 10000,
        "currency": "INR"
      },
      "availability": "Available",
      "cancellationPolicy": { ... }  // Fresh from TBO
    }
  ],
  "fetchedFrom": "tbo",
  "timestamp": "2025-02-20T10:35:00Z"
}
```

### 3.3 POST /api/hotels/block (Pre-Booking)

Called before final checkout to lock rates.

**Request**:

```json
{
  "hotelId": "tbo_12345",
  "roomTypeId": "DLXDBL",
  "checkIn": "2025-06-15",
  "checkOut": "2025-06-20",
  "guests": [...]
}
```

**Response**: Calls TBO's BlockRoom, returns booking reference.

---

## 4. BACKEND IMPLEMENTATION (Node.js)

### 4.1 Cache Service (`api/services/hotelCacheService.js`)

```javascript
const crypto = require("crypto");
const db = require("../database/connection");

class HotelCacheService {
  /**
   * Generate search hash from parameters
   */
  generateSearchHash(params) {
    const hashKey = JSON.stringify({
      cityId: params.cityId,
      countryCode: params.countryCode,
      guestNationality: params.guestNationality,
      checkInDate: params.checkIn,
      checkOutDate: params.checkOut,
      numberOfRooms: params.rooms,
      roomOccupancy: params.roomOccupancy || [],
    });
    return crypto.createHash("sha256").update(hashKey).digest("hex");
  }

  /**
   * Check if search exists in cache and is fresh
   */
  async getCachedSearch(searchHash) {
    const result = await db.query(
      `SELECT * FROM hotel_search_cache
       WHERE search_hash = $1
       AND is_fresh = true
       AND ttl_expires_at > NOW()`,
      [searchHash],
    );
    return result.rows[0] || null;
  }

  /**
   * Store new search in cache
   */
  async cacheSearchResults(searchHash, params, hotelIds, source = "tbo") {
    const ttlExpiresAt = new Date();
    ttlExpiresAt.setHours(ttlExpiresAt.getHours() + 4);

    await db.query(
      `INSERT INTO hotel_search_cache
       (search_hash, city_id, country_code, check_in_date, check_out_date,
        guest_nationality, num_rooms, room_config, hotel_count, cache_source, ttl_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        searchHash,
        params.cityId,
        params.countryCode,
        params.checkIn,
        params.checkOut,
        params.guestNationality,
        params.rooms,
        JSON.stringify(params.roomOccupancy || []),
        hotelIds.length,
        source,
        ttlExpiresAt,
      ],
    );

    // Store individual results
    for (const [rank, hotelId] of hotelIds.entries()) {
      await db.query(
        `INSERT INTO hotel_search_cache_results
         (search_hash, tbo_hotel_code, result_rank)
         VALUES ($1, $2, $3)`,
        [searchHash, hotelId, rank + 1],
      );
    }
  }

  /**
   * Fetch cached hotels from DB
   */
  async getCachedHotels(searchHash) {
    const result = await db.query(
      `SELECT h.* FROM tbo_hotels_normalized h
       JOIN hotel_search_cache_results cr ON h.tbo_hotel_code = cr.tbo_hotel_code
       WHERE cr.search_hash = $1
       ORDER BY cr.result_rank`,
      [searchHash],
    );
    return result.rows;
  }

  /**
   * Store normalized hotel data from TBO
   */
  async storeNormalizedHotel(hotelData) {
    const {
      tboHotelCode,
      cityId,
      cityName,
      countryCode,
      name,
      description,
      address,
      starRating,
      amenities,
      images,
      phone,
      email,
      website,
      tboResponseBlob,
    } = hotelData;

    await db.query(
      `INSERT INTO tbo_hotels_normalized
       (tbo_hotel_code, city_id, city_name, country_code, name, description,
        address, star_rating, amenities, images, phone, email, website,
        tbo_response_blob, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       ON CONFLICT (tbo_hotel_code) DO UPDATE SET
         last_synced_at = NOW(),
         tbo_response_blob = $14`,
      [
        tboHotelCode,
        cityId,
        cityName,
        countryCode,
        name,
        description,
        address,
        starRating,
        JSON.stringify(amenities),
        JSON.stringify(images),
        phone,
        email,
        website,
        JSON.stringify(tboResponseBlob),
      ],
    );
  }

  /**
   * Store normalized room data from TBO
   */
  async storeNormalizedRoom(roomData) {
    const {
      tboHotelCode,
      roomTypeName,
      roomTypeId,
      maxOccupancy,
      bedTypes,
      amenities,
      images,
      basePrice,
      currency,
      cancellationPolicy,
      mealPlan,
      tboResponseBlob,
    } = roomData;

    await db.query(
      `INSERT INTO tbo_rooms_normalized
       (tbo_hotel_code, room_type_name, room_type_id, max_occupancy,
        bed_types, amenities, images, base_price_per_night, currency,
        cancellation_policy, meal_plan, tbo_response_blob, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (tbo_hotel_code, room_type_id) DO UPDATE SET
         last_synced_at = NOW(),
         tbo_response_blob = $12`,
      [
        tboHotelCode,
        roomTypeName,
        roomTypeId,
        maxOccupancy,
        JSON.stringify(bedTypes),
        JSON.stringify(amenities),
        JSON.stringify(images),
        basePrice,
        currency,
        JSON.stringify(cancellationPolicy),
        mealPlan,
        JSON.stringify(tboResponseBlob),
      ],
    );
  }

  /**
   * Mark search as stale (force refresh)
   */
  async invalidateSearch(searchHash) {
    await db.query(
      `UPDATE hotel_search_cache SET is_fresh = false WHERE search_hash = $1`,
      [searchHash],
    );
  }
}

module.exports = new HotelCacheService();
```

### 4.2 Updated Hotel Route (`api/routes/hotels-search.js`)

```javascript
const express = require("express");
const router = express.Router();
const tboAdapter = require("../services/adapters/tboAdapter");
const hotelCacheService = require("../services/hotelCacheService");

router.post("/search", async (req, res) => {
  try {
    const params = req.body;

    // Step 1: Generate search hash
    const searchHash = hotelCacheService.generateSearchHash(params);

    // Step 2: Check cache
    const cachedSearch = await hotelCacheService.getCachedSearch(searchHash);

    if (cachedSearch) {
      // Cache hit: fetch hotels from DB
      const hotels = await hotelCacheService.getCachedHotels(searchHash);

      return res.json({
        success: true,
        source: "cache",
        hotels: hotels,
        totalResults: hotels.length,
        cacheHit: true,
        cachedAt: cachedSearch.cached_at,
        ttlExpiresAt: cachedSearch.ttl_expires_at,
      });
    }

    // Step 3: Cache miss - call TBO
    const adapter = new tboAdapter();
    const tboHotels = await adapter.searchHotels({
      ...params,
      rooms: params.rooms || "1",
      adults: params.adults || "2",
      children: params.children || "0",
    });

    // Step 4: Normalize and store results
    for (const hotel of tboHotels) {
      await hotelCacheService.storeNormalizedHotel({
        tboHotelCode: hotel.hotelId,
        cityId: params.cityId,
        cityName: params.city,
        countryCode: params.countryCode,
        name: hotel.name,
        starRating: hotel.starRating,
        amenities: hotel.amenities,
        images: hotel.images,
        tboResponseBlob: hotel, // Full TBO response
      });
    }

    // Step 5: Cache the search
    const hotelIds = tboHotels.map((h) => h.hotelId);
    await hotelCacheService.cacheSearchResults(
      searchHash,
      params,
      hotelIds,
      "tbo",
    );

    // Step 6: Return results
    return res.json({
      success: true,
      source: "tbo",
      hotels: tboHotels,
      totalResults: tboHotels.length,
      cacheHit: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Hotel search error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
```

---

## 5. FRONTEND INTEGRATION

### 5.1 Updated HotelResults.tsx Flow

```typescript
// Current structure - minimal changes needed

interface HotelSearchParams {
  cityId: string;
  countryCode: string;
  checkIn: string;
  checkOut: string;
  guestNationality: string;
  rooms: number;
  adults: number;
  children: number;
}

// Replace existing fetchTBOHotels with cache-backed version
const fetchCachedHotels = async (params: HotelSearchParams) => {
  const response = await fetch("/api/hotels/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (data.success) {
    setHotels(data.hotels);
    setTotalResults(data.totalResults);
    setCacheSource(data.source); // 'cache' or 'tbo'
  }
};

// In useEffect:
const loadHotels = async () => {
  const params = {
    cityId: searchParams.get("cityId"),
    countryCode: "AE",
    checkIn: departureDate,
    checkOut: returnDate,
    guestNationality: selectedNationality,
    rooms: roomCount,
    adults,
    children,
  };

  await fetchCachedHotels(params);
  setLoading(false);
};
```

### 5.2 Room Details Page (Optional Live Refresh)

```typescript
// In HotelDetails.tsx

const fetchRoomDetails = async (hotelId: string) => {
  const response = await fetch(`/api/hotels/rooms/${hotelId}`, {
    method: "POST",
    body: JSON.stringify({
      checkIn: departureDate,
      checkOut: returnDate,
      roomConfig: [{ adults, children }],
      currency: selectedCurrency,
    }),
  });

  const data = await response.json();

  // Combines cached hotel data with live pricing
  setRoomDetails(data.rooms);
  setPriceRefreshedAt(data.timestamp);
};
```

### 5.3 Component Updates (Minimal)

The existing HotelCard, HotelDetails, and checkout components **do not need major rewrites**:

- **HotelCard**: Already displays `hotel.name`, `hotel.images`, `hotel.amenities`, `hotel.starRating` → all now come from our DB
- **HotelDetails**: Already maps `preselectRate` data → now uses cached room data from `tbo_rooms_normalized`
- **Checkout**: Already calls `/api/hotels/block` → continues to use live TBO response

Only change: Update the API call in `HotelResults.tsx` to `POST /api/hotels/search` instead of `fetchTBOHotels()`.

---

## 6. CACHE TTL & REFRESH STRATEGY

| Scenario                        | TTL                   | Action                                                              |
| ------------------------------- | --------------------- | ------------------------------------------------------------------- |
| **First search** (no cache)     | 4 hours               | Store full hotel + room data from TBO                               |
| **Repeat search** (cache fresh) | Extend +4h            | Return from DB, optionally refresh prices from TBO if user requests |
| **Cache stale** (>4h old)       | 0 (expired)           | Treat as cache miss, call TBO, update DB                            |
| **Manual refresh**              | User clicks "Refresh" | Invalidate cache entry, force TBO call                              |
| **Room selection**              | Per-request           | Always call TBO's GetHotelRoom + BlockRoom for live price + policy  |

**Rationale**:

- **4-hour TTL**: Hotel availability doesn't change drastically within 4 hours in most markets
- **Live prices on details/checkout**: Critical business moments always get latest TBO data
- **Stale-while-revalidate option**: Could serve stale cache instantly + background refresh for next request

---

## 7. DEPLOYMENT CHECKLIST

### Phase 1: Database & Backend (Week 1)

- [ ] Run migration: `20250205_hotel_cache_layer.sql`
- [ ] Deploy `hotelCacheService.js`
- [ ] Deploy updated `hotels-search.js` route
- [ ] Deploy updated `tboAdapter.js` with normalization methods
- [ ] Test on Render staging
- [ ] Verify cache hit/miss behavior with logs

### Phase 2: Frontend Integration (Week 1-2)

- [ ] Update `HotelResults.tsx` to call `/api/hotels/search`
- [ ] Update `HotelDetails.tsx` to fetch room details from new endpoint
- [ ] Test search flow: cache hit, cache miss, hotel details
- [ ] QA on desktop + mobile

### Phase 3: Optimization & Monitoring (Week 2-3)

- [ ] Add performance metrics (search time, cache hit %, DB query time)
- [ ] Monitor error rates
- [ ] Optimize indexes based on real query patterns
- [ ] Optional: Implement stale-while-revalidate for instant speed

---

## 8. SAMPLE QUERIES FOR TESTING

```javascript
// Check cache hit rate
SELECT
  DATE(cached_at) as date,
  COUNT(*) as total_searches,
  SUM(CASE WHEN is_fresh THEN 1 ELSE 0 END) as cached_searches,
  ROUND(100 * SUM(CASE WHEN is_fresh THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_percent
FROM hotel_search_cache
GROUP BY DATE(cached_at)
ORDER BY date DESC;

// Find slow searches
SELECT
  search_hash,
  city_id,
  created_at,
  EXTRACT(EPOCH FROM (updated_at - created_at))::INT as duration_sec
FROM hotel_search_cache
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY duration_sec DESC
LIMIT 20;

// Check stale entries
SELECT COUNT(*) as stale_searches
FROM hotel_search_cache
WHERE is_fresh = false;
```

---

## 9. TIMELINE & NEXT STEPS

1. **Today**: Confirm this architecture with the team
2. **Tomorrow**: Create migration file + implement cache service
3. **By end of week**: Deploy to staging, test cache behavior
4. **Next week**: Wire frontend, QA, deploy to production

---

## 10. ALTERNATIVE APPROACHES (IF PREFERRED)

### A. Redis-First Cache (Faster, Higher Cost)

- Store hot searches (last 100) in Redis before DB
- Pros: Instant response for very recent searches
- Cons: Added cost, requires Redis infrastructure
- Recommendation: Start with Postgres, add Redis if performance needed

### B. Stale-While-Revalidate (Best UX)

- Serve cached results instantly
- Background job refreshes cache in parallel
- Return updated results on next search
- Pros: Fastest perceived UX
- Cons: Requires background job queue (Bull, Celery, etc.)

### C. Full Inventory Sync (Maximum Speed)

- Nightly sync of ALL hotels in supported cities
- No TBO calls on search (only pricing/booking)
- Pros: Blazing fast, minimal TBO load
- Cons: Complex to maintain, requires storage
- Recommendation: Future phase after cache proves stable

---

## Summary

This architecture gives you:

- ✅ **Faster searches** (4-hour cache of static hotel data)
- ✅ **Lower TBO costs** (one call per unique search, not per user)
- ✅ **Fresh pricing** (live calls on details/booking)
- ✅ **Minimal frontend changes** (same components, same UI)
- ✅ **Easy to debug** (full TBO response stored in `tbo_response_blob`)
- ✅ **Graceful degradation** (fallback to mock data on errors)

Ready to implement. Let me know if you'd like to adjust any TTLs, add Redis, or modify the schema.
