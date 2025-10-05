# Streamlined Implementation Steps for Builder Team

---

**Subject:** Do these steps now: DB + API fixes and evidence

**To:** Builder.io Development Team  
**CC:** Sheema, Moen  
**Priority:** URGENT  
**Deadline:** 8 October 2025, EOD IST

---

Hi Team,

No analysis is needed. Please execute the steps below and submit the evidence. Follow the sequence exactly.

---

## 0) Environment sanity (do this first)

**Goal:** Make sure all services write to the same Render Postgres.

**Do:**

1. Confirm `DATABASE_URL` for all services points to the **Render external** URL with SSL required:
   ```
   postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db
   ```

2. From your API container or psql, run:
   ```sql
   SELECT current_database(), current_user, inet_server_addr(), now();
   ```

3. Share your **Render → Environment** screenshot showing DB URL and payment keys.

**Evidence to submit:**
- Screenshot of Render env vars
- Screenshot of the SQL output above

---

## 1) Users path → persist to `users`

**Goal:** New signups and Google login create rows in `users`.

**Do:**

1. Ensure auth handlers call the DB write (no mock).

2. Minimum columns present:
   - `id UUID PRIMARY KEY`
   - `email TEXT UNIQUE NOT NULL`
   - `name TEXT`
   - `provider TEXT`
   - `created_at TIMESTAMPTZ DEFAULT now()`

3. Create one test user via UI.

**Verification SQL (run and export CSV):**
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 3;
SELECT COUNT(*) AS users_count FROM users;
```

**Evidence to submit:**
- UI screenshot of signup/login success
- CSV export of the two queries above

---

## 2) Booking path → persist to `bookings` (or your active bookings table)

**Goal:** Confirmed bookings write a row.

**Do:**

1. On booking confirmation, insert:
   - `id UUID PRIMARY KEY`
   - `user_id UUID REFERENCES users(id)`
   - `module TEXT`  -- 'air' | 'hotel' | 'sightseeing'
   - `supplier TEXT`
   - `base_amount NUMERIC(12,2)`
   - `markup_rule_id UUID NULL`
   - `promo_code_id UUID NULL`
   - `status TEXT`  -- 'confirmed' | 'pending' | 'failed'
   - `created_at TIMESTAMPTZ DEFAULT now()`

2. Create 1–2 bookings from the UI, tied to the test user.

**Verification SQL:**
```sql
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 3;
SELECT COUNT(*) AS bookings_count FROM bookings;
```

**Evidence to submit:**
- UI screenshots of booking success
- CSV export of the two queries above

---

## 3) Payments path + webhook → persist to `payments`

**Goal:** A successful payment inserts a row; webhook is live and verified.

**Do:**

1. Implement `POST /api/payments/webhook` for your provider (Razorpay/Stripe).

2. Verify signature; on success insert:
   - `id BIGSERIAL PRIMARY KEY`
   - `booking_id UUID REFERENCES bookings(id)`
   - `gateway TEXT`
   - `gateway_payment_id TEXT`
   - `gateway_order_id TEXT`
   - `amount NUMERIC(12,2)`
   - `currency TEXT`
   - `status TEXT`  -- 'captured' | 'failed' | 'refunded'
   - `payment_details JSONB`
   - `created_at TIMESTAMPTZ DEFAULT now()`

3. Run one test payment end-to-end so the webhook fires.

**Verification SQL:**
```sql
SELECT * FROM payments ORDER BY id DESC LIMIT 3;
SELECT COUNT(*) AS payments_count FROM payments;
```

**Evidence to submit:**
- Screenshot of provider dashboard showing the webhook 200 response
- CSV export of the two queries above

---

## 4) Invoices / tickets → persist and link

**Goal:** Generated PDFs are stored and linked back to the booking.

**Do (if table missing, create):**
```sql
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
```

1. Generate an invoice for one booking and upload the PDF to your storage (S3/Render disk).
2. Save the `pdf_url` in `invoices`.

**Verification SQL:**
```sql
SELECT * FROM invoices ORDER BY created_at DESC LIMIT 3;
SELECT COUNT(*) AS invoices_count FROM invoices;
```

**Evidence to submit:**
- Screenshot of the PDF opened via `pdf_url`
- CSV export of the two queries above

---

## 5) Admin Panel binding → live DB only

**Goal:** Admin shows the same data that is in Postgres.

**Do:**

1. Make sure Admin reads the live DB for Users, Bookings, Payments, Invoices, Promos, Markups.
2. No cached or mock data.

**Evidence to submit:**
- Side-by-side screenshots: Admin lists and the matching SQL results for the same entities

---

## 6) Deliverables packaging

Put all evidence in your repo under:

```
/audits/2025-10-08/
  00_env_vars.png
  01_users_last3.csv
  01_users_count.csv
  02_bookings_last3.csv
  02_bookings_count.csv
  03_payments_last3.csv
  03_payments_count.csv
  04_invoices_last3.csv
  04_invoices_count.csv
  05_admin_users.png
  05_admin_bookings.png
  05_admin_payments.png
  05_admin_invoices.png
  06_webhook_200.png
  07_postman_collection.json   (current live endpoints)
  08_readme.txt                (what you did, any caveats)
```

---

## 7) Final acceptance (we will run this)

After you complete steps 1–5, we will run:

```sql
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'promo_codes', COUNT(*) FROM promo_codes
UNION ALL SELECT 'markup_rules', COUNT(*) FROM markup_rules;
```

**Pass criteria:** `users`, `bookings`, `payments`, `invoices` counts are **> 0** and match Admin.

---

## Expected Final Result

| Table Name    | Count | Status          |
|---------------|-------|-----------------|
| users         | > 0   | ✅ MUST HAVE    |
| bookings      | > 0   | ✅ MUST HAVE    |
| payments      | > 0   | ✅ MUST HAVE    |
| invoices      | > 0   | ✅ MUST HAVE    |
| promo_codes   | 11    | ✅ BASELINE OK  |
| markup_rules  | 14    | ✅ BASELINE OK  |

---

## Quick Database Access

```bash
# Connect to Render Postgres
psql "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db"

# List tables
\dt

# Quick check
SELECT 'users' AS t, COUNT(*) FROM users
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices;
```

---

## Timeline

**Start:** Immediately upon receipt  
**Daily Updates:** 6 PM IST via email  
**Deadline:** Wednesday, 8 October 2025, EOD (IST)  
**Acknowledgment Required:** Within 4 hours of receiving this email

---

## Acknowledgment Template

Reply with:

```
✅ Confirmed: I understand all 7 steps
✅ Confirmed: I have access to Render Postgres
✅ Confirmed: DATABASE_URL verified and correct
✅ Confirmed: I will deliver by 8 Oct EOD IST
✅ Confirmed: Evidence will be committed to /audits/2025-10-08/
```

---

**Execute now. No further discussion needed.**

Thanks,  
**Zubin Aibara**  
Pikateck Technologies LLP  
Faredown Platform
