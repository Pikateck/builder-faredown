# Bargain Engine - Phase A Deployment Guide

## 🎯 Overview

This guide covers the complete deployment of the **module-specific Bargain Engine Phase A**:
- ✅ Database schema with 5 tables
- ✅ Backend APIs (public + admin)
- ✅ Admin panel UI
- ✅ Frontend modal integration (hotels + flights)
- ✅ Analytics tracking

**No UI redesign** - only text, logic, and backend changes.

---

## 📋 Phase A Deliverables

### 1. Database Migration

**File**: `api/database/migrations/20250219_bargain_engine.sql`

**Tables Created**:
- `bargain_settings` - Per-module configuration
- `bargain_market_rules` - Country/city overrides
- `bargain_sessions` - Runtime session tracking
- `bargain_events_raw` - Analytics events
- `price_match_tickets` - Price match requests (Hotels only)

**Seed Data**:
- **Hotels**: 2 attempts, 30s timers
- **Flights**: 1 attempt, 15s timer
- **Sightseeing**: 1 attempt, 20s timer
- **Transfers**: 1 attempt, 20s timer
- **Packages**: 0 attempts (assisted mode)
- **Add-ons**: 0 attempts (disabled)

---

### 2. Backend Services

**Files Created**:
- `api/services/bargainEngine.js` - Core business logic
- `api/routes/bargain.js` - Public APIs
- `api/routes/admin-bargain.js` - Admin APIs

**Files Modified**:
- `api/server.js` - Added route registrations

**Public Endpoints**:
```
GET  /api/bargain/settings?module=hotels
POST /api/bargain/start
POST /api/bargain/submit-r1
POST /api/bargain/submit-r2
POST /api/bargain/action-r1
POST /api/bargain/select
POST /api/bargain/hold
POST /api/bargain/abandon
```

**Admin Endpoints**:
```
GET    /api/admin/bargain/settings
GET    /api/admin/bargain/settings/:module
PUT    /api/admin/bargain/settings/:module
GET    /api/admin/bargain/market-rules
POST   /api/admin/bargain/market-rules
DELETE /api/admin/bargain/market-rules/:id
GET    /api/admin/bargain/analytics/summary
```

---

### 3. Frontend Services

**Files Created**:
- `client/services/bargainSettingsService.ts` - Public settings fetch
- `client/services/adminBargainService.ts` - Admin management
- `client/pages/admin/BargainSettings.tsx` - Admin panel UI

**Key Features**:
- Module-aware settings fetch with caching
- Default fallback settings for each module
- Copy text template formatting
- Admin CRUD operations

---

### 4. Admin Panel

**Route**: `/admin/bargain-settings`

**Features**:
- ✅ Tab per module (Hotels, Flights, Sightseeing, Transfers, Packages, Add-ons)
- ✅ Real-time analytics summary (last 7 days)
- ✅ Enable/disable toggle per module
- ✅ Configurable attempts (0/1/2)
- ✅ Timer settings (R1, R2)
- ✅ Discount range (min/max %)
- ✅ "Recommended" badge toggle + label
- ✅ Copy text overrides (R1 CTA, R2 labels, expiry message)
- ✅ Price match toggle (Hotels only)
- ✅ Save with versioning (tracks editor + timestamp)

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration

```bash
cd /workspace
node api/database/run-bargain-migration.js
```

**Expected Output**:
```
🚀 Starting Bargain Engine migration...
📄 Executing migration SQL...
✅ Migration completed successfully!

🔍 Verifying created tables...
📊 Created tables:
   ✓ bargain_events_raw
   ✓ bargain_market_rules
   ✓ bargain_sessions
   ✓ bargain_settings
   ✓ price_match_tickets

🌱 Verifying seed data...
📋 Module settings:
   hotels       - ✓ Enabled | Attempts: 2 | R1: 30s | R2: 30s
   flights      - ✓ Enabled | Attempts: 1 | R1: 15s | R2: 0s
   sightseeing  - ✓ Enabled | Attempts: 1 | R1: 20s | R2: 20s
   transfers    - ✓ Enabled | Attempts: 1 | R1: 20s | R2: 20s
   packages     - ✗ Disabled | Attempts: 0 | R1: 30s | R2: 0s
   addons       - ✗ Disabled | Attempts: 0 | R1: 0s | R2: 0s

🎉 Bargain Engine database is ready!
```

