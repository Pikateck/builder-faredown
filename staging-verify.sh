#!/bin/bash

echo "🚀 STAGING QA VERIFICATION SCRIPT"
echo "=================================="

STAGING_URL="https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.projects.builder.codes"

echo ""
echo "1. Testing Feature Flags Endpoint..."
echo "URL: ${STAGING_URL}/api/feature-flags"
echo "Expected: {\"AI_TRAFFIC\":0.0,\"AI_SHADOW\":true,\"AI_KILL_SWITCH\":false,\"AI_AUTO_SCALE\":false,\"ENABLE_CHAT_ANALYTICS\":true,\"MAX_BARGAIN_ROUNDS\":3,\"BARGAIN_TIMEOUT_SECONDS\":30}"
echo ""
curl -s "${STAGING_URL}/api/feature-flags" | jq . || echo "❌ Feature flags endpoint failed"

echo ""
echo "2. Testing Analytics Events Endpoint..."
echo "URL: ${STAGING_URL}/api/analytics/chat-events"
echo ""
curl -s -X POST "${STAGING_URL}/api/analytics/chat-events" \
 -H "Content-Type: application/json" \
 -d '{"event":"chat_open","payload":{"module":"hotels","entityId":"hotel_123","rateKey":"rate_abc","currency":"INR","base_total":22705,"sessionId":"sess_x","xRequestId":"req_x"}}' | jq . || echo "❌ Analytics endpoint failed"

echo ""
echo "3. Testing API Health..."
echo "URL: ${STAGING_URL}/api"
echo ""
curl -s "${STAGING_URL}/api" | jq . || echo "❌ API root failed"

echo ""
echo "✅ Verification complete. Check results above."
