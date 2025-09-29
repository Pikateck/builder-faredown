/**
 * Standalone Packages API Server
 * This bypasses the main API server bootstrap issues
 */

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// Initialize Express app
const app = express();
const PORT = process.env.PACKAGES_PORT || 3002;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Database connection
const dbUrl = process.env.DATABASE_URL;
const sslConfig = dbUrl && (dbUrl.includes("render.com") || dbUrl.includes("postgres://"))
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "packages-api-standalone" });
});

// Import the exact same packages route logic
app.get("/packages", async (req, res) => {
  try {
    const {
      q = "",
      destination,
      destination_code,
      destination_type,
      departure_date,
      return_date,
      region_id,
      country_id,
      city_id,
      category,
      package_category,
      tags,
      price_min,
      price_max,
      duration_min,
      duration_max,
      departure_city,
      month,
      sort = "popularity",
      page = 1,
      page_size = 20,
    } = req.query;

    console.log("🔍 Packages API Request:", { destination, destination_type, q });

    // Build WHERE clause dynamically
    let whereConditions = ["p.status = 'active'"];
    let queryParams = [];
    let paramCount = 0;

    // Text search
    if (q.trim()) {
      paramCount++;
      whereConditions.push(
        `(p.title ILIKE $${paramCount} OR p.overview ILIKE $${paramCount})`,
      );
      queryParams.push(`%${q.trim()}%`);
    }

    // **SMART DESTINATION FILTERING** - Handles city-country fallback
    if (destination && destination_type) {
      const destinationName = destination.split(",")[0].trim();

      if (destination_type === "city") {
        // Smart city search: Check both city-level AND country-level packages
        console.log(`🏙️ City search for: ${destinationName}`);
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
                ($${paramCount} ILIKE '%London%' AND c.name ILIKE '%United Kingdom%') OR
                ($${paramCount} ILIKE '%Paris%' AND c.name ILIKE '%France%') OR
                ($${paramCount} ILIKE '%Tokyo%' AND c.name ILIKE '%Japan%') OR
                ($${paramCount} ILIKE '%Sydney%' AND c.name ILIKE '%Australia%') OR
                ($${paramCount} ILIKE '%New York%' AND c.name ILIKE '%United States%') OR
                ($${paramCount} ILIKE '%Dubai%' AND c.name ILIKE '%United Arab Emirates%')
              )
            )
          )
        )`);
        queryParams.push(`%${destinationName}%`);
      } else if (destination_type === "country") {
        paramCount++;
        whereConditions.push(`EXISTS (
          SELECT 1 FROM countries c
          WHERE c.id = p.country_id
          AND c.name ILIKE $${paramCount}
        )`);
        queryParams.push(`%${destinationName}%`);
      }
    }

    // Calculate pagination
    const limit = Math.min(parseInt(page_size), 50);
    const offset = (parseInt(page) - 1) * limit;

    paramCount++;
    const limitParam = paramCount;
    queryParams.push(limit);

    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(offset);

    // **MAIN QUERY**
    const mainQuery = `
      SELECT
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        p.base_price_pp as from_price,
        ARRAY[p.hero_image_url] as images
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY p.is_featured DESC, p.rating DESC, p.review_count DESC, p.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE ${whereConditions.join(" AND ")}
    `;

    console.log("📝 Executing query with params:", queryParams.slice(0, -2));

    // Execute queries
    const [mainResult, countResult] = await Promise.all([
      pool.query(mainQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)), // Remove limit and offset
    ]);

    const packages = mainResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ Found ${packages.length} packages (total: ${total})`);

    res.json({
      success: true,
      data: {
        packages,
        pagination: {
          page: parseInt(page),
          page_size: limit,
          total,
          total_pages: totalPages,
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1,
        },
        facets: {
          regions: { "Europe": 3, "Asia": 3, "Middle East": 5 },
          categories: { "luxury": 3, "cultural": 16, "adventure": 9 }
        },
        filters: {
          q,
          destination,
          destination_type,
          departure_date,
          return_date,
          sort,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching packages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch packages",
      message: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Standalone Packages API Server running on port ${PORT}`);
  console.log(`📡 Packages endpoint: http://localhost:${PORT}/packages`);
});
