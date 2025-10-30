# P0 Postgres Integration - Deployment Checklist

**Status:** Ready for Production  
**Target:** Production Deployment  
**Timeline:** Immediate (P0 priority)

---

## ✅ Pre-Deployment (Code Review)

- [ ] **Migration File Created**: `api/database/migrations/20250405_p0_postgres_integration_complete.sql`
  - [ ] 7 new tables
  - [ ] 3 views
  - [ ] Triggers and functions
  - [ ] Permissions granted

- [ ] **V1 API Routes Created**: `api/routes/v1-bookings.js`
  - [ ] POST /hotels (create booking)
  - [ ] GET /hotels/:ref (get booking)
  - [ ] PUT /hotels/:ref/status (update)
  - [ ] POST /hotels/:ref/documents (create doc)
  - [ ] POST /hotels/:ref/special-requests (add request)
  - [ ] GET /customers/:email (customer bookings)
  - [ ] GET /health (health check)

- [ ] **Admin API Routes Created**: `api/routes/v1-admin-bookings.js`
  - [ ] GET / (list all bookings)
  - [ ] GET /:id (full details)
  - [ ] PUT /:id (update)
  - [ ] GET /stats/dashboard (statistics)

- [ ] **Utilities & Services**
  - [ ] `api/utils/bookingUtils.js` ✅
  - [ ] `api/services/auditService.js` ✅
  - [ ] `api/services/emailService.js` ✅

- [ ] **Server Integration**
  - [ ] Routes registered in `api/server.js`
  - [ ] Middleware properly chained (auth, audit)

- [ ] **Documentation**
  - [ ] Deployment guide ✅
  - [ ] API spec ✅
  - [ ] Postman collection ✅
  - [ ] Frontend integration guide ✅

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub
```bash
git add -A
git commit -m "P0: Complete Postgres Integration - Frontend + Admin wiring"
git push origin main
```
- [ ] Code pushed successfully
- [ ] All tests pass (if CI/CD configured)
- [ ] No merge conflicts

### Step 2: Run Migration on Production Database
```bash
# Via Render dashboard or direct connection
node api/database/run-p0-migration.js
```

**Expected Output:**
```
🔄 Connecting to Postgres...
✅ Connected to Postgres
📝 Running P0 Migration...
✅ customers
✅ pan_identifiers
✅ special_requests
✅ booking_documents
✅ bargain_rounds
✅ loyalty_events
✅ audit_logs
✅ booking_summary_v2
✅ customer_loyalty_summary
🎉 P0 Postgres Integration Complete!
```

- [ ] Migration ran without errors
- [ ] All tables created
- [ ] All views created
- [ ] Output shows success message

### Step 3: Verify in PgAdmin

**Check Tables:**
```bash
# In PgAdmin SQL editor
\dt  -- List all tables
```

Expected tables:
- [ ] customers
- [ ] pan_identifiers
- [ ] special_requests
- [ ] booking_documents
- [ ] bargain_rounds
- [ ] loyalty_events
- [ ] audit_logs

**Check Views:**
```bash
\dv  -- List all views
```

Expected views:
- [ ] booking_summary_v2
- [ ] customer_loyalty_summary

**Check Columns:**
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'customers' ORDER BY ordinal_position;
```

- [ ] All expected columns present
- [ ] Data types correct
- [ ] Constraints properly applied

### Step 4: Test API Endpoints

```bash
# Test 1: Health Check
curl https://builder-faredown-pricing.onrender.com/api/v1/bookings/health

# Expected: {"success": true, "status": "healthy", "database": "connected"}
- [ ] Health check passes

# Test 2: Create Booking
curl -X POST https://builder-faredown-pricing.onrender.com/api/v1/bookings/hotels \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"email": "test@faredown.com", "firstName": "Test", "lastName": "User", "phone": "+91-9999999999"},
    "pan_number": "ABCDE1234F",
    "hotel": {"code": "HOT1", "name": "Test Hotel", "checkIn": "2025-04-15", "checkOut": "2025-04-20", "nights": 5, "rooms": 1, "adults": 2},
    "pricing": {"basePrice": 5000, "taxes": 500, "fees": 100, "total": 5600, "currency": "INR"},
    "specialRequests": "Test request"
  }'

# Expected: {"success": true, "data": {"bookingId": "UUID", "bookingRef": "FD...", ...}}
- [ ] Booking created successfully
- [ ] bookingRef generated
- [ ] Response includes all expected fields

# Test 3: Verify in PgAdmin
SELECT * FROM customers WHERE email = 'test@faredown.com';
SELECT * FROM pan_identifiers WHERE customer_id = (SELECT id FROM customers WHERE email = 'test@faredown.com');
SELECT * FROM hotel_bookings WHERE customer_id = (SELECT id FROM customers WHERE email = 'test@faredown.com');
SELECT * FROM audit_logs WHERE entity_type = 'hotel_booking' ORDER BY created_at DESC LIMIT 1;

