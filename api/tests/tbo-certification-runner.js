#!/usr/bin/env node

/**
 * TBO Hotel API Certification Test Runner
 * Executes all 8 certification test cases with live credentials
 *
 * Usage: node api/tests/tbo-certification-runner.js
 *
 * Output:
 * - tbo-certification-results.json (JSON logs for TBO)
 * - tbo-certification-summary.txt (Summary report)
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const API_BASE_URL =
  process.env.VITE_API_BASE_URL || "https://builder-faredown-pricing.onrender.com/api";

/**
 * 8 TBO Certification Test Cases
 */
const CERTIFICATION_CASES = [
  {
    caseId: 1,
    name: "Domestic Booking - Room 1: Adult 1",
    description: "Single room, single adult in India",
    destination: "Mumbai",
    cityId: 10449,
    countryCode: "IN",
    checkInDate: "2025-12-20",
    checkOutDate: "2025-12-22",
    nationality: "IN",
    currency: "INR",
    roomConfigs: [{ adults: 1, children: 0, childAges: [] }],
    passengers: [
      {
        title: "Mr",
        firstName: "Rajesh",
        lastName: "Kumar",
        paxType: 1,
        nationality: "IN",
        email: "rajesh.kumar@example.com",
        phone: "+919876543210",
        passport: "A12345678",
      },
    ],
  },

  {
    caseId: 2,
    name: "Domestic Booking - Room 1: Adult 2, Child 2",
    description: "Single room with 2 adults and 2 children",
    destination: "Delhi",
    cityId: 10448,
    countryCode: "IN",
    checkInDate: "2025-12-21",
    checkOutDate: "2025-12-24",
    nationality: "IN",
    currency: "INR",
    roomConfigs: [{ adults: 2, children: 2, childAges: [8, 12] }],
    passengers: [
      {
        title: "Mr",
        firstName: "Amit",
        lastName: "Singh",
        paxType: 1,
        nationality: "IN",
        email: "amit.singh@example.com",
        phone: "+919876543211",
        passport: "B12345678",
      },
      {
        title: "Mrs",
        firstName: "Priya",
        lastName: "Singh",
        paxType: 1,
        nationality: "IN",
        email: "priya.singh@example.com",
        phone: "+919876543211",
        passport: "B87654321",
      },
      {
        title: "Master",
        firstName: "Arjun",
        lastName: "Singh",
        paxType: 2,
        age: 8,
        nationality: "IN",
        email: "priya.singh@example.com",
        phone: "+919876543211",
      },
      {
        title: "Miss",
        firstName: "Aisha",
        lastName: "Singh",
        paxType: 2,
        age: 12,
        nationality: "IN",
        email: "priya.singh@example.com",
        phone: "+919876543211",
      },
    ],
  },

  {
    caseId: 3,
    name: "Domestic Booking - Room 1: Adult 1, Room 2: Adult 1",
    description: "Two rooms, one adult each",
    destination: "Bangalore",
    cityId: 10446,
    countryCode: "IN",
    checkInDate: "2025-12-22",
    checkOutDate: "2025-12-25",
    nationality: "IN",
    currency: "INR",
    roomConfigs: [
      { adults: 1, children: 0, childAges: [] },
      { adults: 1, children: 0, childAges: [] },
    ],
    passengers: [
      {
        title: "Mr",
        firstName: "Vikram",
        lastName: "Patel",
        paxType: 1,
        nationality: "IN",
        email: "vikram.patel@example.com",
        phone: "+919876543212",
        passport: "C12345678",
      },
      {
        title: "Mr",
        firstName: "Rohan",
        lastName: "Sharma",
        paxType: 1,
        nationality: "IN",
        email: "rohan.sharma@example.com",
        phone: "+919876543213",
        passport: "D12345678",
      },
    ],
  },

  {
    caseId: 4,
    name: "Domestic Booking - Room 1: Adult 1+Child 2, Room 2: Adult 2",
    description: "Multiple rooms with mixed occupancy",
    destination: "Hyderabad",
    cityId: 10450,
    countryCode: "IN",
    checkInDate: "2025-12-23",
    checkOutDate: "2025-12-26",
    nationality: "IN",
    currency: "INR",
    roomConfigs: [
      { adults: 1, children: 2, childAges: [6, 10] },
      { adults: 2, children: 0, childAges: [] },
    ],
    passengers: [
      {
        title: "Mr",
        firstName: "Suresh",
        lastName: "Verma",
        paxType: 1,
        nationality: "IN",
        email: "suresh.verma@example.com",
        phone: "+919876543214",
        passport: "E12345678",
      },
      {
        title: "Master",
        firstName: "Aman",
        lastName: "Verma",
        paxType: 2,
        age: 6,
        nationality: "IN",
        email: "suresh.verma@example.com",
        phone: "+919876543214",
      },
      {
        title: "Miss",
        firstName: "Ananya",
        lastName: "Verma",
        paxType: 2,
        age: 10,
        nationality: "IN",
        email: "suresh.verma@example.com",
        phone: "+919876543214",
      },
      {
        title: "Mr",
        firstName: "Anil",
        lastName: "Gupta",
        paxType: 1,
        nationality: "IN",
        email: "anil.gupta@example.com",
        phone: "+919876543215",
        passport: "F12345678",
      },
      {
        title: "Mrs",
        firstName: "Sunita",
        lastName: "Gupta",
        paxType: 1,
        nationality: "IN",
        email: "sunita.gupta@example.com",
        phone: "+919876543215",
        passport: "F87654321",
      },
    ],
  },

  {
    caseId: 5,
    name: "International Booking - Room 1: Adult 1",
    description: "International guest in Dubai",
    destination: "Dubai",
    cityId: 12345,
    countryCode: "AE",
    checkInDate: "2025-12-25",
    checkOutDate: "2025-12-28",
    nationality: "US",
    currency: "USD",
    roomConfigs: [{ adults: 1, children: 0, childAges: [] }],
    passengers: [
      {
        title: "Mr",
        firstName: "John",
        lastName: "Smith",
        paxType: 1,
        nationality: "US",
        email: "john.smith@example.com",
        phone: "+12025551234",
        passport: "US1234567",
      },
    ],
  },

  {
    caseId: 6,
    name: "International Booking - Room 1: Adult 2, Child 2",
    description: "International family in Dubai",
    destination: "Dubai",
    cityId: 12345,
    countryCode: "AE",
    checkInDate: "2025-12-26",
    checkOutDate: "2025-12-29",
    nationality: "GB",
    currency: "USD",
    roomConfigs: [{ adults: 2, children: 2, childAges: [7, 11] }],
    passengers: [
      {
        title: "Mr",
        firstName: "David",
        lastName: "Brown",
        paxType: 1,
        nationality: "GB",
        email: "david.brown@example.com",
        phone: "+441632960123",
        passport: "GB9876543",
      },
      {
        title: "Mrs",
        firstName: "Sarah",
        lastName: "Brown",
        paxType: 1,
        nationality: "GB",
        email: "sarah.brown@example.com",
        phone: "+441632960123",
        passport: "GB5432109",
      },
      {
        title: "Master",
        firstName: "Tom",
        lastName: "Brown",
        paxType: 2,
        age: 7,
        nationality: "GB",
        email: "david.brown@example.com",
        phone: "+441632960123",
      },
      {
        title: "Miss",
        firstName: "Emma",
        lastName: "Brown",
        paxType: 2,
        age: 11,
        nationality: "GB",
        email: "david.brown@example.com",
        phone: "+441632960123",
      },
    ],
  },

  {
    caseId: 7,
    name: "International Booking - Room 1: Adult 1, Room 2: Adult 1",
    description: "Two international guests in different rooms",
    destination: "Dubai",
    cityId: 12345,
    countryCode: "AE",
    checkInDate: "2025-12-27",
    checkOutDate: "2025-12-30",
    nationality: "AU",
    currency: "USD",
    roomConfigs: [
      { adults: 1, children: 0, childAges: [] },
      { adults: 1, children: 0, childAges: [] },
    ],
    passengers: [
      {
        title: "Mr",
        firstName: "James",
        lastName: "Wilson",
        paxType: 1,
        nationality: "AU",
        email: "james.wilson@example.com",
        phone: "+61299997777",
        passport: "AU1234567",
      },
      {
        title: "Mr",
        firstName: "Michael",
        lastName: "Johnson",
        paxType: 1,
        nationality: "AU",
        email: "michael.johnson@example.com",
        phone: "+61299997778",
        passport: "AU7654321",
      },
    ],
  },

  {
    caseId: 8,
    name: "International Booking - Room 1: Adult 1+Child 2, Room 2: Adult 2",
    description: "International family with multiple rooms",
    destination: "Dubai",
    cityId: 12345,
    countryCode: "AE",
    checkInDate: "2025-12-28",
    checkOutDate: "2025-12-31",
    nationality: "CA",
    currency: "USD",
    roomConfigs: [
      { adults: 1, children: 2, childAges: [5, 9] },
      { adults: 2, children: 0, childAges: [] },
    ],
    passengers: [
      {
        title: "Mr",
        firstName: "Robert",
        lastName: "Miller",
        paxType: 1,
        nationality: "CA",
        email: "robert.miller@example.com",
        phone: "+14165550100",
        passport: "CA1234567",
      },
      {
        title: "Master",
        firstName: "Lucas",
        lastName: "Miller",
        paxType: 2,
        age: 5,
        nationality: "CA",
        email: "robert.miller@example.com",
        phone: "+14165550100",
      },
      {
        title: "Miss",
        firstName: "Olivia",
        lastName: "Miller",
        paxType: 2,
        age: 9,
        nationality: "CA",
        email: "robert.miller@example.com",
        phone: "+14165550100",
      },
      {
        title: "Mrs",
        firstName: "Jennifer",
        lastName: "Miller",
        paxType: 1,
        nationality: "CA",
        email: "jennifer.miller@example.com",
        phone: "+14165550100",
        passport: "CA7654321",
      },
      {
        title: "Mr",
        firstName: "Christopher",
        lastName: "Davis",
        paxType: 1,
        nationality: "CA",
        email: "chris.davis@example.com",
        phone: "+14165550101",
        passport: "CA9876543",
      },
    ],
  },
];

