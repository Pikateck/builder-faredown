# TBO Hotel API - Complete Deployment Guide

**Date:** Oct 25, 2025  
**Version:** Final (Production Ready)  
**Last Updated:** Oct 25, 2025

---

## Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Detailed Setup](#detailed-setup)
3. [Verification & Testing](#verification--testing)
4. [Troubleshooting](#troubleshooting)
5. [Production Monitoring](#production-monitoring)
6. [Rollback Plan](#rollback-plan)

---

## Quick Start

### 1. Verify Environment Variables (Render Dashboard)

**Go to:** https://dashboard.render.com/services/builder-faredown-pricing

**Ensure these variables are set:**

```
TBO_HOTEL_CLIENT_ID=tboprod
TBO_HOTEL_USER_ID=BOMF145
TBO_HOTEL_PASSWORD=@Bo#4M-Api@
TBO_STATIC_DATA_CREDENTIALS_USERNAME=travelcategory
TBO_STATIC_DATA_CREDENTIALS_PASSWORD=Tra@59334536
TBO_HOTEL_STATIC_DATA=https://apiwr.tboholidays.com/HotelAPI/
TBO_HOTEL_SEARCH_PREBOOK=https://affiliate.travelboutiqueonline.com/HotelAPI/
TBO_HOTEL_BOOKING=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/
FIXIE_URL=http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80
USE_SUPPLIER_PROXY=true
```

✅ **All variables are already set.** No action needed.

---

### 2. Test Connectivity (30 seconds)

**Run this command:**

```bash
# Check outbound IP
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/egress-ip

# Expected Response:
# {"success": true, "ip": "52.5.155.132"}  OR  {"ip": "52.87.82.133"}
```

**If you see 52.5.155.132 or 52.87.82.133:** ✅ **Proxy is working**

If you see a different IP: ⚠️ See [Proxy Not Working](#proxy-not-working)

---

### 3. Confirm IPs are Whitelisted with TBO

**⚠️ CRITICAL ACTION REQUIRED:**

Contact TBO support and confirm:
- **IP Address 1:** 52.5.155.132
- **IP Address 2:** 52.87.82.133

**Email Template:**

```
Subject: IP Whitelist Confirmation - Faredown Integration

Hi TBO Support,

We're integrating with TBO Hotel API for production.
Our outbound IPs via Fixie proxy are:
- 52.5.155.132
- 52.87.82.133

Please confirm both IPs are whitelisted for:
- ClientId: tboprod
- Agency: BOMF145

Thank you!
```

---

### 4. Run Full Diagnostics

```bash
curl https://builder-faredown-pricing.onrender.com/api/tbo/diagnostics

# This will test:
# ✅ Outbound IP detection (3 methods)
# ✅ TBO Search endpoint connectivity
# ✅ Credentials validity
# ✅ Response format
```

**Expected Success Response:**
```json
{
  "success": true,
  "outbound_ip": {
    "via_ipify": "52.5.155.132",
    "via_ifconfig": "52.5.155.132",
    "via_icanhazip": "52.5.155.132"
  },
  "tbo_hotel_search": {
    "status": "connected",
    "response_code": 200,
    "tbo_status": 1,
    "message": "Success"
  }
}
```

---

## Detailed Setup

### Architecture Overview

```
Frontend (Netlify)
    ↓
HotelSearchForm.tsx
    ↓
[1] /api/tbo-hotels/cities?q=dubai
    ↓
Backend (Render)
    ↓
tboAdapter.searchCities()
    ↓
Fixie Proxy (52.5.155.132 or 52.87.82.133)
    ↓
TBO API (https://apiwr.tboholidays.com/HotelAPI/)
    ↓
Return: [DXB, DAC, ...]

User selects Dubai (DXB)
    ↓
Frontend navigates to /hotels/results?destination=DXB
    ���
[2] /api/tbo-hotels/search (POST)
    ↓
tboAdapter.searchHotels()
    ↓
Fixie Proxy
    ↓
TBO API (https://affiliate.travelboutiqueonline.com/HotelAPI/Search)
    ↓
Return: Array of hotels with pricing
```

---

### Environment Variables Explained

#### Credentials (Authentication)

| Variable | Value | Purpose |
|----------|-------|---------|
| `TBO_HOTEL_CLIENT_ID` | `tboprod` | Identifies client in API calls |
| `TBO_HOTEL_USER_ID` | `BOMF145` | Agency/User ID for login |
| `TBO_HOTEL_PASSWORD` | `@Bo#4M-Api@` | Password for authentication |
| `TBO_STATIC_DATA_CREDENTIALS_USERNAME` | `travelcategory` | Static data endpoint user |
| `TBO_STATIC_DATA_CREDENTIALS_PASSWORD` | `Tra@59334536` | Static data endpoint password |

#### Endpoints (API Paths)

| Variable | Value | Purpose |
|----------|-------|---------|
| `TBO_HOTEL_STATIC_DATA` | `https://apiwr.tboholidays.com/HotelAPI/` | Countries, cities, hotels list |
| `TBO_HOTEL_SEARCH_PREBOOK` | `https://affiliate.travelboutiqueonline.com/HotelAPI/` | Search hotels, preBook |
| `TBO_HOTEL_BOOKING` | `https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/` | Book, voucher, cancellation |

#### Proxy (Network Routing)

| Variable | Value | Purpose |
|----------|-------|---------|
| `FIXIE_URL` | `http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80` | HTTP proxy for outbound requests |
| `USE_SUPPLIER_PROXY` | `true` | Enable proxy for TBO calls |

---

### Step-by-Step Deployment

#### Step 1: Verify All Env Vars Are Set

```bash
# SSH into Render
render login  # or via dashboard

# Check environment
echo $TBO_HOTEL_CLIENT_ID  # Should output: tboprod
echo $TBO_HOTEL_USER_ID    # Should output: BOMF145
echo $FIXIE_URL            # Should output: http://fixie:...
```

**Expected:** All variables return their configured values

---

#### Step 2: Restart Render Service

```bash
# On Render Dashboard:
# Services → builder-faredown-pricing → Manual Deploy → Deploy Latest Commit
```

**Wait 2-3 minutes for service to start.**

---

#### Step 3: Test Basic Connectivity

```bash
# Health check
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/health

# Should return:
# {"success": true, "data": {...health info...}}
```

---

#### Step 4: Test City Search

```bash
curl "https://builder-faredown-pricing.onrender.com/api/tbo-hotels/cities?q=dubai&limit=5"

# Should return:
# {
#   "success": true,
#   "data": [
#     {"id": "DXB", "name": "Dubai", "country": "AE", ...},
#     ...
#   ]
# }
```

---

#### Step 5: Test Hotel Search

```bash
curl -X POST "https://builder-faredown-pricing.onrender.com/api/tbo-hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "DXB",
    "checkIn": "2025-10-31",
    "checkOut": "2025-11-03",
    "adults": 2,
    "children": 0,
    "rooms": 1
  }'

# Should return array of hotels with pricing
# {
#   "success": true,
#   "data": [
#     {
#       "hotelId": "123456",
#       "name": "Taj Beachfront Dubai",
#       "starRating": 5,
#       "price": {...},
#       "rooms": [...]
#     },
#     ...
#   ]
# }
```

---

## Verification & Testing

### Test Scenarios

#### Scenario 1: City Search
**Purpose:** Verify static data endpoints work  
**Test:** `GET /api/tbo-hotels/cities?q=paris&limit=10`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "PAR",
      "name": "Paris",
      "country": "FR",
      "coordinates": {"lat": 48.8566, "lon": 2.3522}
    }
  ]
}
```

---

#### Scenario 2: Hotel Search (Domestic)
**Purpose:** Verify search endpoint for Indian cities  
**Test:** `POST /api/tbo-hotels/search` with destination=DEL

**Request:**
```json
{
  "destination": "DEL",
  "checkIn": "2025-11-15",
  "checkOut": "2025-11-17",
  "adults": 2,
  "children": 0,
  "rooms": 1
}
```

**Expected:** Hotels in Delhi with INR pricing

---

#### Scenario 3: Hotel Search (International)
**Purpose:** Verify search endpoint for international cities  
**Test:** `POST /api/tbo-hotels/search` with destination=LDN

**Request:**
```json
{
  "destination": "LDN",
  "checkIn": "2025-11-20",
  "checkOut": "2025-11-23",
  "adults": 3,
  "children": 1,
  "rooms": 2,
  "currency": "GBP"
}
```

**Expected:** Hotels in London with GBP pricing

---

#### Scenario 4: Proxy Verification
**Purpose:** Confirm outbound IP is whitelisted

**Test:** `GET /api/tbo-hotels/egress-ip`

**Expected:**
```json
{
  "success": true,
  "ip": "52.5.155.132"
}
```

**Critical:** If IP is NOT 52.5.155.132 or 52.87.82.133 → **Proxy not working**

---

### Success Criteria

| Test | Expected | Status |
|------|----------|--------|
| Health check returns 200 OK | ✅ Working | |
| Diagnostics test passes | ✅ All sections pass | |
| Cities search returns results | ✅ Data found | |
| Hotel search returns hotels | ✅ Array with >5 hotels | |
| Outbound IP is 52.5.155.132 or 52.87.82.133 | ✅ Correct IP | |
| Response time < 3 seconds | ✅ Fast | |
| No credential errors in logs | ✅ No auth failures | |

---

## Troubleshooting

### Problem: Hotel Search Returns 401 Unauthorized

**Cause:** IPs not whitelisted with TBO  
**Fix:**
1. Confirm IPs with TBO: 52.5.155.132, 52.87.82.133
2. Wait for TBO to whitelist (usually 5-10 minutes)
3. Retry search
4. If still fails after 24h, contact TBO support

---

### Problem: Proxy Not Working (Outbound IP is Not Whitelisted)

**Cause:** Fixie proxy not routing requests correctly

**Fix:**
1. Verify `FIXIE_URL` env var is set
2. Verify `USE_SUPPLIER_PROXY=true`
3. Restart Render service
4. Check logs: `tail -f /var/log/faredown/*.log`
5. If still not working, check Fixie dashboard

---

### Problem: City Search Returns Empty Results

**Cause:** Static data endpoints failing

**Fix:**
1. Run diagnostics: `GET /api/tbo/diagnostics`
2. Check static data credentials
3. Verify database has cities seeded
4. If needed, run sync job: `node api/jobs/tboSyncLocations.js`

---

### Problem: Timeout on Hotel Search

**Cause:** TBO API slow or not responding  
**Fix:**
1. Increase timeout: Set `TBO_TIMEOUT_MS=30000` (30 seconds)
2. Check TBO status page for outages
3. Retry request
4. Contact TBO support if persistent

---

### Problem: Certificate/SSL Error

**Cause:** Proxy not handling HTTPS correctly  
**Fix:**
1. Verify FIXIE_URL uses HTTP (not HTTPS)
2. Verify proxy packages installed: `npm list https-proxy-agent`
3. Restart service
4. Check logs for SSL errors

---

### All Diagnostics Pass But Still Getting Errors

**Debug Steps:**

```bash
# 1. Check Render logs
curl https://dashboard.render.com/services/builder-faredown-pricing/logs

# 2. Check recent API calls
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/diagnostics/auth

# 3. Check egress IP
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/egress-ip

# 4. Test raw search
curl -X POST https://builder-faredown-pricing.onrender.com/api/tbo-hotels/search \
  -H "Content-Type: application/json" \
  -d '{"destination":"DXB","checkIn":"2025-11-01","checkOut":"2025-11-03","adults":2}'

# 5. Check frontend logs
# Open browser console (F12) on https://spontaneous-biscotti-da44bc.netlify.app/hotels
```

---

## Production Monitoring

### Key Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Hotel Search Success Rate | > 95% | < 90% |
| Search Response Time | < 3s avg | > 5s avg |
| IP Whitelist Status | ✅ Whitelisted | ⚠️ Connection error |
| Database Connection | ✅ Active | ❌ Cannot connect |
| Fixie Proxy Status | ✅ Active | ❌ No IP detected |

### Logging Configuration

**File:** `api/services/adapters/tboAdapter.js`

All TBO calls are logged with:
- Timestamp
- Endpoint called
- Request (masked password)
- Response status
- Error details (if any)

**Log Level:** INFO (production) / DEBUG (development)

---

### Health Check Endpoint

**Endpoint:** `GET /api/tbo-hotels/health`

**Expected Response (Healthy):**
```json
{
  "success": true,
  "data": {
    "adapter": "TBO",
    "status": "healthy",
    "endpoints": {
      "search": "connected",
      "cities": "connected"
    },
    "checkedAt": "2025-10-25T10:30:00Z"
  }
}
```

**Monitor This Endpoint:** Every 5 minutes (via external monitoring service)

---

### Error Response Examples

#### 401 Unauthorized (IPs Not Whitelisted)
```json
{
  "success": false,
  "error": "Invalid ClientId/UserName/Password",
  "statusCode": 401,
  "details": "TBO returned Status: 2"
}
```

**Action:** Contact TBO support to whitelist IPs

---

#### 400 Bad Request (Invalid Dates)
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "statusCode": 400,
  "details": "CheckIn must be future date"
}
```

**Action:** Validate input dates are in future

---

#### 500 Proxy Error (FIXIE_URL Not Set)
```json
{
  "success": false,
  "error": "Proxy configuration error",
  "statusCode": 500,
  "details": "FIXIE_URL environment variable not set"
}
```

**Action:** Verify FIXIE_URL is set on Render

---

## Rollback Plan

### If TBO Integration Breaks

#### Option 1: Quick Disable (1 minute)

```bash
# On Render Dashboard:
# 1. Set: USE_SUPPLIER_PROXY=false
# 2. Deploy
# 3. System will use mock hotels automatically
```

---

#### Option 2: Revert Code (5 minutes)

```bash
# In git:
git log --oneline | grep -i tbo
git revert <commit-hash>  # Revert TBO changes
git push origin main
```

---

#### Option 3: Switch to Mock Data (2 minutes)

```bash
# On Render, set:
ENABLE_MOCK_DATA=true
MOCK_HOTEL_COUNT=6
# Services will use MOCK_HOTELS instead of TBO
```

---

### Fallback Behavior (Automatic)

If TBO fails:
- ✅ City search: Returns empty (user can type manually)
- ✅ Hotel search: Returns mock hotels (6 pre-configured hotels)
- ✅ Hotel details: Shows mock data with disclaimer
- ✅ User experience: Continues smoothly with fallback

**Important:** This is NOT a long-term solution. Fix TBO issues ASAP.

---

## Checklist: Ready for Production

### Before Launch

- [ ] **IPs Whitelisted:** Confirm 52.5.155.132 and 52.87.82.133 with TBO
- [ ] **Health Check:** Passes `/api/tbo-hotels/health`
- [ ] **City Search:** Works for DXB, PAR, DEL
- [ ] **Hotel Search:** Returns hotels for multiple destinations
- [ ] **Proxy:** Outbound IP is correct
- [ ] **Logs:** No credential or auth errors
- [ ] **Frontend:** Can access `/api/tbo-hotels/*` endpoints
- [ ] **Database:** Cities table is seeded
- [ ] **Monitoring:** Alerts configured for failures
- [ ] **Documentation:** Team trained on TBO integration

### During Launch

- [ ] Monitor `/api/tbo-hotels/health` continuously
- [ ] Watch Render logs for errors
- [ ] Test user search flow end-to-end
- [ ] Verify hotel details page works
- [ ] Check bargain flow still works
- [ ] Test booking confirmation

### After 24 Hours

- [ ] Verify success rate > 95%
- [ ] Check response times are consistent
- [ ] Confirm no IP whitelist issues
- [ ] Review logs for warnings
- [ ] Test edge cases (multi-room, children, etc.)

---

## Support & Escalation

### TBO Support Channels

| Channel | Contact | Response Time |
|---------|---------|---------------|
| Email | support@travelboutiqueonline.com | 24-48 hours |
| Phone | +91-120-4199999 | 1-4 hours (IST) |
| Dashboard | https://b2b.travelboutiqueonline.com | Real-time (self-service) |

### Escalation Path

1. **Tier 1:** Check diagnostics (`/api/tbo/diagnostics`)
2. **Tier 2:** Email TBO support with diagnostics output
3. **Tier 3:** Phone call to TBO technical team
4. **Tier 4:** Failover to mock hotels while investigating

---

## Conclusion

✅ **TBO Hotel API is fully integrated and ready for production.**

**Next Step:** Confirm IPs are whitelisted with TBO, then launch.

**Estimated Time to Production:** 1 day (after IP whitelist confirmation)
