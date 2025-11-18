# TBO Hotel Certification - Step-by-Step Scenario Testing

**Current Status:** Testing individual scenarios one by one  
**Prerequisites:** Agency balance must be sufficient (minimum ~USD 500 for all 8 scenarios)

---

## 🎯 **Testing Strategy**

You can test scenarios in **2 ways**:

1. **Via API (Faster)** - Direct API calls to verify backend
2. **Via Frontend (Real UX)** - Test actual user journey in browser

---

## 📋 **The 8 Scenarios**

| #     | Type          | Room Config | Details               | Status     |
| ----- | ------------- | ----------- | --------------------- | ---------- |
| **1** | Domestic      | 1 Room      | 1 Adult               | 🔄 Pending |
| **2** | Domestic      | 1 Room      | 2 Adults + 2 Children | 🔄 Pending |
| **3** | Domestic      | 2 Rooms     | 1 Adult + 1 Adult     | 🔄 Pending |
| **4** | Domestic      | 2 Rooms     | 1A+2C + 2 Adults      | 🔄 Pending |
| **5** | International | 1 Room      | 1 Adult               | 🔄 Pending |
| **6** | International | 1 Room      | 2 Adults + 2 Children | 🔄 Pending |
| **7** | International | 2 Rooms     | 1 Adult + 1 Adult     | 🔄 Pending |
| **8** | International | 2 Rooms     | 1A+2C + 2 Adults      | 🔄 Pending |

---

## 🔧 **BEFORE YOU START**

### **Step 0: Verify Agency Balance**

Check if you have enough balance:

```bash
cd /opt/render/project/src

# Check TBO balance
node -e "
const axios = require('axios');
const payload = {
  Username: process.env.TBO_HOTEL_USER_ID,
  Password: process.env.TBO_HOTEL_PASSWORD,
  EndUserIp: '52.5.155.132'
};

const httpsAgent = require('https').Agent({ rejectUnauthorized: false });

axios.post('https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/GetAgencyBalance', payload, { httpsAgent })
  .then(res => {
    console.log('\n✅ TBO AGENCY BALANCE:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('\n❌ Balance check failed:');
    console.error(err.response?.data || err.message);
  });
"
```

**If balance is insufficient:**

1. Contact TBO support
2. Add credit to your account
3. Wait for confirmation (usually instant)
4. Try balance check again

---

## 🏨 **SCENARIO 1: Domestic Booking (1 Room, 1 Adult)**

### **Test via API**

Create a file: `test-scenario-1.js`

```javascript
const axios = require("axios");
require("dotenv").config({ path: "./.env" });

const API_BASE = "http://localhost:3000/api";

async function testScenario1() {
  console.log("\n" + "=".repeat(80));
  console.log("SCENARIO 1: Domestic Booking (1 Room, 1 Adult)");
  console.log("=".repeat(80));

  try {
    // Step 1: Search
    console.log("\n[Step 1] Searching for hotels in Mumbai...");
    const searchRes = await axios.post(`${API_BASE}/tbo/search`, {
      destination: "Mumbai",
      cityId: 10449,
      countryCode: "IN",
      checkIn: "2025-12-20",
      checkOut: "2025-12-22",
      rooms: [{ adults: 1, children: 0, childAges: [] }],
      currency: "INR",
      guestNationality: "IN",
    });

    if (!searchRes.data.success) {
      throw new Error("Search failed: " + searchRes.data.error);
    }

    console.log(`✅ Found ${searchRes.data.hotels.length} hotels`);
    const hotel = searchRes.data.hotels[0];
    const traceId = searchRes.data.traceId;

    console.log(`   Hotel: ${hotel.hotelName}`);
    console.log(
      `   Price: ${hotel.price?.offeredPrice} ${hotel.price?.currencyCode}`,
    );

    // Step 2: Get Room Details
    console.log("\n[Step 2] Getting room details...");
    const roomRes = await axios.post(`${API_BASE}/tbo/room`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      checkInDate: "2025-12-20",
      checkOutDate: "2025-12-22",
      noOfRooms: 1,
    });

    if (!roomRes.data.success) {
      throw new Error("Room details failed: " + roomRes.data.error);
    }

    console.log(`✅ Got room details`);
    const roomDetails = roomRes.data.hotelRoomDetails;

    // Step 3: Block Room
    console.log("\n[Step 3] Blocking room...");
    const blockRes = await axios.post(`${API_BASE}/tbo/block`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      guestNationality: "IN",
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelRoomDetails: roomDetails,
    });

    if (!blockRes.data.success) {
      throw new Error("Block failed: " + blockRes.data.error);
    }

    console.log(`✅ Room blocked successfully`);
    const bookingId = blockRes.data.bookingId;
    console.log(`   Booking ID: ${bookingId}`);

    if (blockRes.data.isPriceChanged) {
      console.log(
        `   ⚠️  Price changed: ${blockRes.data.hotelRoomDetails[0].price?.offeredPrice}`,
      );
    }

    // Step 4: Book Hotel
    console.log("\n[Step 4] Booking hotel...");
    const bookRes = await axios.post(`${API_BASE}/tbo/book`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      bookingId,
      guestNationality: "IN",
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelRoomDetails: blockRes.data.hotelRoomDetails,
      hotelPassenger: [
        {
          Title: "Mr",
          FirstName: "Rajesh",
          LastName: "Kumar",
          PaxType: 1,
          Nationality: "IN",
          Email: "rajesh@example.com",
          Phoneno: "+919876543210",
        },
      ],
    });

    if (!bookRes.data.success) {
      throw new Error("Book failed: " + bookRes.data.error);
    }

    console.log(`✅ Hotel booked successfully!`);
    console.log(`   Confirmation No: ${bookRes.data.confirmationNo}`);
    console.log(`   Booking Ref: ${bookRes.data.bookingRefNo}`);

    console.log("\n✅ SCENARIO 1 PASSED");
    return {
      scenario: 1,
      status: "PASSED",
      confirmationNo: bookRes.data.confirmationNo,
      bookingRef: bookRes.data.bookingRefNo,
    };
  } catch (error) {
    console.error("\n❌ SCENARIO 1 FAILED");
    console.error("Error:", error.response?.data || error.message);
    return {
      scenario: 1,
      status: "FAILED",
      error: error.message,
    };
  }
}

testScenario1().then((result) => {
  console.log("\n" + "=".repeat(80));
  console.log(JSON.stringify(result, null, 2));
  console.log("=".repeat(80));
});
```

