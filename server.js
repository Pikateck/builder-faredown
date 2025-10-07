// server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Trust Render/Netlify proxies so secure cookies & IPs work
app.set("trust proxy", 1);

// Global middleware
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Builder.io iframe support & cookie hinting
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://builder.io https://*.builder.io"
  );
  res.setHeader("Set-Cookie", "preview=1; Path=/; SameSite=None; Secure");
  next();
});

// =====================
// API proxy middleware
// =====================
const API_BASE = process.env.API_SERVER_URL || "http://localhost:3001";

const proxyToApi = async (req, res) => {
  // Health for this static host (note: path under /api or /auth)
  if (req.path === "/health") {
    return res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      frontend: "connected",
      service: "faredown-pricing-proxy",
      version: "1.0.0",
    });
  }

  const targetUrl = `${API_BASE}${req.originalUrl}`;
  try {
    const headers = {
      "Content-Type": req.headers["content-type"] || "application/json",
      Accept: req.headers.accept || "application/json",
      ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
      ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      ...(req.headers["user-agent"] ? { "User-Agent": req.headers["user-agent"] } : {}),
      ...(req.headers.origin ? { Origin: req.headers.origin } : {}),
    };

    const hasBody = !["GET", "HEAD"].includes(req.method);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? (typeof req.body === "string" ? req.body : JSON.stringify(req.body)) : undefined,
      redirect: "manual",
    });

    // forward cookies + content type + status
    const setCookie = response.headers.raw()["set-cookie"];
    if (setCookie) res.set("Set-Cookie", setCookie);

    res.status(response.status);
    res.set("Content-Type", response.headers.get("content-type") || "application/json");
    const body = await response.text();
    res.send(body);
  } catch (err) {
    console.error(`API proxy error for ${req.originalUrl}:`, err.message);
    res.status(503).json({
      error: "API server unavailable",
      path: req.originalUrl,
      message: err.message,
    });
  }
};

// Mount proxy handlers (both API and OAuth routes)
app.use("/api", proxyToApi);
app.use("/auth", proxyToApi);

// =====================
// Static SPA hosting
// =====================
app.use(express.static(path.join(__dirname, "dist/spa")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/spa", "index.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Faredown Production Server: http://localhost:${PORT}`);
  console.log(`📦 Serving: dist/spa`);
  console.log(`🔀 Proxying to: ${API_BASE}`);
});
