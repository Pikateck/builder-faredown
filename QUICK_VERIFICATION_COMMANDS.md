# Quick Verification Commands
## Run These to Independently Verify Your System

**Purpose**: Copy-paste these commands to verify your technical baseline without waiting for Builder.

---

## 1. DATABASE VERIFICATION

### Connect to Database
```bash
# Using psql
psql "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db"

# Or using environment variable
psql $DATABASE_URL
```

### List All Tables
```sql
\dt

-- Or SQL query:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Expected Tables (45+)
```
users, markup_rules, promo_codes, tax_policies, price_checkpoints,
hotel_bookings, payments, vouchers, suppliers, bargain_sessions,
bargain_events, bargain_holds, regions, countries, cities,
destination_aliases, loyalty_members, loyalty_ledger, recent_searches,
faredown.travelers, faredown.passports, faredown.payment_methods, etc.
```

### Check Table Counts
```sql
SELECT 
  'users' AS table, COUNT(*) AS count FROM users
UNION ALL 
  SELECT 'markup_rules', COUNT(*) FROM markup_rules
UNION ALL 
  SELECT 'promo_codes', COUNT(*) FROM promo_codes
UNION ALL 
  SELECT 'hotel_bookings', COUNT(*) FROM hotel_bookings
UNION ALL 
  SELECT 'payments', COUNT(*) FROM payments
UNION ALL 
  SELECT 'vouchers', COUNT(*) FROM vouchers
UNION ALL 
  SELECT 'bargain_sessions', COUNT(*) FROM bargain_sessions
UNION ALL
  SELECT 'countries', COUNT(*) FROM countries
UNION ALL
  SELECT 'cities', COUNT(*) FROM cities;
```

### Sample Admin-Created Data
```sql
-- Check markup rules
SELECT 
  id, module, rule_name, m_type, m_value, 
  priority, is_active, created_at 
FROM markup_rules 
WHERE created_at > '2025-01-01'
LIMIT 5;

-- Check promo codes
SELECT 
  id, code, type, value, module, 
  usage_count, valid_from, valid_to 
FROM promo_codes 
WHERE is_active = true
LIMIT 5;

-- Check user signups
SELECT 
  id, email, 
  CASE WHEN google_id IS NOT NULL THEN 'Google' ELSE 'Email' END as signup_method,
  created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check bookings with payments
SELECT 
  hb.id, hb.booking_ref, hb.gateway, 
  hb.total_amount, hb.status as booking_status,
  p.gateway_payment_id, p.status as payment_status,
  hb.created_at
FROM hotel_bookings hb
LEFT JOIN payments p ON p.booking_id = hb.id
ORDER BY hb.created_at DESC
LIMIT 5;
```

### Verify Foreign Keys
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

---

## 2. API ENDPOINT TESTING

### Test Core Endpoints

#### Health Check
```bash
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/health-check
```

#### OAuth Status
```bash
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/oauth/status
```

#### Google OAuth URL
```bash
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/oauth/google/url
```

#### Search Destinations
```bash
curl "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/destinations/search?q=dubai"
```

#### List Countries
```bash
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/countries
```

#### List Packages
```bash
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/packages
```

#### Hotel Search
```bash
curl -X POST https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/hotels-live/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Dubai",
    "checkIn": "2025-11-01",
    "checkOut": "2025-11-05",
    "rooms": 1,
    "adults": 2
  }'
```

### Test Protected Endpoints (Need Token)

#### Admin Login (Get Token)
```bash
curl -X POST https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-admin-password"
  }'
```

#### Use Token to Access Admin Endpoints
```bash
# Replace YOUR_TOKEN with actual token from login
TOKEN="YOUR_TOKEN"

# Get admin dashboard
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"

# List markup rules
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/admin/markup/packages \
  -H "Authorization: Bearer $TOKEN"

# List promo codes
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/admin/promo \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. ENVIRONMENT VARIABLES CHECK

### On Render
```bash
# Via Render CLI (if installed)
render env list

# Or manually check in Render dashboard:
# https://dashboard.render.com/web/[your-service-id]/env-vars
```

