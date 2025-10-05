# Email Template for Builder Audit Request

---

**Subject:** URGENT: Complete Database & System Audit Required - Deadline 8 Oct EOD IST

---

Hi Builder Team,

We need the **full technical audit deliverable** submitted by **Wednesday, 8 October 2025, EOD (IST)**. This is not optional.

**If the complete report is not received by the deadline, we will pause all further development work until we can independently verify the system architecture.** This is necessary to protect data integrity and deployment stability.

---

## Required Deliverables

Please provide ALL of the following in a **single consolidated document** with screenshots and exports:

### 1. Database Inventory & Structure

**Format**: SQL export or pgAdmin screenshots

✅ **Full list of PostgreSQL tables** (expect 45+ tables)
- Table name
- Purpose/description  
- Primary key
- Foreign key relationships

✅ **Schema structure for EACH table**:
- Column names
- Data types
- Constraints (NOT NULL, UNIQUE, etc.)
- Indexes

✅ **Sample data** (3-5 rows) from these critical tables:
- `users` (including Google OAuth signups)
- `markup_rules` (created via Admin Panel)
- `promo_codes` (active codes)
- `hotel_bookings` (with payment references)
- `payments` (transaction records)
- `vouchers` (invoice/ticket records)
- `bargain_sessions`
- `loyalty_members`

**Evidence Required**: Screenshots from pgAdmin OR raw SQL output

**Reference SQL Queries** (run these and share output):
```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Data counts
SELECT 'users' AS table, COUNT(*) FROM users
UNION ALL SELECT 'markup_rules', COUNT(*) FROM markup_rules
UNION ALL SELECT 'promo_codes', COUNT(*) FROM promo_codes
UNION ALL SELECT 'bookings', COUNT(*) FROM hotel_bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments;

-- Foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

---

### 2. API Endpoint Mapping

**Format**: Postman collection OR Swagger/OpenAPI JSON OR detailed spreadsheet

✅ **Complete endpoint list** (expect 500+ endpoints)

For each endpoint provide:
- Full URL path (e.g., `/api/admin/markup/packages`)
- HTTP method (GET/POST/PUT/DELETE)
- Authentication required (Public / Bearer Token / Admin)
- Database table(s) accessed
- Brief purpose

**Example format**:
| Endpoint | Method | Auth | DB Tables | Purpose |
|----------|--------|------|-----------|---------|
| `/api/admin/markup/packages` | GET | Admin | markup_rules | List package markups |
| `/api/bookings/hotels/confirm` | POST | Token | hotel_bookings, payments | Confirm booking |

✅ **Mapping**: Which tables are linked to:
- Builder Frontend (user actions)
- Admin Panel (CMS operations)  
- Render APIs (backend services)
- Netlify Functions (if applicable)

---

### 3. Functional Status & Data Proof

**Format**: Table with status indicators + screenshots

✅ **System Status Matrix**:

| Component | Status | Evidence/Notes |
|-----------|--------|----------------|
| Frontend (Builder) | ✅ / ❌ | Screenshot of live site |
| Backend APIs (Render) | ✅ / ❌ | API health check response |
| Admin Panel | ✅ / ❌ | Screenshot + DB entries |
| Google OAuth | ✅ / ❌ | User entries with google_id |
| Email Login | ✅ / ❌ | User entries without google_id |
| Payment Gateway | ✅ / ❌ | Successful payment records |
| Invoice/Voucher Generation | ✅ / ❌ | PDF paths in vouchers table |
| Mobile Responsive | ✅ / ❌ | Mobile preview screenshot |

✅ **Data Evidence** (screenshots or SQL exports):
- Markup rules created via Admin Panel
- Active promo codes with usage stats
- User signups (both email and Google)
- Completed bookings with payment IDs
- Generated invoices/vouchers (PDF storage proof)

---

### 4. Payment Gateway Configuration

**Critical Information Required**:

✅ **Provider**: Razorpay / Stripe / Other?

✅ **Mode**: 
- ⚠️ Test/Sandbox
- ✅ Production/Live

✅ **Webhook Configuration**:
- Webhook URL (e.g., `https://.../api/payments/webhook`)
- Webhook secret
- Events subscribed to
- Screenshot from payment gateway dashboard

✅ **Refund/Cancellation Flow**:
- Is refund logic implemented?
- Which DB table stores refund records?
- Test refund transaction proof

✅ **Transaction Logs**:
- Which table stores payment logs? (`payments` table?)
- Sample successful transaction (screenshot with gateway_payment_id)

---

### 5. External Service Integrations

For EACH service, provide:

✅ **Hotelbeds (Hotels)**:
- API Key (first/last 4 chars only)
- Environment: Test or Production?
- Sample successful API call log
- Which tables store hotel data?

✅ **Amadeus (Flights)**:
- API Key (first/last 4 chars only)  
- Environment: Test or Production?
- Sample successful API call log
- Which tables store flight data?

✅ **SendGrid (Email)**:
- API Key (first/last 4 chars only)
- Email delivery success rate
- Screenshot of recent sent emails
- Which table stores email logs?

