import { createServer } from "vite";
import express from "express";
import cors from "cors";
import path from "path";

// Start API server on port 3001 so our /api proxy has a local target
try {
  await import("./api/server.js");
  console.log("✅ API server bootstrapped alongside dev server");
} catch (e) {
  console.warn("⚠️ Failed to bootstrap API server:", e.message);
}

// Create Express app
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// 🎯 BUILDER.IO IFRAME SUPPORT - Add headers for Builder.io preview
app.use((req, res, next) => {
  // Remove X-Frame-Options to allow embedding
  res.removeHeader("X-Frame-Options");

  // Add CSP to allow Builder.io iframes
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://builder.io https://*.builder.io",
  );

  // Configure cookies for cross-site context
  res.setHeader("Set-Cookie", "SameSite=None; Secure");

  next();
});

// Add packages API logic directly to dev server
const pg = await import("pg");
const { Pool } = pg;

// Database connection for packages API
const dbUrl = process.env.DATABASE_URL;
const sslConfig =
  dbUrl && (dbUrl.includes("render.com") || dbUrl.includes("postgres://"))
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

// Auth API handler
async function handleAuthAPI(req, res) {
  try {
    console.log("🔐 Auth API Request:", req.originalUrl);

    // Handle /api/auth/me - get current user
    if (req.originalUrl.includes('/auth/me')) {
      // For development, return a mock user or null if not authenticated
      return res.json({
        success: true,
        data: null // No user authenticated in dev mode
      });
    }

    // Handle other auth endpoints
    return res.json({
      success: true,
      message: "Auth endpoint",
      data: null
    });

  } catch (error) {
    console.error("❌ Auth API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch auth data",
      message: error.message,
    });
  }
}

// Currency API handler
async function handleCurrencyAPI(req, res) {
  try {
    console.log("💱 Currency API Request:", req.originalUrl);

    // Mock currency data for development
    const currencies = [
      { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 1.0, default: true },
      { code: "USD", name: "US Dollar", symbol: "$", rate: 0.012, default: false },
      { code: "EUR", name: "Euro", symbol: "€", rate: 0.011, default: false },
      { code: "GBP", name: "British Pound", symbol: "£", rate: 0.0095, default: false },
      { code: "AED", name: "UAE Dirham", symbol: "د.إ", rate: 0.044, default: false }
    ];

    return res.json({
      success: true,
      currencies: currencies,
      default_currency: "INR"
    });

  } catch (error) {
    console.error("❌ Currency API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch currency data",
      message: error.message,
    });
  }
}

// Loyalty API handler
async function handleLoyaltyAPI(req, res) {
  try {
    console.log("🎯 Loyalty API Request:", req.originalUrl);

    // Handle /api/loyalty/me - user loyalty profile
    if (req.originalUrl.includes('/loyalty/me')) {
      // Mock loyalty data for development
      const loyaltyData = {
        user_id: "dev_user_123",
        membership_tier: "Silver",
        points_balance: 2500,
        total_lifetime_points: 8750,
        points_expiring_soon: 500,
        expiry_date: "2025-12-31",
        tier_progress: {
          current_tier: "Silver",
          next_tier: "Gold",
          points_needed: 2500,
          current_year_points: 2500
        },
        recent_transactions: [
          {
            id: 1,
            type: "earned",
            points: 500,
            description: "London Royal Experience booking",
            date: "2025-09-25",
            booking_reference: "LON001"
          },
          {
            id: 2,
            type: "earned",
            points: 300,
            description: "Hotel booking bonus",
            date: "2025-09-20",
            booking_reference: "HTL002"
          }
        ],
        benefits: [
          "Priority customer support",
          "10% bonus points on all bookings",
          "Free upgrades (subject to availability)",
          "Extended cancellation period"
        ]
      };

      return res.json({
        success: true,
        data: loyaltyData
      });
    }

    // Handle other loyalty endpoints
    return res.json({
      success: true,
      message: "Loyalty API endpoint",
      data: {}
    });

  } catch (error) {
    console.error("❌ Loyalty API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch loyalty data",
      message: error.message,
    });
  }
}

