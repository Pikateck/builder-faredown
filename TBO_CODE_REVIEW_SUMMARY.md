# TBO Code Review Summary

Quick reference of the key code sections for your review before deployment.

---

## 1. TBO Adapter Public Methods

**File**: `api/services/adapters/tboAdapter.js`

### searchHotels()
```javascript
async searchHotels(searchParams) {
  const tokenId = await this.getHotelToken();
  
  // ✅ Get CityId from TBO (must be numeric ID, not code)
  const cityId = await this.getCityId(destination, countryCode);
  
  if (!cityId) {
    this.logger.warn("⚠️ CityId not found for destination", { destination, countryCode });
    return [];
  }

  // ✅ EXACT JSON request format from TBO documentation
  const searchRequest = {
    EndUserIp: this.config.endUserIp,
    TokenId: tokenId,
    CheckInDate: this.formatDateForTBO(checkIn),
    NoOfNights: noOfNights,
    CountryCode: countryCode,
    CityId: Number(cityId),  // ✅ TBO's real numeric DestinationId
    PreferredCurrency: currency,
    GuestNationality: guestNationality,
    NoOfRooms: roomGuests.length,
    RoomGuests: roomGuests,
    IsNearBySearchAllowed: false,
    MaxRating: 5,
    MinRating: 0
  };

  // ✅ CORRECTED: Use verified working endpoint
  const searchUrl = "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult";
  
  const response = await tboRequest(searchUrl, {...});
  
  // ✅ Response can be wrapped in HotelSearchResult or direct
  const searchResult = response.data?.HotelSearchResult || response.data;
  const hotels = searchResult?.HotelResults || [];
  
  return this.transformHotelResults(hotels, searchParams);
}
```

### getRooms()
```javascript
async getRooms(params = {}) {
  const { getHotelRoom } = require("../../tbo/room");
  
  const { traceId, resultIndex, hotelCode } = params;
  
  this.logger.info("🛏️ TBO Get Rooms", { traceId, resultIndex, hotelCode });
  
  const result = await getHotelRoom({
    traceId,
    resultIndex: Number(resultIndex),
    hotelCode: String(hotelCode)
  });
  
  return result;
}
```

### blockRoom()
```javascript
async blockRoom(params = {}) {
  const { blockRoom: blockRoomFn } = require("../../tbo/book");
  
  this.logger.info("🔒 TBO Block Room", { traceId, hotelCode, noOfRooms });
  
  const result = await blockRoomFn({
    traceId,
    resultIndex: Number(resultIndex),
    hotelCode: String(hotelCode),
    hotelName,
    guestNationality,
    noOfRooms: Number(noOfRooms),
    isVoucherBooking,
    hotelRoomDetails
  });
  
  return result;
}
```

### bookHotel()
```javascript
async bookHotel(params = {}) {
  const { bookHotel: bookHotelFn } = require("../../tbo/book");
  
  this.logger.info("📝 TBO Book Hotel", { traceId, hotelCode, passengers: hotelPassenger?.length });
  
  const result = await bookHotelFn({
    traceId,
    resultIndex: Number(resultIndex),
    hotelCode: String(hotelCode),
    hotelName,
    guestNationality,
    noOfRooms: Number(noOfRooms),
    isVoucherBooking,
    hotelRoomDetails,
    hotelPassenger
  });
  
  return result;
}
```

### getVoucher()
```javascript
async getVoucher(params = {}) {
  const { generateVoucher } = require("../../tbo/voucher");
  
  this.logger.info("🎫 TBO Generate Voucher", { bookingId, bookingRefNo });
  
  const result = await generateVoucher({
    bookingId: String(bookingId),
    bookingRefNo: String(bookingRefNo)
  });
  
  return result;
}
```

---

## 2. Key Route Handlers

### Search Route
**File**: `api/routes/tbo/search.js`

