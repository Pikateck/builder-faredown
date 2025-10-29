# Price Consistency Testing Guide

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

All 4 critical integrations are fully implemented and ready for testing:

1. ✅ HotelCard.tsx - Captures price snapshot on View Details
2. ✅ HotelDetails.tsx - Verifies checksum on Details page
3. ✅ ConversationalBargainModal.tsx - Updates price with bargain delta
4. ✅ HotelBooking.tsx - Verifies price before checkout

---

## 🧪 TESTING MATRIX

### Test Scenario 1: Non-Refundable Room (No Promo, No Bargain)

**Setup:**

- Search for Dubai hotel
- Select a non-refundable room
- Do NOT apply promo
- Do NOT use bargain

**Expected Prices Match:**

1. **SEARCH**: Results page shows: ₹2,456 (example)
2. **DETAILS**: Room price shows: ₹2,456
3. **BARGAIN**: Skip (no bargain applied)
4. **BOOK**: Book page shows: ₹2,456
5. **INVOICE**: Confirmation shows: ₹2,456

**Verification Steps:**

1. Go to `/hotels/results?destination=DXB&...`
   - [ ] View hotel card price
   - [ ] Open browser console: `[PRICE_PIPELINE] SEARCH:` shows price, checksum
   - [ ] Take screenshot of results page price

2. Click "View Details"
   - [ ] Navigate to `/hotels/{hotelId}`
   - [ ] Console shows: `[PRICE_PIPELINE] DETAILS:` with same checksum
   - [ ] Price displayed matches Results page
   - [ ] Take screenshot of details page price

3. Skip bargain (or decline)
   - [ ] Proceed directly to Book page

4. Click "Book Now" at checkout
   - [ ] Console shows: `[PRICE_PIPELINE] BOOK:` with VALID checksum
   - [ ] No error: "Price has changed"
   - [ ] Proceeds to confirmation
   - [ ] Take screenshot of book page price

5. View Confirmation/Invoice
   - [ ] Console shows: `[PRICE_PIPELINE] INVOICE:`
   - [ ] Price shows same ₹2,456
   - [ ] Invoice generated with matching total
   - [ ] Take screenshot of invoice

**Success Criteria:**

- ✅ All 5 screenshots show identical price ₹2,456
- ✅ Console shows valid checksums at every stage
- ✅ No "Price has changed" errors
- ✅ Refundability displayed consistently (Non-Refundable badge)

---

### Test Scenario 2: Refundable Room with Promo + Bargain

**Setup:**

- Search for Dubai hotel
- Select a refundable room
- Apply promo code (if available) for 5% discount
- Use bargain to negotiate down 10% more

**Expected Prices Match:**

1. **SEARCH**: Results shows: ₹2,456
2. **DETAILS**: Room shows: ₹2,456
3. **BARGAIN**:
   - Start: ₹2,456
   - After negotiation: ₹2,210 (10% discount)
4. **BOOK**: Shows ₹2,210
5. **INVOICE**: Confirms ₹2,210

**Verification Steps:**

1. **SEARCH Stage**:
   - Open results at `/hotels/results?destination=DXB&...`
   - Find refundable hotel (green "Free Cancellation" badge)
   - Note price in card: ₹2,456
   - Console: `[PRICE_PIPELINE] SEARCH: grandTotal=2456, checksum=abc123`
   - 📸 Screenshot: Results page with price

2. **DETAILS Stage**:
   - Click "View Details"
   - Verify refundable badge shows "Free Cancellation"
   - Check cancellation policy displayed
   - Price still shows ₹2,456
   - Console: `[PRICE_PIPELINE] DETAILS: checksum=abc123 (matches)`
   - 📸 Screenshot: Details page with refundable badge + price

3. **PROMO Stage** (optional):
   - If promo available: Apply promo code
   - Price updates to: ₹2,333 (5% off)
   - Console: `[PRICE_PIPELINE] Updated price snapshot: promoApplied={code: XYZ, discount: 123}`
   - 📸 Screenshot: Details with promo applied

