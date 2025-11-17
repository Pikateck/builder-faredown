# TBO BlockRoom CategoryId Null Error - Diagnostic Guide

## Problem

BlockRoom API is failing with:

```
ResponseStatus: 3
ErrorCode: 3
ErrorMessage: "CategoryId cannot be null"
```

Even though we're sending `CategoryId: "1###00018237"` in the `HotelRoomsDetails` array.

## Root Causes (Most Likely to Least Likely)

### 1. ✅ CategoryId is Missing from GetHotelRoom Response

**Likelihood: HIGH**

If GetHotelRoom is not returning CategoryId in the room object, the mapper will now log a validation error.

**How to verify:**

- In the test output, look for: `CategoryId is required`
- Check GetHotelRoom response to confirm it includes CategoryId field

**How to fix:**

- If GetHotelRoom is NOT returning CategoryId, we need to:
  - Extract it from `hotel.SupplierHotelCodes[0].CategoryId` instead
  - Or use a different field from GetHotelRoom response

### 2. CategoryId is Being Defaulted to Empty String

**Likelihood: MEDIUM**

Before this fix, the mapper was doing:

```javascript
CategoryId: room.CategoryId || "";
```

This would set it to `""` if CategoryId was falsy (including `0`, `false`, or missing).

**How to verify:**

- Run test with new diagnostic logging
- Look for: `⚠️  WARNING: CategoryId is EMPTY STRING!`
- Or: `Room 0: CategoryId = "<<MISSING>>"`

**How to fix:**

- Already fixed! Now defaults to `undefined` instead of empty string
- Validation will reject rooms without CategoryId

### 3. TBO Expects Different Field Name

**Likelihood: MEDIUM**

TBO might expect one of:

- `CategoryCode` (not CategoryId)
- `RoomCategoryId`
- `CategoryID` (capital D)

**How to verify:**

- Check TBO's official BlockRoom request schema/docs
- Look at similar APIs to see naming patterns

**How to fix:**

- Mapper now checks: `room.CategoryId || room.CategoryCode || room.RoomCategoryId`
- If still failing, add more field aliases to the mapper

### 4. CategoryId Value Format is Wrong

**Likelihood: LOW**

The format `"1###00018237"` might not be correct. TBO might expect:

- Just the numeric ID: `"1"`
- Different delimiter: `"1-00018237"`
- Different source: `SupplierHotelCodes[0].CategoryId` instead of room.CategoryId

**How to verify:**

- Check test output to see exact CategoryId value being sent
- Compare with TBO documentation or sample requests
- Check if multiple CategoryIds are coming from hotel search

**How to fix:**

- Parse the CategoryId differently
- Use SupplierHotelCodes[0].CategoryId from the original hotel search result

### 5. Missing Field at Different Location

**Likelihood: LOW**

TBO might require CategoryId at:

- Root level of request (not inside HotelRoomsDetails)
- In multiple places
- With a ResultIndex or SupplierIndex alongside it

**How to verify:**

- Compare with TBO's official BlockRoom request schema
- Look at actual successful TBO test cases

**How to fix:**

- Add CategoryId to root level of request
- Add SupplierIndex or ResultIndex

## Diagnostic Steps to Take

### Step 1: Deploy and Run Test

```bash
cd /opt/render/project/src
git pull  # Get latest code with diagnostics
node test-tbo-full-booking-flow.js
```

### Step 2: Check Output in Step 5 (Block Room)

Look for this section:

```
🔍 DIAGNOSTIC: CategoryId in HotelRoomsDetails before sending:
  Room 0: CategoryId = "1###00018237"
    Type: string
    Truthy: true
```

**Scenarios:**

#### Scenario A: CategoryId is Missing

```
Room 0: CategoryId = "<<MISSING>>"
  Type: undefined
  Truthy: false
❌ ERROR: Room validation failed
  Errors: CategoryId is required (got: undefined)
```

**Action:** CategoryId is not coming from GetHotelRoom. Check if GetHotelRoom response includes it.

#### Scenario B: CategoryId is Empty String

```
Room 0: CategoryId = ""
  Type: string
  Truthy: false
⚠️  WARNING: CategoryId is EMPTY STRING!
❌ ERROR: Room validation failed
  Errors: CategoryId is required (got: "")
```

**Action:** GetHotelRoom might be returning CategoryId as null/undefined/empty. Need to handle this.

#### Scenario C: CategoryId is Present and Valid

```
Room 0: CategoryId = "1###00018237"
  Type: string
  Truthy: true
✅ Validation passed
📤 Request Payload: {..."CategoryId": "1###00018237"...}
```

But still getting `"ResponseStatus": 3, "CategoryId cannot be null"` from TBO.

**Action:** Issue is likely in TBO's side or our request structure. Check:

1. If field name needs to be different
2. If CategoryId needs to be in different location
3. If CategoryId format is wrong

### Step 3: Check GetHotelRoom Response

Look at the GetHotelRoom response in test output (Step 4) and verify:

```
✅ Room details retrieved. Available rooms: 1

Sample Rooms (first 3):
  1. Standard Room - INR 1202.45
     Cancellation: 2025-11-16T23:59:59
     Fields: RoomTypeID=undefined, RoomCombination=undefined, RoomIndex=1
```

Then look at "Full GetHotelRoom response structure (first room)" and check:

- Is `CategoryId` present? What's the value?
- Are there any other "Category" related fields?
- Is there `SupplierHotelCodes` array with CategoryId?

## How to Extract CategoryId from Different Locations

If CategoryId is not at the room level, it might be in:

```javascript
// Scenario 1: In SupplierHotelCodes array
const categoryId = room.SupplierHotelCodes?.[0]?.CategoryId;

// Scenario 2: In a different field
const categoryId = room.CategoryCode || room.RoomCategoryId || room.Category;

// Scenario 3: Needs to be extracted from hotel search result
// In this case, we'd need to pass the original hotel code
// and look up its CategoryId from the search response
```

## Code Changes Made

### 1. roomMapper.js

- **Before:** `CategoryId: room.CategoryId || ""`
- **After:** `CategoryId: room.CategoryId || room.CategoryCode || room.RoomCategoryId || undefined`
- **Effect:** No longer silently defaults to empty string; undefined if missing

### 2. roomMapper.js (validation)

- **Added:** Explicit check for CategoryId presence
- **Effect:** Will fail validation if CategoryId is missing

### 3. book.js (BlockRoom)

- **Added:** Diagnostic logging showing exact CategoryId value and type
- **Effect:** Will show in test output what's being sent

## Next Steps

1. **Deploy code** with diagnostic changes
2. **Run test** on Render and check diagnostic output
3. **Analyze output** using scenarios above
4. **Report findings** with exact test output

## If Still Failing After Diagnostics

Please provide:

1. Full test output from Step 4 (GetHotelRoom response) and Step 5 (BlockRoom diagnostic)
2. Exact error message from BlockRoom response
3. Whether CategoryId is present/missing in diagnostic output
4. Any patterns you notice in CategoryId values (format, length, content)

Then we can:

1. Try alternative field names
2. Change where CategoryId is extracted from
3. Check TBO documentation for field naming
4. Test with different hotels to see if pattern changes
