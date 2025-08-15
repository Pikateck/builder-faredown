import { createServer } from "vite";
import express from "express";
import cors from "cors";
import path from "path";

// Create Express app
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// 1) API routes FIRST - only handle /api/*
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    frontend: "connected",
    message: "Faredown system operational",
  });
});

app.get("/api/pricing/test-quote", (req, res) => {
  res.json({
    success: true,
    message: "Pricing API working",
    data: {
      testQuote: {
        module: "air",
        basePrice: 5000,
        markupPrice: 5500,
        savings: 500,
      },
    },
  });
});

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
