# TBO Hotel API Integration Analysis

## Executive Summary

**CRITICAL ISSUES FOUND**: Our implementation has **multiple fundamental incompatibilities** with the TBO (Tek Travels) API documentation.

## 🔴 CRITICAL ISSUES

### 1. **WRONG BASE URLS** ❌

#### What TBO Documentation Says:
- **Authentication**: `http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate`
- **Hotel Search**: `https://HotelBE.tektravels.com/hotelservice.svc/rest/Gethotelresult`

#### What We're Using:
```javascript
// In tboAdapter.js lines 44-58
hotelAuthBase: "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc"
hotelSearchBase: "https://affiliate.travelboutiqueonline.com/HotelAPI/"
hotelSearchEndpoint: "https://affiliate.travelboutiqueonline.com/HotelAPI/Search"
```

**ISSUE**: We're using `travelboutiqueonline.com` domains, but TBO docs specify `tektravels.com` domains.

**IMPACT**: All API calls are going to wrong endpoints → 100% failure rate

---

### 2. **WRONG AUTHENTICATION FLOW** ❌

#### What TBO Documentation Says:
```json
{
  "ClientId": "ApiIntegrationNew",
  "UserName": "your_username",
  "Password": "your_api_password",
  "EndUserIp": "xxx.xxx.xxx.xxx"
}
```

**Response must include**: `TokenId` (valid for 24 hours)

**All subsequent requests must include**: `TokenId` from authentication response

#### What We're Doing:
```javascript
// Line 1269-1273 in tboAdapter.js
const payload = {
  ClientId: this.config.hotelClientId, // "tboprod"
  UserName: this.config.hotelUserId,   // "BOMF145"
  Password: this.config.hotelPassword,  // "@Bo#4M-Api@"
  // ... NO TokenId in search requests
};
```

**ISSUE**: 
1. We're sending credentials **directly in each search request** instead of using TokenId
2. TBO requires: Authenticate ONCE → Get TokenId → Use TokenId in all requests
3. We're doing: Send credentials in every request (wrong pattern)

**IMPACT**: Authentication failures, potential account lockout

---

### 3. **WRONG DATE FORMAT** ⚠️

#### What TBO Documentation Says:
- **CheckInDate**: `dd/mm/yyyy` format (e.g., "31/10/2025")
- **All dates must be in dd/mm/yyyy**

#### What We're Doing:
```javascript
// Line 1261-1267 - WE DO HAVE THIS CORRECT! ✅
const formatDateForTBO = (dateStr) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
```

**STATUS**: ✅ Date formatting is CORRECT

---

### 4. **WRONG REQUEST STRUCTURE FOR HOTEL SEARCH** ❌

#### What TBO Documentation Says:
```json
{
  "EndUserIp": "xxx.xxx.xxx.xxx",
  "TokenId": "TOKEN_FROM_AUTH",
  "CheckInDate": "dd/mm/yyyy",
  "NoOfNights": 3,
  "CountryCode": "IN",
  "CityId": 130443,
  "ResultCount": null,
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
```

#### What We're Sending:
```javascript
// Lines 1269-1289
{
  ClientId: "tboprod",           // ❌ Should NOT be here
  UserName: "BOMF145",           // ❌ Should NOT be here  
  Password: "@Bo#4M-Api@",       // ❌ Should NOT be here
  EndUserIp: this.config.endUserIp,  // ✅ Correct
  CheckIn: formatDateForTBO(checkIn), // ❌ Should be "CheckInDate"
  CheckOut: formatDateForTBO(checkOut), // ❌ Should be "NoOfNights"
  CityId: cityId,                // ✅ Correct
  NoOfRooms: rooms.length,       // ✅ Correct
  RoomGuests: roomGuests,        // ✅ Correct
  GuestNationality: guestNationality, // ✅ Correct
  PreferredCurrency: currency,   // ✅ Correct
  IsNearBySearchAllowed: true    // ⚠️ Reserved for future
}
```

**ISSUES**:
1. ❌ **Missing**: `TokenId` (required)
2. ❌ **Wrong**: Using `CheckIn` instead of `CheckInDate`
3. ❌ **Wrong**: Using `CheckOut` instead of calculating `NoOfNights`
4. ❌ **Wrong**: Including credentials in search request
5. ❌ **Missing**: `CountryCode` (required)

---

### 5. **RESPONSE STATUS CHECK** ⚠️

#### What TBO Documentation Says:
```json
{
  "ResponseStatus": 1,  // 1 = Successful
  "Error": {
    "ErrorCode": 0,
    "ErrorMessage": ""
  }
}
```

**Status Values**:
- NotSet = 0
- Successful = 1
- Failed = 2
- InValidRequest = 3
- InValidSession = 4
- InValidCredentials = 5

#### What We're Checking:
```javascript
// Lines 1364-1378
if (res.data?.Status?.Code && res.data.Status.Code !== 1) {
  // Handle error
} else if (res.data?.Status !== 1) {
  // Handle error
}
```

