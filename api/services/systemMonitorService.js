const os = require("os");
const nodemailer = require("nodemailer");
const db = require("../database/connection");

const SUCCESS_STATUSES = new Set(["connected", "configured", "set", "healthy"]);
const ALERT_COMPONENTS = ["frontend", "backend", "database"];
const ALERT_THRESHOLD = Number(process.env.SYSTEM_MONITOR_ALERT_THRESHOLD || 3);
const ALERT_COOLDOWN_MINUTES = Number(process.env.SYSTEM_MONITOR_ALERT_COOLDOWN_MINUTES || 15);
const RETENTION_DAYS = Number(process.env.SYSTEM_MONITOR_RETENTION_DAYS || 7);
const RETENTION_INTERVAL_MINUTES = Number(process.env.SYSTEM_MONITOR_RETENTION_INTERVAL_MINUTES || 30);

let retentionScheduled = false;
let retentionTimer = null;
const lastAlertAt = new Map();

function formatDetail(detail) {
  if (!detail || Object.keys(detail).length === 0) {
    return null;
  }

  if (detail instanceof Error) {
    return {
      message: detail.message,
      stack: detail.stack,
      name: detail.name,
    };
  }

  return detail;
}

async function logStatus(component, status, latencyMs, detail = {}) {
  try {
    await db.query(
      `INSERT INTO system_monitor_logs (component, status, latency_ms, detail)
       VALUES ($1, $2, $3, $4)`,
      [component, status, latencyMs ?? null, formatDetail(detail)],
    );
  } catch (error) {
    console.error("systemMonitor: failed to log status", {
      component,
      status,
      error: error.message,
    });
  }
}

async function pruneOldLogs() {
  try {
    await db.query(
      `DELETE FROM system_monitor_logs WHERE checked_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`,
    );
  } catch (error) {
    console.error("systemMonitor: retention cleanup failed", error.message);
  }
}

function initializeRetentionSchedule() {
  if (retentionScheduled) {
    return;
  }

  retentionScheduled = true;

  const intervalMinutes = Math.max(RETENTION_INTERVAL_MINUTES, 5);
  const intervalMs = intervalMinutes * 60 * 1000;

  retentionTimer = setInterval(() => {
    pruneOldLogs().catch((error) => {
      console.error("systemMonitor: scheduled retention failed", error.message);
    });
  }, intervalMs);

  if (typeof retentionTimer.unref === "function") {
    retentionTimer.unref();
  }
}

process.on("exit", () => {
  if (retentionTimer) {
    clearInterval(retentionTimer);
  }
});

async function getRecentStatuses(component, limit) {
  const result = await db.query(
    `SELECT status, detail, checked_at
       FROM system_monitor_logs
      WHERE component = $1
      ORDER BY checked_at DESC
      LIMIT $2`,
    [component, limit],
  );

  return result.rows;
}

function extractError(detail) {
  if (!detail) {
    return null;
  }
  if (typeof detail === "string") {
    return detail;
  }
  if (detail.error) {
    return detail.error;
  }
  if (detail.message) {
    return detail.message;
  }
  if (typeof detail === "object") {
    const values = Object.values(detail);
    const firstString = values.find((value) => typeof value === "string" && value);
    if (firstString) {
      return firstString;
    }
  }
  return null;
}

async function maybeSendAlerts(componentStatuses) {
  if (!Array.isArray(componentStatuses) || componentStatuses.length === 0) {
    return;
  }

  const now = Date.now();
  const cooldownMs = ALERT_COOLDOWN_MINUTES * 60 * 1000;
  const actionableFailures = [];

  for (const status of componentStatuses) {
    if (
      !status ||
      !ALERT_COMPONENTS.includes(status.component) ||
      status.status !== "disconnected"
    ) {
      continue;
    }

    const recentRows = await getRecentStatuses(status.component, ALERT_THRESHOLD);
    if (recentRows.length < ALERT_THRESHOLD) {
      continue;
    }

    const allDisconnected = recentRows.every(
      (row) => (row.status || "").toLowerCase() === "disconnected",
    );

    if (!allDisconnected) {
      continue;
    }

    const lastAlertTime = lastAlertAt.get(status.component) || 0;
    if (now - lastAlertTime < cooldownMs) {
      continue;
    }

    const latest = recentRows[0];
    const errorMessage =
      extractError(latest?.detail) ||
      extractError(status.detail) ||
      "Unknown failure";

    actionableFailures.push({
      component: status.component,
      name: status.name || status.component,
      target: status.detail?.url || status.target || null,
      lastChecked: latest?.checked_at || new Date().toISOString(),
      error: errorMessage,
      httpStatus: status.detail?.httpStatus ?? latest?.detail?.httpStatus ?? null,
    });

    lastAlertAt.set(status.component, now);
  }

  if (!actionableFailures.length) {
    return;
  }

  const message =
    `⚠️ System Monitor Alert (${new Date().toISOString()})\n` +
    actionableFailures
      .map((failure) => {
        const targetLine = failure.target ? `Target: ${failure.target}` : "Target: n/a";
        const httpLine = failure.httpStatus
          ? `HTTP status: ${failure.httpStatus}\n`
          : "";
        return `• ${failure.name} (${failure.component})\n  ${targetLine}\n  ${httpLine}Last error: ${failure.error}\n  Checked: ${new Date(failure.lastChecked).toISOString()}`;
      })
      .join("\n");

  await Promise.all([
    sendEmailAlert("Faredown Monitor Alert", message),
    sendSlackAlert(message),
  ]);
}

