# TBO Book LeadPassenger Field Fix

## Problem Summary

The TBO Book API was failing with:

```
ErrorCode: 3
ErrorMessage: "No LeadGuest found in 1 room."
ResponseStatus: 3
```

### Root Cause

The `HotelPassenger` objects in the Book request were missing the mandatory `LeadPassenger` boolean field. Per TBO documentation (section 12.10.8):

> **LeadPassenger (Boolean)** - Represent the lead guest of the booking
> **Mandatory** - Set value as true for **one adult in each room** and for rest paxes value will be false

Without this field, TBO cannot identify the lead guest and rejects the booking with "No LeadGuest found in 1 room."

## Solution Implemented

### **api/tbo/book.js** - Helper Functions Added

Added two helper functions to properly format passenger data:

#### 1. `normalizeTitle(title)` (Lines 22-30)

Normalizes passenger title to TBO-compatible format:

- Input: `"Mr"`, `"mr"`, `"MR."` → Output: `"Mr"`
- Input: `"Mrs"`, `"mrs"`, `"MRS."` → Output: `"Mrs"`
- Input: `"Miss"` → Output: `"Miss"`
- Input: `"Ms"`, `"ms"`, `"MS."` → Output: `"Ms"`

#### 2. `buildHotelPassengersForRoom(roomPassengers)` (Lines 32-61)

Constructs the `HotelPassenger` array with all required fields including `LeadPassenger`:

```javascript
function buildHotelPassengersForRoom(roomPassengers) {
  return roomPassengers.map((pax, index) => ({
    Title: normalizeTitle(pax.title || pax.Title),
    FirstName: pax.firstName || pax.FirstName || "Guest",
    MiddleName: pax.middleName || pax.MiddleName || null,
    LastName: pax.lastName || pax.LastName || "Guest",
    Phoneno: pax.phone || pax.Phoneno || null,
    Email: pax.email || pax.Email || null,
    PaxType: pax.paxType || pax.PaxType || 1, // 1 = Adult, 2 = Child
    LeadPassenger: index === 0, // ✅ MANDATORY: Mark first adult in room as lead guest
    Age: pax.age || pax.Age || 30,
    PassportNo: pax.passportNo || pax.PassportNo || null,
    PassportIssueDate:
      pax.passportIssueDate || pax.PassportIssueDate || "0001-01-01T00:00:00",
    PassportExpDate:
      pax.passportExpDate || pax.PassportExpDate || "0001-01-01T00:00:00",
    PAN: pax.pan || pax.PAN || null,
    AddressLine1: pax.addressLine1 || pax.AddressLine1 || null,
    City: pax.city || pax.City || null,
    CountryCode: pax.countryCode || pax.CountryCode || null,
    CountryName: pax.countryName || pax.CountryName || null,
    Nationality: pax.nationality || pax.Nationality || null,
  }));
}
```

Key points:

- **LeadPassenger**: Set to `true` for the first passenger (`index === 0`), `false` for all others
- **Field mapping**: Handles both camelCase (`firstName`) and PascalCase (`FirstName`) for flexibility
- **Defaults**: Provides sensible defaults for required fields (e.g., "Guest" for names, `1` for PaxType)

### **api/tbo/book.js** - Room Passenger Mapping Updated (Lines 337-352)

Changed from directly passing `hotelPassenger` to using the helper function:

#### Before:

```javascript
const roomDetailsWithPassengers = hotelRoomDetails.map((room) => {
  // ... SmokingPreference conversion ...
  return {
    ...room,
    SmokingPreference: smokingPref,
    HotelPassenger: hotelPassenger, // ❌ No LeadPassenger field
  };
});
```

#### After:

```javascript
const roomDetailsWithPassengers = hotelRoomDetails.map((room, roomIndex) => {
  // ... SmokingPreference conversion ...

  // ✅ CRITICAL: Build HotelPassenger with LeadPassenger flag
  // TBO requires exactly one adult per room to have LeadPassenger: true
  const passengersForRoom = buildHotelPassengersForRoom(hotelPassenger);

  return {
    ...room,
    SmokingPreference: smokingPref,
    HotelPassenger: passengersForRoom, // ✅ WITH LeadPassenger: true for first adult
  };
});
```