---

### Step 2: Verify API Endpoints

**Test Public Settings API**:
```bash
curl "https://builder-faredown-pricing.onrender.com/api/bargain/settings?module=hotels"
```

**Expected Response**:
```json
{
  "enabled": true,
  "attempts": 2,
  "r1_timer_sec": 30,
  "r2_timer_sec": 30,
  "show_recommended_badge": true,
  "recommended_label": "Recommended",
  "show_standard_price_on_expiry": true,
  "copy": {
    "r1_primary": "Book ₹{price}",
    "r1_secondary": "Try Final Bargain",
    "r2_card_low": "Book ₹{price} (Best price)",
    "r2_card_high": "Book ₹{price}",
    "expiry_text": "⌛ Time's up. This price is no longer available.",
    "expiry_cta": "Book at Standard Price ₹{base}",
    "recommended_label": "Recommended"
  }
}
```

**Test Admin API (requires auth)**:
```bash
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  "https://builder-faredown-pricing.onrender.com/api/admin/bargain/settings"
```

---

### Step 3: Access Admin Panel

1. Navigate to: `https://spontaneous-biscotti-da44bc.netlify.app/admin/bargain-settings`
2. Login with admin credentials
3. Verify all 6 module tabs are visible
4. Check default settings match seed data
5. Test save functionality

---

### Step 4: Integration Testing

**Hotels Flow** (2 attempts):
1. Open hotel bargain modal
2. Submit Round 1 bid
3. Wait for counter-offer
4. Click "Try Final Bargain"
5. Submit Round 2 bid
6. See dual price buttons: "Book ₹R1 (Recommended)" + "Book ₹R2"
7. Select lower price → "Recommended" badge visible
8. Timer expires without selection → shows "Book at Standard Price ₹{base}"

**Flights Flow** (1 attempt):
1. Open flight bargain modal
2. Submit bid
3. See single "Book ₹{price}" button
4. Or skip with "Skip bargain" secondary button
5. Timer expires → shows "Book at Standard Price ₹{base}"

---

## ✅ QA Acceptance Checklist

### Database
- [ ] All 5 tables created successfully
- [ ] Seed data inserted for all 6 modules
- [ ] Indexes created on bargain_sessions and bargain_events_raw
- [ ] Foreign keys working (bargain_events_raw → bargain_sessions)

### Backend APIs

**Public Endpoints**:
- [ ] `GET /bargain/settings?module=hotels` returns correct settings
- [ ] `GET /bargain/settings?module=flights` returns correct settings
- [ ] `POST /bargain/start` creates session and returns sessionId
- [ ] `POST /bargain/submit-r1` calculates counter-offer
- [ ] `POST /bargain/submit-r2` works for hotels only
- [ ] `POST /bargain/select` records selected price
- [ ] `POST /bargain/abandon` marks session as abandoned

**Admin Endpoints**:
- [ ] `GET /admin/bargain/settings` lists all modules
- [ ] `PUT /admin/bargain/settings/:module` saves changes
- [ ] `GET /admin/bargain/analytics/summary` returns metrics
- [ ] Admin endpoints require authentication

### Admin Panel UI
- [ ] All 6 module tabs visible (Hotels, Flights, etc.)
- [ ] Each tab shows correct default settings
- [ ] Enable/disable toggle works
- [ ] Attempts dropdown (0/1/2) works
- [ ] Timer inputs validate (min: 5, max: 120)
- [ ] Discount range validates (min ≤ max)
- [ ] Copy text fields accept placeholders ({price}, {base})
- [ ] Save button updates database
- [ ] Success message displays after save
- [ ] Analytics summary shows last 7 days data
- [ ] Reset button restores original values
- [ ] Hotels shows "Price Match" toggle
- [ ] Other modules hide "Price Match" toggle

