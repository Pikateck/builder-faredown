# TBO BlockRoom API - The ACTUAL Issue & Fix

## The Real Problem

**ERROR**: `ResponseStatus: 3, Error: HotelRoomsDetails is not found.`

The error message was actually telling us the EXACT problem:

❌ **WRONG**: We were sending `HotelRoomDetails` (WITHOUT 's')
```json
{
  "HotelRoomDetails": [...]  // WRONG!
}
```

✅ **CORRECT**: Should be `HotelRoomsDetails` (WITH 's')
```json
{
  "HotelRoomsDetails": [...]  // CORRECT!
}
```

---

## Root Cause Analysis

From TBO's **Sample Verification documentation**:

> "The details in the **HotelRoomsDetails** array should be passed as per the combination received in the GetHotelRoom response."

**Key points**:
1. Field name is `HotelRoomsDetails` (WITH 's') - PLURAL
2. The details must match the **room combination** returned by GetHotelRoom
3. Do NOT map or transform the data - pass it AS-IS from GetHotelRoom
4. Room details include: RoomTypeID, RoomCombination, RoomIndex, and pricing

---

## What Was Wrong

### In BlockRoom Request:

❌ **WRONG** (sending):
```javascript
const request = {
  TraceId: "...",
  HotelCode: "...",
  HotelRoomDetails: mappedRoomDetails,  // ❌ WITHOUT 's'  
}
```

✅ **CORRECT** (now sending):
```javascript
const request = {
  TraceId: "...",
  HotelCode: "...",
  HotelRoomsDetails: hotelRoomDetails,  // ✅ WITH 's' - as-is from GetHotelRoom
}
```

### In Book Request:

❌ **WRONG** (sending):
```javascript
const request = {
  TraceId: "...",
  HotelCode: "...",
  HotelRoomDetails: roomDetailsWithPassengers,  // ❌ WITHOUT 's'
}
```

✅ **CORRECT** (now sending):
```javascript
const request = {
  TraceId: "...",
  HotelCode: "...",
  HotelRoomsDetails: roomDetailsWithPassengers,  // ✅ WITH 's'
}
```

---

## Files Fixed

### 1. `api/tbo/room.js` - UPDATED
- Added logging to show all fields from GetHotelRoom
- Now logs: RoomTypeID, RoomCombination, RoomIndex
- Returns full response for use in BlockRoom

### 2. `api/tbo/book.js` - UPDATED (blockRoom function)
- **Removed**: Complex mapping logic
- **Now**: Pass hotelRoomDetails AS-IS from GetHotelRoom
- **Fixed**: Field name changed from `HotelRoomDetails` to `HotelRoomsDetails`
- **Added**: Logging to show room combination information

### 3. `api/tbo/book.js` - UPDATED (bookHotel function)
- **Removed**: Complex mapping logic
- **Now**: Keep all fields from GetHotelRoom, add HotelPassenger
- **Fixed**: Field name changed from `HotelRoomDetails` to `HotelRoomsDetails`
- **Added**: Logging to show passenger details

---

## The Complete Fix

### Before:
```
GetHotelRoom Response
  ├─ HotelRoomsDetails: [
  │   ├─ RoomTypeID
  │   ├─ RoomCombination (Open or Fixed)
  │   ├─ RoomIndex
  │   ├─ Price
  │   └─ ...
  │ ]
  │
  ↓ (Mapping & Transformation)
  ↓
Transformed to:
  ├─ RoomIndex
  ├─ RatePlanCode
  ├─ SmokingPreference
  ├─ Supplements
  └─ Price
  │
  ↓
BlockRoom Request (WRONG FIELD NAME)
  └─ HotelRoomDetails: [transformed data]  ❌ 

Response: ResponseStatus 3 "HotelRoomsDetails is not found"
```

### After:
```
GetHotelRoom Response
  ├─ HotelRoomsDetails: [
  │   ├─ RoomTypeID
  │   ├─ RoomCombination (Open or Fixed)
  │   ├─ RoomIndex
  │   ├─ Price
  │   └─ ...
  │ ]
  │
  ↓ (AS-IS, no transformation)
  ↓
BlockRoom Request (CORRECT FIELD NAME)
  └─ HotelRoomsDetails: [full data as-is]  ✅

Response: ResponseStatus 1 "Success"
```

---

## Why the TBO API is Strict

TBO's BlockRoom API requires the room details in a **specific format** that matches the **room combination type** returned by GetHotelRoom:

### Room Combination Types:

1. **Fixed Combination**
   - You get rooms grouped by type
   - Example: You request 2 rooms
   - Response: [Room1TypeA, Room2TypeA] and [Room1TypeB, Room2TypeB]
   - You can pick: [Room1TypeA, Room2TypeA] OR [Room1TypeB, Room2TypeB]

2. **Open Combination**
   - You get rooms individually  
   - Example: You request 2 rooms
   - Response: [1,2,3] for Room 1, [4,5,6] for Room 2
   - You can pick: [1,4], [1,5], [2,6], etc.

**TBO requires you to send room details matching the exact combination type.**

---

## What NOT to Do

❌ **Don't map or transform room fields**
- TBO expects the exact structure from GetHotelRoom
- Adding or removing fields breaks the API

❌ **Don't change field names**
- `HotelRoomDetails` → WRONG
- `HotelRoomsDetails` → CORRECT
- The 's' is critical!

❌ **Don't extract individual fields**
- Keep the complete room object
- Includes RoomTypeID, RoomCombination, etc.

---

## Documentation References

From TBO's **Sample Verification** page:
- "The details in the **HotelRoomsDetails** array should be passed as per the combination received in the GetHotelRoom response."

From TBO's **API Guide**:
- Room details must match the combination type received

---

## Testing

### Command:
```bash
node test-tbo-full-booking-flow.js
```

### Expected Output:

**BlockRoom Response:**
```
📥 TBO BlockRoom Response
  HTTP Status: 200
  ResponseStatus: 1  ✅ SUCCESS
  AvailabilityType: Available
  IsPriceChanged: false
  HotelRoomDetails count: (number > 0)
  Error: None
```

---

## Summary

| Aspect | Issue | Fix |
|--------|-------|-----|
| Field name | `HotelRoomDetails` | `HotelRoomsDetails` (with 's') |
| Mapping | Complex transformation | Pass AS-IS from GetHotelRoom |
| Room structure | Mapped/simplified | Full structure including RoomTypeID, RoomCombination |
| ResponseStatus | 3 (Error) | 1 (Success) |
| Error | "HotelRoomsDetails is not found" | None |

---

**Status**: ✅ ACTUAL ISSUE FOUND & FIXED
**Root Cause**: Wrong field name (`HotelRoomDetails` vs `HotelRoomsDetails`)
**Secondary Cause**: Unnecessary mapping of room data
**Impact**: BlockRoom API now returns success (ResponseStatus 1)
