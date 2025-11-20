# TBO Caching & Session Implementation - COMPLETE

## ✅ Implementation Status

### Backend Infrastructure: COMPLETE

1. **Database Migration** ✅
   - Created: `api/database/migrations/20250610_hotel_session_tracking.sql`
   - Status: Ready to apply (requires manual `psql` command - see instructions below)
   - Adds session tracking columns to cache tables

2. **Configuration** ✅
   - File: `api/config/tbo-session.config.js`
   - Session TTL: 600 seconds (10 minutes) - configurable
   - Safety buffer: 120 seconds (2 minutes)
   - Estimated checkout: 90 seconds
   - Helper functions for session validation

3. **Hotel Cache Service** ✅
   - File: `api/services/hotelCacheService.js`
   - Enhanced to store session metadata
   - Calculates session status (active/expiring_soon/expired)
   - Returns session info with cached results

4. **Hotels Search Route** ✅
   - File: `api/routes/hotels-search.js`
   - Extracts session metadata from TBO adapter
   - Passes metadata to cache service
   - Returns session info in API response
   - Response format:
     ```json
     {
       "success": true,
       "source": "tbo_live" | "cache_tbo" | "tbo_empty",
       "hotels": [...],
       "cacheHit": true/false,
       "session": {
         "sessionStartedAt": "...",
         "sessionExpiresAt": "...",
         "sessionTtlSeconds": 600,
         "sessionStatus": "active",
         "supplier": "TBO"
       }
     }
     ```

5. **TBO Adapter** ⚠️ MANUAL CHANGES NEEDED
   - File: `api/services/adapters/tboAdapter.js`
   - Changes documented in: `MANUAL_TBOADAPTER_CHANGES.md`
   - Must return `{ hotels, sessionMetadata }` instead of just array
   - 3 specific changes required (see manual changes doc)

### Frontend Components: COMPLETE

1. **Session Timer Component** ✅
   - File: `client/components/HotelSessionTimer.tsx`
   - Shows remaining time with countdown
   - Color-coded status (blue=active, amber=expiring, red=expired)
   - Different messages for live vs cached results
   - Auto-updates every second

---

## 📋 Deployment Checklist

### Step 1: Apply Database Migration

**⚠️ MANUAL ACTION REQUIRED** (psql command not allowed via tool)

```bash
psql $DATABASE_URL -f api/database/migrations/20250610_hotel_session_tracking.sql
```

Or via Render dashboard:
1. Go to your PostgreSQL database in Render
2. Click "Shell" tab
3. Copy-paste the contents of `api/database/migrations/20250610_hotel_session_tracking.sql`
4. Execute

### Step 2: Apply TBO Adapter Changes

**⚠️ MANUAL ACTION REQUIRED** (character encoding issues prevent automated edit)

Open `api/services/adapters/tboAdapter.js` and apply 3 changes documented in `MANUAL_TBOADAPTER_CHANGES.md`:

1. Line 588-591: Update empty results return
2. Line 593-596: Update successful results return  
3. Line 597-606: Update error handler return

### Step 3: Set Environment Variables

Add to Render environment:

```env
TBO_SESSION_TTL_SECONDS=600
TBO_SESSION_SAFETY_BUFFER_SECONDS=120
ESTIMATED_CHECKOUT_FLOW_SECONDS=90
CACHE_SEARCH_TTL_HOURS=4
```

### Step 4: Deploy Code

All modified files are ready to deploy:
- `api/config/tbo-session.config.js` (created)
- `api/services/hotelCacheService.js` (updated)
- `api/routes/hotels-search.js` (updated)
- `client/components/HotelSessionTimer.tsx` (created)

### Step 5: Test Caching Behavior

**Test 1: First Search (TBO Live)**
```powershell
$body = @{
    destination = "Dubai"
    countryCode = "AE"
    checkIn = "2025-07-01"
    checkOut = "2025-07-05"
    rooms = "1"
    adults = "2"
    currency = "INR"
    guestNationality = "IN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://builder-faredown-pricing.onrender.com/api/hotels/search" -Method POST -Body $body -ContentType "application/json"
```

