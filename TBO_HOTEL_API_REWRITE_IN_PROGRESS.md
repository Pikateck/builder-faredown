# TBO Hotel API Rewrite - In Progress Implementation

## Status

**~50% Complete** - Critical infrastructure fixes done, response parsing and remaining methods to complete

## Root Cause

The previous implementation was using WRONG endpoints and authentication method. The email credentials were misleading - they actually point to a different API than what was initially implemented.

## Correct API Documentation

- **API Provider**: Tek Travels (TBO rebranded)
- **Documentation**: https://apidoc.tektravels.com/hotel/
- **Key Pages Used**:
  - HotelSearch.aspx (method structure)
  - HotelSearch_json.aspx (sample payloads)
  - Authentication.aspx (auth method)
  - DestinationCityList.aspx (city mapping)

## Correct Endpoints (Updated in Code)

```
Authentication:   http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate
City List:        http://api.tektravels.com/SharedServices/StaticData.svc/rest/GetDestinationSearchStaticData
Hotel Search:     https://HotelBE.tektravels.com/hotelservice.svc/rest/Gethotelresult
Hotel Info:       https://HotelBE.tektravels.com/hotelservice.svc/rest/GetHotelInfo
Hotel Room:       https://HotelBE.tektravels.com/hotelservice.svc/rest/GetHotelRoom
PreBook:          https://HotelBE.tektravels.com/hotelservice.svc/rest/PreBook
Book:             https://HotelBE.tektravels.com/hotelservice.svc/rest/Book
```

## Authentication Flow

### Step 1: Authenticate

```json
POST http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate

Request:
{
  "ClientId": "ApiIntegrationNew",
  "UserName": "<from TBO_HOTEL_USER_ID env>",
  "Password": "<from TBO_HOTEL_PASSWORD env>",
  "EndUserIp": "<from config>"
}

Response:
{
  "TokenId": "string",
  "Status": 1,
  "Member": {...},
  "Error": {"ErrorCode": 0, "ErrorMessage": ""}
}
```

### Step 2: Get City List (to map city codes to numeric IDs)

```json
POST http://api.tektravels.com/SharedServices/StaticData.svc/rest/GetDestinationSearchStaticData

Request:
{
  "ClientId": "ApiIntegrationNew",
  "EndUserIp": "<from config>",
  "TokenId": "<from auth>",
  "SearchType": "1",
  "CountryCode": "IN"
}

Response:
{
  "GetDestinationSearchStaticDataResult": [
    {
      "DestinationId": 130443,  // ← This is the CityId to use!
      "DestinationCode": "DXB",
      "DestinationName": "Dubai",
      "CountryCode": "AE",
      "CountryName": "United Arab Emirates"
    }
  ],
  "Status": 1
}
```

### Step 3: Search Hotels

```json
POST https://HotelBE.tektravels.com/hotelservice.svc/rest/Gethotelresult

Request:
{
  "EndUserIp": "...",
  "TokenId": "<from auth>",
  "CheckInDate": "31/10/2025",  // dd/mm/yyyy FORMAT!
  "NoOfNights": 3,
  "CountryCode": "AE",
  "CityId": "130443",  // NUMERIC from city list
  "PreferredCurrency": "INR",
  "GuestNationality": "IN",
  "NoOfRooms": 1,
  "RoomGuests": [
    {
      "NoOfAdults": 2,
      "NoOfChild": 0,
      "ChildAge": []
    }
  ]
}

Response:
{
  "TraceId": "...",
  "Status": 1,
  "HotelResults": [
    {
      "HotelCode": "ABC|DXB",
      "HotelName": "...",
      "StarRating": 4,
      "Price": {
        "RoomPrice": 1200,
        "PublishedPrice": 1500,
        "OfferedPrice": 1250,
        "Tax": 100
      }
    }
  ]
}
```

## Changes Made to api/services/adapters/tboAdapter.js

### 1. Constructor (lines 34-54)

- Updated all endpoint URLs to correct Tek Travels API endpoints
- Changed hotelClientId to "ApiIntegrationNew" (required by API)
- Added separate endpoint configs for each operation

### 2. getHotelToken() (lines 875-975)

✅ COMPLETE

- Uses correct auth endpoint
- Sends correct payload (ClientId, UserName, Password, EndUserIp)
- Validates Status === 1
- Proper error handling and logging

### 3. New method: \_formatDateForTBO()

✅ COMPLETE

- Converts yyyy-mm-dd to dd/mm/yyyy format
- Required by API

### 4. New method: getCityId()

✅ COMPLETE

- Calls GetDestinationSearchStaticData endpoint
- Returns numeric DestinationId from city code
- Handles city code matching (PAR → 130443, DXB → numeric ID, etc.)

### 5. Updated searchHotels() - PARTIAL

🔄 IN PROGRESS

- Refactored to new flow:
  1. Get TokenId
  2. Get CityId from destination code
  3. Calculate NoOfNights
  4. Build RoomGuests
  5. Build payload with correct format (TokenId, NOT credentials)

**STILL NEED TO**:

- Complete the API call to hotelSearchEndpoint
- Parse response correctly
- Update response mapping for HotelResults format

## Remaining Tasks (In Priority Order)

### 1. Complete searchHotels() Response Handling

Location: api/services/adapters/tboAdapter.js around line 1180-1300

Should:

- Call tboRequest to hotelSearchEndpoint
- Parse response.data.HotelResults (array)
- Map to UnifiedHotel format:
  - hotelId = HotelCode
  - name = HotelName
  - starRating = StarRating
  - pricing = Price.RoomPrice, Price.PublishedPrice, etc.

### 2. Update Other Hotel Methods

All need same changes:

- preBookHotel (use TokenId, not credentials)
- bookHotel (use TokenId, not credentials)
- generateHotelVoucher (use TokenId, not credentials)
- getHotelBookingDetails (use TokenId, not credentials)
- cancelHotelBooking (use TokenId, not credentials)
- getHotelInfo (use TokenId, not credentials, correct endpoint)
- getHotelRoom (use TokenId, not credentials, correct endpoint)
- getChangeRequestStatus (use TokenId, not credentials)

Replace all instances of:

```javascript
// OLD (WRONG):
const payload = {
  TokenId: tokenId,
  ...params,
};

// NEW (CORRECT):
const payload = {
  EndUserIp: this.config.endUserIp,
  TokenId: tokenId,
  ...params,
};
```

### 3. Test Flow

1. Search for "Dubai" (DXB)
2. Verify CityId resolution works
3. Verify hotel search returns results with Status: 1
4. Verify pricing is visible in response

### 4. Update City Caching (Optional, Performance)

Consider caching city codes → DestinationId mappings in Redis/DB for faster lookups

## Environment Variables Needed

```
TBO_HOTEL_USER_ID="BOMF145"
TBO_HOTEL_PASSWORD="@Bo#4M-Api@"
TBO_END_USER_IP="192.168.5.56"  # Can be any private IP
```

## Expected Success Indicators

- getHotelToken() returns valid TokenId
- getCityId() maps DXB → numeric ID
- searchHotels() returns Response with Status: 1
- HotelResults array contains hotels with pricing

## Debugging Notes

- Check logs for "TBO hotel search initiated" to see full flow
- Check "City list response received" to verify city fetching
- Check response.data?.Status === 1 to confirm success
- The 401 error was because wrong endpoint and auth method were used previously
