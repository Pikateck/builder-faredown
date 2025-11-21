/**
 * Pre-Seed TBO Hotel Cache with Smart Batching
 *
 * Usage: node api/scripts/preseed-tbo-cache.js [options]
 *
 * Options:
 *   --min-confidence=80    Only map cities with ≥ 80% confidence
 *   --verified-only        Only map cities marked as verified
 *   --date-range=30        Prefetch for 30 days ahead (default: 30)
 *   --max-days=5           Process max 5 concurrent API calls (rate limit)
 *   --dry-run              Show plan without executing
 *   --city-limit=10        Max cities to process (for testing)
 *
 * This script:
 * 1. Fetches high-confidence city mappings
 * 2. Plans which (city, date, room_config) to search
 * 3. Executes searches via /api/hotels/search (cache layer)
 * 4. Logs progress to tbo_cache_warmup_log
 * 5. Skips already-processed combinations
 */

const axios = require("axios");
const db = require("../database/connection");
const CityMappingService = require("../services/cityMappingService");

const args = process.argv.slice(2);
const minConfidence = parseInt(
  args.find((a) => a.startsWith("--min-confidence="))?.split("=")[1] || "80",
);
const verifiedOnly = args.includes("--verified-only");
const dateRange = parseInt(
  args.find((a) => a.startsWith("--date-range="))?.split("=")[1] || "30",
);
const maxConcurrent = parseInt(
  args.find((a) => a.startsWith("--max-days="))?.split("=")[1] || "3",
);
const dryRun = args.includes("--dry-run");
const cityLimit = parseInt(
  args.find((a) => a.startsWith("--city-limit="))?.split("=")[1] || "999",
);

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

// Room configurations to test (per certification cases)
const ROOM_CONFIGS = [
  { label: "1-Adult", rooms: [{ adults: 1, children: 0, childAges: [] }] },
  {
    label: "2-Adult-2-Child",
    rooms: [{ adults: 2, children: 2, childAges: ["5", "8"] }],
  },
  {
    label: "2-Rooms-1A-1A",
    rooms: [
      { adults: 1, children: 0, childAges: [] },
      { adults: 1, children: 0, childAges: [] },
    ],
  },
  {
    label: "2-Rooms-1A2C-2A",
    rooms: [
      { adults: 1, children: 2, childAges: ["4", "10"] },
      { adults: 2, children: 0, childAges: [] },
    ],
  },
];

/**
 * Get next N dates starting from today
 */
