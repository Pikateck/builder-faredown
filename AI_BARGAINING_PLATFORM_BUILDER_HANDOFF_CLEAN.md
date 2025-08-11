# AI Bargaining Platform – Pre-Rollout Validation

## Builder Checklist

**Objective:** Confirm production readiness before moving from **Shadow Mode** to **10% live traffic**.

---

## 1️⃣ SQL Validation – One Paste, Full DB Check

**Paste this into Render's SQL Console:**

```sql
-- SCHEMA CHECK
SELECT table_name
FROM information_schema.tables
WHERE table_schema='ai'
ORDER BY table_name;

-- NEVER-LOSS FLOOR AUDIT (Critical)
SELECT COUNT(*) AS violations
FROM ai.bargain_events e
JOIN LATERAL (
  SELECT MAX(counter_price) AS final_price
  FROM ai.bargain_events e2
  WHERE e2.session_id = e.session_id
) f ON TRUE
WHERE e.accepted IS TRUE AND f.final_price < e.true_cost_usd;

-- RECENT ACTIVITY
SELECT COUNT(*) AS recent_sessions
FROM ai.bargain_sessions
WHERE created_at > now() - interval '24 hours';
```

**Expected:**

- All 15+ `ai.*` tables present
- **violations = 0** 🚨 **If >0 → STOP rollout**
- Recent sessions > 0

---

## 2️⃣ Redis Hit-Rate Check (No Grafana Delay)

**Run in terminal / API test:**

```bash
GET {your-api}/metrics | grep bargain_redis_hit_rate
```

**Expected:** `bargain_redis_hit_rate >= 0.90`

---

## 3️⃣ Feature Flags – Shadow Mode Confirmation

```bash
GET {your-api}/feature-flags
```

**Expected Values:**

```json
{
  "AI_TRAFFIC": 0.0,
  "AI_SHADOW": true,
  "PROFIT_GUARD_ENABLED": true
}
```

---

## 4️⃣ Worker & Cron Health

**SQL check:**

```sql
SELECT job_name, last_run, status
FROM ai.worker_logs
WHERE last_run > now() - interval '15 minutes';
```

**Expected:** All jobs show `status = success`.

---

## 5️⃣ GO/NO-GO Decision

| Check                    | Pass? | Evidence (screenshot/output) |
| ------------------------ | ----- | ---------------------------- |
| SQL schema + floor audit | ☐     |                              |
| Redis hit rate ≥90%      | ☐     |                              |
| Feature flags correct    | ☐     |                              |
| Workers healthy          | ☐     |                              |

---

## Rollout Instructions

### If all ✅:

- Set `AI_TRAFFIC=0.10`
- Keep `AI_SHADOW=false`
- Monitor Grafana p95 latency (<300ms) for 24h

### If any ❌:

- **Stop rollout**
- Investigate failing area
- Re-run checklist after fix

---

## Contact Information

**If any step fails:**

- **Technical Issues:** AI Team Lead
- **Database Problems:** DevOps Team
- **Business Questions:** Product Owner

---

## Expected Timeline

1. **Shadow Mode:** 24 hours
2. **10% Rollout:** 24 hours
3. **50% Rollout:** 48 hours
4. **100% Full:** After validation

**Auto-rollback armed** on profit margin drop >3% vs control

---

_Return completed checklist with evidence to confirm production readiness_ 🚀
