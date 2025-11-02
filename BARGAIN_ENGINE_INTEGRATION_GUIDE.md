# 🎯 Shared Bargain Engine Integration Guide

**Version:** 1.0  
**Status:** Ready for Implementation  
**Platform Coverage:** Hotels, Flights, Transfers, Packages, Add-ons

---

## 📋 Overview

The **BargainEngine** is a centralized, module-agnostic service that powers bargain negotiation across all Faredown product types. It ensures identical behavior, pricing logic, analytics tracking, and user experience everywhere.

### ✅ Core Features

- **2-Attempt System**: Round 1 (30s) → Round 2 (30s)
- **Round 2 Input Field**: Users can enter a NEW wish price in Round 2
- **Dual Price Selection**: After Round 2, users choose between "Safe Deal" (Round 1) or "Final Offer" (Round 2)
- **Price Locking**: Once selected, price cannot be changed
- **Mobile Responsive**: Fully scrollable on all devices (iPhone, Android, Desktop)
- **Unified Analytics**: 4 tracked events with consistent data points
- **Reusable**: Single service powering all modules

---

## 🏗️ Architecture

### Service Layer: `client/services/BargainEngine.ts`

```
BargainEngine
├── initSession(product, basePrice)           → BargainSession
├── processRound1(sessionId, userWishPrice)   → BargainRound
├── processRound2(sessionId, userWishPrice)   → BargainRound
├── selectPrice(sessionId, selectedRound)     → number (final price)
├── abandonBargain(sessionId, reason)         → number (original price)
└── getSession(sessionId)                     → BargainSession | undefined
```

### Hook Layer: `client/hooks/useBargainEngine.ts`

```
useBargainEngine(props)
├── startSession()              → sessionId
├── submitRound1Price(price)    → BargainRound
├── submitRound2Price(price)    → BargainRound
├── selectPrice(round)          → selectedPrice
├── abandonSession(reason)      → originalPrice
└── Properties: session, round, timerDuration, safeDealPrice, finalOfferPrice, etc.
```

### Component Layer: `client/components/ConversationalBargainModal.tsx`

- Already integrated with both service and hook patterns
- Mobile-responsive with proper scrolling
- Accessibility: ARIA labels, DialogTitle, semantic HTML

---

## 🚀 Integration for Each Module

### 1️⃣ Hotels Module (Already Updated)

**Status**: ✅ Ready  
**Component**: `client/components/ConversationalBargainModal.tsx`  
**Trigger**: "Bargain Now" button on Hotel Details page

#### Usage in HotelDetails.tsx:

```tsx
import { BargainProduct } from "@/services/BargainEngine";

const bargainProduct: BargainProduct = {
  id: hotel.id,
  type: "hotel",
  name: hotel.name,
  basePrice,
  currency: "INR",
  city: hotel.city,
  supplierId: hotel.supplierId,
};

<ConversationalBargainModal
  isOpen={isBargainOpen}
  onClose={() => setIsBargainOpen(false)}
  onAccept={(finalPrice, orderRef) => {
    // Handle booking with finalPrice
  }}
  module="hotels"
  hotel={hotel}
  basePrice={basePrice}
  productRef={hotel.id}
/>;
```

---

### 2️⃣ Flights Module (Template)

**Status**: 🔄 To Be Implemented  
**Component**: Use `ConversationalBargainModal` with type='flight'

#### Usage in FlightResults.tsx:

```tsx
import { BargainProduct } from "@/services/BargainEngine";

const bargainProduct: BargainProduct = {
  id: flight.id,
  type: "flight",
  name: `${flight.airline} - ${flight.route}`,
  basePrice: flight.totalPrice,
  currency: "INR",
  city: flight.departureCity,
  supplierId: flight.supplier,
};

<ConversationalBargainModal
  isOpen={isBargainOpen}
  onClose={() => setIsBargainOpen(false)}
  onAccept={(finalPrice, orderRef) => {
    // Handle flight booking with finalPrice
  }}
  module="flights"
  flight={flight}
  basePrice={flight.totalPrice}
  productRef={flight.id}
/>;
```

