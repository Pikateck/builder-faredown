"use strict";

function resolveAdminKey() {
  return (process.env.ADMIN_API_KEY || "").trim();
}

function adminKeyMiddleware(req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    console.log("🔑 Admin Key Middleware - Checking authentication", {
      url: req.originalUrl,
      method: req.method,
      hasXAdminKey: !!req.get("x-admin-key"),
      hasQueryKey: !!req.query.admin_key,
    });
  }

  const configuredKey = resolveAdminKey();

  if (!configuredKey) {
    console.error(
      "❌ Admin Key Middleware - No ADMIN_API_KEY configured in environment",
    );
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

  if (process.env.NODE_ENV !== "production") {
    console.log("🔑 Admin Key Middleware - Key comparison", {
      hasProvidedKey: !!providedKey,
      providedKeyLength: providedKey.length,
      configuredKeyLength: configuredKey.length,
      providedKeyFirst10: providedKey.substring(0, 10),
      configuredKeyFirst10: configuredKey.substring(0, 10),
      keysMatch: providedKey === configuredKey,
    });
  }

  if (!providedKey || providedKey !== configuredKey) {
    if (process.env.NODE_ENV !== "production") {
      console.error("❌ Admin Key Middleware - Invalid or missing key");
    }
    return res.status(401).json({
      success: false,
      message: "Access denied: invalid admin key",
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Admin Key Middleware - Authentication successful");
  }

  // Set req.user for compatibility with other middleware
  req.user = {
    id: "admin-api-key",
    username: "admin-api",
    email: "admin-api@faredown.com",
    role: "super_admin",
    permissions: [], // Will be populated by subsequent middleware if needed
  };

  req.adminAccess = {
    ...(req.adminAccess || {}),
    viaKey: true,
  };

  next();
}

module.exports = adminKeyMiddleware;
