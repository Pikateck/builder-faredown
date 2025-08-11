# **Faredown AI Bargaining Platform**

## Final Validation & Go-Live Checklist – Builder Execution

All components from our final package are now implemented and confirmed as ready.
Proceed with the **Render database verification**, **monitoring validation**, and **traffic rollout** exactly as below.

---

### **1️⃣ Render Database Verification**

Confirm **in the Render Postgres instance**:

* All `ai.*` tables exist (15+ tables)
* Materialized views:
  * `supplier_rates_mv`
  * `session_analytics_mv`
  * `profit_margins_mv`
* Performance indexes on `canonical_key`, `session_id`, `created_at`
* Function `ai.assert_never_loss()` exists and returns **OK** on run
* Data is live from the last 24h

**SQL Commands to verify in Render SQL Console:**

```sql
-- 1. Check AI schema tables (should return 15+)
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'ai';

-- 2. Check materialized views (should return 3+)
SELECT COUNT(*) as mv_count 
FROM pg_matviews 
WHERE schemaname = 'ai';

-- 3. Verify never-loss function exists
SELECT 1 FROM pg_proc WHERE proname = 'assert_never_loss';

-- 4. Check recent data activity (should have entries from last 24h)
SELECT 
  (SELECT COUNT(*) FROM ai.supplier_rates WHERE updated_at > NOW() - INTERVAL '24 hours') as recent_rates,
  (SELECT COUNT(*) FROM ai.bargain_sessions WHERE created_at > NOW() - INTERVAL '24 hours') as recent_sessions;
```

---

### **2️⃣ Prometheus/Grafana Checks**

Send proof for each:

* **Grafana p95** latency < 300 ms for `/session/*` routes (15-min window)
* **Redis hit rate** ≥ 90% (after cache warm)
* **Floor audit query** result = 0 accepts below cost floor
* Capsule ECDSA verify = ✅ on at least 1 replayed session

**CRITICAL: Floor Audit Query (paste in Render SQL Console)**

```sql
-- NEVER-LOSS FLOOR AUDIT - MUST RETURN 0
-- This is the core business rule validation
SELECT COUNT(*) AS violations_below_floor
FROM ai.bargain_events e
JOIN LATERAL (
  SELECT MAX(counter_price) AS final_price
  FROM ai.bargain_events e2
  WHERE e2.session_id = e.session_id
) f ON TRUE
WHERE e.accepted IS TRUE 
  AND f.final_price < e.true_cost_usd;

-- Expected result: 0 (zero violations)
-- If > 0: CRITICAL - do not proceed to production
```

---

### **3️⃣ Cron & Worker Health**

Verify in Render logs:

* Hotset refresh running every 5 min
* Cache warmer hourly
* MV refresh hourly  
* Model retrain nightly at 02:00 UTC
* No worker or cron job failures in last 24 h

**Quick health check query:**

```sql
-- Check if supplier fabric worker is active (should have recent entries)
SELECT 
  supplier_id,
  MAX(updated_at) as last_update,
  COUNT(*) as rate_count
FROM ai.supplier_rates 
WHERE updated_at > NOW() - INTERVAL '1 hour'
GROUP BY supplier_id;

-- Should show amadeus and hotelbeds with recent timestamps
```

---

### **4️⃣ Feature Flags (Safe Start)**

Set exactly in Render environment:

```json
{
  "AI_TRAFFIC": 0.0,
  "AI_SHADOW": true,
  "AI_AUTO_SCALE": false,
  "SUPPRESS_AI_ALERTS": false,
  "PROFIT_GUARD_ENABLED": true
}
```

**API endpoint to verify flags:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-render-url.com/api/feature-flags
```

---

### **5️⃣ Frontend Wiring**

* Flights & Hotels use live `/api/bargain/v1/*` endpoints
* "Why this price?" displays model confidence + explain string
* Reprice modal fires on `INVENTORY_CHANGED`
* No design/UI changes from approved builds

---

## ✅ **Execution Path**

1. **Master Validation**: Run `./api/scripts/master-validation.sh` → Expect **"READY FOR PRODUCTION ROLLOUT"** banner

2. **Rollout Phases**:
   - Shadow mode (24 h) → 10% (24 h) → 50% (48 h) → 100%
   - Auto-rollback triggers on ProfitGuard breach (>3% drop vs control in 6 h)

3. **Confirmation Required**: Send back this checklist with Yes/No and evidence for all items above

---

## **📋 BUILDER CONFIRMATION CHECKLIST**

Please respond with:

- [ ] **Database tables**: ✅ (15+ tables in ai schema)
- [ ] **Materialized views**: ✅ (3+ MVs present) 
- [ ] **Never-loss function**: ✅ (ai.assert_never_loss exists)
- [ ] **Floor audit result**: ✅ (query returns 0 violations)
- [ ] **Recent data**: ✅ (supplier rates updated in last hour)
- [ ] **Feature flags**: ✅ (shadow mode configured)
- [ ] **Grafana p95**: ✅ (< 300ms screenshot attached)
- [ ] **Redis hit rate**: ✅ (≥ 90% screenshot attached)
- [ ] **Worker logs**: ✅ (cron jobs running green)
- [ ] **Master validation**: ✅ ("READY FOR PRODUCTION ROLLOUT" banner)

**Once all checkboxes are ✅, proceed to 10% traffic rollout.**

---

*All SQL queries above can be copy-pasted directly into Render's SQL console for instant verification.*
