# TBO Hotel Certification - Test Execution Guide

**Current Status:** Ready to Execute Tests Against Live Credentials

---

## 🚀 **Step-by-Step Execution**

### **Step 1: Run Certification Tests**

Execute the test runner from your Render production environment:

```bash
# SSH into Render or run via CLI
cd /path/to/project
node api/tests/tbo-certification-runner.js
```

**What This Does:**
- ✅ Executes all 8 certification test cases
- ✅ Uses your LIVE TBO credentials (already in env vars)
- ✅ Generates JSON request/response logs for each case
- ✅ Creates 2 output files:
  - `tbo-certification-results.json` - Complete JSON logs
  - `tbo-certification-summary.txt` - Text summary report

**Expected Output:**
```
================================================================================
# TBO HOTEL API - CERTIFICATION TEST RUNNER
# Agency: BOMF145
# Execution Time: 2025-05-15T10:30:00Z
# Total Cases: 8
================================================================================

[Progress through all 8 cases]

CERTIFICATION SUMMARY
================================================================================
Agency: BOMF145
Total Test Cases: 8
Passed: [X]
Failed: [Y]
...
```

### **Step 2: Verify Output Files**

Check that both files were created:

```bash
ls -lah tbo-certification-results.json
ls -lah tbo-certification-summary.txt

# View summary
cat tbo-certification-summary.txt
```

### **Step 3: Validate JSON Logs**

Open `tbo-certification-results.json` and verify:

✅ All 8 cases are present (caseId 1-8)
✅ Each case has complete request/response data
✅ Confirmation numbers are populated for successful cases
✅ All steps (search, room, block, book) executed

**Example JSON Structure:**
```json
{
  "agency": "BOMF145",
  "executionTime": "2025-05-15T10:30:00Z",
  "totalCases": 8,
  "results": [
    {
      "caseId": 1,
      "name": "Domestic Booking - Room 1: Adult 1",
      "description": "Single room, single adult in India",
      "timestamp": "2025-05-15T10:30:10Z",
      "steps": [
        {
          "step": "search",
          "request": { ... },
          "response": { ... },
          "status": 200
        },
        {
          "step": "room",
          "request": { ... },
          "response": { ... },
          "status": 200
        },
        {
          "step": "block",
          "request": { ... },
          "response": { ... },
          "status": 200
        },
        {
          "step": "book",
          "request": { ... },
          "response": { ... },
          "status": 200
        }
      ],
      "success": true,
      "confirmationNumber": "TBO-CONF-001"
    },
    ...
  ],
  "summary": {
    "passed": 8,
    "failed": 0,
    "errors": []
  }
}
```

---

## 📧 **Step 4: Prepare Certification Email**

### **Email Template for TBO**

**Subject Line:**
```
Hotel Certification Cases - Faredown (or Your Agency Name)
```

**Email Body:**
```
Dear TBO Certification Team,

We have completed the TBO Hotel API integration and executed all 8 certification test cases with our Live agency credentials (Agency ID: BOMF145).

Please find attached the JSON request/response logs for each case as required for the certification process.

CERTIFICATION TEST RESULTS SUMMARY:
================================================================================
Total Test Cases: 8
Passed: 8
Failed: 0
Agency ID: BOMF145
Execution Date: [YYYY-MM-DD HH:MM:SS UTC]
Environment: Production (Live Credentials)

TEST CASE DETAILS:
================================================================================

Case 1: Domestic Booking - Room 1: Adult 1
        Confirmation Number: [From JSON]
        Status: ✓ PASSED

Case 2: Domestic Booking - Room 1: Adult 2, Child 2
        Confirmation Number: [From JSON]
        Status: ✓ PASSED

Case 3: Domestic Booking - Room 1: Adult 1, Room 2: Adult 1
        Confirmation Number: [From JSON]
        Status: ✓ PASSED

Case 4: Domestic Booking - Room 1: Adult 1+Child 2, Room 2: Adult 2
        Confirmation Number: [From JSON]
        Status: ✓ PASSED

Case 5: International Booking - Room 1: Adult 1
        Confirmation Number: [From JSON]
        Status: ✓ PASSED

Case 6: International Booking - Room 1: Adult 2, Child 2
        Confirmation Number: [From JSON]
        Status: ✓ PASSED

Case 7: International Booking - Room 1: Adult 1, Room 2: Adult 1
        Confirmation Number: [From JSON]
        Status: ✓ PASSED

Case 8: International Booking - Room 1: Adult 1+Child 2, Room 2: Adult 2
        Confirmation Number: [From JSON]
        Status: ✓ PASSED

DOCUMENTATION ATTACHED:
1. tbo-certification-results.json - Complete JSON logs
2. tbo-certification-summary.txt - Text summary report
3. API Implementation Details - (if applicable)

We are ready to proceed to Step 2 of the certification process (API Validation) as soon as you have verified these logs.

Please confirm receipt and let us know the next steps.

Regards,
Faredown Team
Contact: [Your Contact Info]
```

