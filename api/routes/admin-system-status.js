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
  verifySmtpConnectivity,
  analyzeCorsConfig,
} = require("../services/systemMonitorService");

try {
  initializeRetentionSchedule();
} catch (error) {
  console.warn("systemMonitor: failed to schedule retention", error.message);
}

const router = express.Router();
router.use(adminKeyMiddleware);

const DEFAULT_TIMEOUT_MS = 5000;
const COMPONENT_DEFINITIONS = [
  {
    component: "frontend",
    name: "Frontend",
    type: "http",
    resolveTarget: () => process.env.APP_PUBLIC_URL || null,
    healthPath: "/health",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    component: "backend",
    name: "Backend API",
    type: "http",
    resolveTarget: () =>
      process.env.RENDER_API_URL ||
      process.env.API_BASE_URL ||
      process.env.API_SERVER_URL ||
      null,
    healthPath: "/api/health",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    component: "database",
    name: "Database",
    type: "database",
    resolveTarget: () => "Render Postgres",
    timeoutMs: 3000,
  },
  {
    component: "email",
    name: "Email",
    type: "email",
    resolveTarget: () =>
      process.env.SMTP_HOST
        ? `${process.env.SMTP_HOST}${process.env.SMTP_PORT ? `:${process.env.SMTP_PORT}` : ""}`
        : null,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    component: "auth",
    name: "Authentication",
    type: "auth",
    resolveTarget: () =>
      process.env.RENDER_API_URL ||
      process.env.API_BASE_URL ||
      process.env.API_SERVER_URL ||
      null,
    healthPath: "/api/oauth/status",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
  {
    component: "cors",
    name: "CORS",
    type: "cors",
    resolveTarget: () => process.env.CORS_ORIGIN || null,
  },
];

function ensureProtocol(value) {
  if (!value) {
    return value;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function normalizeUrl(base, path) {
  if (!base) {
    return null;
  }

  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";

  try {
    const url = new URL(ensureProtocol(base));

    if (!normalizedPath) {
      return url.href;
    }

    if (url.pathname === normalizedPath || url.pathname.endsWith(normalizedPath)) {
      return url.href;
    }

    return `${url.origin}${normalizedPath}`;
  } catch (error) {
    return null;
  }
}

async function timedFetch(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  if (!url) {
    return { ok: false, status: null, latencyMs: null, error: "missing-url" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;
    clearTimeout(timeoutId);

    return {
      ok: response.ok,
      status: response.status,
      latencyMs,
      error: response.ok ? null : `http-${response.status}`,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - start,
      error: error.message,
    };
  }
}

async function checkDatabase() {
  const start = Date.now();
  try {
    await db.query("SELECT 1");
    return {
      ok: true,
      status: 200,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - start,
      error: error.message,
    };
  }
}

function classifyStatus({ component, result, latencyMs, target, detail }) {
  switch (component) {
    case "email": {
      if (!target) {
        return "not_configured";
      }
      return result.ok ? "connected" : "disconnected";
    }
    case "auth": {
      if (!target) {
        return "not_configured";
      }
      if (!result.ok) {
        return "disconnected";
      }
      if (latencyMs !== null && latencyMs > 1000) {
        return "warning";
      }
      return "connected";
    }
    case "cors": {
      if (!detail || !Array.isArray(detail.origins) || detail.origins.length === 0) {
        return "missing";
      }
      if (detail.hasAppOrigin === false) {
        return "warning";
      }
      return "set";
    }
    case "database": {
      if (!result.ok) {
        return "disconnected";
      }
      if (latencyMs !== null && latencyMs > 800) {
        return "warning";
      }
      return "connected";
    }
    default: {
      if (!result.ok) {
        return "disconnected";
      }
      if (latencyMs !== null && latencyMs > 1000) {
        return "warning";
      }
      return "connected";
    }
  }
}

async function evaluateComponent(definition, checkedAt) {
  const baseTarget = definition.resolveTarget ? definition.resolveTarget() : null;
  let detail = { target: baseTarget };
  let result = { ok: false, status: null, latencyMs: null, error: null };

  switch (definition.type) {
    case "database": {
      result = await checkDatabase();
      break;
    }
    case "http": {
      const url = normalizeUrl(baseTarget, definition.healthPath);
      result = await timedFetch(url, {}, definition.timeoutMs || DEFAULT_TIMEOUT_MS);
      detail = { ...detail, url };
      break;
    }
    case "auth": {
      const url = normalizeUrl(baseTarget, definition.healthPath);
      result =
        url !== null
          ? await timedFetch(url, {}, definition.timeoutMs || DEFAULT_TIMEOUT_MS)
          : { ok: false, status: null, latencyMs: null, error: "missing-url" };
      detail = { ...detail, url };
      break;
    }
    case "email": {
      result = await verifySmtpConnectivity(definition.timeoutMs || DEFAULT_TIMEOUT_MS);
      break;
    }
    case "cors": {
      const analysis = analyzeCorsConfig(baseTarget, process.env.APP_PUBLIC_URL || null);
      result = {
        ok: analysis.hasAppOrigin && analysis.origins.length > 0,
        status: analysis.origins.length > 0 ? 200 : null,
        latencyMs: 0,
        error:
          analysis.origins.length === 0
            ? "cors-not-configured"
            : analysis.hasAppOrigin
              ? null
              : "app-url-missing",
      };
      detail = {
        ...detail,
        origins: analysis.origins,
        hasAppOrigin: analysis.hasAppOrigin,
        appUrl: analysis.appUrl,
        wildcard: analysis.wildcard,
      };
      break;
    }
    default: {
      result = {
        ok: false,
        status: null,
        latencyMs: null,
        error: "unsupported-component",
      };
      break;
    }
  }

  const status = classifyStatus({
    component: definition.component,
    result,
    latencyMs: result.latencyMs,
    target: baseTarget,
    detail,
  });

  await logStatus(definition.component, status, result.latencyMs, {
    ...detail,
    httpStatus: result.status,
    error: result.error,
  });

  let uptime24h = { uptimePct: null };
  let uptime7d = { uptimePct: null };

  try {
    uptime24h = await getUptimeSummary(definition.component, 24);
    uptime7d = await getUptimeSummary(definition.component, 168);
  } catch (error) {
    console.error("systemMonitor: uptime summary failed", error.message);
  }

  const displayTarget =
    definition.component === "cors"
      ? detail.origins?.join(", ") || baseTarget
      : detail.url || baseTarget;

  return {
    component: definition.component,
    name: definition.name,
    target: displayTarget,
    status,
    latencyMs: result.latencyMs,
    httpStatus: result.status,
    checkedAt,
    uptime: {
      last24h: uptime24h.uptimePct,
      last7d: uptime7d.uptimePct,
    },
    detail: {
      ...detail,
      error: result.error || detail.error || null,
    },
  };
}

router.get("/", async (req, res) => {
  const meta = buildMeta();
  const components = [];

  try {
    for (const definition of COMPONENT_DEFINITIONS) {
      const componentStatus = await evaluateComponent(definition, meta.checkedAt);
      components.push(componentStatus);
    }

    await pruneOldLogs();
    await maybeSendAlerts(components);

    const healthyStatuses = new Set(["connected", "configured", "set"]);
    const warningStatuses = new Set(["warning"]);
    const failingStatuses = new Set(["disconnected", "not_configured", "missing"]);

    const summary = components.reduce(
      (acc, component) => {
        if (healthyStatuses.has(component.status)) {
          acc.healthy += 1;
        } else if (warningStatuses.has(component.status)) {
          acc.warning += 1;
        } else if (failingStatuses.has(component.status)) {
          acc.failing += 1;
        }
        return acc;
      },
      { healthy: 0, warning: 0, failing: 0, total: components.length },
    );

    res.json({
      meta,
      summary,
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
