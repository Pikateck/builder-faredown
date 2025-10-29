# Price Consistency Fix - Complete Implementation Guide

## ✅ COMPLETED (3 files created)

### 1. PriceContext.tsx (client/contexts/PriceContext.tsx)
- Provides single source of truth for price data
- PriceSnapshot interface with all required fields
- calculateChecksum() for drift detection
- updatePrice() for consistent recalculation
- Uses: `const price = usePriceContext();`

### 2. priceCalculationService.ts (client/services/priceCalculationService.ts)
- Unified price calculation with consistent 2-decimal rounding
- createPriceSnapshot() - main function to create snapshot
- calculateGrandTotal() - order: base + taxes + fees + markups - discounts
- verifyPriceIntegrity() - detects price drift
- logPricePipeline() - PRICE_PIPELINE logging for each stage
- formatPriceDisplay() - consistent formatting with currency symbols

### 3. App.tsx (updated)
- Added PriceProvider wrapper around entire app
- PriceContext now available to all components

---

## ⏳ REMAINING CRITICAL INTEGRATIONS

### 4. HotelResults.tsx - Capture Price Snapshot

**When user clicks "View Details" on hotel card:**
```typescript
import { usePriceContext } from "@/contexts/PriceContext";
import { createPriceSnapshot, logPricePipeline } from "@/services/priceCalculationService";

// In the click handler when user selects a hotel:
const { setPriceSnapshot } = usePriceContext();

const snapshot = createPriceSnapshot(
  roomKey: `${hotel.id}-${room.id}`, // Unique identifier
  rateKey: room.rateKey || "mock-rate",
  supplierCode: supplier || "MOCK",
  checkInDate: checkInParam,
  checkOutDate: checkOutParam,
  components: {
    basePrice: room.pricePerNight * nights,
    taxes: room.taxes || 0,
    fees: room.fees || 0,
    markupHedge: room.markup || 0,
    moduleMarkup: 0,
    nights: nights,
    currency: currency,
  },
  refundability: room.isRefundable ? "refundable" : "non-refundable",
  cancellationRules: room.cancellationPolicy || "",
  roomType: room.name || "",
  mealPlan: room.boardType || undefined
);

snapshot.checksum = calculateChecksum(snapshot); // From PriceContext
setPriceSnapshot(snapshot);
logPricePipeline("SEARCH", snapshot);

// Then navigate to details
navigate(`/hotels/${hotelId}`, { state: { priceSnapshot: snapshot } });
```

**Key requirements:**
- Capture exact room before navigation
- Lock room selection to this roomKey + rateKey
- Log PRICE_PIPELINE at SEARCH stage
- Pass snapshot through navigation state

---

### 5. HotelDetails.tsx - Use PriceContext

**In useEffect when component loads:**
```typescript
import { usePriceContext } from "@/contexts/PriceContext";
import { logPricePipeline, verifyPriceIntegrity } from "@/services/priceCalculationService";

const { priceSnapshot, setPriceSnapshot, verifyChecksum } = usePriceContext();

// On mount, verify snapshot exists
useEffect(() => {
  if (priceSnapshot) {
    // Verify checksum
    if (!verifyChecksum(priceSnapshot)) {
      console.error("[PRICE_PIPELINE] Checksum mismatch on Details page!");
      // Reset to prevent inconsistency
      setPriceSnapshot(null);
    } else {
      logPricePipeline("DETAILS", priceSnapshot);
    }
  }
}, [priceSnapshot, verifyChecksum, setPriceSnapshot]);

// When rendering room price, use:
const roomPrice = priceSnapshot?.grandTotal || calculatePrice(...);

// CRITICAL: Lock room selection
// If user tries to select a different room, reset snapshot
const handleRoomSelection = (newRoom) => {
  if (priceSnapshot) {
    console.warn("[PRICE_PIPELINE] Room changed - resetting price snapshot");
    setPriceSnapshot(null);
  }
  // Then select new room
};
```

**Display the price:**
- Use `priceSnapshot.grandTotal` for total price
- Use `formatPriceDisplay(price, currency, true, nights)` for "per night" display
- Show checksum in debug logs: `console.log("[PRICE_DEBUG]", priceSnapshot.checksum)`

