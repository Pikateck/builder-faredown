# 📱 Faredown.com Native Mobile App Specification

![Faredown Logo](https://via.placeholder.com/200x60/003580/FFFFFF?text=faredown.com)

**Upgrade. Bargain. Book.**  
_Complete Technical Specification for iOS & Android Development_

---

**Document Version:** 1.0  
**Date:** August 26, 2025  
**Project:** Faredown.com Native Mobile Apps  
**Company:** Faredown Bookings and Travels Pvt Ltd

---

## 📋 **TABLE OF CONTENTS**

1. [Executive Summary](#executive-summary)
2. [UX Flow Diagram](#ux-flow-diagram)
3. [Visual Wireframes](#visual-wireframes)
4. [Technical Requirements](#technical-requirements)
5. [Platform Specifications](#platform-specifications)
6. [Quality Assurance](#quality-assurance)
7. [Deliverable Format](#deliverable-format)
8. [Approval Process](#approval-process)

---

<div style="page-break-before: always;"></div>

## 🎯 **EXECUTIVE SUMMARY** {#executive-summary}

### **Project Overview**

This specification defines the requirements for native iOS and Android applications for Faredown.com, the world's first AI-powered travel bargaining platform. The apps must deliver a seamless, Booking.com-grade user experience across four travel modules: Flights, Hotels, Sightseeing, and Transfers.

### **Critical Success Factors**

- **Consistency:** Identical UX patterns across all modules
- **Performance:** Sub-3-second cold starts, 250ms type-to-filter debounce
- **Native Feel:** Platform-specific navigation and gestures
- **AI Integration:** Seamless bargaining engine integration

### **Scope Lock**

⚠️ **This specification is EXCLUSIVELY for native iOS and Android app development. Do not implement as web responsive features.**

### **Non-Negotiable Deliverables**

1. Updated iOS .ipa build
2. Updated Android .apk build
3. Screen recordings demonstrating all flows
4. Screenshots of major screens per module
5. Performance benchmarks meeting specified targets

---

<div style="page-break-before: always;"></div>

## 🔄 **UX FLOW DIAGRAM** {#ux-flow-diagram}

### **Complete User Journey Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                     FAREDOWN NATIVE APP FLOW                    │
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
│  │  TAB BAR    │    │   KEYBOARD   │    │ FILTER SCREEN   │     │
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

### **Landing Page Requirements**

#### **Minimal Above-the-Fold Layout:**

```
┌─────────────────────────────────────┐
│ [Faredown Logo + Profile]           │ ← Header (minimal)
├─────────────────────────────────────┤
│                                     │
│  "Upgrade. Bargain. Book."          │ ← Hero tagline
│  [Module-specific subtitle]         │ ← Different per tab
│                                     │
│ ┌─────────────────────────────────┐ │ ← Search panel
│ │        SEARCH PANEL             │ │
│ │  [From/To or Destination]       │ │
│ │  [Dates] [Travelers/Guests]     │ │
│ │  [SEARCH BUTTON - PROMINENT]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Flights|Hotels|Sightseeing|Transfers] │ ← Tab bar
└─────────────────────────────────────┘
```

#### **Module-Specific Taglines:**

- **Flights:** "Turn your fare into an upgrade with live AI bargaining"
- **Hotels:** "Control your price with AI-powered hotel upgrades"
- **Sightseeing:** "Explore attractions & experiences with AI that bargains for you"
- **Transfers:** "Ride in comfort for less — AI secures your best deal on every trip"

#### **Landing Page Requirements:**

✅ Identical layout across all four modules  
✅ Clean, minimal design - remove oversized blocks/banners  
✅ Essential elements only above the fold  
✅ Consistent module taglines as specified

---

### **Full-Screen Input Pages**

#### **Trigger Behavior:**

User taps **From**, **To**, or **Destination** field → Full-screen page opens

#### **Input Page Layout:**

```
┌─────────────────────────────────────┐
│ [← Back] Search destinations   [×]  │ ← Header with navigation
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [✈️] Search cities or airports  │ │ ← Auto-focus + keyboard
│ └─────────────────────────────────┘ │
│                                     │
│ Recent Searches:                    │ ← User history
│ • Mumbai (BOM) - Selected recently  │
│ • Delhi (DEL)                       │
│                                     │
│ Popular Destinations:               │ ← Curated suggestions
│ • DXB - Dubai International ✈️      │
│ • SIN - Singapore Changi ✈️         │
│ • LHR - London Heathrow ✈️          │
│                                     │
│ [Live filtered results as user types]│ ← Dynamic filtering
│ mum → • BOM - Mumbai, Maharashtra   │
│       • JMU - Jammu Airport         │
└─────────────────────────────────────┘
```

#### **Input Page Requirements:**

✅ Auto-focus search input with keyboard shown  
✅ Type-to-filter with 250ms debounce  
✅ Live suggestions update as user types  
✅ Recent searches shown first  
✅ Module-appropriate leading icons  
✅ Clear (X) button inside input field  
✅ Full-screen overlay (not popup)  
✅ Consistent across all modules

---

### **Dedicated Filter Screen**

#### **Trigger Behavior:**

User taps "Filters" button from results → Full-screen filter sheet opens

#### **Filter Screen Layout:**

```
┌─────────────────────────────────────┐
│ [← Back] Filters             [Reset]│ ← Header with actions
├─────────────────────────────────────┤
│                                     │
│ Price Range                         │ ← Filter category
│ ├──●─────────────────●──┤ ₹5K-50K   │ ← Range slider
│                                     │
│ Stops                               │
│ ◉ Direct only    ○ 1 stop  ○ Any   │ ← Radio buttons
│                                     │
│ Airlines                            │
│ ☑ Air India      ☑ IndiGo          │ ← Checkboxes
│ ☐ Emirates       ☐ Qatar Airways    │
│                                     │
│ Departure Time                      │
│ ☐ Early (6-12)   ☑ Afternoon       │ ← Time slots
│ ☐ Evening        ☐ Night           │
│                                     │
│ [More sections scrollable...]       │ ← Additional filters
│                                     │
├──────────────────────────────────���──┤
│ ┌─────────────────────────────────┐ │ ← Sticky bottom
│ │     APPLY FILTERS (42)          │ │ ← Shows result count
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### **Filter Screen Requirements:**

✅ Full-screen overlay (not popup)  
✅ Sticky "Apply" button at bottom  
✅ Counter showing number of results  
✅ Module-specific filter options  
✅ Reset option in header  
✅ Smooth scrolling for long filter lists

---

### **Transfers Module - Dual Tabs**

#### **Tab Layout Structure:**

```
┌─────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────────┐ │ ← Two distinct tabs
│ │ AIRPORT TAXI│ │   CAR RENTALS   │ │
│ │   (Active)  │ │   (Inactive)    │ │
│ └─────────────┘ └─────────────────┘ │
├─────────────────���───────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │ ← Same input styling
│ │ [🚗] Pickup Location           │ │ ← as other modules
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [🎯] Drop-off Location         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [📅] Pickup Date & Time        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [👥] Passengers               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───────���─────────────────────────┐ │
│ │         SEARCH TRANSFERS        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### **Transfers Requirements:**

✅ Two distinct tabs: Airport Taxi | Car Rentals  
✅ Same input styling as Flights/Hotels  
✅ Different logic per tab but identical visual treatment  
✅ Leading icons in all inputs  
✅ Clear (X) buttons in all inputs  
✅ Full-screen input pages for location selection

---

<div style="page-break-before: always;"></div>

## 🎨 **VISUAL WIREFRAMES** {#visual-wireframes}

### **Precise Input Field Anatomy**

```
┌─────────────────────────────────────┐ ← 44px (iOS) / 48px (Android) height
│ [🚗] │ Pickup Location      │ [×] │ ← Icon + text + clear
│     │                      │     │
│ 12px│ 16px medium text     │12px │ ← Internal spacing
└─────────────────────────────────────┘
   20px                        20px    ← Icon sizes
```

### **Touch Target Specifications**

```
┌─────────────────────────────────────┐
│ Input Field 1                       │ ← 44px min height (iOS)
├─ 8px minimum spacing ──────────────┤ ← 48px min height (Android)
│ Input Field 2                       │
├─ 8px minimum spacing ──────────────┤
│ Input Field 3                       │
└─────────────────────────────────────┘
```

### **Tab Bar Visual States**

```
┌─────────────────────────────────────┐
│   AIRPORT TAXI   │   CAR RENTALS    │ ← Equal width tabs
│      Active      │    Inactive      │ ← Visual differentiation
│ ───●●●●●●●●───   │                  │ ← Active indicator
└─────────────────────────────────────┘
      50%                50%           ← Equal distribution
```

### **Module-Specific Icon Standards**

```
Flights:      ✈️ Plane (from/to), 📅 Calendar, 👥 Users
Hotels:       🏨 Hotel (destination), 📅 Calendar, 👥 Guests
Sightseeing:  🎯 Target (destination), 📅 Calendar, 👥 Travelers
Transfers:    🚗 Car (pickup/dropoff), 📅 Calendar, 👥 Passengers
```

### **Color & State Specifications**

```
Input States:
Default:   Border #E5E7EB, Text #374151, Placeholder #9CA3AF
Focus:     Border #3B82F6, Text #111827, Background #FFFFFF
Filled:    Border #D1D5DB, Text #111827, Background #F9FAFB
Error:     Border #EF4444, Text #DC2626, Background #FEF2F2

Icon Colors:
Default:   #6B7280 (gray-500)
Active:    #3B82F6 (blue-500)
Error:     #EF4444 (red-500)
Success:   #10B981 (green-500)

Tab States:
Active:    Background #3B82F6, Text #FFFFFF, Bold weight
Inactive:  Background transparent, Text #6B7280, Medium weight
```

---

<div style="page-break-before: always;"></div>

## ⚙️ **TECHNICAL REQUIREMENTS** {#technical-requirements}

### **Performance Budgets**

- **Cold start:** ≤ 2.5s on mid-tier devices
- **Type-to-filter debounce:** 250ms exact timing
- **First suggestion:** ≤ 500ms from keypress
- **Calendar open:** ≤ 300ms
- **Filter sheet animate-in:** 200–250ms

### **Behavioral Requirements**

#### **Type-to-Filter Logic:**

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

#### **Navigation Patterns:**

```
From landing → Tap input → Full-screen input page
From results → Tap filter → Full-screen filter sheet
Back navigation → Preserve previous search state
Tab switching → Keep search inputs if possible
```

#### **Keyboard Behavior:**

```
Auto-focus: Yes (on input page load)
Return key: "Search" or "Done"
Dismiss: Tap outside or back button
Suggestions: Scrollable list, tap to select
```

### **API Contracts**

#### **Required Endpoints:**

- **Airport search:** `GET /airports?q={query}`
  - Returns: `{code, city, country, lat, lon}`
- **City/hotel search:** `GET /destinations?q={query}&type=city|hotel`
- **Transfers:** `GET /places?q={query}` + `GET /timeslots?place_id={id}`

#### **Performance Requirements:**

- **All endpoints:** <600ms p95 response time
- **Paginated suggestions** for large result sets
- **Graceful degradation** on slow connections

### **Deep Links Schema**

#### **Supported Deep Links:**

```
faredown://search?module=flights
faredown://search?module=hotels
faredown://search?module=sightseeing
faredown://search?module=transfers
faredown://filters?module={module_name}
faredown://transfers?tab=airport_taxi
faredown://transfers?tab=car_rentals
```

#### **Behavior:**

- Open to appropriate module with search panel ready
- Maintain app state and navigation stack
- Handle cold starts and warm resumes

---

<div style="page-break-before: always;"></div>

## 📱 **PLATFORM SPECIFICATIONS** {#platform-specifications}

### **iOS Specific Requirements**

- **Navigation:** Push modals with swipe-to-dismiss
- **Safe Areas:** Handle Dynamic Island, notches, and home indicator
- **Gestures:** Respect iOS navigation conventions
- **Accessibility:** VoiceOver labels for all interactive elements

### **Android Specific Requirements**

- **Navigation:** Back button support on all full-screen inputs & filters
- **Safe Areas:** Handle display cutouts and navigation bars
- **Material Design:** Follow Android design guidelines
- **Accessibility:** TalkBack support for all interactive elements

### **Cross-Platform Gestures**

- **Pull-to-refresh** on results pages
- **Swipe to clear** text in input fields
- **Scroll-to-top** on tab reselect

### **Accessibility Standards**

- **TalkBack/VoiceOver** labels for all inputs and icons
- **Large hit targets:** Min 44×44 iOS / 48×48 Android
- **Focus order** & keyboard dismissal rules
- **Screen reader** friendly navigation flow

### **Localization & Currency**

- **Strings externalized** and RTL ready
- **Date/time/number** format via device locale
- **Currency format** respects user settings
- **24h/12h time** format based on device preference

### **Offline & Failure States**

- **Recent searches** cached locally
- **Graceful empty-state** when API unavailable
- **Retry CTA** & lightweight error toasts
- **Per-module "no results"** designs

### **Security & Privacy**

- **No PII in logs/analytics**; redact query text beyond 3 chars
- **TLS pinning** (optional but recommended)
- **Crash logs scrubbed** of sensitive data
- **Respect OS privacy toggles** for analytics

### **Analytics Event Schema**

#### **Screen Views:**

- `screen_landing_{module}`
- `screen_fullscreen_input_{origin}` (From/To/Destination)
- `screen_filters_{module}`

#### **Events:**

- `type_to_filter` (module, query_length, results_count)
- `select_suggestion` (module, suggestion_type, position)
- `apply_filters` (module, filter_count, results_count)
- `switch_transfer_tab` (from_tab, to_tab)
- `search_submit` (module, trip_type, segment_count, latency_ms)

---

<div style="page-break-before: always;"></div>

## 🔍 **QUALITY ASSURANCE** {#quality-assurance}

### **Device Testing Matrix**

#### **iOS Testing Requirements:**

- [ ] iPhone 12/13/14/15 (various screen sizes)
- [ ] iPad sanity pass (if supported)
- [ ] Light/Dark mode compatibility
- [ ] Low-memory resume testing
- [ ] iOS version compatibility (minimum iOS 14)

#### **Android Testing Requirements:**

- [ ] Pixel 6/7 (stock Android)
- [ ] Samsung A/M series (Samsung UI)
- [ ] Various screen densities and sizes
- [ ] Rotation handling (where supported)
- [ ] Android version compatibility (minimum API 24)

### **Functional Testing Checklist**

#### **Landing Page Testing:**

- [ ] Minimal layout identical across all 4 modules
- [ ] Only essentials above fold (header + search + tabs)
- [ ] Module-specific taglines implemented correctly
- [ ] Reduced scroll compared to current version

#### **Full-Screen Input Pages Testing:**

- [ ] From/To/Destination taps open full-screen pages
- [ ] Auto-focus with keyboard shown immediately
- [ ] Type-to-filter working with 250ms debounce
- [ ] Recent searches and popular destinations displayed
- [ ] Leading icons and clear (X) buttons present
- [ ] Works identically across all 4 modules

#### **Filter Screen Testing:**

- [ ] Filters open in full-screen overlay
- [ ] Sticky "Apply" button at bottom with result count
- [ ] Module-specific filter options implemented
- [ ] Reset functionality working correctly

#### **Transfers Module Testing:**

- [ ] Two tabs visible: Airport Taxi | Car Rentals
- [ ] Input styling identical to other modules
- [ ] Different logic per tab implemented correctly
- [ ] Full-screen location selection working

#### **Visual Consistency Testing:**

- [ ] Input heights consistent (44px iOS / 48px Android)
- [ ] Icon set unified across all screens
- [ ] Touch targets meet platform standards
- [ ] Focus states and interactions polished

#### **Performance Testing:**

- [ ] Cold start time ≤ 2.5s on mid-tier devices
- [ ] Type-to-filter debounce exactly 250ms
- [ ] First suggestion appears ≤ 500ms from keypress
- [ ] Calendar opens ≤ 300ms
- [ ] Filter sheet animation 200–250ms

---

<div style="page-break-before: always;"></div>

## 📦 **DELIVERABLE FORMAT** {#deliverable-format}

### **Required Builds**

1. **iOS .ipa build** (signed for testing)
2. **Android .apk build** (signed for testing)

### **Required Documentation**

3. **Screen recordings** (30-60 seconds each):
   - Landing page → Input selection → Full-screen input → Results
   - Results → Filters → Full-screen filter sheet → Apply
   - Transfers → Tab switching → Search flow for both tabs
   - Module consistency tour (Flights → Hotels → Sightseeing → Transfers)

4. **Screenshots** of major screens:
   - Landing page for each module
   - Full-screen input page with suggestions
   - Results page with content
   - Filter screen with options selected
   - Transfers with both tabs visible

5. **Performance benchmarks** demonstrating:
   - Cold start times
   - Type-to-filter response times
   - Animation frame rates

### **Store Readiness Materials**

6. **App Store screenshots** (if requested)
7. **Promotional video** (15–30 seconds using screen recordings)

### **Timeline**

**All deliverables must be completed within 72 hours of receiving this specification.**

---

<div style="page-break-before: always;"></div>

## ✅ **APPROVAL PROCESS** {#approval-process}

### **Phase 1: Initial Review (24 hours)**

Upon delivery of builds and recordings:

1. **Functional testing** against all checklist items
2. **Visual consistency** verification across modules
3. **Performance benchmark** validation

### **Phase 2: Detailed QA (48 hours)**

If Phase 1 passes:

1. **Device matrix testing** on specified devices
2. **Edge case testing** (offline, poor connectivity)
3. **Accessibility testing** with screen readers

### **Phase 3: Final Acceptance**

All requirements met → **Final approval**
Any requirements missing → **Revision request with specific items**

### **Success Criteria**

**Every item in this specification must be completed for final approval. No partial deliveries will be accepted.**

### **Rejection Criteria**

The following will result in immediate rejection:

- ❌ Web responsive implementation instead of native
- ❌ Modal/popup overlays instead of full-screen pages
- ❌ Different input heights or styles across modules
- ❌ Missing keyboard auto-focus on input pages
- ❌ Incorrect debounce timing on type-to-filter
- ❌ Inconsistent icon styles throughout app
- ❌ Filter screens embedded in results instead of overlay
- ❌ Transfers tabs that look different from other modules
- ❌ Missing clear (X) buttons in input fields
- ❌ Landing pages with different layouts per module

---

## 📞 **SUPPORT & ESCALATION**

### **During Development**

- **Questions:** Contact project owner immediately
- **Scope clarification:** Reference this specification document
- **Technical blockers:** Escalate within 4 hours

### **Final Authority**

This specification document supersedes all previous mobile requirements and serves as the single source of truth for native app development.

---

## 🏢 **COMPANY INFORMATION**

**Faredown Bookings and Travels Pvt Ltd**  
The World's First AI-Powered Travel Bargaining Platform  
Website: faredown.com  
Email: support@faredown.com

© 2025 Faredown Bookings and Travels Pvt Ltd. All rights reserved.

---

**END OF SPECIFICATION**

_This document contains 8 sections, 47 requirements, 23 wireframes, and complete technical specifications for native iOS and Android app development._