### Frontend Integration

**Hotels**:
- [ ] Bargain modal opens without errors
- [ ] Round 1 timer uses `r1_timer_sec` from settings
- [ ] Round 2 timer uses `r2_timer_sec` from settings
- [ ] Button text matches `copy_json` settings
- [ ] "Recommended" badge shows on lower price
- [ ] Timer expiry shows fallback CTA (if enabled)
- [ ] No duplicate buttons
- [ ] No clipping on mobile

**Flights**:
- [ ] Single attempt flow works
- [ ] Timer is 15 seconds (configurable via admin)
- [ ] Button text: "Book ₹{price}" and "Skip bargain"
- [ ] Expiry shows fallback CTA

### Analytics
- [ ] Events logged to `bargain_events_raw` table
- [ ] Session tracked in `bargain_sessions` table
- [ ] Analytics summary aggregates correctly
- [ ] Module field included in all events

### Mobile Responsiveness
- [ ] iPhone 14/16 Safari: footer visible, no clipping
- [ ] iPhone 14/16 Chrome: keyboard doesn't hide CTA
- [ ] Android Chrome: buttons always visible
- [ ] Samsung browser: no inner scroll in modal

---

## 📊 Analytics Events

All events include: `module`, `productId`, `basePrice`, `device`, `browser`, `sessionId`

**Event Flow**:
1. `bargain_opened` - Modal opened
2. `bargain_round1_bid_submitted` - R1 bid submitted
3. `bargain_round1_offer_shown` - R1 counter-offer shown
4. `bargain_round1_action` - User action: book | try_final | skip | timeout
5. `bargain_round2_bid_submitted` - R2 bid submitted (hotels only)
6. `bargain_round2_offer_shown` - R2 counter-offer shown
7. `bargain_price_selected` - User selected r1 or r2
8. `bargain_timer_expired_no_selection` - Timer expired without selection
9. `booking_started` - Booking initiated with chosen price
10. `booking_completed` - Booking successful

---

## 🔧 Troubleshooting

### Migration Fails
**Issue**: Table already exists
**Solution**: Tables have `IF NOT EXISTS` guards - safe to re-run

**Issue**: Foreign key constraint error
**Solution**: Ensure `bargain_sessions` table exists before `bargain_events_raw`

### Admin API Returns 401
**Issue**: Not authenticated
**Solution**: Ensure `Authorization: Bearer <token>` header is set

### Settings Not Loading in Modal
**Issue**: API call failing
**Solution**: Check browser console, verify API endpoint is accessible

### Timer Not Working
**Issue**: Settings not fetched
**Solution**: Check `bargainSettingsService.getSettings()` is called on modal open

---

## 📝 Next Steps (Phase B)

- [ ] Sightseeing/Transfers full implementation
- [ ] Packages assisted mode (ticket creation)
- [ ] Price match intake UI (Hotels)
- [ ] Market overrides UI
- [ ] A/B testing framework
- [ ] Advanced analytics dashboards

---

## 🚀 Deployment Checklist

- [ ] Run migration: `node api/database/run-bargain-migration.js`
- [ ] Verify all tables created
- [ ] Test public API endpoints
- [ ] Test admin API endpoints
- [ ] Access admin panel UI
- [ ] Test Hotels flow (2 attempts)
- [ ] Test Flights flow (1 attempt)
- [ ] Test mobile responsiveness
- [ ] Verify analytics tracking
- [ ] Document any issues
- [ ] Share PR with team

---

**✅ Phase A Complete When All Checklist Items Pass**

For questions or issues, contact: Engineering Team
Migration Date: 2025-02-19
Version: 1.0.0
