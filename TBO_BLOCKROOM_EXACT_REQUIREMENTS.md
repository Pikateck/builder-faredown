# TBO BlockRoom API - Exact Requirements Checklist

## HotelRoomDetails Array Requirements

Each room in the `HotelRoomDetails` array MUST have:

### ✅ SmokingPreference (CRITICAL)
```
Type: INTEGER (not String)
Values: 0, 1, 2, 3
- 0 = NoPreference
- 1 = Smoking
- 2 = NonSmoking
- 3 = Either

❌ WRONG: "NoPreference" (string)
✅ CORRECT: 0 (integer)
```

### ✅ Price (CRITICAL)
```
Type: ARRAY of objects (not single object)
Structure: [{ CurrencyCode, RoomPrice, ... }]

❌ WRONG: 
{
  "CurrencyCode": "USD",
  "RoomPrice": 261.64
}

✅ CORRECT:
[
  {
    "CurrencyCode": "USD",
    "RoomPrice": 261.64
  }
]
```

### Full Field Requirements

```json
{
  "RoomIndex": 0,                      // INTEGER: 0, 1, 2, ... (sequential)
  "RatePlanCode": "PLAN123",           // STRING: required
  "RatePlanName": "Plan Name",         // STRING: optional
  "RoomTypeCode": "RT001",             // STRING: required
  "RoomTypeName": "Room Type",         // STRING: required
  "BedTypes": [],                      // ARRAY: optional, can be empty
  "SmokingPreference": 0,              // INTEGER: 0-3, NOT STRING
  "Supplements": [],                   // ARRAY: required, can be empty
  "Price": [                           // ARRAY: required, not object!
    {
      "CurrencyCode": "USD",           // STRING
      "RoomPrice": 261.64,             // NUMBER
      "Tax": 0,                        // NUMBER
      "ExtraGuestCharge": 0,           // NUMBER
      "ChildCharge": 0,                // NUMBER
      "OtherCharges": 0,               // NUMBER
      "Discount": 0,                   // NUMBER
      "PublishedPrice": 261.64,        // NUMBER
      "PublishedPriceRoundedOff": 262, // INTEGER
      "OfferedPrice": 261.64,          // NUMBER
      "OfferedPriceRoundedOff": 262,   // INTEGER
      "AgentCommission": 0,            // NUMBER
      "AgentMarkUp": 0,                // NUMBER
      "TDS": 0                         // NUMBER
    }
  ]
}
```

## Type Conversion Rules

### SmokingPreference
```javascript
Input: "NoPreference" or "Smoking" or "NonSmoking" or "Either"
Conversion:
  "nopreference" → 0
  "smoking" → 1
  "nonsmoking" → 2
  "either" → 3
Output: Integer (0-3)
```

### Price
```javascript
Input: { CurrencyCode: "USD", RoomPrice: 100, ... }
Conversion: [{ CurrencyCode: "USD", RoomPrice: 100, ... }]
Output: Array with single object
```

## Common Errors & Fixes

| Error Message | Cause | Fix |
|---|---|---|
| "HotelRoomsDetails is not found" | SmokingPreference is string OR Price is object | Convert to correct types |
| Invalid type for field | Type mismatch in any field | Check each field's type |
| Price missing | Price array is empty | Ensure Price array has ≥1 object |
| Missing required field | Field is null/undefined | Validate before sending |

## Validation Checklist

Before sending to TBO, verify:

```javascript
✅ SmokingPreference instanceof Number  // typeof must be "number"
✅ [0, 1, 2, 3].includes(SmokingPreference)  // valid values
✅ Array.isArray(Price)  // Price is array
✅ Price.length > 0  // Price array not empty
✅ Price[0].CurrencyCode  // CurrencyCode present
✅ typeof Price[0].RoomPrice === "number"  // RoomPrice is number
✅ RoomIndex >= 0 && Number.isInteger(RoomIndex)  // RoomIndex is integer
```

## Quick Test

```bash
# Run this to verify the fix works:
node test-tbo-full-booking-flow.js

# Expected output:
# ✅ BlockRoom Response
#    ResponseStatus: 1
#    HotelRoomDetails count: (some number > 0)
```

---

**Key Takeaway**: TBO BlockRoom API is **very strict about data types**. SmokingPreference MUST be INTEGER (0-3) and Price MUST be ARRAY, not STRING or OBJECT.
