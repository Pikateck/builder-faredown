# TBO Book API CategoryId Regression Fix

## Problem Summary

The TBO Book API was failing with a regression:

```
ErrorCode: 3
ErrorMessage: "CategoryId cannot be null"
ResponseStatus: 3
```

### Root Cause

The recent refactoring to pass `blockResult.hotelRoomDetails` to `bookHotel` inadvertently broke the CategoryId flow:

1. **BlockRoom response** includes `CategoryId` at the room level and root level
2. **BookHotel function** was trying to extract `CategoryId` from the room details passed in, but those details didn't include `CategoryId`
3. Result: `bookCategoryId` became `undefined`, and the Book request was missing the mandatory top-level `CategoryId` field

## Solution Implemented

### **1. api/tbo/book.js** - blockRoom Function Updated (Lines 267-282)

Added extraction and return of `categoryId` from the BlockRoom response:

```javascript
// ✅ CRITICAL: Extract CategoryId from BlockRoom response for use in Book
// Book API requires CategoryId at root level (from TBO docs: mandatory field)
const blockRoomCategoryId =
  result?.HotelRoomsDetails?.[0]?.CategoryId ||
  result?.HotelRoomDetails?.[0]?.CategoryId ||
  undefined;

return {
  responseStatus: result?.ResponseStatus,
  availabilityType: result?.AvailabilityType,
  isPriceChanged: result?.IsPriceChanged,
  isCancellationPolicyChanged: result?.IsCancellationPolicyChanged,
  hotelRoomDetails: roomDetails,
  categoryId: blockRoomCategoryId, // ✅ Pass CategoryId to be used by Book
  error: result?.Error,
};
```

This ensures that `categoryId` extracted from the BlockRoom response is available to the calling code.

### **2. api/tbo/book.js** - bookHotel Function Updated (Lines 307-318)

Added `categoryId` parameter to the function signature:

```javascript
const {
  traceId,
  resultIndex,
  hotelCode,
  hotelName,
  categoryId, // ✅ CRITICAL: CategoryId from BlockRoom response (mandatory for Book)
  guestNationality = "IN",
  noOfRooms = 1,
  hotelRoomDetails,
  isVoucherBooking = false,
  hotelPassenger,
} = params;
```

### **3. api/tbo/book.js** - CategoryId Extraction Logic Updated (Lines 394-398)

Updated to use the parameter with fallback:

```javascript
// ✅ PER TBO SPEC: CategoryId should be at root level for de-dupe Book requests
// Use the CategoryId passed from BlockRoom response (mandatory field)
// Fallback to room CategoryId if not provided as parameter
const bookCategoryId =
  categoryId || roomDetailsWithPassengers[0]?.CategoryId || undefined;
```

This prioritizes the CategoryId passed from BlockRoom (the source of truth), with a fallback to room details.

### **4. api/tbo/book.js** - Enhanced Diagnostic Logging (Lines 419-429)

Added logging to show CategoryId source and value:

```javascript
console.log("\nStep 2: Booking hotel...");
console.log("  URL:", url);
console.log("  TraceId:", request.TraceId);
console.log(
  "  HotelCode:",
  request.HotelCode,
  `(CategoryId source: ${categoryId ? "from BlockRoom param" : "from room details"})`,
);
console.log("  CategoryId:", request.CategoryId || "<<MISSING - ERROR>>");
console.log("  HotelName:", request.HotelName);
```

Expected output:
```
Step 2: Booking hotel...
  URL: https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book
  TraceId: ffd00983-9722-4a34-9e68-29b6411dcee8
  HotelCode: 1489429 (CategoryId source: from BlockRoom param)
  CategoryId: 1###00018237
```

### **5. test-tbo-full-booking-flow.js** - Test Harness Updated (Lines 377-393)

Updated to pass `categoryId` from blockResult to bookHotel:

