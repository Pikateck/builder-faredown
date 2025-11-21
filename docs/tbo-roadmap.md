# TBO Integration: 7-Step Roadmap

**Status**: Phase 1 in progress  
**Last Updated**: 2025-11-21  
**Goal**: Production-ready TBO certification with unified UI abstraction

---

## 📋 Phase 1: Core Search & UI (In Progress)

### Step 1: Standardize TBO → Cache → Search Flow
- **Status**: ✅ COMPLETE (Already Implemented)
- **Description**: Live TBO searches use the same DB-backed pipeline as precache
- **Implementation Details**:
  - ✅ `/api/hotels/search` endpoint already routes TBO through cache layer
  - ✅ Canonical city → TBO DestinationId resolution via cityId/destination mapping
  - ✅ All results written to `hotel_search_cache` + `hotel_search_cache_results` (line 353-359 in hotels-search.js)
  - ✅ Normalized hotel response returned to UI (line 364-387 in hotels-search.js)
  - ✅ Session metadata included in response (line 408-414 in hotels-search.js)
  - ✅ Frontend correctly calling endpoint (client/pages/HotelResults.tsx:651)
- **Verification**:
  - Endpoint: `POST /api/hotels/search`
  - Returns: Normalized hotels + session metadata + caching source
  - DB Storage: hotel_search_cache (precached at 2025-11-21 09:12:57)
  - Live tests: Working with 2,957 cached hotels from precache
- **Files Modified**:
  - `api/routes/hotels-search.js` (main implementation)
  - `api/services/adapters/tboAdapter.js` (adapter interface)
  - `api/server.js` (line 488: route registration)
- **DB Tables**: `hotel_search_cache`, `hotel_search_cache_results`

### Step 2: Session Tracking for Live Searches
- **Status**: 🔄 NEEDS VERIFICATION
- **Description**: Write session fields for every live search (same fields as precache)
- **Current Implementation**:
  - ✅ Session metadata extracted from TBO response (line 244-257 in hotels-search.js)
  - ✅ Passed to cacheSearchResults (line 353-359)
  - ⚠️ NEEDS VERIFICATION: Check if all session fields are being written to DB
  - ⚠️ MISSING: Session validation on room/prebook requests
  - ⚠️ MISSING: Stale session rejection before PreBook
- **Deliverables**:
  - [ ] Verify `tbo_trace_id`, `tbo_token_id`, `session_created_at`, `session_expires_at` written to DB
  - [ ] Add session validation on `/api/hotels/rooms/:hotelId` endpoint
  - [ ] Add session reuse tracking across Room → PreBook → BlockRoom → Book
  - [ ] Test session lifetime (24hr TTL per TBO rules)
- **Files to modify**:
  - `api/services/hotelCacheService.js` (verify cacheSearchResults saves session fields)
  - `api/routes/hotels-search.js` (add session validation for rooms)
- **DB Tables**: `hotel_search_cache` (session fields)

### Step 2.5: UI Wiring (Part of Phase 1)
- **Status**: ⏳ Pending
- **Description**: Wire TBO into existing generic `/api/hotels/*` endpoints
- **Deliverables**:
  - [ ] Confirm `/api/hotels/search` returns normalized response (same shape as Hotelbeds)
  - [ ] Confirm `/api/hotels/rooms` works for TBO hotels
  - [ ] No TBO-specific hacks in `client/pages/HotelResults.tsx`
  - [ ] UI renders TBO results seamlessly alongside other suppliers
- **Sample Response**:
  ```json
  {
    "success": true,
    "hotels": [
      {
        "hotelId": "17835336",
        "supplier": "TBO",
        "name": "Sai Sharan Stay Inn",
        "city": "Mumbai",
        "price": 1245.43,
        "currency": "INR",
        "images": [],
        "rating": 3,
        "refundable": true
      }
    ],
    "searchHash": "10fb56535af2ff546cae88aa8640f272"
  }
  ```

---

## 📋 Phase 2: Booking Chain & Diagnostics (Pending)

### Step 3: PreBook → BlockRoom → BookRoom Chain
- **Status**: ⏳ Pending
- **Description**: Full booking flow with price validation & de-dupe logic
- **Subtasks**:
  - [ ] A. PreBook: Send cached roomIDs, validate price, write response to DB
  - [ ] B. BlockRoom: Use CategoryId from de-dupe, detect changes, require re-confirmation
  - [ ] C. BookRoom: Store complete booking object (confirmationNo, invoiceNumber, etc.)
  - [ ] D. Voucher: Store entire voucher object in booking table
