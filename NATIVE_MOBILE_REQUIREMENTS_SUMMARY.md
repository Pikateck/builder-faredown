# 📋 Native Mobile Requirements - Executive Summary

**Project:** Faredown.com iOS & Android Apps  
**Deadline:** 72 hours from specification delivery  
**Reference:** See `NATIVE_MOBILE_APP_FLOW_DIAGRAM.md` and `NATIVE_MOBILE_WIREFRAMES.md`

---

## 🎯 **NON-NEGOTIABLE DELIVERABLES**

1. **Updated iOS .ipa build**
2. **Updated Android .apk build**
3. **Screen recordings** showing each UX flow
4. **Screenshots** of major screens per module

---

## ✅ **CRITICAL REQUIREMENTS CHECKLIST**

### **Landing Page (All Modules)**

- [ ] **Minimal layout** - only header + tagline + search panel + tabs above fold
- [ ] **Identical structure** across Flights, Hotels, Sightseeing, Transfers
- [ ] **Module-specific taglines** implemented correctly
- [ ] **Reduced scroll** compared to current version

### **Full-Screen Input Pages**

- [ ] **From/To/Destination taps** open full-screen pages (not popups)
- [ ] **Auto-focus** with keyboard shown immediately
- [ ] **Type-to-filter** with 250ms debounce working
- [ ] **Recent searches** and **popular destinations** displayed
- [ ] **Leading icons** + **clear (X) buttons** in all inputs
- [ ] **Consistent behavior** across all 4 modules

### **Dedicated Filter Screen**

- [ ] **Full-screen overlay** (not embedded in results)
- [ ] **Sticky "Apply" button** at bottom with result count
- [ ] **Module-specific filters** (Stops, Airlines, etc.)
- [ ] **Reset functionality** working

### **Transfers Module**

- [ ] **Two tabs visible:** "Airport Taxi" | "Car Rentals"
- [ ] **Same input styling** as Flights/Hotels (height, radius, padding)
- [ ] **Different logic per tab** but same visual treatment
- [ ] **Full-screen location selection** working for both tabs

### **Visual Consistency**

- [ ] **Input heights:** 44px (iOS) / 48px (Android) exactly
- [ ] **Icon set unified** - one consistent style throughout
- [ ] **Touch targets** meet platform standards (44px+ / 48px+)
- [ ] **Focus states** and interactions polished

---

## 🚫 **WHAT WILL BE REJECTED**

- ❌ Web responsive implementation instead of native
- ❌ Modal/popup overlays instead of full-screen pages
- ❌ Different input heights or styles across modules
- ❌ Missing keyboard auto-focus on input pages
- ❌ No debounce timing on type-to-filter
- ❌ Inconsistent icon styles
- ❌ Filter screens embedded in results instead of overlay
- ❌ Transfers tabs that look different from other modules
- ❌ Missing clear (X) buttons in inputs
- ❌ Landing pages with different layouts per module

---

## 📱 **REQUIRED SCREEN RECORDINGS**

**Duration:** 30-60 seconds each

### **1. Input Flow Recording:**

- Start on landing page
- Tap "From" or "To" input
- Show full-screen page opening
- Type letters (e.g., "mum")
- Show live filtering working
- Select result
- Show return to landing with selection

### **2. Filter Flow Recording:**

- Start on results page
- Tap "Filters" button
- Show full-screen filter sheet
- Make some filter selections
- Show "Apply" button with count updating
- Tap Apply
- Show return to results with filters applied

### **3. Transfers Flow Recording:**

- Start on Transfers landing
- Show both tabs: Airport Taxi | Car Rentals
- Tap Airport Taxi tab, fill inputs
- Switch to Car Rentals tab
- Show different logic but same styling
- Complete a search flow

### **4. Module Consistency Recording:**

- Quick tour showing landing pages for Flights → Hotels → Sightseeing → Transfers
- Demonstrate identical layouts and input behaviors
- Show same input page experience across modules

---

## 📊 **SUCCESS CRITERIA**

**Visual Parity:** All modules look and behave identically  
**UX Consistency:** Same interaction patterns throughout  
**Performance:** Smooth animations, no lag on type-to-filter  
**Platform Compliance:** Follows iOS/Android design guidelines  
**Booking.com Reference:** Matches expected mobile travel app UX

---

## 🔄 **APPROVAL PROCESS**

1. **Native team** delivers builds + recordings
2. **Testing** against this checklist (all items must pass)
3. **Approval** or **revision requests** within 24 hours
4. **Final acceptance** only when all requirements met

---

## 📞 **ESCALATION**

**Questions during development:** Contact project owner immediately  
**Scope clarification:** Reference the detailed specification docs  
**Technical blockers:** Escalate within 4 hours, don't wait

---

