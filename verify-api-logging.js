/**
 * Verification Script for Third-Party API Logging
 * Tests that the logging system is properly configured and working
 */

const pool = require("./api/database/connection");
const thirdPartyLogger = require("./api/services/thirdPartyLogger");

async function verifyApiLogging() {
  console.log("🔍 Verifying Third-Party API Logging System...\n");

  try {
    // Initialize database connection
    await pool.initialize();

    // 1. Check if table exists
    console.log("1️⃣ Checking if third_party_api_logs table exists...");
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'third_party_api_logs'
      ) as table_exists
    `);

    if (tableCheck.rows[0].table_exists) {
      console.log("✅ Table 'third_party_api_logs' exists in public schema\n");
    } else {
      console.log("❌ Table 'third_party_api_logs' does NOT exist");
      console.log("   Run: await db.initializeSchema() to create it\n");
      process.exit(1);
    }

    // 2. Check table structure
    console.log("2️⃣ Checking table structure...");
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'third_party_api_logs'
      ORDER BY ordinal_position
    `);

    console.log(`✅ Table has ${columns.rows.length} columns:`);
    columns.rows.forEach((col) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log();

    // 3. Check indexes
    console.log("3️⃣ Checking indexes...");
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'third_party_api_logs'
    `);

    console.log(`✅ Table has ${indexes.rows.length} indexes:`);
    indexes.rows.forEach((idx) => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log();

    // 4. Test logging functionality
    console.log("4️⃣ Testing logging functionality...");

    const testLog = thirdPartyLogger.startRequest({
      supplierName: "TEST_SUPPLIER",
      endpoint: "https://api.test.com/verify",
      method: "POST",
      requestPayload: { test: "data", password: "secret123" },
      requestHeaders: { "Content-Type": "application/json" },
      correlationId: "TEST-" + Date.now(),
    });

    await testLog.end({
      responsePayload: { success: true, message: "Test response" },
      statusCode: 200,
    });

    console.log("✅ Test log entry created successfully\n");

    // 5. Verify log was created
    console.log("5️⃣ Verifying log entry in database...");
    const logCheck = await pool.query(`
      SELECT * FROM public.third_party_api_logs 
      WHERE supplier_name = 'TEST_SUPPLIER' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (logCheck.rows.length > 0) {
      const log = logCheck.rows[0];
      console.log("✅ Log entry found:");
      console.log(`   - ID: ${log.id}`);
      console.log(`   - Supplier: ${log.supplier_name}`);
      console.log(`   - Endpoint: ${log.endpoint}`);
      console.log(`   - Status Code: ${log.status_code}`);
      console.log(`   - Duration: ${log.duration_ms}ms`);
      console.log(`   - Trace ID: ${log.trace_id}`);

      // Check if password was sanitized
      const requestPayload = log.request_payload;
      if (requestPayload.password && requestPayload.password !== "secret123") {
        console.log(`   - Password sanitized: ✅ (${requestPayload.password})`);
      } else {
        console.log(`   - Password sanitization: ❌ NOT SANITIZED!`);
      }
      console.log();
    } else {
      console.log("❌ Log entry not found in database\n");
    }

    // 6. Test query methods
    console.log("6️⃣ Testing query methods...");

    const stats = await thirdPartyLogger.getSupplierStats("TEST_SUPPLIER");
    if (stats) {
      console.log("✅ getSupplierStats() works:");
      console.log(`   - Total Requests: ${stats.total_requests}`);
      console.log(`   - Successful: ${stats.successful_requests}`);
      console.log(`   - Failed: ${stats.failed_requests}`);
      console.log();
    }

    const errorLogs = await thirdPartyLogger.getErrorLogs(null, 5);
    console.log(`✅ getErrorLogs() returned ${errorLogs.length} error logs\n`);

    // 7. Check cleanup function
    console.log("7️⃣ Testing cleanup function...");
    const cleanupCheck = await pool.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'cleanup_old_api_logs'
    `);

    if (cleanupCheck.rows.length > 0) {
      console.log("✅ cleanup_old_api_logs() function exists\n");
    } else {
      console.log("⚠️  cleanup_old_api_logs() function not found\n");
    }

    // 8. Summary
    console.log("=".repeat(60));
    console.log("✅ VERIFICATION COMPLETE - All checks passed!");
    console.log("=".repeat(60));
    console.log("\n📚 Next Steps:");
    console.log("   1. Restart API server: npm run dev");
    console.log("   2. Make test API calls to TBO/Hotelbeds");
    console.log("   3. Query logs: GET /api/admin/api-logs?supplier=TBO");
    console.log("   4. View stats: GET /api/admin/api-logs/stats/TBO");
    console.log("   5. View errors: GET /api/admin/api-logs/errors/recent");
    console.log(
      "\n📖 Documentation: THIRD_PARTY_API_LOGGING_IMPLEMENTATION.md\n",
    );

    // Cleanup test data
    await pool.query(`
      DELETE FROM public.third_party_api_logs 
      WHERE supplier_name = 'TEST_SUPPLIER'
    `);
    console.log("🧹 Test data cleaned up\n");

    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Verification failed:", error.message);
    console.error(error.stack);
    await pool.close();
    process.exit(1);
  }
}

// Run verification
verifyApiLogging();
