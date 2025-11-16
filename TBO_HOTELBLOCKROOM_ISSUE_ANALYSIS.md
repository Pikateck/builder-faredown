# TBO HotelBlockRoom API - Error Analysis

## Problem Statement

**Error**: `ResponseStatus: 3, Error: HotelRoomsDetails is not found.`

```json
{
  "responseStatus": 3,
  "availabilityType": undefined,
  "isPriceChanged": false,
  "isCancellationPolicyChanged": false,
  "hotelRoomDetails": [],
  "error": {
    "ErrorCode": 3,
    "ErrorMessage": "HotelRoomsDetails is not found."
  }
}
```

---

## Root Cause Analysis

### The Core Issue

The error "HotelRoomsDetails is not found" (plural) is misleading. According to TBO API documentation, the request should use `HotelRoomDetails` (singular). The code is correctly sending `HotelRoomDetails`.

**The actual problem**: The `HotelRoomDetails` array is likely **empty or contains objects with missing/incorrect fields**.

### Required Fields in HotelRoomDetails

According to TekTravel API documentation (Section 11), each room object MUST have:

**Mandatory Fields:**
1. `RoomIndex` (Integer) - Index of the room
2. `RatePlanCode` (String) - Rate plan code from search/room details response
3. `RoomTypeCode` (String) - Room type code
4. `RoomTypeName` (String) - Room type name
5. `SmokingPreference` (Integer) - 0=NoPreference, 1=Smoking, 2=NonSmoking, 3=Either
6. `Supplements` (Array/StringList) - List of supplements (can be empty array)
7. `Price` (Array) - With sub-fields:
   - `CurrencyCode` (String)
   - `RoomPrice` (Decimal)
   - `Tax` (Decimal)
   - `ExtraGuestCharge` (Decimal)
   - `ChildCharge` (Decimal)
   - `OtherCharges` (Decimal)
   - `Discount` (Decimal)
   - `PublishedPrice` (Decimal)
   - `PublishedPriceRoundedOff` (Integer)
   - `OfferedPrice` (Decimal)
   - `OfferedPriceRoundedOff` (Integer)
   - `AgentCommission` (Decimal)
   - `AgentMarkUp` (Decimal)
   - `TDS` (Decimal)

---

## Current Code Flow

### Step 1: GetHotelRoom API Call
**File:** `api/tbo/room.js` - `getHotelRoom()` function

```javascript
return {
  responseStatus: result?.ResponseStatus,
  traceId: result?.TraceId,
  rooms: result?.HotelRoomsDetails || [],  // ← Returns from HotelRoomsDetails
  error: result?.Error,
};
```

The response from TBO includes `HotelRoomsDetails` (with 's') array. Each object in this array contains the room details.

### Step 2: BlockRoom API Call
**File:** `api/tbo/book.js` - `blockRoom()` function

```javascript
const request = {
  EndUserIp: "...",
  TokenId: "...",
  TraceId: traceId,
  ResultIndex: resultIndex,
  HotelCode: hotelCode,
  HotelName: hotelName,
  GuestNationality: guestNationality,
  NoOfRooms: noOfRooms,
  IsVoucherBooking: isVoucherBooking,
  HotelRoomDetails: hotelRoomDetails,  // ← Should be singular (no 's')
};
```

The code correctly sends `HotelRoomDetails` (singular).

### Issue in Test Flow
**File:** `test-tbo-full-booking-flow.js`

```javascript
const blockResult = await blockRoom({
  traceId,
  resultIndex,
  hotelCode,
  hotelName: selectedHotel.HotelName,
  guestNationality: TEST_PARAMS.nationality,
  noOfRooms: 1,
  isVoucherBooking: true,
  hotelRoomDetails: [selectedRoom],  // ← Passing room directly
});
```

**Problem**: `selectedRoom` is taken directly from `HotelRoomsDetails` returned by `GetHotelRoom`. This room object might not be in the correct format for `BlockRoom`.

---

## Missing Field Mapping

The room object from `HotelRoomsDetails` (GetHotelRoom response) might not have all the fields required by `BlockRoom`.

### Fields That Might Be Missing:

