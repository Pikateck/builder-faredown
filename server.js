import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// API proxy to external API server
app.use("/api", async (req, res) => {
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
      },
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const data = await response.text();
    res.status(response.status);

    const contentType =
      response.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", contentType);
    res.send(data);
  } catch (error) {
    console.error(`API proxy error for ${req.originalUrl}:`, error);
    res.status(503).json({
      error: "API server unavailable",
      path: req.originalUrl,
      message: error.message,
    });
  }
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, "dist/spa")));

// Handle React Router (SPA) - serve index.html for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/spa", "index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Faredown Production Server: http://localhost:${port}`);
  console.log(`📱 Frontend: Static files from dist/spa`);
  console.log(`🔧 API: /api/* → Proxy to external API`);
  console.log(`✅ Production ready`);
});
