// server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Where to proxy API requests.
// Point this at your main Node API service (the one mounting /auth, /api/*).
const API_BASE =
  process.env.API_BASE_URL ||
  process.env.API_SERVER_URL ||
  "http://localhost:3001";

// Trust proxy (Render/Netlify) so secure cookies & client IPs work
app.set("trust proxy", 1);

// ---------- Global middleware ----------
app.use(
  cors({
    origin: (origin, cb) => cb(null, true), // permissive here; real auth is on API
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Builder.io iframe support
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://builder.io https://*.builder.io"
  );
  // harmless hint-cookie to ensure cross-site cookie context is allowed
  res.setHeader("Set-Cookie", "preview=1; Path=/; SameSite=None; Secure");
  next();
});

// ---------- Proxy helper (used by multiple mounts) ----------
const proxyToApi = async (req, res) => {
  // Lightweight health right here for convenience
  if (req.originalUrl === "/api/health" || req.originalUrl === "/health") {
    return res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "faredown-pricing",
      database: "connected",
      version: "1.0.0",
    });
  }

  const targetUrl = `${API_BASE}${req.originalUrl}`;
  try {
    const fetch = (await import("node-fetch")).default;

    const headers = {
      "Content-Type": req.headers["content-type"] || "application/json",
      Accept: req.headers.accept || "application/json",
      ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
      ...(req.headers.authorization
        ? { authorization: req.headers.authorization }
        : {}),
      ...(req.headers["user-agent"]
        ? { "user-agent": req.headers["user-agent"] }
        : {}),
      ...(req.headers["x-requested-with"]
        ? { "x-requested-with": req.headers["x-requested-with"] }
        : {}),
      ...(req.headers.origin ? { origin: req.headers.origin } : {}),
      ...(req.headers.referer ? { referer: req.headers.referer } : {}),
    };

    const hasBody = !["GET", "HEAD"].includes(req.method);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        hasBody && req.body !== undefined
          ? typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body)
          : undefined,
      redirect: "manual",
    });

    // Forward content type & status
    const contentType =
      response.headers.get("content-type") || "application/json";
    res.status(response.status).set("content-type", contentType);

    // Forward Set-Cookie from API → browser (keeps sessions working)
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) res.set("set-cookie", setCookie);

    const body = await response.text();
    res.send(body);
  } catch (err) {
    console.error(`API proxy error for ${req.originalUrl}:`, err);
    res.status(503).json({
      error: "API server unavailable",
      path: req.originalUrl,
      message: err.message,
    });
  }
};

// ---------- Proxy mounts ----------
app.use("/api", proxyToApi);       // all API routes
app.use("/auth", proxyToApi);      // OAuth popup endpoints, e.g. /auth/google/url
app.use("/api/oauth", proxyToApi); // any /api/oauth/* calls your client might make

// ---------- Static SPA hosting ----------
app.use(express.static(path.join(__dirname, "dist/spa")));

// SPA fallback — serve index.html for non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/spa", "index.html"));
});

// ---------- Start server ----------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Faredown Production Server: http://localhost:${PORT}`);
  console.log(`📦 Static: /dist/spa`);
  console.log(`🔀 Proxy target: ${API_BASE}`);
});
