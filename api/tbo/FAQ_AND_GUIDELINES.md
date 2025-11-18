# TBO Hotel API - FAQ & Implementation Guidelines

## Frequently Asked Questions

### 1. What is the difference between TokenId and BookingRefNo?

**TokenId**

- Short-lived authentication token
- Valid for 24 hours
- Used for all API calls after initial authentication
- Must be included in every request except initial Authenticate call

**BookingRefNo**

- Long-term booking reference number
- Valid for the lifetime of the booking
- Format: Example "TBO20251215123456"
- Used to retrieve, modify, or cancel a booking
- Shared with customer for reference

### 2. What is CategoryId and when is it required?

**CategoryId** is required ONLY for de-dupe hotels (multi-supplier mapped hotels).

**De-Dupe Detection:**

```javascript
if (hotel.IsTBOMapped === true && hotel.CategoryId) {
  // This is a de-dupe hotel - CategoryId REQUIRED in BlockRoom/Book
} else {
  // Non-de-dupe hotel - DO NOT send CategoryId
}
```

**Action:**

- **De-Dupe**: Include CategoryId at root level in BlockRoom and Book requests
- **Non-De-Dupe**: Omit CategoryId from requests

### 3. Why did my BlockRoom price differ from Search price?

This is expected behavior. Prices may change due to:

1. **Availability changes** - Other bookings reducing inventory
2. **Rate plan changes** - Hotel updating rates in real-time
3. **Currency fluctuations** - Exchange rate changes
4. **Promotion expiry** - Limited-time offers ending

**Action:**

- Check `IsPriceChanged` flag in BlockRoom response
- If true, retrieve updated prices from HotelRoomDetails in BlockRoom response
- Use updated prices in subsequent Book call
- Notify customer of price change and get approval

### 4. What does SmokingPreference field mean?

SmokingPreference indicates guest smoking preference. **Must be integer (NOT string)** in BlockRoom/Book:

| Value | Meaning                 |
| ----- | ----------------------- |
| **0** | No Preference (default) |
| **1** | Smoking Room            |
| **2** | Non-Smoking Room        |
| **3** | Either (no preference)  |

**⚠️ Common Error:** Sending as string "NoPreference" instead of integer 0

- TBO API expects JSON integer type
- Always convert string to integer using: `smokingMap[preference.toLowerCase()]`

### 5. What is the difference between PublishedPrice and OfferedPrice?

**PublishedPrice**

- Standard rate set by the hotel
- What the hotel publicly displays
- Base for calculating discount
- Used for RSP (Rate Shopping Prevention) rules

**OfferedPrice**

- Discounted rate offered to this agency
- Result of applied markups/promos
- Price shown to customer
- Must NOT exceed PublishedPrice (RSP rule)

**RSP Rule:** OfferedPrice ≤ PublishedPrice

### 6. What is the LeadPassenger flag and why is it important?

**LeadPassenger** flag indicates the primary contact for the booking.

**TBO Requirement:** Exactly ONE adult per room must have `LeadPassenger: true`

**Usage:**

```javascript
HotelPassenger: [
  {
    FirstName: "John",
    LastName: "Doe",
    PaxType: 1, // Adult
    LeadPassenger: true, // ✅ MUST be true for at least one adult
    Email: "john@example.com",
    Phoneno: "+91987654321",
  },
  {
    FirstName: "Jane",
    LastName: "Doe",
    PaxType: 1, // Adult
    LeadPassenger: false, // ✅ All others must be false
  },
];
```

### 7. When are PAN and Passport mandatory?

Check room details from GetHotelRoom response:

**From Response:**

```javascript
{
  "IsPassportMandatory": true,  // Require PassportNo for all guests
  "IsPANMandatory": true,       // Require PAN for all guests
  "RequireAllPaxDetails": true  // Require complete info for all pax
}
```

**Action:**

- If IsPassportMandatory = true: PassportNo required
- If IsPANMandatory = true: PAN required
- If RequireAllPaxDetails = true: Full address, city, country for all passengers

### 8. What does RequireAllPaxDetails mean?

If `RequireAllPaxDetails: true`:

- Every passenger must have complete details
- Cannot skip fields for secondary passengers
- Must include: Address, City, Country, Email, Phone

If `RequireAllPaxDetails: false`:

- Only lead passenger needs complete details
- Other passengers can have minimal info

### 9. How do I handle price changes during booking flow?

**Flow:**

```
1. Search → Get price P1
   ↓
2. GetHotelRoom → Price still P1
   ↓
3. BlockRoom → Check IsPriceChanged flag
   ├─ If FALSE → Use original price
   ├─ If TRUE → Use updated price from response
   ↓
4. Book → Use final price from BlockRoom
   ↓
5. Voucher → Document final price
```

**Code Example:**

```javascript
const blockRes = await blockRoom(blockReq);

if (blockRes.isPriceChanged) {
  console.warn("Price changed in BlockRoom");
  // Use blockRes.hotelRoomDetails for updated prices
  bookReq.hotelRoomDetails = blockRes.hotelRoomDetails;
}
```

