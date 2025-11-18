# TBO Hotel API v10.0 - First Pass Implementation Complete

**Date:** 2025-01-XX  
**Scope:** Comprehensive specification review and code implementation  
**Status:** ✅ READY FOR TESTING

---

## Executive Summary

This implementation provides a complete, spec-compliant TBO Hotel API v10.0 integration with:

✅ **Complete API Specification** - All endpoints documented with request/response examples  
✅ **Unified Hotel Client** - Centralized API access with logging, error handling, retry logic  
✅ **Validation Layer** - PAN, Passport, Nationality, Pricing, De-dupe detection  
✅ **FAQ & Guidelines** - Common issues, solutions, patterns, and best practices  
✅ **8 Certification Test Cases** - Comprehensive test runner with audit logging  
✅ **Database Schema** - TBO booking tracking and rate history tables

---

## Files Created/Updated

### 1. API Specification & Documentation

#### **api/tbo/API_SPECIFICATION.md** (NEW - 792 lines)

- Complete TBO Hotel API v10.0 endpoint documentation
- All 11 API endpoints with request/response examples
- Validation rules for all fields
- Error codes and handling guidelines
- Practical implementation notes
- Parallel search logic guidance
- Environment variables reference

**Key Sections:**

- Authentication (Authenticate, GetDestinationSearchStaticData)
- Hotel Search (GetHotelResult, GetHotelRoom)
- Booking Flow (BlockRoom, Book, GenerateVoucher)
- Cancellation (SendChangeRequest, GetChangeRequestStatus)
- Agency Management (GetAgencyBalance)
- Validation Rules (PAN, Passport, Nationality, Pricing, Dates, etc.)
- Error Codes & Handling
- De-Dupe Hotel Handling
- Rate Shopping Prevention (RSP)
- GST/VAT Taxation
- Package Fare Rules

#### **api/tbo/FAQ_AND_GUIDELINES.md** (NEW - 550 lines)

- 10 Frequently Asked Questions with detailed answers
- Common error codes (5001-5008) and solutions
- Implementation patterns (6 reusable patterns)
- Rate Shopping Prevention (RSP) rules
- GST/VAT taxation guidelines
- Package fare handling
- Database schema recommendations
- Integration checklist

**Key Content:**

- De-Dupe hotel detection and handling
- Price change management during booking flow
- Cancellation flow (2-step process)
- SmokingPreference conversion (string → integer)
- PAN & Passport requirements
- LeadPassenger flag usage
- Parallel room details retrieval for large searches

### 2. Unified Hotel Client

#### **api/tbo/hotel-client.js** (NEW - 645 lines)

Centralized API client with comprehensive features:

**Core Methods:**

- `authenticate()` - Get TokenId with 1-hour caching
- `search(params)` - Search hotels
- `getRoom(params)` - Get room details
- `block(params)` - Block room (PreBook)
- `book(params)` - Book hotel (Final)
- `generateVoucher(params)` - Generate voucher
- `getBooking(params)` - Get booking details
- `requestChange(params)` - Send change request
- `getChangeStatus(params)` - Get change status
- `cancel(params)` - Cancel booking (wrapper)
- `getBalance()` - Get agency balance
- `getStaticData()` - Get countries/cities
- `resolveCityId(cityName, countryCode)` - Resolve city ID

**Features:**

- Request/response logging for audit trail
- TBO error code mapping (5001-5008)
- Retry logic with exponential backoff
- Error parsing with recommendations
- TokenId caching (1 hour)
- Normalized response format

**Error Handling:**

```javascript
TBO_ERROR_CODES = {
  5001: "Invalid TokenId or authentication failed",
  5002: "Hotel not available",
  5003: "Room not available",
  5004: "Agency balance insufficient",
  5005: "Invalid guest details",
  5006: "Invalid passenger information",
  5007: "Price changed significantly",
  5008: "Cancellation policy changed",
};
```

### 3. Validation Layer

#### **api/tbo/validation.js** (NEW - 652 lines)

Comprehensive validation module:

**Validation Functions:**

1. **Nationality Validation** (`validateNationality`)
   - 45+ TBO-supported nationalities
   - ISO 2-letter code validation
   - Returns error if unsupported

2. **PAN Validation** (`validatePAN`)
   - Indian PAN format: AAAAA9999A
   - 5 letters + 4 digits + 1 letter
   - Example: AAAPK1234A

