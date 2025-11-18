/**
 * TBO Hotel API - 8 Certification Test Cases Runner
 *
 * Executes all 8 TBO certification scenarios with comprehensive logging
 * Generates JSON audit log for TBO submission
 *
 * Run with: node api/tests/tbo-cert-runner.js
 *
 * Output: tbo-certification-results.json (with all requests/responses)
 */

const { runTboHotelFlow } = require("./tbo-hotel-flow-runner");
const fs = require("fs");
const path = require("path");

/**
 * 8 TBO Certification Test Cases
 *
 * Each case tests different aspects of the TBO API:
 * 1. Single room, single guest (basic flow)
 * 2. Multiple adults in one room
 * 3. Multiple rooms, multiple guests
 * 4. Adult + child (family booking)
 * 5. De-dupe hotel with CategoryId
 * 6. Multi-night booking
 * 7. Cancellation flow
 * 8. Price change handling (if applicable)
 */
const CERTIFICATION_CASES = [
  {
    caseId: 1,
    name: "Single Room, Single Guest, Dubai (Basic Flow)",
    description: "Tests basic flow: search → room → block → book → voucher",
    destination: "Dubai",
    cityId: 12345, // Dubai city ID (replace with actual)
    countryCode: "AE",
    checkInDate: "15/12/2025",
    checkOutDate: "18/12/2025",
    nationality: "IN",
    currency: "USD",
    roomConfigs: [
      {
        adults: 1,
        children: 0,
        childAges: [],
      },
    ],
  },

  {
    caseId: 2,
    name: "Single Room, 2 Adults, Mumbai",
    description:
      "Tests multiple adults in one room with proper LeadPassenger flag",
    destination: "Mumbai",
    cityId: 10449,
    countryCode: "IN",
    checkInDate: "16/12/2025",
    checkOutDate: "18/12/2025",
    nationality: "IN",
    currency: "INR",
    roomConfigs: [
      {
        adults: 2,
        children: 0,
        childAges: [],
      },
    ],
  },

  {
    caseId: 3,
    name: "2 Rooms, Multiple Guests, Delhi",
    description: "Tests multiple room booking with different occupancy",
    destination: "Delhi",
    cityId: 10448,
    countryCode: "IN",
    checkInDate: "17/12/2025",
    checkOutDate: "21/12/2025",
    nationality: "IN",
    currency: "INR",
    roomConfigs: [
      {
        adults: 2,
        children: 0,
        childAges: [],
      },
      {
        adults: 1,
        children: 0,
        childAges: [],
      },
    ],
  },

  {
    caseId: 4,
    name: "Adult + Child Booking, Dubai",
    description:
      "Tests family booking with adult and child, validates child-specific rules",
    destination: "Dubai",
    cityId: 12345,
    countryCode: "AE",
    checkInDate: "20/12/2025",
    checkOutDate: "22/12/2025",
    nationality: "IN",
    currency: "USD",
    roomConfigs: [
      {
        adults: 1,
        children: 1,
        childAges: [5], // 5-year-old child
      },
    ],
  },

  {
    caseId: 5,
    name: "De-Dupe Hotel with CategoryId, Singapore",
    description:
      "Tests de-dupe hotel handling, validates CategoryId requirement",
    destination: "Singapore",
    cityId: 11111, // Singapore city ID (replace with actual)
    countryCode: "SG",
    checkInDate: "23/12/2025",
    checkOutDate: "25/12/2025",
    nationality: "IN",
    currency: "SGD",
    roomConfigs: [
      {
        adults: 1,
        children: 0,
        childAges: [],
      },
    ],
  },

  {
    caseId: 6,
    name: "Extended Stay (5 Nights), Bangkok",
    description:
      "Tests longer booking duration, validates cancellation policy for extended stay",
    destination: "Bangkok",
    cityId: 9999, // Bangkok city ID (replace with actual)
    countryCode: "TH",
    checkInDate: "24/12/2025",
    checkOutDate: "29/12/2025",
    nationality: "IN",
    currency: "THB",
    roomConfigs: [
      {
        adults: 2,
        children: 0,
        childAges: [],
      },
    ],
  },

  {
    caseId: 7,
    name: "Cancellation Flow Test",
    description:
      "Tests complete flow → successful booking → cancellation → refund",
    destination: "Dubai",
    cityId: 12345,
    countryCode: "AE",
    checkInDate: "26/12/2025",
    checkOutDate: "27/12/2025",
    nationality: "IN",
    currency: "USD",
    roomConfigs: [
      {
        adults: 1,
        children: 0,
        childAges: [],
      },
    ],
    testCancellation: true, // Flag to test cancellation
  },

  {
    caseId: 8,
    name: "Multiple Adults + Multiple Children, Maldives",
    description:
      "Tests complex occupancy: multiple adults and children, validates all validations",
    destination: "Maldives",
    cityId: 8888, // Maldives city ID (replace with actual)
    countryCode: "MV",
    checkInDate: "28/12/2025",
    checkOutDate: "30/12/2025",
    nationality: "IN",
    currency: "USD",
    roomConfigs: [
      {
        adults: 2,
        children: 2,
        childAges: [4, 8],
      },
    ],
  },
];