/**
 * Execute a single certification test case
 */
async function executeTestCase(testCase) {
  const result = {
    caseId: testCase.caseId,
    name: testCase.name,
    description: testCase.description,
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
    confirmationNumber: null,
    error: null,
  };

  try {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`CASE ${testCase.caseId}: ${testCase.name}`);
    console.log(`${"=".repeat(80)}`);

    // Step 1: Search Hotels
    console.log(`\n[Step 1] Searching hotels...`);
    const searchResponse = await axios.post(`${API_BASE_URL}/tbo/search`, {
      destination: testCase.destination,
      countryCode: testCase.countryCode,
      checkIn: testCase.checkInDate,
      checkOut: testCase.checkOutDate,
      rooms: testCase.roomConfigs,
      currency: testCase.currency,
      guestNationality: testCase.nationality,
    });

    result.steps.push({
      step: "search",
      request: {
        destination: testCase.destination,
        countryCode: testCase.countryCode,
        checkIn: testCase.checkInDate,
        checkOut: testCase.checkOutDate,
        rooms: testCase.roomConfigs,
        currency: testCase.currency,
        guestNationality: testCase.nationality,
      },
      response: searchResponse.data,
      status: searchResponse.status,
    });

    if (!searchResponse.data.success || !searchResponse.data.hotels?.length) {
      throw new Error("Search returned no hotels");
    }

    const traceId = searchResponse.data.traceId;
    let selectedHotel = searchResponse.data.hotels[0];

    // Normalize hotel properties (handle both camelCase and PascalCase)
    if (selectedHotel) {
      selectedHotel = {
        resultIndex: selectedHotel.resultIndex !== undefined ? selectedHotel.resultIndex : selectedHotel.ResultIndex || 0,
        hotelCode: selectedHotel.hotelCode || selectedHotel.HotelCode,
        hotelName: selectedHotel.hotelName || selectedHotel.HotelName || "Unknown Hotel",
        ...selectedHotel
      };
    }

    console.log(`✓ Found ${searchResponse.data.hotels.length} hotels`);
    console.log(`✓ Selected hotel: ${selectedHotel?.hotelName || "Unknown"}`);
    console.log(`  Code: ${selectedHotel?.hotelCode}`);
    console.log(`  Index: ${selectedHotel?.resultIndex}`);

    // Step 2: Get Hotel Room Details
    console.log(`\n[Step 2] Getting room details...`);
    const roomResponse = await axios.post(`${API_BASE_URL}/tbo/room`, {
      traceId,
      resultIndex: selectedHotel.resultIndex,
      hotelCode: selectedHotel.hotelCode,
      hotelName: selectedHotel.hotelName,
      checkInDate: testCase.checkInDate,
      checkOutDate: testCase.checkOutDate,
      noOfRooms: testCase.roomConfigs.length,
    }, {
      timeout: 60000  // 60 second timeout for room details
    });

    result.steps.push({
      step: "room",
      request: {
        traceId,
        resultIndex: selectedHotel.resultIndex,
        hotelCode: selectedHotel.hotelCode,
        hotelName: selectedHotel.hotelName,
        checkInDate: testCase.checkInDate,
        checkOutDate: testCase.checkOutDate,
        noOfRooms: testCase.roomConfigs.length,
      },
      response: roomResponse.data,
      status: roomResponse.status,
    });

    if (!roomResponse.data.success) {
      throw new Error("Failed to get room details");
    }

    console.log(`✓ Got room details`);

    // Step 3: Block Room
    console.log(`\n[Step 3] Blocking room...`);
    const blockResponse = await axios.post(`${API_BASE_URL}/tbo/block`, {
      traceId,
      resultIndex: selectedHotel.resultIndex,
      hotelCode: selectedHotel.hotelCode,
      hotelName: selectedHotel.hotelName,
      guestNationality: testCase.nationality,
      noOfRooms: testCase.roomConfigs.length,
      isVoucherBooking: true,
      hotelRoomDetails: roomResponse.data.hotelRoomDetails,
    });

    result.steps.push({
      step: "block",
      request: {
        traceId,
        resultIndex: selectedHotel.resultIndex,
        hotelCode: selectedHotel.hotelCode,
        hotelName: selectedHotel.hotelName,
        guestNationality: testCase.nationality,
        noOfRooms: testCase.roomConfigs.length,
        isVoucherBooking: true,
      },
      response: blockResponse.data,
      status: blockResponse.status,
    });

    if (!blockResponse.data.success) {
      throw new Error("Block failed");
    }

    const blockingId = blockResponse.data.bookingId;
    console.log(`✓ Room blocked successfully`);
    if (blockResponse.data.isPriceChanged) {
      console.log(`⚠ Price changed during blocking`);
    }

    // Step 4: Book Hotel
    console.log(`\n[Step 4] Booking hotel...`);
    const bookResponse = await axios.post(`${API_BASE_URL}/tbo/book`, {
      traceId,
      resultIndex: selectedHotel.resultIndex,
      hotelCode: selectedHotel.hotelCode,
      hotelName: selectedHotel.hotelName,
      bookingId: blockingId,
      guestNationality: testCase.nationality,
      noOfRooms: testCase.roomConfigs.length,
      isVoucherBooking: true,
      hotelRoomDetails: blockResponse.data.hotelRoomDetails,
      hotelPassenger: testCase.passengers.map((p) => ({
        Title: p.title,
        FirstName: p.firstName,
        LastName: p.lastName,
        PaxType: p.paxType,
        Age: p.age || null,
        PassportNo: p.passport || null,
        Email: p.email,
        Phoneno: p.phone,
        Nationality: p.nationality,
      })),
    });

    result.steps.push({
      step: "book",
      request: {
        traceId,
        resultIndex: selectedHotel.resultIndex,
        hotelCode: selectedHotel.hotelCode,
        bookingId: blockingId,
        noOfRooms: testCase.roomConfigs.length,
        passengerCount: testCase.passengers.length,
      },
      response: bookResponse.data,
      status: bookResponse.status,
    });

    if (!bookResponse.data.success) {
      throw new Error("Booking failed");
    }

    const confirmationNo = bookResponse.data.confirmationNo;
    result.confirmationNumber = confirmationNo;

    console.log(`✓ Hotel booked successfully`);
    console.log(`✓ Confirmation Number: ${confirmationNo}`);

    // Step 5: Get Booking Details (Optional - for verification)
    if (blockingId) {
      console.log(`\n[Step 5] Fetching booking details...`);
      try {
        const detailsResponse = await axios.get(
          `${API_BASE_URL}/tbo/bookings/${blockingId}`,
        );

        result.steps.push({
          step: "details",
          response: detailsResponse.data,
          status: detailsResponse.status,
        });

        console.log(`✓ Booking details retrieved`);
      } catch (e) {
        console.log(`⚠ Could not retrieve booking details (optional)`);
      }
    }

    result.success = true;
  } catch (error) {
    result.error = error.message;
    console.error(`✗ Case ${testCase.caseId} failed: ${error.message}`);
  }

  return result;
}

