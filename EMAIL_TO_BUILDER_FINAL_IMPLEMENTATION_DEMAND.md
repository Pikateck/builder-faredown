# Final Implementation Demand to Builder Team

---

**Subject:** Confirming required deliverables for Builder — implement immediately

**To:** Builder.io Development Team  
**CC:** Sheema, Moen  
**Priority:** HIGH  
**Deadline:** 8 October 2025, EOD IST

---

Hi Team,

To be absolutely clear — below is the scope of work that must now be implemented by the Builder development team. These are not discussion points or analysis items — these are the exact deliverables that must exist and function end-to-end in the live Render setup.

---

## 🔧 Builder Implementation Tasks (Mandatory)

### 1️⃣ User Registration / Login → `users` table

**Requirement:**  
All signup and Google login activity must write directly into the live Render Postgres DB.

**Required fields:**  
`id` (UUID), `email`, `name`, `provider`, `created_at`

**Test Case:**  
Create a new user and confirm the record appears in the `users` table.

**Verification SQL:**
```sql
SELECT id, email, name, provider, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### 2️⃣ Booking Confirmation → `bookings` table

**Requirement:**  
When a user completes a booking (Flight / Hotel / Package), the system must persist all key details.

**Required fields:**  
`booking_id`, `user_id`, `module`, `supplier`, `price`, `markup_rule_id`, `promo_code_id`, `status`, `created_at`

**Test Case:**  
Make a real booking and confirm the data is stored in the `bookings` table with correct links to user and markup.

**Verification SQL:**
```sql
SELECT 
  b.id,
  b.booking_ref,
  b.user_id,
  u.email as user_email,
  b.total_amount,
  b.status,
  b.created_at
FROM hotel_bookings b
LEFT JOIN users u ON u.id::text = b.user_id::text
ORDER BY b.created_at DESC
LIMIT 5;
```

---

### 3️⃣ Payment Gateway Integration → `payments` table

**Requirement:**  
Implement a Razorpay webhook endpoint (`POST /api/payments/webhook`) that captures payment status and stores it.

**Required fields:**  
`payment_id`, `booking_id`, `amount`, `currency`, `payment_status`, `gateway_reference`, `created_at`

**Test Case:**  
Complete a payment and confirm webhook logs a success row in the `payments` table.

**Verification SQL:**
```sql
SELECT 
  p.id,
  p.booking_id,
  p.gateway,
  p.gateway_payment_id,
  p.amount,
  p.currency,
  p.status,
  p.created_at
FROM payments p
ORDER BY p.created_at DESC
LIMIT 5;
```

---

### 4️⃣ Invoice Generation → `invoices` table

**Requirement:**  
Create an `invoices` table linked to bookings.

**Required fields:**  
`invoice_id`, `booking_id`, `invoice_number`, `amount`, `pdf_url`, `created_at`

**Storage:**  
Store generated ticket/invoice PDFs either in cloud storage (S3/Render Storage) and link via URL.

**Migration SQL (if table doesn't exist):**
```sql
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES hotel_bookings(id),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  pdf_url TEXT,
  pdf_path TEXT,
  status VARCHAR(50) DEFAULT 'generated',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
```

**Verification SQL:**
```sql
SELECT 
  i.id,
  i.booking_id,
  i.invoice_number,
  i.amount,
  i.currency,
  i.pdf_url,
  i.created_at
FROM invoices i
ORDER BY i.created_at DESC
LIMIT 5;
```

---

### 5️⃣ Admin Panel Binding → Live Render Database

**Requirement:**  
Ensure all Admin views (Users, Bookings, Payments, Invoices, Promos, Markups) display live DB data — not cached or mock data.

**Test Case:**  
The Admin dashboard counters and list views must reflect exactly what is stored in Postgres.

**Verification:**  
Admin dashboard at `/admin/dashboard` should show:
- Total Users = `SELECT COUNT(*) FROM users`
- Total Bookings = `SELECT COUNT(*) FROM hotel_bookings`
- Total Payments = `SELECT COUNT(*) FROM payments`
- Active Promos = `SELECT COUNT(*) FROM promo_codes WHERE is_active = true`

---

## ⚙️ Evidence Required for Completion

For **each of the 5 tasks above**, provide:

1. ✅ **Screenshot of UI action**  
   (e.g., user signup form, booking confirmation page, payment success screen)

2. ✅ **Screenshot of matching row in Postgres**  
   Via pgAdmin showing the actual database record

3. ✅ **CSV export** of verification query results  
   Run the provided SQL queries and export results to CSV

4. ✅ **API logs** showing successful write operations  
   Console logs or Render logs proving data persistence

---

## 📋 Final Acceptance Test

Run this comprehensive verification query and share the output:

```sql
-- Final acceptance verification
SELECT 
  'users' AS table_name, 
  COUNT(*) AS row_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ POPULATED'
    ELSE '❌ EMPTY'
  END AS status