---

### 3️⃣ Transfers Module (Template)

**Status**: 🔄 To Be Implemented

#### Usage in TransferDetails.tsx:

```tsx
const bargainProduct: BargainProduct = {
  id: transfer.id,
  type: "transfer",
  name: transfer.serviceType,
  basePrice: transfer.price,
  currency: "INR",
  city: transfer.city,
  supplierId: transfer.supplier,
};

<ConversationalBargainModal
  isOpen={isBargainOpen}
  onClose={() => setIsBargainOpen(false)}
  onAccept={(finalPrice, orderRef) => {
    // Handle transfer booking
  }}
  module="transfers"
  transfer={transfer}
  basePrice={transfer.price}
  productRef={transfer.id}
/>;
```

---

### 4️⃣ Packages / Activities (Template)

**Status**: 🔄 To Be Implemented

#### Usage in PackageDetails.tsx:

```tsx
const bargainProduct: BargainProduct = {
  id: package.id,
  type: "package",
  name: package.title,
  basePrice: package.totalPrice,
  currency: "INR",
  city: package.city,
  supplierId: package.operator,
};

<ConversationalBargainModal
  isOpen={isBargainOpen}
  onClose={() => setIsBargainOpen(false)}
  onAccept={(finalPrice, orderRef) => {
    // Handle package booking
  }}
  module="packages"
  basePrice={package.totalPrice}
  productRef={package.id}
/>;
```

---

### 5️⃣ Add-ons (Baggage, Seats, Meals)

**Status**: 🔄 To Be Implemented

#### Usage in AddonsSelection.tsx:

```tsx
const bargainProduct: BargainProduct = {
  id: addon.id,
  type: "addon",
  name: `${addon.category} - ${addon.description}`,
  basePrice: addon.price,
  currency: "INR",
  // No city for add-ons
};

<ConversationalBargainModal
  isOpen={isBargainOpen}
  onClose={() => setIsBargainOpen(false)}
  onAccept={(finalPrice, orderRef) => {
    // Handle addon purchase
  }}
  module="addons"
  basePrice={addon.price}
  productRef={addon.id}
/>;
```

---

## 📊 Analytics Events (Unified Across All Modules)

### Event 1: `bargain_round1_completed`

```json
{
  "sessionId": "bargain_...",
  "productType": "hotel | flight | transfer | package | addon",
  "productId": "...",
  "productName": "...",
  "city": "Dubai",
  "originalPrice": 5000,
  "userWishPrice": 3500,
  "systemOffer": 4200,
  "isMatched": false,
  "currency": "INR"
}
```

### Event 2: `bargain_round2_triggered`

```json
{
  "sessionId": "bargain_...",
  "productType": "hotel",
  "originalPrice": 5000,
  "round1SafePrice": 4200,
  "round2UserWish": 3000,
  "round2FinalOffer": 3800
}
```

### Event 3: `bargain_price_selected`

```json
{
  "sessionId": "bargain_...",
  "productType": "hotel",
  "selectedPrice": 4200,
  "selectedRound": 1,
  "safeDealPrice": 4200,
  "finalOfferPrice": 3800,
  "savings": 1000,
  "savingsPercent": 20
}
```

### Event 4: `bargain_abandoned`

```json
{
  "sessionId": "bargain_...",
  "productType": "hotel",
  "reason": "timer_expired | user_exit",
  "originalPrice": 5000,
  "round1Offered": 4200,
  "round2Offered": 3800
}
```

---

