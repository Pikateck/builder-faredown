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
const sslConfig = dbUrl && (dbUrl.includes("render.com") || dbUrl.includes("postgres://"))
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

// Direct packages endpoint handler
async function handlePackagesAPI(req, res) {
  try {
    const {
      q = "",
      destination,
      destination_type,
      page = 1,
      page_size = 20,
    } = req.query;

    console.log("🔍 Direct Packages API Request:", { destination, destination_type, q });

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
          regions: { "Europe": 3, "Asia": 3, "Middle East": 5 },
          categories: { "luxury": 3, "cultural": 16, "adventure": 9 }
        },
      },
    });
  } catch (error) {
    console.error("��� Direct packages API error:", error);
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
