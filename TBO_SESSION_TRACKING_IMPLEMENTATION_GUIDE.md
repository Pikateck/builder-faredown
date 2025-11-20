# TBO Session Tracking Implementation Guide

## Status: Ready for Implementation

This document specifies the complete implementation for TBO session tracking, caching, and bargain flow integration.

---

## 1. Database Changes

### Migration Created: `20250610_hotel_session_tracking.sql`

**New columns in `hotel_search_cache`:**

- `tbo_trace_id` - TBO TraceId from GetHotelResult (required for BlockRoom/Book)
- `tbo_token_id` - TBO TokenId used for this search (valid 24h)
- `session_started_at` - When the search was performed
- `session_expires_at` - When the session expires (for price hold validity)
- `supplier` - Supplier code ('TBO', 'HOTELBEDS', etc.)
- `supplier_metadata` - Full supplier response metadata (JSONB)

**New columns in `hotel_search_cache_results`:**

- `result_index` - TBO ResultIndex (0-based)
- `hotel_code` - TBO HotelCode
- `category_id` - TBO CategoryId (for de-dupe hotels)
- `is_tbo_mapped` - Whether this is a de-dupe hotel
- `room_type_code` - Room type identifier
- `supplier_room_metadata` - Full room metadata (JSONB)

**Apply migration:**

```bash
psql $DATABASE_URL -f api/database/migrations/20250610_hotel_session_tracking.sql
```

---

## 2. Configuration

### File Created: `api/config/tbo-session.config.js`

**Environment Variables:**

```env
# TBO Session Settings
TBO_SESSION_TTL_MINUTES=10              # TraceId validity (default: 10 mins)
SESSION_SAFETY_BUFFER_SECONDS=60        # Stop booking 60s before expiry
BARGAIN_ATTEMPTS_MAX=2                  # 2 bargain rounds
BARGAIN_ROUND_TIMER_SECONDS=30          # 30s per round
BARGAIN_TOTAL_WINDOW_SECONDS=300        # 5 mins total bargain time
CACHE_SEARCH_TTL_HOURS=4                # Cache search results for 4h
CACHE_STATIC_DATA_TTL_HOURS=168         # Cache static data for 7 days
```

**Key Functions:**

```javascript
const tboSessionConfig = require("../config/tbo-session.config");

// Calculate session expiry
const sessionExpiry = tboSessionConfig.calculateSessionExpiry(new Date());

// Check if session is valid for booking
const isValid = tboSessionConfig.isSessionValid(sessionExpiry);

// Get remaining time
const remaining = tboSessionConfig.getSessionTimeRemaining(sessionExpiry);
```

---

## 3. Hotel Cache Service Updates

### File Modified: `api/services/hotelCacheService.js`

**Updated `cacheSearchResults` signature:**

```javascript
async cacheSearchResults(
  searchHash,
  params,
  hotelIds,
  source = 'tbo',
  sessionMetadata = {}  // ✅ NEW: Session tracking data
)
```

**Session metadata structure:**

```javascript
{
  traceId: 'abc123...',           // TBO TraceId from GetHotelResult
  tokenId: 'xyz789...',           // TBO TokenId
  destinationId: 115936,          // TBO DestinationId
  supplierResponseFull: {...}     // Full TBO response for audit
}
```

**Updated `getCachedSearch` returns:**

```javascript
{
  search_hash: '...',
  tbo_trace_id: '...',
  tbo_token_id: '...',
  session_started_at: '2025-06-10T12:00:00Z',
  session_expires_at: '2025-06-10T12:10:00Z',
  session_valid: true,            // ✅ NEW: Computed field
  supplier_metadata: {...},
  ...other fields
}
```

---

## 4. TBO Adapter Updates

### File To Modify: `api/services/adapters/tboAdapter.js`

**Current `searchHotels` return value:**

```javascript
return [hotels]; // ❌ Only returns array
```

**New `searchHotels` return value:**

```javascript
return {
  hotels: [hotels], // Transformed hotels array
  sessionMetadata: {
    traceId: searchResult?.TraceId || null,
    tokenId: this.tokenId,
    destinationId: cityId,
    supplierResponseFull: searchResult,
  },
};
```

**Implementation:**

```javascript
// In searchHotels function (around line 586-607)

const hotels = searchResult?.HotelResults || [];

if (hotels.length === 0) {
  this.logger.info("ℹ️ TBO returned 0 hotels for this search");
  return {
    hotels: [],
    sessionMetadata: {
      traceId: searchResult?.TraceId || null,
      tokenId: tokenId,
      destinationId: cityId,
      supplierResponseFull: searchResult,
    },
  };
}

this.logger.info(`✅ TBO Search SUCCESS - ${hotels.length} hotels found`, {
  traceId: searchResult?.TraceId,
});

// Transform to our format
const transformedHotels = this.transformHotelResults(hotels, searchParams);

// Return hotels with session metadata
return {
  hotels: transformedHotels,
  sessionMetadata: {
    traceId: searchResult?.TraceId || null,
    tokenId: tokenId,
    destinationId: cityId,
    supplierResponseFull: searchResult,
  },
};
```