/**
 * Main test runner
 * Executes all certification cases and generates audit log
 */
async function runCertificationTests() {
  console.log("\n" + "=".repeat(80));
  console.log("TBO HOTEL API - 8 CERTIFICATION TEST CASES");
  console.log("=".repeat(80));
  console.log(`Start Time: ${new Date().toISOString()}\n`);

  const results = {
    executionId: `cert-run-${Date.now()}`,
    startTime: new Date().toISOString(),
    testCases: [],
    summary: {
      totalCases: CERTIFICATION_CASES.length,
      passedCases: 0,
      failedCases: 0,
      partialCases: 0,
    },
    errors: [],
  };

  // Run each test case
  for (const caseConfig of CERTIFICATION_CASES) {
    try {
      console.log(`\n${"─".repeat(80)}`);
      console.log(`Running Case ${caseConfig.caseId}: ${caseConfig.name}`);
      console.log(`${"─".repeat(80)}`);
      console.log(`Description: ${caseConfig.description}`);

      // Run the flow
      const caseResult = await runTboHotelFlow(caseConfig);

      results.testCases.push(caseResult);

      // Track summary
      if (caseResult.success) {
        results.summary.passedCases++;
        console.log(`✅ CASE ${caseConfig.caseId} PASSED`);
      } else {
        results.summary.failedCases++;
        console.log(`❌ CASE ${caseConfig.caseId} FAILED: ${caseResult.error}`);
        results.errors.push({
          caseId: caseConfig.caseId,
          caseName: caseConfig.name,
          error: caseResult.error,
        });
      }

      // Test cancellation if configured
      if (caseConfig.testCancellation && caseResult.success) {
        console.log(`\n📋 CASE ${caseConfig.caseId}: Testing Cancellation...`);
        const cancellationResult = await testCancellationFlow(
          caseResult.bookingDetails,
        );
        caseResult.cancellation = cancellationResult;

        if (cancellationResult.success) {
          console.log(`✅ Cancellation successful`);
        } else {
          console.log(
            `⚠️  Cancellation test failed: ${cancellationResult.error}`,
          );
          results.summary.partialCases++;
        }
      }
    } catch (error) {
      results.summary.failedCases++;
      const caseError = {
        caseId: caseConfig.caseId,
        caseName: caseConfig.name,
        error: error.message,
        stack: error.stack,
      };
      results.errors.push(caseError);
      console.error(`❌ CASE ${caseConfig.caseId} ERROR:`, error.message);
    }
  }

  // Finalize results
  results.endTime = new Date().toISOString();
  results.durationSeconds =
    (new Date(results.endTime) - new Date(results.startTime)) / 1000;

  // Print summary
  printSummary(results);

  // Save audit log
  saveAuditLog(results);

  return results;
}

