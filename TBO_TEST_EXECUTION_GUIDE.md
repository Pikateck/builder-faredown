# TBO Hotel API - End-to-End Connectivity Test Guide

## Overview
This guide walks through running a complete end-to-end test of the TBO Hotel API integration before implementing the STEP 2 canonical endpoints.

## Test Script Location
- **File**: `api/scripts/run-tbo-test.js`
- **Purpose**: Tests authentication and hotel search against live TBO APIs
- **Runtime**: ~15-30 seconds total

---

## STEP 1: Verify Environment Variables (Render Dashboard)

The test script requires these environment variables to be set on Render. The script will check for **both new and old naming conventions**:

### Primary Names (Recommended)
```
TBO_CLIENT_ID=tboprod
TBO_API_USER_ID=BOMF145
TBO_API_PASSWORD=@Bo#4M-Api@
TBO_STATIC_USER=travelcategory
TBO_STATIC_PASSWORD=Tra@59334536
TBO_END_USER_IP=192.168.5.56
```

### Alternative Names (Fallback - Currently Set)
```
TBO_HOTEL_CLIENT_ID=tboprod
TBO_HOTEL_USER_ID=BOMF145
TBO_HOTEL_PASSWORD=@Bo#4M-Api@
TBO_STATIC_DATA_CREDENTIALS_USERNAME=travelcategory
TBO_STATIC_DATA_CREDENTIALS_PASSWORD=Tra@59334536
```

**Note**: The script will automatically use whichever naming convention is available. If you want to standardize on the new names (recommended for future scalability), update Render environment variables to use the primary names above.

---

## STEP 2: Run the Test Script

### Option A: Via Render Shell (Recommended)

1. Open Render Dashboard: https://dashboard.render.com/d/builder-faredown-pricing
2. Click **"Shell"** in the top-right menu
3. Run the following command:

```bash
cd /opt/render/project && node api/scripts/run-tbo-test.js
```

**Expected Output**:
```
════════════════════════════════════════════════════════════════════════════════
→ TBO Hotel API - End-to-End Connectivity Test
════════════════════════════════════════════════════════════════════════════════

[2025-XX-XXTXX:XX:XX.XXXZ] → STEP 1: Environment Variable Verification
[2025-XX-XXTXX:XX:XX.XXXZ] ✓ TBO Client ID: SET
[2025-XX-XXTXX:XX:XX.XXXZ] ✓ TBO User ID: SET
[2025-XX-XXTXX:XX:XX.XXXZ] ✓ TBO Password: SET

[2025-XX-XXTXX:XX:XX.XXXZ] → STEP 2: Authentication Test (TBO Shared Data API)
[2025-XX-XXTXX:XX:XX.XXXZ] Endpoint: https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/Authenticate
[2025-XX-XXTXX:XX:XX.XXXZ] User: BOMF145@tboprod
[2025-XX-XXTXX:XX:XX.XXXZ] ✓ Authentication successful! (XXXms)
[2025-XX-XXTXX:XX:XX.XXXZ] ✓   Token: [40-char token start]...
[2025-XX-XXTXX:XX:XX.XXXZ] ✓   Expires in: ~55 minutes
[2025-XX-XXTXX:XX:XX.XXXZ] ✓   Response Status Code: 200

[2025-XX-XXTXX:XX:XX.XXXZ] → STEP 3: Hotel Search Test (TBO Hotel API - Live)
[2025-XX-XXTXX:XX:XX.XXXZ] Search Parameters:
[2025-XX-XXTXX:XX:XX.XXXZ] City: DXB (Dubai)
[2025-XX-XXTXX:XX:XX.XXXZ] Check-in: 2025-11-30
[2025-XX-XXTXX:XX:XX.XXXZ] Check-out: 2025-12-03
[2025-XX-XXTXX:XX:XX.XXXZ] ✓ Hotel search completed! (XXXms)
[2025-XX-XXTXX:XX:XX.XXXZ] ✓   Hotels Found: 47+
[2025-XX-XXTXX:XX:XX.XXXZ] Sample Hotel (First Result):
[2025-XX-XXTXX:XX:XX.XXXZ]   Name: [Hotel Name]
[2025-XX-XXTXX:XX:XX.XXXZ]   Price (per night): INR [Amount]
[2025-XX-XXTXX:XX:XX.XXXZ] ✓   Has Rates: ✓ Yes
[2025-XX-XXTXX:XX:XX.XXXZ] ✓   Has Cancellation Info: ✓ Yes

═════════════════════════════════════════════════════════════════��══════════════
✓ TBO CONNECTIVITY TEST PASSED - All systems operational!
════════════════════════════════════════════════════════════════════════════════
```

