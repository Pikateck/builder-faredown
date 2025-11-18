# TBO Hotel API v10.0 - Complete Specification

## Overview

TBO Hotel API v10.0 is a complete hotel booking and pre-booking system. All APIs use TokenId-based authentication and return standardized responses with HTTP status codes and TBO-specific error codes.

---

## Authentication & Static Data

### 1. Authenticate (Get TokenId)

**Endpoint:** `https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate`  
**Method:** POST  
**Authentication:** None (initial auth)

#### Request:

```json
{
  "ClientId": "tboprod",
  "UserName": "BOMF145",
  "Password": "@Bo#4M-Api@",
  "EndUserIp": "52.5.155.132"
}
```

#### Response (Success - Status: 200):

```json
{
  "Status": 1,
  "TokenId": "8e2afe5a-d0be-4f3a-bd33-8f15d64e76f8",
  "Member": {
    "MemberId": 123456,
    "AgencyId": "BOMF145",
    "AgencyName": "Agency Name",
    "FirstName": "Zubin",
    "LastName": "Aibara"
  },
  "Error": null
}
```

#### Error Responses:

- **Status: 401** - Invalid credentials
- **Status: 500** - Server error

#### TokenId Validity: 24 hours

---

### 2. Get Destination Search Static Data (Get CityId)

**Endpoint:** `https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/GetDestinationSearchStaticData`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId from Auth]"
}
```

#### Response (Contains all countries and cities):

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "Country": [
    {
      "CountryCode": "IN",
      "CountryName": "India",
      "City": [
        {
          "CityId": 10448,
          "CityName": "Delhi",
          "CountryCode": "IN"
        },
        {
          "CityId": 10449,
          "CityName": "Mumbai",
          "CountryCode": "IN"
        }
      ]
    }
  ],
  "Error": null
}
```

#### Key Fields:

- **CityId**: Numeric identifier for destination (required for search)
- **CountryCode**: ISO 2-letter country code (required for search)

---

## Hotel Search & Room Details

### 3. Search Hotels (GetHotelResult)

**Endpoint:** `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId]",
  "CheckInDate": "15/12/2025",
  "NoOfNights": 3,
  "CountryCode": "AE",
  "CityId": 12345,
  "PreferredCurrency": "USD",
  "GuestNationality": "IN",
  "NoOfRooms": 2,
  "RoomGuests": [
    {
      "NoOfAdults": 2,
      "NoOfChild": 0,
      "ChildAge": []
    },
    {
      "NoOfAdults": 1,
      "NoOfChild": 1,
      "ChildAge": [5]
    }
  ],
  "IsNearBySearchAllowed": false,
  "MaxRating": 5,
  "MinRating": 0
}
```

#### Response (Success - Status: 200):

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "TraceId": "abc123def456",
  "HotelResults": [
    {
      "ResultIndex": 0,
      "HotelCode": "TBO123456",
      "HotelName": "Luxury Hotel Dubai",
      "StarRating": 5,
      "Address": "Main Street, Dubai",
      "Latitude": 25.2048,
      "Longitude": 55.2708,
      "Price": {
        "CurrencyCode": "USD",
        "PublishedPrice": 500.0,
        "OfferedPrice": 450.0,
        "RoomPrice": 400.0,
        "Tax": 50.0
      },
      "CategoryId": "CAT001",
      "IsTBOMapped": true,
      "SupplierHotelCodes": [
        {
          "SupplierCode": "HB654321",
          "SupplierName": "HotelBeds",
          "CategoryId": "CAT001"
        }
      ]
    }
  ],
  "Error": null
}
```

#### Response Fields:

- **ResultIndex**: Unique index for this hotel in results (0-based)
- **HotelCode**: Unique hotel code (required for GetHotelRoom)
- **TraceId**: Search session identifier (required for booking flow)
- **CategoryId**: De-dupe category (required for de-dupe hotels in BlockRoom/Book)
- **IsTBOMapped**: Boolean indicating if TBO inventory or mapped
- **Price**: Current rate with breakdown (PublishedPrice vs OfferedPrice)

#### Response Status Codes:

- **1**: Success
- **0**: Failure
- Check Error field for error message

---

### 4. Get Hotel Room Details (GetHotelRoom)

**Endpoint:** `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelRoom`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId]",
  "TraceId": "abc123def456",
  "ResultIndex": 0,
  "HotelCode": "TBO123456"
}
```

