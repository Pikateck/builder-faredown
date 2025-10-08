// API Client Version - Updated when critical fixes are made
export const API_CLIENT_VERSION = "2.0.1-admin-fix";
export const API_CLIENT_TIMESTAMP = Date.now();

// Log version on import
console.log(
  `%c🔧 API Client v${API_CLIENT_VERSION}`,
  "background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold",
);
console.log(`Loaded at: ${new Date().toISOString()}`);
