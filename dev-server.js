import { createServer } from "vite";
import express from "express";
import cors from "cors";
import path from "path";

// Create Express app
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// 1) API routes FIRST - Proxy to actual API server
app.use("/api", async (req, res) => {
  const apiServerUrl = process.env.API_SERVER_URL || "http://localhost:3001";
  const targetUrl = `${apiServerUrl}${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.status(response.status);

    // Copy response headers
    for (const [key, value] of response.headers.entries()) {
      if (key !== 'content-encoding' && key !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    }

    res.send(data);
  } catch (error) {
    console.error(`API proxy error for ${req.path}:`, error);
    res.status(503).json({
      error: "API server unavailable",
      path: req.path,
      message: error.message
    });
  }
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