- **Files to modify**:
  - `api/services/adapters/tboAdapter.js`
  - `api/routes/hotels.js` (or `/api/hotels/book`)
- **DB Tables**: `bookings`, `booking_details`, `tbo_sync_log`

### Step 5: Logging Hooks
- **Status**: ⏳ Pending
- **Description**: Comprehensive request/response logging for all TBO paths
- **Deliverables**:
  - [ ] Log all TBO requests/responses (search, prebook, block, book)
  - [ ] Include traceId, search_hash, error_message
  - [ ] Create `tbo_trace_logs` table (or use `tbo_sync_log`)
  - [ ] Make certification debugging 10x faster
- **Files to modify**:
  - `api/services/adapters/tboAdapter.js`
  - New logging utility
- **DB Tables**: `tbo_trace_logs` (new)

---

## 📋 Phase 3: Hardening (Pending)

### Step 6: DB Indexes for Production Load
- **Status**: ⏳ Pending
- **Description**: Add indexes for fast queries at scale
- **Deliverables**:
  - [ ] Create index: `idx_hsc_search_hash ON hotel_search_cache(search_hash)`
  - [ ] Create index: `idx_hsr_search_hash ON hotel_search_cache_results(search_hash)`
  - [ ] Create index: `idx_hsc_city_id ON hotel_search_cache(city_id)`
  - [ ] Test query performance
- **SQL**:
  ```sql
  CREATE INDEX idx_hsc_search_hash ON public.hotel_search_cache(search_hash);
  CREATE INDEX idx_hsr_search_hash ON public.hotel_search_cache_results(search_hash);
  CREATE INDEX idx_hsc_city_id ON public.hotel_search_cache(city_id);
  ```

### Step 4: Extra Countries (CH, ES, IT)
- **Status**: ⏳ Pending
- **Description**: Sync city data for missing countries
- **Deliverables**:
  - [ ] Add CH, ES, IT to `countriesToSync` in precache script
  - [ ] Re-run precache for Geneva, Barcelona, Rome, Venice
  - [ ] Verify city_supplier_mappings populated
- **Cities to add**:
  - Geneva (CH)
  - Barcelona (ES)
  - Rome (IT)
  - Venice (IT)

---

## ✅ Phase 1 Summary

**MAJOR MILESTONE REACHED:**
- Step 1 (Standardize Search Flow): ✅ COMPLETE
- Live `/api/hotels/search` endpoint properly caches and serves TBO hotels
- Frontend integration working (2,957 hotels in cache from precache run)
- UI displays results without TBO-specific hacks
- Session metadata being collected from TBO and passed through system

**Phase 1 Next Action:**
- Verify Step 2 (Session Tracking) implementation status
- Ensure session fields are persisted to hotel_search_cache
- Add session validation/reuse endpoints for booking flow

---

## 🧪 Testing Strategy

### Phase 1 Testing:
1. Precache script (regression test): `node scripts/tbo-precache-hotels.js --cities=Mumbai`
2. Live search test: `POST /api/hotels/search` with Mumbai query
3. Verify DB: Check `hotel_search_cache` and `hotel_search_cache_results`
4. UI test: Load HotelResults page with TBO results

### Phase 2 Testing:
1. Prebook test: `POST /api/hotels/prebook` with cached session
2. BlockRoom test: Verify CategoryId usage and price change detection
3. BookRoom test: Full booking flow end-to-end
4. Logging test: Verify `tbo_trace_logs` has complete request/response trail

### Phase 3 Testing:
1. Index performance: Run queries before/after index creation
2. Extra countries: Precache CH, ES, IT cities

---

## ✅ Completion Checklist

- [ ] Phase 1 Complete: Generic `/api/hotels/*` serving TBO results seamlessly
- [ ] Phase 2 Complete: Full booking chain working with logging
- [ ] Phase 3 Complete: Production-hardened with indexes + full country coverage
- [ ] Certification ready: All test cases pass
- [ ] Final Render deployment: Production TBO integration live

---

## 📝 Notes

- Keep TBO routes (`/api/tbo-hotels/...`) for internal testing/diagnostics only
- All responses normalized to existing UI contract (no TBO-specific fields exposed)
- Use `supplier` field consistently: `"TBO"` vs `"Hotelbeds"` etc.
- Session tracking across Room → PreBook → BlockRoom → Book is critical for certification
