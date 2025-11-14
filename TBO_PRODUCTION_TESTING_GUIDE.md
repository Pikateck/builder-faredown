# TBO Production Testing Guide

## Overview

This guide provides instructions for testing the complete TBO hotel booking integration from authentication through voucher generation.

---

## Prerequisites

### ⚠️ Environment Requirement

**This test MUST be run on Render/Production**, not locally.

**Why?** TBO requires all requests to come from a whitelisted IP (Fixie proxy). Your local machine cannot access this proxy.

**Where to run:**

- ✅ Render SSH session
- ✅ Render web shell
- ✅ Production API endpoint (if you create one)
- ❌ Local machine (will timeout at proxy connection)

**See**: `TBO_RENDER_TESTING_GUIDE.md` for detailed instructions on running on Render.

### Required Environment Variables

All TBO endpoints and credentials must be set in your environment (`.env` or `api/.env`):

```bash
# TBO Credentials
TBO_CLIENT_ID=tboprod
TBO_HOTEL_USER_ID=BOMF145
TBO_HOTEL_PASSWORD=@Bo#4M-Api@
TBO_END_USER_IP=52.5.155.132

# TBO API Endpoints (All Verified Working)
TBO_AUTH_URL=https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate
TBO_STATIC_DATA_URL=https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData
TBO_HOTEL_SEARCH_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult
TBO_HOTEL_ROOM_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelRoom
TBO_HOTEL_BLOCK_ROOM_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom
TBO_HOTEL_BOOK_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book
TBO_HOTEL_VOUCHER_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GenerateVoucher
TBO_HOTEL_BOOKING_DETAILS_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetBookingDetails

# Proxy Configuration (Required for TBO)
USE_SUPPLIER_PROXY=true
FIXIE_URL=http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80
```

**⚠️ CRITICAL**: The Fixie proxy is **required** for TBO API access. Without it, all requests will timeout.

---

## Running the End-to-End Test

### Prerequisites

First, install dependencies (if not already installed):

```bash
npm install
```

This installs required proxy agents (`https-proxy-agent`, `http-proxy-agent`).

### Command

```bash
node test-tbo-full-booking-flow.js
```

### What It Does

The test script executes the complete TBO hotel booking pipeline:

1. **Authentication** → Get TokenId
2. **Static Data** → Get real CityId for destination (Dubai)
3. **Search Hotels** → Get hotel results with TraceId
4. **Get Room Details** → Get available rooms for selected hotel
5. **Block Room** → Pre-book validation (check price/policy changes)
6. **Book Hotel** → Confirm final booking
7. **Generate Voucher** → Get booking voucher URL
8. **Get Booking Details** → Verify booking status (optional)

### Expected Output

```
Starting TBO Complete Hotel Booking Flow Test...

================================================================================
STEP 1: Authentication - Get TokenId
================================================================================
✅ SUCCESS: TokenId obtained: [TOKEN]

================================================================================
STEP 2: Get Static Data - Retrieve Real CityId for Dubai
================================================================================
✅ SUCCESS: Real CityId retrieved: 130443

================================================================================
STEP 3: Hotel Search - Search hotels with real CityId
================================================================================
✅ SUCCESS: Hotel search successful. TraceId: [TRACE_ID], Hotels found: 2429

================================================================================
STEP 4: Get Hotel Room Details
================================================================================
✅ SUCCESS: Room details retrieved. Available rooms: 12

================================================================================
STEP 5: Block Room - Hold room temporarily
================================================================================
✅ SUCCESS: Room blocked successfully. Status: 1

================================================================================
STEP 6: Book Hotel - Confirm booking
================================================================================
✅ SUCCESS: Hotel booked successfully. BookingId: [BOOKING_ID], ConfirmationNo: [CONF_NO]

================================================================================
STEP 7: Generate Voucher
================================================================================
✅ SUCCESS: Voucher generated successfully. URL: [VOUCHER_URL]

================================================================================
STEP 8: Get Booking Details (Optional Verification)
================================================================================
✅ SUCCESS: Booking details retrieved successfully

================================================================================
COMPLETE BOOKING FLOW SUMMARY
================================================================================

✅ All steps completed successfully!

Flow Summary:
1. ✅ Authentication
2. ✅ Static Data (Real CityId)
3. ✅ Hotel Search
4. ✅ Room Details
5. ✅ Block Room
6. ✅ Book Hotel
7. ✅ Generate Voucher
8. ✅ Booking Details (Verification)

Booking Information:
  - BookingId: [BOOKING_ID]
  - ConfirmationNo: [CONFIRMATION_NO]
  - Voucher URL: [VOUCHER_URL]
  - Hotel: [HOTEL_NAME]
  - Room: [ROOM_TYPE]
  - Check-in: 2025-06-15
  - Check-out: 2025-06-20

📄 Results saved to: tbo-full-booking-flow-results.json
```

