#!/bin/bash
# Master Validation Script for AI Bargaining Platform Go-Live
# Runs all validation checks in sequence with pass/fail gates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_HOST=${API_HOST:-localhost:3000}
API_TOKEN=${API_TOKEN:-validation_token}
DB_HOST=${DB_HOST:-localhost}
REDIS_HOST=${REDIS_HOST:-localhost}

echo -e "${BLUE}🚀 AI BARGAINING PLATFORM - GO-LIVE VALIDATION${NC}"
echo "=================================================="
echo "Target: $API_HOST"
echo "Timestamp: $(date)"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
CRITICAL_FAILURES=()

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local is_critical="$3"
    
    echo -e "${BLUE}Running: $test_name${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        
        if [ "$is_critical" = "true" ]; then
            CRITICAL_FAILURES+=("$test_name")
        fi
        return 1
    fi
}

# Function to check if service is running
check_service() {
    local service_name="$1"
    local check_command="$2"
    
    echo -e "${YELLOW}Checking $service_name...${NC}"
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not accessible${NC}"
        return 1
    fi
}

# Pre-flight checks
echo -e "${YELLOW}📋 PRE-FLIGHT CHECKS${NC}"
echo "===================="

check_service "API Server" "curl -s -f http://$API_HOST/health"
check_service "Redis" "redis-cli -h $REDIS_HOST ping"
check_service "PostgreSQL" "pg_isready -h $DB_HOST"

echo ""

# 1. SMOKE TESTS (15-minute validation)
echo -e "${YELLOW}🧪 SMOKE TESTS${NC}"
echo "==============="

run_test "API Smoke Test" "node api/scripts/smoke-test.js" true

# Check if smoke test generated results
if [ -f "smoke-test-results.json" ]; then
    P95_LATENCY=$(node -p "JSON.parse(require('fs').readFileSync('smoke-test-results.json')).latency.p95")
    if (( $(echo "$P95_LATENCY < 300" | bc -l) )); then
        echo -e "${GREEN}✅ P95 Latency: ${P95_LATENCY}ms < 300ms${NC}"
    else
        echo -e "${RED}❌ P95 Latency: ${P95_LATENCY}ms >= 300ms${NC}"
        CRITICAL_FAILURES+=("High Latency")
    fi
fi

echo ""

# 2. FLOOR ENFORCEMENT CHECK
echo -e "${YELLOW}🛡️ NEVER-LOSS VALIDATION${NC}"
echo "=========================="

run_test "Floor Enforcement Check" "psql -h $DB_HOST -d faredown -f api/scripts/floor-enforcement-check.sql | grep 'below_floor_count.*0'" true

echo ""

# 3. PERFORMANCE VALIDATION
echo -e "${YELLOW}⚡ PERFORMANCE VALIDATION${NC}"
echo "========================="

# Cache warming
run_test "Cache Warming" "node api/scripts/cache-warmer.js" false

# Load testing (if k6 is available)
if command -v k6 &> /dev/null; then
    run_test "Load Test (150 VUs, 3min)" "k6 run --duration 3m --vus 150 api/scripts/load-test.js" true
else
    echo -e "${YELLOW}⏭️ SKIPPED: k6 not installed for load testing${NC}"
fi

echo ""

# 4. FUNCTIONAL QA MATRIX
echo -e "${YELLOW}🔍 FUNCTIONAL QA TESTS${NC}"
echo "======================"

run_test "Functional QA Matrix" "node api/scripts/qa-test-runner.js" true

echo ""

# 5. MONITORING SETUP
echo -e "${YELLOW}📊 MONITORING SETUP${NC}"
echo "==================="

run_test "Monitoring Configuration" "node api/scripts/monitoring-setup.js" false

echo ""

# 6. SEED & REFRESH (Dashboard Demo)
echo -e "${YELLOW}🌱 DASHBOARD PREPARATION${NC}"
echo "========================"

run_test "Seed & Refresh for Demo" "node api/scripts/seed-refresh.js" false

echo ""

# 7. HEALTH CHECK VALIDATION
echo -e "${YELLOW}💊 HEALTH CHECK VALIDATION${NC}"
echo "==========================="

# Test all health endpoints
run_test "Basic Health Check" "curl -s -f http://$API_HOST/health | grep 'healthy'" true
run_test "Bargain Health Check" "curl -s -f http://$API_HOST/health/bargain | grep 'healthy'" true

# Check Redis cache hit rate
CACHE_HIT_RATE=$(redis-cli -h $REDIS_HOST eval "
local hits = redis.call('get', 'cache:hits') or 0
local misses = redis.call('get', 'cache:misses') or 0
local total = hits + misses
if total > 0 then
    return (hits / total) * 100
else
    return 0
end
" 0 2>/dev/null || echo "0")

if (( $(echo "$CACHE_HIT_RATE > 70" | bc -l) )); then
    echo -e "${GREEN}✅ Cache Hit Rate: ${CACHE_HIT_RATE}% > 70%${NC}"
else
    echo -e "${YELLOW}⚠️ Cache Hit Rate: ${CACHE_HIT_RATE}% < 70% (consider warming)${NC}"
fi

echo ""

# 8. FEATURE FLAGS CHECK
echo -e "${YELLOW}🚩 FEATURE FLAGS VALIDATION${NC}"
echo "============================"

# Check that critical flags are set correctly
AI_ENABLED=$(redis-cli -h $REDIS_HOST get feature_flag_AI_KILL_SWITCH 2>/dev/null || echo "false")
TRAFFIC_PCT=$(redis-cli -h $REDIS_HOST get feature_flag_AI_TRAFFIC 2>/dev/null || echo "0")

if [ "$AI_ENABLED" = "false" ] || [ "$AI_ENABLED" = "" ]; then
    echo -e "${GREEN}✅ AI Kill Switch: OFF (ready for traffic)${NC}"
else
    echo -e "${RED}❌ AI Kill Switch: ON (blocks all traffic)${NC}"
    CRITICAL_FAILURES+=("AI Kill Switch Enabled")
fi

echo -e "${BLUE}ℹ️ Traffic Percentage: ${TRAFFIC_PCT}${NC}"

echo ""

# FINAL REPORT
echo -e "${BLUE}📊 VALIDATION SUMMARY${NC}"
echo "====================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ ${#CRITICAL_FAILURES[@]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL CRITICAL VALIDATIONS PASSED${NC}"
    echo -e "${GREEN}✅ READY FOR PRODUCTION ROLLOUT${NC}"
    echo ""
    echo "Recommended next steps:"
    echo "1. Start with Shadow mode (24h): AI_SHADOW=true, AI_TRAFFIC=0"
    echo "2. Monitor for 24h, then move to 10% traffic"
    echo "3. Gradually increase: 10% → 50% → 100%"
    echo "4. Keep auto-rollback enabled"
    echo ""
    echo -e "${BLUE}Shadow mode command:${NC}"
    echo "curl -X POST http://$API_HOST/api/admin/feature-flags \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"AI_SHADOW\":true,\"AI_TRAFFIC\":0}'"
    
    exit 0
else
    echo ""
    echo -e "${RED}❌ CRITICAL FAILURES DETECTED${NC}"
    echo -e "${RED}🚫 NOT READY FOR PRODUCTION${NC}"
    echo ""
    echo "Critical issues that must be resolved:"
    for failure in "${CRITICAL_FAILURES[@]}"; do
        echo -e "${RED}  • $failure${NC}"
    done
    echo ""
    echo "Please fix these issues and re-run validation."
    
    exit 1
fi