**Remember:** This is for **native iOS/Android apps only** - not web responsive features.

---

## 🔧 **PLATFORM SPECIFICS**

### **Navigation Patterns:**

- **iOS:** Push modals with swipe-to-dismiss; respect iOS navigation conventions
- **Android:** Back button support on all full-screen inputs & filters; material design patterns

### **Gestures:**

- **Pull-to-refresh** on results pages
- **Swipe to clear** text in input fields
- **Scroll-to-top** on tab reselect

### **Safe Areas:**

- **iPhone:** Dynamic Island / notches handled properly
- **Android:** Display cutouts and navigation bars
- **Bottom insets** with sticky "Apply" button positioning

---

## ⏱ **PERFORMANCE BUDGETS**

- **Cold start:** ≤ 2.5s on mid-tier devices
- **Type-to-filter debounce:** 250ms exact timing
- **First suggestion:** ≤ 500ms from keypress
- **Calendar open:** ≤ 300ms
- **Filter sheet animate-in:** 200–250ms

---

## ♿ **ACCESSIBILITY REQUIREMENTS**

- **TalkBack/VoiceOver** labels for all inputs and icons (including "Clear (X)")
- **Large hit targets:** Min 44×44 iOS / 48×48 Android
- **Focus order** & keyboard dismissal rules implemented
- **Screen reader** friendly navigation flow

---

## 🌐 **LOCALIZATION & CURRENCY**

- **Strings externalized** and RTL ready
- **Date/time/number** format via device locale
- **Currency format** respects user settings
- **24h/12h time** format based on device preference

---

## 📡 **OFFLINE & FAILURE STATES**

- **Recent searches** cached locally
- **Graceful empty-state** when API unavailable
- **Retry CTA** & lightweight error toasts
- **Per-module "no results"** designs implemented

---

## 🔒 **SECURITY & PRIVACY**

- **No PII in logs/analytics**; redact query text beyond 3 chars
- **TLS pinning** (optional but recommended)
- **Crash logs scrubbed** of sensitive data
- **Respect OS privacy toggles** for analytics

---

## 📊 **ANALYTICS EVENT SCHEMA**

### **Screen Views:**

- `screen_landing_{module}`
- `screen_fullscreen_input_{origin}` (From/To/Destination)
- `screen_filters_{module}`

### **Events:**

- `type_to_filter` (module, query_length, results_count)
- `select_suggestion` (module, suggestion_type, position)
- `apply_filters` (module, filter_count, results_count)
- `switch_transfer_tab` (from_tab, to_tab)
- `search_submit` (module, trip_type, segment_count, latency_ms)

---

## 🔁 **QA CHECKLIST - DEVICE MATRIX**

### **iOS Testing:**

- [ ] iPhone 12/13/14/15 (various screen sizes)
- [ ] iPad sanity pass (if supported)
- [ ] Light/Dark mode screenshots
- [ ] Low-memory resume testing

### **Android Testing:**

- [ ] Pixel 6/7 (stock Android)
- [ ] Samsung A/M series (Samsung UI)
- [ ] Various screen densities and sizes
- [ ] Rotation handling (where supported)

---

## 🧩 **API CONTRACTS**

### **Required Endpoints:**

- **Airport search:** `GET /airports?q={query}`
  - Returns: `{code, city, country, lat, lon}`
- **City/hotel search:** `GET /destinations?q={query}&type=city|hotel`
- **Transfers:** `GET /places?q={query}` + `GET /timeslots?place_id={id}`

### **Performance Requirements:**

- **All endpoints:** <600ms p95 response time
- **Paginated suggestions** for large result sets
- **Graceful degradation** on slow connections

---

## 🧭 **DEEP LINKS SCHEMA**

### **Supported Deep Links:**

- `faredown://search?module=flights`
- `faredown://search?module=hotels`
- `faredown://search?module=sightseeing`
- `faredown://search?module=transfers`
- `faredown://filters?module={module_name}`
- `faredown://transfers?tab=airport_taxi`
- `faredown://transfers?tab=car_rentals`

### **Behavior:**

- Open to appropriate module with search panel ready
- Maintain app state and navigation stack
- Handle cold starts and warm resumes

---

## 🖼 **STORE READINESS**

### **Required Screenshots:**

- Landing page for each module
- Full-screen input page with suggestions
- Results page with content
- Filter screen with options selected
- Transfers with both tabs visible

### **Promotional Video:**

- **Duration:** 15–30 seconds
- **Content:** Reuse screen recordings from deliverables
- **Focus:** Key UX flows and AI bargaining features
- **Format:** MP4, 1080p minimum

---

## 🎯 **FINAL ACCEPTANCE CRITERIA**

**All items above MUST be completed for final approval. No partial deliveries accepted.**
