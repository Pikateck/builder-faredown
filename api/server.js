/**
 * Faredown Node.js API Server
 * Backend API connecting frontend to admin panel
 * Handles all booking, user management, and admin operations
 */

require("dotenv").config();

const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const express = require("express");

// Import route modules (keeping CommonJS requires for now due to mixed codebase)
const authRoutes = require("./routes/auth.js");
const oauthRoutes = require("./routes/oauth-simple.js");
const oauthStatusRoutes = require("./routes/oauth-status.js");
const adminRoutes = require("./routes/admin.js");
const adminDashboardRoutes = require("./routes/admin-dashboard.js");
const bookingRoutes = require("./routes/bookings.js");
const userRoutes = require("./routes/users.js");
const flightRoutes = require("./routes/flights.js");
const hotelRoutes = require("./routes/hotels.js");
const hotelsLiveRoutes = require("./routes/hotels-live.js");
const hotelCanonicalRoutes = require("./routes/hotels-canonical.js"); // STEP 2: Canonical endpoints
const bargainRoutes = require("./routes/bargain.js");
const bargainV1Routes = require("./routes/bargain-final.js");
const currencyRoutes = require("./routes/currency.js");
const countriesRoutes = require("./routes/countries.js");
const promoRoutes = require("./routes/promo.js");
const metaNationalitiesRoutes = require("./routes/meta-nationalities.js");
const analyticsRoutes = require("./routes/analytics.js");
const dbTestRoutes = require("./routes/db-test.js");
const paymentRoutes = require("./routes/payments.js");
const cmsRoutes = require("./routes/cms.js");
const testLiveRoutes = require("./routes/test-live.js");
const testHotelbedsRoutes = require("./routes/test-hotelbeds.js");
const testLiveHotelRoutes = require("./routes/test-live-hotel.js");
const sightseeingRoutes = require("./routes/sightseeing.js");
const transfersRoutes = require("./routes/transfers.js");
const transfersBargainRoutes = require("./routes/transfers-bargain.js");
const packagesRoutes = require("./routes/packages.js");
const destinationsRoutes = require("./routes/destinations-v2.js");
const enhancedBargainRoutes = require("./routes/enhanced-bargain-engine.js");
const featureFlagsRoutes = require("./routes/feature-flags.js");

// New admin module routes
const usersAdminRoutes = require("./routes/users.js");
const markupRoutes = require("./routes/markup.js");
const markupsUnifiedRoutes = require("./routes/markups-unified.js");
const adminPackagesRoutes = require("./routes/admin-packages.js");
const vatRoutes = require("./routes/vat.js");
const currencyAdminRoutes = require("./routes/currency.js");
const reportsRoutes = require("./routes/reports.js");
const suppliersRoutes = require("./routes/suppliers.js");
const voucherRoutes = require("./routes/vouchers.js");
const profileRoutes = require("./routes/profile.js");
const adminBookingsRoutes = require("./routes/admin-bookings.js");
const adminSightseeingRoutes = require("./routes/admin-sightseeing.js");
const sightseeingSearchRoutes = require("./routes/sightseeing-search.js");
const adminAiRoutes = require("./routes/admin-ai.js");
const adminAirportsRoutes = require("./routes/admin-airports.js");
const aiBargainRoutes = require("./routes/ai-bargains.js");
const transfersMarkupRoutes = require("./routes/admin-transfers-markup.js");
const adminProfilesRoutes = require("./routes/admin-profiles.js");
const pricingRoutesLegacy = require("./routes/pricing.js");
const reviewsRoutes = require("./routes/reviews.js");
const recentSearchesRoutes = require("./routes/recent-searches.js");
const healthCheckRoutes = require("./routes/health-check.js");
const adminReportsRoutes = require("./routes/admin-reports.js");
const adminExtranetRoutes = require("./routes/admin-extranet.js");
const adminMarkupPackagesRoutes = require("./routes/admin-markup-packages.js");
const adminPromoRoutes = require("./routes/admin-promo.js");
const pricingEngineRoutes = require("./routes/pricing-engine.js");
const adminUsersVerifyRoutes = require("./routes/admin-users-verify.js");
const adminUsersPublic = require("./routes/admin-users-public.js");
const simpleTestRoutes = require("./routes/simple-test.js");
const hotelsSearchRoutes = require("./routes/hotels-search.js");
const hotelsBookingRoutes = require("./routes/hotels-booking.js");
const adminSystemStatusRoutes = require("./routes/admin-system-status.js");
const adminSystemMonitorHistoryRoutes = require("./routes/admin-system-monitor-history.js");
const adminSuppliersRoutes = require("./routes/admin-suppliers.js");
const hotelsMultiSupplierRoutes = require("./routes/hotels-multi-supplier.js");
const locationsRoutes = require("./routes/locations.js");
const adminTboRoutes = require("./routes/admin-tbo.js");
const tboDebugRoutes = require("./tbo/tbo-debug.js");
const adminApiLogsRoutes = require("./routes/admin-api-logs.js");
const adminHotelsRoutes = require("./routes/admin-hotels.js");

