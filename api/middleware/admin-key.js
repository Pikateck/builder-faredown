"use strict";

function resolveAdminKey() {
  const configuredKey = (process.env.ADMIN_API_KEY || "").trim();
  return configuredKey;
}

function adminKeyMiddleware(req, res, next) {
  const configuredKey = resolveAdminKey();
  if (!configuredKey) {
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

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: "Access denied: invalid admin key",
    });
  }

  req.adminAccess = {
    ...(req.adminAccess || {}),
    viaKey: true,
  };

  next();
}

module.exports = {
  adminKeyMiddleware,
};
