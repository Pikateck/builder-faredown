#!/bin/bash

# TBO Hotel Booking Scenario Test Runner
# Run from: ~/project/src/api/
# Usage: bash run-scenarios.sh

echo "=========================================="
echo "TBO Hotel Booking - 8 Scenario Test Suite"
echo "=========================================="
echo ""

RESULTS=()
CONFIRMATIONS=()

for i in {1..8}; do
  echo "Running Scenario $i..."
  echo "──────────────────────��──────────────────"
  
  OUTPUT=$(node test-scenario-$i.js 2>&1)
  CONFIRMATION=$(echo "$OUTPUT" | grep '"confirmationNo"' | grep -o '"[^"]*"' | tail -1 | tr -d '"')
  
  if echo "$OUTPUT" | grep -q '"status": "PASSED"'; then
    STATUS="✅ PASSED"
    CONFIRMATIONS+=("Scenario $i: $CONFIRMATION")
  else
    STATUS="❌ FAILED"
    CONFIRMATIONS+=("Scenario $i: NO CONFIRMATION")
  fi
  
  echo "$OUTPUT" | tail -10
  echo ""
  RESULTS+=("Scenario $i: $STATUS")
done

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
for result in "${RESULTS[@]}"; do
  echo "$result"
done

echo ""
echo "CONFIRMATIONS"
echo "=========================================="
for conf in "${CONFIRMATIONS[@]}"; do
  echo "$conf"
done
