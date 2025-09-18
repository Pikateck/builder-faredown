# Airport Dropdown Fixes — QA Checklist

**Issue Reference:** BOM/DXB Display Problem  
**Developer:** Fusion AI Assistant  
**QA Period:** Post-Implementation Testing  
**Priority:** High (Critical UI Bug Fix)

---

## 📋 **QA Sign-Off Checklist**

| Area               | Checkpoint                                                               | Status | Tested By | Date |
| ------------------ | ------------------------------------------------------------------------ | ------ | --------- | ---- |
| **UI Behavior**    | Selecting DXB (or any airport) updates visible label instantly (desktop) | [ ]    |           |      |
|                    | Selecting airports updates correctly in mobile search + multi-city input | [ ]    |           |      |
|                    | Chosen airport persists between steps/pages                              | [ ]    |           |      |
| **Validation**     | Search blocked if any From/To field is blank                             | [ ]    |           |      |
|                    | Search blocked if From and To are the same airport                       | [ ]    |           |      |
|                    | Search blocked if any date is missing                                    | [ ]    |           |      |
|                    | Error messages display clearly and inline                                | [ ]    |           |      |
| **Data Flow**      | Console logs show correct `code + name` for each leg                     | [ ]    |           |      |
|                    | Console logs show full payload before submission                         | [ ]    |           |      |
|                    | API receives correct airport data (verified via Postman)                 | [ ]    |           |      |
|                    | No incorrect/fallback airport codes in API request body                  | [ ]    |           |      |
| **Database Logs**  | Entries created in `flight_search_logs` for every search                 | [ ]    |           |      |
|                    | Verification SQL shows no name/code mismatches vs master                 | [ ]    |           |      |
|                    | No entries where `from_code = to_code`                                   | [ ]    |           |      |
| **Cross-Platform** | Works on desktop browsers                                                | [ ]    |           |      |
|                    | Works on mobile web (Chrome, Safari)                                     | [ ]    |           |      |
|                    | Works in native iOS and Android apps                                     | [ ]    |           |      |
| **Cleanup**        | Debug console logs removed after QA passes                               | [ ]    |           |      |
|                    | Temporary DB logging removed/disabled post-production                    | [ ]    |           |      |

---

## 🧪 **Detailed Testing Instructions**

### **UI Behavior Tests**

1. **Desktop Multi-City Airport Selection**
   - Navigate to `/flights` and select "Multi-city"
   - Add a second flight leg
   - Change the second leg's destination from BOM to DXB
   - **Expected:** Label immediately shows "Dubai International" not "Rajiv Gandhi Shivaji International"

2. **Mobile Airport Selection**
   - Test on mobile browser or native app
   - Open flight search form
   - Select different airports for From/To fields
   - **Expected:** Selected airport names display correctly and persist

3. **Persistence Test**
   - Select airports, navigate away, then return
   - **Expected:** Previously selected airports remain visible

### **Validation Tests**

4. **Empty Field Validation**
   - Leave From or To field blank, attempt search
   - **Expected:** Inline error message, search blocked

5. **Same Airport Validation**
   - Set From and To to same airport (e.g., BOM → BOM)
   - **Expected:** Error message, search blocked

6. **Date Validation**
   - Leave departure date blank, attempt search
   - **Expected:** Error message, search blocked

### **Data Flow Tests**

7. **Console Logging**
   - Open browser dev tools → Console tab
   - Select airports and submit search
   - **Expected:** Logs show correct airport codes and names

8. **API Verification**
   - Use Postman collection: `Airport-Dropdown-Validation.postman_collection.json`
   - Run "Single Leg Flight Search - BOM to DXB" test
   - **Expected:** All tests pass, correct airport codes in API

### **Database Tests**

9. **Search Logging**
   - Perform a search, then run SQL:

   ```sql
   SELECT from_code, from_name, to_code, to_name
   FROM flight_search_logs
   ORDER BY created_at DESC LIMIT 5;
   ```

   - **Expected:** Recent search appears with correct codes/names

10. **Validation Query**
    ```sql
    SELECT * FROM flight_search_logs WHERE from_code = to_code;
    ```

    - **Expected:** No results (same From/To should be blocked)

### **Cross-Platform Tests**

11. **Desktop Browsers**
    - Test on Chrome, Firefox, Safari, Edge
    - **Expected:** Consistent behavior across browsers

12. **Mobile Browsers**
    - Test on mobile Chrome and Safari
    - **Expected:** Touch-friendly, no layout issues

13. **Native Apps**
    - Test on iOS and Android app builds
    - **Expected:** Same functionality as web

---

## 🔍 **Key Files to Verify**

### Frontend Components:

- `client/components/LandingPageSearchPanel.tsx`
- `client/components/mobile/MobileNativeSearchForm.tsx`
- `client/components/mobile/MobileFullScreenMultiCityInput.tsx`

### Backend Components:

- `api/routes/flights.js` (logFlightSearch function)
- `api/database/migrations/V2025_01_03_flight_search_logs.sql`

### Testing Tools:

- `api/postman/Airport-Dropdown-Validation.postman_collection.json`

---

## ✅ **Success Criteria**

**PASS Requirements:**

- [ ] All UI checkpoints pass on web and mobile
- [ ] All validation rules prevent invalid searches
- [ ] Console logs show correct airport data
- [ ] Database logs contain accurate search records
- [ ] Postman tests pass without errors
- [ ] No regression in existing functionality

**FAIL Criteria:**

- Airport names don't update correctly
- Same From/To searches are allowed
- Console logs show incorrect data
- Database contains mismatched airport codes
- Mobile functionality differs from web

---

## 🧹 **Post-QA Cleanup**

After all tests pass:

1. **Remove Debug Logs**
   - Remove `console.log()` statements from:
     - `LandingPageSearchPanel.tsx`
     - `MobileNativeSearchForm.tsx`
     - `MobileFullScreenMultiCityInput.tsx`

2. **Database Logging** (Optional)
   - Consider disabling `flight_search_logs` in production
   - Or add feature flag to control logging

---

## 📝 **QA Sign-Off**

**QA Lead:** ********\_\_\_\_********  
**Date Completed:** ********\_\_\_\_********  
**Overall Result:**

- [ ] **APPROVED** - Ready for production deployment
- [ ] **CONDITIONAL** - Minor fixes required (see notes)
- [ ] **REJECTED** - Major issues found, requires rework

**Notes:**

---

---

---

**Final Approval:** ********\_\_\_\_********