### Critical Env Vars Checklist
```bash
# Database
✅ DATABASE_URL
✅ DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

# External APIs
✅ HOTELBEDS_API_KEY
✅ HOTELBEDS_API_SECRET
✅ AMADEUS_API_KEY
✅ AMADEUS_API_SECRET

# OAuth
✅ GOOGLE_CLIENT_ID
✅ GOOGLE_CLIENT_SECRET
✅ GOOGLE_REDIRECT_URI

# Payment
✅ RAZORPAY_KEY_ID
✅ RAZORPAY_KEY_SECRET

# Email
✅ SENDGRID_API_KEY
✅ EMAIL_FROM

# Security
✅ JWT_SECRET
✅ SESSION_JWT_SECRET
```

---

## 4. INTEGRATION VERIFICATION

### Razorpay Test
```bash
# Check Razorpay service
node api/test-razorpay.js
```

### Hotelbeds Test
```bash
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/test-hotelbeds
```

### Amadeus Test
```bash
curl https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/test-amadeus-auth
```

### Check Razorpay Mode
```sql
-- Check if any real payments exist
SELECT 
  gateway, 
  gateway_payment_id, 
  amount, 
  currency,
  method,
  status,
  created_at
FROM payments
WHERE gateway = 'razorpay'
  AND status = 'success'
ORDER BY created_at DESC
LIMIT 5;

-- Check test vs live (look at gateway_payment_id pattern)
-- Test IDs: pay_test_xxxxx
-- Live IDs: pay_xxxxx
```

---

## 5. FILE STORAGE CHECK

### Verify Voucher Storage
```bash
# SSH into Render instance (if possible) or check locally
ls -lh vouchers/sightseeing/

# Or check database for PDF paths
```

```sql
SELECT 
  id,
  booking_id,
  pdf_path,
  pdf_size_bytes,
  email_sent,
  email_delivery_status,
  created_at
FROM vouchers
WHERE pdf_path IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Check if PDFs are Local or S3
```sql
-- If pdf_path starts with 'vouchers/' = local
-- If pdf_path starts with 'https://s3' or 'https://' = cloud storage
SELECT 
  CASE 
    WHEN pdf_path LIKE 'vouchers/%' THEN 'Local Filesystem'
    WHEN pdf_path LIKE 'https://%' THEN 'Cloud Storage (S3/CDN)'
    ELSE 'Unknown'
  END as storage_type,
  COUNT(*) as count
FROM vouchers
WHERE pdf_path IS NOT NULL
GROUP BY storage_type;
```

---

## 6. BACKUP VERIFICATION

### Check Render Backups
1. Go to Render Dashboard
2. Navigate to your database
3. Click "Backups" tab
4. Verify:
   - Backup frequency (daily/weekly?)
   - Last successful backup timestamp
   - Retention period

### Test Backup Restore (Safe Test)
```bash
# Download latest backup
# Restore to a TEST database (NOT production)
pg_restore -d test_db backup_file.dump

# Verify table count matches production
psql test_db -c "\dt" | wc -l
```

---

## 7. MONITORING & LOGS

### Check Sentry (if configured)
1. Visit: https://sentry.io
2. Check if project exists
3. Verify recent errors are being captured

### API Logs via Render
```bash
# Via Render dashboard:
# https://dashboard.render.com/web/[service-id]/logs

# Look for:
- 🔵 OAuth flows
- 🟢 Payment success/failures  
- 🔴 Errors and stack traces
- 📊 Database queries
```

### Check Recent API Errors
```sql
-- If you have error logging table
SELECT * FROM error_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Or check application logs table if it exists
SELECT * FROM application_logs
WHERE level = 'error'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 8. CRITICAL DATA VALIDATION

### Verify Admin Panel Data

#### Markup Rules Created via Admin
```sql
SELECT 
  id,
  module,
  rule_name,
  CASE m_type
    WHEN 'percentage' THEN m_value || '%'
    WHEN 'fixed' THEN '$' || m_value
    ELSE m_type
  END as markup,
  priority,
  is_active,
  created_at,
  updated_at
FROM markup_rules
ORDER BY created_at DESC
LIMIT 10;
```

#### Active Promo Codes
```sql
SELECT 
  code,
  type,
  value,
  module,
  usage_count || '/' || usage_limit as usage,
  valid_from,
  valid_to,
  CASE 
    WHEN valid_to < NOW() THEN 'Expired'
    WHEN usage_count >= usage_limit THEN 'Limit Reached'
    ELSE 'Active'
  END as status
FROM promo_codes
WHERE is_active = true
ORDER BY created_at DESC;
```

