# Email to Builder: Database Audit Findings

---

**Subject:** Faredown Database Verification — Missing / Empty Tables Summary (Render DB Audit 5 Oct 2025)

---

**To:** Builder.io Development Team  
**CC:** Sheema, Moen  
**From:** Zubin Aibara, Pikateck Technologies LLP  
**Date:** 5 October 2025

---

## Body

Hi Team,

We completed an independent verification of the **Render-hosted Postgres database (`faredown_booking_db`)** through pgAdmin and PowerShell.

Below is a detailed summary of the current data status and what requires correction or population from the Builder side.

---

### ✅ **Verification Summary**

**Database:** `faredown_booking_db`  
**Host:** `dpg-d2086mndiees739731t0-a.singapore-postgres.render.com`  
**Schema:** `public`  
**Audit Date:** 5 Oct 2025 (IST)  
**Verified via:** pgAdmin 4 + PowerShell psql  

| Table Name                  | Row Count | Status               | Remarks                                                      |
| --------------------------- | --------- | -------------------- | ------------------------------------------------------------ |
| `markup_rules`              | 14        | ✅ OK                 | Data present for Air, Hotel, and Sightseeing                 |
| `promo_codes`               | 11        | ✅ OK                 | All active promo codes verified                              |
| `users`                     | 0         | ⚠️ **EMPTY**          | **No user records found — registration flow not writing to DB**  |
| `hotel_bookings`            | 0         | ⚠️ **EMPTY**          | **Booking data missing — API not saving confirmed transactions** |
| `payments`                  | 0         | ⚠️ **EMPTY**          | **No payment logs or reference IDs stored after booking**        |
| `vouchers`                  | 0         | ⚠️ **EMPTY**          | No voucher/invoice records generated                         |
| `bargain_sessions`          | 0         | ⚠️ **EMPTY**          | AI bargaining not writing session data                       |
| `loyalty_members`           | 0         | ⚠️ **EMPTY**          | Loyalty program not enrolling users                          |
| *(other supporting tables)* | 46 total  | ✅ Structure verified | Foreign keys and schema structure confirmed                  |

---

### 🚨 **Critical Issues Identified**

#### 1. **User Registration / Login Flow**
**Problem:** Zero records in `users` table despite signup/login functionality on frontend

**Root Cause Analysis:**
- Builder front-end "Sign Up" and "Login" forms may not be pointing to the **live Render API**
- Possible mismatch in `VITE_API_BASE_URL` or `API_BASE_URL` environment variable
- OAuth flows (Google login) not persisting user data to database

**Required Fix:**
- ✅ Verify Builder frontend environment variables point to: `https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api`
- ✅ User info must insert into `users` table with: `id (UUID)`, `email`, `google_id` (if OAuth), `created_at`
- ✅ Test both email registration AND Google OAuth flows
- ✅ Confirm auth service (Supabase/internal) is writing to Render Postgres, not a local/staging DB

---

#### 2. **Booking Flow**
**Problem:** Zero records in `hotel_bookings` table despite booking functionality

**Root Cause Analysis:**
- Booking confirmation API not writing to database
- Payment gateway integration may be calling wrong endpoints
- Pre-booking vs confirmed booking state machine not saving final state

**Required Fix:**
- ✅ After confirmed booking (Flights/Hotels/Packages), insert record into `hotel_bookings` table
- ✅ Required fields:
  ```sql
  booking_ref (UNIQUE TEXT)
  user_id (FK → users.id)
  supplier_id (FK → suppliers.id)
  check_in, check_out (for hotels)
  total_amount, currency
  status (pending → confirmed)
  gateway, gateway_payment_id, gateway_order_id
  created_at, updated_at
  ```
- ✅ Verify booking confirmation API endpoint: `POST /api/bookings/hotels/confirm`
- ✅ Check that `api/services/hotelBookingService.js` is using correct DATABASE_URL

---

#### 3. **Payment Gateway Integration**
**Problem:** Zero records in `payments` table despite Razorpay integration