```javascript
const bookResult = await bookHotel({
  traceId,
  resultIndex,
  hotelCode,
  hotelName: selectedHotel.HotelName,
  categoryId: blockResult.categoryId, // ✅ CRITICAL: CategoryId from BlockRoom (mandatory for Book)
  guestNationality: TEST_PARAMS.nationality,
  noOfRooms: 1,
  isVoucherBooking: true,
  hotelPassenger: TEST_PARAMS.passengers,
  hotelRoomDetails: blockResult.hotelRoomDetails, // ✅ Use BlockRoom result, not original room
});
```

## CategoryId Data Flow

```
BlockRoom Request
├─ Root CategoryId: "1###00018237" ✅
└─ HotelRoomsDetails[0].CategoryId: "1###00018237"

        ▼ (Response processed)

blockRoom() return value
├─ hotelRoomDetails: [...]
└─ categoryId: "1###00018237" ✅

        ▼ (Passed to bookHotel)

Book Request
├─ Root CategoryId: "1###00018237" ✅ (from blockResult.categoryId)
└─ HotelRoomsDetails[0]: {...room details...}
```

## Key Changes Summary

| File | Line(s) | Change | Impact |
|------|---------|--------|--------|
| `api/tbo/book.js` | 267-282 | Extract and return `categoryId` from BlockRoom | ✅ Makes CategoryId available to caller |
| `api/tbo/book.js` | 312 | Add `categoryId` parameter to bookHotel | ✅ Function can receive CategoryId |
| `api/tbo/book.js` | 394-398 | Use categoryId parameter (with fallback) | ✅ Proper CategoryId priority logic |
| `api/tbo/book.js` | 419-429 | Enhanced diagnostic logging | ✅ Shows CategoryId source and value |
| `test-tbo-full-booking-flow.js` | 387 | Pass `blockResult.categoryId` to bookHotel | ✅ Completes the data flow chain |

## Why This Fixes the Regression

1. **Extraction**: BlockRoom now explicitly extracts and returns the CategoryId it received
2. **Transmission**: The categoryId is passed through the function call chain
3. **Usage**: BookHotel receives and uses the categoryId as the source of truth
4. **Validation**: TBO receives the exact CategoryId it provided in BlockRoom, satisfying the "CategoryId cannot be null" validation

## Testing Instructions (Render)

1. Deploy the updated code to Render
2. Run the full booking flow test:
   ```bash
   cd /opt/render/project/src
   node test-tbo-full-booking-flow.js
   ```

3. Expected output:
   - **Step 5 (BlockRoom)**: ✅ ResponseStatus: 1
   - **Step 5 (BlockRoom) return**: ��� categoryId present
   - **Step 6 (Book) diagnostic**: Shows `CategoryId source: from BlockRoom param`
   - **Step 6 (Book) diagnostic**: Shows `CategoryId: 1###00018237`
   - **Step 6 (Book) response**:
     - `ResponseStatus: 1` ✅
     - `BookingId` populated ✅
     - `BookingRefNo` populated ✅
     - `ConfirmationNo` populated ✅

4. Error should be resolved:
   - ❌ OLD: `ErrorMessage: "CategoryId cannot be null"`
   - ✅ NEW: Full booking success with confirmation numbers

## Regression Prevention

This fix ensures that:
- CategoryId data flow is explicit and traceable through logs
- The parameter-based approach is more robust than trying to extract from room details
- Fallback logic provides safety if parameter is not provided
- Diagnostic output clearly shows the CategoryId source

## Deployment Status

- ✅ BlockRoom function extracts and returns categoryId
- ✅ BookHotel function accepts and uses categoryId parameter
- ✅ Test harness passes categoryId through the flow
- ✅ Diagnostic logging shows CategoryId source and value
- ✅ Price preservation maintained (from previous fix)
- ✅ SmokingPreference and LeadPassenger maintained (from previous fixes)
- ⏳ Ready to push to main branch
- ⏳ Awaiting deployment to Render and final test execution