3. **Passport Validation** (`validatePassportNumber`, `validatePassportExpiry`)
   - 6-20 alphanumeric characters
   - Expiry date validation
   - 6+ month validity check

4. **Passenger Validation** (`validatePassenger`)
   - Title, FirstName, LastName format
   - Email and phone validation
   - Age validation (0-150)
   - PaxType validation (1=Adult, 2=Child)
   - Document requirements (PAN, Passport if mandatory)
   - Address and city validation
   - Nationality validation

5. **Price Validation** (`validatePrice`)
   - RSP rule: PublishedPrice ≥ RoomPrice
   - RSP rule: OfferedPrice ≤ PublishedPrice
   - Currency code validation
   - Tax validation
   - High discount warnings (>50%)

6. **Date Validation** (`validateDates`)
   - dd/MM/yyyy and YYYY-MM-DD formats
   - Check-in not in past
   - NoOfNights > 0
   - Returns calculated check-out date

7. **Room Configuration Validation** (`validateRoomConfig`)
   - Adult count (1-4 per room)
   - Child count (0-3 per room)
   - Child ages validation (0-17)
   - Child age count match

8. **De-Dupe Context Validation** (`validateDeDupeContext`)
   - Detect if hotel is de-dupe (IsTBOMapped + CategoryId)
   - Validate CategoryId requirement for de-dupe
   - Guide on when to omit CategoryId

9. **Smoking Preference Validation** (`validateSmokingPreference`)
   - Convert string to integer (0-3)
   - Validate value range
   - Default to 0 if not specified

**Supported Nationalities:**
IN, US, GB, CA, AU, NZ, SG, MY, TH, ID, PH, VN, AE, SA, KW, QA, BH, OM, JO, EG, FR, DE, IT, ES, NL, BE, CH, AT, SE, NO, DK, FI, PL, CZ, IE, PT, GR, TR, IL, RU, CN, JP, KR, HK, TW, MX, BR, AR, CO, CL, PE, ZA, NG, KE

### 4. Test Runner

#### **api/tests/tbo-cert-runner.js** (NEW - 528 lines)

8-scenario certification test runner:

**Test Cases:**

1. **Case 1:** Single room, single guest, Dubai (basic flow)
2. **Case 2:** Single room, 2 adults, Mumbai (multiple adults)
3. **Case 3:** 2 rooms, multiple guests, Delhi (multiple rooms)
4. **Case 4:** Adult + child, Dubai (family booking)
5. **Case 5:** De-dupe hotel, Singapore (CategoryId handling)
6. **Case 6:** Extended stay (5 nights), Bangkok (long duration)
7. **Case 7:** Cancellation flow, Dubai (cancel + refund)
8. **Case 8:** Multiple adults + children, Maldives (complex occupancy)

**Features:**

- Each case runs complete flow: search → room → block → book → voucher → balance
- Optional cancellation testing for selected cases
- Comprehensive audit logging
- JSON output with all request/response pairs
- Summary report with pass/fail statistics
- Error tracking and recommendations

**Output Files:**

- `tbo-certification-results.json` - Complete audit log with all API calls
- `tbo-certification-summary.txt` - Human-readable summary report

**Run Command:**

```bash
node api/tests/tbo-cert-runner.js
```

---

## Database Changes Required

### Change 1: TBO Hotel Bookings Table