- [ ] Customer record created
- [ ] PAN hashed (not plain text visible)
- [ ] Booking record created
- [ ] Audit log entry exists

# Test 4: Get Booking Details
curl https://builder-faredown-pricing.onrender.com/api/v1/bookings/hotels/FD202504051A2B3C

# Expected: {"success": true, "data": {...full booking details...}}
- [ ] Booking retrieval works
- [ ] All fields populated
- [ ] Related documents/requests returned

# Test 5: Admin Endpoints (requires auth token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://builder-faredown-pricing.onrender.com/api/v1/admin/bookings

- [ ] Admin list endpoint works
- [ ] Returns bookings list
- [ ] Pagination working

# Test 6: Dashboard Stats
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://builder-faredown-pricing.onrender.com/api/v1/admin/bookings/stats/dashboard

- [ ] Stats endpoint works
- [ ] Returns accurate numbers
```

### Step 5: Verify Audit Logging

```sql
-- Check recent audit logs
SELECT entity_type, action, user_email, status, created_at 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Should show entries for:
-- - hotel_booking creation (action: 'create')
-- - Any updates
-- - All with correct timestamps
```

- [ ] Audit logs being written
- [ ] All fields populated
- [ ] Timestamps correct

### Step 6: Test Data Integrity

```sql
-- Verify foreign keys working
SELECT COUNT(*) FROM hotel_bookings WHERE customer_id IS NULL;  -- Should be 0 or very few

-- Verify PAN is hashed
SELECT COUNT(*) FROM pan_identifiers WHERE pan_hash IS NOT NULL;  -- Should match PAN count

-- Verify masking
SELECT pan_last4, LENGTH(pan_hash) as hash_length 
FROM pan_identifiers LIMIT 5;
-- Should show: pan_last4 = 4 chars, pan_hash = 64 chars (SHA256)

-- Verify indexes
\di  -- List all indexes
```

- [ ] Foreign key relationships intact
- [ ] PAN hashing working
- [ ] Indexes created
- [ ] Data consistency verified

---

## 🔒 Security Verification

- [ ] **PAN Storage**
  - [ ] Plain PAN not stored anywhere
  - [ ] SHA256 hash used
  - [ ] pan_last4 field populated
  - [ ] Test query: `SELECT * FROM pan_identifiers WHERE pan_number IS NOT NULL;` returns 0 rows

- [ ] **Audit Logging**
  - [ ] All mutations logged
  - [ ] Old/new values captured
  - [ ] User info logged
  - [ ] Request ID tracked

- [ ] **Role-Based Access**
  - [ ] Admin endpoints require auth
  - [ ] Customer APIs open
  - [ ] Middleware chain correct

---

## 📊 Performance Verification

```sql
-- Check indexes are created
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'pan_identifiers', 'hotel_bookings', 'audit_logs')
ORDER BY tablename, indexname;

-- Should show indexes on:
-- - customers: email, loyalty_tier, kyc_verified
-- - pan_identifiers: customer_id, is_primary, is_verified, pan_hash
-- - hotel_bookings: customer_id, bargain_status
-- - audit_logs: entity, action, user_id, created_at, request_id
```

- [ ] All indexes created
- [ ] Query performance acceptable (< 100ms for common queries)
- [ ] No N+1 queries

---

## 🧪 Frontend Integration Testing

- [ ] **HotelBooking.tsx Updated**
  - [ ] Calls POST /api/v1/bookings/hotels
  - [ ] Captures response (bookingRef, bookingId)
  - [ ] Navigates to payment with booking data
  - [ ] Shows confirmation message

- [ ] **MyBookings/Account.tsx Updated**
  - [ ] Calls GET /api/v1/bookings/customers/:email
  - [ ] Displays list of bookings
  - [ ] Shows booking details (ref, hotel, dates, status)
  - [ ] Links to voucher/invoice if available

- [ ] **Special Requests Field**
  - [ ] Visible on HotelBooking form
  - [ ] Sent to API
  - [ ] Visible in Admin → Booking Details

- [ ] **Admin Panel - Bookings**
  - [ ] Lists all bookings from API
  - [ ] Filters work (status, date, email)
  - [ ] Pagination works
  - [ ] Click booking → full details
  - [ ] PAN displayed masked (****1234)
  - [ ] Special requests visible
  - [ ] Documents listed
  - [ ] Audit trail visible

---

## 🐛 Error Handling Verification

```bash
# Test 1: Invalid PAN
curl -X POST https://builder-faredown-pricing.onrender.com/api/v1/bookings/hotels \
  -d '{"customer": {...}, "pan_number": "INVALID@#$%", ...}'

