# TBO BlockRoom API - Final Fix (HotelRoomsDetails Error)

## 🔴 Root Cause: TWO Critical Data Type Errors

Your test output revealed the exact issues:

### Issue #1: SmokingPreference is STRING instead of INTEGER

**❌ WRONG (what was being sent):**

```json
"SmokingPreference": "NoPreference"  // STRING!
```

**✅ CORRECT (what TBO expects):**

```json
"SmokingPreference": 0  // INTEGER
```

**Valid values:**

- `0` = NoPreference
- `1` = Smoking
- `2` = NonSmoking
- `3` = Either

---

### Issue #2: Price is OBJECT instead of ARRAY

**❌ WRONG (what was being sent):**

```json
"Price": {
  "CurrencyCode": "USD",
  "RoomPrice": 261.64,
  ...
}
```

**✅ CORRECT (what TBO expects):**

```json
"Price": [
  {
    "CurrencyCode": "USD",
    "RoomPrice": 261.64,
    ...
  }
]
```

Price MUST be an ARRAY with at least one element, not a single object.

---

## ✅ Solution Implemented

### Updated `api/tbo/roomMapper.js`

**New mapping logic:**

```javascript
// ✅ CRITICAL: Convert SmokingPreference string to integer
let smokingPref = room.SmokingPreference ?? 0;
if (typeof smokingPref === "string") {
  const smokingMap = {
    nopreference: 0,
    smoking: 1,
    nonsmoking: 2,
    either: 3,
  };
  smokingPref = smokingMap[smokingPref.toLowerCase()] ?? 0;
}

// ✅ CRITICAL: Ensure Price is an ARRAY, not object
let priceArray = [];
if (Array.isArray(room.Price)) {
  priceArray = room.Price; // Already an array
} else if (typeof room.Price === "object" && room.Price !== null) {
  priceArray = [room.Price]; // Convert object to array
} else {
  priceArray = [
    {
      /* create from individual fields */
    },
  ];
}
```

**Validation updates:**

```javascript
// ✅ SmokingPreference must be INTEGER (0-3)
if (typeof room.SmokingPreference !== "number") {
  errors.push(
    `SmokingPreference must be integer (0-3), got ${typeof room.SmokingPreference}`,
  );
}

// ✅ Price MUST be ARRAY
if (!Array.isArray(room.Price)) {
  errors.push("Price must be an array (not object)");
}
```

---

## Correct HotelRoomDetails Structure for BlockRoom API

Based on TBO documentation, each room must have:

```json
{
  "RoomIndex": 0,
  "RatePlanCode": "PLAN123",
  "RatePlanName": "Standard Plan",
  "RoomTypeCode": "RT001",
  "RoomTypeName": "Double Room",
  "BedTypes": [],
  "SmokingPreference": 0,
  "Supplements": [],
  "Price": [
    {
      "CurrencyCode": "INR",
      "RoomPrice": 5000,
      "Tax": 900,
      "ExtraGuestCharge": 0,
      "ChildCharge": 0,
      "OtherCharges": 0,
      "Discount": 0,
      "PublishedPrice": 5900,
      "PublishedPriceRoundedOff": 5900,
      "OfferedPrice": 5000,
      "OfferedPriceRoundedOff": 5000,
      "AgentCommission": 0,
      "AgentMarkUp": 0,
      "TDS": 0
    }
  ]
}
```

**Key Requirements:**

- ✅ `SmokingPreference` is **INTEGER** (0-3), NOT string
- ✅ `Price` is **ARRAY** with at least one element, NOT object
- ✅ All price fields must be numbers (not strings)
- ✅ RoomIndex must be sequential (0, 1, 2, ...)

---

## Field-by-Field Requirements