#### Response:

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "TraceId": "abc123def456",
  "HotelRoomsDetails": [
    {
      "RoomIndex": 1,
      "RoomId": 999,
      "RoomTypeCode": "SGL",
      "RoomTypeName": "Single Room",
      "RoomDescription": "Comfortable single room with city view",
      "AvailabilityType": "Confirm",
      "SmokingPreference": "NoPreference",
      "IsPassportMandatory": false,
      "IsPANMandatory": true,
      "IsTransferIncluded": false,
      "RequireAllPaxDetails": true,
      "Price": {
        "CurrencyCode": "USD",
        "RoomPrice": 400.0,
        "PublishedPrice": 500.0,
        "OfferedPrice": 450.0,
        "Tax": 50.0,
        "ExtraGuestCharge": 0,
        "ChildCharge": 0,
        "OtherCharges": 0,
        "Discount": 50.0
      },
      "CancellationPolicies": [
        {
          "FromDate": "2025-12-14",
          "ToDate": "2025-12-15",
          "ChargeType": 1,
          "CancellationCharge": 0
        },
        {
          "FromDate": "2025-12-15",
          "ChargeType": 2,
          "CancellationCharge": 100.0
        }
      ],
      "Amenities": ["WiFi", "Gym", "Pool"],
      "CategoryId": "CAT001",
      "RatePlanCode": "RATE001",
      "DayRates": []
    }
  ],
  "Error": null
}
```

#### Room Fields:

- **RoomIndex**: 1-based room index (required for BlockRoom/Book)
- **RoomTypeCode**: Code identifier (required for BlockRoom)
- **RoomTypeName**: Human-readable name (required for BlockRoom)
- **SmokingPreference**: "NoPreference", "Smoking", "NonSmoking", "Either"
- **CategoryId**: Category identifier (required for de-dupe hotels)
- **Price**: Object with pricing breakdown (RoomPrice, Tax, etc.)
- **IsPassportMandatory / IsPANMandatory**: Passenger document requirements
- **CancellationPolicies**: Array of cancellation rules with charge types

---

## Booking Flow (PreBook → Book → Voucher)

### 5. Block Room (PreBook) - Validate Pricing

**Endpoint:** `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId]",
  "TraceId": "abc123def456",
  "ResultIndex": 0,
  "HotelCode": "TBO123456",
  "HotelName": "Luxury Hotel Dubai",
  "GuestNationality": "IN",
  "NoOfRooms": 1,
  "CategoryId": "CAT001",
  "IsVoucherBooking": false,
  "HotelRoomsDetails": [
    {
      "RoomIndex": 1,
      "RoomTypeCode": "SGL",
      "RoomTypeName": "Single Room",
      "RatePlanCode": "RATE001",
      "SmokingPreference": 0,
      "Price": {
        "CurrencyCode": "USD",
        "RoomPrice": 400.0,
        "Tax": 50.0
      },
      "Supplements": []
    }
  ]
}
```

#### Response:

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "AvailabilityType": "Confirm",
  "IsPriceChanged": false,
  "IsCancellationPolicyChanged": false,
  "HotelRoomDetails": [
    {
      "RoomIndex": 1,
      "RoomTypeCode": "SGL",
      "RoomTypeName": "Single Room",
      "SmokingPreference": 0,
      "Price": {
        "CurrencyCode": "USD",
        "RoomPrice": 400.0,
        "Tax": 50.0
      }
    }
  ],
  "Error": null
}
```

#### Key Response Fields:

- **IsPriceChanged**: Boolean - if true, use updated Price in HotelRoomDetails for Book
- **IsCancellationPolicyChanged**: Boolean - cancellation terms may have changed
- **CategoryId**: Required for de-dupe flows only

#### SmokingPreference Values:

- **0** = NoPreference
- **1** = Smoking
- **2** = NonSmoking
- **3** = Either

---

### 6. Book Hotel (Final Booking)

