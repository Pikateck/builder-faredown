# AI Bargaining Platform - Production Checklist

## Final Go-Live Validation ✅

### 1. Metrics & Monitoring
- [ ] `/metrics` endpoint exposing all required Prometheus metrics
  - [ ] `bargain_response_seconds` histogram with route labels
  - [ ] `bargain_redis_hit_rate` gauge ≥0.90
  - [ ] `bargain_inventory_flip_rate` gauge <0.02
  - [ ] `bargain_contribution_margin_pct` gauge by variant
  - [ ] `bargain_fallback_total` counter by reason
  - [ ] `bargain_offerability_ms` and `bargain_model_infer_ms` histograms
  - [ ] `bargain_async_queue_lag` gauge
  - [ ] `bargain_policy_version` and `bargain_model_version` info metrics

### 2. Prometheus & Alerting
- [ ] Prometheus scrape configuration loaded
- [ ] Alert rules in `rules/bargain.yaml` active
- [ ] BargainLatencyP95High alert (>300ms) triggers correctly
- [ ] RedisMissRateHigh alert (>10%) triggers correctly
- [ ] ProfitGuardBreach alert configured for auto-rollback
- [ ] Alertmanager routing to proper channels

### 3. Grafana Dashboard
- [ ] All 14 panels loading data within 1s
- [ ] p95 latency panel shows <300ms green threshold
- [ ] Redis hit rate panel shows ≥90% target
- [ ] Error rate panels tracking 5xx responses
- [ ] Business metrics (acceptance rate, margins) visible

### 4. Database Validation
- [ ] All 15+ tables in `ai` schema exist
- [ ] 3+ materialized views created and refreshed
- [ ] Never-loss function `ai.assert_never_loss()` operational
- [ ] Floor audit query returns 0 violations
- [ ] Active models in registry (pricing + offerability)
- [ ] Supplier policies loaded and active

### 5. Redis Hot Cache
- [ ] Connectivity verified via `/api/cache/health`
- [ ] TTL configuration correct (policies:∞, rates:5min, features:24h, sessions:30min)
- [ ] Hit rate ≥85% during normal operations
- [ ] Cache warming operational

### 6. API Performance
- [ ] `/session/start` p95 latency <300ms under load
- [ ] `/session/offer` p95 latency <200ms
- [ ] `/session/accept` p95 latency <150ms
- [ ] Error rate <0.5% under normal load
- [ ] Rate limiting configured (30 req/min per IP)

### 7. Supplier Fabric Worker
- [ ] Recent rate snapshots in last 10 minutes
- [ ] Amadeus adapter functional (recent hotel rates)
- [ ] Hotelbeds adapter functional (recent flight rates)
- [ ] Circuit breakers operational
- [ ] Hotset refresh every 5 minutes

### 8. Feature Flags System
- [ ] All flags accessible via `/api/feature-flags`
- [ ] AI_TRAFFIC flag responds (default: 0.0)
- [ ] Rollout phases defined (shadow→10%→50%→100%)
- [ ] Audit trail logging flag changes

### 9. Load Testing
- [ ] k6 load test passes with 150 VUs for 3 minutes
- [ ] p95 latency stays <300ms under load
- [ ] Error rate stays <0.5% under load
- [ ] No memory leaks or resource exhaustion

### 10. Smoke Tests
- [ ] Complete bargain flow (start→offer→accept) works
- [ ] Never-loss enforcement blocks violations
- [ ] Offerability engine evaluating correctly
- [ ] Model inference responding within SLA
- [ ] All health endpoints returning 200

### 11. Security
- [ ] No secrets exposed in `/api/health` response
- [ ] HTTPS enforced with proper headers
- [ ] Authentication working on protected endpoints
- [ ] ECDSA capsule signing operational

### 12. Rollback Automation
- [ ] Auto-rollback script tested
- [ ] Profit guard breach simulation triggers rollback
- [ ] Feature flags reset to safe state (AI_TRAFFIC=0.0)
- [ ] Slack notifications working
- [ ] Manual rollback procedures documented

### 13. Cron Jobs & Automation
- [ ] Hotset refresh every 5 minutes
- [ ] Materialized view refresh hourly
- [ ] Cache warmer maintaining ≥90% hit rate
- [ ] Model retrain scheduled nightly
- [ ] Log rotation and cleanup scheduled

### 14. Final Validation
- [ ] Master validation script passes all checks
- [ ] "READY FOR PRODUCTION ROLLOUT" banner displayed
- [ ] Screenshots of green Grafana panels attached
- [ ] Load test results documented
- [ ] Business stakeholders signed off

## Deployment Phases

### Phase 1: Shadow Mode (Week 1)
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"flag": "AI_TRAFFIC", "value": 0.0}' \
  $API_URL/api/feature-flags/set

curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"flag": "AI_SHADOW", "value": true}' \
  $API_URL/api/feature-flags/set
```
- **Goal**: Log all AI predictions without affecting customer experience
- **Metrics**: Model accuracy, prediction latency, data quality
- **Success**: Clean logs, no errors, predictions look reasonable

### Phase 2: 10% Canary (Week 2)
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/feature-flags/rollout/canary
```
- **Goal**: Route 10% of traffic to AI with full monitoring
- **Metrics**: p95 latency <300ms, error rate <0.5%, no profit loss
- **Success**: SLA maintained, customer satisfaction stable

### Phase 3: 50% Partial Rollout (Week 3)
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/feature-flags/rollout/partial
```
- **Goal**: Scale to 50% traffic with confidence
- **Metrics**: All SLA metrics green, profit margins maintained
- **Success**: Business metrics improved vs control

### Phase 4: 100% Full Production (Week 4)
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/feature-flags/rollout/full
```
- **Goal**: Full production AI bargaining for all users
- **Metrics**: System stable, customer experience improved
- **Success**: Project complete, AI system delivering value

## Emergency Procedures

### Immediate Rollback
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/feature-flags/rollout/rollback
```

### Manual Rollback
```bash
# Set traffic to 0
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"flag": "AI_TRAFFIC", "value": 0.0}' \
  $API_URL/api/feature-flags/set

# Enable shadow mode for diagnosis
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"flag": "AI_SHADOW", "value": true}' \
  $API_URL/api/feature-flags/set
```

## Key Contacts
- **Engineering**: AI Team Lead
- **Operations**: DevOps Team
- **Business**: Product Owner
- **Support**: Customer Success

## Success Criteria
- [ ] p95 latency <300ms sustained
- [ ] Redis hit rate ≥90%
- [ ] Error rate <0.5%
- [ ] Zero never-loss violations
- [ ] Profit margins maintained vs control
- [ ] Customer satisfaction stable or improved

---

**When all checkboxes are complete**: 
🚀 **READY FOR PRODUCTION ROLLOUT!** 🚀