---

## 📋 **Certification Process Timeline**

### **Step 1: Test Case Verification** (Current - YOU ARE HERE)
- ✅ Execute certification tests
- ✅ Generate JSON logs
- ✅ Submit to TBO
- ⏳ TBO verifies (3-4 working days)

### **Step 2: API Validation Queries**
- 🔄 TBO sends validation sheet
- 🔄 You provide comments
- ⏳ Processing: 3-4 working days

### **Step 3: Portal Verification**
- 🔄 Share website/portal URL
- 🔄 TBO verifies implementation
- 🔄 Complete validation sheet
- ⏳ Processing: 3-4 working days

### **Step 4: Sign-Off & Live Access**
- 🔄 TBO provides sign-off email
- 🔄 Live production credentials provided
- 🔄 IP whitelisting setup

### **Step 5: Go Live**
- 🔄 Update env vars with live credentials
- 🔄 Deploy to production
- 🔄 Monitor bookings

---

## 🔧 **Troubleshooting**

### **Issue: Tests Fail with "No Hotels Found"**

**Solution:**
1. Verify TBO credentials in `.env`:
   ```
   TBO_HOTEL_CLIENT_ID=tboprod
   TBO_HOTEL_USER_ID=BOMF145
   TBO_HOTEL_PASSWORD=@Bo#4M-Api@
   TBO_HOTEL_SEARCH_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult
   ```

2. Check TBO API connectivity:
   ```bash
   node api/scripts/test-tbo-connectivity.js
   ```

3. Verify city IDs are correct:
   - Mumbai: 10449
   - Delhi: 10448
   - Bangalore: 10446
   - Hyderabad: 10450
   - Dubai: 12345

### **Issue: Price Changed Warnings**

This is normal. TBO prices can change between search and booking. The system handles this correctly by flagging price changes in the JSON response.

### **Issue: Child Passenger Age Validation**

Ensure child ages match roomConfig:
```javascript
// ✓ Correct
roomConfigs: [{ adults: 2, children: 2, childAges: [8, 12] }]
passengers: [
  { title: "Mr", ... paxType: 1 },    // Adult
  { title: "Mrs", ... paxType: 1 },   // Adult
  { title: "Master", age: 8, paxType: 2 },  // Child
  { title: "Miss", age: 12, paxType: 2 }    // Child
]
```

---

## ✅ **Pre-Submission Checklist**

Before sending to TBO:

- [ ] All 8 test cases executed successfully
- [ ] `tbo-certification-results.json` contains all 8 cases
- [ ] `tbo-certification-summary.txt` shows 8/8 PASSED
- [ ] Each case has a confirmation number
- [ ] JSON is valid (no syntax errors)
- [ ] Agency ID is correct (BOMF145)
- [ ] Email subject line matches format
- [ ] Both JSON and text files attached
- [ ] Contact information included in email

---

## 📊 **Expected Test Case Summary**

| Case | Type | Rooms | Occupancy | Expected Status |
|------|------|-------|-----------|-----------------|
| 1 | Domestic | 1 | 1 Adult | ✓ PASS |
| 2 | Domestic | 1 | 2 Adults, 2 Children | ✓ PASS |
| 3 | Domestic | 2 | 1 Adult + 1 Adult | ✓ PASS |
| 4 | Domestic | 2 | 1 Adult + 2 Children + 2 Adults | ✓ PASS |
| 5 | International | 1 | 1 Adult | ✓ PASS |
| 6 | International | 1 | 2 Adults, 2 Children | ✓ PASS |
| 7 | International | 2 | 1 Adult + 1 Adult | ✓ PASS |
| 8 | International | 2 | 1 Adult + 2 Children + 2 Adults | ✓ PASS |

---

## 🎯 **Key Points**

1. **Live Credentials**: Tests run against your LIVE TBO agency credentials
2. **No Changes Needed**: The credentials you're already using will be preserved
3. **Data Submission**: Only JSON logs and summary are sent to TBO
4. **Processing Time**: TBO takes 3-4 working days for verification
5. **Next Steps**: After TBO verifies, you'll get validation sheet in Step 2

---

## 📞 **Support**

If you encounter issues:
1. Check Render logs: `Render > Dashboard > Logs`
2. Verify database has `tbo_hotel_bookings` table: Check pgAdmin
3. Test TBO connectivity: `node api/scripts/test-tbo-connectivity.js`
4. Review error in JSON output

---

## 🚀 **Next Phase**

After TBO confirms Step 1 (3-4 working days):
- You'll receive validation sheet
- Proceed to Step 2: API Validation Queries
- Follow up with portal verification
- Then go-live!

**Ready to execute tests?** Run the command and let me know the results!
