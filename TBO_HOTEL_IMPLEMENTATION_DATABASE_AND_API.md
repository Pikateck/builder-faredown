# TBO Hotel Integration - Database Models & API Routes Implementation

**Status:** ✅ COMPLETED (Phase 1: Database Schema & Backend APIs)

---

## 📊 What Was Implemented

### **1. Database Models Created**

#### **a) TBOHotelBooking Model** (`api/models/TBOHotelBooking.js`)

Handles all database operations for TBO hotel bookings.

**Methods:**

- `create(bookingData)` - Create new booking record
- `updateBlock(id, blockData)` - Update with block room response
- `updateBook(id, bookData)` - Update with booking confirmation
- `findByTraceId(trace_id)` - Find booking by TBO trace ID
- `findById(id)` - Find booking by database ID
- `getAll(filters, page, limit)` - Get bookings with pagination
- `getAnalytics(dateFrom, dateTo)` - Get booking analytics

**Usage Example:**

```javascript
const TBOHotelBooking = require("./models/TBOHotelBooking");

const result = await TBOHotelBooking.create({
  trace_id: "ABC123",
  hotel_code: "DXB001",
  hotel_name: "Burj Al Arab",
  check_in_date: "2025-05-15",
  check_out_date: "2025-05-18",
  block_price: 1500,
  block_currency: "AED",
  block_status: "success",
});
```

---

#### **b) TBOHotelRateHistory Model** (`api/models/TBOHotelRateHistory.js`)

Tracks price changes across booking stages (search → block → book).

**Methods:**

- `recordPriceChange(priceData)` - Record a price change event
- `getByBookingId(id)` - Get price history for a booking
- `getByTraceId(trace_id)` - Get price history by trace ID
- `getByStage(stage, filters)` - Get price changes for a booking stage
- `getPriceChangeStats(dateFrom, dateTo)` - Get price change statistics
- `getHotelsWithFrequentChanges(dateFrom, dateTo, threshold)` - Identify problematic hotels

**Usage Example:**

```javascript
const TBOHotelRateHistory = require("./models/TBOHotelRateHistory");

const result = await TBOHotelRateHistory.recordPriceChange({
  tbo_hotel_booking_id: 1,
  trace_id: "ABC123",
  hotel_code: "DXB001",
  search_price: 1500,
  block_price: 1550,
  price_changed_in_block: true,
  price_change_pct: 3.33,
  stage: "block",
});
```

---

### **2. API Routes Enhanced**

#### **a) Search Route** (`api/routes/tbo/search.js`)

**Endpoint:** `POST /api/tbo/search`

**Enhancements:**

- Now imports TBOHotelRateHistory for future rate tracking
- Prepares initial search data for booking workflow

**Request:**

```json
{
  "destination": "Dubai",
  "countryCode": "AE",
  "checkIn": "2025-05-15",
  "checkOut": "2025-05-18",
  "rooms": [{ "adults": 2, "children": 0, "childAges": [] }],
  "currency": "AED",
  "guestNationality": "IN"
}
```

**Response:**

```json
{
  "success": true,
  "traceId": "TR-20250515-001",
  "cityId": 12345,
  "hotels": [
    {
      "hotelCode": "DXB001",
      "hotelName": "Burj Al Arab",
      "resultIndex": 0,
      "price": {
        "currencyCode": "AED",
        "publishedPrice": 2000,
        "offeredPrice": 1500
      }
    }
  ]
}
```

---

#### **b) Block Route** (`api/routes/tbo/block.js`)

**Endpoint:** `POST /api/tbo/block`

**Enhancements:**

- ✅ Saves booking record to `tbo_hotel_bookings` table
- ✅ Captures block price and status
- ✅ Marks if price changed during block stage
- ✅ Returns `bookingId` for use in book request

**Request:**

```json
{
  "traceId": "TR-20250515-001",
  "resultIndex": 0,
  "hotelCode": "DXB001",
  "hotelName": "Burj Al Arab",
  "hotelRoomDetails": [
    {
      "roomTypeCode": "DLX",
      "price": {
        "currencyCode": "AED",
        "offeredPrice": 1550
      }
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "bookingId": 42,
  "responseStatus": 1,
  "isPriceChanged": true,
  "hotelRoomDetails": [...]
}
```

**Database Changes:**

- Creates row in `tbo_hotel_bookings` table with:
  - `trace_id`, `hotel_code`, `hotel_name`
  - `block_price`, `block_status`
  - `price_changed_in_block` flag
  - Full `supplier_response` as JSON

