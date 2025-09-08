# 🎯 EXPECTED RESPONSES TEMPLATE

## 1. FEATURE FLAGS - EXACT MATCH REQUIRED

**URL**: `GET https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.projects.builder.codes/api/feature-flags`

**Expected Response**:
```json
{"AI_TRAFFIC":0.0,"AI_SHADOW":true,"AI_KILL_SWITCH":false,"AI_AUTO_SCALE":false,"ENABLE_CHAT_ANALYTICS":true,"MAX_BARGAIN_ROUNDS":3,"BARGAIN_TIMEOUT_SECONDS":30}
```

## 2. ANALYTICS TEST - SUCCESS CONFIRMATION

**URL**: `POST https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.projects.builder.codes/api/analytics/chat-events`

**Sample Request**:
```json
{
  "event": "chat_open",
  "payload": {
    "module": "hotels",
    "entityId": "hotel_123",
    "rateKey": "rate_abc",
    "currency": "INR",
    "base_total": 22705,
    "sessionId": "sess_x",
    "xRequestId": "req_x"
  }
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Analytics event tracked successfully",
  "event": "chat_open",
  "tracked_at": "2025-09-08T12:xx:xx.xxxZ"
}
```

## 3. SAMPLE CHAT EVENT PAYLOADS (for HAR comparison)

### chat_open
```json
{
  "event": "chat_open",
  "payload": {
    "module": "hotels",
    "entityId": "hotel_xxxxx",
    "rateKey": "rate_xxxxx",
    "currency": "INR",
    "base_total": 22705,
    "sessionId": "session_xxxxxxxxx",
    "userId": "user_xxxxx",
    "xRequestId": "req_xxxxxxxxx",
    "timestamp": 1725801234567
  }
}
```

### message_send
```json
{
  "event": "message_send",
  "payload": {
    "module": "hotels",
    "entityId": "hotel_xxxxx",
    "round": 1,
    "offer_value": 20000,
    "sessionId": "session_xxxxxxxxx",
    "xRequestId": "req_xxxxxxxxx",
    "timestamp": 1725801234568
  }
}
```

### counter_offer
```json
{
  "event": "counter_offer",
  "payload": {
    "module": "hotels",
    "entityId": "hotel_xxxxx",
    "round": 1,
    "counter_value": 21000,
    "sessionId": "session_xxxxxxxxx",
    "xRequestId": "req_xxxxxxxxx",
    "timestamp": 1725801234569
  }
}
```

### round_n
```json
{
  "event": "round_n",
  "payload": {
    "module": "hotels",
    "entityId": "hotel_xxxxx",
    "round": 2,
    "base_total": 22705,
    "current_offer": 21000,
    "sessionId": "session_xxxxxxxxx",
    "xRequestId": "req_xxxxxxxxx",
    "timestamp": 1725801234570
  }
}
```

### accepted
```json
{
  "event": "accepted",
  "payload": {
    "module": "hotels",
    "entityId": "hotel_xxxxx",
    "final_total": 21000,
    "savings": 1705,
    "sessionId": "session_xxxxxxxxx",
    "xRequestId": "req_xxxxxxxxx",
    "timestamp": 1725801234571
  }
}
```

### closed
```json
{
  "event": "closed",
  "payload": {
    "module": "hotels",
    "entityId": "hotel_xxxxx",
    "round": 2,
    "close_reason": "user_accepted",
    "sessionId": "session_xxxxxxxxx",
    "xRequestId": "req_xxxxxxxxx",
    "timestamp": 1725801234572
  }
}
```

## 4. PRICING TEST EXPECTED RESPONSES

### Hotel Test: ₹10,000 base + 5% markup + 10% promo (capped ₹1,000) × 3 nights

**Expected Response Structure**:
```json
{
  "success": true,
  "pricing": {
    "perNightPrice": 10000,
    "totalNights": 3,
    "roomsCount": 1,
    "subtotal": 30000,
    "markupAmount": 1500,
    "totalAfterMarkup": 31500,
    "taxes": 3780,
    "fees": 25,
    "totalBeforePromo": 35305,
    "promoDiscount": 1000,
    "finalPrice": 34305,
    "currency": "INR"
  },
  "markupRuleId": 123,
  "promoCodeApplied": "SAVE10PERCENT",
  "promoCapped": true,
  "capApplied": "Discount capped at ₹1,000 (would have been ₹3,150)"
}
```

### Flight Test: Route markup + ₹300 fixed promo

**Expected Response Structure**:
```json
{
  "success": true,
  "pricing": {
    "basePrice": 25000,
    "markupAmount": 2000,
    "totalAfterMarkup": 27000,
    "promoDiscount": 300,
    "finalPrice": 26700,
    "currency": "INR"
  },
  "markupRuleId": 456,
  "promoCodeApplied": "FIXED300OFF",
  "segmentHandling": "Applied to total itinerary price"
}
```

### Bargain Floor Test: Negotiated < floor → blocked

**Expected Response**:
```json
{
  "success": false,
  "error": "Promo code blocked",
  "message": "Your negotiated price is below the minimum required for this promo. Please try a higher offer.",
  "userMessage": "Your negotiated price is below the minimum required for this promo. Please try a higher offer.",
  "negotiatedPrice": 6000,
  "requiredMinimum": 8800,
  "promoCode": "EXTRAOFF"
}
```

## 5. DATABASE EVIDENCE EXPECTED

### markup_rules insert
```sql
INSERT INTO pricing_markup_rules (module, destination, markup_type, markup_value, status, created_at)
VALUES ('hotels', 'DXB', 'percentage', 5.00, 'active', '2025-09-08 12:30:00');
```

### promo_codes insert  
```sql
INSERT INTO promo_codes (code, type, value, max_discount, status, valid_from, valid_to)
VALUES ('SAVE10PERCENT', 'percent', 10.00, 1000.00, 'active', '2025-01-15', '2025-12-31');
```

### promo_code_usage insert
```sql
INSERT INTO promo_code_usage (promo_code_id, user_id, booking_ref, discount_amount, original_price, final_price, created_at)
VALUES (7, 'user-uuid-xxx', 'BK_HTL_20250908_001', 1000.00, 35305.00, 34305.00, '2025-09-08 12:35:00');
```

### Audit log entry
```json
{
  "audit_id": "audit_20250908_001",
  "booking_ref": "BK_HTL_20250908_001",
  "user_id": "user-uuid-xxx", 
  "action": "pricing_calculated",
  "details": {
    "markup_rule_id": 123,
    "promo_redemption_id": "PROMO_20250908_001",
    "markup_applied": 1500.00,
    "promo_discount": 1000.00,
    "final_price": 34305.00
  },
  "timestamp": "2025-09-08T12:35:00Z"
}
```