**Error handling:**

```javascript
} catch (error) {
  this.logger.error("❌ TBO Hotel Search FAILED", {
    message: error.message,
    httpStatus: error.response?.status,
    statusText: error.response?.statusText,
    responseData: error.response?.data,
    url: searchUrl,
  });
  return {
    hotels: [],
    sessionMetadata: {
      traceId: null,
      tokenId: tokenId,
      destinationId: cityId,
      supplierResponseFull: null,
    },
  };
}
```

---

## 5. Hotels Search Route Updates

### File To Modify: `api/routes/hotels-search.js`

**Update TBO adapter call (around line 176-200):**

```javascript
// OLD:
const tboHotels = await adapter.searchHotels(tboSearchParams);

// NEW:
const tboResponse = await adapter.searchHotels(tboSearchParams);
const { hotels: tboHotels, sessionMetadata } = tboResponse;
```

**Update cache storage call (around line 233-240):**

```javascript
// OLD:
await hotelCacheService.cacheSearchResults(
  searchHash,
  searchParams,
  hotelIds,
  "tbo",
);

// NEW:
await hotelCacheService.cacheSearchResults(
  searchHash,
  searchParams,
  hotelIds,
  "tbo",
  sessionMetadata, // ✅ Pass session metadata
);
```

**Update response structure (around line 250-280):**

```javascript
const tboSessionConfig = require("../config/tbo-session.config");

// Calculate session validity
const sessionExpiresAt = cachedSearch
  ? cachedSearch.session_expires_at
  : tboSessionConfig.calculateSessionExpiry(new Date());

const sessionValid = cachedSearch ? cachedSearch.session_valid : true;

res.json({
  success: true,
  source: cachedSearch ? "tbo_cache" : "tbo_live", // ✅ Clear source indicator
  hotels: responseHotels,
  totalResults: responseHotels.length,
  cacheHit: !!cachedSearch, // ✅ Cache hit flag
  timestamp: new Date().toISOString(),
  duration: `${duration}ms`,
  sessionExpiresAt: sessionExpiresAt, // ✅ NEW: Session expiry
  sessionValid: sessionValid, // ✅ NEW: Session validity flag
  traceId,
});
```

---

## 6. Frontend UI Integration

### Display Session/Price Hold Info

**Add to `client/pages/HotelResults.tsx` (top of results):**

```tsx
{
  searchMetadata?.sessionExpiresAt && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-blue-900">
            Prices held by supplier
          </p>
          <p className="text-xs text-blue-700">
            Complete your bargain and booking within the next{" "}
            {formatTimeRemaining(searchMetadata.sessionExpiresAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Add session countdown utility:**

```typescript
function formatTimeRemaining(expiryDate: string): string {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return "expired";

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return `${minutes}m ${seconds}s`;
}
```

### Store TBO Metadata for Booking

**Update hotel card to include session metadata:**

```tsx
const hotelWithMetadata = {
  ...hotel,
  tboMetadata: {
    traceId: searchMetadata.traceId,
    resultIndex: hotel.resultIndex,
    hotelCode: hotel.hotelId,
    categoryId: hotel.categoryId,
    isTBOMapped: hotel.isTBOMapped,
  },
};
```

**Pass to bargain modal and booking flow:**

```tsx
<ConversationalBargainModal
  hotel={hotelWithMetadata}
  onBook={(finalPrice) => handleBooking(hotelWithMetadata, finalPrice)}
  sessionExpiry={searchMetadata.sessionExpiresAt}
/>
```

---

## 7. Bargain Flow with Session Validation

### Backend: Check Session Before Booking

**File: `api/routes/hotels-booking.js` or `api/services/hotelBookingService.js`**

```javascript
const tboSessionConfig = require("../config/tbo-session.config");

async function initiateBooking(hotelData, roomData, guestData) {
  const { tboMetadata } = hotelData;
  const { traceId, sessionExpiresAt } = tboMetadata;

  // Validate session is still valid
  if (!tboSessionConfig.isSessionValid(new Date(sessionExpiresAt))) {
    throw new Error("SESSION_EXPIRED");
  }

  // Proceed with BlockRoom
  const blockResult = await tboAdapter.blockRoom({
    traceId,
    resultIndex: tboMetadata.resultIndex,
    hotelCode: tboMetadata.hotelCode,
    categoryId: tboMetadata.categoryId,
    roomIndex: roomData.roomIndex,
    ...otherParams,
  });

  // Check for price changes
  if (blockResult.IsPriceChanged) {
    return {
      success: false,
      error: "PRICE_CHANGED",
      newPrice: blockResult.HotelRoomsDetails[0].Price,
      message: "Price has changed. Please review and confirm.",
    };
  }

  // Proceed to book
  const bookResult = await tboAdapter.bookHotel({
    traceId,
    resultIndex: tboMetadata.resultIndex,
    hotelCode: tboMetadata.hotelCode,
    ...bookingParams,
  });

  return {
    success: true,
    booking: bookResult,
  };
}
```

### Frontend: Handle Session Expiry Errors

```typescript
try {
  const bookingResult = await api.post("/api/hotels/book", bookingData);
  // Success flow
} catch (error) {
  if (error.response?.data?.error === "SESSION_EXPIRED") {
    toast.error("Session expired. Please search again.");
    navigate("/hotels");
  } else if (error.response?.data?.error === "PRICE_CHANGED") {
    // Show price change modal
    setShowPriceChangeModal(true);
    setNewPrice(error.response.data.newPrice);
  }
}
```

---

## 8. Testing Checklist

### 1. Cache Behavior

```bash
# Test 1: First search (should hit TBO live)
curl -X POST https://builder-faredown-pricing.onrender.com/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Dubai",
    "countryCode": "AE",
    "checkIn": "2025-07-01",
    "checkOut": "2025-07-05",
    "rooms": "1",
    "adults": "2",
    "children": "0",
    "currency": "INR",
    "guestNationality": "IN"
  }'