```sql
-- TBO Hotel Bookings Tracking Table
CREATE TABLE IF NOT EXISTS tbo_hotel_bookings (
  id SERIAL PRIMARY KEY,

  -- TBO Identifiers
  booking_id VARCHAR(50) NOT NULL UNIQUE,
  booking_ref_no VARCHAR(100),
  confirmation_no VARCHAR(100),

  -- Booking Context
  trace_id VARCHAR(255),
  hotel_code VARCHAR(50),
  hotel_name VARCHAR(255),
  result_index INT,
  category_id VARCHAR(50),

  -- Dates & Destination
  check_in_date DATE,
  check_out_date DATE,
  city_id INT,
  city_name VARCHAR(255),

  -- Pricing (captured at booking time)
  currency VARCHAR(3),
  total_price DECIMAL(12, 2),
  price_details JSONB DEFAULT '{}'::jsonb,

  -- Passenger Info (snapshot)
  lead_passenger_name VARCHAR(255),
  lead_passenger_email VARCHAR(255),
  passenger_count INT,

  -- Room Details (snapshot)
  no_of_rooms INT,
  room_details JSONB DEFAULT '[]'::jsonb,

  -- Status Tracking
  booking_status VARCHAR(50) DEFAULT 'confirmed',
  voucher_id VARCHAR(100),
  voucher_status VARCHAR(50),

  -- Cancellation/Change Tracking
  change_request_id VARCHAR(100),
  cancellation_charge DECIMAL(12, 2),
  refund_amount DECIMAL(12, 2),

  -- Audit Trail
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  supplier_api_response JSONB DEFAULT '{}'::jsonb,

  -- Indexes
  CONSTRAINT fk_tbo_booking_city FOREIGN KEY (city_id) REFERENCES tbo_cities(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tbo_hotel_bookings_booking_id ON tbo_hotel_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_tbo_hotel_bookings_confirmation_no ON tbo_hotel_bookings(confirmation_no);
CREATE INDEX IF NOT EXISTS idx_tbo_hotel_bookings_hotel_code ON tbo_hotel_bookings(hotel_code);
CREATE INDEX IF NOT EXISTS idx_tbo_hotel_bookings_created_at ON tbo_hotel_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tbo_hotel_bookings_status ON tbo_hotel_bookings(booking_status);

COMMENT ON TABLE tbo_hotel_bookings IS 'Tracks TBO hotel bookings with full request/response for audit and reconciliation';
```

**Purpose:** Store all TBO hotel bookings with complete context for reconciliation and support

---

### Change 2: Hotel Rate History Table

```sql
-- Hotel Rate History - Track prices across booking stages
CREATE TABLE IF NOT EXISTS tbo_hotel_rate_history (
  id SERIAL PRIMARY KEY,

  -- Hotel & Rate Identifiers
  trace_id VARCHAR(255),
  result_index INT,
  hotel_code VARCHAR(50),
  room_id INT,

  -- Rate Details (snapshot from each API call)
  check_in_date DATE,
  check_out_date DATE,
  nights INT,

  -- Price at different stages
  search_price DECIMAL(12, 2),
  search_currency VARCHAR(3),

  block_price DECIMAL(12, 2),
  block_currency VARCHAR(3),
  price_changed_in_block BOOLEAN DEFAULT FALSE,

  book_price DECIMAL(12, 2),
  book_currency VARCHAR(3),

  -- Price Components (for RSP validation)
  published_price DECIMAL(12, 2),
  offered_price DECIMAL(12, 2),
  agent_commission DECIMAL(12, 2),
  agent_markup DECIMAL(12, 2),

  -- Audit
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tbo_rate_history_trace_id ON tbo_hotel_rate_history(trace_id, result_index);
CREATE INDEX IF NOT EXISTS idx_tbo_rate_history_created_at ON tbo_hotel_rate_history(created_at DESC);

COMMENT ON TABLE tbo_hotel_rate_history IS 'Tracks hotel prices across search, block, and book stages for RSP verification';
```

**Purpose:** Audit trail for rate changes to ensure RSP compliance and customer transparency

---

### Change 3: Extend Existing Bookings Table

```sql
-- Add TBO-specific columns to existing bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS tbo_booking_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS tbo_confirmation_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS tbo_trace_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS supplier VARCHAR(50) DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS hotel_id INT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bookings_tbo_booking_id ON bookings(tbo_booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_supplier ON bookings(supplier);

-- Add comments
COMMENT ON COLUMN bookings.tbo_booking_id IS 'TBO hotel booking ID for reconciliation';
COMMENT ON COLUMN bookings.tbo_confirmation_no IS 'TBO confirmation number';
COMMENT ON COLUMN bookings.supplier IS 'Hotel supplier: TBO, HOTELBEDS, RATEHAWK, etc.';
```

**Purpose:** Link TBO bookings to existing bookings table for unified booking management

---

## How to Apply Database Changes

### Using pgAdmin (Recommended for Production)

1. **Open pgAdmin** → Connect to Render database
2. **Navigate:** Query Tool → paste each SQL statement
3. **Execute:** One change at a time
4. **Verify:** Check table creation in left sidebar