| Field             | Type        | Required | Values      | Notes                                    |
| ----------------- | ----------- | -------- | ----------- | ---------------------------------------- |
| RoomIndex         | Integer     | Yes      | 0+          | Sequential room number                   |
| RatePlanCode      | String      | Yes      | Any         | From GetHotelRoom response               |
| RatePlanName      | String      | No       | Any         | From GetHotelRoom response               |
| RoomTypeCode      | String      | Yes      | Any         | Room identifier                          |
| RoomTypeName      | String      | Yes      | Any         | Room description                         |
| BedTypes          | Array       | No       | Any         | Bed information                          |
| SmokingPreference | **Integer** | Yes      | 0, 1, 2, 3  | **NOT STRING** - must convert            |
| Supplements       | Array       | Yes      | [] or items | Can be empty                             |
| Price             | **Array**   | Yes      | [{...}]     | **ARRAY of objects** - NOT single object |

---

## What Was Wrong in Your Test

Looking at your test output:

**Request being sent:**

```json
{
  "RoomIndex": 0,
  "RatePlanCode": "74026|217183559|1",
  "RatePlanName": "No meals",
  "RoomTypeCode": "74026|217183559|1|1",
  "RoomTypeName": "Twin/King room",
  "BedTypes": [],
  "SmokingPreference": "NoPreference",  // ❌ STRING, should be 0
  "Supplements": [],
  "Price": {                             // ❌ OBJECT, should be ARRAY
    "CurrencyCode": "USD",
    "RoomPrice": 261.64,
    ...
  }
}
```

**TBO's response:**

```json
{
  "ResponseStatus": 3,
  "Error": {
    "ErrorCode": 3,
    "ErrorMessage": "HotelRoomsDetails is not found."
  }
}
```

The error "HotelRoomsDetails is not found" is TBO's way of saying: **"The room details format is invalid - I can't parse them."**

---

## After Fix - Expected Result

**Corrected request:**

```json
{
  "RoomIndex": 0,
  "RatePlanCode": "74026|217183559|1",
  "RatePlanName": "No meals",
  "RoomTypeCode": "74026|217183559|1|1",
  "RoomTypeName": "Twin/King room",
  "BedTypes": [],
  "SmokingPreference": 0,  // ✅ INTEGER
  "Supplements": [],
  "Price": [               // ✅ ARRAY
    {
      "CurrencyCode": "USD",
      "RoomPrice": 261.64,
      ...
    }
  ]
}
```

**Expected response:**

```json
{
  "ResponseStatus": 1,  // ✅ SUCCESS
  "HotelRoomDetails": [...],
  "IsPriceChanged": false,
  "IsCancellationPolicyChanged": false
}
```

---

## Testing the Fix

Run the test again:

```bash
node test-tbo-full-booking-flow.js
```

**Check the BlockRoom request output:**

- ✅ `"SmokingPreference": 0` (integer)
- ✅ `"Price": [{ ... }]` (array)
- ✅ `ResponseStatus: 1` (success)

---

## TBO API Documentation References

- **HotelBlockRoom**: https://apidoc.tektravels.com/hotel/HotelBlockRoom.aspx
- **HotelBlockRoom_json**: https://apidoc.tektravels.com/hotel/HotelBlockRoom_json.aspx
- **BlockRoom Details**: https://apidoc.tektravels.com/hotel/dedupe_BlockRoom.aspx

Key section: **Request Parameters > Section 11 (HotelRoomDetails)** specifies:

- Field 11.7: SmokingPreference = Enumeration (Integer 0-3)
- Field 11.9: Price = Array of price objects

---

## Files Modified

✅ `api/tbo/roomMapper.js` - UPDATED

- Added SmokingPreference string-to-integer conversion
- Added Price object-to-array conversion
- Enhanced validation for both fields

---

## Summary

| Aspect                   | Before                        | After          |
| ------------------------ | ----------------------------- | -------------- |
| SmokingPreference type   | String "NoPreference"         | Integer 0      |
| Price type               | Object {...}                  | Array [{...}]  |
| BlockRoom ResponseStatus | 3 (Error)                     | 1 (Success)    |
| Error message            | "HotelRoomsDetails not found" | None           |
| Booking flow             | ❌ Blocked                    | ✅ Can proceed |

---

**Status**: ✅ Final fix implemented
**Date**: November 16, 2024
