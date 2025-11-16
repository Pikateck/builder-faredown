# TBO Hotel Booking Error Fix

## Problem Identified

The TBO hotel booking flow was failing with the error:

```
ResponseStatus: 3
ErrorMessage: "HotelRoomsDetails is not found."
```

This occurred in both the `BlockRoom` and `Book` API calls.

## Root Cause

After analyzing the TBO API documentation (https://apidoc.tektravels.com/hotel/HotelBook.aspx), two critical issues were found:

### Issue 1: Incorrect Field Name

- **Before**: Request was using `HotelRoomsDetails` (with 's')
- **After**: Should use `HotelRoomDetails` (without 's')
- **Why**: The official TBO API documentation specifies `HotelRoomDetails` as the correct field name for booking requests

### Issue 2: Incorrect Passenger Data Structure

- **Before**: `HotelPassenger` was sent at the top level of the request
- **After**: `HotelPassenger` should be inside each `HotelRoomDetails` element
- **Why**: According to TBO API docs Section 11.10, passenger details must be nested within each room detail object

## Changes Made

### File: `api/tbo/book.js`

#### 1. BlockRoom Function (Line ~48-64)

```javascript
// BEFORE (INCORRECT):
const request = {
  ...
  HotelRoomsDetails: hotelRoomDetails,  // ❌ Wrong field name
};

// AFTER (CORRECT):
const request = {
  ...
  HotelRoomDetails: hotelRoomDetails,   // ✅ Correct field name
};
```

#### 2. BookHotel Function (Line ~170-195)

```javascript
// BEFORE (INCORRECT):
const request = {
  ...
  HotelRoomsDetails: hotelRoomDetails,  // ❌ Wrong field name
  HotelPassenger: hotelPassenger,       // ❌ Wrong location (top level)
};

// AFTER (CORRECT):
const roomDetailsWithPassengers = hotelRoomDetails.map(room => ({
  ...room,
  HotelPassenger: hotelPassenger       // ✅ Nested inside room details
}));

const request = {
  ...
  HotelRoomDetails: roomDetailsWithPassengers,  // ✅ Correct field name
};
```

#### 3. Response Handling (Line ~106-131)

Updated to handle both singular and plural field names in responses:

```javascript
const roomDetails = result?.HotelRoomDetails || result?.HotelRoomsDetails || [];
```

## Request Structure Comparison

### OLD (Incorrect) Structure:

```json
{
  "TokenId": "xxx",
  "TraceId": "yyy",
  "HotelCode": "1043287",
  "HotelRoomsDetails": [                    ❌ WRONG
    {
      "RoomTypeCode": "74026|217183559|1|1",
      "RoomTypeName": "Twin/King room",
      "Price": {...}
    }
  ],
  "HotelPassenger": [                       ❌ WRONG (top level)
    {
      "Title": "Mr",
      "FirstName": "John",
      "LastName": "Doe",
      "Email": "john@test.com"
    }
  ]
}
```

### NEW (Correct) Structure:

```json
{
  "TokenId": "xxx",
  "TraceId": "yyy",
  "HotelCode": "1043287",
  "HotelRoomDetails": [                     ✅ CORRECT
    {
      "RoomTypeCode": "74026|217183559|1|1",
      "RoomTypeName": "Twin/King room",
      "Price": {...},
      "HotelPassenger": [                   ✅ CORRECT (nested)
        {
          "Title": "Mr",
          "FirstName": "John",
          "LastName": "Doe",
          "Email": "john@test.com"
        }
      ]
    }
  ]
}
```

## Expected Impact

After this fix:

1. ✅ BlockRoom should successfully validate pricing
2. ✅ Book should successfully confirm reservations
3. ✅ Error "HotelRoomsDetails is not found" should be resolved
4. ✅ Full booking flow from search → room details → block → book should work

## Testing

To test the fix, run:

```bash
node test-tbo-full-booking-flow.js
```

Expected output:

- Step 5 (BlockRoom): `ResponseStatus: 1` (Success)
- Step 6 (Book): `ResponseStatus: 1` (Success) with valid `BookingId` and `ConfirmationNo`

## API Documentation Reference

- TBO HotelBook API: https://apidoc.tektravels.com/hotel/HotelBook.aspx
- Field Structure: Section 11 (HotelRoomDetails)
- Passenger Details: Section 11.10 (HotelPassenger within room details)

## Files Modified

1. `api/tbo/book.js` - Core booking logic
   - Fixed `blockRoom()` function
   - Fixed `bookHotel()` function
   - Updated response handling

## Note on API Field Naming

TBO API has inconsistent field naming:

- **Responses** (GetHotelRoom): Returns `HotelRoomsDetails` (plural with 's')
- **Requests** (BlockRoom/Book): Expects `HotelRoomDetails` (singular without 's')

The fix accounts for this discrepancy by:

- Using the correct singular form in requests
- Accepting both forms in response parsing
