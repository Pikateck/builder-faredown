/**
 * Simple Pricing API Server
 * Focuses only on the new pricing and markup endpoints
 */

import express from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Import pricing components
import createPricingRoutes from "./routes/pricing.js";
import { priceEcho, createDiffEndpoint } from "./middleware/priceEcho.js";

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "pricing-api" });
  } catch (error) {
    res.status(503).json({ status: "error", message: error.message });
  }
});

// Create pricing routes
try {
  const pricingRoutes = createPricingRoutes();
  app.use("/api/pricing", pricingRoutes);
  console.log("✅ Pricing routes mounted successfully");
} catch (e) {
  console.warn("⚠️ Pricing routes not mounted:", e?.message);
}

// Price echo middleware for tracking
app.use(
  priceEcho({
    pool,
    stepHeader: "x-fd-step",
    journeyHeader: "x-fd-journey",
    currencyField: "totalFare",
    webhookUrl: process.env.PRICE_MISMATCH_WEBHOOK,
    enabled: process.env.PRICE_ECHO_ENABLED === "true",
  }),
);

// Packages routes
try {
  const packagesRoutes = (await import("./routes/packages.js")).default;
  app.use("/api/packages", packagesRoutes);
  console.log("✅ Packages routes mounted successfully");
} catch (e) {
  console.warn("⚠️ Packages routes not mounted:", e?.message);
}

// Unified markups routes (for Admin CMS)
try {
  const markupsRoutes = (await import("./routes/markups-unified.js")).default;
  app.use("/api/markups", markupsRoutes);
} catch (e) {
  console.warn("⚠️ Markups routes not mounted:", e?.message);
}

// Price diff endpoint
app.get("/api/pricing/diff", async (req, res) => {
  try {
    const diffEndpoint = await createDiffEndpoint(pool);
    await diffEndpoint(req, res);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get price diff",
      message: error.message,
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
});

// Graceful shutdown
let server;
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  }
});

// Start server
async function startServer() {
  try {
    server = app.listen(PORT, () => {
      console.log(`🚀 Pricing API Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
