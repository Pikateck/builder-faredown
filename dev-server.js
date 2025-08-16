import { createServer } from "vite";
import express from "express";
import cors from "cors";
import path from "path";

// Create Express app
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// 1) Import and use the actual API routes directly
try {
  const hotelsLiveRoutes = require('./api/routes/hotels-live');
  const hotelRoutes = require('./api/routes/hotels');
  const bargainRoutes = require('./api/routes/bargain');
  const pricingRoutes = require('./api/routes/pricing');

  console.log("✅ Loading API routes directly into dev server...");

  // Basic health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      frontend: "connected",
      message: "Faredown system operational",
    });
  });

  // Mount API routes
  app.use("/api/hotels-live", hotelsLiveRoutes);
  app.use("/api/hotels", hotelRoutes);
  app.use("/api/bargain", bargainRoutes);
  app.use("/api/pricing", pricingRoutes);

  console.log("✅ API routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading API routes:", error);

  // Fallback API routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      frontend: "connected",
      message: "Faredown system operational (fallback mode)",
    });
  });

  app.use("/api/*", (req, res) => {
    res.status(503).json({
      error: "API routes unavailable",
      path: req.path,
      message: "API server could not be loaded"
    });
  });
}

// 2) Create Vite dev server for React app
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "spa",
});

// 3) Use Vite's middleware for everything that's NOT /api/*
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    next(); // Skip to API routes above
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
