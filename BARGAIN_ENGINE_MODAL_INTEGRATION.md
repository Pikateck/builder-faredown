# Bargain Modal - Module Integration Guide

## 🎯 Purpose

This document explains how to integrate the module-aware Bargain Modal into Hotels and Flights pages.

**Key Principle**: The existing `ConversationalBargainModal` component now fetches settings from the backend based on the `module` prop. No UI redesign - only behavior changes.

---

## 📦 Required Changes to ConversationalBargainModal.tsx

### 1. Add Imports

```typescript
import {
  bargainSettingsService,
  BargainModuleSettings,
} from "@/services/bargainSettingsService";
```

### 2. Add State for Settings

Add after line ~150 (after existing state declarations):

```typescript
// Module-specific settings (fetched from backend)
const [moduleSettings, setModuleSettings] =
  useState<BargainModuleSettings | null>(null);
const [settingsLoading, setSettingsLoading] = useState(false);
```

### 3. Fetch Settings on Modal Open

Add useEffect after existing lifecycle effects (~line 260):

```typescript
// Fetch module settings when modal opens
useEffect(() => {
  if (isOpen && !moduleSettings) {
    setSettingsLoading(true);
    bargainSettingsService
      .getSettings(module)
      .then((settings) => {
        setModuleSettings(settings);
        setSettingsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load bargain settings:", err);
        // Use default settings on error
        setModuleSettings(bargainSettingsService["getDefaultSettings"](module));
        setSettingsLoading(false);
      });
  }
}, [isOpen, module]);
```

### 4. Update Timer Logic

Replace hardcoded timer values with settings:

**Find** (around line 400-450):

```typescript
const ROUND_DURATION = 30; // seconds
```

**Replace with**:

```typescript
const ROUND_DURATION =
  round === 1
    ? moduleSettings?.r1_timer_sec || 30
    : moduleSettings?.r2_timer_sec || 30;
```

### 5. Update Attempts Logic

**Find** (around line 124):

```typescript
const TOTAL_ROUNDS = 2;
```

**Replace with**:

```typescript
const TOTAL_ROUNDS = moduleSettings?.attempts || 2;
```

### 6. Update Button Copy

**Round 1 Primary Button**:

**Find** (around line 1686):

```typescript
<Button>Book {formatPrice(finalOffer)}</Button>
```

**Replace with**:

```typescript
<Button>
  {bargainSettingsService.formatCopy(
    moduleSettings?.copy?.r1_primary || 'Book ₹{price}',
    finalOffer
  )}
</Button>
```

**Round 1 Secondary Button**:

**Find** (around line 1699):

```typescript
<Button variant="outline">Try Final Bargain</Button>
```

**Replace with**:

```typescript
<Button variant="outline">
  {moduleSettings?.copy?.r1_secondary || 'Try Final Bargain'}
</Button>
```

**Round 2 Dual Price Cards** (Hotels only):

**Find** (around line 1750-1800):

```typescript
Book ₹{formatPrice(safeDealPrice)}
{safeDealPrice < finalOffer && <span>(Recommended)</span>}
```

**Replace with**:

```typescript
{bargainSettingsService.formatCopy(
  safeDealPrice < finalOffer
    ? moduleSettings?.copy?.r2_card_low
    : moduleSettings?.copy?.r2_card_high,
  safeDealPrice
)}
{safeDealPrice < finalOffer && moduleSettings?.show_recommended_badge && (
  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-2">
    {moduleSettings?.recommended_label || 'Recommended'}
  </span>
)}
```

**Expiry Fallback Text**:

**Find** (around line 1450-1470):

```typescript
<div className="text-gray-600 mb-4">
  ⌛ Time's up. This price is no longer available.
</div>
```

**Replace with**:

```typescript
<div className="text-gray-600 mb-4">
  {moduleSettings?.copy?.expiry_text || "⌛ Time's up. This price is no longer available."}
</div>
```

**Expiry Fallback CTA**:

**Find**:

```typescript
<Button>Book at Standard Price ₹{formatPrice(basePrice)}</Button>
```

**Replace with**:

```typescript
<Button>
  {bargainSettingsService.formatCopy(
    moduleSettings?.copy?.expiry_cta || 'Book at Standard Price ₹{base}',
    undefined,
    basePrice
  )}
</Button>
```

---

## 🔌 Integration Examples

### Hotels Page

**File**: `client/pages/HotelDetails.tsx`

**Find the BargainButton component** (around line 3620):

```tsx
<BargainButton
  onClick={() => setIsBargainModalOpen(true)}
  price={selectedRoom.pricePerNight}
  className="..."
/>

{/* Bargain Modal */}
<ConversationalBargainModal
  isOpen={isBargainModalOpen}
  hotel={hotel}
  onClose={() => setIsBargainModalOpen(false)}
  onAccept={handleBargainAccept}
  onHold={handleHold}
  module="hotels"  {/* ✅ CRITICAL: Add module prop */}
  basePrice={selectedRoom.pricePerNight}
  productRef={hotel.id}
/>
```

**Changes Required**:

1. ✅ Add `module="hotels"` prop
2. ✅ Ensure `basePrice` is the room price in minor units
3. ✅ Ensure `productRef` is unique hotel identifier

---

### Flights Page

**File**: `client/pages/FlightResults.tsx`

**Find the bargain modal** (around line 2850):

```tsx
<ConversationalBargainModal
  isOpen={bargainModalOpen}
  flight={selectedFlight}
  selectedFareType={selectedFareType}
  onClose={() => setBargainModalOpen(false)}
  onAccept={handleBargainAccept}
  onHold={handleHold}
  module="flights"  {/* ✅ CRITICAL: Add module prop */}
  basePrice={selectedFareType?.price || selectedFlight?.price || 0}
  productRef={selectedFlight?.id || ''}
/>
```

**Changes Required**:

1. ✅ Add `module="flights"` prop
2. ✅ Ensure `basePrice` is the fare price in minor units
3. ✅ Ensure `productRef` is unique flight identifier

---

## 📊 Analytics Tracking

All analytics events now include the `module` field.

**Example Event Payload**:

```json
{
  "event": "bargain_opened",
  "module": "hotels",
  "productId": "hotel_123",
  "basePrice": 5000,
  "device": "mobile",
  "browser": "Chrome",
  "sessionId": "uuid-here",
  "timestamp": 1708387200000
}
```

**No code changes required** - the `chatAnalyticsService` already tracks all events with the module context.

---

## ✅ Acceptance Criteria

### Hotels Integration

- [ ] Modal opens with `module="hotels"`
- [ ] Settings fetched on open
- [ ] Round 1 timer is 30 seconds (configurable)
- [ ] Round 2 timer is 30 seconds (configurable)
- [ ] Dual price buttons show in Round 2
- [ ] "Recommended" badge on lower price
- [ ] Expiry fallback shows "Book at Standard Price"
- [ ] All button text matches admin settings

### Flights Integration

- [ ] Modal opens with `module="flights"`
- [ ] Settings fetched on open
- [ ] Round 1 timer is 15 seconds (configurable)
- [ ] Single attempt only (no Round 2)
- [ ] "Skip bargain" button visible
- [ ] Expiry fallback shows correctly

### Mobile Responsiveness

- [ ] iPhone 14/16: footer visible, no clipping
- [ ] Android: buttons always accessible
- [ ] Keyboard doesn't hide CTA
- [ ] No inner scroll in modal

---

## 🐛 Troubleshooting

### Settings Not Loading

**Symptom**: Modal shows default behavior
**Fix**: Check browser console for API errors. Verify `/api/bargain/settings` endpoint is accessible.

### Timer Not Respecting Admin Settings

**Symptom**: Timer always 30 seconds
**Fix**: Ensure `moduleSettings` state is populated before timer starts. Add loading state check.

### Copy Text Not Updating

**Symptom**: Buttons show old text after admin changes
**Fix**: Clear settings cache: `bargainSettingsService.clearCache()`

### Module Prop Missing

**Symptom**: Error: "No settings found for module: undefined"
**Fix**: Ensure all modal instances have `module="hotels"` or `module="flights"` prop.

---

## 🚀 Testing Guide

### Manual Testing Steps

1. **Open Admin Panel**:
   - Go to `/admin/bargain-settings`
   - Select "Hotels" tab
   - Change R1 timer to 45 seconds
   - Change R1 primary CTA to "Lock this rate ₹{price}"
   - Save

2. **Test Hotels Modal**:
   - Open any hotel details page
   - Click "Bargain Now"
   - Verify:
     - Timer shows 45 seconds (not 30)
     - Button says "Lock this rate ₹{price}"
3. **Test Flights Modal**:
   - Open any flight results page
   - Click "Bargain" on a flight
   - Verify:
     - Timer shows 15 seconds
     - Only 1 attempt allowed
     - "Skip bargain" button visible

### Automated Testing

```typescript
describe("ConversationalBargainModal - Module Settings", () => {
  it("should fetch settings for hotels module", async () => {
    const settings = await bargainSettingsService.getSettings("hotels");
    expect(settings.attempts).toBe(2);
    expect(settings.r1_timer_sec).toBe(30);
  });

  it("should fetch settings for flights module", async () => {
    const settings = await bargainSettingsService.getSettings("flights");
    expect(settings.attempts).toBe(1);
    expect(settings.r1_timer_sec).toBe(15);
  });

  it("should format copy text with price placeholders", () => {
    const formatted = bargainSettingsService.formatCopy("Book ₹{price}", 5000);
    expect(formatted).toBe("Book ₹5000");
  });
});
```

---

## 📝 Phase B Extensions

In Phase B, we'll add:

- [ ] Sightseeing/Transfers integration
- [ ] Packages assisted mode
- [ ] Market-specific overrides (country/city)
- [ ] A/B testing framework

---

**✅ Integration Complete When**:

- All hotel pages use `module="hotels"`
- All flight pages use `module="flights"`
- Settings load correctly from backend
- Timers and copy text match admin panel
- Analytics track module field

---

For support: Engineering Team
Last Updated: 2025-02-19