// Destinations search API handler
async function handleDestinationsAPI(req, res) {
  try {
    const { q = "" } = req.query;
    console.log("🗺️ Destinations search API Request:", { q });

    const searchTerm = q.trim().toLowerCase();

    if (!searchTerm) {
      return res.json({
        success: true,
        destinations: [],
      });
    }

    const destinationsQuery = `
      SELECT
        'city' as type,
        ci.name,
        co.name as country,
        ci.name || ', ' || co.name as display_name,
        'city_' || ci.id as id,
        CASE WHEN LOWER(ci.name) = $2 THEN 1 ELSE 2 END as priority
      FROM cities ci
      JOIN countries co ON ci.country_id = co.id
      WHERE ci.name ILIKE $1
      ORDER BY priority ASC, ci.name ASC
      LIMIT 10
    `;

    const result = await pool.query(destinationsQuery, [
      `%${searchTerm}%`,
      searchTerm,
    ]);
    const destinations = result.rows;

    console.log(
      `✅ Destinations search found ${destinations.length} results for "${q}"`,
    );

    return res.json({
      success: true,
      destinations: destinations,
    });
  } catch (error) {
    console.error("❌ Destinations API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to search destinations",
      message: error.message,
    });
  }
}

// Countries API handler
async function handleCountriesAPI(req, res) {
  try {
    console.log("🌍 Countries API Request");

    const countriesQuery = `
      SELECT
        iso2, name as display_name, name,
        CASE
          WHEN iso2 IN ('IN', 'AE', 'US', 'GB', 'SG', 'SA', 'TH', 'MY', 'ID', 'PH') THEN true
          ELSE false
        END as popular,
        CASE iso2
          WHEN 'IN' THEN '🇮🇳'
          WHEN 'AE' THEN '🇦🇪'
          WHEN 'US' THEN '🇺🇸'
          WHEN 'GB' THEN '🇬🇧'
          WHEN 'SG' THEN '🇸🇬'
          WHEN 'SA' THEN '🇸🇦'
          WHEN 'AU' THEN '🇦🇺'
          WHEN 'CA' THEN '🇨🇦'
          WHEN 'DE' THEN '🇩🇪'
          WHEN 'FR' THEN '🇫🇷'
          WHEN 'JP' THEN '🇯🇵'
          WHEN 'TH' THEN '🇹🇭'
          WHEN 'MY' THEN '🇲🇾'
          WHEN 'ID' THEN '🇮🇩'
          WHEN 'PH' THEN '🇵🇭'
          ELSE '🌍'
        END as flag_emoji,
        CASE iso2
          WHEN 'IN' THEN '🇮🇳'
          WHEN 'AE' THEN '🇦🇪'
          WHEN 'US' THEN '🇺🇸'
          WHEN 'GB' THEN '🇬🇧'
          WHEN 'SG' THEN '🇸🇬'
          WHEN 'SA' THEN '🇸🇦'
          WHEN 'AU' THEN '🇦🇺'
          WHEN 'CA' THEN '🇨🇦'
          WHEN 'DE' THEN '🇩🇪'
          WHEN 'FR' THEN '🇫🇷'
          WHEN 'JP' THEN '🇯🇵'
          WHEN 'TH' THEN '🇹🇭'
          WHEN 'MY' THEN '🇲🇾'
          WHEN 'ID' THEN '🇮🇩'
          WHEN 'PH' THEN '🇵🇭'
          ELSE '🌍'
        END as flag
      FROM countries
      ORDER BY popular DESC, name ASC
    `;

    const result = await pool.query(countriesQuery);
    const countries = result.rows;

    console.log(`✅ Countries API found ${countries.length} countries`);

    return res.json({
      success: true,
      count: countries.length,
      countries: countries,
    });
  } catch (error) {
    console.error("❌ Countries API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch countries",
      message: error.message,
    });
  }
}