### Option B: Via SSH (Alternative)

If Render Shell is not available:

```bash
# Connect to Render instance
render connect builder-faredown-pricing

# Run test
cd /opt/render/project
node api/scripts/run-tbo-test.js
```

---

## STEP 3: Interpret Test Results

### ✅ **SUCCESS** (All 3 steps pass)

If you see:
- Step 1: All environment variables SET ✓
- Step 2: Authentication successful with valid TokenId ✓
- Step 3: Hotels found with rates and cancellation info ✓

**Next Action**: Proceed to STEP 2 endpoint implementation (see below)

### ❌ **FAILURE - Authentication (Step 2)**

Common errors:
- `401 Unauthorized`: Credentials incorrect or account disabled on TBO
  - Action: Verify TBO_CLIENT_ID, TBO_API_USER_ID, TBO_API_PASSWORD are correct
  - Action: Contact TBO support to verify account is enabled for Hotel API

- `Connection timeout`: Network connectivity issue
  - Action: Check if Fixie proxy is configured (if using USE_SUPPLIER_PROXY=true)
  - Action: Verify IP whitelisting on TBO side (Fixie IPs: 52.5.155.132, 52.87.82.133)

- `Missing environment variables`: Variables not set on Render
  - Action: Update Render environment variables (Render Dashboard → Settings → Environment)

### ❌ **FAILURE - Hotel Search (Step 3)**

Common errors:
- `0 hotels found`: TBO has no inventory for Dubai in that date range
  - Action: Test works correctly, just no data for that specific search
  - Action: Try different dates (further in the future)

- `Invalid CityId`: City code mapping issue
  - Action: DXB is correct code for Dubai, error suggests mapping issue
  - Action: Check if TBO requires numeric DestinationId (handled by adapter)

- `401 during search`: Auth token missing or expired
  - Action: Check if authentication token is being passed to search endpoint
  - Action: Verify token format and content

---

## STEP 4: After Successful Test

Once the test passes (green ✓), proceed with STEP 2 implementation:

### STEP 2: Implement Canonical Hotel API Endpoints

Create these 4 new endpoints using TBO adapter:

1. **`GET /api/hotels/autocomplete?q=paris`**
   - Returns city suggestions from TBO cities
   - Autocomplete for destination input

2. **`POST /api/hotels/search`**
   - Body: `{ cityCode, checkIn, checkOut, adults, children, rooms, currency, guestNationality }`
   - Returns: Array of hotels with rates, amenities, cancellation policies
   - Response caches in `room_offer_unified` table with 15-minute TTL

3. **`GET /api/hotels/:propertyId`**
   - Returns: Full hotel details, amenities, images, all room types
   - Retrieves from cache if available, else fresh from TBO

4. **`POST /api/hotels/:propertyId/rates`**
   - Body: `{ checkIn, checkOut, roomTypeId, adults, children }`
   - Returns: Detailed rates, taxes, board types, cancellation policies
   - Caches in `room_offer_unified` with 15-minute TTL

