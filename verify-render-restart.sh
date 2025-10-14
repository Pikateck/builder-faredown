#!/bin/bash

echo "🔍 Verifying Render Service After Restart"
echo "========================================="
echo ""

ADMIN_KEY="8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1"
API_BASE="https://builder-faredown-pricing.onrender.com"

echo "1️⃣ Testing Admin Suppliers Endpoint..."
echo "----------------------------------------"
SUPPLIERS_RESPONSE=$(curl -s -H "X-Admin-Key: $ADMIN_KEY" "$API_BASE/api/admin/suppliers")
echo "$SUPPLIERS_RESPONSE" | head -20
echo ""

if echo "$SUPPLIERS_RESPONSE" | grep -q "\"success\":true"; then
  echo "✅ PASS: /api/admin/suppliers working"
else
  echo "❌ FAIL: /api/admin/suppliers still broken"
fi
echo ""

echo "2️⃣ Testing Supplier Health Endpoint..."
echo "----------------------------------------"
HEALTH_RESPONSE=$(curl -s -H "X-Admin-Key: $ADMIN_KEY" "$API_BASE/api/admin/suppliers/health")
echo "$HEALTH_RESPONSE" | head -20
echo ""

if echo "$HEALTH_RESPONSE" | grep -q "\"success\":true"; then
  echo "✅ PASS: /api/admin/suppliers/health working"
else
  echo "❌ FAIL: /api/admin/suppliers/health broken"
fi
echo ""

echo "3️⃣ Testing RateHawk Hotel Search..."
echo "----------------------------------------"
HOTELS_RESPONSE=$(curl -s "$API_BASE/api/hotels/search?destination=Dubai&checkIn=2025-12-01&checkOut=2025-12-05&rooms=%5B%7B%22adults%22%3A2%7D%5D")
echo "$HOTELS_RESPONSE" | grep -o '"RATEHAWK":{[^}]*}' | head -5
echo ""

if echo "$HOTELS_RESPONSE" | grep -q '"RATEHAWK":{"success":true'; then
  echo "✅ PASS: RateHawk circuit breaker reset, returning results"
elif echo "$HOTELS_RESPONSE" | grep -q '"RATEHAWK":.*"Circuit breaker is OPEN"'; then
  echo "⚠️ WAIT: RateHawk circuit breaker still open (will auto-reset in 30s)"
else
  echo "❌ FAIL: RateHawk not responding"
fi
echo ""

echo "4️⃣ Testing Amadeus Flight Search..."
echo "----------------------------------------"
FLIGHTS_RESPONSE=$(curl -s "$API_BASE/api/flights/search?origin=BOM&destination=DXB&departureDate=2025-11-15&adults=1")
echo "$FLIGHTS_RESPONSE" | grep -o '"AMADEUS":{[^}]*}' | head -5
echo ""

if echo "$FLIGHTS_RESPONSE" | grep -q '"AMADEUS":{"success":true'; then
  echo "✅ PASS: Amadeus working"
else
  echo "⚠️ WAIT: Amadeus may need env var check"
fi
echo ""

echo "========================================="
echo "🎯 Next Steps:"
echo ""
echo "If all tests pass:"
echo "  1. Open Admin UI: https://spontaneous-biscotti-da44bc.netlify.app/admin"
echo "  2. Go to Supplier Management"
echo "  3. Take screenshots of:"
echo "     - Network tab (showing X-Admin-Key header + 200 responses)"
echo "     - Supplier Management table (all suppliers visible)"
echo "     - Supplier health metrics"
echo ""
echo "If tests fail:"
echo "  1. Check Render environment variables"
echo "  2. Wait 30 seconds for circuit breakers to auto-reset"
echo "  3. Re-run this script"
