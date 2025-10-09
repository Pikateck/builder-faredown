#!/usr/bin/env node
import fetch from "node-fetch";

const API_BASE = "https://builder-faredown-pricing.onrender.com/api";
const ADMIN_KEY = "8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1";
const ORIGIN = "https://spontaneous-biscotti-da44bc.netlify.app";

async function run() {
  const results = [];

  async function record(name, fn) {
    const start = Date.now();
    try {
      const res = await fn();
      const ms = Date.now() - start;
      results.push({ name, ok: res.okStatus, status: res.status, ms, details: res.details });
    } catch (error) {
      const ms = Date.now() - start;
      results.push({ name, ok: false, status: "error", ms, details: error.message });
    }
  }

  await record("OPTIONS /api/admin/users", async () => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: "OPTIONS",
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "X-Admin-Key, Content-Type",
      },
    });

    const allowHeaders = res.headers.get("access-control-allow-headers");
    return {
      okStatus: res.status === 204,
      status: res.status,
      details: `allow-headers: ${allowHeaders ?? "<missing>"}`,
    };
  });

  await record("GET /api/admin/users", async () => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: {
        Origin: ORIGIN,
        "X-Admin-Key": ADMIN_KEY,
      },
    });

    let details = `${res.status}`;
    if (res.ok) {
      const json = await res.json();
      details = `users: ${Array.isArray(json.users) ? json.users.length : "n/a"}`;
    } else {
      details = await res.text();
    }

    return {
      okStatus: res.status === 200,
      status: res.status,
      details,
    };
  });

  const hasFailure = results.some((r) => !r.ok);
  const formatter = (r) => `${r.ok ? "✅" : "❌"} ${r.name} → ${r.status} (${r.ms}ms) ${r.details}`;
  results.forEach((r) => console.log(formatter(r)));

  if (hasFailure) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Admin monitor failed", error);
  process.exitCode = 1;
});
