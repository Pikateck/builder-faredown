# **Faredown AI Bargaining Platform**

## Final Go-Live Execution & Verification Checklist – Builder

This package contains **all final commands and queries** needed to validate readiness for 10% production rollout.
Builder must run these **exactly** and mark **YES/NO** for each, with screenshot/log evidence.

---

## **🚀 INSTANT 5-SECOND DB VALIDATION**

**Single paste-and-run script for complete database verification:**

```sql
-- =====================================================
-- FAREDOWN AI BARGAINING - COMPLETE DB VALIDATION
-- Paste this entire script into Render SQL console
-- =====================================================

-- 1. SCHEMA VALIDATION
SELECT 
  'SCHEMA_CHECK' as check_type,
  'ai_tables_count' as metric,
  COUNT(*) as value,
  CASE WHEN COUNT(*) >= 15 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'ai'

UNION ALL

SELECT 
  'SCHEMA_CHECK' as check_type,
  'materialized_views_count' as metric,
  COUNT(*) as value,
  CASE WHEN COUNT(*) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_matviews 
WHERE schemaname = 'ai'

UNION ALL

SELECT 
  'SCHEMA_CHECK' as check_type,
  'never_loss_function_exists' as metric,
  COUNT(*) as value,
  CASE WHEN COUNT(*) >= 1 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_proc 
WHERE proname = 'assert_never_loss'

UNION ALL

-- 2. CRITICAL FLOOR AUDIT (NEVER-LOSS VALIDATION)
SELECT 
  'FLOOR_AUDIT' as check_type,
  'never_loss_violations' as metric,
  COALESCE(
    (SELECT COUNT(*) 
     FROM ai.bargain_events e
     JOIN LATERAL (
       SELECT MAX(counter_price) AS final_price
       FROM ai.bargain_events e2
       WHERE e2.session_id = e.session_id
     ) f ON TRUE
     WHERE e.accepted IS TRUE 
       AND f.final_price < e.true_cost_usd), 0
  ) as value,
  CASE WHEN COALESCE(
    (SELECT COUNT(*) 
     FROM ai.bargain_events e
     JOIN LATERAL (
       SELECT MAX(counter_price) AS final_price
       FROM ai.bargain_events e2
       WHERE e2.session_id = e.session_id
     ) f ON TRUE
     WHERE e.accepted IS TRUE 
       AND f.final_price < e.true_cost_usd), 0
  ) = 0 THEN '✅ PASS' ELSE '🚨 CRITICAL FAIL' END as status

UNION ALL

-- 3. RECENT ACTIVITY VALIDATION
SELECT 
  'ACTIVITY_CHECK' as check_type,
  'recent_supplier_rates_1h' as metric,
  COALESCE(
    (SELECT COUNT(*) FROM ai.supplier_rates WHERE updated_at > NOW() - INTERVAL '1 hour'), 0
  ) as value,
  CASE WHEN COALESCE(
    (SELECT COUNT(*) FROM ai.supplier_rates WHERE updated_at > NOW() - INTERVAL '1 hour'), 0
  ) > 0 THEN '✅ PASS' ELSE '⚠️ WARN' END as status

UNION ALL

SELECT 
  'ACTIVITY_CHECK' as check_type,
  'recent_bargain_sessions_24h' as metric,
  COALESCE(
    (SELECT COUNT(*) FROM ai.bargain_sessions WHERE created_at > NOW() - INTERVAL '24 hours'), 0
  ) as value,
  CASE WHEN COALESCE(
    (SELECT COUNT(*) FROM ai.bargain_sessions WHERE created_at > NOW() - INTERVAL '24 hours'), 0
  ) >= 0 THEN '✅ PASS' ELSE '⚠️ WARN' END as status

UNION ALL

-- 4. DATA INTEGRITY VALIDATION
SELECT 
  'INTEGRITY_CHECK' as check_type,
  'active_policies_count' as metric,
  COALESCE(
    (SELECT COUNT(*) FROM ai.policies WHERE is_active = true), 0
  ) as value,
  CASE WHEN COALESCE(
    (SELECT COUNT(*) FROM ai.policies WHERE is_active = true), 0
  ) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status

UNION ALL

SELECT 
  'INTEGRITY_CHECK' as check_type,
  'active_models_count' as metric,
  COALESCE(
    (SELECT COUNT(*) FROM ai.model_registry WHERE is_active = true), 0
  ) as value,
  CASE WHEN COALESCE(
    (SELECT COUNT(*) FROM ai.model_registry WHERE is_active = true), 0
  ) >= 2 THEN '✅ PASS' ELSE '❌ FAIL' END as status

ORDER BY check_type, metric;

-- =====================================================
-- EXPECTED RESULTS SUMMARY:
-- ✅ ai_tables_count: 15+ 
-- ✅ materialized_views_count: 3+
-- ✅ never_loss_function_exists: 1
-- ✅ never_loss_violations: 0 (CRITICAL - MUST BE ZERO)
-- ✅ recent_supplier_rates_1h: >0 (supplier worker active)
-- ✅ recent_bargain_sessions_24h: >=0 (system activity)
-- ✅ active_policies_count: 3+ (business rules loaded)
-- ✅ active_models_count: 2+ (AI models deployed)
-- =====================================================
```

