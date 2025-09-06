# Frontend Pricing Integration Guide

## 🎯 Integration Overview

Replace existing hardcoded pricing with centralized **builder-faredown-pricing** API calls across all user journey touchpoints.

## 📊 Current vs New Architecture

### **Before (Current State)**

```javascript
// Scattered across pages - inconsistent pricing
const baseFare = 25000;
const tax = Math.round(baseFare * 0.05);
const total = baseFare + tax + markup;
```

### **After (New Centralized System)**

```javascript
// Centralized, consistent pricing with journey tracking
import { pricingApi, startNewJourney } from "@/utils/pricingApi";

const quote = await pricingApi.searchResults({
  module: "air",
  origin: "BOM",
  destination: "JFK",
  baseFare: 25000,
  currency: "USD",
  userType: "b2c",
});
```

## 🚀 Phase 1: Core Search & Results Integration

### **1.1 Flight Search Results**

**File:** `client/pages/FlightResults.tsx`

**Current Problem:** Lines 620-671 have hardcoded pricing

```javascript
breakdown: {
  baseFare: 20712,  // ← Hardcoded!
  taxes: 3890,     // ← Hardcoded!
}
```

**Integration Solution:**

```javascript
// Add at top of component
import { pricingApi, startNewJourney } from "@/utils/pricingApi";
import { useEffect, useState } from "react";

// Initialize journey when search results load
useEffect(() => {
  startNewJourney(); // Start fresh journey for new search
}, []);

// Replace hardcoded pricing with API calls
const [flightPricing, setFlightPricing] = useState({});

const calculateFlightPricing = async (flight) => {
  try {
    const quote = await pricingApi.searchResults({
      module: "air",
      origin: flight.from,
      destination: flight.to,
      serviceClass: flight.class,
      airlineCode: flight.airline,
      currency: "INR",
      baseFare: flight.basePrice || 20000,
      userType: "b2c",
      extras: {
        pax: searchParams.adults || 1,
      },
    });

    setFlightPricing((prev) => ({
      ...prev,
      [flight.id]: quote,
    }));
  } catch (error) {
    console.error("Pricing calculation failed:", error);
    // Fallback to existing hardcoded values
  }
};
```

### **1.2 Hotel Results Integration**

**File:** `client/pages/HotelResults.tsx`

**Integration Points:**

- Line 42: Replace `@/lib/pricing` import
- Line 112: Replace `getCheapestPerNight` calculation
- Line 1222: Update real-time pricing message

```javascript
// Replace existing pricing calculations
const getHotelPricing = async (hotel) => {
  const quote = await pricingApi.searchResults({
    module: "hotel",
    destination: hotel.city,
    hotelCategory: hotel.starRating,
    currency: "INR",
    baseFare: hotel.baseRate,
    userType: "b2c",
    extras: {
      nights: nights,
      rooms: rooms,
    },
  });

  return quote;
};
```

## 🚀 Phase 2: Bargain Flow Integration

### **2.1 Bargain Modal Integration**

**Target:** All bargain modals (`ConversationalBargainModal`, etc.)

**Before Bargain (bargain_pre):**

```javascript
const preBargainQuote = await pricingApi.bargainPre({
  module: "air",
  // ... same params as search
});
```

**After Bargain (bargain_post):**

```javascript
const postBargainQuote = await pricingApi.bargainPost({
  module: "air",
  baseFare: negotiatedPrice, // New price after bargain
  // ... other params
  extras: {
    promoCode: appliedPromoCode, // If promo applied during bargain
  },
});
```

## 🚀 Phase 3: Booking Flow Integration

### **3.1 Flight Booking Page**

**File:** `client/pages/FlightBooking.tsx`

**Current Issue:** Line 713 uses `flight.price.breakdown.baseFare`

**Replace with:**

```javascript
useEffect(() => {
  const loadBookingPricing = async () => {
    const quote = await pricingApi.book({
      module: "air",
      origin: flight.from,
      destination: flight.to,
      serviceClass: flight.class,
      airlineCode: flight.airline,
      currency: "INR",
      baseFare: flight.agreedPrice || flight.originalPrice,
      userType: "b2c",
      extras: {
        pax: passengers.length,
        promoCode: appliedPromoCode,
      },
    });

    setBookingPrice(quote);
  };

  loadBookingPricing();
}, [flight, appliedPromoCode]);
```

### **3.2 Booking Flow Main**

**File:** `client/pages/BookingFlow.tsx`

**Integration Points:**

- Line 1168: Replace `calculateBaseFareTotal()`
- Line 1455: Update `baseFareTotal` calculation
- Line 3527: Update payment total

**New Pricing Hook:**

```javascript
const useBookingPricing = () => {
  const [pricing, setPricing] = useState(null);

  const updatePricing = useCallback(async (step, params) => {
    const quote = await pricingApi[step](params);
    setPricing(quote);
    return quote;
  }, []);

  return { pricing, updatePricing };
};
```

## 🚀 Phase 4: Payment & Confirmation Integration

### **4.1 Payment Step**

```javascript
// Before payment processing
const paymentQuote = await pricingApi.payment({
  // Same params as booking step
  // This ensures price consistency before payment
});

// Verify price hasn't changed
if (Math.abs(paymentQuote.totalFare - bookingQuote.totalFare) > 0.01) {
  // Alert user of price change
  showPriceChangeAlert();
}
```

