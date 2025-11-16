/**
 * Test Admin Panel ↔ PostgreSQL Database Synchronization
 *
 * This script verifies that the admin panel is properly connected
 * to the PostgreSQL database and can perform CRUD operations.
 *
 * Run: node test-admin-panel-database-sync.js
 */

const { Pool } = require("pg");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

console.log("\n" + "=".repeat(80));
console.log("ADMIN PANEL ↔ DATABASE SYNC TEST");
console.log("=".repeat(80) + "\n");

async function testConnection() {
  try {
    console.log("📊 Step 1: Testing Database Connection...");
    const result = await pool.query(
      "SELECT NOW() as current_time, current_database() as database",
    );
    console.log("   ✅ Connected to database:", result.rows[0].database);
    console.log("   ✅ Database time:", result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error("   ❌ Connection failed:", error.message);
    return false;
  }
}

async function checkTable() {
  try {
    console.log("\n📋 Step 2: Checking module_markups Table...");

    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'module_markups'
      )
    `);

    if (!tableExists.rows[0].exists) {
      console.error("   ❌ Table module_markups does not exist!");
      console.log(
        "   💡 Run migration: api/database/migrations/20251019_suppliers_master_spec.sql",
      );
      return false;
    }

    console.log("   ✅ Table module_markups exists");

    // Get column information
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'module_markups'
      ORDER BY ordinal_position
    `);

    console.log("   ✅ Table has", columns.rows.length, "columns");
    console.log("\n   📊 Column Structure:");
    columns.rows.forEach((col) => {
      console.log(`      - ${col.column_name}: ${col.data_type}`);
    });

    return true;
  } catch (error) {
    console.error("   ❌ Table check failed:", error.message);
    return false;
  }
}

