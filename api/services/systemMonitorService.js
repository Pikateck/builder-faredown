const cron = require("node-cron");
const os = require("os");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const db = require("../database/connection");

const SUCCESS_STATUSES = new Set(["connected", "configured", "set", "healthy"]);
const ALERT_COMPONENTS = ["frontend", "backend", "database"];
const ALERT_THRESHOLD = 3;
const RETENTION_DAYS = 7;
let retentionScheduled = false;

function formatDetail(detail) {
  if (!detail || Object.keys(detail).length === 0) {
    return null;
  }

  try {
    return JSON.stringify(detail);
  } catch (error) {
    return JSON.stringify({ message: "Failed to stringify detail", error: error.message });
  }
}

async function logStatus(component, status, latencyMs, detail = {}) {
  try {
    await db.query(
      `INSERT INTO system_monitor_logs (component, status, latency_ms, detail)
       VALUES ($1, $2, $3, $4)`,
      [component, status, latencyMs ?? null, formatDetail(detail)],
    );
  } catch (error) {
    console.error("systemMonitor: failed to log status", { component, status, error: error.message });
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

  cron.schedule("30 2 * * *", async () => {
    console.log("[system-monitor] running retention cleanup");
    await pruneOldLogs();
  });
}

async function getRecentStatuses(component, limit) {
  const result = await db.query(
    `SELECT status FROM system_monitor_logs
     WHERE component = $1
     ORDER BY checked_at DESC
     LIMIT $2`,
    [component, limit],
  );

  return result.rows;
}

async function hasConsecutiveFailures(component, limit = ALERT_THRESHOLD) {
  const rows = await getRecentStatuses(component, limit);
  if (rows.length < limit) {
    return false;
  }
  return rows.every((row) => (row.status || "").toLowerCase() === "disconnected");
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

async function maybeSendAlerts(componentStatuses) {
  const failures = [];

  for (const status of componentStatuses) {
    if (
      ALERT_COMPONENTS.includes(status.component) &&
      status.status === "disconnected" &&
      (await hasConsecutiveFailures(status.component, ALERT_THRESHOLD))
    ) {
      failures.push(status);
    }
  }

  if (!failures.length) {
    return;
  }

  const message = `⚠️ System Monitor Alert (${new Date().toISOString()})\n` +
    failures
      .map((failure) => `• ${failure.name} is disconnected (target: ${failure.target || "n/a"})`)
      .join("\n");

  await Promise.all([sendEmailAlert("Faredown Monitor Alert", message), sendSlackAlert(message)]);
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
    ALERT_EMAIL_TO: process.env.ALERT_EMAIL_TO ? sanitizeEnvValue(process.env.ALERT_EMAIL_TO, true) : null,
  };
}

function buildMeta() {
  return {
    checkedAt: new Date().toISOString(),
    server: os.hostname(),
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
};