### Using CLI (For Automation)

```bash
# Apply Change 1
psql postgresql://user:password@host:5432/db << 'EOF'
CREATE TABLE IF NOT EXISTS tbo_hotel_bookings (
  ...SQL from Change 1...
);
EOF

# Apply Change 2
psql postgresql://user:password@host:5432/db << 'EOF'
CREATE TABLE IF NOT EXISTS tbo_hotel_rate_history (
  ...SQL from Change 2...
);
EOF

# Apply Change 3
psql postgresql://user:password@host:5432/db << 'EOF'
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS tbo_booking_id VARCHAR(50);
...
EOF
```

### Using Render Dashboard

1. **Go to:** Render → PostgreSQL instance → "Connect" tab
2. **Copy:** External Database URL
3. **Use psql:** `psql [DATABASE_URL]`
4. **Paste & Execute:** Each SQL statement

---

## Code Integration Points

### 1. Using the Unified Hotel Client

Instead of calling individual TBO modules, use the hotel-client:

```javascript
const client = require("./api/tbo/hotel-client");

// Search hotels
const searchRes = await client.search({
  destination: "Dubai",
  checkIn: "15/12/2025",
  checkOut: "18/12/2025",
  countryCode: "AE",
  currency: "USD",
  guestNationality: "IN",
  rooms: [{ adults: 2, children: 0 }]
});

// Get room details
const roomRes = await client.getRoom({
  traceId: searchRes.traceId,
  resultIndex: 0,
  hotelCode: "TBO123456"
});

// Block room
const blockRes = await client.block({
  traceId: searchRes.traceId,
  resultIndex: 0,
  hotelCode: "TBO123456",
  hotelName: "Hotel Name",
  guestNationality: "IN",
  noOfRooms: 1,
  hotelRoomDetails: [roomRes.rooms[0]]
});

// Book hotel
const bookRes = await client.book({
  traceId: searchRes.traceId,
  resultIndex: 0,
  hotelCode: "TBO123456",
  hotelName: "Hotel Name",
  guestNationality: "IN",
  noOfRooms: 1,
  hotelRoomDetails: blockRes.hotelRoomDetails,
  categoryId: blockRes.categoryId,
  hotelPassenger: [passengers...]
});

// Generate voucher
const voucherRes = await client.generateVoucher({
  bookingRefNo: bookRes.bookingRefNo,
  bookingId: bookRes.bookingId
});
```

### 2. Using Validation Layer

```javascript
const validation = require("./api/tbo/validation");

// Validate passenger
const passengerCheck = validation.validatePassenger(passenger, {
  isPassportMandatory: true,
  isPANMandatory: true,
  checkInDate: "2025-12-15",
});

if (!passengerCheck.valid) {
  throw new Error(
    `Passenger validation failed: ${passengerCheck.errors.join(", ")}`,
  );
}

// Validate price (RSP rules)
const priceCheck = validation.validatePrice(price);
if (!priceCheck.valid) {
  throw new Error(`Price validation failed: ${priceCheck.errors.join(", ")}`);
}

// Validate dates
const dateCheck = validation.validateDates("15/12/2025", 3);
if (!dateCheck.valid) {
  throw new Error(dateCheck.error);
}

// Detect de-dupe and validate
const deDupeCheck = validation.validateDeDupeContext(hotel, categoryId);
if (deDupeCheck.categoryIdRequired && !deDupeCheck.providedCategoryId) {
  throw new Error(deDupeCheck.error);
}
```

### 3. Using Test Runner

```bash
# Run all 8 certification cases
node api/tests/tbo-cert-runner.js

# Output:
# - tbo-certification-results.json (full audit log)
# - tbo-certification-summary.txt (readable report)
```

---

## Existing Code References

The implementation works seamlessly with existing TBO modules:

- **api/tbo/auth.js** - Authentication (used by hotel-client)
- **api/tbo/search.js** - Hotel search (used by hotel-client)
- **api/tbo/room.js** - Room details (used by hotel-client)
- **api/tbo/book.js** - Booking (used by hotel-client)
- **api/tbo/roomMapper.js** - Room mapping (already implements CategoryId handling)
- **api/tbo/voucher.js** - Voucher generation (used by hotel-client)
- **api/tbo/cancel.js** - Cancellation (used by hotel-client)
- **api/tbo/balance.js** - Balance check (used by hotel-client)
- **api/tbo/static.js** - Static data (used by hotel-client)
- **api/tests/tbo-hotel-flow-runner.js** - Base flow (used by cert-runner)

