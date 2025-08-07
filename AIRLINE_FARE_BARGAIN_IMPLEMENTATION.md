# Airline Fare Markup & Bargain Logic - Complete Implementation

## Overview

This document details the complete implementation of Zubin Aibara's Airline Fare Range / Markup Management module with integrated bargain logic and promo code functionality.

## 🎯 **Business Logic Implementation**

### **1. Current Fare Range (Min/Max) - User-Visible Pricing**

**Purpose**: Controls the markup percentage range applied on top of net fare from suppliers.

**Fields Added**:

- `currentFareMin` (e.g., 10%) - Minimum markup for user-visible fare
- `currentFareMax` (e.g., 15%) - Maximum markup for user-visible fare

**Logic**:

```typescript
// Net fare from supplier (TBO/Amadeus/Hotelbeds)
const netFare = 10000; // ₹10,000

// Current Fare Range: 10% - 15%
const randomMarkup = randomizeInRange(10, 15); // e.g., 12.75%
const userVisiblePrice = netFare * (1 + randomMarkup / 100); // ₹11,275

// Price fluctuates between ₹11,000 - ₹11,500 for each session
```

### **2. Bargain Fare Range (Min/Max) - Acceptance Logic**

**Purpose**: Defines acceptable price range for user bargain offers.

**Fields Added**:

- `bargainFareMin` (e.g., 5%) - Minimum acceptable bargain markup
- `bargainFareMax` (e.g., 15%) - Maximum acceptable bargain markup

**Logic**:

```typescript
// Calculate bargain acceptance range
const bargainMinPrice = netFare * (1 + 5 / 100); // ₹10,500
const bargainMaxPrice = netFare * (1 + 15 / 100); // ₹11,500

// User enters desired price
if (userPrice >= bargainMinPrice && userPrice <= bargainMaxPrice) {
  // ✅ "Your price is matched!"
  return { accepted: true, finalPrice: userPrice };
} else {
  // ❌ Generate counter-offer within Current Fare Range
  const counterOffer = generateRandomCounterOffer(
    currentFareMin,
    currentFareMax,
  );
  return {
    accepted: false,
    counterOffer,
    timer: 30, // 30-second validity
    reasoning: "This offer is valid for 30 seconds. Accept or reject.",
  };
}
```

### **3. Promo Code Integration Flow**

**Zubin's Specified Flow**:

1. **First**: Apply Bargain Fare logic
2. **Then**: Apply Promo Code discount
3. **Protection**: Final price never drops below net fare

```typescript
// Step 1: Bargain Logic
const bargainedPrice = processBargainLogic(userOffer, bargainRange);

// Step 2: Apply Promo Code
if (promoCode && bargainSuccess) {
  const promoDiscount = calculatePromoDiscount(promoCode, bargainedPrice);
  let finalPrice = bargainedPrice - promoDiscount;

  // Step 3: Net Fare Protection
  const minimumPrice = netFare * (1 + minimumMarkupPercent / 100);
  if (finalPrice < minimumPrice) {
    finalPrice = minimumPrice; // Enforce minimum
    promoDiscount = bargainedPrice - minimumPrice; // Adjust discount
  }
}

// Result: Final Price = Marked Up Price – Bargain % – Promo Code %
// But never below net fare + minimum markup
```

## 🔧 **Technical Implementation**

### **1. Interface Updates**

**AirMarkup Interface Enhanced**:

```typescript
export interface AirMarkup {
  // ... existing fields

  // Current Fare Range (existing functionality)
  currentFareMin: number; // Min markup % for user-visible fare
  currentFareMax: number; // Max markup % for user-visible fare

  // New Bargain Fare Range fields
  bargainFareMin: number; // Min acceptable bargain %
  bargainFareMax: number; // Max acceptable bargain %
}
```

### **2. Admin Panel Updates**

**MarkupManagementAir.tsx Enhanced**:

