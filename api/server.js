/**
 * Faredown Node.js API Server
 * Backend API connecting frontend to admin panel
 * Handles all booking, user management, and admin operations
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// Import route modules
const authRoutes = require("./routes/auth");
const oauthRoutes = require("./routes/oauth-simple");
const oauthStatusRoutes = require("./routes/oauth-status");
const adminRoutes = require("./routes/admin");
const adminDashboardRoutes = require("./routes/admin-dashboard");
const bookingRoutes = require("./routes/bookings");
const userRoutes = require("./routes/users");
const flightRoutes = require("./routes/flights");
const hotelRoutes = require("./routes/hotels");
const hotelsLiveRoutes = require("./routes/hotels-live");
const bargainRoutes = require("./routes/bargain");
const bargainV1Routes = require("./routes/bargain-final");
const currencyRoutes = require("./routes/currency");
const countriesRoutes = require("./routes/countries");
const promoRoutes = require("./routes/promo");
const analyticsRoutes = require("./routes/analytics");
const dbTestRoutes = require("./routes/db-test");
const paymentRoutes = require("./routes/payments");
const cmsRoutes = require("./routes/cms");
const testLiveRoutes = require("./routes/test-live");
const testHotelbedsRoutes = require("./routes/test-hotelbeds");
const testLiveHotelRoutes = require("./routes/test-live-hotel");
const sightseeingRoutes = require("./routes/sightseeing");
const transfersRoutes = require("./routes/transfers");
const transfersBargainRoutes = require("./routes/transfers-bargain");
const packagesRoutes = require("./routes/packages");
const destinationsRoutes = require("./routes/destinations-v2");
const enhancedBargainRoutes = require("./routes/enhanced-bargain-engine");
const featureFlagsRoutes = require("./routes/feature-flags");

// New admin module routes
const usersAdminRoutes = require("./routes/users");
const markupRoutes = require("./routes/markup");
const markupsUnifiedRoutes = require("./routes/markups-unified");
const adminPackagesRoutes = require("./routes/admin-packages");
const vatRoutes = require("./routes/vat");
const currencyAdminRoutes = require("./routes/currency");
const reportsRoutes = require("./routes/reports");
const suppliersRoutes = require("./routes/suppliers");
const voucherRoutes = require("./routes/vouchers");
const profileRoutes = require("./routes/profile");
const adminBookingsRoutes = require("./routes/admin-bookings");
const adminSightseeingRoutes = require("./routes/admin-sightseeing");
const sightseeingSearchRoutes = require("./routes/sightseeing-search");
const adminAiRoutes = require("./routes/admin-ai");
const adminAirportsRoutes = require("./routes/admin-airports");
const aiBargainRoutes = require("./routes/ai-bargains");
const transfersMarkupRoutes = require("./routes/admin-transfers-markup");
const adminProfilesRoutes = require("./routes/admin-profiles");
const pricingRoutesLegacy = require("./routes/pricing");
const reviewsRoutes = require("./routes/reviews");
const recentSearchesRoutes = require("./routes/recent-searches");
const healthCheckRoutes = require("./routes/health-check");
const adminReportsRoutes = require("./routes/admin-reports");
const adminExtranetRoutes = require("./routes/admin-extranet");
const adminMarkupPackagesRoutes = require("./routes/admin-markup-packages");
const adminPromoRoutes = require("./routes/admin-promo");
const pricingEngineRoutes = require("./routes/pricing-engine");
const adminUsersVerifyRoutes = require("./routes/admin-users-verify");

// Middleware
const { authenticateToken, requireAdmin } = require("./middleware/auth");
const { validateRequest } = require("./middleware/validation");
const { auditLogger } = require("./middleware/audit");

// DB
const db = require("./database/connection");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// Behind Render/Netlify proxy so cookies/secure headers behave correctly
app.set("trust proxy", 1);

// Security headers (Builder.io + Google OAuth compatible)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://accounts.google.com",
          "https://ssl.gstatic.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://ssl.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:", "https://ssl.gstatic.com", "https://www.gstatic.com"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://accounts.google.com",
          "https://apis.google.com",
          "https://ssl.gstatic.com",
          "https://www.gstatic.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.exchangerate-api.com",
          "https://accounts.google.com",
          "https://oauth2.googleapis.com",
          "https://www.googleapis.com",
        ],
        frameSrc: ["'self'", "https://accounts.google.com", "https://content.googleapis.com"],
        frameAncestors: ["'self'", "https://builder.io", "https://*.builder.io"],
      },
    },
    frameguard: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many requests from this IP", retryAfter: "15 minutes" },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many authentication attempts", retryAfter: "15 minutes" },
});

// Core middleware
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS — allow your UI origins + Builder preview
const envAllowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const staticAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "https://builder.io",
  "https://cdn.builder.io",
];

const corsMatchers = [
  ...envAllowedOrigins,
  ...staticAllowedOrigins,
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https:\/\/([a-z0-9-]+\.)*builder\.io$/i,
  /^https:\/\/(?:[a-z0-9-]+\.)*projects\.builder\.my$/i,
  /^https:\/\/(?:[a-z0-9-]+\.)*projects\.builder\.codes$/i,
  /^https:\/\/.*\.projects\.builder\.(my|codes)$/i,
  /^https:\/\/([a-z0-9-]+\.)*fly\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*netlify\.app$/i,
  /^https:\/\/builder-faredown-pricing\.onrender\.com$/i,
  /^https:\/\/faredown\.com$/i,
];

const isOriginAllowed = origin => {
  if (!origin) return true;
  return corsMatchers.some(matcher =>
    typeof matcher === "string" ? matcher === origin : matcher.test(origin)
  );
};

const baseCorsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "content-type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 600,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

const corsOptionsDelegate = (req, callback) => {
  const origin = req.headers.origin;
  const allowed = isOriginAllowed(origin);

  console.log("CORS check", {
    method: req.method,
    path: req.originalUrl,
    origin: origin || "<none>",
    allowed,
  });

  if (!origin) {
    return callback(null, { ...baseCorsOptions, origin: false });
  }

  if (allowed) {
    return callback(null, { ...baseCorsOptions, origin });
  }

  console.warn("🚫 CORS blocked origin:", origin);
  return callback(null, { ...baseCorsOptions, origin: false });
};

const ensureCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, content-type, Authorization, X-Requested-With"
    );
    const varyHeader = res.getHeader("Vary");
    res.setHeader("Vary", varyHeader ? `${varyHeader}, Origin` : "Origin");
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
};

app.use(ensureCorsHeaders);
app.use(cors(corsOptionsDelegate));
app.options("*", cors(corsOptionsDelegate));

app.use(limiter);

// Health check (platform-level)
app.get("/health", async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    res.json({
      status: dbHealth.healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      services: {
        database: dbHealth.healthy ? "connected" : "offline",
        cache: "connected",
        external_apis: "operational",
      },
      database: dbHealth,
    });
  } catch (error) {
    res.json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      services: { database: "offline", cache: "connected", external_apis: "operational" },
      error: error.message,
    });
  }
});

// API info root
app.get("/", (req, res) => {
  res.json({
    name: "Faredown API",
    version: "1.0.0",
    description: "Node.js API for Faredown travel booking platform",
    endpoints: {
      auth: "/api/auth",
      oauth: "/api/oauth",
      oauthGoogleUrl: "/api/oauth/google/url",
      admin: "/api/admin",
      bookings: "/api/bookings",
      users: "/api/users",
      flights: "/api/flights",
      hotels: "/api/hotels",
      sightseeing: "/api/sightseeing",
      transfers: "/api/transfers",
      packages: "/api/packages",
      pricing: "/api/pricing",
      healthCheck: "/api/health-check",
    },
    documentation: "/api/docs",
    health: "/health",
  });
});

// --- Auth/OAuth mounts ---
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/oauth", oauthStatusRoutes);

// 🔁 SHIMS so older frontends keep working
// 307 redirect preserves method & signals clearly in DevTools
app.get(["/api/auth/google/url", "/auth/google/url"], (req, res) => {
  res.redirect(307, "/api/oauth/google/url");
});

// Other product routes
app.use("/api/admin", authenticateToken, requireAdmin, auditLogger, adminRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/bookings", authenticateToken, bookingRoutes);
app.use("/api/users", authenticateToken, usersAdminRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/hotels-live", hotelsLiveRoutes);
app.use("/api/bargain", bargainRoutes);
app.use("/api/bargain/v1", bargainV1Routes);
app.use("/api/ai-bargains", aiBargainRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/countries", countriesRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/feature-flags", featureFlagsRoutes);
app.use("/api/recent-searches", recentSearchesRoutes);
app.use("/api/health-check", healthCheckRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payments", authenticateToken, paymentRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/test-live", testLiveRoutes);
app.use("/api/test-hotelbeds", testHotelbedsRoutes);
app.use("/api/test-live-hotel", testLiveHotelRoutes);
app.use("/api/sightseeing", sightseeingRoutes);
app.use("/api/sightseeing-search", sightseeingSearchRoutes);
app.use("/api/transfers", transfersRoutes);
app.use("/api/transfers-bargain", transfersBargainRoutes);
app.use("/api/packages", packagesRoutes);
app.use("/api/destinations", destinationsRoutes);
app.use("/api/enhanced-bargain", enhancedBargainRoutes);

// Admin modules
app.use("/api/markups", authenticateToken, markupsUnifiedRoutes);
app.use("/api/markup", authenticateToken, markupRoutes);
app.use("/api/vat", authenticateToken, vatRoutes);
app.use("/api/reports", authenticateToken, reportsRoutes);
app.use("/api/suppliers", authenticateToken, suppliersRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/profile", profileRoutes);
app.use(reviewsRoutes);
app.use("/api/admin/bookings", adminBookingsRoutes);
app.use("/api/admin/ai", adminAiRoutes);
app.use("/api/admin/airports", adminAirportsRoutes);
app.use("/api/db-test", dbTestRoutes);
app.use("/api/admin/sightseeing", authenticateToken, requireAdmin, auditLogger, adminSightseeingRoutes);
app.use("/api/admin/packages", authenticateToken, requireAdmin, auditLogger, adminPackagesRoutes);
app.use("/api/admin/transfers-markup", authenticateToken, requireAdmin, auditLogger, transfersMarkupRoutes);
app.use("/api/admin/reports", authenticateToken, requireAdmin, auditLogger, adminReportsRoutes);
app.use("/api/admin/profiles", authenticateToken, requireAdmin, auditLogger, adminProfilesRoutes);
app.use("/api/admin/extranet", authenticateToken, requireAdmin, auditLogger, adminExtranetRoutes);
app.use("/api/admin/markup/packages", authenticateToken, requireAdmin, auditLogger, adminMarkupPackagesRoutes);
app.use("/api/admin/promo", authenticateToken, requireAdmin, auditLogger, adminPromoRoutes);
// Public endpoint for evidence collection
app.use("/api/admin/users", adminUsersVerifyRoutes);

// Pricing routes (legacy create function support)
try {
  const createPricingRoutes = pricingRoutesLegacy;
  if (typeof createPricingRoutes === "function") {
    const pricingRoutes = createPricingRoutes(db.pool);
    app.use("/api/pricing", pricingRoutes);
    console.log("✅ Pricing routes mounted");
  }
} catch (error) {
  console.error("❌ Failed to mount pricing routes:", error.message);
  console.log("💡 Ensure ./routes/pricing.js exports a function");
}

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token", message: "Authentication token is invalid" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired", message: "Authentication token has expired" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validation failed", message: err.message, details: err.details });
  }

  res.status(err.status || 500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/oauth/google/url",
      "/api/pricing/quote",
      "/api/pricing/test-quote",
      "/api/pricing/markup-rules",
      "/api/pricing/promo-codes",
      "/api/health",
      "/health",
    ],
  });
});

// Graceful shutdown
let server;
process.on("SIGTERM", () => { if (server) server.close(() => console.log("Process terminated")); });
process.on("SIGINT", () => { if (server) server.close(() => console.log("Process terminated")); });

// Init DB then start
async function startServer() {
  try {
    console.log("🔌 Initializing database connection...");
    await db.initialize();
    await db.initializeSchema();

    const { initializeBargainHolds } = require("./routes/bargain-holds");
    if (initializeBargainHolds && db.pool) {
      try { initializeBargainHolds(db.pool); }
      catch (e) { console.warn("⚠️ Failed to initialize Bargain Holds with DB pool:", e.message); }
    }
    console.log("✅ Database connected and schema ready");

    server = app.listen(PORT, () => {
      console.log("\n🚀 Faredown API Server Started");
      console.log("================================");
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("================================\n");
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    server = app.listen(PORT, () => {
      console.log("\n🚀 Fallback Mode: DB offline");
      console.log("================================");
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log("================================\n");
    });
    return server;
  }
}
startServer();

module.exports = app;
