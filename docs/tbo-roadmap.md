# TBO Integration: 7-Step Roadmap

**Status**: Phase 1 in progress  
**Last Updated**: 2025-11-21  
**Goal**: Production-ready TBO certification with unified UI abstraction

---

## 📋 Phase 1: Core Search & UI (In Progress)

### Step 1: Standardize TBO → Cache → Search Flow
- **Status**: 🔄 In Progress
- **Description**: Live TBO searches must use the same DB-backed pipeline as precache
- **Deliverables**:
  - [ ] Modify `/api/hotels/search` to route TBO through cache layer
  - [ ] Ensure canonical city → TBO DestinationId resolution via `city_supplier_mappings`
  - [ ] Write all results to `hotel_search_cache` + `hotel_search_cache_results`
  - [ ] Return normalized hotel response to UI
  - [ ] Test with precache script (verify no regressions)
  - [ ] Sample endpoint test: `POST /api/hotels/search` with Mumbai
- **Files to modify**:
  - `api/routes/hotels.js` (or equivalent generic endpoint)
  - `api/services/adapters/tboAdapter.js`
  - `api/services/adapters/supplierAdapterManager.js`
- **DB Tables**: `hotel_search_cache`, `hotel_search_cache_results`, `city_supplier_mappings`

### Step 2: Session Tracking for Live Searches
- **Status**: ⏳ Pending
- **Description**: Write session fields for every live search (same fields as precache)
- **Deliverables**:
  - [ ] Write `tbo_trace_id`, `tbo_token_id`, `session_creation_time`, etc. for each search
  - [ ] Validate session on room/prebook requests
  - [ ] Reject stale sessions before PreBook
  - [ ] Test session reuse across Room → PreBook → BlockRoom → Book
- **Files to modify**:
  - `api/services/adapters/tboAdapter.js`
  - `api/routes/hotels.js`
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