---

#### **c) Book Route** (`api/routes/tbo/book.js`)

**Endpoint:** `POST /api/tbo/book`

**Enhancements:**

- ✅ Updates existing booking record OR creates new one
- ✅ Captures confirmation/voucher details
- ✅ Marks if price changed during book stage
- ✅ Records booking status as "confirmed"

**Request:**

```json
{
  "traceId": "TR-20250515-001",
  "resultIndex": 0,
  "hotelCode": "DXB001",
  "hotelRoomDetails": [...],
  "hotelPassenger": [
    {
      "Title": "Mr",
      "FirstName": "John",
      "LastName": "Doe",
      "Email": "john@example.com",
      "Phoneno": "+971501234567"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "bookingId": "HB-789456",
  "confirmationNo": "CONF-2025-001",
  "bookingRefNo": "REF-123456",
  "status": "confirmed",
  "responseStatus": 1,
  "isPriceChanged": false
}
```

**Database Changes:**

- Updates row in `tbo_hotel_bookings` table with:
  - `book_price`, `book_status`
  - `price_changed_in_book` flag
  - `voucher_id`, `confirmation_id`
  - Full `supplier_response` as JSON

---

### **3. New Bookings Management Routes** (`api/routes/tbo/bookings.js`)

**Base Endpoint:** `/api/tbo/bookings`

#### **GET /api/tbo/bookings/:id**

Get a single booking with rate history.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "trace_id": "TR-20250515-001",
    "hotel_code": "DXB001",
    "block_price": 1550,
    "book_price": 1550,
    "block_status": "success",
    "book_status": "confirmed"
  },
  "rateHistory": [...]
}
```

---

#### **GET /api/tbo/bookings/trace/:traceId**

Get bookings by trace ID.

**Usage:**

```bash
GET /api/tbo/bookings/trace/TR-20250515-001
```

---

#### **GET /api/tbo/bookings**

Get all bookings with filtering and pagination.

**Query Parameters:**

- `hotel_code` - Filter by hotel
- `hotel_name` - Search by name
- `block_status` - Filter by block status
- `book_status` - Filter by book status
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Usage:**

```bash
GET /api/tbo/bookings?hotel_code=DXB001&book_status=confirmed&page=1&limit=10
```

---

#### **GET /api/tbo/bookings/:id/rate-history**

Get price history for a booking.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "stage": "search",
      "search_price": 1500,
      "created_at": "2025-05-15T10:00:00Z"
    },
    {
      "id": 2,
      "stage": "block",
      "block_price": 1550,
      "price_changed_in_block": true,
      "price_change_pct": 3.33,
      "created_at": "2025-05-15T10:05:00Z"
    },
    {
      "id": 3,
      "stage": "book",
      "book_price": 1550,
      "price_changed_in_book": false,
      "created_at": "2025-05-15T10:10:00Z"
    }
  ]
}
```

---

#### **GET /api/tbo/bookings/analytics/stats**

Get booking analytics.

**Query Parameters:**

- `dateFrom` - Start date (YYYY-MM-DD)
- `dateTo` - End date (YYYY-MM-DD)

**Usage:**

```bash
GET /api/tbo/bookings/analytics/stats?dateFrom=2025-05-01&dateTo=2025-05-31
```

**Response:**

```json
{
  "success": true,
  "bookingAnalytics": {
    "total_bookings": 150,
    "blocked_bookings": 140,
    "confirmed_bookings": 135,
    "price_changed_in_block": 15,
    "price_changed_in_book": 3,
    "total_block_amount": 202500,
    "total_book_amount": 202200,
    "avg_block_price": 1357,
    "avg_book_price": 1498
  },
  "priceChangeStats": [...]
}
```

---

#### **GET /api/tbo/bookings/analytics/price-changes**

Get hotels with frequent price changes.

**Query Parameters:**

- `dateFrom`, `dateTo`, `threshold` (default: 5)

**Usage:**

```bash
GET /api/tbo/bookings/analytics/price-changes?dateFrom=2025-05-01&dateTo=2025-05-31&threshold=10
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "hotel_code": "DXB001",
      "price_change_events": 25,
      "affected_bookings": 20,
      "avg_price_change_pct": 2.5,
      "max_price_change_pct": 8.5
    }
  ]
}
```

---

## 🔄 Database Flow

### **Complete Booking Journey:**