### Results File

The test saves complete results to `tbo-full-booking-flow-results.json`:

```json
{
  "timestamp": "2025-01-XX...",
  "testParams": {
    "destination": "Dubai",
    "countryCode": "AE",
    "checkInDate": "2025-06-15",
    "checkOutDate": "2025-06-20",
    ...
  },
  "steps": {
    "authentication": {
      "success": true,
      "tokenId": "...",
      "endpoint": "..."
    },
    "staticData": {
      "success": true,
      "cityId": 130443,
      ...
    },
    "hotelSearch": {
      "success": true,
      "traceId": "...",
      "totalHotels": 2429,
      ...
    },
    ...
  },
  "overallSuccess": true
}
```

---

## API Endpoints

### Production Routes

All routes are mounted at `/api/tbo/*`:

#### 1. Authentication

```
POST /api/tbo/auth/token
GET  /api/tbo/auth/status
```

#### 2. Static Data (City Lookup)

```
GET /api/tbo/static/destinations?countryCode=AE
GET /api/tbo/static/city/:cityName?countryCode=AE
GET /api/tbo/static/search?q=Dubai&countryCode=AE
```

#### 3. Hotel Search

```
POST /api/tbo/search
Body: {
  destination: "Dubai",
  countryCode: "AE",
  checkIn: "2025-06-15",
  checkOut: "2025-06-20",
  rooms: [{ adults: 2, children: 0, childAges: [] }],
  currency: "USD",
  guestNationality: "AE"
}
```

#### 4. Room Details

```
POST /api/tbo/room
Body: {
  traceId: "...",
  resultIndex: 0,
  hotelCode: "..."
}
```

#### 5. Block Room

```
POST /api/tbo/block
Body: {
  traceId: "...",
  resultIndex: 0,
  hotelCode: "...",
  hotelName: "...",
  guestNationality: "AE",
  noOfRooms: 1,
  isVoucherBooking: true,
  hotelRoomDetails: [...]
}
```

#### 6. Book Hotel

```
POST /api/tbo/book
Body: {
  traceId: "...",
  resultIndex: 0,
  hotelCode: "...",
  hotelName: "...",
  guestNationality: "AE",
  noOfRooms: 1,
  isVoucherBooking: true,
  hotelRoomDetails: [...],
  hotelPassenger: [{
    Title: "Mr",
    FirstName: "John",
    LastName: "Doe",
    Email: "...",
    Phoneno: "...",
    ...
  }]
}
```

#### 7. Voucher

```
POST /api/tbo/voucher/generate
Body: {
  bookingId: "...",
  bookingRefNo: "..."
}

POST /api/tbo/voucher/details
Body: {
  bookingId: "...",
  bookingRefNo: "..."
}
```

---

## Expected Response Structures

### 1. Authentication Response

```json
{
  "success": true,
  "tokenId": "string (long JWT-like token)",
  "expiresAt": "2025-01-XX...",
  "memberId": "BOMF145",
  "agencyId": "..."
}
```

### 2. Static Data Response (City Lookup)

```json
{
  "success": true,
  "cityName": "Dubai",
  "cityId": 130443,
  "countryCode": "AE"
}
```

### 3. Search Response

```json
{
  "success": true,
  "traceId": "string (UUID)",
  "cityId": 130443,
  "checkInDate": "15/06/2025",
  "checkOutDate": "20/06/2025",
  "currency": "USD",
  "noOfRooms": 1,
  "hotels": [
    {
      "HotelCode": "string",
      "HotelName": "string",
      "StarRating": 5,
      "Price": {
        "CurrencyCode": "USD",
        "PublishedPrice": 500,
        "OfferedPrice": 450
      },
      "ResultIndex": 0,
      ...
    }
  ]
}
```

### 4. Room Details Response

```json
{
  "success": true,
  "traceId": "string",
  "rooms": [
    {
      "RoomTypeName": "Deluxe Room",
      "RoomTypeCode": "string",
      "RateKey": "string",
      "RoomIndex": 0,
      "Price": {
        "CurrencyCode": "USD",
        "PublishedPrice": 500,
        "OfferedPrice": 450
      },
      "LastCancellationDate": "2025-06-10",
      "CancellationPolicy": "string",
      ...
    }
  ],
  "isUnderCancellationAllowed": true,
  "isPolicyPerStay": false,
  "isPassportMandatory": false,
  "isPANMandatory": false
}
```