### Database Schema
Ensure these tables exist:
```sql
-- Hotel unified data (metadata)
CREATE TABLE hotel_unified (
  id UUID PRIMARY KEY,
  supplier VARCHAR(50),
  supplier_code VARCHAR(100) UNIQUE,
  name VARCHAR(255),
  rating INT,
  images JSONB,
  amenities JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Room offers with pricing (cached, 15-min TTL)
CREATE TABLE room_offer_unified (
  id UUID PRIMARY KEY,
  hotel_id UUID REFERENCES hotel_unified(id),
  room_type_id VARCHAR(100),
  room_name VARCHAR(255),
  check_in DATE,
  check_out DATE,
  base_price DECIMAL(10,2),
  taxes DECIMAL(10,2),
  currency VARCHAR(3),
  board_type VARCHAR(50),
  cancellation_policy JSONB,
  refundable BOOLEAN,
  expires_at TIMESTAMP,  -- For 15-min TTL
  created_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_room_offer_hotel_checkin ON room_offer_unified(hotel_id, check_in);
CREATE INDEX idx_room_offer_expires ON room_offer_unified(expires_at);
```

### Implementation Checklist
- [ ] Test script runs successfully (all 3 steps green)
- [ ] Get existing database migration from `/api/database/migrations/`
- [ ] Create new endpoints in `/api/routes/hotels-canonical.js`
- [ ] Register routes in `api/server.js`
- [ ] Implement TBO adapter methods for each endpoint
- [ ] Add caching logic (room_offer_unified, 15-min TTL)
- [ ] Add error handling and fallbacks
- [ ] Create Postman collection for testing
- [ ] Document endpoints in OpenAPI spec
- [ ] Deploy and test on Render

---

## Troubleshooting

### Q: "Cannot find module '../lib/tboRequest'"
**A**: Ensure you're running from project root. Use: `cd /opt/render/project && node api/scripts/run-tbo-test.js`

### Q: "All environment variables MISSING"
**A**: Update Render environment variables in dashboard. Script checks for:
- Primary: TBO_CLIENT_ID, TBO_API_USER_ID, TBO_API_PASSWORD
- Fallback: TBO_HOTEL_CLIENT_ID, TBO_HOTEL_USER_ID, TBO_HOTEL_PASSWORD

### Q: Test passes but hotels showing "0 results" in app
**A**: API returns data, but frontend may not be consuming it correctly. Check:
- Frontend calls `/api/hotels` with correct query parameters
- Response is being mapped to Hotel interface correctly
- Cache layer isn't blocking fresh data

### Q: Getting "401 Unauthorized" on authentication
**A**: TBO credentials are incorrect or account disabled. Verify:
```bash
# Log into TBO portal and confirm:
# - ClientId: tboprod
# - Username: BOMF145
# - Password: @Bo#4M-Api@
# - Account enabled for Hotel API access
```

---

## What This Test Validates

✅ **Network Connectivity**
- Backend can reach TBO Shared Data API
- Backend can reach TBO Hotel API (via Fixie proxy if configured)

✅ **Authentication**
- Credentials are correct and account is active
- Authentication endpoint returns valid TokenId
- TokenId format and expiry are correct

✅ **Hotel Search**
- Search endpoint accepts correct payload format
- Returns real hotel data from TBO inventory
- Includes pricing, board types, and cancellation policies
- Timing is acceptable (<5 seconds typical)

✅ **Data Quality**
- Hotels have required fields (name, rating, price)
- Rates/pricing data is present
- Cancellation information is included
- Multiple hotels returned (high inventory confidence)

---

## Next Steps

1. **Run the test** (see STEP 2 above)
2. **Share test output** if there are any errors
3. **Once green**: Start STEP 2 canonical endpoint implementation
4. **After implementation**: Test endpoints with Postman collection
5. **Final verification**: End-to-end flow from frontend to booking

---

## Files Created
- `api/scripts/run-tbo-test.js` - Comprehensive connectivity test script
- `TBO_TEST_EXECUTION_GUIDE.md` - This file

## Questions?
If the test fails, share:
1. Full console output from the test
2. Error message and response body
3. Environment variables being used (credentials masked)
4. Network logs if available
