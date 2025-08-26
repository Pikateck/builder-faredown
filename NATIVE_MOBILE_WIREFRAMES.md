# 📱 Native Mobile App Visual Wireframes
## Complementary to NATIVE_MOBILE_APP_FLOW_DIAGRAM.md

---

## 🏠 **LANDING PAGE WIREFRAME (All Modules)**

```
┌─────────────────────────────────────┐ ← Device width
│ ┌─┐ faredown.com           [👤]     │ ← Header (minimal)
├─────────────────────────────────────┤
│                                     │
│         Upgrade. Bargain. Book.     │ ← Hero tagline
│      [Module-specific subtitle]     │ ← Different per tab
│                                     │
│ ┌─────────────���───────────────────┐ │ ← Search panel
│ │ [✈️] Leaving from        [×]   │ │ ← Input with icon + clear
│ │     BOM • Mumbai               │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [🎯] Going to            [×]   │ │ ← Tap opens full-screen
│ │     DXB • Dubai                │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────┐ ┌─────────────┐ │
│ │ [📅] Wed Aug 27 │ │ [👥] 1 adult│ │ ← Side by side
│ │ Wed Sep 3       │ │             │ │
│ └─────────────────┘ └─────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │           SEARCH                │ │ ← Prominent button
│ └─────────────────────────────────┘ │
├��────────────────────────────────────┤
│ [✈] [🏨] [🎯] [🚗] [?]            │ ← Tab navigation
└─────────────────────────────────────┘
                                      ↑
                              Minimal above fold
```

---

## 🔍 **FULL-SCREEN INPUT PAGE**

```
┌─────────────────────────────────────┐
│ [←] Search destinations       [×]   │ ← Header with back/close
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [✈️] mum                   [×] │ │ ← Auto-focused input
│ └─────────────────────────────────┘ │ ← Keyboard appears
│                                     │
│ Recent Searches                     │ ← Section header
│ ┌─────────────────────────────────┐ │
│ │ [✈️] BOM - Mumbai, Maharashtra  │ │ ← Tap to select
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [✈️] DEL - Delhi, Delhi         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Suggestions                         │ ← Live filtered
│ ┌─────────────────────────────────┐ │
│ │ [✈️] BOM - Mumbai, Maharashtra  │ │ ← Matches "mum"
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [✈️] JMU - Jammu Airport        │ │ ← Also matches
│ └─────────────────────────────────┘ │
│                                     │
│ [More suggestions...]               │ ← Scrollable
└─────────────────────────────────────┘
                                      ↑
                                Full overlay
```

---

## 🎛️ **FILTER SCREEN LAYOUT**

```
┌─────────────────────────────────────┐
│ [←] Filters                 [Reset] │ ← Header
├─────────────────────────────────────┤
│                                     │
│ Price Range                         │ ← Filter section
│ ├──●─────────────────●──┤ ₹5K-50K   │ ← Range slider
│                                     │
│ Stops                               │
│ ◉ Direct only                       │ ← Radio buttons
│ ○ 1 stop                            │
│ ○ Any stops                         │
│                                     │
│ Airlines                            │
│ ☑ Air India      ☑ IndiGo          │ ← Checkboxes (2 col)
│ ☐ Emirates       ☐ Qatar Airways    │
│ ☐ SpiceJet       ☐ Vistara          │
│                                     │
│ Departure Time                      │
│ ☐ Early morning (6AM-12PM)          │ ← Time slots
│ ☑ Afternoon (12PM-6PM)              │
│ ☐ Evening (6PM-12AM)                │
│ ☐ Night (12AM-6AM)                  │
│                                     │
│ [Scroll for more sections...]       │
│                                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │ ← Sticky bottom
│ │     APPLY FILTERS (142)         │ │ ← Shows result count
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🚗 **TRANSFERS - DUAL TAB LAYOUT**

```
┌─────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────────┐ │ ← Tab selector
│ │ AIRPORT TAXI│ │   CAR RENTALS   │ │ ← Active vs inactive
│ │  ●●●●●●●●●  │ │                 │ │ ← Visual indicator
│ └─────��───────┘ └─────────────────┘ │
├─────────────────────────────────────┤
│                                     │
│ One way ◉  Round trip ○             │ ← Trip type
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [🚗] Pickup Location       [×] │ │ ← Same input style
│ │     Mumbai Airport             │ │ ← as other modules
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [🎯] Drop-off Location     [×] │ │ ← Tap for full-screen
│ │     Select destination         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────┐ ┌─────────────┐ │
│ │ [📅] Wed Aug 27 │ │ [⏰] 10:30  │ │ ← Date + time
│ │ 10:30 AM        │ │ AM          │ │
│ └─────���───────────┘ └─────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [👥] 2 passengers               │ │ ← Passenger count
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         SEARCH TRANSFERS        │ │ ← Search button
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

