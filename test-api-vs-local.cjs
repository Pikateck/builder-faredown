#!/usr/bin/env node

const { Pool } = require("pg");

// Database connection
const dbUrl = process.env.DATABASE_URL;
const sslConfig =
  dbUrl && (dbUrl.includes("render.com") || dbUrl.includes("postgres://"))
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function testApiVsLocal() {
  try {
    console.log("🔍 Testing London search: Deployed API vs Local Logic");
    console.log("=" * 60);

    // Test 1: Test our local logic directly (same as in packages.js)
    console.log("\n1️⃣ Testing LOCAL LOGIC (our packages.js code):");
    const destinationName = "London";
    const whereConditions = ["p.status = 'active'"];
    let queryParams = [];
    let paramCount = 0;

    // **EXACT SAME LOGIC AS IN packages.js**
    paramCount++;
    whereConditions.push(`(
      -- Direct city match
      EXISTS (
        SELECT 1 FROM cities ci
        WHERE ci.id = p.city_id
        AND ci.name ILIKE $${paramCount}
      )
      OR
      -- Country match for major cities (e.g., London -> United Kingdom)
      EXISTS (
        SELECT 1 FROM countries c
        WHERE c.id = p.country_id
        AND (
          -- Direct country name match
          c.name ILIKE $${paramCount}
          OR
          -- Major city to country mapping
          (
            ($${paramCount} ILIKE '%London%' AND c.name ILIKE '%United Kingdom%')
          )
        )
      )
    )`);
    queryParams.push(`%${destinationName}%`);

    const localQuery = `
      SELECT
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        p.base_price_pp as from_price
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY p.is_featured DESC, p.rating DESC, p.review_count DESC, p.created_at DESC
      LIMIT 5
    `;

    const localResult = await pool.query(localQuery, queryParams);
    console.log(`✅ Local logic found ${localResult.rows.length} packages:`);
    localResult.rows.forEach((pkg) => {
      console.log(`   - ${pkg.title} (${pkg.country_name})`);
    });

    // Test 2: Test the deployed API
    console.log("\n2️⃣ Testing DEPLOYED API:");
    const https = require("https");
    const url =
      "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/packages?destination=London&destination_type=city&limit=5";

    const apiResponse = await new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ error: "Failed to parse JSON", data });
            }
          });
        })
        .on("error", reject);
    });

    console.log(
      `📡 API Response: ${apiResponse.success ? "SUCCESS" : "ERROR"}`,
    );
    if (apiResponse.success) {
      const packages = apiResponse.data.packages || [];
      console.log(`✅ API found ${packages.length} packages:`);
      packages.forEach((pkg) => {
        console.log(`   - ${pkg.title} (${pkg.country_name || "Unknown"})`);
      });
    } else {
      console.log(`❌ API Error:`, apiResponse);
    }

    // Test 3: Compare results
    console.log("\n3️⃣ COMPARISON:");
    if (
      localResult.rows.length > 0 &&
      (!apiResponse.success || (apiResponse.data.packages || []).length === 0)
    ) {
      console.log("🚨 PROBLEM IDENTIFIED:");
      console.log("   - Local logic works correctly");
      console.log("   - API returns empty results");
      console.log(
        "   - This indicates a deployment/loading issue with the API",
      );
      console.log(
        "\n💡 SOLUTION: The API server needs proper restart to load updated packages.js",
      );
    } else if (localResult.rows.length === 0) {
      console.log(
        "🤔 Local logic also returns empty - there might be a data issue",
      );
    } else {
      console.log("✅ Both local and API are working consistently");
    }
  } catch (error) {
    console.error("❌ Error during testing:", error);
  } finally {
    await pool.end();
  }
}

testApiVsLocal();
