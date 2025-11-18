#!/usr/bin/env node

/**
 * TBO Hotel Certification Test Cases
 *
 * Executes 8 mandatory test scenarios for TBO certification.
 *
 * Usage:
 *   TBO_TEST_CASE=1 node api/tests/tbo-hotel-cert-cases.js
 *   TBO_TEST_CASE=2 node api/tests/tbo-hotel-cert-cases.js
 *   ... up to case 8
 *
 * Outputs all request/response JSONs to: /opt/render/project/src/tbo-cert-logs/case-{ID}/
 */

const fs = require("fs");
const path = require("path");
const { runTboHotelFlow } = require("./tbo-hotel-flow-runner");

// Test case ID from environment
const TEST_CASE = parseInt(process.env.TBO_TEST_CASE || "1", 10);

if (TEST_CASE < 1 || TEST_CASE > 8) {
  console.error("❌ Invalid TBO_TEST_CASE. Must be 1-8");
  process.exit(1);
}

// Certification test matrix
const TEST_CASES = {
  1: {
    name: "Domestic - 1 Adult",
    destination: "Delhi",
    cityId: 10448,
    countryCode: "IN",
    roomConfigs: [{ adults: 1, children: 0, childAges: [] }],
  },
  2: {
    name: "Domestic - 2 Adults, 2 Children",
    destination: "Delhi",
    cityId: 10448,
    countryCode: "IN",
    roomConfigs: [{ adults: 2, children: 2, childAges: [5, 7] }],
  },
  3: {
    name: "Domestic - 1 Adult, 1 Adult (2 Rooms)",
    destination: "Delhi",
    cityId: 10448,
    countryCode: "IN",
    roomConfigs: [
      { adults: 1, children: 0, childAges: [] },
      { adults: 1, children: 0, childAges: [] },
    ],
  },
  4: {
    name: "Domestic - 1 Adult + 2 Children, 2 Adults (2 Rooms)",
    destination: "Delhi",
    cityId: 10448,
    countryCode: "IN",
    roomConfigs: [
      { adults: 1, children: 2, childAges: [5, 8] },
      { adults: 2, children: 0, childAges: [] },
    ],
  },
  5: {
    name: "International - 1 Adult",
    destination: "Paris",
    cityId: 16408,
    countryCode: "FR",
    roomConfigs: [{ adults: 1, children: 0, childAges: [] }],
  },
  6: {
    name: "International - 2 Adults, 2 Children",
    destination: "Paris",
    cityId: 16408,
    countryCode: "FR",
    roomConfigs: [{ adults: 2, children: 2, childAges: [6, 9] }],
  },
  7: {
    name: "International - 1 Adult, 1 Adult (2 Rooms)",
    destination: "Paris",
    cityId: 16408,
    countryCode: "FR",
    roomConfigs: [
      { adults: 1, children: 0, childAges: [] },
      { adults: 1, children: 0, childAges: [] },
    ],
  },
  8: {
    name: "International - 1 Adult + 2 Children, 2 Adults (2 Rooms)",
    destination: "Paris",
    cityId: 16408,
    countryCode: "FR",
    roomConfigs: [
      { adults: 1, children: 2, childAges: [4, 7] },
      { adults: 2, children: 0, childAges: [] },
    ],
  },
};

/**
 * Save result to disk with numbered files
 *
 * File numbering:
 * 1. search-request
 * 2. search-response
 * 3. gethotelroom-request
 * 4. gethotelroom-response
 * 5. blockroom-request
 * 6. blockroom-response
 * 7. bookroom-request
 * 8. bookroom-response
 * 9. voucher-request
 * 10. voucher-response
 * 11. credit-request
 * 12. credit-response
 */
function saveResultsToFile(caseId, results) {
  const logsDir =
    process.env.TBO_CERT_LOGS_DIR || path.join(process.cwd(), "tbo-cert-logs");
  const caseDir = path.join(logsDir, `case-${caseId}`);

  // Create directories
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  if (!fs.existsSync(caseDir)) {
    fs.mkdirSync(caseDir, { recursive: true });
  }

  // Map step names to file numbers
  const fileMapping = {
    search: { req: "1-search-request.json", res: "2-search-response.json" },
    room: {
      req: "3-gethotelroom-request.json",
      res: "4-gethotelroom-response.json",
    },
    block: {
      req: "5-blockroom-request.json",
      res: "6-blockroom-response.json",
    },
    book: {
      req: "7-bookroom-request.json",
      res: "8-bookroom-response.json",
    },
    voucher: {
      req: "9-voucher-request.json",
      res: "10-voucher-response.json",
    },
    credit: {
      req: "11-credit-request.json",
      res: "12-credit-response.json",
    },
  };

  // Save each step's request and response
  for (const [stepName, files] of Object.entries(fileMapping)) {
    const step = results.steps[stepName];
    if (step) {
      // Request
      const reqPath = path.join(caseDir, files.req);
      fs.writeFileSync(reqPath, JSON.stringify(step.request, null, 2), "utf8");
      console.log(`✅ Saved: ${files.req}`);

      // Response
      const resPath = path.join(caseDir, files.res);
      fs.writeFileSync(resPath, JSON.stringify(step.response, null, 2), "utf8");
      console.log(`✅ Saved: ${files.res}`);
    }
  }

  // Save summary file
  const summaryPath = path.join(caseDir, "00-summary.json");
  const summary = {
    caseId: results.caseId,
    testName: TEST_CASES[caseId].name,
    success: results.success,
    timestamp: new Date().toISOString(),
    bookingDetails: results.bookingDetails,
    errors: results.errors,
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`✅ Saved: 00-summary.json`);

  // Save full results
  const fullPath = path.join(caseDir, "99-full-results.json");
  fs.writeFileSync(fullPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`✅ Saved: 99-full-results.json`);

  console.log(`\n📁 All files saved to: ${caseDir}`);
  return caseDir;
}

/**
 * Main execution
 */
async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("TBO HOTEL CERTIFICATION TEST");
  console.log("=".repeat(80));
  console.log(`\nCase: ${TEST_CASE}`);
  console.log(`Test: ${TEST_CASES[TEST_CASE].name}`);

  const config = {
    ...TEST_CASES[TEST_CASE],
    caseId: TEST_CASE,
    checkInDate: "15/12/2025",
    checkOutDate: "16/12/2025",
    nationality: "IN", // Always India nationality per TBO requirement
    currency: TEST_CASES[TEST_CASE].countryCode === "IN" ? "INR" : "EUR",
  };

  try {
    const results = await runTboHotelFlow(config);

    if (results.success) {
      console.log(`\n✅ Case #${TEST_CASE} completed successfully`);
      console.log(`   Confirmation: ${results.bookingDetails.confirmationNo}`);
    } else {
      console.error(`\n❌ Case #${TEST_CASE} failed: ${results.error}`);
    }

    // Save to disk
    console.log("\n📝 Saving results to disk...");
    const caseDir = saveResultsToFile(TEST_CASE, results);

    console.log("\n" + "=".repeat(80));
    console.log("✅ TEST CASE EXECUTION COMPLETE");
    console.log("=".repeat(80));
    console.log(`\nOutput directory: ${caseDir}`);
    console.log("Files: 12 JSON files (requests + responses)\n");

    // Exit with code 0 for success, 1 for failure
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error("\n❌ CRITICAL ERROR:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