- ✅ Added Current Fare Range configuration section
- ✅ Added Bargain Fare Range configuration section
- ✅ Visual distinction with colored backgrounds (blue/green)
- ✅ Decimal precision support (step="0.01")
- ✅ Helpful tooltips and examples

**Form Fields Added**:

```tsx
{
  /* Current Fare Range */
}
<div className="bg-blue-50 p-4 rounded-lg">
  <h4>Current Fare Range (User-Visible Pricing)</h4>
  <Input name="currentFareMin" placeholder="e.g., 10.00" />
  <Input name="currentFareMax" placeholder="e.g., 15.00" />
</div>;

{
  /* Bargain Fare Range */
}
<div className="bg-green-50 p-4 rounded-lg">
  <h4>Bargain Fare Range (Acceptable Bargain Pricing)</h4>
  <Input name="bargainFareMin" placeholder="e.g., 5.00" />
  <Input name="bargainFareMax" placeholder="e.g., 15.00" />
</div>;
```

### **3. Bargain Logic Implementation**

**BargainPricingService Enhanced**:

```typescript
// Use Current Fare Range for user-visible pricing
const currentFareMin = markupResult.selectedMarkup?.currentFareMin || 10;
const currentFareMax = markupResult.selectedMarkup?.currentFareMax || 15;
const randomizedMarkup = randomizeInRange(currentFareMin, currentFareMax);

// Use Bargain Fare Range for acceptance validation
const bargainFareMin = markupResult.selectedMarkup?.bargainFareMin || 5;
const bargainFareMax = markupResult.selectedMarkup?.bargainFareMax || 15;

// Zubin's Logic Implementation
if (
  userOffer >= netFare * (1 + bargainFareMin / 100) &&
  userOffer <= netFare * (1 + bargainFareMax / 100)
) {
  return "✅ Your price is matched!";
} else {
  return generateCounterOffer(currentFareMin, currentFareMax);
}
```

### **4. 30-Second Timer & Repeat Prevention**

**BargainModalPhase1.tsx Enhanced**:

```typescript
// 30-second countdown timer
const [counterOfferTimer, setCounterOfferTimer] = useState(0);
const [isCounterOfferExpired, setIsCounterOfferExpired] = useState(false);

// Prevent repeat price entries
const [usedPrices, setUsedPrices] = useState<Set<number>>(new Set());

// Timer logic
useEffect(() => {
  if (counterOfferTimer > 0) {
    const interval = setInterval(() => {
      setCounterOfferTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }
}, [counterOfferTimer]);

// Repeat price validation
if (usedPrices.has(userOffer)) {
  setError(
    "You cannot re-enter the same price. Please try a different amount.",
  );
  return;
}
```

**Timer UI Display**:

```tsx
{
  counterOfferTimer > 0 && (
    <div className={`timer ${counterOfferTimer <= 10 ? "urgent" : ""}`}>
      <Clock className="w-4 h-4" />
      <span className="font-mono">{counterOfferTimer}s</span>
      <p>Offer valid for {counterOfferTimer} seconds</p>
    </div>
  );
}
```

### **5. Enhanced Promo Integration**

**BargainPromoIntegrationService Created**:

```typescript
// Implements Zubin's exact flow
async integratePromoWithBargain(request) {
  // Step 1: Net fare from supplier
  // Step 2: Apply Current Fare Range markup
  // Step 3: Process bargain logic with Bargain Fare Range
  // Step 4: Apply promo code on bargained price
  // Step 5: Ensure final price never drops below net fare

  return {
    finalPrice,
    flowExplanation: [
      "Step 1: Net Fare = ₹10,000",
      "Step 2: Marked-up price = ₹11,275",
      "Step 3: Bargain successful at ₹10,800",
      "Step 4: Promo code applied = -₹300",
      "Step 5: Final price = ₹10,500"
    ]
  };
}
```

## 🎮 **User Experience Flow**

### **1. Initial Price Display**

- Shows Current Fare Range randomized price
- Background pricing logic explanation available
- "Start Bargain" button prominently displayed