1. **RoomIndex** - CRITICAL
   - GetHotelRoom response might not include `RoomIndex`
   - Need to add index based on room position in array: `roomIndex = array.indexOf(room)`

2. **RatePlanCode** - CRITICAL
   - Might be included, need to verify in actual API response
   - Could be named differently (e.g., `PlanCode`, `OfferCode`, etc.)

3. **Supplements** - CRITICAL
   - Might be missing or empty
   - BlockRoom requires this field (even if empty array)
   - Might need to default to `[]` if not present

4. **SmokingPreference** - CRITICAL
   - Might not be included in room details
   - Need to default to `0` (NoPreference) if missing

---

## Solution

### Fix 1: Create a Room Mapping Function

Create a function to transform room details from GetHotelRoom format to BlockRoom format:

```javascript
// api/tbo/roomMapper.js

function mapRoomForBlockRequest(room, roomIndex) {
  return {
    RoomIndex: roomIndex,
    RatePlanCode: room.RatePlanCode || room.PlanCode || room.OfferCode,
    RatePlanName: room.RatePlanName || room.PlanName,
    RoomTypeCode: room.RoomTypeCode,
    RoomTypeName: room.RoomTypeName,
    BedTypes: room.BedTypes || [],
    SmokingPreference: room.SmokingPreference ?? 0,
    Supplements: room.Supplements || [],
    Price: room.Price,
  };
}

module.exports = { mapRoomForBlockRequest };
```

### Fix 2: Update BlockRoom to Use Mapped Rooms

In `api/tbo/book.js`:

```javascript
const { mapRoomForBlockRequest } = require("./roomMapper");

async function blockRoom(params = {}) {
  // ... existing code ...
  
  // Map rooms to ensure all required fields are present
  const mappedRoomDetails = hotelRoomDetails.map((room, index) =>
    mapRoomForBlockRequest(room, index)
  );
  
  const request = {
    // ... existing fields ...
    HotelRoomDetails: mappedRoomDetails,  // ← Use mapped rooms
  };
  
  // ... rest of function ...
}
```

### Fix 3: Update Test to Use Mapped Rooms

In `test-tbo-full-booking-flow.js`:

```javascript
const { mapRoomForBlockRequest } = require("./api/tbo/roomMapper");

// In the booking flow:
const mappedRoom = mapRoomForBlockRequest(selectedRoom, 0);

const blockResult = await blockRoom({
  traceId,
  resultIndex,
  hotelCode,
  hotelName: selectedHotel.HotelName,
  guestNationality: TEST_PARAMS.nationality,
  noOfRooms: 1,
  isVoucherBooking: true,
  hotelRoomDetails: [mappedRoom],  // ← Use mapped room
});
```

---

## Alternative: Debug Current Response

Before implementing the fix, let's debug to see what fields are actually in the room response:

```javascript
// Add to getHotelRoom in api/tbo/room.js
if (result?.HotelRoomsDetails?.length > 0) {
  console.log("🔍 FULL ROOM OBJECT STRUCTURE:");
  console.log(JSON.stringify(result.HotelRoomsDetails[0], null, 2));
}
```

This will show exactly what fields are available in the TBO response.

---

## Checklist

- [ ] Review actual GetHotelRoom response structure
- [ ] Identify missing fields between GetHotelRoom and BlockRoom requirements
- [ ] Create room mapper function (fix 1)
- [ ] Update blockRoom function to use mapper (fix 2)
- [ ] Update test to use mapped rooms (fix 3)
- [ ] Test BlockRoom API with mapped room data
- [ ] Verify ResponseStatus = 1 (success)

---

## TBO API Documentation References

- **HotelBlockRoom**: https://apidoc.tektravels.com/hotel/HotelBlockRoom.aspx
- **HotelBlockRoom_json**: https://apidoc.tektravels.com/hotel/HotelBlockRoom_json.aspx
- **BlockRoom (alternative)**: https://apidoc.tektravels.com/hotel/dedupe_BlockRoom.aspx

---

## Next Steps

1. **Debug**: Add logging to see actual room structure
2. **Map**: Create field mapping function
3. **Test**: Verify BlockRoom with correctly mapped room data
4. **Apply**: Update all booking flows to use mapping