// TBO Production Routes (Complete Hotel Booking Pipeline)
const tboAuthRoutes = require("./routes/tbo/auth.js");
const tboStaticRoutes = require("./routes/tbo/static.js");
const tboSearchRoutes = require("./routes/tbo/search.js");
const tboRoomRoutes = require("./routes/tbo/room.js");
const tboBlockRoutes = require("./routes/tbo/block.js");
const tboBookRoutes = require("./routes/tbo/book.js");
const tboVoucherRoutes = require("./routes/tbo/voucher.js");
const tboBalanceRoutes = require("./routes/tbo/balance.js");
const tboBookingsRoutes = require("./routes/tbo/bookings.js");

const rewardsRoutes = require("./routes/rewards.js");
const v1BookingsRoutes = require("./routes/v1-bookings.js");
const adminBargainRoutes = require("./routes/admin-bargain.js");

// Middleware
const { authenticateToken, requireAdmin } = require("./middleware/auth.js");
const adminKeyMiddleware = require("./middleware/adminKey.js");
const { validateRequest } = require("./middleware/validation.js");
const { auditLogger } = require("./middleware/audit.cjs");

// DB
const db = require("./database/connection.js");
const {
  initializeRetentionSchedule,
} = require("./services/systemMonitorService.js");

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
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://ssl.gstatic.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "http:",
          "https://ssl.gstatic.com",
          "https://www.gstatic.com",
        ],
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
        frameSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://content.googleapis.com",
        ],
        frameAncestors: [
          "'self'",
          "https://builder.io",
          "https://*.builder.io",
        ],
      },
    },
    frameguard: false,
    // CRITICAL FIX: Disable CORP to allow cross-origin API requests
    crossOriginResourcePolicy: false,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    error: "Too many requests from this IP",
    retryAfter: "15 minutes",
  },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many authentication attempts",
    retryAfter: "15 minutes",
  },
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
  .map((origin) => origin.trim())
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

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return corsMatchers.some((matcher) =>
    typeof matcher === "string" ? matcher === origin : matcher.test(origin),
  );
};

const ACCESS_CONTROL_ALLOW_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const ACCESS_CONTROL_FALLBACK_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Admin-Key",
  "X-Requested-With",
  "Accept",
  "Origin",
].join(", ");

const baseCorsOptions = {
  credentials: true,
  methods: ACCESS_CONTROL_ALLOW_METHODS.split(","),
  allowedHeaders: ACCESS_CONTROL_FALLBACK_HEADERS.split(/,\s*/),
  exposedHeaders: ["Set-Cookie", "X-Request-ID"],
  maxAge: 86400,
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

  console.warn("��️ CORS fallback allowing unlisted origin:", origin);
  return callback(null, { ...baseCorsOptions, origin, credentials: false });
};

const ensureCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin || "*";
  const allowed = isOriginAllowed(req.headers.origin);
  const requestedHeaders = req.headers["access-control-request-headers"];

  if (origin === "*") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "false");
  } else if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "false");
  }

  res.setHeader("Access-Control-Allow-Methods", ACCESS_CONTROL_ALLOW_METHODS);
  res.setHeader(
    "Access-Control-Allow-Headers",
    requestedHeaders || ACCESS_CONTROL_FALLBACK_HEADERS,
  );
  res.setHeader("Access-Control-Expose-Headers", "Set-Cookie, X-Request-ID");
  res.setHeader("Access-Control-Max-Age", "86400");

  const varyHeader = res.getHeader("Vary");
  const varyValue = varyHeader ? `${varyHeader}, Origin` : "Origin";
  res.setHeader("Vary", varyValue);

  if (requestedHeaders) {
    res.setHeader("Vary", `${varyValue}, Access-Control-Request-Headers`);
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

// Health check (Render expects /api/health)
app.get("/api/health", async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    res.json({
      status: dbHealth.healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      service: "faredown-backend",
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
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      service: "faredown-backend",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      services: {
        database: "offline",
        cache: "connected",
        external_apis: "operational",
      },
      error: error.message,
    });
  }
});

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
      services: {
        database: "offline",
        cache: "connected",
        external_apis: "operational",
      },
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

// 🔙 SHIMS so older frontends keep working
// 307 redirect preserves method & signals clearly in DevTools
app.get(["/api/auth/google/url", "/auth/google/url"], (req, res) => {
  res.redirect(307, "/api/oauth/google/url");
});

// Other product routes
app.use(
  "/api/admin/system-status",
  adminKeyMiddleware,
  adminSystemStatusRoutes,
);
app.use(
  "/api/admin/system-monitor/history",
  adminKeyMiddleware,
  adminSystemMonitorHistoryRoutes,
);
app.use("/api/admin/users", adminKeyMiddleware, adminUsersPublic);
app.use(
  "/api/admin",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminRoutes,
);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/bookings", authenticateToken, bookingRoutes);
app.use("/api/users", authenticateToken, usersAdminRoutes);
// SIMPLE TEST ROUTE FOR DEBUGGING
app.use("/api/simple-test", simpleTestRoutes);

app.use("/api/flights", flightRoutes);
app.use("/api/hotels-multi", hotelsMultiSupplierRoutes); // Multi-supplier (Hotelbeds + RateHawk)
app.use("/api/hotels-legacy", hotelRoutes); // Legacy Hotelbeds-only route
app.use("/api/hotels-live", hotelsLiveRoutes);
app.use("/api/hotels-ranked", require("./routes/hotels-ranked"));
app.use("/api/tbo-hotels", require("./routes/tbo-hotels"));
app.use("/api/tbo-hotels/static", require("./routes/tbo-hotels-static"));
app.use("/api/tbo", require("./routes/tbo-diagnostics")); // TBO diagnostics endpoint

// TBO Production API - Complete Booking Pipeline
app.use("/api/tbo/auth", tboAuthRoutes);
app.use("/api/tbo/static", tboStaticRoutes);
app.use("/api/tbo/search", tboSearchRoutes);
app.use("/api/tbo/room", tboRoomRoutes);
app.use("/api/tbo/block", tboBlockRoutes);
app.use("/api/tbo/book", tboBookRoutes);
app.use("/api/tbo/voucher", tboVoucherRoutes);
app.use("/api/tbo/balance", tboBalanceRoutes);
app.use("/api/tbo/bookings", tboBookingsRoutes);

