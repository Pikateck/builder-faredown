#!/usr/bin/env node

/**
 * Diagnostic Script for Cache-Backed Hotel Search
 * Identifies and reports errors preventing hotel search from working
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function diagnose() {
  log("bright", "\n╔════════════════════════════════════════════════════╗");
  log("bright", "║  CACHE-BACKED SEARCH - ERROR DIAGNOSIS             ║");
  log("bright", "╚════════════════════════════════════════════════════╝\n");

  const issues = [];

  // 1. Check environment variables
  log("yellow", "1️⃣  Checking Environment Variables...\n");

  const requiredVars = [
    "TBO_HOTEL_CLIENT_ID",
    "TBO_HOTEL_USER_ID",
    "TBO_HOTEL_PASSWORD",
    "TBO_HOTEL_SEARCH_URL",
    "DATABASE_URL",
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      const masked =
        varName.includes("PASSWORD") || varName.includes("URL")
          ? value.substring(0, 10) + "..."
          : value;
      log("green", `   ✅ ${varName}: ${masked}`);
    } else {
      log("red", `   ❌ ${varName}: NOT SET`);
      issues.push(`Missing environment variable: ${varName}`);
    }
  }

  // 2. Check database connection
  log("yellow", "\n2️⃣  Checking Database Connection...\n");

  try {
    const db = require("../database/connection");
    const result = await db.query("SELECT NOW() as now");

    if (result && result.rows && result.rows.length > 0) {
      log("green", `   ✅ Database connected: ${result.rows[0].now}`);
    } else {
      log("red", "   ❌ Database query returned no results");
      issues.push("Database connection failed");
    }
  } catch (error) {
    log("red", `   ❌ Database error: ${error.message}`);
    issues.push(`Database connection error: ${error.message}`);
  }

  // 3. Check cache tables
  log("yellow", "\n3️⃣  Checking Cache Tables...\n");

  try {
    const db = require("../database/connection");

    const tables = [
      "hotel_search_cache",
      "tbo_hotels_normalized",
      "tbo_rooms_normalized",
      "hotel_search_cache_results",
    ];

    for (const table of tables) {
      const result = await db.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
        [table],
      );

      if (result.rows[0].exists) {
        const countResult = await db.query(
          `SELECT COUNT(*) as count FROM public.${table}`,
        );
        const count = countResult.rows[0].count;
        log("green", `   ✅ ${table}: ${count} rows`);
      } else {
        log("red", `   ❌ ${table}: NOT FOUND`);
        issues.push(`Cache table missing: ${table}`);
      }
    }
  } catch (error) {
    log("red", `   ❌ Error checking tables: ${error.message}`);
    issues.push(`Error checking cache tables: ${error.message}`);
  }

  // 4. Check TBO adapter
  log("yellow", "\n4️⃣  Checking TBO Adapter...\n");

  try {
    const TBOAdapter = require("../services/adapters/tboAdapter");
    const adapter = new TBOAdapter();

    if (adapter) {
      log("green", `   ✅ TBO Adapter initialized`);

      // Try to get a token
      try {
        const token = await Promise.race([
          adapter.getHotelToken(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Token request timeout")), 30000),
          ),
        ]);

        if (token) {
          log(
            "green",
            `   ✅ TBO Token obtained: ${token.substring(0, 20)}...`,
          );
        } else {
          log("red", "   ❌ TBO Token is null or empty");
          issues.push("TBO token retrieval failed");
        }
      } catch (tokenError) {
        log("red", `   ❌ TBO Token error: ${tokenError.message}`);
        issues.push(`TBO token error: ${tokenError.message}`);
      }
    } else {
      log("red", "   ❌ TBO Adapter failed to initialize");
      issues.push("TBO Adapter initialization failed");
    }
  } catch (error) {
    log("red", `   ❌ TBO Adapter error: ${error.message}`);
    issues.push(`TBO Adapter error: ${error.message}`);
  }

  // 5. Check cache service
  log("yellow", "\n5️⃣  Checking Hotel Cache Service...\n");

  try {
    const hotelCacheService = require("../services/hotelCacheService");

    if (hotelCacheService) {
      log("green", `   ✅ HotelCacheService loaded`);

      // Test hash generation
      const testParams = {
        cityId: "1",
        countryCode: "AE",
        checkIn: "2025-11-30",
        checkOut: "2025-12-03",
        rooms: "1",
      };

      const hash = hotelCacheService.generateSearchHash(testParams);
      if (hash && hash.length === 64) {
        log(
          "green",
          `   ✅ Hash generation working: ${hash.substring(0, 16)}...`,
        );
      } else {
        log("red", `   ❌ Hash generation failed: ${hash}`);
        issues.push("Hash generation failed");
      }
    } else {
      log("red", "   ❌ HotelCacheService failed to load");
      issues.push("HotelCacheService loading failed");
    }
  } catch (error) {
    log("red", `   ❌ HotelCacheService error: ${error.message}`);
    issues.push(`HotelCacheService error: ${error.message}`);
  }

  // Summary
  log("bright", "\n╔══════════════════════��═════════════════════════════╗");
  log("bright", "║                    SUMMARY                         ║");
  log("bright", "╚════════════════════════════════════════════════════╝\n");

  if (issues.length === 0) {
    log("green", "✅ All systems operational!");
    log("blue", "\nThe cache-backed search should be working.");
    log("blue", "If you still see errors, check the API logs.");
  } else {
    log("red", `❌ Found ${issues.length} issue(s):\n`);

    issues.forEach((issue, i) => {
      log("red", `   ${i + 1}. ${issue}`);
    });

    log("yellow", "\n🔧 Recommended Actions:\n");

    if (issues.some((i) => i.includes("environment variable"))) {
      log(
        "blue",
        "   • Verify TBO credentials are set in Render environment variables",
      );
      log(
        "blue",
        "   • Check: TBO_HOTEL_CLIENT_ID, TBO_HOTEL_USER_ID, TBO_HOTEL_PASSWORD",
      );
    }

    if (issues.some((i) => i.includes("Database"))) {
      log("blue", "   • Verify DATABASE_URL is correctly set");
      log("blue", '   • Test connection: psql $DATABASE_URL -c "SELECT 1"');
    }

    if (issues.some((i) => i.includes("Cache table"))) {
      log(
        "blue",
        "   • Re-run migration: psql $DATABASE_URL < api/database/migrations/20250205_hotel_cache_layer.sql",
      );
    }

    if (issues.some((i) => i.includes("TBO"))) {
      log("blue", "   • Check TBO API credentials and endpoints");
      log("blue", "   • Verify network connectivity to TBO API");
    }
  }

  log("bright", "\n═══════════════════════════════════════════════════\n");
}

diagnose().catch((error) => {
  log("red", `\n❌ Diagnostic script failed: ${error.message}`);
  process.exit(1);
});