### **4.2 Booking Confirmation**

**File:** `client/pages/BookingConfirmation.tsx`

**Replace hardcoded values:**

```javascript
// Lines 260, 689, 1322 - replace hardcoded pricing
const confirmationQuote = await pricingApi.invoice({
  // Final pricing for invoice/confirmation
});
```

## 🚀 Phase 5: Error Handling & Fallbacks

### **5.1 Graceful Degradation**

```javascript
const usePricingWithFallback = (step, params, fallbackPrice) => {
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const quote = await pricingApi[step](params);
        setPricing(quote);
        setError(null);
      } catch (err) {
        console.error("Pricing API failed, using fallback:", err);
        setError(err);
        // Use fallback pricing structure
        setPricing({
          baseFare: fallbackPrice,
          markup: fallbackPrice * 0.05,
          tax: fallbackPrice * 0.12,
          totalFare: fallbackPrice * 1.17,
          currency: params.currency,
        });
      }
    };

    loadPricing();
  }, [step, params, fallbackPrice]);

  return { pricing, error, isUsingFallback: !!error };
};
```

### **5.2 Loading States**

```javascript
const PricingDisplay = ({ step, params, children }) => {
  const { pricing, error, isUsingFallback } = usePricingWithFallback(
    step,
    params,
  );

  if (!pricing) {
    return <PricingSkeleton />;
  }

  return (
    <div>
      {isUsingFallback && (
        <div className="text-amber-600 text-sm">
          ⚠️ Using cached pricing - live rates temporarily unavailable
        </div>
      )}
      {children(pricing)}
    </div>
  );
};
```

## 🧪 Testing Strategy

### **Test 1: Journey Consistency**

```javascript
// Test script to verify price consistency
const testJourneyConsistency = async () => {
  const params = {
    module: "air",
    origin: "BOM",
    destination: "JFK",
    serviceClass: "Y",
    currency: "USD",
    baseFare: 500,
    userType: "b2c",
  };

  const searchPrice = await pricingApi.searchResults(params);
  const viewPrice = await pricingApi.viewDetails(params);
  const bookPrice = await pricingApi.book(params);

  console.log("Price consistency check:", {
    search: searchPrice.totalFare,
    view: viewPrice.totalFare,
    book: bookPrice.totalFare,
    consistent: searchPrice.totalFare === viewPrice.totalFare,
  });
};
```

### **Test 2: Price Echo Verification**

```javascript
// Check if Price Echo is working
const verifyPriceEcho = async () => {
  const journeyId = getJourneyId();
  const diff = await getPriceDiff(journeyId);

  console.log("Price Echo data:", diff);
  // Should show all steps taken in journey
};
```

## 📊 Performance Optimization

### **6.1 Caching Strategy**

```javascript
const usePricingCache = () => {
  const cache = useRef(new Map());

  const getCachedPricing = useCallback((key, params) => {
    const cacheKey = JSON.stringify({ key, params });
    const cached = cache.current.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 30000) {
      // 30s cache
      return cached.data;
    }

    return null;
  }, []);

  const setCachedPricing = useCallback((key, params, data) => {
    const cacheKey = JSON.stringify({ key, params });
    cache.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  return { getCachedPricing, setCachedPricing };
};
```

### **6.2 Batch API Calls**

```javascript
// For search results with multiple options
const batchPricingCalculation = async (items, step) => {
  const promises = items.map((item) =>
    pricingApi[step](createPricingParams("air", item, item.basePrice)),
  );

  const results = await Promise.allSettled(promises);

  return results.map((result, index) => ({
    item: items[index],
    pricing: result.status === "fulfilled" ? result.value : null,
    error: result.status === "rejected" ? result.reason : null,
  }));
};
```

## 🚦 Rollout Plan

### **Week 1: Core Search Integration**

- ✅ Flight search results
- ✅ Hotel search results
- ✅ Journey initialization

### **Week 2: Bargain Flow**

- ✅ Pre/post bargain pricing
- ✅ Promo code integration
- ✅ Price change detection

### **Week 3: Booking & Payment**

- ✅ Booking page pricing
- ✅ Payment verification
- ✅ Price consistency checks

### **Week 4: Testing & Optimization**

- ✅ End-to-end testing
- ✅ Performance optimization
- ✅ Error handling refinement

## 🔧 Implementation Checklist

### **Before Starting:**

- [ ] Ensure pricing server is running (`npm run start:pricing`)
- [ ] Verify database migration completed
- [ ] Test pricing API endpoints manually

### **For Each Page:**

- [ ] Import pricing utilities
- [ ] Replace hardcoded pricing
- [ ] Add journey step tracking
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test price consistency

### **Final Verification:**

- [ ] Complete user journey test
- [ ] Price Echo data verification
- [ ] Performance benchmarking
- [ ] Cross-browser testing

## 💡 Pro Tips

1. **Start Small**: Begin with one page (e.g., FlightResults) and get it working perfectly
2. **Maintain Fallbacks**: Always have fallback pricing for when API is unavailable
3. **Log Everything**: Add comprehensive logging for debugging pricing issues
4. **Cache Wisely**: Cache pricing data for 30 seconds to reduce API calls
5. **Test Journey Flow**: Always test complete user journeys, not just individual pages

Ready to start integration? Begin with **Phase 1** and let me know when you'd like specific implementation examples!