4. **BARGAIN Stage**:
   - Click "Bargain Now"
   - Modal shows current price: ₹2,456 (or ₹2,333 if promo applied)
   - User suggests: ₹2,200
   - System responds with counter: ₹2,210 (e.g.)
   - User accepts: ₹2,210
   - Console shows 3 logs:
     - `[PRICE_PIPELINE] BARGAIN: round=1, bargainApplied={discount: 246}`
     - `[PRICE_PIPELINE] BARGAIN: round=2, bargainApplied={discount: 246}`
     - `[PRICE_PIPELINE] Updated price snapshot: grandTotal=2210`
   - 📸 Screenshot: Bargain modal showing negotiated price ₹2,210

5. **BOOK Stage**:
   - Proceed to Book page
   - Book page shows final price: ₹2,210
   - Complete guest details
   - Click "Complete Booking"
   - Console: `[PRICE_PIPELINE] BOOK: grandTotal=2210, bargainRound=2`
   - Check: No error about price drift
   - 📸 Screenshot: Book page with final price ₹2,210

6. **INVOICE Stage**:
   - Navigate to confirmation page
   - Confirmation shows breakdown:
     - Original: ₹2,456
     - Promo discount: -₹123 (if applied)
     - Bargain discount: -₹246
     - **Final: ₹2,087 or ₹2,210** (depending on promo)
   - Console: `[PRICE_PIPELINE] INVOICE: grandTotal=2210`
   - 📸 Screenshot: Invoice with full breakdown

**Success Criteria:**

- ✅ All 6 screenshots show progression: 2456 → 2456 → 2333 (promo) → 2210 (bargain) → 2210 → 2210
- ✅ Console shows:
  - SEARCH: checksum=abc123
  - DETAILS: checksum=abc123 (VERIFIED)
  - BARGAIN: checksum updated with bargainApplied
  - BOOK: checksum still valid (no drift)
  - INVOICE: final amount matches
- ✅ No "Price has changed" errors
- ✅ Refundability shows consistently (Free Cancellation badge)
- ✅ Cancellation policy text consistent
- ✅ Promo + Bargain discounts stack correctly

---

## 📊 CONSOLE LOGGING VERIFICATION

### Expected Console Output for Test Scenario 1:

```
[PRICE_PIPELINE] SEARCH: roomKey=hotel-123-room-456, rateKey=..., grandTotal=2456, checksum=abc123d4
[PRICE_PIPELINE_VERIFIED] Checksum valid on Details page
[PRICE_PIPELINE] DETAILS: roomKey=hotel-123-room-456, grandTotal=2456, checksum=abc123d4
[PRICE_PIPELINE] BOOK: roomKey=hotel-123-room-456, grandTotal=2456, checksum=abc123d4
[PRICE_PIPELINE] INVOICE: roomKey=hotel-123-room-456, grandTotal=2456, checksum=abc123d4
```

### Expected Console Output for Test Scenario 2 (with Bargain):

```
[PRICE_PIPELINE] SEARCH: roomKey=hotel-123-room-456, grandTotal=2456, checksum=abc123d4
[PRICE_PIPELINE] DETAILS: roomKey=hotel-123-room-456, grandTotal=2456, checksum=abc123d4
[PRICE_PIPELINE] BARGAIN: round=1, grandTotal=2200 (negotiation started)
[PRICE_PIPELINE] BARGAIN: round=2, bargainApplied={originalTotal: 2456, bargainedTotal: 2210, discount: 246, round: 2}
Updated price snapshot: roomKey=hotel-123-room-456, grandTotal=2210, checksum=xyz789a0
[PRICE_PIPELINE] BOOK: roomKey=hotel-123-room-456, grandTotal=2210, checksum=xyz789a0
[PRICE_PIPELINE] INVOICE: roomKey=hotel-123-room-456, grandTotal=2210, bargainApplied.round=2
```

---

## ⚠️ ERROR CASES TO TEST

### Hard Stop: Price Drift at Checkout

**Scenario**:

- Price changes between Details and Book (e.g., inventory update, currency fluctuation)
- Checksum mismatch detected

**Expected Behavior**:

```
[PRICE_PIPELINE] Price drift detected: original=2456, recalculated=2400, drift=56
Alert: "Price has changed by ₹56.00. Please review and try again."
[PRICE_PIPELINE] BOOK_FAILED_CHECKSUM: ...
Navigate back to Details (checkout blocked)
```

### Hard Stop: No Price Snapshot

**Scenario**:

- User navigates directly to Book page without selecting room in Details
- No priceSnapshot in context

**Expected Behavior**:

```
[PRICE_PIPELINE] No price snapshot available at checkout
Warning in console, but booking proceeds (graceful fallback)
```

---

## 🎯 ACCEPTANCE CRITERIA

✅ **All prices match across 5 stages** for both test scenarios
✅ **Console shows valid checksums** at every stage
✅ **No price change errors** for normal flow (drift < 0.01)
✅ **Checkout blocked** if price drift > 0.01
✅ **Refundability displayed consistently** (badge + policy text)
✅ **Promo + Bargain discounts stack** correctly
✅ **Checksum updates** when bargain applied
✅ **Room selection locked** (can't switch rooms without resetting price)
✅ **Invoice matches final price** in Book page

---

## 🚀 DEPLOYMENT CHECKLIST

Before going to production:

- [ ] Run Test Scenario 1 (non-refundable, no promo, no bargain)
  - [ ] Capture 5 screenshots (Search → Details → Book → Invoice)
  - [ ] Verify console checksums match
  - [ ] Confirm all prices identical

- [ ] Run Test Scenario 2 (refundable, with bargain)
  - [ ] Capture 6 screenshots (Search → Details → Bargain → Book → Invoice)
  - [ ] Verify promo + bargain discounts stack
  - [ ] Confirm final prices consistent

- [ ] Test error cases
  - [ ] Manually change price in DevTools and try checkout
  - [ ] Verify "Price has changed" error blocks checkout

- [ ] Test currency switching
  - [ ] Start in INR, switch to USD mid-flow
  - [ ] Verify FX rate applied correctly
  - [ ] Checksum recalculated

- [ ] Test mobile responsiveness
  - [ ] All 5 stages visible and correct on mobile
  - [ ] Prices readable, no truncation

- [ ] Verify Netlify deployment
  - [ ] Live build has PriceContext
  - [ ] All console logs visible in production
  - [ ] No build errors

---

## 📝 NOTES FOR DEVELOPERS

1. **PriceSnapshot Lifecycle**:
   - Created at SEARCH stage (View Details click)
   - Locked at DETAILS stage (checksum verified)
   - Updated at BARGAIN stage (bargainApplied added)
   - Verified at BOOK stage (integrity check)
   - Confirmed at INVOICE stage (final display)

2. **Checksum is for**:
   - Detecting accidental price changes
   - Preventing stale data display
   - Tracking when bargain applied
   - NOT a payment security mechanism (use real crypto hashing in production)

3. **Currency Conversion**:
   - FX rate applied at createPriceSnapshot time
   - If currency changes: reset priceSnapshot, recalculate from scratch
   - Checksum recalculated with new FX rate

4. **Mock Data**:
   - priceCalculationService handles both live API and mock data
   - Same logic applies regardless of supplier
   - roomKey format: `{hotelId}-{roomId}` for uniqueness

---

## 🔗 FILES MODIFIED

1. `client/contexts/PriceContext.tsx` - CREATED
2. `client/services/priceCalculationService.ts` - CREATED
3. `client/App.tsx` - Added PriceProvider
4. `client/components/HotelCard.tsx` - Added snapshot capture
5. `client/pages/HotelDetails.tsx` - Added checksum verification
6. `client/components/ConversationalBargainModal.tsx` - Added price update
7. `client/pages/HotelBooking.tsx` - Added price verification

---

## ✅ IMPLEMENTATION COMPLETE

Ready for testing. All 4 integrations deployed and ready to verify end-to-end price consistency.