✅ **Google OAuth**:
- Client ID (confirm it matches our records)
- **Authorized Redirect URIs** configured in Google Console (screenshot)
- Must include BOTH:
  - `https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/oauth/google/callback`
  - `https://spontaneous-biscotti-da44bc.netlify.app/api/oauth/google/callback`

---

### 6. Environment Variables Verification

**Format**: Screenshot from Render dashboard + table

✅ **Complete list of environment variables** set in Render

**Critical variables checklist** (confirm these are set):

**Database**:
- `DATABASE_URL`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`

**External APIs**:
- `HOTELBEDS_API_KEY`, `HOTELBEDS_API_SECRET`
- `AMADEUS_API_KEY`, `AMADEUS_API_SECRET`

**OAuth**:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Payment**:
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

**Email**:
- `SENDGRID_API_KEY`, `EMAIL_FROM`

**Security**:
- `JWT_SECRET`, `SESSION_JWT_SECRET`

✅ **Screenshot**: Render dashboard env vars (redact secrets but show variable names exist)

---

### 7. Backup & Recovery Policy

✅ **Render Database Backups**:
- Backup frequency (daily/weekly/hourly?)
- Retention period (how long are backups kept?)
- Last successful backup timestamp
- Screenshot from Render backup dashboard

✅ **Recovery Procedure**:
- Step-by-step process to restore from backup
- Estimated recovery time
- Has recovery been tested? (yes/no)

✅ **Disaster Recovery Plan**:
- What happens if Render goes down?
- Failover strategy?
- Data loss tolerance (RPO/RTO)?

---

### 8. Monitoring & Error Tracking

✅ **Sentry (Error Tracking)**:
- Is Sentry configured and active? (yes/no)
- Sentry DSN (first/last 4 chars)
- Screenshot of Sentry dashboard showing recent errors
- Access credentials for Sentry project

✅ **Logging**:
- Where are API logs stored/viewable?
- How long are logs retained?
- Screenshot of recent API logs

✅ **Performance Metrics**:
- Current API response time (avg)
- Database query performance
- Any bottlenecks identified?

---

## Verification Checklist

Your submission MUST include:

- [ ] List of all PostgreSQL tables with schema (SQL export or pgAdmin screenshots)
- [ ] Sample data rows from key tables (users, markup_rules, promo_codes, bookings, payments, vouchers)
- [ ] Foreign key relationship diagram or table
- [ ] Complete API endpoint list (Postman/Swagger or detailed spreadsheet)
- [ ] Endpoint → Database table mapping
- [ ] Functional status matrix with evidence
- [ ] Payment gateway: provider, mode, webhook config, sample transaction
- [ ] External service configs (Hotelbeds, Amadeus, SendGrid) with test logs
- [ ] Google OAuth redirect URIs screenshot from Google Console
- [ ] Environment variables screenshot from Render
- [ ] Backup policy with last backup timestamp
- [ ] Sentry/monitoring dashboard screenshots

---

## Expected Format

Please organize the submission as:

```
FAREDOWN_TECHNICAL_AUDIT_REPORT.pdf

1. Executive Summary (1 page)
2. Database Inventory (tables, schemas, relationships, sample data)
3. API Endpoint Catalog (complete list with mappings)
4. Data Validation (proof of admin-created data)
5. Integration Details (payment, hotels, flights, email, OAuth)
6. Environment Configuration (Render env vars)
7. Backup & Recovery (policy + procedures)
8. Monitoring & Logs (Sentry + API logs)
9. Appendix (SQL exports, API collections, screenshots)
```

**Attachments**:
- SQL dump of schema structure
- Postman collection (if available)
- Screenshots folder (organized by section)

---

## Deadline & Consequences

**Submission Deadline**: Wednesday, 8 October 2025, EOD (India Standard Time)

**If not received by deadline**:
We will immediately pause all development work and conduct our own independent audit before proceeding. This may delay the project timeline significantly.

**Why this is critical**:
- We need to verify database integrity before production deployment
- Payment gateway must be properly configured to avoid transaction issues  
- Backup/recovery must be validated to prevent data loss
- All integrations must be documented for ongoing maintenance

---

## Questions?

If you have ANY questions about what's required, please ask immediately. Do not wait until the deadline.

We've attached our **independent technical baseline report** (TECHNICAL_BASELINE_AUDIT_REPORT.md) which shows what we expect to see. Your submission should match or exceed this level of detail.

**Reference documents attached**:
1. `TECHNICAL_BASELINE_AUDIT_REPORT.md` - Our independent baseline
2. `QUICK_VERIFICATION_COMMANDS.md` - SQL queries you should run
3. This email as `EMAIL_TO_BUILDER_TEMPLATE.md`

---

## Next Steps

1. **Acknowledge receipt** of this email within 24 hours
2. **Ask clarifying questions** if anything is unclear
3. **Submit complete audit** by 8 Oct EOD IST
4. **Schedule review call** after submission to walk through findings

We appreciate your cooperation and look forward to the audit report.

Best regards,
**Zubin Aibara**

---

## Attachments
- [ ] TECHNICAL_BASELINE_AUDIT_REPORT.md (860 lines, comprehensive reference)
- [ ] QUICK_VERIFICATION_COMMANDS.md (609 lines, copy-paste SQL queries)
- [ ] EMAIL_TO_BUILDER_TEMPLATE.md (this document)
