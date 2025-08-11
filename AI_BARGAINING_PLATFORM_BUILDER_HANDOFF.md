# 🚀 AI Bargaining Platform - Pre-Rollout Validation

## Builder Execution Checklist

**Objective:** Confirm production readiness before moving from **Shadow Mode → 10% traffic rollout**

---

## ✅ STEP 1: Complete Database Validation (5-second check)

**Action:** Paste this SQL into **Render's SQL Console** and run:

```sql
-- FAREDOWN • AI BARGAINING PLATFORM • 5-SECOND DB VALIDATION
WITH stats AS (
  SELECT
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='ai') AS table_count,
    (SELECT COUNT(*) FROM pg_matviews WHERE schemaname='ai') AS mv_count,
    (SELECT EXISTS(
       SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='ai' AND p.proname='assert_never_loss'
     )) AS has_assert_never_loss,
    (SELECT COUNT(*) FROM ai.bargain_events e
       JOIN LATERAL (
         SELECT MAX(counter_price) AS final_price
         FROM ai.bargain_events e2
         WHERE e2.session_id = e.session_id
       ) f ON TRUE
     WHERE e.accepted IS TRUE
       AND f.final_price < e.true_cost_usd) AS floor_violations,
    (SELECT COUNT(*) FROM ai.supplier_rates WHERE updated_at > NOW() - INTERVAL '24 hours') AS rates_24h,
    (SELECT COUNT(*) FROM ai.bargain_sessions WHERE created_at > NOW() - INTERVAL '24 hours') AS sessions_24h,
    (SELECT COALESCE(MAX(created_at), TIMESTAMP 'epoch') FROM ai.bargain_events) AS last_event_at,
    (SELECT COUNT(*) FROM ai.policies WHERE is_active = true) AS policies_count,
    (SELECT version FROM ai.policies WHERE is_active = true ORDER BY created_at DESC LIMIT 1) AS active_policy_version,
    (SELECT COUNT(*) FROM ai.model_registry WHERE is_active = true) AS active_models
),
report AS (
  SELECT 'Schema: tables in ai schema' AS check, table_count::text AS actual, '>= 15' AS expected,
    CASE WHEN table_count >= 15 THEN '✅ PASS' ELSE '❌ FAIL' END AS status, NULL::text AS details FROM stats
  UNION ALL SELECT 'Schema: materialized views in ai', mv_count::text, '>= 3',
    CASE WHEN mv_count >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END, NULL FROM stats
  UNION ALL SELECT 'Guardrail function present', CASE WHEN has_assert_never_loss THEN 'true' ELSE 'false' END, 'true',
    CASE WHEN has_assert_never_loss THEN '✅ PASS' ELSE '❌ FAIL' END, 'ai.assert_never_loss()' FROM stats
  UNION ALL SELECT 'CRITICAL: never-loss floor violations', floor_violations::text, '0',
    CASE WHEN floor_violations = 0 THEN '✅ PASS' ELSE '🚨 CRITICAL FAIL' END, 'Must be ZERO before rollout' FROM stats
  UNION ALL SELECT 'Recent activity: supplier rates (24h)', rates_24h::text, '> 0',
    CASE WHEN rates_24h > 0 THEN '✅ PASS' ELSE '⚠️ WARN' END, 'Supplier fabric worker active' FROM stats
  UNION ALL SELECT 'Recent activity: bargain sessions (24h)', sessions_24h::text, '>= 0',
    CASE WHEN sessions_24h >= 0 THEN '✅ PASS' ELSE '⚠️ WARN' END, 'System activity check' FROM stats
  UNION ALL SELECT 'Policy readiness: active policies', policies_count::text, '>= 3',
    CASE WHEN policies_count >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END, 'Active version: ' || COALESCE(active_policy_version,'(none)') FROM stats
  UNION ALL SELECT 'Model readiness: active models', active_models::text, '>= 2',
    CASE WHEN active_models >= 2 THEN '✅ PASS' ELSE '❌ FAIL' END, 'Pricing + offerability models' FROM stats
  UNION ALL SELECT 'Last bargain event timestamp', TO_CHAR(last_event_at,'YYYY-MM-DD HH24:MI:SS'), 'recent/non-epoch',
    CASE WHEN last_event_at > TIMESTAMP '1971-01-01' THEN '✅ PASS' ELSE '❌ FAIL' END, 'Data activity indicator' FROM stats
)
SELECT * FROM report ORDER BY CASE WHEN check LIKE 'CRITICAL:%' THEN 1 WHEN check LIKE 'Schema:%' THEN 2 ELSE 3 END, check;
```

**Expected Result:** All rows show **✅ PASS**, no **🚨 CRITICAL FAIL**

---

## ⚡ STEP 2: Redis Hit-Rate Verification (no Grafana wait)

**Action:**

```bash
curl -s https://<YOUR_RENDER_API_URL>/metrics | grep '^bargain_redis_hit_rate'
```

**Expected:** `bargain_redis_hit_rate >= 0.90` (e.g., `bargain_redis_hit_rate 0.92`)

---

## 🎯 STEP 3: Feature Flags Check

**Action:** Check feature flags via API or config:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://<YOUR_RENDER_API_URL>/api/feature-flags
```

**Expected JSON:**

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

## 🔄 STEP 4: Worker/Cron Health Check

**Expected in Render logs (last 24h, all green):**

- ✅ Hotset refresh – every 5 min
- ✅ Cache warmer – hourly
- ✅ MV refresh – hourly
- ✅ Model retrain – daily at 02:00 UTC

---

## 📋 STEP 5: Evidence to Return

**Submit screenshots/outputs for:**

| Check                   | Evidence Required                                                    | Status |
| ----------------------- | -------------------------------------------------------------------- | ------ |
| **Database Validation** | Screenshot of SQL output table with all ✅ PASS, no 🚨 CRITICAL FAIL | ⬜     |
| **Redis Performance**   | Output showing `bargain_redis_hit_rate >= 0.90`                      | ⬜     |
| **Feature Flags**       | Screenshot/output showing exact shadow mode values                   | ⬜     |
| **Worker Health**       | Screenshot of Render cron logs (last 24h, all green)                 | ⬜     |
| **Grafana P95**         | Screenshot of p95 latency panel < 300ms (15-min window)              | ⬜     |

---

## ��� GO/NO-GO CRITERIA

### ✅ **GO** - Proceed to 10% Rollout

- All database checks show **✅ PASS**
- **ZERO** never-loss violations (🚨 CRITICAL)
- Redis hit rate **≥ 90%**
- P95 latency **< 300ms**
- All worker logs **green**

### ❌ **NO-GO** - Hold Rollout

- Any **❌ FAIL** or **🚨 CRITICAL FAIL** found
- Redis hit rate **< 90%**
- P95 latency **≥ 300ms**
- Worker/cron failures in logs

---

## 🆘 SUPPORT CONTACTS

**If any step fails:**

- **Technical Issues:** AI Team Lead
- **Database Problems:** DevOps Team
- **Monitoring Issues:** Platform Team
- **Business Questions:** Product Owner

---

## 🎯 NEXT STEPS AFTER GO

**10% Rollout Command:**

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"flag": "AI_TRAFFIC", "value": 0.1}' \
  https://<YOUR_RENDER_API_URL>/api/feature-flags/set
```

**Rollout Schedule:**

- Shadow mode (24h) → 10% (24h) → 50% (48h) → 100%
- Auto-rollback armed on profit margin drop >3% vs control

---

_Return completed checklist with evidence to confirm production readiness_ 🚀