/**
 * Run all certification cases
 */
async function runAllCases() {
  const allResults = {
    agency: process.env.TBO_AGENCY_ID || "UNKNOWN_AGENCY",
    executionTime: new Date().toISOString(),
    totalCases: CERTIFICATION_CASES.length,
    results: [],
    summary: {
      passed: 0,
      failed: 0,
      errors: [],
    },
  };

  console.log(`\n${"#".repeat(80)}`);
  console.log(`# TBO HOTEL API - CERTIFICATION TEST RUNNER`);
  console.log(`# Agency: ${allResults.agency}`);
  console.log(`# Execution Time: ${allResults.executionTime}`);
  console.log(`# Total Cases: ${allResults.totalCases}`);
  console.log(`${"#".repeat(80)}`);

  for (const testCase of CERTIFICATION_CASES) {
    const result = await executeTestCase(testCase);
    allResults.results.push(result);

    if (result.success) {
      allResults.summary.passed++;
    } else {
      allResults.summary.failed++;
      allResults.summary.errors.push({
        caseId: result.caseId,
        error: result.error,
      });
    }
  }

  // Write JSON results
  const outputPath = path.join(process.cwd(), "tbo-certification-results.json");
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\n✓ JSON results saved to: ${outputPath}`);

  // Write text summary
  const summaryPath = path.join(process.cwd(), "tbo-certification-summary.txt");
  const summaryContent = generateSummary(allResults);
  fs.writeFileSync(summaryPath, summaryContent);
  console.log(`✓ Summary saved to: ${summaryPath}`);

  // Print summary
  console.log(`\n${"=".repeat(80)}`);
  console.log(`CERTIFICATION SUMMARY`);
  console.log(`${"=".repeat(80)}`);
  console.log(summaryContent);

  return allResults;
}

/**
 * Generate text summary
 */
function generateSummary(results) {
  let summary = `TBO HOTEL API CERTIFICATION TEST SUMMARY
================================================================================
Agency: ${results.agency}
Execution Time: ${results.executionTime}
Total Test Cases: ${results.totalCases}
Passed: ${results.summary.passed}
Failed: ${results.summary.failed}

TEST CASE RESULTS:
================================================================================

`;

  for (const result of results.results) {
    const status = result.success ? "✓ PASS" : "✗ FAIL";
    summary += `Case ${result.caseId}: ${result.name}\n`;
    summary += `Status: ${status}\n`;

    if (result.success) {
      summary += `Confirmation Number: ${result.confirmationNumber}\n`;
    } else {
      summary += `Error: ${result.error}\n`;
    }

    summary += "\n";
  }

  if (results.summary.failed > 0) {
    summary += `ERRORS:
================================================================================

`;
    for (const error of results.summary.errors) {
      summary += `Case ${error.caseId}: ${error.error}\n`;
    }
  }

  summary += `
================================================================================
JSON LOGS: tbo-certification-results.json
For detailed request/response data, please refer to the JSON file.
================================================================================
`;

  return summary;
}

// Run the tests
runAllCases().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