CAR RENTALS TAB (when active):
┌─────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────────┐ │
│ │ AIRPORT TAXI│ │   CAR RENTALS   │ │
│ │             │ │  ●●●●●●●●●●●●●  │ │ ← Different active
│ └─────────────┘ └───────���─────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [🚗] Pickup Location       [×] │ │ ← Different icon maybe
│ │     Mumbai Airport             │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [📍] Return Location       [×] │ │ ← Return vs drop-off
│ │     Same as pickup             │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────┐ ┌─────────────┐ │
│ │ [📅] Pickup     │ │ [📅] Return │ │ ← Pickup + return
│ │ Wed Aug 27      │ │ Fri Aug 29  │ │
│ └─────────────────┘ └─────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [��] Car Type                   │ │ ← Vehicle selection
│ │     Economy                     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │         SEARCH CARS             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 📏 **PRECISE MEASUREMENTS**

### **Input Field Anatomy:**
```
┌─────────────────────────────────────┐ ← 44px (iOS) / 48px (Android) height
│ [🚗] │ Pickup Location      │ [×] │ ← Icon + text + clear
│     │                      │     │
│ 12px│ 16px medium text     │12px │ ← Spacing
└─────────────────────────────────────┘
   20px                        20px    ← Icon sizes
```

### **Touch Target Spacing:**
```
┌───────────────────────────���─────────┐
│ Input Field 1                       │ ← 44px min height
├─ 8px spacing ──────────────────────┤
│ Input Field 2                       │ ← 44px min height  
├─ 8px spacing ──────────────────────┤
│ Input Field 3                       │ ← 44px min height
└─────────────────────────────────────┘
```

### **Tab Bar Layout:**
```
┌─────────────────────────────────────┐
│   AIRPORT TAXI   │   CAR RENTALS    │ ← Equal width tabs
│      Active      │    Inactive      │ ← Visual states
│ ───●●●●●●●●───   │                  │ ← Active indicator
└─────────────────────────────────────┘
      50%                50%           ← Split evenly
```

---

## 🎨 **COLOR & STATE REFERENCES**

### **Input States:**
```
Default:   Border #E5E7EB, Text #374151, Placeholder #9CA3AF
Focus:     Border #3B82F6, Text #111827, Background #FFFFFF  
Filled:    Border #D1D5DB, Text #111827, Background #F9FAFB
Error:     Border #EF4444, Text #DC2626, Background #FEF2F2
```

### **Icons:**
```
Default:   #6B7280 (gray-500)
Active:    #3B82F6 (blue-500)  
Error:     #EF4444 (red-500)
Success:   #10B981 (green-500)
```

### **Tab States:**
```
Active:    Background #3B82F6, Text #FFFFFF, Bold weight
Inactive:  Background transparent, Text #6B7280, Medium weight
```

---

## ⚡ **INTERACTION BEHAVIORS**

### **Input Tap Flow:**
```
User taps input → Full-screen page slides up from bottom →
Keyboard appears → Input auto-focuses → User types →
Live suggestions appear → User selects → Page slides down →
Selected value appears in original input
```

### **Filter Tap Flow:**
```
User taps "Filters" → Full-screen sheet slides up →
Filter options visible → User makes selections →
"Apply" button updates count → User taps Apply →
Sheet slides down → Results page updates
```

### **Tab Switch Flow:**
```
User taps inactive tab → Smooth transition animation →
New tab content appears → Previous selections cleared →
Same input styling maintained → Focus on first input
```

---

## 🚫 **COMMON MISTAKES TO AVOID**

```
❌ Modal popups instead of full-screen pages
❌ Different input heights across modules
❌ Missing keyboard auto-focus on input pages
❌ No debounce on type-to-filter (causes lag)
❌ Inconsistent icon styles within app
❌ Touch targets smaller than 44px (iOS) / 48px (Android)
❌ Filter sheet without sticky Apply button
❌ Transfers tabs that look different from other inputs
❌ Missing clear (X) buttons in input fields
❌ Landing pages with different layouts per module
```

---

**This wireframe document should be used alongside `NATIVE_MOBILE_APP_FLOW_DIAGRAM.md` for complete implementation guidance.**