#### Google Login Users
```sql
SELECT 
  id,
  email,
  first_name || ' ' || last_name as name,
  google_id,
  'Google OAuth' as auth_method,
  created_at
FROM users
WHERE google_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

#### Recent Bookings with Payment Info
```sql
SELECT 
  b.booking_ref,
  b.total_amount,
  b.currency,
  b.status as booking_status,
  p.gateway,
  p.gateway_payment_id,
  p.status as payment_status,
  p.method as payment_method,
  b.created_at
FROM hotel_bookings b
LEFT JOIN payments p ON p.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '30 days'
ORDER BY b.created_at DESC
LIMIT 10;
```

---

## 9. QUICK AUDIT REPORT GENERATION

### Run Complete Audit
```sql
-- Save this as audit_report.sql and run it

\echo '=== DATABASE AUDIT REPORT ==='
\echo ''

\echo '1. TABLE COUNT:'
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

\echo ''
\echo '2. DATA VOLUMES:'
SELECT 'users' as table, COUNT(*) FROM users
UNION ALL SELECT 'markup_rules', COUNT(*) FROM markup_rules
UNION ALL SELECT 'promo_codes', COUNT(*) FROM promo_codes
UNION ALL SELECT 'bookings', COUNT(*) FROM hotel_bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'vouchers', COUNT(*) FROM vouchers
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'countries', COUNT(*) FROM countries
UNION ALL SELECT 'cities', COUNT(*) FROM cities;

\echo ''
\echo '3. RECENT ACTIVITY (Last 7 Days):'
SELECT 
  'New Users' as metric,
  COUNT(*) as count
FROM users 
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'New Bookings',
  COUNT(*)
FROM hotel_bookings
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'Successful Payments',
  COUNT(*)
FROM payments
WHERE status = 'success'
  AND created_at > NOW() - INTERVAL '7 days';

\echo ''
\echo '4. ACTIVE CONFIGURATIONS:'
SELECT 
  'Active Markup Rules' as config,
  COUNT(*) as count
FROM markup_rules
WHERE is_active = true
UNION ALL
SELECT
  'Active Promo Codes',
  COUNT(*)
FROM promo_codes
WHERE is_active = true
  AND valid_to > NOW();

\echo ''
\echo '=== END OF REPORT ==='
```

### Run the Audit
```bash
psql "$DATABASE_URL" -f audit_report.sql > system_audit_$(date +%Y%m%d).txt
```

---

## 10. NETLIFY VERIFICATION (If Deploying)

### Check Netlify Build
```bash
# Check build status
netlify status

# Check environment variables
netlify env:list

# Test Netlify functions
curl https://spontaneous-biscotti-da44bc.netlify.app/api/health-check
```

### Verify Google OAuth on Netlify
```bash
# Test OAuth URL generation
curl https://spontaneous-biscotti-da44bc.netlify.app/api/oauth/google/url

# Expected response should include:
# - success: true
# - url: https://accounts.google.com/o/oauth2/v2/auth?...
# - state: [random string]
```

---

## SUMMARY CHECKLIST

Run these in order to verify everything:

### ✅ Database (5 minutes)
```bash
# 1. Connect and list tables
psql "$DATABASE_URL" -c "\dt"

# 2. Run data counts
psql "$DATABASE_URL" -f audit_report.sql > audit_$(date +%Y%m%d).txt

# 3. Check sample data
psql "$DATABASE_URL" -c "SELECT * FROM markup_rules LIMIT 3;"
psql "$DATABASE_URL" -c "SELECT * FROM promo_codes LIMIT 3;"
psql "$DATABASE_URL" -c "SELECT * FROM users WHERE google_id IS NOT NULL LIMIT 3;"
```

### ✅ APIs (3 minutes)
```bash
# Test public endpoints
curl https://.../api/health-check
curl https://.../api/countries
curl https://.../api/packages

# Test OAuth
curl https://.../api/oauth/google/url
```

### ✅ Integrations (2 minutes)
```bash
# Test external services
curl https://.../api/test-hotelbeds
curl https://.../api/test-amadeus-auth
```

### ✅ Files & Backups (2 minutes)
```bash
# Check voucher storage
psql "$DATABASE_URL" -c "SELECT pdf_path FROM vouchers LIMIT 5;"

# Verify Render backup in dashboard
```

**Total Time: ~12 minutes to verify your entire system independently**