---

### 6. ConversationalBargainModal.tsx - Update Price with Bargain Delta

**When user accepts bargain offer:**
```typescript
import { usePriceContext } from "@/contexts/PriceContext";
import { logPricePipeline } from "@/services/priceCalculationService";

const { priceSnapshot, updatePrice, verifyChecksum } = usePriceContext();

const handleBargainAccepted = (bargainRound: number, bargainedPrice: number) => {
  if (!priceSnapshot) {
    console.error("[PRICE_PIPELINE] No price snapshot available for bargain!");
    return;
  }

  // Verify snapshot still valid
  if (!verifyChecksum(priceSnapshot)) {
    console.error("[PRICE_PIPELINE] Checksum mismatch - cannot apply bargain!");
    return;
  }

  const bargainDiscount = priceSnapshot.grandTotal - bargainedPrice;

  // Update context with bargain info
  updatePrice({
    bargainApplied: {
      originalTotal: priceSnapshot.grandTotal,
      bargainedTotal: bargainedPrice,
      discount: bargainDiscount,
      round: bargainRound,
      appliedAt: new Date().toISOString(),
    },
    grandTotal: bargainedPrice,
  });

  logPricePipeline("BARGAIN", {
    ...priceSnapshot,
    grandTotal: bargainedPrice,
    bargainApplied: {
      originalTotal: priceSnapshot.grandTotal,
      bargainedTotal: bargainedPrice,
      discount: bargainDiscount,
      round: bargainRound,
      appliedAt: new Date().toISOString(),
    },
  });
};
```

**Display current price in modal:**
```typescript
const currentPrice = priceSnapshot?.grandTotal || 0;
const perNightPrice = currentPrice / priceSnapshot?.nights || 0;

return (
  <div>
    <p>Current Price: {formatPriceDisplay(currentPrice, currency)}</p>
    <p>Per Night: {formatPriceDisplay(perNightPrice, currency)}</p>
  </div>
);
```

---

### 7. HotelBooking.tsx - Verify Price Before Checkout

**In the component, before accepting payment:**
```typescript
import { usePriceContext } from "@/contexts/PriceContext";
import { verifyPriceIntegrity, logPricePipeline } from "@/services/priceCalculationService";

const { priceSnapshot } = usePriceContext();

const handleCheckout = async () => {
  if (!priceSnapshot) {
    showError("Booking data missing - please start over");
    return;
  }

  // Recalculate total to verify no drift
  const recalculatedTotal = calculateGrandTotal(priceSnapshot.components);
  const { isValid, drift } = verifyPriceIntegrity(priceSnapshot, recalculatedTotal);

  if (!isValid) {
    showError(
      `Price has changed (drift: ₹${drift}). Please review and try again.`
    );
    logPricePipeline("BOOK_FAILED_CHECKSUM", priceSnapshot);
    return;
  }

  logPricePipeline("BOOK", priceSnapshot);

  // Proceed with booking using priceSnapshot.grandTotal
  const bookingPayload = {
    roomKey: priceSnapshot.roomKey,
    rateKey: priceSnapshot.rateKey,
    totalPrice: priceSnapshot.grandTotal,
    currency: priceSnapshot.currency,
    promo: priceSnapshot.promoApplied,
    bargain: priceSnapshot.bargainApplied,
    refundability: priceSnapshot.refundability,
    // ... other booking fields
  };

  await submitBooking(bookingPayload);
};
```

**In the invoice/confirmation:**
```typescript
const handleInvoiceGeneration = () => {
  if (!priceSnapshot) {
    showError("Price data unavailable");
    return;
  }

  logPricePipeline("INVOICE", priceSnapshot);

  // Generate invoice using priceSnapshot.grandTotal
  // Ensure invoice amount matches priceSnapshot.grandTotal exactly
};
```

---

## 🔍 TESTING CHECKLIST

For each test case, verify **all 5 stages show the same price**:

### Test Case 1: Non-Refundable Room, No Promo, No Bargain
- [ ] Results page price
- [ ] Details page price
- [ ] Bargain modal shows same price
- [ ] Book page shows same price
- [ ] Invoice shows same price
- [ ] Screenshot: results | details | bargain | book | invoice

