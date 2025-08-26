# 📱 Native Mobile App UX Flow Diagram & Specifications
## For iOS & Android Development Team

**Date:** August 26, 2025  
**Project:** Faredown.com Native Mobile Apps  
**Reference:** Booking.com Mobile UX Patterns  

---

## 🎯 **SCOPE LOCK:** 
This document is **ONLY** for **native iOS and Android app development**. Do not implement these as web responsive features.

---

## 📊 **COMPLETE UX FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────┐
│                        NATIVE APP FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐     │
│  │   LANDING   │───▶│ FULL-SCREEN  │───▶│    RESULTS      │     │
│  │    PAGE     │    │ INPUT PAGES  │    │     PAGE        │     │
│  │ (Minimal)   │    │              │    │                 │     │
│  └─────────────┘    └──────────────┘    └─────────────────┘     │
│         │                   │                     │             │
│         ▼                   ▼                     ▼             │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐     │
│  │  TAB BAR    │    │   KEYBOARD   │    │ FILTER SCREEN   ���     │
│  │ Navigation  │    │ + SUGGESTIONS│    │ (Full-Screen)   │     │
│  └─────────────┘    └──────────────┘    └─────────────────┘     │
│                                                   │             │
│                                                   ▼             │
│                                          ┌─────────────────┐     │
│                                          │  STICKY APPLY   │     │
│                                          │     BUTTON      │     │
│                                          └─────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏠 **1. LANDING PAGE SPECIFICATIONS**

### **Minimal Above-the-Fold Layout:**
```
┌─────────────────────────────────────┐
│ [Header: Logo + Profile]            │
├───────────────────────��─────────────┤
│                                     │
│  "Upgrade. Bargain. Book."          │
│  [Module-specific tagline]          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        SEARCH PANEL             │ │
│ │  [From/To or Destination]       │ │
│ │  [Dates] [Travelers/Guests]     │ │
│ │  [SEARCH BUTTON - PROMINENT]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Tab Bar: Flights|Hotels|etc.]      │
└─────────────────────────────────────┘
```

### **✅ Requirements:**
- **Identical layout** across Flights, Hotels, Sightseeing, Transfers
- **Clean, minimal** - remove oversized blocks/banners
- **Essential only** above the fold
- **Consistent taglines** per module:
  - Flights: "Turn your fare into an upgrade with live AI bargaining"
  - Hotels: "Control your price with AI-powered hotel upgrades"
  - Sightseeing: "Explore attractions & experiences with AI that bargains for you"
  - Transfers: "Ride in comfort for less — AI secures your best deal on every trip"

---

## 🔍 **2. FULL-SCREEN INPUT PAGES**

### **Trigger:** User taps **From**, **To**, or **Destination** field

### **Input Page Layout:**
```
┌─────────────────────────────────────┐
│ [← Back] Search destinations   [×]  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [🛩] Search cities or airports  │ │ <- Auto-focus + keyboard
│ └─────────────────────────────────┘ │
│                                     │
│ Recent Searches:                    │
│ • Mumbai (BOM) - Selected recently  │
│ • Delhi (DEL)                       │
│                                     │
│ Popular Destinations:               │
│ • DXB - Dubai International ✈️      │
│ • SIN - Singapore Changi ✈️         │
│ • LHR - London Heathrow ✈️          │
│                                     │
│ [Live filtered results as user types]│
│ mum → • BOM - Mumbai, Maharashtra   │
│       • JMU - Jammu Airport         │
│                                     │
└─────────────────────────────────────┘
```

### **✅ Requirements:**
- **Auto-focus** search input with keyboard shown
- **Type-to-filter** with 250ms debounce
- **Live suggestions** update as user types
- **Recent searches** shown first
- **Leading icons** appropriate to module:
  - Flights: ✈️ Plane icon
  - Hotels: 🏨 Hotel icon  
  - Sightseeing: 🎯 Activity icon
  - Transfers: 🚗 Car icon
- **Clear (X) button** inside input field
- **Full-screen** overlay (not popup)
- **Consistent** across all modules

---

## 🎛️ **3. DEDICATED FILTER SCREEN**

### **Trigger:** User taps "Filters" button from results

