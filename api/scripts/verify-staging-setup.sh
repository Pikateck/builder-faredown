#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  STAGING SETUP VERIFICATION - Cache-Backed Search  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}\n"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Checking database setup...${NC}\n"

# 1. Check if tables exist
echo "1. Checking cache tables..."

TABLES=(
    "hotel_search_cache"
    "tbo_hotels_normalized"
    "tbo_rooms_normalized"
    "hotel_search_cache_results"
)

for table in "${TABLES[@]}"; do
    result=$(psql $DATABASE_URL -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table')" 2>/dev/null)
    
    if [ "$result" == "t" ]; then
        echo -e "   ${GREEN}✅${NC} $table exists"
    else
        echo -e "   ${RED}❌${NC} $table missing"
    fi
done

echo ""

# 2. Check table row counts
echo "2. Checking data in tables..."

for table in "${TABLES[@]}"; do
    count=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM public.$table" 2>/dev/null)
    echo -e "   ${BLUE}•${NC} $table: $count rows"
done

echo ""

# 3. Check indexes
echo "3. Checking indexes..."

indexes=(
    "idx_search_cache_hash"
    "idx_hotels_normalized_city"
    "idx_cache_results_hash"
)

for index in "${indexes[@]}"; do
    result=$(psql $DATABASE_URL -t -c "SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '$index')" 2>/dev/null)
    
    if [ "$result" == "t" ]; then
        echo -e "   ${GREEN}✅${NC} $index exists"
    else
        echo -e "   ${YELLOW}⚠️${NC}  $index missing"
    fi
done

echo ""

# 4. Check API endpoint
echo "4. Checking API endpoint..."

RENDER_API="https://builder-faredown-pricing.onrender.com"
timeout 10 curl -s -X POST "$RENDER_API/api/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "cityId": "1",
    "destination": "Dubai, United Arab Emirates",
    "countryCode": "AE",
    "checkIn": "2025-11-30",
    "checkOut": "2025-12-03",
    "rooms": "1",
    "adults": "2",
    "children": "0",
    "currency": "INR"
  }' > /tmp/api_response.json 2>/dev/null

if [ $? -eq 0 ]; then
    success=$(jq -r '.success' /tmp/api_response.json 2>/dev/null)
    hotels=$(jq '.hotels | length' /tmp/api_response.json 2>/dev/null)
    
    if [ "$success" == "true" ]; then
        echo -e "   ${GREEN}✅${NC} API endpoint working"
        echo -e "   ${BLUE}•${NC}  Hotels returned: $hotels"
    else
        error=$(jq -r '.error' /tmp/api_response.json 2>/dev/null)
        echo -e "   ${RED}❌${NC} API returned error: $error"
    fi
else
    echo -e "   ${RED}❌${NC} API unreachable"
fi

echo ""

# 5. Check cache stats endpoint
echo "5. Checking cache stats..."

timeout 10 curl -s -X GET "$RENDER_API/api/hotels/cache/stats" > /tmp/stats_response.json 2>/dev/null

if [ $? -eq 0 ]; then
    success=$(jq -r '.success' /tmp/stats_response.json 2>/dev/null)
    
    if [ "$success" == "true" ]; then
        echo -e "   ${GREEN}✅${NC} Cache stats endpoint working"
        hit_rate=$(jq -r '.stats.hit_rate' /tmp/stats_response.json 2>/dev/null)
        echo -e "   ${BLUE}•${NC}  Current hit rate: ${hit_rate}%"
    else
        echo -e "   ${RED}❌${NC} Stats endpoint error"
    fi
else
    echo -e "   ${RED}❌${NC} Stats endpoint unreachable"
fi

echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    SUMMARY                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}✅ All checks completed${NC}"
echo ""
echo "Next Steps:"
echo "1. Run staging tests using the test guide"
echo "2. Verify cache hit/miss behavior"
echo "3. Monitor response times"
echo "4. Check database for normalized data"
echo ""
echo "Test Guide: STAGING_TEST_GUIDE_CACHE_BACKED.md"
echo ""
