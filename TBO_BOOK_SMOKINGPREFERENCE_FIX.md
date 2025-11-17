# TBO Book SmokingPreference Numeric Enum Fix

## Problem Summary

The TBO Book API was failing with HTTP 400:

```
There was an error deserializing the object of type HotelServiceClasses.HotelBookRequest. 
The value 'NoPreference' cannot be parsed as the type 'Int64'.
```

### Root Cause

The Book request was sending `SmokingPreference` as a **string** (`"NoPreference"`), but TBO's Book deserialization expects a **numeric integer** (0-3).

This is different from how GetHotelRoom *returns* data:
- **GetHotelRoom response** → may include `SmokingPreference: "NoPreference"` (string)
- **BlockRoom request** → correctly converts to `SmokingPreference: 0` (numeric)
- **Book request** → was incorrectly passing through `SmokingPreference: "NoPreference"` (string) ❌

## Solution Implemented

### **api/tbo/book.js** - SmokingPreference Numeric Conversion

Changed the `bookHotel` function to convert `SmokingPreference` from string to numeric enum value:

#### Before:
```javascript
const roomDetailsWithPassengers = hotelRoomDetails.map((room) => ({
  ...room, // Keeps SmokingPreference as string if it came that way
  HotelPassenger: hotelPassenger,
}));
```

#### After:
```javascript
// ✅ CRITICAL: SmokingPreference must be NUMERIC (0-3) for Book API, not string
// TBO's Book deserialization expects Int64, not string like "NoPreference"
const smokingEnumMap = {
  nopreference: 0,
  smoking: 1,
  nonsmoking: 2,
  either: 3,
};

const roomDetailsWithPassengers = hotelRoomDetails.map((room) => {
  // Convert SmokingPreference to numeric value if it's a string
  let smokingPref = room.SmokingPreference ?? 0;
  if (typeof smokingPref === "string") {
    smokingPref = smokingEnumMap[smokingPref.toLowerCase()] ?? 0;
  }

  return {
    ...room,
    SmokingPreference: smokingPref, // ✅ OVERRIDE with numeric value for Book API
    HotelPassenger: hotelPassenger,
  };
});
```

### **api/tbo/book.js** - Top-Level CategoryId for De-dupe

Added `CategoryId` at the root level of the Book request payload for de-dupe scenarios, matching TBO's specification:

```javascript
// ✅ PER TBO SPEC: CategoryId should be at root level for de-dupe Book requests
const primaryRoom = roomDetailsWithPassengers[0];
const bookCategoryId = primaryRoom?.CategoryId || undefined;

const request = {
  EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
  TokenId: tokenId,
  TraceId: traceId,
  ResultIndex: Number(resultIndex),
  HotelCode: String(hotelCode),
  CategoryId: bookCategoryId, // ✅ TOP-LEVEL CategoryId for de-dupe Book requests
  HotelName: hotelName,
  GuestNationality: guestNationality,
  NoOfRooms: Number(noOfRooms),
  IsVoucherBooking: isVoucherBooking,
  HotelRoomsDetails: roomDetailsWithPassengers,
};
```

### **api/tbo/book.js** - Enhanced Diagnostic Logging

Added comprehensive diagnostic logging to verify SmokingPreference is numeric before sending Book request:

```javascript
// ✅ DIAGNOSTIC: Verify SmokingPreference is numeric in Book request
console.log(
  "🔍 DIAGNOSTIC: Book SmokingPreference (TBO requires numeric, not string):",
);
roomDetailsWithPassengers.forEach((room, idx) => {
  console.log(`  Room ${idx} SmokingPreference:`);
  console.log(`    Value: ${room.SmokingPreference}`);
  console.log(`    Type: ${typeof room.SmokingPreference}`);
  console.log(`    Valid: ${typeof room.SmokingPreference === "number" ? "✓" : "✗"}`);
});
```

Expected output after fix:
```
🔍 DIAGNOSTIC: Book SmokingPreference (TBO requires numeric, not string):
  Room 0 SmokingPreference:
    Value: 0
    Type: number
    Valid: ✓
```

## TBO API SmokingPreference Pattern

| Context | Format | Example |
|---------|--------|---------|
| GetHotelRoom **Response** | String or Numeric | `"NoPreference"` or `0` |
| BlockRoom **Request** | Numeric enum (0-3) | `0` |
| BlockRoom **Response** | String or Numeric | `"NoPreference"` or `0` |
| Book **Request** | Numeric enum (0-3) | `0` |
| Book **Response** | String or Numeric | `"NoPreference"` or `0` |

## SmokingPreference Enum Mapping

```
0 = NoPreference
1 = Smoking
2 = NonSmoking
3 = Either
```

## Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `api/tbo/book.js` | Convert SmokingPreference to numeric in Book request | ✅ Fixes 400 deserialization error |
| `api/tbo/book.js` | Add top-level CategoryId for de-dupe | ✅ Spec compliance for de-dupe scenarios |
| `api/tbo/book.js` | Add SmokingPreference diagnostic logging | ✅ Enables verification in logs |

## Testing Instructions (Render)

1. Code is now ready for deployment to Render
2. Run the full booking flow test:
   ```bash
   cd /opt/render/project/src
   node test-tbo-full-booking-flow.js
   ```

3. Expected output:
   - **Step 4 (GetHotelRoom)**: `ResponseStatus: 1` ✅
   - **Step 5 (BlockRoom)**: `ResponseStatus: 1` ✅
   - **Step 6 (Book)**: 
     - `ResponseStatus: 1` ✅
     - `BookingId` returned ✅
     - `BookingRefNo` returned ✅
     - `ConfirmationNo` returned ✅
     - SmokingPreference diagnostic shows `Type: number` and `Valid: ✓` ✅

## Deployment Status

- ✅ SmokingPreference numeric conversion implemented
- ✅ CategoryId root-level added for de-dupe
- ✅ Diagnostic logging added
- ⏳ Ready to push to main branch
- ⏳ Awaiting deployment to Render and test execution
