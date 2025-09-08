# 🎯 LIVE QA CHECKLIST - STAGING VERIFICATION

## PRE-REQUISITE
- [x] Code deployed to staging
- [ ] **API server restarted** (REQUIRED - pending infra ticket)
- [ ] Routes active: `/api/feature-flags` and `/api/analytics/chat-events`

## STAGING URL
`https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.projects.builder.codes`

---

## 1. ✅ FEATURE FLAGS VERIFICATION

### Command:
```bash
curl -s https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.projects.builder.codes/api/feature-flags
```

### Expected Response (EXACT MATCH):
```json
{"AI_TRAFFIC":0.0,"AI_SHADOW":true,"AI_KILL_SWITCH":false,"AI_AUTO_SCALE":false,"ENABLE_CHAT_ANALYTICS":true,"MAX_BARGAIN_ROUNDS":3,"BARGAIN_TIMEOUT_SECONDS":30}
```

### Evidence to Capture:
- [ ] Raw JSON response
- [ ] Exact URL hit
- [ ] Timestamp of test

---

## 2. 📊 CHAT ANALYTICS HAR CAPTURE

### Flow to Execute:
1. Open Hotels: `https://...builder.codes/hotels/results`
2. Select any hotel → Click "Bargain Now"
3. Complete full flow: `chat_open → message_send → counter_offer → round_n → accepted/declined → closed`
4. Capture HAR file during the flow

### Required Events (in order):
- [ ] `chat_open` - payload includes: `module, entityId, rateKey, currency, base_total, sessionId, xRequestId`
- [ ] `message_send` - payload includes: `round, offer_value`
- [ ] `counter_offer` - payload includes: `round, counter_value`
- [ ] `round_n` - payload includes: `round, base_total, current_offer`
- [ ] `accepted` OR `declined` - payload includes: `final_total/last_offer, savings/reason`
- [ ] `closed` - payload includes: `round, close_reason`

### Evidence to Capture:
- [ ] Complete HAR file
- [ ] One JSON payload per event (mask PII)
- [ ] Verify all required fields present

---

## 3. 🎬 UI PARITY RECORDINGS (4 clips, 20-30s each)

### Modules to Test:
- [ ] **Hotels**: Open bargain → complete 1 round → verify Design Box + starting price = Results price
- [ ] **Flights**: Same verification
- [ ] **Sightseeing**: Same verification  
- [ ] **Transfers**: Same verification

### What to Verify in Each Recording:
- [ ] Design Box is identical across all modules
- [ ] Starting price in bargain modal matches Results page price
- [ ] UI components render consistently

---

## 4. 💰 PRICING TESTS (Live Request/Response)

### Test 1: Hotel - Base ₹10,000 + 5% markup + 10% promo (capped ₹1,000) × 3 nights

**Test Data:**
```json
{
  "module": "hotels",
  "baseFarePerNight": 10000,
  "nights": 3,
  "rooms": 1,
  "promoCode": "SAVE10PERCENT",
  "markupRuleId": 123
}
```

**Expected Response Elements:**
- [ ] Per-night price: ₹10,000
- [ ] Total nights: 3
- [ ] Subtotal: ₹30,000
- [ ] Markup (5%): ₹1,500
- [ ] Promo discount: ₹1,000 (capped, not 10% of ₹31,500)
- [ ] Final price calculation accurate

### Test 2: Flight - Route-specific markup + ₹300 fixed promo

**Test Data:**
```json
{
  "module": "flights",
  "baseFare": 25000,
  "promoCode": "FIXED300OFF",
  "route": {"from": "BOM", "to": "DXB"}
}
```

**Expected Response Elements:**
- [ ] Route-specific markup applied
- [ ] Fixed ₹300 discount applied
- [ ] Segment vs itinerary handling shown

### Test 3: Bargain Floor - Negotiated < floor → promo blocked

**Test Data:**
```json
{
  "module": "hotels",
  "baseFare": 8000,
  "negotiatedPrice": 6000,
  "promoCode": "EXTRAOFF"
}
```

**Expected Response:**
- [ ] Success: false
- [ ] Error: "Promo code blocked"
- [ ] User message: "Your negotiated price is below the minimum required for this promo. Please try a higher offer."

---

## 5. 🗄️ DATABASE & AUDIT PROOF

### Required Screenshots/SQL:
- [ ] `markup_rules` table inserts from test executions
- [ ] `promo_codes` table with test promo codes
- [ ] `promo_code_usage` entries from successful redemptions
- [ ] Audit log entry showing:
  - `booking_ref`
  - `markup_rule_id` 
  - `promo_redemption_id`
  - Final pricing breakdown

---

## 6. 📝 DEPLOYED COMMIT VERIFICATION

### Confirm these commit hashes are deployed:
- [ ] `api/routes/feature-flags.js`: `99c5cf57`
- [ ] `api/routes/analytics.js`: `1d864a1c`
- [ ] `client/services/chatAnalyticsService.ts`: `87f037b0`
- [ ] `client/components/ConversationalBargainModal.tsx`: `8e147f86`
- [ ] `client/components/ui/BargainButton.tsx`: `87f037b0`

---

## ✅ SIGN-OFF CRITERIA

All items below must be ✅ for final approval:

- [ ] Feature flags endpoint returns exact JSON match
- [ ] HAR shows all 6 chat events in correct order with valid payloads
- [ ] 4 recordings confirm identical Design Box + correct starting prices
- [ ] 3 pricing tests pass with expected responses
- [ ] DB rows and audit entries present and properly linked
- [ ] No rounding/currency drift across Results → Details → Bargain → Book → Invoice
- [ ] All commit hashes verified in deployed build

---

## 🚨 IMPORTANT NOTES

- **Auth Bypass**: Only active on staging for `/api/analytics/chat-events`
- **CORS**: Verify `builder.codes` origin is allowed for analytics posts
- **Traceability**: Log `xRequestId` end-to-end for debugging
- **PII Masking**: Ensure all captured payloads have personal data masked