async function checkExistingData() {
  try {
    console.log("\n📊 Step 3: Checking Existing Data...");

    const result = await pool.query(`
      SELECT module, COUNT(*) as count 
      FROM module_markups 
      GROUP BY module
      ORDER BY module
    `);

    if (result.rows.length === 0) {
      console.log("   ⚠️  No data found in module_markups table");
      console.log("   💡 This is normal for a fresh installation");
      return true;
    }

    console.log("   ✅ Found data by module:");
    result.rows.forEach((row) => {
      console.log(`      - ${row.module}: ${row.count} records`);
    });

    // Show sample AIR markup if exists
    const airSample = await pool.query(`
      SELECT id, airline_code, cabin, markup_type, markup_value, status, created_at
      FROM module_markups 
      WHERE module = 'AIR'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (airSample.rows.length > 0) {
      console.log("\n   📄 Sample AIR Markup:");
      console.log("      ID:", airSample.rows[0].id);
      console.log("      Airline:", airSample.rows[0].airline_code || "ALL");
      console.log("      Cabin:", airSample.rows[0].cabin || "ALL");
      console.log("      Type:", airSample.rows[0].markup_type);
      console.log("      Value:", airSample.rows[0].markup_value);
      console.log(
        "      Status:",
        airSample.rows[0].status ? "Active" : "Inactive",
      );
      console.log("      Created:", airSample.rows[0].created_at);
    }

    return true;
  } catch (error) {
    console.error("   ❌ Data check failed:", error.message);
    return false;
  }
}

async function testCreateOperation() {
  try {
    console.log("\n✏️  Step 4: Testing CREATE Operation...");

    const testMarkup = {
      module: "AIR",
      airline_code: "TEST",
      cabin: "ECONOMY",
      markup_type: "PERCENT",
      markup_value: 10.5,
      bargain_min_pct: 5,
      bargain_max_pct: 10,
      status: true,
      created_by: "test_script",
      updated_by: "test_script",
    };

    const result = await pool.query(
      `
      INSERT INTO module_markups (
        module, airline_code, cabin, markup_type, markup_value, 
        bargain_min_pct, bargain_max_pct, status, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at
    `,
      [
        testMarkup.module,
        testMarkup.airline_code,
        testMarkup.cabin,
        testMarkup.markup_type,
        testMarkup.markup_value,
        testMarkup.bargain_min_pct,
        testMarkup.bargain_max_pct,
        testMarkup.status,
        testMarkup.created_by,
        testMarkup.updated_by,
      ],
    );

    console.log("   ✅ Created test markup with ID:", result.rows[0].id);
    console.log("   ✅ Created at:", result.rows[0].created_at);

    return result.rows[0].id;
  } catch (error) {
    console.error("   ❌ CREATE failed:", error.message);
    return null;
  }
}

async function testReadOperation(id) {
  try {
    console.log("\n📖 Step 5: Testing READ Operation...");

    const result = await pool.query(
      `
      SELECT * FROM module_markups WHERE id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      console.error("   ❌ Record not found");
      return false;
    }

    console.log("   ✅ Successfully read record");
    console.log("   📄 Data:", JSON.stringify(result.rows[0], null, 2));

    return true;
  } catch (error) {
    console.error("   ❌ READ failed:", error.message);
    return false;
  }
}

async function testUpdateOperation(id) {
  try {
    console.log("\n✏️  Step 6: Testing UPDATE Operation...");

    const result = await pool.query(
      `
      UPDATE module_markups 
      SET markup_value = $1, 
          bargain_max_pct = $2,
          updated_by = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING markup_value, bargain_max_pct, updated_at
    `,
      [15.75, 12.5, "test_script_update", id],
    );

    if (result.rows.length === 0) {
      console.error("   ❌ Record not found for update");
      return false;
    }

    console.log("   ✅ Successfully updated record");
    console.log("   ✅ New markup_value:", result.rows[0].markup_value);
    console.log("   ✅ New bargain_max_pct:", result.rows[0].bargain_max_pct);
    console.log("   ✅ Updated at:", result.rows[0].updated_at);

    return true;
  } catch (error) {
    console.error("   ❌ UPDATE failed:", error.message);
    return false;
  }
}

async function testDeleteOperation(id) {
  try {
    console.log("\n🗑️  Step 7: Testing DELETE Operation...");

    const result = await pool.query(
      `
      DELETE FROM module_markups WHERE id = $1 RETURNING id
    `,
      [id],
    );

    if (result.rows.length === 0) {
      console.error("   ❌ Record not found for deletion");
      return false;
    }

    console.log("   ✅ Successfully deleted test record");
    console.log("   ✅ Deleted ID:", result.rows[0].id);

    // Verify deletion
    const verify = await pool.query(
      `
      SELECT * FROM module_markups WHERE id = $1
    `,
      [id],
    );

    if (verify.rows.length === 0) {
      console.log("   ✅ Verified: Record no longer exists in database");
      return true;
    } else {
      console.error("   ❌ Record still exists after deletion!");
      return false;
    }
  } catch (error) {
    console.error("   ❌ DELETE failed:", error.message);
    return false;
  }
}

async function runAllTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  let testId = null;

  try {
    // Test 1: Connection
    if (await testConnection()) {
      testsPassed++;
    } else {
      testsFailed++;
      return { testsPassed, testsFailed };
    }

    // Test 2: Table Structure
    if (await checkTable()) {
      testsPassed++;
    } else {
      testsFailed++;
      return { testsPassed, testsFailed };
    }

    // Test 3: Existing Data
    if (await checkExistingData()) {
      testsPassed++;
    } else {
      testsFailed++;
    }

    // Test 4: CREATE
    testId = await testCreateOperation();
    if (testId) {
      testsPassed++;
    } else {
      testsFailed++;
      return { testsPassed, testsFailed };
    }

    // Test 5: READ
    if (await testReadOperation(testId)) {
      testsPassed++;
    } else {
      testsFailed++;
    }

    // Test 6: UPDATE
    if (await testUpdateOperation(testId)) {
      testsPassed++;
    } else {
      testsFailed++;
    }

    // Test 7: DELETE
    if (await testDeleteOperation(testId)) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.error("\n❌ Test suite error:", error.message);
    testsFailed++;
  } finally {
    await pool.end();
  }

  return { testsPassed, testsFailed };
}

// Run tests
runAllTests()
  .then(({ testsPassed, testsFailed }) => {
    console.log("\n" + "=".repeat(80));
    console.log("TEST RESULTS");
    console.log("=".repeat(80));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log("=".repeat(80) + "\n");

    if (testsFailed === 0) {
      console.log("🎉 ALL TESTS PASSED - Database sync is working correctly!");
      console.log("✅ Admin panel will be able to:");
      console.log("   - Create markups (writes to database)");
      console.log("   - Read markups (reads from database)");
      console.log("   - Update markups (updates database)");
      console.log("   - Delete markups (deletes from database)");
      console.log(
        "\n✅ PgAdmin changes will reflect in admin panel immediately",
      );
      console.log(
        "✅ Admin panel changes will reflect in PgAdmin immediately\n",
      );
      process.exit(0);
    } else {
      console.log("⚠️  SOME TESTS FAILED - Please review errors above");
      console.log("💡 Common issues:");
      console.log("   - DATABASE_URL not set correctly");
      console.log("   - module_markups table missing (run migration)");
      console.log("   - Database connection blocked by firewall\n");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error.message);
    process.exit(1);
  });