### 10. How do I cancel a booking?

**Two-Step Process:**

**Step 1: Send Change Request**

```javascript
const changeRes = await sendChangeRequest({
  bookingId: 987654321,
  confirmationNo: "CONF123456",
  requestType: 4, // 4 = Cancellation
  remarks: "Customer requested cancellation",
});

// Response:
// {
//   changeRequestId: "CHG123456",
//   requestStatus: "Pending" | "Processed" | "Rejected",
//   cancellationCharge: 100.00,
//   refundAmount: 1100.00
// }
```

**Step 2: Check Status**

```javascript
const statusRes = await getChangeRequestStatus({
  changeRequestId: changeRes.changeRequestId,
});

// If requestStatus = "Processed" → Cancellation complete
// If requestStatus = "Pending" → Wait and retry later
// If requestStatus = "Rejected" → Contact TBO support
```

---

## Common Error Codes & Solutions

### Error 5001: Invalid TokenId

**Cause:** TokenId expired or invalid  
**Solution:** Re-authenticate and obtain new TokenId

### Error 5002: Hotel Not Available

**Cause:** Hotel inventory exhausted or dates no longer available  
**Solution:** Try different hotel or dates, perform new search

### Error 5003: Room Not Available

**Cause:** Selected room is no longer available  
**Solution:** Call GetHotelRoom again to refresh room list

### Error 5004: Agency Balance Insufficient

**Cause:** Agency account has insufficient credit  
**Solution:** Contact TBO to add credit to agency account

### Error 5005: Invalid Guest Details

**Cause:** Passenger name, email, or phone format incorrect  
**Solution:** Validate using spec-compliant rules, check special characters

### Error 5006: Invalid Passenger Information

**Cause:** PAN, Passport, or Nationality format invalid  
**Solution:**

- PAN must be AAAAA9999A format
- Passport must be 6-20 alphanumeric
- Nationality must be ISO 2-letter code from supported list

### Error 5007: Price Changed Significantly

**Cause:** Price changed between Block and Book  
**Solution:**

- This may trigger re-blocking
- Check IsPriceChanged in BlockRoom
- Use updated prices from BlockRoom response

### Error 5008: Cancellation Policy Changed

**Cause:** Cancellation terms changed  
**Solution:** Review updated cancellation policy in BlockRoom response

### Error 400: Invalid Request Format

**Cause:** Request structure doesn't match TBO spec  
**Solution:**

- Verify all required fields present
- Check field types (e.g., SmokingPreference must be integer)
- Validate dates in dd/MM/yyyy format
- Check field name casing (RoomIndex NOT roomindex)

---

## Implementation Patterns

### Pattern 1: De-Dupe Hotel Detection & Handling

```javascript
// In SearchHotels response
const hotel = searchRes.hotels[0];

const isDeDupe = hotel.IsTBOMapped && hotel.CategoryId;

// When building BlockRoom request
if (isDeDupe) {
  blockReq.CategoryId = hotel.CategoryId; // ✅ Include
} else {
  // ✅ Omit CategoryId for non-de-dupe
}

// When building Book request
if (isDeDupe) {
  bookReq.CategoryId = hotel.CategoryId; // ✅ Include
}
// else { skip }
```

### Pattern 2: Price Change Handling

```javascript
// After BlockRoom response
if (blockRes.isPriceChanged) {
  // Notify user of price change
  console.warn(`Price changed: ${oldPrice} → ${newPrice}`);

  // Ask for confirmation
  const confirmed = await getUserApproval("Price has changed. Continue?");

  if (!confirmed) {
    throw new Error("Booking cancelled by user due to price change");
  }

  // Use updated details for Book
  bookReq.hotelRoomDetails = blockRes.hotelRoomDetails;
}
```

### Pattern 3: Passenger Details with Requirements Check

```javascript
// Get room requirements
const room = roomRes.rooms[0];

// Build passengers based on requirements
const passengers = [];
for (let i = 0; i < room.requiredAdults; i++) {
  passengers.push({
    Title: i === 0 ? "Mr" : "Mrs",
    FirstName: "Guest",
    LastName: "Name",
    PaxType: 1,
    LeadPassenger: i === 0, // ✅ First adult is lead

    // Conditional: Passport if required
    PassportNo: room.IsPassportMandatory ? "AB1234567" : undefined,

    // Conditional: PAN if required
    PAN: room.IsPANMandatory ? "AAAAA0000A" : undefined,

    // Always include if RequireAllPaxDetails
    Email: "guest@example.com",
    AddressLine1: "Address",
    City: "City",
    CountryCode: "IN",
  });
}
```

### Pattern 4: Parallel Room Details Retrieval

```javascript
// For large search results (>100 hotels), process in batches
const BATCH_SIZE = 100;
const batches = [];

for (let i = 0; i < hotels.length; i += BATCH_SIZE) {
  const batch = hotels.slice(i, i + BATCH_SIZE);
  batches.push(batch);
}

// Process batches in parallel
const results = await Promise.all(
  batches.map((batch) =>
    Promise.all(
      batch.map((hotel) =>
        getHotelRoom({
          traceId,
          resultIndex: hotel.ResultIndex,
          hotelCode: hotel.HotelCode,
        }).catch((err) => ({
          error: true,
          hotel: hotel.HotelCode,
          message: err.message,
        })),
      ),
    ),
  ),
);

// Flatten results
const allRooms = results.flat().filter((r) => !r.error);
```

