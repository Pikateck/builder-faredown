# **Faredown AI Bargaining Platform**

## Final Go-Live Checklist – Builder Execution

All components from the final package are implemented.
Run these **exact steps** and mark **YES/NO** for each with screenshots or logs as proof.

---

## **1️⃣ Render Database Verification**

Confirm **in the Render Postgres instance**:

**SQL Commands to paste and run:**

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

## **2️⃣ Floor-Audit Query (Paste & Run)**

**CRITICAL: Must return `0` violations**

```sql
-- NEVER-LOSS FLOOR AUDIT - MUST RETURN 0
SELECT COUNT(*) AS below_floor
FROM ai.bargain_events e
JOIN LATERAL (
  SELECT MAX(counter_price) AS final_price
  FROM ai.bargain_events e2
  WHERE e2.session_id = e.session_id
) f ON TRUE
WHERE e.accepted IS TRUE
  AND f.final_price < e.true_cost_usd;
```

✔ **Expected result: `0`** (zero violations)

---

## **3️��� Redis Hit-Rate Check**

**API endpoint to verify cache performance:**

```bash
# Check Redis connectivity and hit rate
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-render-url.com/api/cache/health

# Expected response:
{
  "redis_connected": true,
  "hit_rate": 0.92,
  "total_requests": 15420,
  "cache_hits": 14186,
  "cache_misses": 1234
}
```

**Alternative SQL check for recent cache activity:**

```sql
-- Verify cache is being used (should show recent cache operations)
SELECT 
  'rates' as cache_type,
  COUNT(*) as entries_count,
  MAX(updated_at) as last_updated
FROM ai.supplier_rates 
WHERE updated_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
  'sessions' as cache_type,
  COUNT(*) as entries_count,
  MAX(created_at) as last_updated
FROM ai.bargain_sessions 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

✔ **Expected: hit_rate ≥ 0.90** (90% or higher)

---

## **4️⃣ Prometheus / Grafana Checks**

* **Grafana p95 latency**: `< 300ms` for `/session/*` routes (15-min window)
* **Metrics endpoint responding**: 
  ```bash
  curl https://your-render-url.com/metrics | grep "bargain_response_seconds"
  ```
* **Capsule ECDSA verify**: ✅ on at least 1 replayed session

---

## **5️⃣ Cron & Worker Health**

**Quick health check queries:**

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

Confirm in Render logs (no failures in last 24h):
* Hotset refresh every 5 min
* Cache warmer hourly
* MV refresh hourly
* Model retrain nightly at 02:00 UTC

---

## **6️⃣ Feature Flags (Safe Start)**

**API check:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-render-url.com/api/feature-flags
```

**Expected exact values:**

```json
{
  "AI_TRAFFIC": 0.0,
  "AI_SHADOW": true,
  "AI_AUTO_SCALE": false,
  "SUPPRESS_AI_ALERTS": false,
  "PROFIT_GUARD_ENABLED": true
}
```

---

## **7️⃣ Frontend Wiring**

* Flights & Hotels using `/api/bargain/v1/*` endpoints
* "Why this price?" shows model confidence + explain string
* Reprice modal triggers on `INVENTORY_CHANGED`
* No UI/design changes from approved build

---

## **✅ Execution Path**

1. **Master Validation**: Run `./api/scripts/master-validation.sh` → Expect **"READY FOR PRODUCTION ROLLOUT"** banner

2. **Rollout Phases**:
   - Shadow mode (24h) → 10% (24h) → 50% (48h) → 100%
   - Auto-rollback triggers if ProfitGuard breach (>3% drop vs control in 6h)

3. **Confirmation Required**: Return this checklist with YES/NO + screenshots/logs for each item above

---

## **📋 BUILDER CONFIRMATION CHECKLIST**

**Copy this format and fill YES/NO + evidence:**

### Database Verification
- [ ] **AI tables count**: ✅ (Paste SQL result showing 15+ tables)
- [ ] **Materialized views**: ✅ (Paste SQL result showing 3+ MVs)
- [ ] **Never-loss function**: ✅ (Paste SQL result showing function exists)
- [ ] **Recent data activity**: ✅ (Paste SQL result showing recent rates/sessions)

### Critical Business Rule
- [ ] **Floor audit result**: ✅ (Paste SQL result showing 0 violations)

### Performance & Monitoring
- [ ] **Redis hit rate**: ✅ (Paste API response showing ≥90% hit rate)
- [ ] **Metrics endpoint**: ✅ (Paste curl result showing bargain metrics)
- [ ] **Grafana p95 latency**: ✅ (Screenshot showing <300ms)

### System Health
- [ ] **Supplier worker health**: ✅ (Paste SQL result showing recent amadeus/hotelbeds rates)
- [ ] **Cron job logs**: ✅ (Screenshot of green Render cron logs)
- [ ] **Feature flags**: ✅ (Paste API response showing shadow mode values)

### Integration
- [ ] **Frontend endpoints**: ✅ (Confirm flights/hotels use /api/bargain/v1/*)
- [ ] **Master validation**: ✅ (Paste "READY FOR PRODUCTION ROLLOUT" banner)

---

**Once all items are ✅ with evidence attached, proceed to 10% traffic rollout.**

---

*All SQL queries and API calls above can be copy-pasted directly for instant verification.*
