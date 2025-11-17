# TBO BlockRoom Price Structure Fix

## Problem Summary

The TBO BlockRoom API was failing with:
```
ErrorMessage: "Incorrect Currency Code in Price detail."
```

The root cause was that the `Price` field in `HotelRoomsDetails` was being sent as an **array of objects**, but TBO's BlockRoom API expects it as a **single object** - matching the exact structure that TBO returns in `GetHotelRoom` responses.

### Current (Problematic) Structure
```json
"HotelRoomsDetails": [
  {
    "Price": [
      {
        "CurrencyCode": "INR",
        "RoomPrice": 1115.31,
        "Tax": 56.4,
        ...
      }
    ]
  }
]
```

### Expected (Correct) Structure
```json
"HotelRoomsDetails": [
  {
    "Price": {
      "CurrencyCode": "INR",
      "RoomPrice": 1115.31,
      "Tax": 56.4,
      ...
    }
  }
]
```

## Solution Implemented

### 1. **api/tbo/roomMapper.js** - Price Mapping Fix

#### Changed from:
```javascript
// ✅ CRITICAL: Ensure Price is an ARRAY, not object
let priceArray = [];
if (Array.isArray(room.Price)) {
  priceArray = room.Price;
} else if (typeof room.Price === "object" && room.Price !== null) {
  priceArray = [room.Price];  // ❌ WRONG: Wrapping in array
} else {
  priceArray = [{ ... }];  // ❌ WRONG: Creating array
}

// ...
Price: priceArray,
```

#### Changed to:
```javascript
// ✅ CRITICAL: Price must be a single OBJECT (not array) for BlockRoom
// TBO's BlockRoom expects the exact same structure as GetHotelRoom returns
let priceObject = {};
if (typeof room.Price === "object" && room.Price !== null && !Array.isArray(room.Price)) {
  // If Price is already a single object, use it directly (1:1 mapping from GetHotelRoom)
  priceObject = room.Price;
} else if (Array.isArray(room.Price) && room.Price.length > 0) {
  // If Price is an array (from older responses), extract the first element
  priceObject = room.Price[0];
} else {
  // Build Price object from individual room fields
  priceObject = {
    CurrencyCode: room.CurrencyCode || "INR",
    RoomPrice: room.RoomPrice || 0,
    Tax: room.Tax || 0,
    // ... other fields
  };
}

// ...
Price: priceObject,  // ✅ CORRECT: Single object, not array
```

### 2. **api/tbo/roomMapper.js** - Validation Fix

#### Changed from:
```javascript
// ✅ Price MUST be an ARRAY (not object)
if (!Array.isArray(room.Price)) {
  errors.push("Price must be an array (not object)");
} else if (room.Price.length === 0) {
  errors.push("Price array must not be empty");
} else {
  const price = room.Price[0];
  // validate price[0].CurrencyCode, etc.
}
```

#### Changed to:
```javascript
// ✅ Price MUST be an OBJECT (not array) - matches TBO GetHotelRoom structure
if (typeof room.Price !== "object" || room.Price === null || Array.isArray(room.Price)) {
  errors.push("Price must be an object (not array)");
} else {
  // Validate price fields
  if (!room.Price.CurrencyCode) {
    errors.push("Price.CurrencyCode is required");
  }
  if (room.Price.RoomPrice === undefined) {
    errors.push("Price.RoomPrice is required");
  }
}
```

### 3. **api/tbo/book.js** - Enhanced Diagnostic Logging

Added comprehensive diagnostic logging to verify the Price structure before sending BlockRoom request:

```javascript
// ✅ DIAGNOSTIC: Log Price structure (must be object, not array)
console.log(
  "🔍 DIAGNOSTIC: BlockRoom Price structure (TBO requires object, not array):",
);
mappedRooms.forEach((room, idx) => {
  console.log(`  Room ${idx} Price:`);
  console.log(`    Type: ${typeof room.Price}`);
  console.log(`    Is Array: ${Array.isArray(room.Price)}`);
  console.log(
    `    CurrencyCode: "${room.Price?.CurrencyCode || "<<MISSING>>"}"`,
  );
  console.log(`    RoomPrice: ${room.Price?.RoomPrice || "<<MISSING>>"}`);
  console.log(
    `    Tax: ${room.Price?.Tax !== undefined ? room.Price.Tax : "<<MISSING>>"}`,
  );
  console.log(
    `    OtherCharges: ${room.Price?.OtherCharges !== undefined ? room.Price.OtherCharges : "<<MISSING>>"}`,
  );
});
```

Expected output after fix:
```
🔍 DIAGNOSTIC: BlockRoom Price structure (TBO requires object, not array):
  Room 0 Price:
    Type: object
    Is Array: false
    CurrencyCode: "INR"
    RoomPrice: 1115.31
    Tax: 56.4
    OtherCharges: 30.74
```

## Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `api/tbo/roomMapper.js` | Price from array → single object | ✅ Matches TBO BlockRoom spec |
| `api/tbo/roomMapper.js` | Validation: array → object checks | ✅ Correctly validates structure |
| `api/tbo/book.js` | Added Price structure diagnostics | ✅ Enables verification in logs |

## Testing Instructions (Render)

1. Code is now ready for deployment to Render
2. Run the full booking flow test:
   ```bash
   cd /opt/render/project/src
   node test-tbo-full-booking-flow.js
   ```

3. Look for in Step 5 (BlockRoom) output:
   - Price structure should show: `Type: object` and `Is Array: false`
   - Should receive `ResponseStatus: 1` (success) from BlockRoom
   - No "Incorrect Currency Code in Price detail." error

4. If successful, move to Step 6 (Book) with full booking confirmation details

## Deployment Status

- ✅ Code changes complete
- ✅ Ready to push to main branch
- ⏳ Awaiting deployment to Render and test execution
