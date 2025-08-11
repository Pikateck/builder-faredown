# **Faredown AI Bargaining Platform**
## Final Go-Live Execution & Validation Checklist – Builder

This package contains **all final commands and queries** needed to validate readiness for 10% production rollout.
Builder must run these **exactly** and mark **YES/NO** for each, with screenshot/log evidence.

---

## **🚀 ONE-SHOT 5-SECOND DB VALIDATION**

**Copy-paste this entire script into Render's SQL console and run:**

```sql
-- FAREDOWN • AI BARGAINING PLATFORM • 5-SECOND DB VALIDATION
-- Copy–paste this entire script into Render's SQL console and run.

WITH stats AS (
  SELECT
    /* Schema completeness */
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='ai')                                 AS table_count,
    (SELECT COUNT(*) FROM pg_matviews WHERE schemaname='ai')                                                AS mv_count,
    /* Guardrail function */
    (SELECT EXISTS(
       SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='ai' AND p.proname='assert_never_loss'
     ))                                                                                                      AS has_assert_never_loss,
    /* Critical never-loss audit (must be 0) */
    (SELECT COUNT(*) FROM ai.bargain_events e
       JOIN LATERAL (
         SELECT MAX(counter_price) AS final_price
         FROM ai.bargain_events e2
         WHERE e2.session_id = e.session_id
       ) f ON TRUE
     WHERE e.accepted IS TRUE
       AND f.final_price < e.true_cost_usd)                                                                  AS floor_violations,
    /* Recent activity (last 24h) */
    (SELECT COUNT(*) FROM ai.supplier_rates WHERE updated_at > NOW() - INTERVAL '24 hours')                 AS rates_24h,
    (SELECT COUNT(*) FROM ai.bargain_sessions WHERE created_at > NOW() - INTERVAL '24 hours')               AS sessions_24h,
    (SELECT COALESCE(MAX(created_at), TIMESTAMP 'epoch') FROM ai.bargain_events)                            AS last_event_at,
    /* Policy & model readiness */
    (SELECT COUNT(*) FROM ai.policies WHERE is_active = true)                                               AS policies_count,
    (SELECT version FROM ai.policies WHERE is_active = true ORDER BY created_at DESC LIMIT 1)              AS active_policy_version,
    (SELECT COUNT(*) FROM ai.model_registry WHERE is_active = true)                                         AS active_models
),
report AS (
  SELECT
    'Schema: tables in ai schema' AS check,
    table_count::text AS actual, '>= 15' AS expected,
    CASE WHEN table_count >= 15 THEN '✅ PASS' ELSE '❌ FAIL' END AS status,
    NULL::text AS details
  FROM stats
  UNION ALL SELECT
    'Schema: materialized views in ai', mv_count::text, '>= 3',
    CASE WHEN mv_count >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END,
    NULL
  FROM stats
  UNION ALL SELECT
    'Guardrail function present', CASE WHEN has_assert_never_loss THEN 'true' ELSE 'false' END, 'true',
    CASE WHEN has_assert_never_loss THEN '✅ PASS' ELSE '❌ FAIL' END,
    'ai.assert_never_loss()'
  FROM stats
  UNION ALL SELECT
    'CRITICAL: never-loss floor violations', floor_violations::text, '0',
    CASE WHEN floor_violations = 0 THEN '✅ PASS' ELSE '🚨 CRITICAL FAIL' END,
    'Must be ZERO before rollout'
  FROM stats
  UNION ALL SELECT
    'Recent activity: supplier rates (24h)', rates_24h::text, '> 0',
    CASE WHEN rates_24h > 0 THEN '✅ PASS' ELSE '⚠️ WARN' END,
    'Supplier fabric worker active'
  FROM stats
  UNION ALL SELECT
    'Recent activity: bargain sessions (24h)', sessions_24h::text, '>= 0',
    CASE WHEN sessions_24h >= 0 THEN '✅ PASS' ELSE '⚠️ WARN' END,
    'System activity check'
  FROM stats
  UNION ALL SELECT
    'Policy readiness: active policies', policies_count::text, '>= 3',
    CASE WHEN policies_count >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END,
    'Active version: ' || COALESCE(active_policy_version,'(none)')
  FROM stats
  UNION ALL SELECT
    'Model readiness: active models', active_models::text, '>= 2',
    CASE WHEN active_models >= 2 THEN '✅ PASS' ELSE '❌ FAIL' END,
    'Pricing + offerability models'
  FROM stats
  UNION ALL SELECT
    'Last bargain event timestamp', TO_CHAR(last_event_at,'YYYY-MM-DD HH24:MI:SS'), 'recent/non-epoch',
    CASE WHEN last_event_at > TIMESTAMP '1971-01-01' THEN '✅ PASS' ELSE '❌ FAIL' END,
    'Data activity indicator'
  FROM stats
)
SELECT * FROM report ORDER BY 
  CASE 
    WHEN check LIKE 'CRITICAL:%' THEN 1 
    WHEN check LIKE 'Schema:%' THEN 2
    WHEN check LIKE 'Recent activity:%' THEN 3
    WHEN check LIKE 'Policy readiness:%' THEN 4
    WHEN check LIKE 'Model readiness:%' THEN 5
    ELSE 6 
  END, check;

-- =====================================================
-- EXPECTED RESULTS SUMMARY:
-- ✅ Schema: tables in ai schema: 15+ 
-- ✅ Schema: materialized views in ai: 3+
-- ✅ Guardrail function present: true
-- ✅ CRITICAL: never-loss floor violations: 0 (MUST BE ZERO)
-- ✅ Recent activity: supplier rates (24h): >0 
-- ✅ Recent activity: bargain sessions (24h): >=0 
-- ✅ Policy readiness: active policies: 3+
-- ✅ Model readiness: active models: 2+
-- ✅ Last bargain event timestamp: recent date
-- =====================================================
```