**Root Cause Analysis:**
- Payment callback/verification not writing transaction logs
- Razorpay webhook may not be configured or not hitting correct endpoint
- Payment verification happening client-side only without server-side persistence

**Required Fix:**
- ✅ Payment confirmation from Razorpay must insert into `payments` table
- ✅ Required fields:
  ```sql
  id (SERIAL PK)
  booking_id (FK → hotel_bookings.id)
  gateway (razorpay)
  gateway_payment_id (from Razorpay response)
  gateway_order_id (from Razorpay response)
  amount, currency
  method (card, upi, netbanking)
  status (pending → success → failed)
  gateway_response (JSONB - full Razorpay response)
  created_at
  ```
- ✅ Verify payment endpoints:
  - `POST /api/payments/create-order` (creates Razorpay order)
  - `POST /api/payments/verify` (verifies payment signature)
- ✅ **CRITICAL**: Implement missing webhook endpoint: `POST /api/payments/webhook`
- ✅ Configure Razorpay webhook URL in dashboard

---

#### 4. **API-Database Connectivity**
**Problem:** API may be writing to wrong database or not writing at all

**Required Verification:**
- ✅ Validate that `DATABASE_URL` environment variable in Render matches:
  ```
  postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db
  ```
- ✅ Ensure all write operations (user signup, booking save, payment confirmation) hit **Render Postgres**, not:
  - Local development database
  - Staging database
  - In-memory mock data
- ✅ Check API logs for database connection errors or constraint violations
- ✅ Verify database connection pool initialization in `api/database/connection.js`

---

#### 5. **Admin Panel Data Binding**
**Problem:** Admin dashboard shows counts but database is empty

**Root Cause Analysis:**
- Admin panel may be reading from mock data or different database
- Frontend displaying hardcoded/cached values instead of live database queries

**Required Fix:**
- ✅ Admin dashboard counts (Users, Bookings, Payments) must query live Render DB
- ✅ Verify admin API endpoints:
  - `GET /api/admin/dashboard` → Should query actual database counts
  - `GET /api/admin/users` → Should return users from `users` table
  - `GET /api/admin/bookings` → Should return bookings from `hotel_bookings` table
- ✅ Disable any mock data flags:
  - `ENABLE_MOCK_DATA=false`
  - `VITE_ENABLE_OFFLINE_FALLBACK=false`

---

### 📁 **Audit Artifacts & Evidence**

All verification outputs and exports are saved in the GitHub repository:

**Location:** `/audits/2025-10-05/`

**Files:**
- ✅ `markup_rules_export.csv` (14 rows verified)
- ✅ `promo_codes_export.csv` (11 rows verified)
- ✅ `01_tables.txt` (46 tables structure confirmed)
- ✅ `02_schema_users_promo_markup.txt` (schema structure)
- ✅ `03_foreign_keys.txt` (FK relationships verified)
- ✅ `04_samples_users.txt` (EMPTY - needs data)
- ✅ `05_counts.txt` (row counts per table)
- ✅ `06_missing_or_empty_tables.txt` (critical empty tables list)

**GitHub Repository:** https://github.com/Pikateck/builder-faredown

**Reference Documents:**
- `TECHNICAL_BASELINE_AUDIT_REPORT.md` (complete system baseline)
- `QUICK_VERIFICATION_COMMANDS.md` (verification SQL queries)

---

### 🔍 **Post-Fix Verification Query (for Builder)**

After fixing the API-database connectivity, run this SQL in **pgAdmin → Query Tool** to verify data is flowing:

```sql
-- Quick verification after API/DB fix
SELECT 
  'users' AS table_name, 
  COUNT(*) AS row_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ STILL EMPTY'
    ELSE '✅ HAS DATA'
  END AS status
FROM users

UNION ALL

SELECT 
  'hotel_bookings', 
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ STILL EMPTY'
    ELSE '✅ HAS DATA'
  END
FROM hotel_bookings

UNION ALL

SELECT 
  'payments', 
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ STILL EMPTY'
    ELSE '✅ HAS DATA'
  END
FROM payments

UNION ALL

SELECT 
  'vouchers', 
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ STILL EMPTY'
    ELSE '✅ HAS DATA'
  END
FROM vouchers

UNION ALL

SELECT 
  'promo_codes', 
  COUNT(*),
  '✅ ALREADY OK (baseline)'
FROM promo_codes

UNION ALL

SELECT 
  'markup_rules', 
  COUNT(*),
  '✅ ALREADY OK (baseline)'
FROM markup_rules;
```