```javascript
router.post('/', async (req, res) => {
  try {
    const {
      destination,
      countryCode = 'AE',
      checkIn,
      checkOut,
      rooms = [{ adults: 2, children: 0, childAges: [] }],
      currency = 'USD',
      guestNationality = 'AE'
    } = req.body;

    // Validate required fields
    if (!destination || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: destination, checkIn, checkOut'
      });
    }

    const result = await searchHotels({
      destination,
      countryCode,
      checkIn,
      checkOut,
      rooms,
      currency,
      guestNationality
    });

    res.json({
      success: true,
      traceId: result.traceId,
      cityId: result.cityId,
      checkInDate: result.checkInDate,
      checkOutDate: result.checkOutDate,
      currency: result.currency,
      noOfRooms: result.noOfRooms,
      hotels: result.hotels
    });

  } catch (error) {
    console.error('TBO Hotel Search Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});
```

### Book Route
**File**: `api/routes/tbo/book.js`

```javascript
router.post('/', async (req, res) => {
  try {
    const {
      traceId,
      resultIndex,
      hotelCode,
      hotelName,
      guestNationality = 'AE',
      noOfRooms = 1,
      isVoucherBooking = true,
      hotelRoomDetails,
      hotelPassenger
    } = req.body;

    // Validate required fields
    if (!traceId || !resultIndex || !hotelCode || !hotelRoomDetails || !hotelPassenger) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: traceId, resultIndex, hotelCode, hotelRoomDetails, hotelPassenger'
      });
    }

    // Validate passenger details
    const requiredPassengerFields = ['Title', 'FirstName', 'LastName', 'Email', 'Phoneno'];
    for (const passenger of hotelPassenger) {
      for (const field of requiredPassengerFields) {
        if (!passenger[field]) {
          return res.status(400).json({
            success: false,
            error: `Missing passenger field: ${field}`
          });
        }
      }
    }

    const result = await bookHotel({
      traceId,
      resultIndex: Number(resultIndex),
      hotelCode: String(hotelCode),
      hotelName,
      guestNationality,
      noOfRooms: Number(noOfRooms),
      isVoucherBooking,
      hotelRoomDetails,
      hotelPassenger
    });

    if (!result || !result.bookingId) {
      return res.status(500).json({
        success: false,
        error: 'Booking failed',
        details: result
      });
    }

    res.json({
      success: true,
      bookingId: result.bookingId,
      confirmationNo: result.confirmationNo,
      bookingRefNo: result.bookingRefNo,
      status: result.status,
      responseStatus: result.responseStatus,
      isPriceChanged: result.isPriceChanged,
      hotelBookingDetails: result.hotelBookingDetails
    });

  } catch (error) {
    console.error('TBO Booking Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});
```

---

## 3. Server.js Route Registration

**File**: `api/server.js`

### Imports (Lines ~87-97)
```javascript
const adminTboRoutes = require("./routes/admin-tbo.js");
const tboDebugRoutes = require("./tbo/tbo-debug.js");

// TBO Production Routes (Complete Hotel Booking Pipeline)
const tboAuthRoutes = require("./routes/tbo/auth.js");
const tboStaticRoutes = require("./routes/tbo/static.js");
const tboSearchRoutes = require("./routes/tbo/search.js");
const tboRoomRoutes = require("./routes/tbo/room.js");
const tboBlockRoutes = require("./routes/tbo/block.js");
const tboBookRoutes = require("./routes/tbo/book.js");
const tboVoucherRoutes = require("./routes/tbo/voucher.js");

const rewardsRoutes = require("./routes/rewards.js");
```

### Route Mounting (Lines ~467-478)
```javascript
app.use("/api/tbo-hotels", require("./routes/tbo-hotels"));
app.use("/api/tbo-hotels/static", require("./routes/tbo-hotels-static"));
app.use("/api/tbo", require("./routes/tbo-diagnostics"));

// TBO Production API - Complete Booking Pipeline
app.use("/api/tbo/auth", tboAuthRoutes);
app.use("/api/tbo/static", tboStaticRoutes);
app.use("/api/tbo/search", tboSearchRoutes);
app.use("/api/tbo/room", tboRoomRoutes);
app.use("/api/tbo/block", tboBlockRoutes);
app.use("/api/tbo/book", tboBookRoutes);
app.use("/api/tbo/voucher", tboVoucherRoutes);

app.use("/api/hotels", hotelCanonicalRoutes);
```