// Direct packages endpoint handler
async function handlePackagesAPI(req, res) {
  try {
    // Support single package by slug: /api/packages/:slug
    const slugMatch = req.originalUrl.match(/^\/api\/packages\/([^?]+)/);
    if (slugMatch && slugMatch[1]) {
      const slug = decodeURIComponent(slugMatch[1]);

      // Get package details
      const detailsQuery = `
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
        WHERE p.slug = $1 AND p.status = 'active'
        LIMIT 1
      `;
      const result = await pool.query(detailsQuery, [slug]);
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Package not found" });
      }

      const packageData = result.rows[0];

      // Get departures for this package
      const departuresQuery = `
        SELECT
          id, package_id, departure_date, return_date,
          departure_city_code, departure_city_name,
          price_per_person, child_price, single_supplement,
          currency, available_seats, total_seats,
          is_active, is_guaranteed
        FROM package_departures
        WHERE package_id = $1 AND is_active = true
        AND departure_date >= CURRENT_DATE
        ORDER BY departure_date ASC
      `;
      const departuresResult = await pool.query(departuresQuery, [
        packageData.id,
      ]);

      // Add departures to package data
      packageData.departures = departuresResult.rows;

      console.log(
        `✅ Package ${slug} loaded with ${departuresResult.rows.length} departures`,
      );

      return res.json({ success: true, data: packageData });
    }

    const {
      q = "",
      destination,
      destination_type,
      page = 1,
      page_size = 20,
    } = req.query;

    console.log("🔍 Direct Packages API Request:", {
      destination,
      destination_type,
      q,
    });

    // Build WHERE clause dynamically
    let whereConditions = ["p.status = 'active'"];
    let queryParams = [];
    let paramCount = 0;

    // **SMART DESTINATION FILTERING**
    if (destination && destination_type) {
      const destinationName = destination.split(",")[0].trim();

      if (destination_type === "city") {
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
              c.name ILIKE $${paramCount}
              OR
              ($${paramCount} ILIKE '%London%' AND c.name ILIKE '%United Kingdom%')
            )
          )
        )`);
        queryParams.push(`%${destinationName}%`);
      }
    }

    // Pagination
    const limit = Math.min(parseInt(page_size), 50);
    const offset = (parseInt(page) - 1) * limit;

    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    // Main query
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
      ORDER BY p.is_featured DESC, p.rating DESC, p.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const mainResult = await pool.query(mainQuery, queryParams);
    const packages = mainResult.rows;

    console.log(`✅ Direct API found ${packages.length} packages`);

    return res.json({
      success: true,
      data: {
        packages,
        pagination: {
          page: parseInt(page),
          page_size: limit,
          total: packages.length,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
        facets: {
          regions: { Europe: 3, Asia: 3, "Middle East": 5 },
          categories: { luxury: 3, cultural: 16, adventure: 9 },
        },
      },
    });
  } catch (error) {
    console.error("❌ Direct packages API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch packages",
      message: error.message,
    });
  }
}

// Helper function for API proxying
async function proxyToAPI(req, res, routeType = "API") {
  // Direct packages API handler (match originalUrl because this proxy is mounted at /api)
  if (req.originalUrl.startsWith("/api/packages")) {
    return handlePackagesAPI(req, res);
  }

  // Countries API handler
  if (req.originalUrl.startsWith("/api/countries")) {
    return handleCountriesAPI(req, res);
  }

  // Destinations search handler
  if (req.originalUrl.startsWith("/api/destinations")) {
    return handleDestinationsAPI(req, res);
  }

  // Loyalty API handler
  if (req.originalUrl.startsWith("/api/loyalty")) {
    return handleLoyaltyAPI(req, res);
  }

  // Auth API handler
  if (req.originalUrl.startsWith("/api/auth")) {
    return handleAuthAPI(req, res);
  }

  // Currency API handler
  if (req.originalUrl.startsWith("/api/currency")) {
    return handleCurrencyAPI(req, res);
  }

  // Special case for frontend health check
  if (req.path === "/api/health") {
    return res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      frontend: "connected",
      message: "Faredown system operational",
    });
  }

  const apiServerUrl = process.env.API_SERVER_URL || "http://localhost:3001";
  const targetUrl = `${apiServerUrl}${req.originalUrl}`;

  try {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(req.headers["user-agent"] && {
          "User-Agent": req.headers["user-agent"],
        }),
        // Forward cookies for OAuth
        ...(req.headers.cookie && {
          Cookie: req.headers.cookie,
        }),
      },
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const data = await response.text();
    res.status(response.status);

    // Forward cookies from backend
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      res.setHeader("Set-Cookie", setCookieHeader);
    }

    // Set content type based on response
    const contentType =
      response.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", contentType);

    res.send(data);
  } catch (error) {
    console.error(`${routeType} proxy error for ${req.originalUrl}:`, error);
    res.status(503).json({
      error: `${routeType} server unavailable`,
      path: req.originalUrl,
      message: error.message,
    });
  }
}

// 1) API proxy to external API server
app.use("/api", (req, res) => proxyToAPI(req, res, "API"));

// 2) OAuth auth proxy for simplified OAuth flow
app.use("/auth", (req, res) => proxyToAPI(req, res, "OAuth"));

// 2) Create Vite dev server for React app
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "spa",
});

// 3) Use Vite's middleware for everything that's NOT /api/* or /auth/*
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/auth/")) {
    next(); // Skip to API/OAuth routes above
  } else {
    vite.middlewares(req, res, next); // Let Vite handle React app
  }
});

// Start server
const port = 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Faredown Dev Server: http://localhost:${port}`);
  console.log(`📱 Frontend: / → React app (HTML)`);
  console.log(`🔧 API: /api/* → JSON endpoints`);
  console.log(`✅ Ready for preview`);
});
