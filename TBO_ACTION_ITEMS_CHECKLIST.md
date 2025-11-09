# TBO Hotel API - Action Items & Deployment Checklist

**Status:** Production Ready (Pending IP Whitelist)  
**Last Updated:** Oct 25, 2025  
**Owner:** Zubin Aibara

---

## 🔴 CRITICAL ACTION ITEMS (Do First)

### 1️⃣ Confirm IP Whitelist with TBO ⏰ TODAY

**Status:** ⏳ **PENDING**  
**Timeline:** Do immediately, 5-24h for TBO response  
**Responsibility:** Zubin Aibara

**Action Steps:**

- [ ] Contact TBO via email: support@travelboutiqueonline.com
- [ ] Include both IPs in subject line: "IP Whitelist Confirmation Required - Faredown"
- [ ] Mention ClientId: **tboprod** and Agency: **BOMF145**
- [ ] Request confirmation of these IPs:
  - 52.5.155.132
  - 52.87.82.133

**Email Template (Ready to Send):**

```
Subject: IP Whitelist Confirmation Required - Faredown Integration

Hi TBO Support,

We're integrating with TBO Hotel API for production booking system.
Our outbound IPs via Fixie proxy are:

- 52.5.155.132
- 52.87.82.133

Please confirm both IPs are whitelisted for:
- ClientId: tboprod
- Agency/UserId: BOMF145
- Service: Hotel API (Search, PreBook, Book)

We have the following endpoints configured:
- Static Data: https://apiwr.tboholidays.com/HotelAPI/
- Search: https://affiliate.travelboutiqueonline.com/HotelAPI/
- Booking: https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/

Thank you,
Faredown Booking Team
```

**Expected Response:** Email confirming IPs are whitelisted

---

## 🟡 SECONDARY ACTION ITEMS (After IP Whitelist)

### 2️⃣ Verify Connection After IP Whitelist

**Status:** ⏳ **PENDING** (starts after TBO confirms IPs)  
**Timeline:** Immediately after TBO confirmation (1 hour)  
**Responsibility:** Engineering Team

**Test 1: Check Outbound IP**

```bash
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/egress-ip
# Expected: {"success": true, "ip": "52.5.155.132"} or 52.87.82.133
```

- [ ] IP matches whitelisted IP

**Test 2: Run Diagnostics**

```bash
curl https://builder-faredown-pricing.onrender.com/api/tbo/diagnostics
# Should show:
# - IPs detected (all 3 methods match)
# - TBO Search endpoint: Connected
# - Response format: Valid
```

- [ ] All diagnostics pass
- [ ] No credential errors

**Test 3: Search Cities**

```bash
curl "https://builder-faredown-pricing.onrender.com/api/tbo-hotels/cities?q=dubai&limit=5"
# Expected: Array of cities with "Dubai" in results
```

- [ ] Cities search returns results
- [ ] Response time < 2 seconds

