const express = require("express");
const fetch = require("node-fetch");
const { URL } = require("url");
const adminKeyMiddleware = require("../middleware/adminKey");
const db = require("../database/connection");
const {
  logStatus,
  maybeSendAlerts,
  initializeRetentionSchedule,
  pruneOldLogs,
  getUptimeSummary,
  buildEnvSnapshot,
  buildMeta,
} = require("../services/systemMonitorService");

const router = express.Router();
initializeRetentionSchedule();

router.use(adminKeyMiddleware);

const COMPONENT_DEFINITIONS = [
  {
    component: "frontend",
    name: "Frontend",
    resolveTarget: () => process.env.APP_PUBLIC_URL || null,
    healthPath: "/health",
    timeoutMs: 5000,
  },
  {
    component: "backend",
    name: "Backend API",
    resolveTarget: () =>
      process.env.RENDER_API_URL || "https://builder-faredown-pricing.onrender.com/api/health",
    timeoutMs: 5000,
  },
  {
    component: "database",
    name: "Database",
    resolveTarget: () => "Render Postgres",
    timeoutMs: 3000,
  },
  {
    component: "email",
    name: "Email",
    resolveTarget: () => process.env.SMTP_HOST || null,
  },
  {
    component: "auth",
    name: "Authentication",
    resolveTarget: () =>
      process.env.SUPABASE_URL || process.env.GOOGLE_CALLBACK_URL || null,
  },
  {
    component: "cors",
    name: "CORS",
    resolveTarget: () => process.env.CORS_ORIGIN || null,
  },
];

function normalizeUrl(base, path) {
  if (!base) {
    return null;
  }

  try {
    if (path) {
      const url = new URL(base);
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return `${url.origin}${normalizedPath}`;
    }
    return base;
  } catch (error) {
    try {
      // If base is missing protocol, prepend https
      const url = new URL(`https://${base}`);
      if (path) {
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;
        return `${url.origin}${normalizedPath}`;
      }
      return url.href;
    } catch (innerError) {
      return base;
    }
  }
}

async function timedFetch(url, options = {}, timeoutMs = 5000) {
  if (!url) {
    return { ok: false, status: null, latencyMs: null, error: "missing-url" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;
    clearTimeout(timer);
    return { ok: response.ok, status: response.status, latencyMs };
  } catch (error) {
    clearTimeout(timer);
    return { ok: false, status: null, latencyMs: Date.now() - start, error: error.message };
  }
}

function classifyStatus({ component, result, latencyMs, target }) {
  if (component === "email") {
    if (!target) {
      return "not_configured";
    }
    return "configured";
  }

  if (component === "auth") {
    if (!target) {
      return "not_configured";
    }
    return "configured";
  }

  if (component === "cors") {
    if (!target) {
      return "missing";
    }
    return "set";
  }

  if (component === "database") {
    if (!result.ok) {
      return "disconnected";
    }
    if (latencyMs !== null && latencyMs > 800) {
      return "warning";
    }
    return "connected";
  }

  if (!result.ok) {
    return "disconnected";
  }

  if (latencyMs !== null && latencyMs > 1000) {
    return "warning";
  }

  return "connected";
}

async function checkDatabase() {
  const start = Date.now();
  try {
    await db.query("SELECT 1");
    return { ok: true, status: 200, latencyMs: Date.now() - start };
  } catch (error) {
    return { ok: false, status: null, latencyMs: Date.now() - start, error: error.message };
  }
}

router.get("/", async (req, res) => {
  const meta = buildMeta();
  const components = [];

  try {
    for (const definition of COMPONENT_DEFINITIONS) {
      const target = definition.resolveTarget();
      let checkResult = { ok: false, status: null, latencyMs: null };

      if (definition.component === "database") {
        checkResult = await checkDatabase();
      } else if (definition.component === "frontend") {
        const url = normalizeUrl(target, definition.healthPath || "");
        checkResult = await timedFetch(url, {}, definition.timeoutMs);
      } else if (definition.component === "backend") {
        const url = normalizeUrl(definition.resolveTarget());
        checkResult = await timedFetch(url, {}, definition.timeoutMs);
      }

      const status = classifyStatus({
        component: definition.component,
        result: checkResult,
        latencyMs: checkResult.latencyMs,
        target,
      });

      await logStatus(definition.component, status, checkResult.latencyMs, {
        target,
        httpStatus: checkResult.status,
        error: checkResult.error,
      });

      const uptime24h = await getUptimeSummary(definition.component, 24);
      const uptime7d = await getUptimeSummary(definition.component, 168);

      const componentStatus = {
        component: definition.component,
        name: definition.name,
        target,
        status,
        latencyMs: checkResult.latencyMs,
        httpStatus: checkResult.status,
        checkedAt: meta.checkedAt,
        uptime: {
          last24h: uptime24h.uptimePct,
          last7d: uptime7d.uptimePct,
        },
      };

      components.push(componentStatus);
    }

    await pruneOldLogs();
    await maybeSendAlerts(components);

    res.json({
      meta,
      summary: {
        healthy: components.filter((c) => c.status === "connected" || c.status === "configured" || c.status === "set").length,
        warning: components.filter((c) => c.status === "warning").length,
        failing: components.filter((c) => c.status === "disconnected" || c.status === "not_configured" || c.status === "missing").length,
        total: components.length,
      },
      components,
      env: buildEnvSnapshot(),
    });
  } catch (error) {
    console.error("systemMonitor: failed", error);
    res.status(500).json({
      error: "system-status-failed",
      message: error.message,
      meta,
      components,
      env: buildEnvSnapshot(),
    });
  }
});

module.exports = router;
