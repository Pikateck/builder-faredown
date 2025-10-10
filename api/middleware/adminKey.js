"use strict";

function resolveAdminKey() {
  return (process.env.ADMIN_API_KEY || "").trim();
}

function adminKeyMiddleware(req, res, next) {
  console.log("🔑 Admin Key Middleware - Checking authentication", {
    url: req.originalUrl,
    method: req.method,
    hasXAdminKey: !!req.get("x-admin-key"),
    hasQueryKey: !!req.query.admin_key,
  });

  const configuredKey = resolveAdminKey();

  if (!configuredKey) {
    console.error("❌ Admin Key Middleware - No ADMIN_API_KEY configured");
    return res.status(500).json({
      success: false,
      message: "Admin API key is not configured",
    });
  }

  const providedKey = (
    req.get("x-admin-key") ||
    req.query.admin_key ||
    ""
  ).trim();

  console.log("🔑 Admin Key Middleware - Key comparison", {
    hasProvidedKey: !!providedKey,
    providedKeyLength: providedKey.length,
    configuredKeyLength: configuredKey.length,
    providedKeyFirst10: providedKey.substring(0, 10),
    configuredKeyFirst10: configuredKey.substring(0, 10),
    keysMatch: providedKey === configuredKey,
  });

  if (!providedKey || providedKey !== configuredKey) {
    console.error("❌ Admin Key Middleware - Invalid or missing key");
    return res.status(401).json({
      success: false,
      message: "Access denied: invalid admin key",
    });
  }

  console.log("✅ Admin Key Middleware - Authentication successful");
  req.adminAccess = {
    ...(req.adminAccess || {}),
    viaKey: true,
  };

  next();
}

module.exports = adminKeyMiddleware;