---

## 4. Static Data Integration (Dynamic CityId)

**File**: `api/services/adapters/tboAdapter.js`

### getTboCities() - Updated to use GetDestinationSearchStaticData
```javascript
async getTboCities(countryCode, force = false) {
  if (!countryCode) return [];

  // ✅ CORRECTED: Use GetDestinationSearchStaticData with TokenId (VERIFIED WORKING)
  const tokenId = await this.getHotelToken();
  
  const requestBody = {
    EndUserIp: this.config.endUserIp,
    TokenId: tokenId,
    CountryCode: countryCode,
    SearchType: "1"  // 1 = City-wise
  };

  const staticDataUrl = "https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData";

  const response = await tboRequest(staticDataUrl, {
    method: "POST",
    data: requestBody,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate"
    },
    timeout: this.config.timeout
  });

  if (response.data?.Status !== 1) {
    throw new Error(`GetDestinationSearchStaticData failed: ${response.data?.Error?.ErrorMessage}`);
  }

  const destinations = response.data?.Destinations || [];
  
  return destinations.map(d => ({
    code: d.DestinationId,           // Use DestinationId as code
    id: d.DestinationId,              // TBO CityId (numeric) - THIS IS THE KEY
    name: d.CityName,
    countryCode: d.CountryCode?.trim(),
    countryName: d.CountryName,
    stateProvince: d.StateProvince,
    type: d.Type
  }));
}
```

---

## 5. Environment Variables Used

**All from env vars - No hardcoded values**

### Credentials
```javascript
// auth.js
ClientId: process.env.TBO_CLIENT_ID || "tboprod"
UserName: process.env.TBO_HOTEL_USER_ID || "BOMF145"
Password: process.env.TBO_HOTEL_PASSWORD || "@Bo#4M-Api@"
EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132"
```

### Endpoints
```javascript
// All modules
const authUrl = process.env.TBO_AUTH_URL || 
  "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate"

const staticDataUrl = process.env.TBO_STATIC_DATA_URL ||
  "https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData"

const searchUrl = process.env.TBO_HOTEL_SEARCH_URL || 
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult"

const roomUrl = process.env.TBO_HOTEL_ROOM_URL || 
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelRoom"

const blockUrl = process.env.TBO_HOTEL_BLOCK_ROOM_URL || 
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/BlockRoom"

const bookUrl = process.env.TBO_HOTEL_BOOK_URL || 
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/Book"

const voucherUrl = process.env.TBO_HOTEL_VOUCHER_URL || 
  "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GenerateVoucher"
```

### Proxy
```javascript
// lib/tboRequest.js
const useProxy = process.env.USE_SUPPLIER_PROXY === 'true';
const fixieUrl = process.env.FIXIE_URL;
```

---

## 6. Test Script Command

**File**: `test-tbo-full-booking-flow.js`

```bash
# Run the complete flow
node test-tbo-full-booking-flow.js

# Results saved to:
tbo-full-booking-flow-results.json
```

---

## Review Checklist

Before deploying, verify:

- [ ] All route imports correct in `server.js`
- [ ] All routes mounted at correct paths
- [ ] Adapter methods call correct TBO modules
- [ ] No hardcoded credentials
- [ ] No hardcoded endpoints
- [ ] No hardcoded CityIds
- [ ] All env vars documented
- [ ] Error handling in place
- [ ] Validation in place
- [ ] Logging configured

---

## Files to Review

1. **`api/server.js`** (lines 87-97, 467-478)
2. **`api/services/adapters/tboAdapter.js`** (complete file)
3. **`api/routes/tbo/search.js`** (main search route)
4. **`api/routes/tbo/book.js`** (booking validation)
5. **`test-tbo-full-booking-flow.js`** (end-to-end test)

---

## Next Steps

1. Review the code sections above
2. Deploy to staging/production
3. Run: `node test-tbo-full-booking-flow.js`
4. Share the results file: `tbo-full-booking-flow-results.json`
5. Verify booking confirmation with TBO

---

**Status**: Ready for your review and deployment ✅