**Run it:**

```bash
cd /opt/render/project/src
node test-scenario-1.js
```

---

### **Test via Frontend (Browser)**

1. Go to: `https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/`
2. Fill search form:
   - **Destination:** Mumbai
   - **Check-in:** 2025-12-20
   - **Check-out:** 2025-12-22
   - **Rooms:** 1 Adult
   - **Nationality:** India (IN)
3. Click **Search**
4. Select first hotel
5. Select a room
6. Click **Book Now**
7. Fill passenger details:
   - **Title:** Mr
   - **First Name:** Rajesh
   - **Last Name:** Kumar
   - **Email:** rajesh@example.com
   - **Phone:** +919876543210
8. Click **Confirm Booking**
9. ✅ Verify confirmation number appears

---

## 🏨 **SCENARIO 2: Domestic (1 Room, 2 Adults + 2 Children)**

### **API Test**

Same as Scenario 1, but change:

```javascript
// Search
rooms: [{ adults: 2, children: 2, childAges: [8, 12] }],

// Book - add all 4 passengers
hotelPassenger: [
  {
    Title: 'Mr',
    FirstName: 'Amit',
    LastName: 'Singh',
    PaxType: 1, // Adult
    Nationality: 'IN',
    Email: 'amit@example.com',
    Phoneno: '+919876543211'
  },
  {
    Title: 'Mrs',
    FirstName: 'Priya',
    LastName: 'Singh',
    PaxType: 1, // Adult
    Nationality: 'IN',
    Email: 'priya@example.com',
    Phoneno: '+919876543211'
  },
  {
    Title: 'Master',
    FirstName: 'Arjun',
    LastName: 'Singh',
    PaxType: 2, // Child
    Age: 8,
    Nationality: 'IN',
    Email: 'amit@example.com',
    Phoneno: '+919876543211'
  },
  {
    Title: 'Miss',
    FirstName: 'Aisha',
    LastName: 'Singh',
    PaxType: 2, // Child
    Age: 12,
    Nationality: 'IN',
    Email: 'amit@example.com',
    Phoneno: '+919876543211'
  }
]
```

---

## 🏨 **SCENARIO 3: Domestic (2 Rooms, 1 Adult each)**

### **Changes:**

```javascript
// Search
rooms: [
  { adults: 1, children: 0, childAges: [] },
  { adults: 1, children: 0, childAges: [] }
],
noOfRooms: 2,

// Book - 2 passengers
hotelPassenger: [
  {
    Title: 'Mr',
    FirstName: 'Vikram',
    LastName: 'Patel',
    PaxType: 1,
    Nationality: 'IN',
    Email: 'vikram@example.com',
    Phoneno: '+919876543212'
  },
  {
    Title: 'Mr',
    FirstName: 'Rohan',
    LastName: 'Sharma',
    PaxType: 1,
    Nationality: 'IN',
    Email: 'rohan@example.com',
    Phoneno: '+919876543213'
  }
]
```

