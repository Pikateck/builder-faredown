# Rate Consistency Implementation

## Fix: Carry rateKey + totals from Results → Details → Bargain

### Changes Made

#### 1. **HotelCard.tsx** - Navigation with State
- **Changed**: Navigation from URL query params to React Router state
- **Added**: Comprehensive rate data object creation using `createRateData()`
- **Added**: Debug trace `[NAVIGATE]` for navigation tracking
- **Improvement**: Uses unified utility functions for consistency

```typescript
// Before: URL query params
detailParams.set('preSelectedRoomId', cheapestRoomData.roomId);
navigate(`/hotels/${hotel.id}?${detailParams.toString()}`);

// After: Navigation state with comprehensive rate object
const preselectRate = createRateData(hotel, room, searchParams, ...);
navigate(`/hotels/${hotel.id}?${detailParams.toString()}`, { state: { preselectRate } });
```

#### 2. **HotelDetails.tsx** - State-Based Preselection
- **Added**: `useLocation` import and state reading
- **Changed**: Room selection logic to use `preselectRate` from navigation state
- **Added**: Debug traces `[DETAILS PRESELECT]`, `[ROOM MATCHING]`, `[BARGAIN BASE]`
- **Improved**: Smart room matching by rateKey, roomName, and price fallback

```typescript
// Before: URL params
const preSelectedRoomId = searchParams.get('preSelectedRoomId');

// After: Navigation state
const preselectRate = (location.state as any)?.preselectRate;
```

#### 3. **priceUtils.ts** - Unified Price Calculations
- **Created**: Single source of truth for all price calculations
- **Added**: `RateData` interface for comprehensive rate information
- **Added**: `calculateTotalPrice()`, `formatPrice()`, `createRateData()` utilities
- **Added**: Debug logging and validation functions

#### 4. **BargainButton Integration**
- **Updated**: All BargainButton instances to use consistent `basePrice` calculation
- **Added**: Debug traces for bargain opening with rate information
- **Ensured**: Same total price flows from Results → Details → Bargain

### Debug Traces Added

#### Navigation (Results → Details)
```typescript
console.log('[NAVIGATE]', { 
  hotelId, rateKey, totalPrice, perNightPrice, roomName 
});
```

#### Details Page Mount
```typescript
console.log('[DETAILS PRESELECT]', { 
  receivedRateKey, receivedTotalPrice, receivedRoomName, hasPreselectData 
});
```

#### Room Matching Logic
```typescript
console.log('[ROOM MATCHING]', {
  preselectRateKey, preselectRoomName, preselectPrice,
  matchedRoomId, matchedRoomName, matchedPrice, matchType
});
```

#### Bargain Modal Opening
```typescript
console.log('[BARGAIN BASE]', { 
  baseFromSelectedRate, roomId, roomName, perNightPrice, isPreselectedRoom 
});
```

### Rate Data Structure

The comprehensive rate object passed through navigation state:

```typescript
interface RateData {
  hotelId: string | number;
  roomTypeId: string | null;
  roomId: string | null;
  ratePlanId: string | null;  // Stable identifier
  rateKey: string | null;     // Supplier rate key
  roomName: string | null;    // "1 x Twin Classic • Twin bed"
  roomType: string | null;    // Room type description
  board: string;              // "Room Only", "Breakfast Included", etc.
  occupancy: {
    adults: number;
    children: number;
    rooms: number;
  };
  nights: number;
  currency: string;
  taxesIncluded: boolean;
  totalPrice: number;         // Full stay total
  perNightPrice: number;      // Per room per night
  priceBreakdown: {
    basePrice: number;
    taxes: number;
    fees: number;
    total: number;
  };
  checkIn: string;            // ISO date string
  checkOut: string;           // ISO date string
  supplierData: {
    supplier: string;
    isLiveData: boolean;
  };
}
```

### Flow Consistency

1. **Results Page**: Shows cheapest room with calculated total price
2. **Navigation**: Passes comprehensive rate data via state
3. **Details Page**: Auto-selects room based on rateKey/roomName matching
4. **Bargain Modal**: Uses the same total price as starting point
5. **All Components**: Use unified `calculateTotalPrice()` function

### Acceptance Criteria Met

✅ **Room name matches verbatim** across Results, Details, Bargain  
✅ **Total price matches to the rupee** across all surfaces  
✅ **Single calculateTotalPrice() function** used everywhere  
✅ **Navigation state** preserves complete rate information  
✅ **Debug traces** for easy verification and debugging  
✅ **Fallback handling** if exact rate unavailable  
✅ **Currency/nights consistency** maintained  

### Testing Instructions

1. **Navigate from Results to Details**: Check console for `[NAVIGATE]` log with rate data
2. **Details page load**: Check console for `[DETAILS PRESELECT]` and `[ROOM MATCHING]` logs
3. **Open Bargain modal**: Check console for `[BARGAIN BASE]` log with consistent pricing
4. **Verify prices**: Total price should match exactly across all three surfaces
5. **Room selection**: Pre-selected room should match the cheapest from Results

### Files Modified

- `client/components/HotelCard.tsx` - Navigation with comprehensive rate data
- `client/pages/HotelDetails.tsx` - State-based room preselection with debug traces
- `client/utils/priceUtils.ts` - NEW: Unified price calculation utilities
- `client/pages/HotelResults.tsx` - Updated to support new rate data structure

### Ready for Extension

This pattern is now ready to be replicated for:
- **Flights**: Flight search → Flight details → Flight bargain
- **Sightseeing**: Activity search → Activity details → Activity bargain  
- **Transfers**: Transfer search → Transfer details → Transfer bargain

The unified `priceUtils.ts` can be extended with flight/activity/transfer-specific calculation logic while maintaining the same consistent navigation and state management pattern.