### **Filter Screen Layout:**
```
┌─────────────────────────────────────┐
│ [← Back] Filters             [Reset]│
├─────────────────────────────────────┤
│                                     │
│ Price Range                         │
│ ├──●─────────────────●──┤ ₹5K-50K   │
│                                     │
│ Stops                               │
│ ◉ Direct only    ○ 1 stop  ○ Any   │
│                                     │
│ Airlines                            │
│ ☑ Air India      ☑ IndiGo          │
│ ☐ Emirates       ☐ Qatar Airways    │
│                                     │
│ Departure Time                      │
│ ☐ Early (6-12)   ☑ Afternoon       │
│ ☐ Evening        ☐ Night           │
│                                     │
│ Baggage                             │
│ ☑ Carry-on included                 │
│ ☑ Checked bag included              │
│                                     │
│ [More sections scrollable...]       │
│                                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │     APPLY FILTERS (42)          │ │ <- Sticky bottom
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **✅ Requirements:**
- **Full-screen** overlay (not popup)
- **Sticky "Apply" button** at bottom
- **Counter** showing number of results
- **Module-specific filters:**
  - Flights: Stops, Airlines, Time, Baggage
  - Hotels: Price, Stars, Amenities, Location
  - Sightseeing: Type, Duration, Rating, Price
  - Transfers: Vehicle type, Features, Price
- **Reset** option in header
- **Smooth scrolling** for long filter lists

---

## 🚗 **4. TRANSFERS MODULE - DUAL TABS**

### **Tab Layout:**
```
┌─────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────────┐ │
│ │ AIRPORT TAXI│ │   CAR RENTALS   │ │ <- Two tabs
│ │   (Active)  │ │   (Inactive)    │ │
│ └─────────────┘ └─────────────────┘ │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [🚗] Pickup Location           │ │ <- Same input style
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [🎯] Drop-off Location         │ │ <- as other modules
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [📅] Pickup Date & Time        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [👥] Passengers               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         SEARCH TRANSFERS        │ │
│ └─────────────────────────────────┘ │
└���────────────────────────────────────┘
```

### **✅ Requirements:**
- **Two distinct tabs:** Airport Taxi | Car Rentals
- **Same input styling** as Flights/Hotels (height, radius, padding)
- **Different logic** per tab:
  - Airport Taxi: Point-to-point transfer
  - Car Rentals: Self-drive with return date/location
- **Leading icons** in all inputs
- **Clear (X) buttons** in all inputs
- **Full-screen input pages** for pickup/drop-off location selection

---

## 🎨 **5. VISUAL CONSISTENCY GUIDELINES**

### **Input Field Standards:**
```
Height: 44px (iOS) / 48px (Android)
Radius: 8px
Padding: 12px horizontal, 10px vertical
Border: 1px solid #E5E7EB (inactive), #3B82F6 (focus)
Leading Icon: 20px × 20px, 12px from left edge
Clear Button: 20px × 20px, 12px from right edge
Font: 16px (prevents iOS zoom), medium weight
```

### **Icon Standards:**
```
Style: Thin, minimal SVG icons
Size: 20px × 20px for inputs, 24px × 24px for buttons
Color: #6B7280 (inactive), #3B82F6 (active)
Set: Lucide React or similar consistent family
```

### **Touch Targets:**
```
Minimum: 44px × 44px (iOS) / 48px × 48px (Android)
Spacing: 8px minimum between interactive elements
Safe Areas: Respect iOS notch and Android navigation
```

### **Module-Specific Icons:**
```
Flights: ✈️ Plane (from/to), 📅 Calendar, 👥 Users
Hotels: 🏨 Hotel (destination), 📅 Calendar, 👥 Guests  
Sightseeing: 🎯 Target (destination), 📅 Calendar, 👥 Travelers
Transfers: 🚗 Car (pickup/dropoff), 📅 Calendar, 👥 Passengers
```

---

## 🔄 **6. BEHAVIORAL REQUIREMENTS**

### **Type-to-Filter Logic:**
```javascript
// Pseudocode for all input fields
onTextChange(input) {
  debounce(250ms) {
    if (input.length >= 2) {
      showSuggestions(filterResults(input));
    }
  }
}
```

### **Navigation Patterns:**
```
From landing → Tap input → Full-screen input page
From results → Tap filter → Full-screen filter sheet
Back navigation → Preserve previous search state
Tab switching → Keep search inputs if possible
```

### **Keyboard Behavior:**
```
Auto-focus: Yes (on input page load)
Return key: "Search" or "Done"
Dismiss: Tap outside or back button
Suggestions: Scrollable list, tap to select
```

---

## ✅ **7. ACCEPTANCE CHECKLIST**

### **Before Final Build Delivery:**

**Landing Page:**
- [ ] Minimal layout identical across all 4 modules
- [ ] Only essentials above fold (header + search + tabs)
- [ ] Module-specific taglines implemented
- [ ] Reduced scroll compared to current version

**Full-Screen Input Pages:**
- [ ] From/To/Destination taps open full-screen pages
- [ ] Auto-focus with keyboard shown
- [ ] Type-to-filter working with 250ms debounce
- [ ] Recent searches and popular destinations shown
- [ ] Leading icons and clear (X) buttons present
- [ ] Works across all 4 modules identically

**Filter Screen:**
- [ ] Filters open in full-screen overlay
- [ ] Sticky "Apply" button at bottom with result count
- [ ] Module-specific filter options implemented
- [ ] Reset functionality working

**Transfers Module:**
- [ ] Two tabs visible: Airport Taxi | Car Rentals
- [ ] Input styling identical to other modules
- [ ] Different logic per tab implemented
- [ ] Full-screen location selection working

**Visual Consistency:**
- [ ] Input heights consistent (44px iOS / 48px Android)
- [ ] Icon set unified across all screens
- [ ] Touch targets meet platform standards
- [ ] Focus states and interactions polished

---

## 📱 **8. FINAL DELIVERABLE FORMAT**

### **Required from Native Team:**
1. **iOS .ipa build** + **Android .apk build**
2. **Screen recordings** (30-60 seconds each) showing:
   - Landing page → Input selection → Full-screen input → Results
   - Results → Filters → Full-screen filter sheet → Apply
   - Transfers → Tab switching → Search flow for both tabs
3. **Screenshots** of each major screen per module
4. **Build notes** confirming checklist items completed

### **Timeline:** 
Deliver builds + recordings within **72 hours** of receiving this specification.

---

## 🚫 **WHAT NOT TO DO**

- ❌ Do not implement as web responsive features
- ❌ Do not use popup/modal overlays instead of full-screen pages
- ❌ Do not mix different icon styles within the app
- ❌ Do not ignore platform-specific touch target sizes
- ❌ Do not copy-paste web dropdown logic to mobile
- ❌ Do not omit the debounce timing for type-to-filter
- ❌ Do not deliver builds without screen recordings

---

**Questions?** Contact project owner before implementation, not after.
**Reference UX:** Booking.com mobile app (latest iOS/Android versions)
**Final Authority:** This document supersedes all previous mobile requirements.
