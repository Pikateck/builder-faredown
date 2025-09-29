/**
 * Quick test to check if packages route has syntax errors
 */

try {
  const packagesRoutes = require("./api/routes/packages");
  console.log("✅ Packages route loads successfully");
  console.log("Route type:", typeof packagesRoutes);
} catch (error) {
  console.error("❌ Packages route has error:", error.message);
  console.error("Stack:", error.stack);
}