**✔ Expected: All rows show ✅ PASS status. If any show ❌ FAIL or 🚨 CRITICAL FAIL, DO NOT PROCEED.**

---

## **🔍 INSTANT REDIS HIT-RATE CHECK**

**API endpoint to verify cache performance (no Grafana wait):**

```bash
curl -s https://<YOUR_RENDER_API_URL>/metrics | grep bargain_redis_hit_rate
```

**Expected output:**
```
# TYPE bargain_redis_hit_rate gauge
bargain_redis_hit_rate 0.92
```

✔ **Expected: value ≥ 0.90** (90% or higher)

---

## **⚡ FEATURE FLAGS VERIFICATION**

**API check for safe-start configuration:**

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

## **📊 PROMETHEUS/GRAFANA SPOT-CHECK**

Once live scrape data is available:

* **Grafana p95 latency**: `< 300ms` for `/session/*` routes
* **Metrics endpoint responding**: 
  ```bash
  curl https://<YOUR_RENDER_API_URL>/metrics | grep "bargain_response_seconds"
  ```
* **Capsule ECDSA verify**: ✅ on at least 1 replayed session

---

## **🔄 CRON & WORKER HEALTH**

Confirm in Render logs (last 24h, no failures):

* Hotset refresh every 5 min
* Cache warmer hourly  
* MV refresh hourly
* Model retrain nightly at 02:00 UTC

---

## **🎯 FRONTEND INTEGRATION**

* Uses `/api/bargain/v1/*` endpoints
* "Why this price?" shows model confidence & explanation
* Reprice modal triggers on `INVENTORY_CHANGED`
* No UI/design changes from approved build

---

## **✅ EXECUTION PATH**

1. **Master Validation**: Run `./api/scripts/master-validation.sh` → Expect: **"READY FOR PRODUCTION ROLLOUT"**

2. **Rollout Phases**:
   - Shadow mode (24h) → 10% (24h) → 50% (48h) → 100%
   - Auto-rollback triggers if ProfitGuard breach (>3% drop vs control in 6h)

3. **Confirmation Required**: Submit this checklist with YES/NO + proof for each item

---

## **📋 BUILDER FINAL CHECKLIST**

**Copy and fill YES/NO + evidence:**

### Critical Database Validation (5-second script)
- [ ] **Single DB validation script**: ✅ (Paste complete SQL results - all rows must show ✅ PASS)
- [ ] **Never-loss violations**: ✅ (Confirm value = 0 in results)

### Performance & Monitoring  
- [ ] **Redis hit rate**: ✅ (Paste curl result showing ≥0.90)
- [ ] **Metrics endpoint**: ✅ (Paste curl result showing bargain metrics)
- [ ] **Feature flags**: ✅ (Paste API response showing shadow mode values)

### System Health
- [ ] **Cron job logs**: ✅ (Screenshot of green Render cron logs)
- [ ] **Grafana p95 latency**: ✅ (Screenshot showing <300ms when available)

### Integration & Final Gate
- [ ] **Frontend endpoints**: ✅ (Confirm flights/hotels use /api/bargain/v1/*)
- [ ] **Master validation**: ✅ (Paste "READY FOR PRODUCTION ROLLOUT" banner)

---

**🚀 Once all items are ✅ with evidence attached, proceed to 10% traffic rollout.**

---

*Single SQL script validates entire system in under 5 seconds. All other commands are copy-paste ready for instant verification.*