function getDateRange(days) {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a search combination has already been processed
 */
async function isAlreadyProcessed(tboCityId, checkInDate, roomsJson) {
  const result = await db.query(
    `
    SELECT COUNT(*) as count FROM public.tbo_cache_warmup_log
    WHERE tbo_city_id = $1 AND check_in_date = $2 AND room_config = $3
      AND status IN ('completed', 'success')
    `,
    [tboCityId, checkInDate, roomsJson],
  );
  return result.rows[0].count > 0;
}

/**
 * Log warmup attempt
 */
async function logWarmup(
  tboCityId,
  checkInDate,
  roomsJson,
  status,
  hotelCount,
  error,
  durationMs,
) {
  await db.query(
    `
    INSERT INTO public.tbo_cache_warmup_log
      (tbo_city_id, check_in_date, room_config, hotel_count, status, error_message, duration_ms)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [tboCityId, checkInDate, roomsJson, hotelCount, status, error, durationMs],
  );
}

async function main() {
  try {
    console.log("🚀 TBO Cache Pre-Seeding Script");
    console.log(`Options:`);
    console.log(`  minConfidence: ${minConfidence}%`);
    console.log(`  verifiedOnly: ${verifiedOnly}`);
    console.log(`  dateRange: ${dateRange} days`);
    console.log(`  maxConcurrent: ${maxConcurrent}`);
    console.log(`  dryRun: ${dryRun}`);
    console.log(`  cityLimit: ${cityLimit}\n`);

    // Initialize DB
    await db.initialize();
    await db.initializeSchema();

    // ============================================================
    // Step 1: Get mapped cities
    // ============================================================
    console.log("📥 Fetching city mappings...");
    const mappedCities = await CityMappingService.getCitiesForWarmup(
      minConfidence,
      verifiedOnly,
    );

    if (!mappedCities.length) {
      throw new Error(`No cities found with confidence ≥ ${minConfidence}%`);
    }

    const citiesToProcess = mappedCities.slice(0, cityLimit);
    console.log(`✅ Found ${citiesToProcess.length} cities to process`);

    // ============================================================
    // Step 2: Plan which searches to run
    // ============================================================
    console.log(`\n📋 Planning searches...`);
    const dates = getDateRange(dateRange);
    const tasks = [];

    for (const city of citiesToProcess) {
      for (const date of dates) {
        for (const roomConfig of ROOM_CONFIGS) {
          // Calculate nights based on checkout date (assuming 5 nights for domestic, 7 for intl)
          const checkInDate = new Date(date);
          const nights = city.is_domestic ? 5 : 7;
          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkOutDate.getDate() + nights);

          const roomsJson = JSON.stringify(roomConfig.rooms);

          tasks.push({
            tboCityId: city.tbo_city_id,
            tboCityName: city.tbo_city_name,
            countryCode: city.tbo_country_code,
            checkIn: date,
            checkOut: checkOutDate.toISOString().split("T")[0],
            rooms: roomConfig.rooms,
            roomsJson,
            roomsLabel: roomConfig.label,
          });
        }
      }
    }

    console.log(`📊 Total searches planned: ${tasks.length}`);
    console.log(`  Cities: ${citiesToProcess.length}`);
    console.log(`  Dates per city: ${dates.length}`);
    console.log(`  Room configs: ${ROOM_CONFIGS.length}`);

    if (dryRun) {
      console.log(
        `\n✨ Dry run complete. Would process ${tasks.length} searches.`,
      );
      console.log(`   Sample:`);
      tasks.slice(0, 3).forEach((t) => {
        console.log(
          `     ${t.tboCityId} (${t.countryCode}) on ${t.checkIn}, ${t.roomsLabel}`,
        );
      });
      process.exit(0);
    }

    // ============================================================
    // Step 3: Execute searches in batches
    // ============================================================
    console.log(
      `\n🔄 Executing searches (batching ${maxConcurrent} at a time)...`,
    );

    let completed = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < tasks.length; i += maxConcurrent) {
      const batch = tasks.slice(i, i + maxConcurrent);

      const promises = batch.map(async (task) => {
        try {
          // Check if already processed
          if (
            await isAlreadyProcessed(
              task.tboCityId,
              task.checkIn,
              task.roomsJson,
            )
          ) {
            skipped++;
            return;
          }

          const startTime = Date.now();

          // Call our cache-backed /api/hotels/search endpoint
          const response = await axios.post(
            `${API_BASE_URL}/api/hotels/search`,
            {
              destination: task.tboCityName,
              cityId: task.tboCityId,
              countryCode: task.countryCode,
              checkIn: task.checkIn,
              checkOut: task.checkOut,
              rooms: task.rooms,
              guestNationality: task.countryCode, // Simple default
            },
            { timeout: 30000 },
          );

          const durationMs = Date.now() - startTime;
          const hotelCount = response.data.hotels?.length || 0;

          await logWarmup(
            task.tboCityId,
            task.checkIn,
            task.roomsJson,
            "completed",
            hotelCount,
            null,
            durationMs,
          );

          completed++;

          if (completed % 10 === 0) {
            console.log(
              `  ✓ Completed ${completed} (${skipped} skipped, ${errors} errors)`,
            );
          }
        } catch (error) {
          await logWarmup(
            task.tboCityId,
            task.checkIn,
            task.roomsJson,
            "error",
            0,
            error.message,
            0,
          );
          errors++;
        }
      });

      await Promise.all(promises);

      // Rate limiting between batches
      if (i + maxConcurrent < tasks.length) {
        console.log(`  ⏱️  Rate limiting (2 sec)...`);
        await sleep(2000);
      }
    }

    // ============================================================
    // Step 4: Summary
    // ============================================================
    console.log(`\n✅ Complete!`);
    console.log(`  Completed: ${completed}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Errors: ${errors}`);

    // Show warmup statistics
    const stats = await db.query(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
        AVG(hotel_count) as avg_hotels,
        MAX(hotel_count) as max_hotels,
        AVG(duration_ms) as avg_duration_ms
      FROM public.tbo_cache_warmup_log
    `,
    );

    const s = stats.rows[0];
    console.log(`\n📊 Cache Warmup Statistics:`);
    console.log(`  Total attempts: ${s.total}`);
    console.log(`  Successful: ${s.success_count}`);
    console.log(`  Errors: ${s.error_count}`);
    console.log(
      `  Avg hotels per search: ${parseFloat(s.avg_hotels).toFixed(0)}`,
    );
    console.log(`  Max hotels: ${s.max_hotels}`);
    console.log(
      `  Avg response time: ${parseFloat(s.avg_duration_ms).toFixed(0)}ms`,
    );

    console.log(`\n🎉 Cache pre-seeding complete!`);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
