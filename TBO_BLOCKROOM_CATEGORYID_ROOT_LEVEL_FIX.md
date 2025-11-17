# TBO BlockRoom CategoryId Root-Level Fix - DEPLOYED

## Problem Identified

TBO's BlockRoom API specification requires `CategoryId` as a **mandatory top-level field (field 6)** in the request, not nested inside `HotelRoomsDetails`.

**What we were sending:**
```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "...",
  "TraceId": "...",
  "ResultIndex": 600,
  "HotelCode": "1489429",
  "HotelName": "",
  "GuestNationality": "IN",
  "NoOfRooms": 1,
  "IsVoucherBooking": true,
  "HotelRoomsDetails": [
    {
      "RoomIndex": 1,
      "CategoryId": "1###00018237",  // ✅ Inside room (correct)
      ...
    }
  ]
  // ❌ NO CategoryId at root level
}
```

**TBO's response:**
```
ResponseStatus: 3
ErrorCode: 3
ErrorMessage: "CategoryId cannot be null"
```

## Solution Implemented

### Changes to `api/tbo/book.js` (BlockRoom function)

**1. Extract CategoryId from primary room:**
```javascript
const primaryRoom = mappedRooms[0];
const blockRoomCategoryId =
  primaryRoom?.CategoryId ||
  primaryRoom?.CategoryCode ||
  primaryRoom?.RoomCategoryId ||
  undefined;
```

**2. Add as top-level field in request:**
```javascript
const request = {
  EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
  TokenId: tokenId,
  TraceId: traceId,
  ResultIndex: Number(resultIndex),
  HotelCode: String(hotelCode),
  CategoryId: blockRoomCategoryId,  // ✅ TOP-LEVEL per TBO spec (field 6)
  HotelName: hotelName,
  GuestNationality: guestNationality,
  NoOfRooms: Number(noOfRooms),
  IsVoucherBooking: isVoucherBooking,
  HotelRoomsDetails: mappedRooms,
};
```

**3. Enhanced diagnostic logging:**
```
🔍 DIAGNOSTIC: BlockRoom CategoryId (TBO spec requires top-level):
  Root CategoryId   : "1###00018237"
    Type: string
    Truthy: true

🔍 DIAGNOSTIC: CategoryId in HotelRoomsDetails (nested):
  Room 0: CategoryId = "1###00018237"
    Type: string
    Truthy: true
```

## Commits Pushed

```
751b7cac Update diagnostic logging to show root and room CategoryId
15592d15 Add top-level CategoryId to BlockRoom request as per TBO spec
```

**Status:** Pushed to `origin/main` ✅

## Expected Result

When the test runs on Render after deployment, Step 5 (BlockRoom) should now show:

```
Step 5: Block Room - Hold room temporarily
...
Step 2: Blocking room...
  URL: https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/blockRoom
  TraceId: f7208028-226b-4f65-978b-ab0773ec499a
  HotelCode: 1489429
  ...

🔍 DIAGNOSTIC: BlockRoom CategoryId (TBO spec requires top-level):
  Root CategoryId   : "1###00018237"
    Type: string
    Truthy: true

📤 Request Payload:
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "...",
  "TraceId": "f7208028-226b-4f65-978b-ab0773ec499a",
  "ResultIndex": 857,
  "HotelCode": "1489429",
  "CategoryId": "1###00018237",  // ✅ NOW PRESENT AT ROOT
  "HotelName": "",
  "GuestNationality": "IN",
  "NoOfRooms": 1,
  "IsVoucherBooking": true,
  "HotelRoomsDetails": [...]
}

📥 TBO BlockRoom Response
  HTTP Status: 200
  ResponseStatus: 1  // ✅ SUCCESS!
  AvailabilityType: Confirm
  IsPriceChanged: false
  IsCancellationPolicyChanged: false
  HotelRoomDetails count: 1
  Error: None

✅ SUCCESS: Room blocked successfully. ResponseStatus: 1
```

## Next Steps

1. **Render auto-deploys** (2-5 minutes after push)
2. **Run test on Render:**
   ```bash
   cd /opt/render/project/src
   node test-tbo-full-booking-flow.js
   ```
3. **Check Step 5 output:**
   - Is `Root CategoryId` present and non-empty?
   - Is `ResponseStatus: 1` in TBO response?
   - If yes → Move to Book endpoint (Step 6)
   - If still failing → Analyze the error

## Future Enhancements (De-dupe Support)

Per TBO's note: **"User should send CategoryId of the De-dupe result..."**

For de-dupe cases where multiple supplier codes map to one hotel:
- Store `CategoryId` from `SupplierHotelCodes[...]` when searching
- Pass it through to BlockRoom builder
- Use **that** as the root CategoryId instead of/alongside the room CategoryId

This would look like:
```javascript
// From HotelResults in search response:
SupplierHotelCodes: [
  { CategoryId: "3###108627", CategoryIndex: 1 },
  { CategoryId: "13###4654", CategoryIndex: 2 }
]

// Select based on user preference or default to [0]
const selectedSupplierCode = SupplierHotelCodes[0];
const deDupeCategoryId = selectedSupplierCode.CategoryId;

// Use in BlockRoom
const blockRoomPayload = {
  ...
  CategoryId: deDupeCategoryId,  // Use de-dupe CategoryId
  ...
}
```

This would ensure we're using TBO's exact "de-dupe result" CategoryId as they specify.

## Files Modified

```
api/tbo/book.js
  - Lines 96-103: Extract CategoryId from primary room
  - Line 111: Add as top-level field in request
  - Lines 131-143: Enhanced diagnostic logging showing both root and nested CategoryId
```

## Verification Checklist

After Render deployment and test run:

- [ ] Diagnostic shows `Root CategoryId` is present
- [ ] BlockRoom response shows `ResponseStatus: 1` (success)
- [ ] No `"CategoryId cannot be null"` error
- [ ] Test proceeds to Step 6 (Book)
- [ ] End-to-end flow works: Search → GetHotelRoom → BlockRoom → Book ✅