# Expected:
# - source: "tbo_live"
# - cacheHit: false
# - sessionExpiresAt: <timestamp 10 mins from now>
# - traceId: <TBO TraceId>

# Test 2: Immediate repeat (should hit cache)
# Run same command within 10 minutes

# Expected:
# - source: "tbo_cache"
# - cacheHit: true
# - sessionExpiresAt: <same as first call>
```

### 2. Session Expiry

```javascript
// In QA environment, set TBO_SESSION_TTL_MINUTES=2

// 1. Search for hotels
// 2. Wait 1 minute
// 3. Attempt bargain → should work
// 4. Wait another 2 minutes (total 3 mins)
// 5. Attempt booking → should return SESSION_EXPIRED error
```

### 3. Render Logs Verification

```
[TBO] ✅ CityId resolved { destinationId: 115936, cityName: "Dubai" }
[TBO] 🔍 TBO Hotel Search Request { cityId: 115936, ... }
[TBO] 📥 TBO Search Response { hotelCount: 150, traceId: "abc123..." }
✅ Cached search: a1b2c3... with 150 hotels { traceId: "abc123...", sessionExpiresAt: "2025-06-10T12:10:00Z" }
```

---

## 9. Deployment Steps

1. **Apply database migration:**

   ```bash
   psql $DATABASE_URL -f api/database/migrations/20250610_hotel_session_tracking.sql
   ```

2. **Set environment variables on Render:**

   ```env
   TBO_SESSION_TTL_MINUTES=10
   SESSION_SAFETY_BUFFER_SECONDS=60
   BARGAIN_ATTEMPTS_MAX=2
   BARGAIN_ROUND_TIMER_SECONDS=30
   ```

3. **Deploy code changes:**
   - `api/config/tbo-session.config.js` (new file)
   - `api/services/hotelCacheService.js` (updated)
   - `api/services/adapters/tboAdapter.js` (updated)
   - `api/routes/hotels-search.js` (updated)

4. **Test with PowerShell:**

   ```powershell
   $body = @{
       destination = "Dubai"
       countryCode = "AE"
       checkIn = "2025-07-01"
       checkOut = "2025-07-05"
       rooms = "1"
       adults = "2"
       children = "0"
       currency = "INR"
       guestNationality = "IN"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body -ContentType "application/json"
   ```

5. **Verify response includes:**
   - `source: "tbo_live"` or `"tbo_cache"`
   - `cacheHit: true/false`
   - `sessionExpiresAt: "<ISO timestamp>"`
   - `sessionValid: true`
   - `traceId: "<UUID>"`

---

## 10. Next Steps After This Implementation

1. **UI Enhancements:**
   - Add session countdown timer to hotel results
   - Show "Price hold" badge on hotel cards
   - Display warning when session is about to expire

2. **Bargain Flow Integration:**
   - Pass `traceId` through bargain modal
   - Validate session before each bargain round
   - Force refresh if session expires mid-bargain

3. **Booking Flow:**
   - Use stored `ResultIndex`, `HotelCode`, `CategoryId` for BlockRoom
   - Handle `IsPriceChanged` gracefully with user confirmation
   - Track booking attempts vs session expiry

4. **Multi-Market Testing:**
   - Test with different cities (Abu Dhabi, Mumbai, London)
   - Verify session tracking across all TBO destinations
   - Monitor cache hit rates and session expiry patterns

---

## Summary

This implementation provides:

- ✅ Full TBO session tracking with `TraceId` and expiry monitoring
- ✅ Cached data includes all metadata needed for BlockRoom/Book
- ✅ Session validity checks before bargain/booking attempts
- ✅ Clear API responses with `source`, `cacheHit`, `sessionExpiresAt`
- ✅ Configurable TTL values for session, bargain, and cache
- ✅ Zero-crash error handling for expired sessions
- ✅ Audit trail of all TBO responses in `supplier_metadata`

**Ready for deployment and testing!**