**Endpoint:** `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId]",
  "TraceId": "abc123def456",
  "ResultIndex": 0,
  "HotelCode": "TBO123456",
  "HotelName": "Luxury Hotel Dubai",
  "GuestNationality": "IN",
  "NoOfRooms": 1,
  "CategoryId": "CAT001",
  "IsVoucherBooking": false,
  "HotelRoomsDetails": [
    {
      "RoomIndex": 1,
      "RoomTypeCode": "SGL",
      "RoomTypeName": "Single Room",
      "SmokingPreference": 0,
      "Price": {
        "CurrencyCode": "USD",
        "RoomPrice": 400.0,
        "Tax": 50.0
      },
      "HotelPassenger": [
        {
          "Title": "Mr",
          "FirstName": "John",
          "LastName": "Doe",
          "PaxType": 1,
          "Age": 35,
          "Email": "john@example.com",
          "Phoneno": "+91987654321",
          "PassportNo": "AB1234567",
          "PassportIssueDate": "2020-01-01",
          "PassportExpDate": "2030-01-01",
          "PAN": "AAAAA0000A",
          "Nationality": "IN",
          "AddressLine1": "123 Main Street",
          "City": "Mumbai",
          "CountryCode": "IN",
          "LeadPassenger": true
        }
      ],
      "Supplements": []
    }
  ]
}
```

#### Response:

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "BookingRefNo": "TBO20251215123456",
  "BookingId": 987654321,
  "ConfirmationNo": "CONF123456",
  "Status": "Confirmed",
  "HotelBookingDetails": {
    "HotelCode": "TBO123456",
    "HotelName": "Luxury Hotel Dubai",
    "CheckInDate": "2025-12-15",
    "CheckOutDate": "2025-12-18"
  },
  "Error": null
}
```

#### Response Fields:

- **BookingRefNo**: Reference for booking management (string format)
- **BookingId**: Numeric booking ID (integer)
- **ConfirmationNo**: Customer-facing confirmation number
- **Status**: "Confirmed", "Pending", "Hold", etc.

#### Passenger Requirements:

- **LeadPassenger**: Exactly ONE adult per room must have this flag = true
- **PAN**: Required if IsPANMandatory from GetHotelRoom
- **PassportNo**: Required if IsPassportMandatory from GetHotelRoom
- **Nationality**: Must match guest nationality

---

### 7. Generate Voucher (Get Booking Document)

**Endpoint:** `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GenerateVoucher`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId]",
  "BookingRefNo": "TBO20251215123456",
  "BookingId": 987654321
}
```

#### Response:

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "VoucherId": "VOUCH123456",
  "VoucherUrl": "https://tbo.example.com/voucher?id=VOUCH123456",
  "Error": null
}
```

---

### 8. Get Booking Details (Retrieve Booking Info)

**Endpoint:** `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetBookingDetails`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId]",
  "BookingRefNo": "TBO20251215123456",
  "BookingId": 987654321
}
```

#### Response:

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "BookingRefNo": "TBO20251215123456",
  "BookingId": 987654321,
  "HotelCode": "TBO123456",
  "HotelName": "Luxury Hotel Dubai",
  "CheckInDate": "2025-12-15",
  "CheckOutDate": "2025-12-18",
  "NoOfRooms": 1,
  "TotalAmount": 1200.0,
  "Currency": "USD",
  "Status": "Confirmed",
  "Error": null
}
```

---

## Cancellation & Changes

### 9. Send Change Request (Cancel/Modify)

**Endpoint:** `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/SendChangeRequest`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId]",
  "BookingId": 987654321,
  "ConfirmationNo": "CONF123456",
  "RequestType": 4,
  "Remarks": "Cancellation requested by customer"
}
```

#### RequestType Values:

- **1** = Modification
- **4** = Cancellation

#### Response:

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "ChangeRequestId": "CHG123456",
  "RequestStatus": "Processed",
  "CancellationCharge": 100.0,
  "RefundAmount": 1100.0,
  "Error": null
}
```

#### Response Fields:

- **RequestStatus**: "Pending", "Processed", "Rejected", etc.
- **CancellationCharge**: Amount charged for cancellation
- **RefundAmount**: Amount to be refunded to customer

---

### 10. Get Change Request Status

**Endpoint:** `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetChangeRequestStatus`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId]",
  "ChangeRequestId": "CHG123456"
}
```