**Expected Output After Fix:**

| Table Name      | Row Count | Status                          |
| --------------- | --------- | ------------------------------- |
| users           | > 0       | ✅ HAS DATA (registered users)   |
| hotel_bookings  | > 0       | ✅ HAS DATA (successful bookings)|
| payments        | > 0       | ✅ HAS DATA (completed payments) |
| vouchers        | > 0       | ✅ HAS DATA (generated invoices) |
| promo_codes     | 11        | ✅ ALREADY OK (baseline)         |
| markup_rules    | 14        | ✅ ALREADY OK (baseline)         |

---

### ✅ **Required Actions from Builder**

Please complete the following in order:

#### Phase 1: Environment Verification (1 hour)
- [ ] Verify `VITE_API_BASE_URL` in Builder frontend points to Render API
- [ ] Verify `DATABASE_URL` in Render backend points to correct Postgres instance
- [ ] Disable all mock data flags (`ENABLE_MOCK_DATA=false`)
- [ ] Restart Render services after env var changes

#### Phase 2: API Connectivity Testing (2 hours)
- [ ] Test user signup flow end-to-end → verify record appears in `users` table
- [ ] Test Google OAuth login → verify user record with `google_id` in `users` table
- [ ] Test hotel booking flow → verify records in both `hotel_bookings` and `payments` tables
- [ ] Test payment verification → verify Razorpay response saved to `payments.gateway_response`

#### Phase 3: Webhook Configuration (1 hour)
- [ ] Implement missing webhook endpoint: `POST /api/payments/webhook`
- [ ] Configure Razorpay webhook URL in dashboard: `https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/payments/webhook`
- [ ] Test webhook by triggering test payment from Razorpay dashboard

#### Phase 4: Verification & Sign-off (30 min)
- [ ] Run post-fix verification SQL query (provided above)
- [ ] Screenshot results showing data in all tables
- [ ] Share verification output with us for sign-off

---

### 📅 **Deadline**

**All fixes must be completed and verified by: Wednesday, 8 October 2025, EOD (IST)**

If critical blockers are encountered, please notify us immediately with:
- Specific error messages
- API endpoint logs
- Database connection logs
- Steps already attempted

---

### 📞 **Next Steps**

1. **Acknowledge receipt** of this email within 24 hours
2. **Begin Phase 1** (environment verification) immediately
3. **Provide daily progress updates** via email or Slack
4. **Schedule verification call** once all phases complete

We are available for clarification or technical support throughout this process.

---

Best regards,

**Zubin Aibara**  
Founder & Technical Lead  
Pikateck Technologies LLP  
Faredown Platform

---

## Additional Resources

### Quick Database Connection (for Builder team)
```bash
# Via psql
psql "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db"

# List tables
\dt

# Check specific table
SELECT * FROM users LIMIT 5;
```

### API Health Checks
```bash
# Test API is responding
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/health-check

# Test OAuth status
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/oauth/status

# Test database connection
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/db-test
```

### Expected API Flow (for reference)
```
User Signup:
POST /api/auth/register
  → Creates user in database
  → Returns JWT token
  → Frontend stores token
  → User record appears in users table

Google OAuth:
GET /api/oauth/google/url
  → Returns Google auth URL
  → User authenticates
  → Callback: GET /api/oauth/google/callback
  → Creates/updates user with google_id
  → User record appears in users table

Hotel Booking:
POST /api/bookings/hotels/pre-book
  → Creates temporary booking
POST /api/payments/create-order
  → Creates Razorpay order
POST /api/payments/verify
  → Verifies payment signature
POST /api/bookings/hotels/confirm
  → Saves booking to hotel_bookings table
  → Saves payment to payments table
  → Generates voucher in vouchers table
```

---

**End of Email**
