/**
 * Admin Environment Utilities
 * Handles environment variable access for admin components
 */

/**
 * Get the admin API key from environment variables
 * Uses Vite's import.meta.env instead of process.env for browser compatibility
 */
export function getAdminApiKey(): string {
  // Try to get from Vite environment first
  const viteAdminKey = import.meta.env.VITE_ADMIN_API_KEY;

  if (viteAdminKey) {
    return viteAdminKey;
  }

  // Fallback for development
  if (import.meta.env.DEV) {
    console.warn("VITE_ADMIN_API_KEY not found, using development fallback");
    return "admin123";
  }

  // Production fallback
  console.error("VITE_ADMIN_API_KEY not configured in production environment");
  return "admin123";
}

/**
 * Get common admin headers for API requests
 */
export function getAdminHeaders(): Record<string, string> {
  const adminKey = getAdminApiKey();

  if (import.meta.env.DEV) {
    console.log("🔑 Client Admin Headers", {
      hasAdminKey: !!adminKey,
      keyLength: adminKey.length,
      keyFirst10: adminKey.substring(0, 10),
      viteAdminKey: import.meta.env.VITE_ADMIN_API_KEY,
    });
  }

  return {
    "Content-Type": "application/json",
    "X-Admin-Key": adminKey,
  };
}

/**
 * Check if admin API key is properly configured
 */
export function isAdminApiKeyConfigured(): boolean {
  return !!import.meta.env.VITE_ADMIN_API_KEY;
}