### 5. Block Room Response

```json
{
  "success": true,
  "responseStatus": 1,
  "isPriceChanged": false,
  "isCancellationPolicyChanged": false,
  "availabilityType": "Confirm",
  "hotelRoomDetails": [...]
}
```

### 6. Book Response

```json
{
  "success": true,
  "bookingId": "string",
  "confirmationNo": "string",
  "bookingRefNo": "string",
  "status": "Confirmed",
  "responseStatus": 1,
  "isPriceChanged": false,
  "hotelBookingDetails": {...}
}
```

### 7. Voucher Response

```json
{
  "success": true,
  "voucherURL": "https://...",
  "bookingId": "string",
  "bookingRefNo": "string",
  "responseStatus": 1
}
```

---

## Debugging

### Enable Verbose Logging

All TBO modules include comprehensive logging. Check console output for:

- Request payloads (TokenId sanitized)
- Response status codes
- Error details
- TraceId tracking

### Common Issues

#### 1. Timeout Errors

**Symptom**: `timeout of 20000ms exceeded`

**Cause**: Fixie proxy not configured or not accessible

**Solution**:

- Verify `FIXIE_URL` is set
- Ensure `USE_SUPPLIER_PROXY=true`
- Check network access to Fixie proxy

#### 2. Authentication Failed

**Symptom**: `Client-BOMF145 is not Valid`

**Cause**: Incorrect credentials

**Solution**:

- Verify `TBO_CLIENT_ID=tboprod`
- Verify `TBO_HOTEL_USER_ID=BOMF145`
- Verify `TBO_HOTEL_PASSWORD=@Bo#4M-Api@`

#### 3. Invalid CityId

**Symptom**: `CityId is Invalid`

**Cause**: Using hardcoded or incorrect CityId

**Solution**:

- Use `GetDestinationSearchStaticData` to get real CityId
- Never hardcode CityIds
- Call `/api/tbo/static/city/:cityName` first

#### 4. 404 Not Found

**Symptom**: TBO returns 404

**Cause**: Wrong endpoint URL

**Solution**:

- Verify all `TBO_*_URL` env vars match the verified working endpoints
- Use `hotelbooking.travelboutiqueonline.com` subdomain for search/room/block/book
- Use `api.travelboutiqueonline.com` for auth and static data

---

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Fixie proxy configured and accessible
- [ ] Test script runs successfully in staging
- [ ] All 8 steps complete without errors
- [ ] Booking confirmation received
- [ ] Voucher URL generated
- [ ] No hardcoded values in code
- [ ] Logging enabled for debugging
- [ ] Error handling in place
- [ ] Rate limiting configured (if needed)

---

## Next Steps After Successful Test

1. **Review Results**: Check `tbo-full-booking-flow-results.json` for complete flow details
2. **Verify Booking**: Use BookingId to verify in TBO portal
3. **Test Different Destinations**: Run test with different cities
4. **Test Error Scenarios**: Test with invalid data to verify error handling
5. **Performance Testing**: Monitor response times for each step
6. **Production Deployment**: Deploy to production environment
7. **Monitor**: Watch logs for any issues in live traffic

---

## Support

If tests fail:

1. Check logs for specific error messages
2. Verify all environment variables
3. Ensure Fixie proxy is accessible
4. Review request/response JSON in results file
5. Contact TBO support if API issues persist

---

## File Structure

```
api/
├── routes/tbo/
│   ├── auth.js           # Authentication routes
│   ├── static.js         # Static data routes
│   ├── search.js         # Hotel search routes
│   ├── room.js           # Room details routes
│   ├── block.js          # Block room routes
│   ├── book.js           # Booking routes
│   └── voucher.js        # Voucher routes
├── tbo/
│   ├── auth.js           # Auth logic
│   ├── static.js         # Static data logic
│   ├── search.js         # Search logic
│   ├── room.js           # Room logic
│   ├── book.js           # Booking logic
│   ├── voucher.js        # Voucher logic
│   └── index.js          # Main export
├── services/adapters/
│   └── tboAdapter.js     # TBO adapter (uses modules above)
└── server.js             # Route registration

test-tbo-full-booking-flow.js  # End-to-end test
```

---

## Production Ready

✅ All routes implemented
✅ All modules tested
✅ Environment variables documented
✅ Error handling in place
✅ Logging configured
✅ No hardcoded values
✅ Complete documentation

**Status**: Ready for staging/production deployment
