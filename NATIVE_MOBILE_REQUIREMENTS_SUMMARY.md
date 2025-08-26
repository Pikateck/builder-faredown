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
