# AI Bargaining Platform - Go-Live Deployment Checklist

## 🚀 Pre-Deployment Validation

### 1. Infrastructure Ready

- [ ] Redis cluster healthy and accessible
- [ ] PostgreSQL database with AI schema deployed
- [ ] API servers deployed and responsive
- [ ] Load balancer configured
- [ ] SSL certificates valid
- [ ] Environment variables set

### 2. Run Master Validation

```bash
# Run the comprehensive validation suite
./api/scripts/master-validation.sh

# Expected output: "✅ READY FOR PRODUCTION ROLLOUT"
```

### 3. Smoke Test Results

- [ ] All API endpoints respond < 300ms p95
- [ ] Session start/offer/accept flow works
- [ ] Never-loss floor enforcement: 0 violations
- [ ] Capsule verification passes
- [ ] Error handling works (RATE_STALE, INVENTORY_CHANGED)

### 4. Performance Gates

- [ ] Load test: 150 VUs, 3min, p95 < 300ms, error < 0.5%
- [ ] Redis cache hit rate > 90%
- [ ] Database query performance acceptable
- [ ] Async logging working (no blocking)

### 5. Functional QA Matrix

- [ ] Hotel double-counter flow
- [ ] Flight below-floor protection
- [ ] Promo code stacking
- [ ] User tier bonuses (GOLD/PLATINUM)
- [ ] Multi-supplier arbitration
- [ ] Error recovery flows

---

## 📊 Monitoring & Alerts Setup

### 1. Prometheus Alerts Configured

```bash
# Copy alert rules to Prometheus
cp api/monitoring/prometheus-alerts.json /etc/prometheus/alerts/
systemctl reload prometheus
```

### 2. Grafana Dashboard Imported

- [ ] Dashboard shows: latency, cache hit rate, sessions/min, acceptance rate
- [ ] All panels loading data
- [ ] Alerts configured for p95 > 300ms, cache miss > 10%

### 3. Health Checks Active

- [ ] `/health` endpoint returning 200
- [ ] `/health/bargain` detailed checks passing
- [ ] External monitoring pinging health endpoints

---

## 🚩 Feature Flags Configuration

### Shadow Mode (24h)

```bash
curl -X POST /api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"AI_SHADOW":true,"AI_TRAFFIC":0}'
```

- [ ] AI decisions logged but not served to users
- [ ] Control flow handles all traffic
- [ ] Decision accuracy and latency monitored

### 10% Canary (24h)

```bash
curl -X POST /api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"AI_SHADOW":false,"AI_TRAFFIC":0.1}'
```

- [ ] 10% users get AI bargaining
- [ ] 90% users get control experience
- [ ] Margin and acceptance rate monitored

### 50% Rollout (48h)

```bash
curl -X POST /api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"AI_TRAFFIC":0.5,"PROMO_SUGGESTIONS":true}'
```

- [ ] Promo Lab suggestions enabled
- [ ] Tier bonuses active
- [ ] User satisfaction tracked

### 100% Full Rollout

```bash
curl -X POST /api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"AI_TRAFFIC":1.0,"AI_FEATURES":"all"}'
```

- [ ] Auto-rollback triggers armed
- [ ] Full monitoring active

---

## 🔄 Rollout Phases & Success Criteria

### Phase 1: Shadow (0% traffic, 24h)

**Success Criteria:**

- [ ] Zero errors in AI decision pipeline
- [ ] Latency p95 < 300ms consistently
- [ ] Decision accuracy > 85% vs expected
- [ ] No never-loss violations

**Rollback Triggers:**

- High error rate in decision pipeline
- Memory/CPU issues
- Database performance degradation

### Phase 2: 10% Canary (24h)

**Success Criteria:**

- [ ] Error rate < 0.5%
- [ ] Latency p95 < 300ms
- [ ] Margin drop vs control < 3%
- [ ] Acceptance rate > 15%

**Rollback Triggers:**

- Error rate > 1% for 5 minutes
- Latency p95 > 500ms for 5 minutes
- Margin drop > 5% for 1 hour

### Phase 3: 50% Rollout (48h)

