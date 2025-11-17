# TBO Book API Price Source Fix

## Problem Summary

The TBO Book API was failing with:

```
ErrorCode: 3
ErrorMessage: "Incorrect Request: RoomPrice in 1 room."
ResponseStatus: 3
```

### Root Cause

The critical issue:

1. **BlockRoom response** returned `IsPriceChanged: true` - indicating TBO calculated/updated the room price
2. **Book request** was still using the **old price from GetHotelRoom** instead of the **updated price from BlockRoom response**
3. TBO's validation in Book expects the exact price object it returned from BlockRoom

The flow mismatch:

```
Search        → Price: 1115.31  (RoomPrice from initial search)
GetHotelRoom  → Price: 1115.31  (Confirmed room price)
BlockRoom     → Price: (may differ), IsPriceChanged: true
Book (OLD)    → Price: 1115.31  (WRONG - using GetHotelRoom price instead of BlockRoom price)
Book (FIXED)  → Price: (exact object from BlockRoom) ✅
```

## Solution Implemented

### **test-tbo-full-booking-flow.js** - Test Harness Fix (Lines 377-390)

Changed from passing the original GetHotelRoom room to passing the BlockRoom response room details:

#### Before:

```javascript
const bookResult = await bookHotel({
  traceId,
  resultIndex,
  hotelCode,
  hotelName: selectedHotel.HotelName,
  guestNationality: TEST_PARAMS.nationality,
  noOfRooms: 1,
  isVoucherBooking: true,
  hotelPassenger: TEST_PARAMS.passengers,
  hotelRoomDetails: [selectedRoom], // ❌ WRONG: Original GetHotelRoom room
});
```

#### After:

```javascript
const bookResult = await bookHotel({
  traceId,
  resultIndex,
  hotelCode,
  hotelName: selectedHotel.HotelName,
  guestNationality: TEST_PARAMS.nationality,
  noOfRooms: 1,
  isVoucherBooking: true,
  hotelPassenger: TEST_PARAMS.passengers,
  hotelRoomDetails: blockResult.hotelRoomDetails, // ✅ CORRECT: BlockRoom response room with updated Price
});
```

**Critical**: When `blockResult.isPriceChanged === true`, the room details from BlockRoom have the updated `Price` object that TBO expects in the Book request.

### **api/tbo/book.js** - Price Preservation (Lines 321-356)

Updated the comment and ensured Price is preserved from BlockRoom:

```javascript
// ✅ CRITICAL: Per TBO documentation, use the exact structure from BlockRoom response
// This includes the final Price object that BlockRoom calculated/validated
// Add HotelPassenger to each room but preserve ALL other fields exactly as they came from BlockRoom

const roomDetailsWithPassengers = hotelRoomDetails.map((room, roomIndex) => {
  // ... SmokingPreference conversion ...

  // ✅ CRITICAL: Build HotelPassenger with LeadPassenger flag
  const passengersForRoom = buildHotelPassengersForRoom(hotelPassenger);

  return {
    ...room, // ✅ Keep ALL fields from BlockRoom response (includes updated Price)
    SmokingPreference: smokingPref,
    // ✅ DO NOT OVERRIDE Price - use the exact Price object from BlockRoom
    // (The ...room spread above preserves room.Price from BlockRoom response)
    HotelPassenger: passengersForRoom,
  };
});
```

The `...room` spread operator preserves the original `room.Price` from the BlockRoom response, ensuring TBO receives the exact price object it calculated.

### **api/tbo/book.js** - Enhanced Diagnostic Logging (Lines 365-376)

Added detailed logging to verify the Price being sent:

