# TBO Hotel Search Authorization Fix - Deployment Guide

## Problem

The TBO hotel search endpoint was returning a 401 "Access Credentials is incorrect" error even though authentication was succeeding. The root cause was that the search endpoint (and other dynamic booking methods) were using the `TokenId` obtained from the authentication endpoint, which is only valid for static data endpoints.

## Root Cause Analysis

According to TBO's credential email:

- **Static Data credentials** (travelcategory / Tra@59334536): Used for Country List, City List, Hotel Codes List, Hotel Details
- **Dynamic Booking credentials** (tboprod / BOMF145 / @Bo#4M-Api@): Used for authorization in Search, PreBook, Book, and other dynamic booking methods

The search endpoint requires **direct credential authorization** (ClientId, UserName, Password) in the request payload, NOT the TokenId.

## Solution Implemented

Updated all dynamic booking methods in `api/services/adapters/tboAdapter.js` to use direct credentials instead of TokenId:

### Methods Updated:

1. **searchHotels()** (line 1146)
   - Changed from: `TokenId: tokenId`
   - Changed to: `ClientId, UserName, Password` (direct credentials)

2. **preBookHotel()** (line 1607)
3. **bookHotel()** (line 1641)
4. **generateHotelVoucher()** (line 1679)
5. **getHotelBookingDetails()** (line 1714)
6. **cancelHotelBooking()** (line 1751)
7. **getHotelInfo()** (line 1811)
8. **getHotelRoom()** (line 1843)
9. **getChangeRequestStatus()** (line 1912)

### Unchanged (Correct Implementation):

- **Static data methods** (getCountryList, getCityList, getHotelCodes, getHotelDetails, getTopDestinations): Already use staticUserName and staticPassword - No changes needed

## Credentials Configuration

Environment variables are already correctly configured:

```
TBO_HOTEL_CLIENT_ID="tboprod"
TBO_HOTEL_USER_ID="BOMF145"
TBO_HOTEL_PASSWORD="@Bo#4M-Api@"

TBO_STATIC_DATA_CREDENTIALS_USERNAME="travelcategory"
TBO_STATIC_DATA_CREDENTIALS_PASSWORD="Tra@59334536"
```

## Expected Behavior After Fix

1. Hotel search requests will include ClientId, UserName, Password in payload
2. TBO search endpoint will recognize valid credentials and return hotel results
3. Status: 1 will be returned with hotel list (instead of 401 error)
4. PreBook, Book, and other dynamic methods will also work with same credential approach

## Testing

After deployment, test with:

```bash
# Hotel search should return hotels with Status: 1
curl -X POST https://builder-faredown-pricing.onrender.com/api/tbo-hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "PAR",
    "checkIn": "2025-10-31",
    "checkOut": "2025-11-03",
    "adults": 2,
    "children": 0
  }'
```

Expected response:

```json
{
  "hotels": [
    {
      "id": "...",
      "name": "Hotel Name",
      "minPrice": 100,
      "maxPrice": 150,
      ...
    }
  ],
  "searchId": "...",
  "status": "success"
}
```

## Deployment Checklist

- [x] Updated all 9 dynamic booking methods
- [x] Verified static data methods use correct credentials
- [x] Verified environment variables are set correctly
- [ ] Push to git
- [ ] Render auto-deploys
- [ ] Monitor logs for TBO search requests
- [ ] Test hotel search with known destination (e.g., Paris/PAR)
- [ ] Verify results return with hotel list and pricing

## Files Modified

- `api/services/adapters/tboAdapter.js` (9 methods updated)

## Revert Plan (if needed)

```bash
git revert <commit-hash>
```

This will restore TokenId-based approach (though it won't work with TBO's authorization model).

## Notes

- TokenId is no longer used for dynamic booking methods
- The `getHotelToken()` method can be kept as-is or removed later (currently not used by dynamic methods after this fix)
- The proxy configuration (Fixie) remains in place and working
- All TBO calls continue to route through the proxy per USE_SUPPLIER_PROXY configuration