**Success Criteria:**

- [ ] Error rate < 0.3%
- [ ] Latency p95 < 280ms
- [ ] Margin improvement > 2%
- [ ] User satisfaction > 4.2/5

**Rollback Triggers:**

- Same as 10% canary
- Customer complaints spike
- Booking conversion drops

### Phase 4: 100% Full (Ongoing)

**Success Criteria:**

- [ ] All metrics stable
- [ ] Profit targets met
- [ ] Customer satisfaction maintained

**Auto-Rollback:**

- Margin drop > 3% vs control for 6h
- Error rate sustained > 0.5%

---

## 🚨 Emergency Procedures

### Immediate Rollback

```bash
# Kill switch - disable all AI bargaining
curl -X POST /api/admin/feature-flags \
  -d '{"AI_KILL_SWITCH":true}'

# Or rollback to control
curl -X POST /api/admin/rollback \
  -d '{"reason":"emergency","percentage":0}'
```

### Rapid Fixes

#### If P95 spikes > 300ms:

1. Check Redis hit rate: `redis-cli info stats | grep keyspace`
2. Re-warm cache: `node api/scripts/cache-warmer.js`
3. Reduce action grid size: Update policy `max_actions_per_grid: 6`
4. Check batch model inference

#### If inventory flips spike > 2%:

1. Increase supplier refresh: `5min → 3min` for hot SKUs
2. Check supplier API latency
3. Review rate limiting on supplier side

#### If profit margin drops:

1. Check Promo Lab for over-aggressive discounts
2. Lower `max_total_discount_pct` in Policy Manager
3. Review tier bonus configurations
4. Check for promo code abuse

---

## 📋 Post-Deployment Validation

### First Hour Checks

- [ ] Health dashboard all green
- [ ] Error rates < 0.5%
- [ ] Latency p95 < 300ms
- [ ] Active sessions flowing
- [ ] No never-loss violations
- [ ] Cache hit rate > 90%

### First Day Checks

- [ ] Margin vs control baseline
- [ ] User acceptance rates
- [ ] Supplier API performance
- [ ] Promo effectiveness
- [ ] Customer satisfaction scores

### First Week Checks

- [ ] Business metrics trending positive
- [ ] System stability maintained
- [ ] Operational runbooks effective
- [ ] Team confidence high

---

## 📞 Escalation & Support

### On-Call Rotation

- **Primary:** DevOps Engineer
- **Secondary:** Backend Engineer
- **Escalation:** Engineering Manager
- **Business:** Product Manager

### Alert Channels

- **Critical:** PagerDuty + Slack #bargain-alerts
- **Warning:** Slack #bargain-monitoring
- **Info:** Email digest

### Key Contacts

- **Infra Issues:** DevOps team
- **Database Issues:** DBA team
- **Business Impact:** Product team
- **Customer Issues:** Support team

---

## 📚 Documentation Links

- **API Documentation:** `/docs/bargain-api.md`
- **Policy DSL Guide:** `/docs/policy-dsl.md`
- **Admin Playbook:** `/docs/admin-playbook.md`
- **Runbooks:** `/docs/runbooks.md`
- **Security Guide:** `/docs/security.md`

---

## ✅ Final Checklist

Before enabling any traffic:

- [ ] All validation scripts pass
- [ ] Monitoring dashboards showing data
- [ ] Alert rules configured and tested
- [ ] Team trained on dashboards
- [ ] Emergency procedures tested
- [ ] Stakeholders notified
- [ ] Rollback plan confirmed

**Deployment Approved By:**

- [ ] Engineering Lead: ******\_\_\_\_******
- [ ] DevOps Lead: ******\_\_\_\_******
- [ ] Product Manager: ******\_\_\_\_******
- [ ] Security Review: ******\_\_\_\_******

**Go-Live Authorization:**

- [ ] Business Owner: ******\_\_\_\_******
- [ ] Date/Time: ******\_\_\_\_******
- [ ] Initial Traffic %: ******\_\_\_\_******

---

_Last Updated: $(date)_
_Version: 1.0_
_Owner: AI Bargaining Platform Team_
