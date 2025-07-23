/**
 * Faredown Node.js API Server
 * Backend API connecting frontend to admin panel
 * Handles all booking, user management, and admin operations
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Import route modules
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const bookingRoutes = require("./routes/bookings");
const userRoutes = require("./routes/users");
const flightRoutes = require("./routes/flights");
const hotelRoutes = require("./routes/hotels");
const bargainRoutes = require("./routes/bargain");
const currencyRoutes = require("./routes/currency");
const promoRoutes = require("./routes/promo");
const analyticsRoutes = require("./routes/analytics");
const paymentRoutes = require("./routes/payments");
const cmsRoutes = require("./routes/cms");

// New admin module routes
const usersAdminRoutes = require("./routes/users");
const markupRoutes = require("./routes/markup");
const vatRoutes = require("./routes/vat");
const currencyAdminRoutes = require("./routes/currency");
const reportsRoutes = require("./routes/reports");
const suppliersRoutes = require("./routes/suppliers");

// Import middleware
const { authenticateToken, requireAdmin } = require("./middleware/auth");
const { validateRequest } = require("./middleware/validation");
const { auditLogger } = require("./middleware/audit");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.exchangerate-api.com"],
      },
    },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP",
    retryAfter: "15 minutes",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: "Too many authentication attempts",
    retryAfter: "15 minutes",
  },
});

// Middleware setup
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://faredown.com",
    "https://www.faredown.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.use(limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    services: {
      database: "connected",
      cache: "connected",
      external_apis: "operational",
    },
  });
});

// API information endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Faredown API",
    version: "1.0.0",
    description: "Node.js API for Faredown travel booking platform",
    endpoints: {
      auth: "/api/auth",
      admin: "/api/admin",
      bookings: "/api/bookings",
      users: "/api/users",
      flights: "/api/flights",
      hotels: "/api/hotels",
      bargain: "/api/bargain",
      currency: "/api/currency",
      promo: "/api/promo",
      analytics: "/api/analytics",
      payments: "/api/payments",
      cms: "/api/cms",
      markup: "/api/markup",
      vat: "/api/vat",
      reports: "/api/reports",
      suppliers: "/api/suppliers",
    },
    documentation: "/api/docs",
    health: "/health",
  });
});

// Apply auth limiter to auth routes
app.use("/api/auth", authLimiter);

// Route handlers
app.use("/api/auth", authRoutes);
app.use(
  "/api/admin",
  authenticateToken,
  requireAdmin,
  auditLogger,
  adminRoutes,
);
app.use("/api/bookings", authenticateToken, bookingRoutes);
app.use("/api/users", authenticateToken, usersAdminRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/bargain", bargainRoutes);
app.use("/api/currency", currencyAdminRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/analytics", authenticateToken, analyticsRoutes);
app.use("/api/payments", authenticateToken, paymentRoutes);
app.use("/api/cms", cmsRoutes);

// New admin module routes
app.use("/api/markup", authenticateToken, markupRoutes);
app.use("/api/vat", authenticateToken, vatRoutes);
app.use("/api/reports", authenticateToken, reportsRoutes);
app.use("/api/suppliers", authenticateToken, suppliersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // JWT errors
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

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      message: err.message,
      details: err.details,
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/auth",
      "/api/admin",
      "/api/bookings",
      "/api/users",
      "/api/flights",
      "/api/hotels",
      "/api/bargain",
      "/api/currency",
      "/api/promo",
      "/api/analytics",
      "/api/payments",
      "/api/cms",
    ],
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log("\n🚀 Faredown API Server Started");
  console.log("================================");
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
  console.log("================================\n");
});

module.exports = app;