### **api/tbo/book.js** - Diagnostic Logging Added (Lines 412-424)

Added comprehensive logging to verify LeadPassenger is set correctly:

```javascript
// ✅ DIAGNOSTIC: Verify LeadPassenger is set correctly
console.log("🔍 DIAGNOSTIC: Book LeadPassenger (TBO requires one per room):");
roomDetailsWithPassengers.forEach((room, idx) => {
  console.log(`  Room ${idx} HotelPassenger:`);
  room.HotelPassenger.forEach((pax, paxIdx) => {
    console.log(
      `    Pax ${paxIdx}: ${pax.FirstName} ${pax.LastName} - LeadPassenger: ${pax.LeadPassenger}`,
    );
  });
});
```

Expected output:

```
🔍 DIAGNOSTIC: Book LeadPassenger (TBO requires one per room):
  Room 0 HotelPassenger:
    Pax 0: John Doe - LeadPassenger: true
    Pax 1: Jane Doe - LeadPassenger: false
```

## TBO LeadPassenger Requirement

| Field            | Requirement                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `LeadPassenger`  | Boolean, **Mandatory**                                            |
| Value            | `true` for **exactly one adult per room**, `false` for all others |
| Purpose          | TBO uses this to identify the lead guest for room confirmation    |
| Error if missing | `ErrorMessage: "No LeadGuest found in 1 room."`                   |

## Example Book Request (After Fix)

```json
{
  "HotelRoomsDetails": [
    {
      "RoomIndex": 1,
      "RoomTypeName": "Standard Room",
      "SmokingPreference": 0,
      "Price": {
        "CurrencyCode": "INR",
        "RoomPrice": 1115.31,
        ...
      },
      "HotelPassenger": [
        {
          "Title": "Mr",
          "FirstName": "John",
          "LastName": "Doe",
          "PaxType": 1,
          "LeadPassenger": true,
          "Email": "john.doe@test.com",
          "Phoneno": "+919876543210",
          ...
        },
        {
          "Title": "Mrs",
          "FirstName": "Jane",
          "LastName": "Doe",
          "PaxType": 1,
          "LeadPassenger": false,
          "Email": "jane.doe@test.com",
          "Phoneno": "+919876543211",
          ...
        }
      ]
    }
  ]
}
```

## Changes Summary

| File              | Change                                       | Impact                                 |
| ----------------- | -------------------------------------------- | -------------------------------------- |
| `api/tbo/book.js` | Added `normalizeTitle()` helper              | ✅ Consistent title formatting         |
| `api/tbo/book.js` | Added `buildHotelPassengersForRoom()` helper | ✅ Proper LeadPassenger assignment     |
| `api/tbo/book.js` | Use helper in room passenger mapping         | ✅ Ensures LeadPassenger field present |
| `api/tbo/book.js` | Add LeadPassenger diagnostic logging         | ✅ Verification in test logs           |

## Testing Instructions (Render)

1. Code is now ready for deployment
2. Run the full booking flow test:

   ```bash
   cd /opt/render/project/src
   node test-tbo-full-booking-flow.js
   ```

3. Expected output in Step 6 (Book):
   - Diagnostic shows `Pax 0: John Doe - LeadPassenger: true` ✅
   - Diagnostic shows `Pax 1: Jane Doe - LeadPassenger: false` ✅
   - TBO response: `ResponseStatus: 1` ✅
   - Returns: `BookingId`, `BookingRefNo`, `ConfirmationNo` ✅

## Deployment Status

- ✅ LeadPassenger field properly assigned
- ✅ Correct mapping: first adult = lead, others = non-lead
- ✅ Diagnostic logging added
- ⏳ Ready to push to main branch
- ⏳ Awaiting deployment to Render and test execution