#### Response:

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "ChangeRequestId": "CHG123456",
  "RequestStatus": "Processed",
  "ProcessedOn": "2025-12-14T10:30:00",
  "CancellationCharge": 100.0,
  "RefundAmount": 1100.0,
  "Error": null
}
```

---

## Agency Management

### 11. Get Agency Balance (Credit Check)

**Endpoint:** `https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/GetAgencyBalance`  
**Method:** POST  
**Authentication:** TokenId (required)

#### Request:

```json
{
  "EndUserIp": "52.5.155.132",
  "TokenId": "[TokenId]"
}
```

#### Response:

```json
{
  "Status": 1,
  "ResponseStatus": 1,
  "Balance": 50000.0,
  "Currency": "INR",
  "AgencyId": "BOMF145",
  "Error": null
}
```

---

## Validation Rules & Requirements

### Field Validation Rules

#### 1. Passenger Fields

- **Title**: "Mr", "Mrs", "Miss", "Ms", "Master", "Mademoiselle"
- **FirstName & LastName**: 2-50 characters, alphabetic
- **Email**: Valid email format (for confirmation)
- **Phoneno**: International format (+CC9999999999)
- **PaxType**: 1 (Adult), 2 (Child)

#### 2. Document Fields (when required)

- **PassportNo**: Format varies by country, max 20 chars
- **PassportIssueDate**: ISO format YYYY-MM-DD
- **PassportExpDate**: ISO format YYYY-MM-DD (must be >= CheckInDate)
- **PAN**: Indian PAN format AAAAA9999A (5 letters + 4 digits + 1 letter)

#### 3. Nationality

- **Nationality**: ISO 2-letter country code (IN, US, GB, etc.)
- Must be from TBO's supported nationality list

#### 4. Pricing Fields (in Price object)

- **CurrencyCode**: ISO 3-letter code (USD, INR, GBP, EUR, etc.)
- **RoomPrice**: ≥ 0 (per night or per stay, depends on IsPerStay)
- **Tax**: ≥ 0
- **PublishedPrice**: PublishedPrice ≥ RoomPrice
- **OfferedPrice**: OfferedPrice ≤ PublishedPrice (RPM/RSP rule)

#### 5. Room Fields

- **RoomTypeCode**: Required for BlockRoom/Book
- **RoomTypeName**: Required for BlockRoom/Book
- **SmokingPreference**: Integer 0-3 (NOT string)
- **RatePlanCode**: Required for rate identification

#### 6. Dates

- **CheckInDate**: Format dd/MM/yyyy (TBO requirement)
- **NoOfNights**: > 0
- **CheckOutDate**: Calculated as CheckInDate + NoOfNights

### Business Rules

#### 1. De-Dupe Hotel Handling

- If **IsTBOMapped** = true and **CategoryId** present → This is a de-dupe hotel
- **CategoryId is REQUIRED** in BlockRoom and Book for de-dupe hotels
- **CategoryId should be OMITTED** for non-de-dupe hotels

#### 2. Price Verification (RSP - Rate Shopping Prevention)

- **PublishedPrice** ≥ **RoomPrice**: Base rate must be published
- **OfferedPrice** ≤ **PublishedPrice**: Offered price cannot exceed published
- **Discount** = PublishedPrice - OfferedPrice
- Price must NOT change significantly from Search → Block → Book
- If **IsPriceChanged** = true in BlockRoom response, use updated prices in Book

#### 3. GST/VAT Taxation

- **Tax** in Price object represents hotel tax
- GST = 18% of room subtotal (standard in India)
- Must be captured in price breakdown

#### 4. Package Fare Rules

- If booking includes package components (flights, transfers, etc.):
  - Price breakdown must include package fare amount
  - Cancellation policy may differ from room-only cancellations
  - Refund calculation must account for package components

#### 5. Cancellation Policy

- **ChargeType**: 1 (Free cancellation), 2 (Percentage charge), 3 (Fixed charge)
- Must be applied based on cancellation date
- Calculated refund = Total - CancellationCharge

#### 6. Passenger Requirements

- **LeadPassenger**: Exactly ONE adult per room must have LeadPassenger = true
- If **IsPassportMandatory** = true: PassportNo is required
- If **IsPANMandatory** = true: PAN is required
- If **RequireAllPaxDetails** = true: All details required for all passengers

---

## Error Handling

### Standard Error Response:

```json
{
  "Status": 0,
  "ResponseStatus": 0,
  "Error": {
    "ErrorCode": 5004,
    "ErrorMessage": "Agency do not have enough balance"
  }
}
```

### Common Error Codes:

- **5004**: Agency balance insufficient
- **5001**: Invalid TokenId
- **5002**: Hotel not available
- **5003**: Room not available
- **5005**: Invalid guest details
- **5006**: Invalid passenger information
- **5007**: Price changed significantly
- **5008**: Cancellation policy changed

### HTTP Status Codes:

- **200**: Request processed (check ResponseStatus field)
- **400**: Invalid request format
- **401**: Authentication failed
- **500**: Server error (retry may help)
- **503**: Service unavailable (temporary)

---

## Practical Implementation Notes

### 1. Parallel Search Logic

- For large hotel lists (>100 results), implement batching:
  - Process hotels in chunks of 100 HotelCodes
  - Call GetHotelRoom for each chunk in parallel
  - Aggregate results after all chunks complete
  - Timeout: 30-60 seconds per batch

### 2. De-Dupe Detection Flow

```
IF search_result.IsTBOMapped == true AND search_result.CategoryId != null
  THEN this is a de-dupe hotel
  THEN CategoryId REQUIRED in BlockRoom/Book