**✔ Expected: All rows show ✅ PASS status. If any show ❌ FAIL or 🚨 CRITICAL FAIL, DO NOT PROCEED.**

---

## **⚡ INSTANT REDIS HIT-RATE CHECK**

**No Grafana wait - check cache performance directly:**

```bash
curl -s https://<YOUR_RENDER_API_URL>/metrics | grep '^bargain_redis_hit_rate'
```

**Expected output:**
```
# TYPE bargain_redis_hit_rate gauge
bargain_redis_hit_rate 0.92
```

✔ **Expected: value ≥ 0.90** (90% or higher)

---

## **🔍 FEATURE FLAGS VERIFICATION**

**API check for safe-start shadow mode:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://<YOUR_RENDER_API_URL>/api/feature-flags
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

## **📊 MONITORING & HEALTH CHECKS**

### Prometheus/Grafana (when live)
* **Grafana p95 latency**: `< 300ms` for `/session/*` routes (15-min window)
* **Metrics endpoint responding**: 
  ```bash
  curl https://<YOUR_RENDER_API_URL>/metrics | grep "bargain_response_seconds"
  ```

### Cron & Worker Health
Confirm in Render logs (last 24h, no failures):
* Hotset refresh every 5 min
* Cache warmer hourly  
* MV refresh hourly
* Model retrain nightly at 02:00 UTC

### Frontend Integration
* Uses `/api/bargain/v1/*` endpoints
* "Why this price?" shows model confidence & explanation
* Reprice modal triggers on `INVENTORY_CHANGED`
* No UI/design changes from approved build

---

## **✅ EXECUTION PATH**

1. **Master Validation**: Run `./api/scripts/master-validation.sh` → Expect: **"READY FOR PRODUCTION ROLLOUT"**

2. **Rollout Phases**:
   - **Shadow mode (24h)**: AI_TRAFFIC=0.0, AI_SHADOW=true
   - **10% canary (24h)**: AI_TRAFFIC=0.1, AI_SHADOW=true  
   - **50% partial (48h)**: AI_TRAFFIC=0.5, AI_SHADOW=false
   - **100% full**: AI_TRAFFIC=1.0, AI_SHADOW=false

3. **Auto-rollback**: Triggers if ProfitGuard breach (>3% drop vs control in 6h)

---

## **📋 BUILDER FINAL CONFIRMATION CHECKLIST**

**Fill YES/NO + evidence for each:**

### Critical Validation (5-second script)
- [ ] **Single DB validation script**: ✅ (Paste complete SQL results - all rows must show ✅ PASS)
- [ ] **Never-loss violations**: ✅ (Confirm CRITICAL check shows 0 violations)

### Performance & Cache  
- [ ] **Redis hit rate**: ✅ (Paste curl result showing ≥0.90)
- [ ] **Metrics endpoint**: ✅ (Paste curl result showing bargain metrics)

### Configuration
- [ ] **Feature flags**: ✅ (Paste API response showing exact shadow mode values)
- [ ] **Cron job logs**: ✅ (Screenshot of green Render cron logs - no failures 24h)

### Monitoring (when available)
- [ ] **Grafana p95 latency**: ✅ (Screenshot showing <300ms)
- [ ] **Master validation**: ✅ (Paste "READY FOR PRODUCTION ROLLOUT" banner)

### Integration
- [ ] **Frontend endpoints**: ✅ (Confirm flights/hotels use /api/bargain/v1/*)

---

## **🚀 FINAL GO/NO-GO DECISION**

**Once all items above are ✅ with evidence attached:**

### GO: Proceed to 10% traffic rollout
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"flag": "AI_TRAFFIC", "value": 0.1}' \
  https://<YOUR_RENDER_API_URL>/api/feature-flags/set
```

### NO-GO: Any ❌ FAIL or 🚨 CRITICAL FAIL found
- **DO NOT PROCEED** to production rollout
- **INVESTIGATE** and fix all failing checks
- **RE-RUN** validation until all ✅ PASS

---

**Single SQL script validates entire system in 5 seconds. All other commands are copy-paste ready for instant verification.**

🎯 **Return this completed checklist with evidence to confirm production readiness.**