FROM users

UNION ALL

SELECT 
  'hotel_bookings', 
  COUNT(*),
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ POPULATED'
    ELSE '❌ EMPTY'
  END
FROM hotel_bookings

UNION ALL

SELECT 
  'payments', 
  COUNT(*),
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ POPULATED'
    ELSE '❌ EMPTY'
  END
FROM payments

UNION ALL

SELECT 
  'invoices', 
  COUNT(*),
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ POPULATED'
    ELSE '❌ EMPTY'
  END
FROM invoices

UNION ALL

SELECT 
  'promo_codes', 
  COUNT(*),
  '✅ BASELINE (already populated)'
FROM promo_codes

UNION ALL

SELECT 
  'markup_rules', 
  COUNT(*),
  '✅ BASELINE (already populated)'
FROM markup_rules;
```

**Expected Output After Implementation:**

| table_name      | row_count | status                   |
|-----------------|-----------|--------------------------|
| users           | > 0       | ✅ POPULATED              |
| hotel_bookings  | > 0       | ✅ POPULATED              |
| payments        | > 0       | ✅ POPULATED              |
| invoices        | > 0       | ✅ POPULATED              |
| promo_codes     | 11        | ✅ BASELINE              |
| markup_rules    | 14        | ✅ BASELINE              |

---

## 🚨 Critical Configuration Checklist

Before testing, verify these environment variables in Render:

```bash
# Database Connection (MUST match Render external URL)
DATABASE_URL=postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db

# API Base URL (frontend must call this)
VITE_API_BASE_URL=https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api

# Payment Gateway
RAZORPAY_KEY_ID=<your_key>
RAZORPAY_KEY_SECRET=<your_secret>

# OAuth
GOOGLE_CLIENT_ID=832664905965-h8qjvsjm5bbb6g21iug8hmm4f46c2n5u.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Disable Mock Data
ENABLE_MOCK_DATA=false
VITE_ENABLE_OFFLINE_FALLBACK=false
```

---

## 📅 Timeline & Deliverables

**Deadline:** Wednesday, 8 October 2025, EOD (IST)

**Submission Format:**

```
📁 Implementation Evidence Package/
├── 01_user_registration/
│   ├── ui_screenshot.png
│   ├── db_screenshot.png
│   └── users_export.csv
├── 02_booking_flow/
│   ├── ui_screenshot.png
│   ├── db_screenshot.png
│   └── bookings_export.csv
├── 03_payment_webhook/
│   ├── payment_success_screenshot.png
│   ├── webhook_logs.txt
│   ├── db_screenshot.png
│   └── payments_export.csv
├── 04_invoices/
│   ├── invoice_generated_screenshot.png
│   ├── pdf_sample.pdf
│   ├── db_screenshot.png
│   └── invoices_export.csv
├── 05_admin_panel/
│   ├── admin_dashboard_screenshot.png
│   ├── admin_users_list_screenshot.png
│   └── admin_vs_db_comparison.txt
└── final_acceptance_test.csv
```

**Commit all evidence to:** `audits/2025-10-08/` in the GitHub repository

---

## ⚠️ Consequences of Non-Delivery

If the complete implementation with evidence is not delivered by the deadline:

1. ❌ All further development work will be paused
2. ❌ We will conduct independent implementation audit
3. ❌ Project timeline may be extended with associated costs
4. ❌ Escalation to Builder.io leadership team

---

## 📞 Communication Protocol

- **Daily Progress Updates:** 6 PM IST via email
- **Blockers:** Report immediately, don't wait
- **Questions:** Ask now, not at deadline
- **Evidence Submission:** Commit to repo as you complete each task

---

## ✅ Acknowledgment Required

Reply to this email within **4 hours** confirming:

1. ✅ You have read and understood all 5 implementation tasks
2. ✅ Environment variables are verified and correct
3. ✅ You have access to Render Postgres database
4. ✅ You commit to delivering by 8 Oct EOD IST
5. ✅ You understand the evidence requirements

---

## 📚 Reference Materials

Available in repository:
- `TECHNICAL_BASELINE_AUDIT_REPORT.md` - Complete system baseline
- `QUICK_VERIFICATION_COMMANDS.md` - All verification SQL queries
- `audits/2025-10-05/` - Current database state (baseline)

---

**No further clarification or discussion is required. Execute immediately.**

Thanks,  
**Zubin Aibara**  
Pikateck Technologies LLP  
Faredown Platform

---

## Quick Access Database Connection

```bash
# Connect to Render Postgres
psql "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db"

# List all tables
\dt

# Check current state
SELECT 'users' AS table, COUNT(*) FROM users
UNION ALL SELECT 'bookings', COUNT(*) FROM hotel_bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments;
```