- [ ] Returns 400 with helpful error message

# Test 2: Missing fields
curl -X POST https://builder-faredown-pricing.onrender.com/api/v1/bookings/hotels \
  -d '{"customer": {}}'

- [ ] Returns 400 with clear error

# Test 3: Booking not found
curl https://builder-faredown-pricing.onrender.com/api/v1/bookings/hotels/NONEXISTENT

- [ ] Returns 404 with "Booking not found"

# Test 4: Database error (simulate)
-- Temporarily disable a table, then test
- [ ] Returns 500 with generic error message
- [ ] Detailed error logged in audit_logs with status='error'
```

- [ ] Error handling comprehensive
- [ ] User sees helpful messages
- [ ] Errors logged for debugging

---

## 📋 Admin Testing Checklist

```bash
# Assuming admin token: $ADMIN_TOKEN

# 1. List Bookings
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://builder-faredown-pricing.onrender.com/api/v1/admin/bookings

- [ ] Returns list of bookings
- [ ] Includes pagination info

# 2. Filter Bookings
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://builder-faredown-pricing.onrender.com/api/v1/admin/bookings?status=pending&customer_email=test"

- [ ] Filters working
- [ ] Returns relevant bookings

# 3. Get Booking Details
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://builder-faredown-pricing.onrender.com/api/v1/admin/bookings/BOOKING_ID

- [ ] Full details returned
- [ ] Customer info populated
- [ ] PAN masked
- [ ] Documents listed
- [ ] Special requests listed
- [ ] Bargain history shown
- [ ] Audit log shown
- [ ] Loyalty events shown

# 4. Update Booking Status
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  -X PUT https://builder-faredown-pricing.onrender.com/api/v1/admin/bookings/BOOKING_ID \
  -d '{"status": "confirmed"}'

- [ ] Status updates
- [ ] Audit log entry created
- [ ] Returns success

# 5. Dashboard Stats
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://builder-faredown-pricing.onrender.com/api/v1/admin/bookings/stats/dashboard

- [ ] Returns statistics
- [ ] Numbers are accurate
- [ ] All metrics present
```

---

## 📈 Load Testing (Optional)

```bash
# Use Apache Bench to simulate load
ab -n 100 -c 10 https://builder-faredown-pricing.onrender.com/api/v1/bookings/health

# Expected: < 100ms avg response time
- [ ] Response times acceptable
- [ ] No errors under load
- [ ] Database connection pool healthy
```

---

## 🎯 Go/No-Go Decision

### Go Criteria (All must be ✅)
- [ ] All code merged to main
- [ ] Migration runs successfully
- [ ] All 7 tables created in Postgres
- [ ] All 3 views created
- [ ] API endpoints return correct responses
- [ ] PAN hashing working correctly
- [ ] Audit logging functional
- [ ] Admin endpoints protected with auth
- [ ] Frontend integration complete
- [ ] No data integrity issues
- [ ] Error handling comprehensive
- [ ] Security verified

### No-Go Scenarios
- ❌ Migration fails or incomplete
- ❌ API returns errors
- ❌ PAN stored in plain text
- ❌ Audit logs empty
- ❌ Data integrity issues
- ❌ Security vulnerabilities found

---

## 📞 Rollback Plan

If **No-Go** criteria not met:

```bash
# 1. Identify issue
SELECT * FROM audit_logs WHERE status = 'error' ORDER BY created_at DESC;

# 2. If schema issue:
-- Drop views
DROP VIEW booking_summary_v2;
DROP VIEW customer_loyalty_summary;

-- Disable triggers (optional)
ALTER TABLE hotel_bookings DISABLE TRIGGER trigger_audit_booking_changes;

# 3. If data issue:
-- Restore from backup
pg_restore -d faredown_booking_db backup.dump

# 4. Revert code
git revert HEAD  # Or checkout previous version

# 5. Investigate and re-deploy
```

- [ ] Have database backup before deployment
- [ ] Have rollback plan in place
- [ ] Can restore from backup if needed

---

## ✅ Post-Deployment

After successful deployment:

- [ ] Monitor audit logs for 24 hours
- [ ] Check error rates in API logs
- [ ] Verify daily backup running
- [ ] Announce to team
- [ ] Update documentation
- [ ] Schedule follow-up meeting

---

## 📞 Support Contacts

- **Database Issues**: Database team
- **API Issues**: Backend team
- **Frontend Integration**: Frontend team
- **Security Issues**: Security team

---

**Checklist Complete?** When ALL items checked, you're ready for production deployment! 🚀

**Date Deployed:** _______________  
**Deployed By:** _______________  
**Status:** 🟢 LIVE / 🟡 STAGING / 🔴 ROLLED BACK