### Test Case 2: Same Room with Promo Applied
- [ ] Promo discount applied at Details stage
- [ ] Bargain modal shows discounted price
- [ ] Book/Invoice show discounted price
- [ ] Checksum logs show consistent values

### Test Case 3: Bargain Applied Round 1
- [ ] Original price shown
- [ ] User negotiates down
- [ ] Bargain modal shows negotiated price
- [ ] Book/Invoice show bargain price
- [ ] Discount amount visible

### Test Case 4: Bargain Applied Round 2
- [ ] Same as round 1, but round=2 in logs
- [ ] Price locks after acceptance
- [ ] Further changes blocked

### Test Case 5: Refundable Room with Taxes/Fees
- [ ] Base + taxes + fees calculated
- [ ] Refundable badge visible
- [ ] Cancellation rules consistent
- [ ] All pages show total including taxes

### Test Case 6: Mock Mode End-to-End
- [ ] No API calls made
- [ ] Mock hotel price used throughout
- [ ] Checksum valid in all stages
- [ ] Fallback renders correctly

### Test Case 7: Currency Switch (INR → USD)
- [ ] Initial search in INR
- [ ] Currency changed to USD
- [ ] FX rate applied
- [ ] Price checksum recalculated
- [ ] All pages show USD amount

---

## 📊 CONSOLE LOGS TO VERIFY

For each stage, check console for:
```
[PRICE_PIPELINE] SEARCH: roomKey=..., rateKey=..., grandTotal=..., checksum=...
[PRICE_PIPELINE] DETAILS: roomKey=..., rateKey=..., grandTotal=..., checksum=...
[PRICE_PIPELINE] BARGAIN: roomKey=..., bargainRound=..., grandTotal=..., checksum=...
[PRICE_PIPELINE] BOOK: roomKey=..., grandTotal=..., checksum=...
[PRICE_PIPELINE] INVOICE: roomKey=..., grandTotal=..., checksum=...
```

If any checksum mismatches:
```
[PRICE_PIPELINE] Price drift detected: original=X, recalculated=Y, drift=Z
```

---

## 🚨 HARD STOPS (Block Checkout if)

1. **priceSnapshot is null** → "Booking data missing"
2. **Checksum mismatch** → "Price changed, please review"
3. **Room changed** → "Room selection locked, reset price"
4. **Currency changed mid-flow** → Reset snapshot, recalculate
5. **Price drift > 0.01** → "Price calculation error"

---

## 📝 CRITICAL NOTES

1. **roomKey format**: Must be unique and consistent (e.g., "hotel-123-room-standard-meal-bb")
2. **rateKey format**: Supplier-specific or "mock-rate" for fallback
3. **Rounding**: Only round at END of calculation, not per component
4. **Checksum**: Changes if roomKey, rateKey, nights, or grandTotal changes
5. **FX conversion**: Apply fxRate multiplier BEFORE final rounding
6. **Markup order**: base → taxes → fees → markups → discounts
7. **Promo + Bargain**: Both can be applied (discounts stack)

---

## 🔗 DEPENDENCIES

- PriceContext (client/contexts/PriceContext.tsx)
- priceCalculationService (client/services/priceCalculationService.ts)
- All hotel booking pages (Results → Details → Bargain → Book → Invoice)

---

## ⏱️ ESTIMATED EFFORT

- HotelResults integration: 30 minutes
- HotelDetails integration: 30 minutes
- ConversationalBargainModal integration: 20 minutes
- HotelBooking integration: 20 minutes
- Testing & verification: 1 hour
- **Total: ~2 hours**

---

## 🎯 SUCCESS CRITERIA

✅ **All 7 test cases pass with identical prices across all 5 stages**
✅ **Console logs show valid checksums at every stage**
✅ **Checkout blocked if price drift detected**
✅ **Room selection locked to original roomKey**
✅ **Mock mode works end-to-end with consistent fallback data**
✅ **Currency conversion applies FX rate correctly**
✅ **Promo and bargain discounts stack correctly**
