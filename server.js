/**
 * Main server entry point for Render deployment
 * Delegates to the pricing API server
 */

import("./api/server.js").catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