app.use("/api/hotels/search", hotelsSearchRoutes); // Cache-backed hotel search (PRIORITY)
app.use("/api/hotels", hotelsBookingRoutes); // Phase 2: Booking chain (prebook, block, book) - PRIORITY
app.use("/api/hotels", hotelCanonicalRoutes); // STEP 2: Canonical hotel endpoints
app.use("/api/hotels-metadata", require("./routes/hotels-metadata")); // Legacy: Hybrid metadata + async pricing (TBO first) - DEPRECATED
app.use("/api/locations", locationsRoutes); // TBO locations autocomplete
app.use("/api/bargain", bargainRoutes); // New module-specific bargain engine
app.use("/api/bargain/v1", bargainV1Routes);
app.use(
  "/api/admin/bargain",
  authenticateToken,
  requireAdmin,
  adminBargainRoutes,
); // Admin bargain settings
app.use("/api/ai-bargains", aiBargainRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/countries", countriesRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/meta", metaNationalitiesRoutes); // Nationalities metadata
app.use("/api/feature-flags", featureFlagsRoutes);
app.use("/api/recent-searches", recentSearchesRoutes);
app.use("/api/loyalty", require("./routes/loyalty"));
app.use("/api/rewards", authenticateToken, rewardsRoutes);
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

// P0 V1 API - Complete Postgres Integration
app.use("/api/v1/bookings", v1BookingsRoutes);

// V1 Admin API - Booking Management
const v1AdminBookingsRoutes = require("./routes/v1-admin-bookings.js");
app.use(
  "/api/v1/admin/bookings",
  authenticateToken,
  requireAdmin,
  auditLogger,
  v1AdminBookingsRoutes,
);

// FX + Pricing utilities
app.use("/api/fx", require("./routes/fx"));
app.use("/api/pricing", require("./routes/pricing-preview"));