function createEmailTransport() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
  } catch (error) {
    console.error("systemMonitor: failed to create SMTP transport", error.message);
    return null;
  }
}

async function sendEmailAlert(subject, text) {
  const transporter = createEmailTransport();
  if (!transporter || !process.env.ALERT_EMAIL_TO || !process.env.ALERT_EMAIL_FROM) {
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.ALERT_EMAIL_FROM,
      to: process.env.ALERT_EMAIL_TO,
      subject,
      text,
    });
  } catch (error) {
    console.error("systemMonitor: email alert failed", error.message);
  }
}

async function sendSlackAlert(text) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    return;
  }

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    console.error("systemMonitor: slack alert failed", error.message);
  }
}

async function verifySmtpConnectivity(timeoutMs = 5000) {
  if (!process.env.SMTP_HOST) {
    return {
      ok: false,
      status: null,
      latencyMs: null,
      error: "smtp-not-configured",
    };
  }

  const transporter = createEmailTransport();
  if (!transporter) {
    return {
      ok: false,
      status: null,
      latencyMs: null,
      error: "smtp-transport-unavailable",
    };
  }

  const start = Date.now();
  let timeoutId;

  try {
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("smtp-verify-timeout")), timeoutMs);
      }),
    ]);

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
      error: error?.message || String(error),
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    try {
      if (typeof transporter.close === "function") {
        transporter.close();
      }
    } catch (closeError) {
      console.warn(
        "systemMonitor: failed to close SMTP transport",
        closeError.message,
      );
    }
  }
}

async function getUptimeSummary(component, hours) {
  const result = await db.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN LOWER(status) = ANY($3) THEN 1 ELSE 0 END) AS healthy
       FROM system_monitor_logs
      WHERE component = $1
        AND checked_at >= NOW() - ($2 || ' hours')::interval`,
    [component, hours, Array.from(SUCCESS_STATUSES)],
  );

  const row = result.rows[0];
  const total = Number(row?.total || 0);
  const healthy = Number(row?.healthy || 0);
  const uptimePct = total > 0 ? Math.round((healthy / total) * 1000) / 10 : null;

  return { total, healthy, uptimePct };
}

async function getHistory(component, hours) {
  const cappedHours = Math.min(Math.max(parseInt(hours, 10) || 24, 1), 168);
  const result = await db.query(
    `SELECT checked_at, status, latency_ms, detail
       FROM system_monitor_logs
      WHERE component = $1
        AND checked_at >= NOW() - ($2 || ' hours')::interval
      ORDER BY checked_at ASC`,
    [component, cappedHours],
  );

  const points = result.rows.map((row) => ({
    checkedAt: row.checked_at,
    status: row.status,
    latencyMs: row.latency_ms,
    detail: row.detail,
  }));

  const uptime = await getUptimeSummary(component, cappedHours);
  return {
    component,
    hours: cappedHours,
    uptimePct: uptime.uptimePct,
    points,
  };
}

function sanitizeEnvValue(value, mask = false) {
  if (!value) {
    return value;
  }

  if (!mask) {
    return value;
  }

  if (value.length <= 6) {
    return "***";
  }

  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

function buildEnvSnapshot() {
  return {
    NODE_ENV: process.env.NODE_ENV || "development",
    APP_PUBLIC_URL: process.env.APP_PUBLIC_URL || null,
    RENDER_API_URL: process.env.RENDER_API_URL || null,
    DATABASE_URL: sanitizeEnvValue(process.env.DATABASE_URL, true),
    CORS_ORIGIN: process.env.CORS_ORIGIN || null,
    SUPABASE_URL: process.env.SUPABASE_URL || null,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || null,
    SMTP_HOST: process.env.SMTP_HOST || null,
    SMTP_PORT: process.env.SMTP_PORT || null,
    SMTP_USER: process.env.SMTP_USER ? sanitizeEnvValue(process.env.SMTP_USER, true) : null,
    ALERT_EMAIL_TO: process.env.ALERT_EMAIL_TO
      ? sanitizeEnvValue(process.env.ALERT_EMAIL_TO, true)
      : null,
  };
}

function buildMeta() {
  return {
    checkedAt: new Date().toISOString(),
    server: os.hostname(),
  };
}

function analyzeCorsConfig(rawOrigins, appUrl) {
  const origins = (rawOrigins || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => origin.replace(/\/+$/, ""));

  const wildcard = origins.includes("*");
  const normalizedAppUrl = appUrl ? appUrl.replace(/\/+$/, "") : null;
  const hasAppOrigin =
    wildcard || !normalizedAppUrl || origins.includes(normalizedAppUrl);

  return {
    origins,
    wildcard,
    hasAppOrigin,
    appUrl: normalizedAppUrl,
  };
}

module.exports = {
  logStatus,
  maybeSendAlerts,
  initializeRetentionSchedule,
  pruneOldLogs,
  getHistory,
  getUptimeSummary,
  buildEnvSnapshot,
  buildMeta,
  verifySmtpConnectivity,
  analyzeCorsConfig,
};