/**
 * Test cancellation flow for a booking
 * @param {object} bookingDetails - Booking details from successful booking
 * @returns {promise} Cancellation test result
 */
async function testCancellationFlow(bookingDetails) {
  try {
    if (!bookingDetails || !bookingDetails.bookingId) {
      return {
        success: false,
        error: "No booking ID for cancellation test",
      };
    }

    const { sendChangeRequest } = require("../tbo/cancel");

    console.log(
      `  Testing cancellation for booking ${bookingDetails.bookingId}...`,
    );

    const changeRes = await sendChangeRequest({
      bookingId: bookingDetails.bookingId,
      confirmationNo: bookingDetails.confirmationNo,
      requestType: 4, // Cancellation
      remarks: "Test cancellation from certification runner",
    });

    return {
      success: changeRes.responseStatus === 1,
      changeRequestId: changeRes.changeRequestId,
      requestStatus: changeRes.requestStatus,
      cancellationCharge: changeRes.cancellationCharge,
      refundAmount: changeRes.refundAmount,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Print formatted summary of test results
 * @param {object} results - Test results object
 */
function printSummary(results) {
  console.log("\n\n" + "=".repeat(80));
  console.log("CERTIFICATION TEST SUMMARY");
  console.log("=".repeat(80));

  console.log(`\nExecution ID: ${results.executionId}`);
  console.log(`Start Time: ${results.startTime}`);
  console.log(`End Time: ${results.endTime}`);
  console.log(`Duration: ${results.durationSeconds.toFixed(2)} seconds\n`);

  // Case-by-case results
  console.log("CASE RESULTS:");
  console.log("─".repeat(80));

  results.testCases.forEach((testCase) => {
    const status = testCase.success ? "✅ PASSED" : "❌ FAILED";
    console.log(`Case #${testCase.caseId}: ${status}`);
    if (testCase.destination) {
      console.log(`  Destination: ${testCase.destination}`);
    }
    if (!testCase.success && testCase.error) {
      console.log(`  Error: ${testCase.error}`);
    }
    if (testCase.bookingDetails) {
      console.log(`  BookingId: ${testCase.bookingDetails.bookingId}`);
      console.log(`  BookingRefNo: ${testCase.bookingDetails.bookingRefNo}`);
      console.log(
        `  Balance: ${testCase.bookingDetails.balance} ${testCase.bookingDetails.currency}`,
      );
    }
  });

  // Summary stats
  console.log("\n" + "─".repeat(80));
  console.log("SUMMARY STATISTICS:");
  console.log(`  Total Cases: ${results.summary.totalCases}`);
  console.log(`  ✅ Passed: ${results.summary.passedCases}`);
  console.log(`  ❌ Failed: ${results.summary.failedCases}`);
  console.log(`  ⚠️  Partial: ${results.summary.partialCases}`);

  const passRate = (
    (results.summary.passedCases / results.summary.totalCases) *
    100
  ).toFixed(1);
  console.log(`  Pass Rate: ${passRate}%\n`);

  // Errors
  if (results.errors.length > 0) {
    console.log("ERRORS ENCOUNTERED:");
    console.log("─".repeat(80));
    results.errors.forEach((err) => {
      console.log(`Case #${err.caseId}: ${err.caseName}`);
      console.log(`  ${err.error}\n`);
    });
  }

  console.log("=".repeat(80));
  console.log("Audit log saved to: tbo-certification-results.json");
  console.log("=".repeat(80) + "\n");
}

/**
 * Save comprehensive audit log to JSON file
 * @param {object} results - Test results object
 */
function saveAuditLog(results) {
  const outputPath = path.join(process.cwd(), "tbo-certification-results.json");

  try {
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf8");
    console.log(`\n✅ Audit log saved: ${outputPath}`);

    // Also generate a summary report
    const summaryPath = path.join(
      process.cwd(),
      "tbo-certification-summary.txt",
    );
    const summaryText = generateSummaryReport(results);
    fs.writeFileSync(summaryPath, summaryText, "utf8");
    console.log(`✅ Summary report saved: ${summaryPath}`);
  } catch (error) {
    console.error(`❌ Error saving audit log: ${error.message}`);
  }
}

/**
 * Generate human-readable summary report
 * @param {object} results - Test results object
 * @returns {string} Summary report text
 */
function generateSummaryReport(results) {
  let report = `
TBO HOTEL API - CERTIFICATION TEST REPORT
Generated: ${new Date().toISOString()}
Execution ID: ${results.executionId}

EXECUTIVE SUMMARY
─────────────────────────────────────────────────────────────────────────────
Total Test Cases: ${results.summary.totalCases}
Passed Cases: ${results.summary.passedCases} ✅
Failed Cases: ${results.summary.failedCases} ❌
Partial Cases: ${results.summary.partialCases} ⚠️
Pass Rate: ${((results.summary.passedCases / results.summary.totalCases) * 100).toFixed(1)}%

Duration: ${results.durationSeconds.toFixed(2)} seconds

DETAILED RESULTS
─────────────────────────────────────────────────────────────────────────────
`;

  results.testCases.forEach((testCase) => {
    report += `

Case #${testCase.caseId}: ${testCase.destination || "Unknown"}
Status: ${testCase.success ? "✅ PASSED" : "❌ FAILED"}
Check-in: ${testCase.checkInDate}
Check-out: ${testCase.checkOutDate}
Rooms: ${testCase.roomConfigs?.length || 0}
`;

    if (testCase.success && testCase.bookingDetails) {
      report += `
Booking Details:
  BookingId: ${testCase.bookingDetails.bookingId}
  BookingRefNo: ${testCase.bookingDetails.bookingRefNo}
  ConfirmationNo: ${testCase.bookingDetails.confirmationNo}
  Balance: ${testCase.bookingDetails.balance} ${testCase.bookingDetails.currency}
`;
    }

    if (!testCase.success) {
      report += `
Error: ${testCase.error}
`;
    }

    if (testCase.cancellation) {
      report += `
Cancellation Test: ${testCase.cancellation.success ? "✅ PASSED" : "❌ FAILED"}
`;
      if (testCase.cancellation.success) {
        report += `
  ChangeRequestId: ${testCase.cancellation.changeRequestId}
  RequestStatus: ${testCase.cancellation.requestStatus}
  CancellationCharge: ${testCase.cancellation.cancellationCharge}
  RefundAmount: ${testCase.cancellation.refundAmount}
`;
      }
    }
  });

  if (results.errors.length > 0) {
    report += `

ERRORS
─────────────────────────────────────────────────────────────────────────────
`;
    results.errors.forEach((err) => {
      report += `
Case #${err.caseId}: ${err.caseName}
Error: ${err.error}
`;
    });
  }

  report += `

NEXT STEPS
─────────────────────────────────────────────────────────────────────────────
1. Review detailed audit log in tbo-certification-results.json
2. Address any failed cases by reviewing error messages
3. Validate all request/response pairs match TBO API v10.0 specification
4. Submit results.json to TBO for certification review
5. Contact TBO support if any cases fail consistently

For detailed debugging, check:
- api/tbo/API_SPECIFICATION.md - Complete API spec
- api/tbo/FAQ_AND_GUIDELINES.md - Common issues and solutions
- Render logs for full request/response traces

═════════���═══════════════════════════════════════════════════════════════════
`;

  return report;
}

// =====================================================================
// ENTRY POINT
// =====================================================================

if (require.main === module) {
  runCertificationTests()
    .then((results) => {
      const passRate =
        (results.summary.passedCases / results.summary.totalCases) * 100;
      process.exit(passRate === 100 ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error in certification tests:", error);
      process.exit(1);
    });
}

module.exports = { runCertificationTests, CERTIFICATION_CASES };