## 🎮 User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ROUND 1 (30-Second Timer)                                      │
├─────────────────────────────────────────────────────────────────┤
│ User enters Wish Price (chat-style input)                       │
│ ↓                                                               │
│ System responds: Matched or Counter-offer                      │
│ ↓                                                               │
│ User chooses: [Accept Deal] [Try Final Bargain]               │
│ ↓                                                               │
│ If [Accept Deal]: Save as "Safe Deal" → Proceed to Round 2    │
│ If [Try Final Bargain]: Go to Round 2 input                   │
│ If timer expires: Revert to original price                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ROUND 2 (30-Second Timer)                                      │
├─────────────────────────────────────────────────────────────────┤
│ User enters NEW Wish Price (chat-style input)                  │
│ ↓                                                               │
│ System responds: Final Offer                                   │
│ ↓                                                               │
│ Dual Price Selection Screen Shows:                             │
│   [Safe Deal - ₹4200] [Final Offer - ₹3800]                  │
│ ↓                                                               │
│ User selects one price (locked, cannot change)                │
│ ↓                                                               │
│ [Book Selected Price Now - 00:27]  (with countdown timer)     │
│ ↓                                                               │
│ If user clicks: Create price hold → Proceed to booking       │
│ If timer expires: Revert to original price                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile Responsiveness Requirements

### Testing Checklist

- [ ] iPhone 12 (Safari + Chrome) - Full scroll, all buttons visible
- [ ] iPhone 14 (Safari + Chrome) - Full scroll, timer visible
- [ ] iPhone 16 Pro Max (Safari + Chrome) - Full scroll, no clipping
- [ ] Android Chrome - Full scroll, buttons accessible
- [ ] Samsung Browser - Full scroll, safe-area-inset-bottom respected
- [ ] Desktop (Chrome, Safari, Firefox, Edge) - All layouts functional

### Technical Requirements

- ✅ 100dvh height for mobile modals
- ✅ `overflow-y: auto` for chat and button sections
- ✅ `-webkit-overflow-scrolling: touch` for iOS momentum scrolling
- ✅ `env(safe-area-inset-bottom)` for notch/home indicator areas
- ✅ Buttons: minimum 44px height (touch target)
- ✅ Text: minimum 16px (prevents auto-zoom on iOS)

---

## ✅ Deployment Checklist

### Phase 1: Hotels Module (Verify First)

- [ ] `client/services/BargainEngine.ts` - Deployed
- [ ] `client/hooks/useBargainEngine.ts` - Deployed
- [ ] `client/components/ConversationalBargainModal.tsx` - Updated
- [ ] Mobile testing: iPhone 14, 16 Pro Max, Android
- [ ] Analytics events firing correctly
- [ ] Preview link shared with Zubin

### Phase 2: Flights Module

- [ ] Integrate BargainEngine into flight booking
- [ ] Wire "Bargain Now" button on flight cards
- [ ] Test full flow
- [ ] Deploy

### Phase 3: Transfers Module

- [ ] Repeat Phase 2 workflow

### Phase 4: Packages Module

- [ ] Repeat Phase 2 workflow

### Phase 5: Add-ons Module

- [ ] Repeat Phase 2 workflow

---

## 🔧 Troubleshooting

### Issue: BargainEngine not initialized

**Solution**: Ensure `chatAnalyticsService` is available before calling `useBargainEngine`

### Issue: Mobile buttons off-screen

**Solution**: Check `maxHeight` and `overflow-y: auto` on parent containers; verify `env(safe-area-inset-bottom)` is applied

### Issue: Analytics events not firing

**Solution**: Verify `chatAnalyticsService` is imported and `BargainEngine` is tracking events; check browser console for errors

### Issue: Round 2 input not showing

**Solution**: Check that `showOfferActions === false` after user accepts Round 1; verify `round === 2` state is set

---

## 📞 Support

For questions or issues:

1. Check this guide's Troubleshooting section
2. Review the code comments in `BargainEngine.ts` and `useBargainEngine.ts`
3. Check browser console for errors
4. Verify analytics events in DevTools Network tab

---

**Last Updated**: Current Session  
**Next Review**: After all 5 modules are integrated and tested