ELSE non-de-dupe
  THEN CategoryId should NOT be sent
```

### 3. Room Selection Strategy

- Always validate all room details from GetHotelRoom
- Select cheapest room for cost optimization
- Verify SmokingPreference is numeric (0-3) not string
- Capture all price details for audit trail

### 4. Booking Flow Summary

```
1. Search (GetHotelResult) → Get hotels + TraceId
2. Room Details (GetHotelRoom) → Get room options + prices
3. Block (BlockRoom) → Validate pricing + availability
   └─ If IsPriceChanged → Retrieve updated prices
4. Book (Book) → Finalize booking + get BookingId
5. Voucher (GenerateVoucher) → Get confirmation document
6. Track (GetBookingDetails) → Verify booking created
7. Manage (SendChangeRequest) → Handle cancellations
```

---

## Environment Variables Required

```
TBO_HOTEL_CLIENT_ID=tboprod
TBO_HOTEL_USER_ID=BOMF145
TBO_HOTEL_PASSWORD=@Bo#4M-Api@
TBO_HOTEL_BASE_URL_AUTHENTICATION=https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc
TBO_HOTEL_SEARCH_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult
TBO_HOTEL_BLOCKROOM_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom
TBO_HOTEL_BOOK_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book
TBO_END_USER_IP=52.5.155.132
```

---

## Certification Test Cases (8 scenarios)

### Case 1: Single Room, Single Guest, Dubai, Non-De-Dupe

- CityId: 12345, CheckIn: 15/12/2025, NoOfNights: 3, GuestNationality: IN, Rooms: 1 adult

### Case 2: Single Room, 2 Adults, Mumbai, Non-De-Dupe

- CityId: 10449, CheckIn: 16/12/2025, NoOfNights: 2, Rooms: 1 room, 2 adults

### Case 3: 2 Rooms, Multiple Guests, Delhi, Non-De-Dupe

- CityId: 10448, CheckIn: 17/12/2025, NoOfNights: 4, Rooms: 2 (1 adult each)

### Case 4: Single Room, Adult + Child, Dubai, Non-De-Dupe

- CityId: 12345, CheckIn: 15/12/2025, NoOfNights: 3, Rooms: 1 (1 adult + 1 child age 5)

### Case 5: De-Dupe Hotel with CategoryId, Single Room

- Same as Case 1, but hotel with IsTBOMapped=true and CategoryId present

### Case 6: Multiple Rooms with Package Components

- CityId: 10449, CheckIn: 20/12/2025, NoOfNights: 5, Rooms: 2

### Case 7: Cancellation Flow Post-Booking

- Complete Case 1, then SendChangeRequest to cancel

### Case 8: Price Change Handling

- Complete flow, capturing IsPriceChanged in BlockRoom response

---

## References & Support

- TBO API Documentation: https://www.tboholidays.com/developer-api
- Error Code Reference: Consult TBO support for complete error code mapping
- IP Whitelist: Ensure endpoint IPs are whitelisted with TBO
- Support Contact: TBO Technical Support