### Pattern 5: Error Handling with Retry

```javascript
async function bookWithRetry(bookReq, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const bookRes = await book(bookReq);
      return bookRes; // Success
    } catch (error) {
      const parsed = parseTBOError(error);

      if (!parsed.retryable) {
        throw error; // Don't retry non-retryable errors
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retry ${attempt}/${maxRetries} in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw error; // Max retries exceeded
      }
    }
  }
}
```

---

## Rate Shopping Prevention (RSP) Rules

**RSP prevents pricing manipulation:**

1. **PublishedPrice ≥ RoomPrice**
   - Base rate must be documented
   - Cannot be lower than room rate

2. **OfferedPrice ≤ PublishedPrice**
   - Discount cannot exceed base
   - Prevents showing lower rates than hotel posts

3. **Discount ≤ 50% (recommendation)**
   - Very high discounts may trigger review
   - Keep within reasonable limits

**Validation:**

```javascript
if (price.OfferedPrice > price.PublishedPrice) {
  // RSP VIOLATION
  throw new Error("OfferedPrice exceeds PublishedPrice");
}

const discount = price.PublishedPrice - price.OfferedPrice;
const discountPct = (discount / price.PublishedPrice) * 100;

if (discountPct > 50) {
  console.warn(`High discount detected: ${discountPct}%`);
}
```

---

## GST/VAT Taxation

**Standard GST (India):** 18% of room subtotal

**Breakdown:**

```
RoomPrice: 100.00
GST (18%): 18.00
Total: 118.00
```

**In TBO Response:**

```json
{
  "Price": {
    "RoomPrice": 100.0,
    "Tax": 18.0, // ← This is GST
    "TotalPrice": 118.0
  }
}
```

**Verify in Price Validation:**

```javascript
const expectedGST = roomPrice * 0.18;
if (Math.abs(price.Tax - expectedGST) > 0.01) {
  console.warn("GST calculation may be incorrect");
}
```

---

## Package Fare Handling

When booking includes flights, transfers, or other components:

1. **Price Breakdown**: Separate hotel rate from package components
2. **Cancellation**: Different rules may apply to package
3. **Refunds**: Calculate refunds accounting for all components

**Example:**

```json
{
  "Price": {
    "HotelRoom": 400.0,
    "FlightComponent": 300.0,
    "TransferComponent": 50.0,
    "Tax": 72.0,
    "Total": 822.0
  },
  "Cancellation": {
    "BeforeCheckIn": {
      "HotelCharge": 100.0,
      "FlightCharge": 0.0, // Non-refundable
      "TransferCharge": 50.0
    }
  }
}
```

---

## Database Schema Recommendations

### TBO Bookings Table

```sql
CREATE TABLE tbo_hotel_bookings (
  booking_id VARCHAR(50) PRIMARY KEY,
  trace_id VARCHAR(255),
  hotel_code VARCHAR(50),
  category_id VARCHAR(50),
  check_in_date DATE,
  check_out_date DATE,
  total_price DECIMAL(12, 2),
  currency VARCHAR(3),
  status VARCHAR(50),  -- confirmed, voucher_generated, cancelled
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Hotel Rate History Table

```sql
CREATE TABLE tbo_hotel_rate_history (
  id SERIAL PRIMARY KEY,
  trace_id VARCHAR(255),
  hotel_code VARCHAR(50),
  search_price DECIMAL(12, 2),
  block_price DECIMAL(12, 2),
  book_price DECIMAL(12, 2),
  price_changed BOOLEAN,
  created_at TIMESTAMP
);
```

---

## Integration Checklist

- [ ] Authenticate and cache TokenId
- [ ] Implement city/CityId resolution
- [ ] Search hotels with proper pagination
- [ ] Get room details for selected hotels
- [ ] Validate room requirements (PAN, Passport, etc.)
- [ ] Build passenger objects with LeadPassenger flag
- [ ] Implement de-dupe detection and CategoryId handling
- [ ] Block room and check IsPriceChanged
- [ ] Handle price changes (notify user, confirm)
- [ ] Book with updated prices if changed
- [ ] Generate voucher
- [ ] Implement cancellation flow
- [ ] Log all requests/responses for audit
- [ ] Set up error handling with TBO error codes
- [ ] Implement retry logic for transient errors
- [ ] Test with 8 certification scenarios
- [ ] Validate RSP rules
- [ ] Verify GST calculation
- [ ] Test de-dupe hotels
- [ ] Test multi-room bookings
- [ ] Test cancellation and refunds

---

## Support & Contact

- **TBO Technical Support**: https://www.tboholidays.com/support
- **API Documentation**: https://www.tboholidays.com/developer-api
- **Error Code Reference**: Consult TBO documentation for complete mapping
