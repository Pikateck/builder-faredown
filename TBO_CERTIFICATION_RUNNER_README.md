# TBO Hotel Certification Test Runner

## Overview

The TBO Hotel Certification Test Runner executes 8 mandatory test scenarios for TBO API certification. Each scenario tests different room configurations for domestic (Delhi) and international (Paris) bookings.

## Files Created

### 1. `api/tests/tbo-hotel-flow-runner.js`
Core reusable function that orchestrates the complete booking flow:
- Search Hotels (GetHotelResult)
- Get Hotel Room Details (GetHotelRoom)  
- Block Room (BlockRoom)
- Book Hotel (BookRoom)
- Generate Voucher (GenerateVoucher)
- Check Agency Balance (GetAgencyBalance)

**Key Features:**
- Automatically selects the cheapest hotel and cheapest room
- Dynamically generates passenger data
- Handles multi-room scenarios
- Returns all request/response pairs
- Graceful error handling

### 2. `api/tests/tbo-hotel-cert-cases.js`
Test case orchestrator that:
- Maps test cases 1-8 to room configurations
- Executes the booking flow for each case
- Saves all JSONs to disk (12 files per case)
- Generates summary report

## Test Cases

| Case | Type           | Room Configuration                    |
|------|----------------|---------------------------------------|
| 1    | Domestic (DEL) | 1 Adult                              |
| 2    | Domestic (DEL) | 2 Adults, 2 Children                 |
| 3    | Domestic (DEL) | 1 Adult, 1 Adult (2 Rooms)           |
| 4    | Domestic (DEL) | 1 Adult + 2 Children, 2 Adults       |
| 5    | Intl (Paris)   | 1 Adult                              |
| 6    | Intl (Paris)   | 2 Adults, 2 Children                 |
| 7    | Intl (Paris)   | 1 Adult, 1 Adult (2 Rooms)           |
| 8    | Intl (Paris)   | 1 Adult + 2 Children, 2 Adults       |

## Execution on Render

### Prerequisites
Ensure these environment variables are set on Render:
```
TBO_CLIENT_ID=tboprod
TBO_HOTEL_USER_ID=BOMF145
TBO_HOTEL_PASSWORD=@Bo#4M-Api@
TBO_END_USER_IP=52.5.155.132
USE_SUPPLIER_PROXY=true
FIXIE_URL=http://fixie:password@criterium.usefixie.com:80
```

### Run Individual Case
```bash
cd /opt/render/project/src
TBO_TEST_CASE=1 node api/tests/tbo-hotel-cert-cases.js
```

### Run All Cases
```bash
for i in {1..8}; do
  TBO_TEST_CASE=$i node api/tests/tbo-hotel-cert-cases.js
done
```

## Output Structure

Each case generates files in `/tbo-cert-logs/case-{ID}/`:

```
case-1/
├── 00-summary.json              # Quick summary
├── 1-search-request.json        # Search request
├── 2-search-response.json       # Search response
├── 3-gethotelroom-request.json  # GetHotelRoom request
├── 4-gethotelroom-response.json # GetHotelRoom response
├── 5-blockroom-request.json     # BlockRoom request
├── 6-blockroom-response.json    # BlockRoom response
├── 7-bookroom-request.json      # BookRoom request
├── 8-bookroom-response.json     # BookRoom response
├── 9-voucher-request.json       # GenerateVoucher request
├── 10-voucher-response.json     # GenerateVoucher response
├── 11-credit-request.json       # GetAgencyBalance request
├── 12-credit-response.json      # GetAgencyBalance response
└── 99-full-results.json         # Complete flow results
```

## Key Specifications

- **Check-in Date**: Fixed at `15/12/2025` (safe future date)
- **Check-out Date**: Fixed at `16/12/2025` (1 night stay)
- **Hotel Selection**: Cheapest hotel from search results
- **Room Selection**: Cheapest room from selected hotel
- **Guest Nationality**: Always `IN` (India) per TBO requirements
- **Domestic Currency**: INR
- **International Currency**: EUR
- **Passenger Generation**: Automatic with unique names and details

## Success Criteria

Each test case must:
1. ✅ Search: Return hotel results with TraceId
2. ✅ Room Details: Return room pricing and policies
3. ✅ Block: Return acknowledgment without error
4. ✅ Book: Return BookingId, BookingRefNo, ConfirmationNo
5. ✅ Voucher: Return voucher URL and details
6. ✅ Balance: Return current agency balance

## Error Handling

- Missing hotels/rooms: Script aborts with error message
- API failures: Logged with error codes and TraceIds
- Network issues: Captured and reported

## Example Execution Log

```
================================================================================
TBO HOTEL CERTIFICATION TEST
================================================================================

Case: 1
Test: Domestic - 1 Adult

================================================================================
TBO CERTIFICATION CASE #1: Delhi
================================================================================

📍 STEP 1: SEARCH HOTELS (GetHotelResult)
✅ Found 2429 hotels

📍 STEP 2: GET HOTEL ROOM DETAILS (GetHotelRoom)
✅ Selected cheapest hotel: 123456 (Index: 0)

📍 STEP 3: SELECT CHEAPEST ROOM
✅ Selected cheapest room (Index: 0)

📍 STEP 4: BLOCK ROOM (BlockRoom)
✅ Room blocked successfully

📍 STEP 5: BOOK HOTEL (BookRoom)
✅ Booking confirmed
   BookingId: 987654
   BookingRefNo: BOMF145-123456
   ConfirmationNo: CONF-987654

📍 STEP 6: GENERATE VOUCHER (GenerateVoucher)
✅ Voucher generated

📍 STEP 7: CHECK AGENCY BALANCE (GetAgencyBalance)
✅ Current Balance: 5000 INR

================================================================================
✅ CASE #1 COMPLETED SUCCESSFULLY
================================================================================

✅ Saved: 1-search-request.json
✅ Saved: 2-search-response.json
...
✅ Saved: 12-credit-response.json
✅ Saved: 00-summary.json
✅ Saved: 99-full-results.json

📁 All files saved to: /opt/render/project/src/tbo-cert-logs/case-1

================================================================================
✅ TEST CASE EXECUTION COMPLETE
================================================================================

Output directory: /opt/render/project/src/tbo-cert-logs/case-1
Files: 12 JSON files (requests + responses)
```

## Next Steps

1. Deploy code to Render
2. Run test cases via Render Shell: `TBO_TEST_CASE=1 node api/tests/tbo-hotel-cert-cases.js`
3. Verify all 8 cases complete successfully
4. Zip the `/tbo-cert-logs/` directory
5. Submit to TBO API team

## Troubleshooting

**Issue**: "Agency do not have enough balance"
- **Solution**: Contact TBO to load test credits on agency BOMF145

**Issue**: No hotels found in search
- **Solution**: Verify CityId is correct (Delhi: 10448, Paris: 16408)

**Issue**: Proxy connection timeout
- **Solution**: Ensure FIXIE_URL is configured and whitelisted IP is correct

**Issue**: CategoryId cannot be null
- **Solution**: Verify room response includes CategoryId; escalate to TBO if missing