```javascript
// ✅ DIAGNOSTIC: Log the Price object being used for Book (should come from BlockRoom response)
console.log("\n🔍 DIAGNOSTIC: Book Price (must come from BlockRoom response):");
roomDetailsWithPassengers.forEach((room, idx) => {
  console.log(`  Room ${idx} Price:`);
  console.log(`    RoomPrice: ${room.Price?.RoomPrice || "<<MISSING>>"}`);
  console.log(
    `    PublishedPrice: ${room.Price?.PublishedPrice || "<<MISSING>>"}`,
  );
  console.log(`    OfferedPrice: ${room.Price?.OfferedPrice || "<<MISSING>>"}`);
  console.log(`    Tax: ${room.Price?.Tax || "<<MISSING>>"}`);
  console.log(
    `    Full Price object:`,
    JSON.stringify(room.Price, null, 2).substring(0, 200),
  );
});
```

Expected output shows the exact price from BlockRoom response.

## Price Flow Diagram

```
┌─────────────┐
│   Search    │
│  RoomPrice: │
│   1115.31   │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  GetHotelRoom    │
│   RoomPrice:     │
│    1115.31       │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│    BlockRoom         │
│    RoomPrice: ???    │
│ IsPriceChanged: true │ ◄─── May differ from input
│ Returns UPDATED      │      (discounts, taxes, etc.)
│ Price object         │
└──────┬───────────────┘
       │
       ▼ ✅ CRITICAL: Pass this to Book
┌──────────────────────┐
│     Book API         │
│  Must use exact      │
│  Price from BlockRoom│
│  ResponseStatus: 1   │
└──────────────────────┘
```

## Key Changes Summary

| File                            | Line(s) | Change                                               | Impact                                                    |
| ------------------------------- | ------- | ---------------------------------------------------- | --------------------------------------------------------- |
| `test-tbo-full-booking-flow.js` | 387     | Pass `blockResult.hotelRoomDetails` to `bookHotel`   | ✅ Ensures Book receives BlockRoom's updated room details |
| `api/tbo/book.js`               | 321-324 | Updated comments clarifying BlockRoom source         | ✅ Documents the correct price flow                       |
| `api/tbo/book.js`               | 346     | `...room` spread preserves all fields from BlockRoom | ✅ Price is preserved without modification                |
| `api/tbo/book.js`               | 365-376 | Added Price diagnostic logging                       | ✅ Verifies correct price is sent                         |

## Why This Fixes It

TBO's Book API is strict about the Price object:

- When `IsPriceChanged: true` in BlockRoom, the Price may have been updated
- TBO expects the Book request to use the exact Price object from the BlockRoom response
- If you send a different price (especially one from an earlier step), TBO returns: `"Incorrect Request: RoomPrice in 1 room."`

By passing `blockResult.hotelRoomDetails` to `bookHotel`, we ensure the room details (including the final Price) come directly from TBO's BlockRoom response, which is the source of truth.

## Testing Instructions (Render)

1. Code changes are complete
2. Run the full booking flow test:

   ```bash
   cd /opt/render/project/src
   node test-tbo-full-booking-flow.js
   ```

3. Expected output:
   - **Step 5 (BlockRoom)**: `ResponseStatus: 1` with `IsPriceChanged: true` or `false` ✅
   - **Step 5 diagnostic**: Shows updated Price object from BlockRoom ✅
   - **Step 6 (Book) diagnostic**: Shows SAME Price object (from BlockRoom) ✅
   - **Step 6 (Book) response**:
     - `ResponseStatus: 1` ✅
     - `BookingId` populated ✅
     - `BookingRefNo` populated ✅
     - `ConfirmationNo` populated ✅

4. Error resolution verification:
   - **Old error**: `"Incorrect Request: RoomPrice in 1 room."` (should be gone)
   - **New success**: Full booking confirmation with reference numbers

## Deployment Status

- ✅ Test harness updated to pass BlockRoom room details
- ✅ Book API preserves exact Price from BlockRoom
- ✅ Diagnostic logging added to verify Price source
- ⏳ Ready to push to main branch
- ⏳ Awaiting deployment to Render and final test execution

## For Production

When integrating with UI/backend booking flow:

1. **Capture BlockRoom response** with room details and price
2. **Pass these exact details to Book**, not the original room from earlier steps
3. **Log IsPriceChanged** to inform users if pricing changed between search and booking
4. **Use the final Price from BlockRoom response** in all subsequent booking communications