### **2. User Enters Desired Price**

- Input validation for positive numbers
- Real-time check against used prices
- Clear feedback on acceptable ranges

### **3. System Response**

**✅ Price Matched (Within Bargain Range)**:

```
✅ Your price is matched!
₹10,800 is within our acceptable bargain range.
→ Proceed to booking confirmation
```

**❌ Counter-Offer (Outside Bargain Range)**:

```
We hear you! How about ₹11,150?
This offer is valid for 30 seconds. Accept or reject.
[30s countdown timer]
[Accept] [Make Another Offer]
```

### **4. Timer Expiration**

- Visual indication when offer expires
- Automatic transition to new offer input
- Clear messaging about expired status

### **5. Repeat Price Prevention**

- "You cannot re-enter the same price" error
- Display of previously tried prices
- Encouragement to try different amounts

## 📊 **Examples & Scenarios**

### **Scenario 1: Successful Bargain + Promo**

```
Net Fare: ₹10,000 (from TBO)
Current Fare Range: 10%-15% → Shows ₹11,275 (12.75%)
Bargain Range: 5%-15% → Accepts ₹10,500-₹11,500

User enters: ₹10,800
✅ "Your price is matched!" (within bargain range)

Promo "SAVE300" applied: -₹300
Final Price: ₹10,500 (respects 5% minimum markup)
Savings: ₹775 (6.9%)
```

### **Scenario 2: Counter-Offer Flow**

```
Net Fare: ₹10,000
Current Fare Range: 10%-15% → Shows ₹11,400
Bargain Range: 5%-15% → Accepts ₹10,500-₹11,500

User enters: ₹9,500 (below bargain range)
❌ Counter-offer: ₹11,200 (random within current fare range)
Timer: 30 seconds

If user accepts: Final price ₹11,200
If user rejects: Can make new offer (cannot use ₹9,500 again)
```

### **Scenario 3: Promo Protection**

```
Net Fare: ₹10,000
Bargained Price: ₹10,600
Promo "BIGDISCOUNT" would give -₹800 discount
Proposed Final: ₹9,800 (below net fare!)

System adjusts:
Final Price: ₹10,500 (5% minimum markup)
Actual Promo Discount: ₹100 (adjusted to respect minimum)
Message: "Promo applied with minimum markup protection"
```

## ✅ **Compliance with Requirements**

### **✅ 1. Markup Range Implementation**

- ✅ Current Fare Min/Max fields added
- ✅ Random fluctuation within range
- ✅ User-visible pricing controlled

### **✅ 2. Bargain Fare Range Implementation**

- ✅ Bargain Fare Min/Max fields added
- ✅ "Your price is matched!" logic
- ✅ Counter-offer generation

### **✅ 3. 30-Second Timer**

- ✅ Visual countdown display
- ✅ Automatic expiration handling
- ✅ Accept/reject within timeframe

### **✅ 4. Repeat Price Prevention**

- ✅ Cannot re-enter same price
- ✅ Clear error messaging
- ✅ Used prices tracking

### **✅ 5. Promo Code Integration**

- ✅ Applied after bargain logic
- ✅ Never drops below net fare
- ✅ Minimum markup protection
- ✅ Proper flow explanation

### **✅ 6. Admin Panel**

- ✅ All new fields added
- ✅ Decimal precision support
- ✅ Visual design maintained
- ✅ Helpful explanations

## 🚀 **Production Readiness**

- ✅ TypeScript interfaces updated
- ✅ Error handling implemented
- ✅ Build compilation successful
- ✅ Service integration complete
- ✅ UI/UX enhancements done
- ✅ Business logic validated

---

**Implementation Status**: ✅ **COMPLETE**
**Developer**: AI Assistant
**Requirements by**: Zubin Aibara, Founder & CEO - Faredown
**Last Updated**: February 2025

All specified requirements have been implemented exactly as requested without altering any frontend design elements.