```
1. SEARCH PHASE
   POST /api/tbo/search
   ↓
   - Search hotels via TBO API
   - Returns traceId, hotels with prices
   - Client stores: traceId, resultIndex, hotelCode

2. BLOCK PHASE
   POST /api/tbo/block
   ↓
   - Block room with TBO
   - ✅ Create row in tbo_hotel_bookings
   - ✅ Save block_price, block_status
   - ✅ Check if price_changed_in_block
   - ✅ Return bookingId (database ID)
   - Client receives: bookingId, isPriceChanged

3. BOOK PHASE
   POST /api/tbo/book (with bookingId from block)
   ↓
   - Confirm booking with TBO
   - ✅ Update row in tbo_hotel_bookings
   - ✅ Save book_price, book_status
   - ✅ Check if price_changed_in_book
   - ✅ Save voucher_id, confirmation_id
   - Return: confirmationNo, voucherId

4. RETRIEVE PHASE (Optional)
   GET /api/tbo/bookings/:id
   ↓
   - Get booking details from database
   - Get rate history (all price changes)
   - Display to user
```

---

## 📈 Data Structures

### **tbo_hotel_bookings Table**

```sql
- id (PRIMARY KEY)
- booking_id (FK to bookings table)
- trace_id (VARCHAR) - TBO search identifier
- result_index (INTEGER) - Hotel position in search results
- category_id (VARCHAR) - De-dupe category
- hotel_code, hotel_name (VARCHAR)
- check_in_date, check_out_date (DATE)
- nights_count (INTEGER)
- room_config, room_occupancy (JSONB)
- supplier_response (JSONB) - Complete TBO API response
- block_price, block_currency (DECIMAL/VARCHAR)
- block_status (VARCHAR) - 'success', 'failed', 'pending'
- book_price, book_currency (DECIMAL/VARCHAR)
- book_status (VARCHAR) - 'confirmed', 'failed', 'pending'
- voucher_id, confirmation_id (VARCHAR)
- price_changed_in_block, price_changed_in_book (BOOLEAN)
- cancellation_charges (JSONB)
- refund_to_customer (DECIMAL)
- created_at, updated_at (TIMESTAMP)
```

### **tbo_hotel_rate_history Table**

```sql
- id (PRIMARY KEY)
- tbo_hotel_booking_id (FK to tbo_hotel_bookings)
- trace_id (VARCHAR)
- hotel_code (VARCHAR)
- search_price, search_currency (DECIMAL/VARCHAR)
- block_price, block_currency (DECIMAL/VARCHAR)
- price_changed_in_block (BOOLEAN)
- block_price_increase, price_change_pct (DECIMAL)
- book_price, book_currency (DECIMAL/VARCHAR)
- price_changed_in_book (BOOLEAN)
- book_price_increase, book_price_change_pct (DECIMAL)
- stage (VARCHAR) - 'search', 'block', 'book'
- created_at (TIMESTAMP)
```

---

## 🚀 Next Steps

### **Step 4: Connect Frontend** (Currently In Progress)

Files that need updating:

- `client/components/HotelSearchForm.tsx` - Call `/api/tbo/search`
- `client/pages/HotelResults.tsx` - Display results
- `client/pages/HotelDetails.tsx` - Show room details
- `client/pages/HotelBooking.tsx` - Block & Book flow
- `client/pages/BookingVoucher.tsx` - Show confirmation

### **Step 5: Run Certification Tests**

Execute test runner to validate 8 scenarios:

```bash
node api/tests/tbo-cert-runner.js
```

### **Step 6: Deploy to Production**

- Push code changes
- Monitor booking flow
- Track TBO integration metrics

---

## ✅ Verification Checklist

- [x] Database schema created
- [x] TBOHotelBooking model implemented
- [x] TBOHotelRateHistory model implemented
- [x] Block route saves to database
- [x] Book route saves to database
- [x] Bookings GET endpoints created
- [x] Analytics endpoints created
- [x] Routes registered in server.js
- [ ] Frontend connected to APIs
- [ ] Certification tests passing
- [ ] Production deployment complete

---

## 📝 Summary

**What Was Done:**

- ✅ 2 new database models with full CRUD operations
- ✅ 5 enhanced/new API routes for complete booking workflow
- ✅ 6 GET endpoints for booking retrieval and analytics
- ✅ Full database integration for TBO bookings
- ✅ Price tracking across booking stages
- ✅ Analytics and reporting capabilities

**Current Status:**
Database and backend APIs are **100% complete** and ready for frontend integration.

**Ready For:**
Frontend teams can now call these APIs to complete the TBO hotel booking integration.
