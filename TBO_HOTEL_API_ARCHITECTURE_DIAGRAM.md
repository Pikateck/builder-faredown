# TBO Hotel API - Architecture & Data Flow Diagrams

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                       │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │  HotelSearch │ HotelResults │ HotelDetails │ HotelBooking │  │
│  └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘  │
│         │              │              │              │            │
│         └──────────────┴──────────────┴──────────────┘            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST
        ┌──────────────────┴───────────────────┐
        │                                      │
┌───────▼────────────────────────────────────┐ │
│   VITE DEV SERVER (Port 5173)              │ │
│   Netlify (Production)                      │ │
└────────────────────────────────────────────┘ │
        │                                      │
        │ CORS Redirect /api/*                │
        │                                      │
┌───────▼────────────────────────────────────────────────────────┐
│              RENDER API SERVER (Node.js/Express)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MIDDLEWARE LAYER                       │  │
│  │  ├─ Auth (JWT, Admin Key)                                │  │
│  │  ├─ Proxy (Fixie for TBO calls)                          │  │
│  │  ├─ Rate Limiting (10 req/sec)                           │  │
│  │  ├─ Error Handling                                       │  │
│  │  └─ CORS                                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              ROUTE HANDLERS (api/routes/)              │    │
│  │  ├─ tbo-hotels.js (TBO search, book, details)          │    │
│  │  ├─ hotels-metadata.js (Unified hotel data)            │    │
│  │  ├─ auth.js (Authentication)                           │    │
│  │  └─ ... other routes                                   │    │
│  └──────────────────────────────────────────────────────────┘  │
│         │          │           │            │                   │
│         ▼          ▼           ▼            ▼                   │
│  ┌────────────────────────────────────────────────────���──┐     │
│  │        SERVICE LAYER (api/services/)                  │     │
│  │                                                       │     │
│  │  ┌─────────────────────────────────────────────────┐ │     │
│  │  │  TBO ADAPTER (api/services/adapters/)           │ │     │
│  │  │  ├─ searchHotels()                              │ │     │
│  │  │  ├─ getHotelToken()                             │ │     │
│  │  │  ├─ getCityId()                                 │ │     │
│  │  │  ├─ preBookHotel()                              │ │     │
│  │  │  ├─ bookHotel()                                 │ │     │
│  │  │  ├─ generateHotelVoucher()                      │ │     │
│  │  │  ├─ getHotelBookingDetails()                    │ │     │
│  │  │  ├─ cancelHotelBooking()                        │ │     │
│  │  │  ├─ getHotelInfo()                              │ │     │
│  │  │  ├─ getHotelRoom()                              │ │     │
│  │  │  ├─ getCountryList()                            │ │     │
│  │  │  ├─ getCityList()                               │ │     │
│  │  │  ├─ getTopDestinations()                        │ │     │
│  │  │  └─ ... more methods                            │ │     │
│  │  └─────────────────────────────────────────────────┘ │     │
│  │                                                       │     │
│  │  ┌─────────────────────────────────────────────────┐ │     │
│  │  │  NORMALIZER & MERGER                            │ │     │
│  │  │  ├─ HotelNormalizer.js                          │ │     │
│  │  │  └─ hotelDedupAndMergeUnified.js               │ │     │
│  │  └─────────────────────────────────────────────────┘ │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         INFRASTRUCTURE LAYER                           │   │
│  │  ├─ axiosClient (HTTP requests)                        │   │
│  │  ├─ proxy.js (Fixie proxy management)                  │   │
│  │  ├─ redisClient.js (Redis cache)                       │   │
│  │  └─ tboRequest.js (TBO request wrapper)                │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
        │              │                  │
        ▼              ▼                  ▼
    ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
    │  PostgreSQL │ │    Redis     │ │  TBO API     │
    │  Database   │ │   Cache      │ │  (Tek       │
    │ (Render PG) │ │  (Render)    │ │   Travels)  │
    └─────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔄 Complete Hotel Booking Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER INTERACTION FLOW                                              │
└─────────────────────────────────────────────────────────────────────┘

1. SEARCH FLOW
   ────────────
   User Input:
   ├─ Destination: "Dubai" / "DXB"
   ├─ Check-in: "2025-10-25"
   ├─ Check-out: "2025-10-28"
   ├─ Guests: 2 adults, 1 child (age 8)
   └─ Currency: "INR"
        │
        ▼
   Frontend Action:
   POST /api/hotels
   └─ cityId=DXB&checkIn=2025-10-25&checkOut=2025-10-28&adults=2&children=1
        │
        ▼
   Backend Processing:
   ├─ getHotelToken()
   │  └─ POST http://api.tektravels.com/.../Authenticate
   │     ├─ ClientId: "ApiIntegrationNew"
   │     ├─ UserName: "BOMF145"
   │     └─ Password: "***"
   │     Response: TokenId (cached 24h)
   │
   ├─ getCityId("DXB")
   │  └─ POST http://api.tektravels.com/.../GetDestinationSearchStaticData
   │     ├─ TokenId: (from cache)
   │     ├─ SearchType: "1"
   │     └─ CountryCode: "AE"
   │     Response: DestinationId=130443
   │
   ├─ Format dates:
   │  └─ "2025-10-25" → "25/10/2025"
   │     "2025-10-28" → "28/10/2025"
   │
   └─ searchHotels()
      └─ POST https://HotelBE.tektravels.com/.../Gethotelresult
         ├─ TokenId: (from cache)
         ├─ TraceId: (new)
         ├─ CheckInDate: "25/10/2025"
         ├─ NoOfNights: 3
         ├─ CityId: 130443
         ├─ NoOfRooms: 1
         ├─ RoomGuests: [{NoOfAdults: 2, NoOfChild: 1, ChildAge: [8]}]
         └─ PreferredCurrency: "INR"
         
         Response:
         ├─ TraceId: "abc-def-123"
         ├─ HotelResults: [
         │  {
         │    ResultIndex: 1,
         │    HotelCode: "DXBHOT001",
         │    HotelName: "Luxury Hotel Dubai",
         │    StarRating: 5,
         │    Price: {RoomPrice: 15000, Tax: 2500, ...},
         │    Images: [...],
         │    Amenities: [...]
         │  },
         │  {...},
         │  {...} (50+ hotels)
         │ ]
         └─ Status: 1
        │
        ▼
   Frontend Display:
   ├─ Show 50+ hotel cards
   └─ Each card shows name, stars, price, images


2. DETAILS FLOW
   ────────────
   User clicks on hotel card
        │
        ▼
   Frontend Actions:
   ├─ getHotelInfo()
   │  POST /api/tbo-hotels/hotel/DXBHOT001?searchId=abc-def-123
   │  └─ Backend: getHotelInfo({
   │     TokenId: (from cache),
   │     TraceId: "abc-def-123",
   │     HotelCode: "DXBHOT001",
   │     ResultIndex: 1
   │  })
   │     Response: HotelDetails {
   │       amenities, facilities, images, address,
   │       policies, special instructions
   │     }
   │
   ├─ getHotelRoom()
   │  └─ Backend: getHotelRoom({...})
   │     Response: HotelRoomDetails {
   │       DayRates, CancellationPolicies,
   │       LastCancellationDate, Pricing
   │     }
   │
   └─ Display:
      ├─ Full hotel description
      ├─ Amenities & facilities
      ├─ Cancellation policies
      ├─ Price breakdown
      └─ "Book Now" button


3. BOOKING FLOW
   ────────────
   User clicks "Book Now"
        │
        ▼
   Frontend: Collect guest details
   ├─ Guest 1 (Lead):
   │  ├─ Title: "Mr"
   │  ├─ Name: "John Doe"
   │  ├─ Phone: "+91-9999999999"
   │  ├─ Email: "john@example.com"
   │  ├─ Passport: "AB123456" (if non-Indian)
   │  └─ PAN: "AAAPA1234A" (if Indian)
   │
   ├─ Guest 2 (Child):
   │  ├─ Title: "Master"
   │  ├─ Name: "Child Name"
   │  ├─ Age: 8
   │  └─ PaxType: 2 (Child)
   │
        │
        ▼
   STEP 1: PreBook (Validate Price & Policy)
   POST /api/tbo-hotels/prebook
        │
        └─ Backend: preBookHotel({
             TokenId, TraceId, HotelCode, HotelName,
             GuestNationality, NoOfRooms,
             IsVoucherBooking: false,
             HotelRoomDetails: [{...price details...}]
           })
           │
           └─ POST https://HotelBE.tektravels.com/.../blockRoom
              Response:
              ├─ AvailabilityType: "Confirm"
              ├─ IsPriceChanged: false
              ├─ IsCancellationPolicyChanged: false
              └─ Status: 1
        │
        ▼
   STEP 2: Confirm with User
   Display: "Ready to book?"
   ├─ Hotel: "Luxury Hotel Dubai"
   ├─ Dates: "25-28 Oct 2025"
   ├─ Price: "₹15,000/night × 3 nights + ₹2,500 tax = ₹47,500"
   ├─ Policy: "Free cancellation until 23 Oct"
   └─ User clicks "Confirm Booking"
        │
        ▼
   STEP 3: Final Booking
   POST /api/tbo-hotels/book
        │
        └─ Backend: bookHotel({
             TokenId, TraceId, HotelCode, HotelName,
             GuestNationality, NoOfRooms,
             IsVoucherBooking: true,
             HotelRoomDetails: [{...}],
             HotelPassenger: [{...guest details...}]
           })
           │
           └─ POST https://HotelBE.tektravels.com/.../book
              Response:
              ├─ BookingId: 123456789
              ├─ BookingRefNo: "BK-123456789-TBO"
              ├─ ConfirmationNo: "CONF-987654321"
              ├─ VoucherStatus: true
              └─ Status: 1
        │
        ▼
   STEP 4: Generate Voucher (Optional)
   POST /api/tbo-hotels/voucher
        │
        └─ Backend: generateHotelVoucher({
             TokenId, BookingId: 123456789
           })
           │
           └─ Response:
              ├─ VoucherNo: "VCH-123456789"
              ├─ InvoiceNumber: "INV-987654321"
              └─ VoucherStatus: true
        │
        ▼
   Frontend Display Success:
   ✅ Booking Confirmed!
   ├─ Booking Reference: BK-123456789-TBO
   ├─ Confirmation: CONF-987654321
   ├─ Voucher: VCH-123456789
   ├─ Hotel: Luxury Hotel Dubai
   ├─ Check-in: 25 October 2025
   ├─ Check-out: 28 October 2025
   ├─ Total Cost: ₹47,500
   └─ [Download Voucher] [View Details]


4. POST-BOOKING FLOW
   ──────────────────
   User wants to check booking or cancel
        │
        ├─ Check Booking Status:
        │  GET /api/tbo-hotels/booking/123456789
        │  └─ Backend: getHotelBookingDetails({TokenId, BookingId: 123456789})
        │     Response: Full booking details (guest info, dates, pricing)
        │
        └─ Cancel Booking (if within policy):
           POST /api/tbo-hotels/cancel/123456789
           └─ Backend: cancelHotelBooking({
                TokenId, BookingId: 123456789,
                RequestType: 1, Remarks: "Personal reasons"
              })
              Response:
              ├─ ChangeRequestId: 987654321
              ├─ RequestStatus: "Pending"
              └─ Status: 1
              
              Then check status:
              GET /api/tbo-hotels/cancel-status/987654321
              └─ Backend: getChangeRequestStatus({TokenId, ChangeRequestId})
                 Response:
                 ├─ RequestStatus: "Approved"
                 ├─ ApprovalDate: "25/10/2025 10:30:00"
                 └─ Remarks: "Cancellation approved"
```

---

## 💾 Data Cache Strategy

```
┌────────────────────────────────────────────────────┐
│         CACHE HIERARCHY                            │
└────────────────────────────────────────────────────┘

Level 1: IN-MEMORY CACHE (Fastest)
────────────────────────────────────
  TBOAdapter {
    this.hotelTokenId = "token..."
    this.hotelTokenExpiry = timestamp
  }
  Lookup: O(1), ~1ms
  Scope: Single process instance
  

Level 2: DATABASE CACHE (Medium)
────────────────────────────────
  Table: tbo_token_cache
  ┌──────────────┬───────────────┬────────────────┐
  │ token_id     │ agency_id     │ expires_at     │
  ├──────────────┼───────────────┼────────────────┤
  │ abc-def-123  │ ApiIntegrat.. │ 2025-10-26 ... │
  │ xyz-uvw-456  │ ApiIntegrat.. │ 2025-10-27 ... │
  └──────────────┴───────────────┴────────────────┘
  Lookup: O(log N), ~10-50ms
  Scope: All processes (shared)
  Queries:
    SELECT token_id FROM tbo_token_cache
    WHERE agency_id = $1 AND expires_at > NOW()
    

Level 3: REDIS CACHE (Static Data)
──────────────────────────────────
  Keys:
  - tbo:static:countries        (XML, 24h TTL)
  - tbo:static:cities:IN        (Array, 24h TTL)
  - tbo:static:cities:AE        (Array, 24h TTL)
  - tbo:static:topdestinations  (Array, 24h TTL)
  - tbo:static:hotelcodes:DXB   (Array, 24h TTL)
  - tbo:static:hotel:DXBHOT001  (Object, 24h TTL)
  
  Lookup: O(1), ~2-5ms
  Scope: All processes, across restarts
  

Level 4: NETWORK CACHE (TBO API)
───────────────────────────────
  Dynamic data (Hotel Search, Room Details):
  - NOT CACHED
  - Always fetch fresh from TBO
  - Real-time pricing
  - Real-time availability
  

CACHE FLOW DIAGRAM:
─────────────────

Token needed?
  │
  ├─ In-memory cache valid? ───YES──→ Return ✅
  │  (this.hotelTokenId & expiry)
  │
  NO
  │
  ├─ DB cache valid? ─────────YES──→ Load to memory, Return ✅
  │  (tbo_token_cache table)
  │
  NO
  │
  └─ Fetch new token ────────────────→ Cache in memory + DB, Return ✅
     POST /Authenticate


City list needed (for CountryCode=IN)?
  │
  ├─ Redis cache valid? ─────YES──→ Return ✅
  │  (tbo:static:cities:IN)
  │
  NO
  │
  └─ Fetch from API ─────────────────→ Store in Redis (24h), Return ✅
     POST /GetDestinationSearchStaticData
```

---

## 🔐 Authentication & Token Lifecycle

```
┌────────────────────────────────────────────────────┐
│  TOKEN LIFECYCLE                                   │
└────────────────────────────────────────────────────┘

CREATION
────────
User calls: searchHotels(destination, checkIn, checkOut)
  │
  ├─ Check in-memory token
  │  if (this.hotelTokenId && Date.now() < this.hotelTokenExpiry) {
  │    return this.hotelTokenId; ✅
  │  }
  │
  ├─ Check DB cache
  │  SELECT token_id FROM tbo_token_cache
  │  WHERE agency_id = 'ApiIntegrationNew'
  │    AND expires_at > NOW()
  │  if (row) {
  │    this.hotelTokenId = row.token_id;
  │    return row.token_id; ✅
  │  }
  │
  └─ Fetch new token
     POST http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate
     {
       "ClientId": "ApiIntegrationNew",
       "UserName": "BOMF145",
       "Password": "@Bo#4M-Api@",
       "EndUserIp": "192.168.5.56"
     }
     │
     Response:
     {
       "TokenId": "f17c0838-65d4-4985-8fd5-56cc64a076bd",
       "Status": 1,
       "Error": {"ErrorCode": 0, "ErrorMessage": ""}
     }
     │
     └─ CACHE token:
        ├─ In-memory: this.hotelTokenId = "f17c0838-..."
        │             this.hotelTokenExpiry = Date.now() + (23 * 60 * 60 * 1000)
        │
        └─ DB: INSERT INTO tbo_token_cache
               (token_id, agency_id, expires_at)
               VALUES
               ('f17c0838-...', 'ApiIntegrationNew', NOW() + INTERVAL '24 hours')

USAGE
─────
Token valid for: 24 hours (00:00 to 23:59 UTC per TBO docs)

Every request to dynamic endpoints includes:
├─ searchHotels() ─────────────→ TokenId in payload ✅
├─ getHotelInfo() ─────────────→ TokenId in payload ✅
├─ getHotelRoom() ─────────────→ TokenId in payload ✅
├─ preBookHotel() ─────────────→ TokenId in payload ✅
├─ bookHotel() ────────────────→ TokenId in payload ✅
├─ generateHotelVoucher() ─────→ TokenId in payload ✅
├─ getHotelBookingDetails() ───→ TokenId in payload ✅
├─ cancelHotelBooking() ───────→ TokenId in payload ✅
├─ getChangeRequestStatus() ───→ TokenId in payload ✅
└─ getHotelInfo() ─────────────→ TokenId in payload ✅

EXPIRY & REFRESH
────────────────
Token expires at ~24 hours

Before each request:
if (Date.now() >= this.hotelTokenExpiry) {
  // Token expired, fetch new one
  this.getHotelToken(); // Recursively gets new token
  // Retry original request
}

Example expiry check:
if (this.hotelTokenExpiry && Date.now() > this.hotelTokenExpiry) {
  // In-memory token expired
  // Fall back to DB cache or fetch new
}

LOGOUT (Optional)
────────────────
POST /Logout
{
  "TokenId": "f17c0838-...",
  "EndUserIp": "192.168.5.56"
}
Response:
{
  "Status": 1,
  "Error": {"ErrorCode": 0}
}
→ Invalidates token at TBO end
→ No cleanup needed locally (token just expires naturally)
```

---

## 🌊 Request/Response Message Flow

```
┌──────────────────────────────────────────────────────┐
│  TYPICAL API REQUEST-RESPONSE CYCLE                  │
└──────────────────────────────────────────────────────┘

REQUEST:
────────
Client (Frontend/System):
1. Build request object:
   {
     "EndUserIp": "192.168.5.56",
     "TokenId": "f17c0838-65d4-4985-8fd5-56cc64a076bd",
     "CheckInDate": "25/10/2025",
     "NoOfNights": 3,
     "CountryCode": "AE",
     "CityId": 130443,
     "PreferredCurrency": "INR",
     "GuestNationality": "IN",
     "NoOfRooms": 1,
     "RoomGuests": [
       {
         "NoOfAdults": 2,
         "NoOfChild": 1,
         "ChildAge": [8]
       }
     ]
   }

2. Send via HTTP:
   POST https://HotelBE.tektravels.com/hotelservice.svc/rest/Gethotelresult
   
   Headers:
   ├─ Content-Type: application/json
   ├─ Accept: application/json
   ├─ User-Agent: Faredown-AI-Bargaining/1.0
   └─ Connection: keep-alive

   Body: JSON (above)

3. Network:
   ├─ Via Fixie proxy (if enabled)
   ├─ Timeout: 15 seconds
   └─ Retry on failure (exponential backoff)

RESPONSE:
─────────
Server (TBO API):
1. Process request (2-5 seconds)
2. Return response:
   {
     "TraceId": "unique-trace-id-for-this-search",
     "CheckInDate": "25/10/2025",
     "CheckOutDate": "28/10/2025",
     "CityId": 130443,
     "PreferredCurrency": "INR",
     "NoOfRooms": 1,
     "RoomGuests": [...],
     "HotelResults": [
       {
         "ResultIndex": 1,
         "HotelCode": "DXBHOT001",
         "HotelName": "Luxury Hotel Dubai",
         "StarRating": 5,
         "HotelDescription": "5-star luxury hotel in downtown Dubai",
         "HotelPicture": "https://images.tbo.com/hotel1.jpg",
         "HotelAddress": "Downtown Dubai",
         "Price": {
           "CurrencyCode": "INR",
           "RoomPrice": 15000,
           "Tax": 2500,
           "PublishedPrice": 17500,
           "OfferedPrice": 16800,
           "AgentCommission": 1680,
           "AgentMarkUp": 500
         },
         "Images": [
           "https://...",
           "https://..."
         ],
         "Amenities": ["WiFi", "Pool", "Gym", "Spa"],
         "ReviewScore": 4.5,
         "ReviewCount": 250
       },
       {...},
       {...}
       // 47+ more hotels
     ],
     "Status": 1,
     "Error": {
       "ErrorCode": 0,
       "ErrorMessage": ""
     }
   }

CLIENT PROCESSING:
──────────────────
Backend (tboAdapter.js):
1. Receive response
2. Check Status field:
   if (res.data?.Status !== 1) {
     → Log error and return []
   }

3. Extract HotelResults:
   const hotels = res.data?.HotelResults || [];

4. Map to UnifiedHotel format:
   const results = hotels.map(h => ({
     hotelId: h.HotelCode,
     name: h.HotelName,
     city: destination,
     price: h.Price.OfferedPrice,
     currency: currency,
     supplier: "TBO",
     checkIn: checkIn,
     checkOut: checkOut,
     rates: [{
       rateKey: h.RateKey || `${hotelId}_standard`,
       roomType: h.RoomType || "Standard Room",
       price: h.Price.OfferedPrice,
       markedUpPrice: h.Price.OfferedPrice,
       tax: h.Price.Tax,
       cancellationPolicy: [],
       isRefundable: true
     }],
     images: h.Images || [],
     amenities: h.Amenities || [],
     starRating: h.StarRating,
     reviewScore: h.ReviewScore,
     location: h.HotelAddress
   }));

5. Return to frontend:
   200 OK
   [{UnifiedHotel}, {...}, ...]

FRONTEND DISPLAY:
─────────────────
React Component (HotelResults.tsx):
1. Receive array of hotels
2. Render HotelCard for each:
   ├─ Hotel name
   ├─ Star rating
   ├─ Image carousel
   ├─ Price: ₹16,800
   ├─ Amenities (WiFi, Pool, Gym)
   ├─ Review score
   └─ [View Details] [Book Now]

3. User clicks hotel:
   → Navigate to hotel details page
   → Call getHotelInfo() + getHotelRoom()
```

---

## 🗺️ Endpoint Hierarchy

```
┌─────────────────────────────────────────────┐
│  TBO HOTEL API ENDPOINT HIERARCHY           │
└─────────────────────────────────────────────┘

API BASE URLS:
──────────────

1. AUTHENTICATION & ACCOUNT
   http://api.tektravels.com/SharedServices/SharedData.svc/rest/
   ├─ Authenticate          (Get token)
   ├─ Logout                (End session)
   ├─ CountryList           (Get countries)
   └─ TopDestinationList    (Get popular cities)

2. STATIC DATA
   http://api.tektravels.com/SharedServices/StaticData.svc/rest/
   ├─ GetDestinationSearchStaticData  (Get cities by country)
   └─ [Other static endpoints]

3. BOOKING ENGINE
   https://HotelBE.tektravels.com/hotelservice.svc/rest/
   ├─ Gethotelresult            (Search hotels)
   ├─ GetHotelInfo              (Hotel details)
   ├─ GetHotelRoom              (Room pricing)
   ├─ blockRoom                 (PreBook)
   ├─ book                      (Final booking)
   ├─ GenerateVoucher           (Voucher generation)
   ├─ GetBookingDetail          (Booking status)
   ├─ SendChangeRequest         (Cancel/amend)
   └─ GetChangeRequestStatus    (Change status)


ENDPOINT GROUPING:
──────────────────

SEARCH GROUP (Real-time)
├─ Gethotelresult
├─ GetHotelInfo
├─ GetHotelRoom
└─ blockRoom

BOOKING GROUP (Transaction)
├─ book
├─ GenerateVoucher
├─ GetBookingDetail
├─ SendChangeRequest
└─ GetChangeRequestStatus

STATIC GROUP (Cached 24h)
├─ Authenticate
├─ CountryList
├─ GetDestinationSearchStaticData
├─ TopDestinationList
├─ [Cities]
├─ [Hotel Codes]
└─ [Hotel Details]


ENDPOINT DEPENDENCY:
────────────────────

         ┌──────────────────┐
         │ Authenticate     │ ◄─── TOKEN
         │ (get token)      │
         └────────┬─────────┘
                  │ (TokenId)
                  ▼
         ┌──────────────────┐
         │ CountryList      │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ GetDestination   │
         │ SearchStaticData │ ◄─── CityId
         └────────┬─────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
   ┌──────────────┐ ┌──────────────┐
   │ Gethotelresult │ │ (other data) │ ◄─── TraceId
   │ (search)     │ │              │
   ���──────┬───────┘ └──────────────┘
          │ (HotelCode, ResultIndex, TraceId)
          ├──────┬──────┬──────┐
          │      │      │      │
          ▼      ▼      ▼      ▼
      ┌────┐┌────┐┌────┐┌────┐
      │Info││Room││Img ││Amen│
      └────┘└────┘└────┘└────┘
          │      │      │
          └──────┼──────┘
                 │ (select room)
                 ▼
         ┌──────────────────┐
         │ blockRoom        │ ◄─── PreBook (validate)
         │ (PreBook)        │
         └─────────┬────────┘
                   │ (confirmed)
                   ▼
         ┌──────────────────┐
         │ book             │ ◄─── Final booking
         │ (Book)           │      (+ guest details)
         └────────┬─────────┘
                  │ (BookingId)
                  ├──────┬──────────┬──────────┐
                  │      │          │          │
                  ▼      ▼          ▼          ▼
            ┌────────┬────────┬────────┬──────���─┐
            │Details │Voucher │ Change │ Cancel │
            └────────┴────────┴────────┴────────┘
```

---

## 📈 API Call Sequence for Booking

```
TIME ──────────────────────────────────────────────────────>

T0   searchHotels()
     │ Authenticate
     │ getCityId()
     │ POST /Gethotelresult
     └─→ [50 hotels]

T3   User selects hotel
     │
T3.5 getHotelInfo()
     │ POST /GetHotelInfo
     └─→ Details

T4   getHotelRoom()
     │ POST /GetHotelRoom
     └─→ Pricing & policies

T4.5 User clicks Book
     │
T5   preBookHotel()
     │ POST /blockRoom
     └─→ Availability confirmed

T6   User confirms
     │
T7   bookHotel()
     │ POST /book
     └─→ BookingId: 123456789

T9   generateHotelVoucher()
     │ POST /GenerateVoucher
     └─→ VoucherNo

T10  Display confirmation


TOTAL TIME: ~10 seconds
```

---

## 🔌 External Dependencies

```
┌──────────────────────────────────────────┐
│  EXTERNAL SYSTEMS & DEPENDENCIES         │
└──────────────────────────────────────────┘

TBO INFRASTRUCTURE
──────────────────
1. Authentication Service
   └─ http://api.tektravels.com/SharedServices/SharedData.svc/rest/Authenticate
   └─ Uptime: 99.9%
   └─ Latency: ~1-2 seconds

2. Static Data Service
   └─ http://api.tektravels.com/SharedServices/StaticData.svc/rest/...
   └─ Uptime: 99.9%
   └─ Latency: ~800ms

3. Booking Engine
   └─ https://HotelBE.tektravels.com/hotelservice.svc/rest/
   └─ Uptime: 99.5%
   └─ Latency: 2-5 seconds

INFRASTRUCTURE DEPENDENCIES
───────────────────────────
1. Fixie Proxy (for IP whitelisting)
   └─ Config: FIXIE_URL = http://fixie:***@criterium.usefixie.com:80
   └─ IPs: 52.5.155.132, 52.87.82.133
   └─ Purpose: Route through whitelisted IPs

2. PostgreSQL Database (Render)
   └─ Host: dpg-d2086mndiees739731t0-a.singapore-postgres.render.com
   └─ DB: faredown_booking_db
   └─ Tables: tbo_token_cache, hotel_unified, room_offer_unified
   └─ Purpose: Token caching, hotel data persistence

3. Redis Cache (Render)
   └─ Host: faredown-redis
   └─ Purpose: Static data caching (24h)
   └─ Keys: tbo:static:*

4. Node.js/Express Server (Render)
   └─ Port: 3000 (internal), 443 (HTTPS)
   └─ Load: 10 requests/second
   └─ Memory: ~512MB allocated

FRONTEND DEPENDENCIES
──────────────────────
1. Vite Dev Server (localhost:5173)
2. Netlify Static Hosting
3. API Redirect (to Render API)
4. Browser APIs (fetch, localStorage)
```

---

## 🎯 Key Takeaways

1. **Token Management:** Automatic caching at 3 levels (memory → DB → API fetch)
2. **Data Flow:** Search → Details → PreBook → Book → Voucher → Status
3. **Real-time:** Hotel search and pricing are live (not cached)
4. **Static Data:** Countries, cities, hotels cached for 24 hours
5. **Error Handling:** Automatic retry with exponential backoff
6. **Performance:** Average 2-3 requests per booking, ~10 second total flow

---

**Report Generated:** October 25, 2025  
**Diagram Version:** 1.0  
**API Version:** Tek Travels Hotel API (TBO)