**STATUS**: ✅ Correct (checking for Status === 1)

---

## 📋 REQUIRED FIXES

### Priority 1: Fix Base URLs
```javascript
// Update tboAdapter.js lines 28-70
const config = {
  // Authentication (Shared Services)
  hotelAuthBase: "http://api.tektravels.com/SharedServices/SharedData.svc",
  hotelAuthEndpoint: "http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate",
  
  // Hotel Search
  hotelSearchBase: "https://HotelBE.tektravels.com/hotelservice.svc",
  hotelSearchEndpoint: "https://HotelBE.tektravels.com/hotelservice.svc/rest/Gethotelresult",
};
```

### Priority 2: Fix Authentication Flow
```javascript
// 1. Authenticate ONCE and get TokenId
async getHotelToken() {
  const authRequest = {
    ClientId: "ApiIntegrationNew", // Or your assigned ClientId
    UserName: this.config.hotelUserId,
    Password: this.config.hotelPassword,
    EndUserIp: this.config.endUserIp
  };
  
  const response = await axios.post(
    "http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate",
    authRequest
  );
  
  if (response.data.Status === 1) {
    this.hotelTokenId = response.data.TokenId;
    this.hotelTokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    return this.hotelTokenId;
  }
  
  throw new Error(`Auth failed: ${response.data.Error.ErrorMessage}`);
}
```

### Priority 3: Fix Hotel Search Request
```javascript
async searchHotels(searchParams) {
  const tokenId = await this.getHotelToken();
  
  // Calculate NoOfNights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const noOfNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  
  const payload = {
    EndUserIp: this.config.endUserIp,
    TokenId: tokenId, // ✅ From authentication
    CheckInDate: formatDateForTBO(checkIn), // ✅ dd/mm/yyyy
    NoOfNights: noOfNights, // ✅ Calculate from dates
    CountryCode: countryCode || "IN", // ✅ Required
    CityId: cityId, // ✅ Numeric ID
    PreferredCurrency: currency,
    GuestNationality: guestNationality,
    NoOfRooms: rooms.length,
    RoomGuests: roomGuests
  };
  
  const response = await axios.post(
    "https://HotelBE.tektravels.com/hotelservice.svc/rest/Gethotelresult",
    payload
  );
  
  return response.data;
}
```

---

## 🔍 QUESTIONS FOR USER

### Critical Information Needed:

1. **TBO Credentials Verification**:
   - What is your actual `ClientId`? (Is it "ApiIntegrationNew" or "tboprod"?)
   - Current credentials in env:
     ```
     TBO_HOTEL_CLIENT_ID=tboprod
     TBO_HOTEL_USER_ID=BOMF145
     TBO_HOTEL_PASSWORD=@Bo#4M-Api@
     ```
   - Are these for Tek Travels API or Travel Boutique Online?

2. **API Environment**:
   - Are you using **Production** or **Test** environment?
   - Production uses: `api.tektravels.com`
   - Test might use different URLs

3. **Documentation Access**:
   - Many TBO doc URLs return 404
   - Do you have access to updated documentation?
   - Can you contact TBO support for latest API specs?

4. **Dual API System?**:
   - Are you using both:
     - Tek Travels API (`tektravels.com`)
     - Travel Boutique Online API (`travelboutiqueonline.com`)
   - These appear to be **different APIs** with different requirements

---

## 📊 SUMMARY

| Component | Status | Issue |
|-----------|--------|-------|
| Base URLs | ❌ WRONG | Using travelboutiqueonline.com instead of tektravels.com |
| Authentication | ❌ WRONG | Sending credentials instead of TokenId |
| Date Format | ✅ CORRECT | Using dd/mm/yyyy |
| Request Fields | ❌ WRONG | Missing TokenId, wrong field names |
| Response Parsing | ✅ CORRECT | Checking Status === 1 |
| Error Handling | ✅ CORRECT | Checking Error.ErrorCode |

**ROOT CAUSE**: We're integrating with the wrong API entirely. TBO documentation shows `tektravels.com` endpoints, but we're using `travelboutiqueonline.com`.

**NEXT STEPS**:
1. User must clarify which API they're actually using
2. Update all base URLs to match the correct API
3. Implement proper TokenId-based authentication
4. Fix request field names and structure
5. Test with correct endpoints

---

## 🚨 IMMEDIATE ACTION REQUIRED

**Current State**: 0% success rate on TBO API calls
**Reason**: Wrong endpoints + Wrong authentication pattern
**Fix Duration**: ~2-4 hours after clarification
**Blocking Question**: Which TBO API are you actually subscribed to?
  - Option A: Tek Travels (`tektravels.com`)
  - Option B: Travel Boutique Online (`travelboutiqueonline.com`)
  - Option C: Both (requires separate configurations)