Expected:
- `source: "tbo_live"`
- `cacheHit: false`
- `session.sessionStatus: "active"`
- `session.sessionExpiresAt: <timestamp 10 mins from now>`

**Test 2: Immediate Repeat (Cache Hit)**

Run same command immediately.

Expected:
- `source: "cache_tbo"`
- `cacheHit: true`
- Same `sessionExpiresAt` as first call
- Response time < 1 second

**Verify in Render logs:**
```
First call:
✅ CACHE MISS [uuid] - Calling TBO API
✅ TBO Search SUCCESS - 150 hotels found { traceId: "..." }
✅ Cached search: abc123... with 150 hotels

Second call:
✅ CACHE HIT [uuid] - 150 hotels cached
```

---

## 🎨 Frontend Integration

### Add Session Timer to HotelResults Page

```tsx
// In client/pages/HotelResults.tsx

import HotelSessionTimer from '../components/HotelSessionTimer';

// ... inside component

const [sessionData, setSessionData] = useState(null);
const [source, setSource] = useState('');

// After fetching hotels:
const response = await api.post('/api/hotels/search', searchParams);
setHotels(response.data.hotels);
setSessionData(response.data.session);
setSource(response.data.source);

// In render:
{sessionData && (
  <HotelSessionTimer 
    session={sessionData}
    source={source}
    onSessionExpired={() => {
      // Refresh search when session expires
      handleRefreshSearch();
    }}
  />
)}

{/* Hotel cards below */}
```

### Session-Aware Bargain Flow

```tsx
// Before starting bargain
if (sessionData?.sessionStatus === 'expired') {
  toast.error('Session expired. Refreshing prices...');
  await handleRefreshSearch();
  return;
}

if (sessionData?.sessionStatus === 'expiring_soon') {
  // Show warning but allow bargain
  toast.warning('Session expiring soon. Please complete quickly.');
}

// Pass session data to bargain modal
<ConversationalBargainModal
  hotel={selectedHotel}
  sessionExpiry={sessionData?.sessionExpiresAt}
  onBook={handleBooking}
/>
```

---

## 🧪 Complete Testing Scenarios

### Scenario 1: Caching Works
1. Search Dubai (2025-07-01 to 2025-07-05)
2. Verify `source: "tbo_live"`, `cacheHit: false`
3. Immediately search again with same params
4. Verify `source: "cache_tbo"`, `cacheHit: true`
5. Check response time: < 1s for cached

### Scenario 2: Session Expiry
1. In QA, set `TBO_SESSION_TTL_SECONDS=120` (2 minutes)
2. Search hotels
3. Wait 1 minute → status should be "active"
4. Wait another minute → status should be "expiring_soon"
5. Wait 30 more seconds → status should be "expired"
6. New search should hit TBO again

### Scenario 3: Different Searches Don't Collide
1. Search Dubai (2025-07-01 to 2025-07-05)
2. Search Dubai (2025-07-10 to 2025-07-15) - different dates
3. Verify both are separate cache entries
4. Repeat step 1 → should hit cache
5. Repeat step 2 → should hit cache

### Scenario 4: Session Timer UI
1. Open hotel results page
2. Verify timer shows "Prices locked for 9:XX"
3. Wait 7 minutes → should show "Prices locked for 2:XX" in amber
4. Wait until < 1 min → should show "Hurry, price session expires in 0:XX" in red
5. After expiry → should show "Price session expired" message

---

## 🔄 Bargain Flow Integration (Next Steps)

### Backend: Block Room Validation