**Test 4: Search Hotels**

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
# Expected: Array of hotels with pricing
```

- [ ] Hotels search returns results
- [ ] Hotels have pricing data
- [ ] Response time < 5 seconds

---

### 3️⃣ Deploy to Production

**Status:** ⏳ **PENDING** (after verification)  
**Timeline:** Same day as IP whitelist confirmation  
**Responsibility:** DevOps / Engineering

**Deployment Checklist:**

- [ ] All verification tests pass
- [ ] No errors in Render logs
- [ ] Database connection is stable
- [ ] Fixie proxy is active
- [ ] CORS is configured correctly
- [ ] Frontend can reach `/api/tbo-hotels/*` endpoints
- [ ] Frontend can reach `/api/tbo/diagnostics`

**Deployment Steps:**

```bash
# 1. Verify code is deployed (already done)
git log --oneline | head -5  # Should show TBO changes

# 2. Check Render service is running
# Via Render Dashboard: builder-faredown-pricing → Status

# 3. Verify env vars one more time
# Via Render Dashboard: Environment tab
# Check: TBO_HOTEL_CLIENT_ID, TBO_HOTEL_USER_ID, FIXIE_URL

# 4. Run health check
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/health

# 5. Monitor logs for 10 minutes
# Via Render Dashboard: Logs tab
# Look for: No ERROR or 401 messages
```

- [ ] Deployment verified
- [ ] Service is healthy
- [ ] No errors in recent logs

---

### 4️⃣ End-to-End Testing

**Status:** ⏳ **PENDING** (after production deployment)  
**Timeline:** 1-2 hours after deployment  
**Responsibility:** QA Team

**Test Environment:**  
Frontend: https://spontaneous-biscotti-da44bc.netlify.app  
Backend: https://builder-faredown-pricing.onrender.com

**Test Cases:**

#### Test 4a: User Searches Hotels

- [ ] Load home page
- [ ] Click "Hotels"
- [ ] Type "Dubai" in search
- [ ] Cities dropdown shows results
- [ ] Select "Dubai"
- [ ] Hotels results page loads
- [ ] Hotels display with prices
- [ ] No 401 errors in console

#### Test 4b: View Hotel Details

- [ ] Click "View Details" on first hotel
- [ ] Hotel details page loads
- [ ] Room details show pricing
- [ ] Images load correctly
- [ ] Amenities display

#### Test 4c: Complete Booking

- [ ] Click "Book Now"
- [ ] Guest preferences page works
- [ ] Checkout page shows correct price
- [ ] Bargain flow works (if applicable)
- [ ] Booking confirmation displays
- [ ] Voucher generates successfully

#### Test 4d: Multiple Cities

- [ ] Test search: London (LDN)
- [ ] Test search: Paris (PAR)
- [ ] Test search: Delhi (DEL)
- [ ] All cities return hotels
- [ ] Pricing correct for each

#### Test 4e: Error Handling

- [ ] Test with invalid dates (past dates)
- [ ] Test with no results city
- [ ] Test with high guest count
- [ ] Error messages are user-friendly
- [ ] No technical errors shown

**Pass Criteria:**

- [ ] All test cases pass
- [ ] No console errors
- [ ] No API 401/500 errors
- [ ] Response times < 5 seconds

---

## 🟢 ONGOING ACTION ITEMS (Production Monitoring)

### 5️⃣ Set Up Monitoring & Alerts

**Status:** ⏳ **PENDING** (after successful testing)  
**Timeline:** Within 24 hours of production deployment  
**Responsibility:** DevOps / Engineering

**Monitoring Setup:**

**5a: Health Check Endpoint (Every 5 minutes)**

```bash
# Command: (add to monitoring system)
curl -s https://builder-faredown-pricing.onrender.com/api/tbo-hotels/health \
  | grep -q '"success":true' && echo "UP" || echo "DOWN"
```

- [ ] Monitoring tool configured
- [ ] Alert on failure (email/Slack)
- [ ] Alert threshold: 1 failure

**5b: Egress IP Check (Daily)**

```bash
# Verify outbound IP doesn't change
curl -s https://builder-faredown-pricing.onrender.com/api/tbo-hotels/egress-ip
# Should always be: 52.5.155.132 or 52.87.82.133
```

- [ ] Daily check scheduled
- [ ] Alert on unexpected IP change
- [ ] Runbook for IP changes created

**5c: Error Rate Monitoring**

- [ ] Monitor 401 Unauthorized errors
- [ ] Monitor 500 Internal Server errors
- [ ] Alert if error rate > 5% in 1 hour
- [ ] Alert threshold: 10+ errors in hour

**5d: Response Time Monitoring**

- [ ] Monitor average response time
- [ ] Alert if avg time > 5 seconds
- [ ] Alert if 95th percentile > 10 seconds
- [ ] Track per-endpoint: /cities, /search, /hotel

**5e: Database Connection**

- [ ] Monitor DB connection pool
- [ ] Alert on connection failures
- [ ] Alert threshold: 0 available connections

---

### 6️⃣ Logging & Debugging

**Status:** ✅ **READY** (logs already configured)  
**Timeline:** Ongoing  
**Responsibility:** DevOps

**Log Locations:**

- [ ] Render Logs: https://dashboard.render.com/services/builder-faredown-pricing/logs
- [ ] Search for: "TBO", "401", "hotel", "credentials", "proxy"
- [ ] Review daily for errors or warnings

**Log Format (Sample):**

```
[2025-10-25T10:30:00Z] [INFO] [TBO] Hotel search: destination=DXB, guests=2
[2025-10-25T10:30:02Z] [INFO] [TBO] Found 47 hotels, response time 2.1s
```

**Action on Errors:**

- [ ] 401 Unauthorized → Check IP whitelist
- [ ] 500 Internal Server → Check proxy config
- [ ] Timeout → Increase TBO_TIMEOUT_MS
- [ ] Proxy error → Check FIXIE_URL

---

### 7️⃣ Documentation Updates

**Status:** ✅ **DONE** (guides created)  
**Timeline:** Keep updated as issues arise  
**Responsibility:** Engineering

**Documentation Created:**

- ✅ `TBO_CREDENTIALS_VERIFICATION_CONFIRMED.md`
- ✅ `TBO_QUICK_REFERENCE_CARD.md`
- ✅ `TBO_DEPLOYMENT_GUIDE_FINAL.md`
- ✅ `AGENTS.md` (updated with TBO info)

**Documentation Maintenance:**

- [ ] Update on each incident/fix
- [ ] Keep credentials section current
- [ ] Update monitoring section after setup

---

## 📋 COMPLETE CHECKLIST (Summary)

### Before Production

- [ ] Credentials confirmed with TBO email (Oct 25)
- [ ] Code deployed to Render
- [ ] All env vars set correctly
- [ ] Outbound IP detected: 52.5.155.132 or 52.87.82.133
- [ ] Documentation created

### IP Whitelist Phase (⏳ Current)

- [ ] Contact TBO with IP whitelist request
- [ ] Obtain confirmation from TBO
- [ ] Expected timeline: 5-24 hours

### Post IP Whitelist (⏳ Next)

- [ ] Run diagnostics test
- [ ] Test city search
- [ ] Test hotel search
- [ ] Verify no 401 errors
- [ ] Clear to production

### Production Launch

- [ ] Verify production deployment
- [ ] Run end-to-end tests (4 test cases)
- [ ] Monitor for 24 hours
- [ ] Set up production monitoring
- [ ] Configure alerts
- [ ] Brief team on new system

### Production Monitoring (Ongoing)

- [ ] Daily health checks
- [ ] Weekly error rate review
- [ ] Monthly performance review
- [ ] Quarterly credential rotation (if needed)

---

## 📞 Support & Escalation

### If IP Whitelist Not Confirmed After 24 Hours

**Escalation Path:**

1. [ ] Check TBO Dashboard: https://b2b.travelboutiqueonline.com/
2. [ ] Verify credentials are active
3. [ ] Call TBO: +91-120-4199999 (IST)
4. [ ] Email: support@travelboutiqueonline.com with escalation flag
5. [ ] Ask for: IP whitelist status and ETA

**Message Template:**

```
Subject: URGENT - IP Whitelist Status for Faredown Integration

Hi TBO Support,

We requested IP whitelist for:
- 52.5.155.132
- 52.87.82.133
- ClientId: tboprod
- Agency: BOMF145

It's been >24 hours. Can you confirm status and ETA?

This is blocking production deployment.

Thank you,
Engineering Team
```

---

### If Production Errors After Deployment

**Troubleshooting Checklist:**

- [ ] Check IP is still whitelisted
- [ ] Run `/api/tbo/diagnostics` endpoint
- [ ] Check Render logs for errors
- [ ] Verify env vars haven't changed
- [ ] Check if Fixie proxy is active
- [ ] Contact TBO if 401 errors persist

---

## 📊 Timeline

```
Oct 25, 2025 (TODAY)
├─ ✅ Credentials confirmed
├─ ✅ Code deployed
├─ ✅ Documentation created
└─ ⏳ Awaiting IP whitelist request

Oct 25, 2025 (1-24 hours later)
├─ ⏳ TBO processes IP whitelist
└─ 📧 Expecting confirmation email

Oct 26-27, 2025 (After confirmation)
├─ ✅ Run verification tests
├─ ✅ Deploy to production
├─ ✅ Run end-to-end tests
└─ ✅ Set up monitoring

Oct 28, 2025 (Day after launch)
├─ ✅ Monitor for errors
├─ ✅ Review logs
├─ ✅ Brief team
└─ ✅ Production ready!
```

---

## �� Success Criteria (Final)

When ALL of the following are true:

- ✅ IPs are whitelisted with TBO (email confirmation)
- ✅ Diagnostics endpoint returns success
- ✅ Hotel search returns results (no 401 errors)
- ✅ End-to-end booking flow works
- ✅ Monitoring alerts are active
- ✅ Team is trained and ready
- ✅ Documentation is complete and accessible

**Then:** 🎉 **TBO Hotel Integration is Production Ready!**

---

## Questions?

**Documentation:**

- Full Setup: `TBO_CREDENTIALS_VERIFICATION_CONFIRMED.md`
- Quick Reference: `TBO_QUICK_REFERENCE_CARD.md`
- Deployment: `TBO_DEPLOYMENT_GUIDE_FINAL.md`
- Developers: `AGENTS.md`

**Contact:** engineering@faredown.com

---

**Last Updated:** Oct 25, 2025  
**Status:** ✅ Complete (Awaiting IP Whitelist Confirmation)