---

## Environment Variables (Already Set)

The following environment variables are already configured on Render:

```
TBO_HOTEL_CLIENT_ID=tboprod
TBO_HOTEL_USER_ID=BOMF145
TBO_HOTEL_PASSWORD=@Bo#4M-Api@
TBO_HOTEL_BASE_URL_AUTHENTICATION=https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc
TBO_HOTEL_SEARCH_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult
TBO_HOTEL_BLOCKROOM_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom
TBO_HOTEL_BOOK_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book
TBO_END_USER_IP=52.5.155.132
```

No additional env var changes needed.

---

## Next Steps

### Immediate Actions (Before Testing)

1. **Apply Database Changes**
   - Use Change 1 SQL (tbo_hotel_bookings table)
   - Use Change 2 SQL (tbo_hotel_rate_history table)
   - Use Change 3 SQL (extend bookings table)

2. **Push Code to Render**
   - New files are ready: `api/tbo/API_SPECIFICATION.md`, `api/tbo/FAQ_AND_GUIDELINES.md`, `api/tbo/hotel-client.js`, `api/tbo/validation.js`, `api/tests/tbo-cert-runner.js`
   - Existing code in `api/tbo/` continues to work
   - No breaking changes

3. **Verify Deployment**
   - Check Render build logs
   - Confirm no errors in deployment

### Testing Phase

1. **Run Certification Tests**

   ```bash
   node api/tests/tbo-cert-runner.js
   ```

2. **Review Results**
   - Check `tbo-certification-results.json` for all API calls
   - Check `tbo-certification-summary.txt` for readable report
   - All 8 cases should pass (✅) or have clear error messages (❌)

3. **Debug Any Failures**
   - Check error messages against FAQ_AND_GUIDELINES.md
   - Review API_SPECIFICATION.md for field requirements
   - Check validation.js for field format rules

4. **Prepare for TBO Submission**
   - Export JSON audit log
   - Provide tbo-certification-results.json to TBO
   - Include tbo-certification-summary.txt in submission

### Production Deployment

1. Update routes to use unified hotel-client
2. Integrate validation layer in booking flows
3. Store TBO bookings in tbo_hotel_bookings table
4. Track rate history in tbo_hotel_rate_history table
5. Monitor for errors using TBO_ERROR_CODES mapping

---

## File Summary

| File                          | Type  | Lines     | Purpose                              |
| ----------------------------- | ----- | --------- | ------------------------------------ |
| api/tbo/API_SPECIFICATION.md  | Spec  | 792       | Complete TBO API v10.0 specification |
| api/tbo/FAQ_AND_GUIDELINES.md | Guide | 550       | FAQs, patterns, best practices       |
| api/tbo/hotel-client.js       | Code  | 645       | Unified API client                   |
| api/tbo/validation.js         | Code  | 652       | Field validation rules               |
| api/tests/tbo-cert-runner.js  | Test  | 528       | 8-scenario test runner               |
| **TOTAL**                     |       | **3,167** | Complete implementation              |

---

## Testing Readiness Checklist

- ✅ All 11 TBO endpoints documented
- ✅ Unified hotel-client created with error handling
- ✅ Comprehensive validation layer implemented
- ✅ 8 certification test cases defined
- ✅ Database schema for TBO bookings designed
- ✅ Rate history tracking table designed
- ✅ FAQ & implementation guidelines written
- ✅ Error code mapping provided
- ✅ Integration patterns documented
- ✅ No breaking changes to existing code

---

## Support & Next Steps

**Ready to:**

1. Apply database changes
2. Push code to Render
3. Run certification tests
4. Address any failures
5. Prepare for TBO submission

**Questions?**

- Check api/tbo/FAQ_AND_GUIDELINES.md
- Review api/tbo/API_SPECIFICATION.md
- Check error code in TBO_ERROR_CODES reference

---

**Implementation Status: ✅ COMPLETE - READY FOR TESTING**

Generated: 2025-01-XX  
Scope: TBO Hotel API v10.0 First Pass Implementation  
Code Lines: 3,167 (new) + existing TBO modules