```javascript
// api/services/hotelBookingService.js

const tboSessionConfig = require('../config/tbo-session.config');

async function initiateBooking(hotelData, roomData, guestData) {
  const { session } = hotelData;
  
  // 1. Check session is still valid
  if (!tboSessionConfig.isSessionValid(new Date(session.sessionExpiresAt))) {
    return {
      success: false,
      error: 'SESSION_EXPIRED',
      message: 'Price session expired. Please search again.',
    };
  }
  
  // 2. Check if safe to checkout
  if (!tboSessionConfig.isSafeToCheckout(new Date(session.sessionExpiresAt))) {
    return {
      success: false,
      error: 'SESSION_EXPIRING',
      message: 'Not enough time to complete booking. Please search again.',
    };
  }
  
  // 3. Call BlockRoom
  const blockResult = await tboAdapter.blockRoom({
    traceId: session.traceId,
    resultIndex: hotelData.resultIndex,
    hotelCode: hotelData.hotelCode,
    ...roomParams
  });
  
  // 4. Handle price changes
  if (blockResult.IsPriceChanged) {
    return {
      success: false,
      error: 'PRICE_CHANGED',
      oldPrice: hotelData.price,
      newPrice: blockResult.HotelRoomsDetails[0].Price,
      message: 'Supplier updated the price. Please review and confirm.',
    };
  }
  
  // 5. Proceed to Book
  const bookResult = await tboAdapter.bookHotel({
    traceId: session.traceId,
    ...bookParams
  });
  
  return {
    success: true,
    booking: bookResult
  };
}
```

### Frontend: Error Handling

```tsx
try {
  const result = await api.post('/api/hotels/book', bookingData);
  // Success
} catch (error) {
  const errorCode = error.response?.data?.error;
  
  if (errorCode === 'SESSION_EXPIRED') {
    toast.error('Session expired. Refreshing prices...');
    await handleRefreshSearch();
  } else if (errorCode === 'SESSION_EXPIRING') {
    toast.error('Not enough time left. Please search again.');
    await handleRefreshSearch();
  } else if (errorCode === 'PRICE_CHANGED') {
    const { oldPrice, newPrice } = error.response.data;
    // Show price change modal
    setPriceChangeModal({
      show: true,
      oldPrice,
      newPrice,
      message: error.response.data.message
    });
  }
}
```

---

## 📊 Expected Logs

### First Search (TBO Live)
```
🔍 Hotel search [uuid-1] - Hash: a1b2c3d4e5f6...
⚠️ CACHE MISS [uuid-1] - Calling TBO API
[TBO] 🏙️  TBO Static Data Request { destination: "Dubai" }
[TBO] ✅ CityId resolved { destinationId: 115936 }
[TBO] 🔍 TBO Hotel Search Request { cityId: 115936 }
[TBO] 📥 TBO Search Response { hotelCount: 150, traceId: "tbo-abc123" }
✅ TBO returned 150 hotels [uuid-1]
✅ Cached search: a1b2c3... with 150 hotels { traceId: "tbo-abc123", sessionExpiresAt: "2025-06-10T12:10:00Z" }
✅ Search completed in 2345ms [uuid-1]
```

### Second Search (Cache Hit)
```
🔍 Hotel search [uuid-2] - Hash: a1b2c3d4e5f6...
✅ CACHE HIT [uuid-2] - 150 hotels cached
```

---

## ✅ Success Criteria

- [x] Database migration created
- [x] Session config with TTL and buffers
- [x] Cache service stores session metadata
- [x] API returns session info
- [x] Session timer component created
- [ ] Database migration applied (manual)
- [ ] TBO adapter changes applied (manual)
- [ ] Environment variables set
- [ ] Code deployed to Render
- [ ] Caching verified (first=live, second=cache)
- [ ] Session timer shows correctly in UI
- [ ] Frontend integrated with HotelResults page
- [ ] Bargain flow uses session validation
- [ ] BlockRoom called before booking
- [ ] Price changes handled gracefully

---

## 🚀 Next Actions

1. **Apply database migration** (see Step 1 above)
2. **Apply TBO adapter changes** (see `MANUAL_TBOADAPTER_CHANGES.md`)
3. **Deploy and test caching**
4. **Integrate session timer in frontend**
5. **Wire bargain flow session validation**

Once these are complete, the system will:
- Cache hotel searches for instant repeat queries
- Track TBO session validity
- Display countdown timer to users
- Prevent booking failures from expired sessions
- Handle supplier price changes gracefully