// Admin modules
app.use("/api/markups", authenticateToken, markupsUnifiedRoutes);
app.use("/api/markup", authenticateToken, markupRoutes);
app.use("/api/vat", authenticateToken, vatRoutes);
app.use("/api/reports", authenticateToken, reportsRoutes);
// Unified suppliers master first
app.use("/api/suppliers", require("./routes/suppliers-master"));
// Legacy mock suppliers kept on separate path for backward compatibility
app.use("/api/suppliers-legacy", authenticateToken, suppliersRoutes);
app.use("/api/admin/markups", require("./routes/admin-module-markups"));
app.use(
  "/api/admin/suppliers",
  adminSuppliersRoutes, // New multi-supplier management
);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/profile", profileRoutes);
app.use(reviewsRoutes);
app.use("/api/admin/bookings", adminBookingsRoutes);
app.use("/api/admin/ai", adminAiRoutes);
app.use("/api/admin/airports", adminAirportsRoutes);
app.use("/api/admin/api-logs", adminKeyMiddleware, adminApiLogsRoutes);
app.use("/api/admin/hotels", adminKeyMiddleware, adminHotelsRoutes);
app.use("/api/db-test", dbTestRoutes);
app.use(
  "/api/admin/sightseeing",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminSightseeingRoutes,
);
app.use(
  "/api/admin/packages",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminPackagesRoutes,
);
app.use(
  "/api/admin/transfers-markup",
  authenticateToken,
  requireAdmin,
  auditLogger,
  transfersMarkupRoutes,
);
app.use(
  "/api/admin/reports",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminReportsRoutes,
);
app.use(
  "/api/admin/profiles",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminProfilesRoutes,
);
app.use(
  "/api/admin/extranet",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminExtranetRoutes,
);
app.use(
  "/api/admin/markup/packages",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminMarkupPackagesRoutes,
);
app.use(
  "/api/admin/promo",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminPromoRoutes,
);
app.use(
  "/api/admin/tbo",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminTboRoutes,
);
// TBO Debug Routes (public for testing)
app.use("/api/tbo/debug", tboDebugRoutes);
// Public endpoint for evidence collection (must be before /api/admin catch-all)
app.use("/api/verify-users", adminUsersVerifyRoutes);

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
    return res.status(401).json({
      error: "Invalid token",
      message: "Authentication token is invalid",
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
      message: "Authentication token has expired",
    });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      message: err.message,
      details: err.details,
    });
  }

  // ALWAYS log the full error for debugging, regardless of environment
  console.error("🔴 UNHANDLED ERROR:", {
    message: err.message,
    stack: err.stack,
    status: err.status,
    code: err.code,
    details: err.details,
    path: req.path,
    method: req.method,
    nodeEnv: process.env.NODE_ENV,
  });

  res.status(err.status || 500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
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
process.on("SIGTERM", () => {
  if (server) server.close(() => console.log("Process terminated"));
});
process.on("SIGINT", () => {
  if (server) server.close(() => console.log("Process terminated"));
});

// Init DB then start
async function startServer() {
  try {
    console.log("🔌 Initializing database connection...");
    await db.initialize();
    await db.initializeSchema();

    const { initializeBargainHolds } = require("./routes/bargain-holds");
    if (initializeBargainHolds && db.pool) {
      try {
        initializeBargainHolds(db.pool);
      } catch (e) {
        console.warn(
          "⚠️ Failed to initialize Bargain Holds with DB pool:",
          e.message,
        );
      }
    }
    console.log("✅ Database connected and schema ready");

    try {
      initializeRetentionSchedule();
    } catch (scheduleError) {
      console.warn(
        "⚠��� Failed to schedule system monitor retention",
        scheduleError.message,
      );
    }

    // Verify Fixie proxy configuration and detect outbound IP
    const fixieUrl =
      process.env.FIXIE_URL || process.env.HTTP_PROXY || "NOT SET";
    const verifyFixieIP = async () => {
      try {
        const { tboRequest } = require("./lib/tboRequest");
        console.log("\n🔍 Verifying Fixie Proxy Configuration...");
        console.log(
          `   FIXIE_URL: ${fixieUrl.includes("@") ? fixieUrl.substring(0, 20) + "***@***" : fixieUrl}`,
        );
        console.log(
          `   HTTP_PROXY: ${process.env.HTTP_PROXY ? "SET" : "NOT SET"}`,
        );
        console.log(
          `   HTTPS_PROXY: ${process.env.HTTPS_PROXY ? "SET" : "NOT SET"}`,
        );
        console.log(
          `   USE_SUPPLIER_PROXY: ${process.env.USE_SUPPLIER_PROXY === "true" ? "ENABLED" : "DISABLED"}`,
        );

        // Detect outbound IP
        try {
          const ipResponse = await tboRequest(
            "https://api.ipify.org?format=json",
            {
              method: "GET",
              timeout: 5000,
            },
          );
          const outboundIP = ipResponse.data.ip;
          console.log(`   🌐 Detected Outbound IP: ${outboundIP}`);

          // Check if IP matches expected Fixie IPs
          const expectedFixieIPs = ["52.5.155.132", "52.87.82.133"];
          if (expectedFixieIPs.includes(outboundIP)) {
            console.log(`   ✅ Outbound IP is whitelisted Fixie IP`);
          } else {
            console.log(
              `   ⚠️ Outbound IP (${outboundIP}) does not match expected Fixie IPs (52.5.155.132, 52.87.82.133)`,
            );
          }
        } catch (ipError) {
          console.warn(
            `   ⚠️ Could not detect outbound IP: ${ipError.message}`,
          );
        }
      } catch (e) {
        console.warn("⚠️ Fixie verification skipped:", e.message);
      }
    };

    server = app.listen(PORT, async () => {
      console.log("\n🚀 Faredown API Server Started");
      console.log("================================");
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🥊 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

      // Verify proxy setup
      await verifyFixieIP();

      console.log("================================\n");
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    server = app.listen(PORT, () => {
      console.log("\n🚀 Fallback Mode: DB offline");
      console.log("================================");
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🥊 Health Check: http://localhost:${PORT}/health`);
      console.log("================================\n");
    });
    return server;
  }
}
startServer();

module.exports = app;