---

## 🏨 **SCENARIO 4: Domestic (2 Rooms, Mixed Occupancy)**

### **Changes:**

```javascript
// Search
rooms: [
  { adults: 1, children: 2, childAges: [6, 10] },
  { adults: 2, children: 0, childAges: [] }
],
noOfRooms: 2,

// Book - 5 passengers (1A+2C from room 1, 2A from room 2)
hotelPassenger: [
  { Title: 'Mr', FirstName: 'Suresh', LastName: 'Verma', PaxType: 1, ... },
  { Title: 'Master', FirstName: 'Aman', LastName: 'Verma', PaxType: 2, Age: 6, ... },
  { Title: 'Miss', FirstName: 'Ananya', LastName: 'Verma', PaxType: 2, Age: 10, ... },
  { Title: 'Mr', FirstName: 'Anil', LastName: 'Gupta', PaxType: 1, ... },
  { Title: 'Mrs', FirstName: 'Sunita', LastName: 'Gupta', PaxType: 1, ... }
]
```

---

## 🌍 **SCENARIO 5: International (1 Room, 1 Adult)**

### **Changes:**

```javascript
// Search
destination: 'Dubai',
cityId: 12345,
countryCode: 'AE',
checkIn: '2025-12-25',
checkOut: '2025-12-28',
currency: 'USD',
guestNationality: 'US',

// Book - 1 international passenger
hotelPassenger: [
  {
    Title: 'Mr',
    FirstName: 'John',
    LastName: 'Smith',
    PaxType: 1,
    Nationality: 'US',
    Email: 'john@example.com',
    Phoneno: '+12025551234'
  }
]
```

---

## 🌍 **SCENARIOS 6, 7, 8: International Variations**

Follow the same pattern as Domestic scenarios 2, 3, 4, but:

- Change **destination** to Dubai
- Change **currency** to USD
- Change **nationality** to: US, GB, AU, CA (per scenario)
- Adjust **dates** to avoid overlaps
- Use international names and contact details

---

## 📊 **Testing Checklist**

For each scenario:

- [ ] **Search Step**
  - [ ] Returns hotels with traceId
  - [ ] Hotel has price and hotelCode
  - [ ] No errors in response

- [ ] **Room Details Step**
  - [ ] Returns hotelRoomDetails array
  - [ ] Each room has roomTypeCode and price
  - [ ] Response status is 200

- [ ] **Block Step**
  - [ ] Returns bookingId (database ID)
  - [ ] Response shows block_status
  - [ ] Check isPriceChanged flag
  - [ ] Booking ID returned for next call

- [ ] **Book Step**
  - [ ] Returns confirmationNo
  - [ ] Returns bookingRefNo
  - [ ] Response status is 200
  - [ ] Save confirmation number for TBO submission

---

## 🎬 **Expected Results Summary**

After testing all 8 scenarios, you should have:

| Scenario | Confirmation # | Status |
| -------- | -------------- | ------ |
| 1        | CONF-001       | ✅     |
| 2        | CONF-002       | ✅     |
| 3        | CONF-003       | ✅     |
| 4        | CONF-004       | ✅     |
| 5        | CONF-005       | ✅     |
| 6        | CONF-006       | ✅     |
| 7        | CONF-007       | ✅     |
| 8        | CONF-008       | ✅     |

---

## 📧 **After All Tests Pass**

1. Collect all confirmation numbers
2. Generate JSON logs from each test
3. Create email with all 8 confirmations
4. Send to TBO with subject: `Hotel Certification Cases - Faredown`
5. Include JSON request/response for each scenario

---

## 🚀 **Next Actions**

1. **Check balance first** (Step 0 above)
2. **Test Scenario 1** (API or Frontend)
3. **Verify confirmation number** appears
4. **Proceed with Scenarios 2-8**
5. **Collect all confirmation numbers**
6. **Send to TBO**

---

## 💡 **Tips**

- **If price changes:** It's normal. TBO prices can fluctuate. Flag it in the JSON.
- **If booking fails:** Check balance, check passenger details, verify room config matches.
- **For children:** Always include Age field when PaxType = 2
- **Date format:** Use YYYY-MM-DD in API, but TBO may return DD/MM/YYYY
- **Dates must:** Check-out > Check-in, at least 1 night

---

## ✅ **Start Testing**

Ready to test?

**First:**

1. Check balance (Step 0)
2. Run Scenario 1 test
3. Let me know if it passes or fails

Then I'll help you with remaining scenarios!
