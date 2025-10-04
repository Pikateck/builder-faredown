/**
 * Subdomain-Aware API Configuration
 * Automatically routes to correct API based on subdomain context
 */

import { ApiClient, API_CONFIG } from './api';

/**
 * Determine if current context is admin
 */
export const isAdminContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.includes('admin.') || hostname.startsWith('admin');
};

/**
 * Get API base URL based on subdomain context
 */
export const getSubdomainApiUrl = (): string => {
  // Server-side
  if (typeof window === 'undefined') {
    return process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  }

  // Check context
  const isAdmin = isAdminContext();
  
  // Admin context
  if (isAdmin) {
    // Use admin API base URL
    return import.meta.env.VITE_ADMIN_API_BASE_URL || 
           'https://admin.faredown.com/api';
  }
  
  // Customer context
  return import.meta.env.VITE_API_BASE_URL || 
         'https://api.faredown.com';
};

/**
 * Subdomain-aware API Configuration
 */
export const SUBDOMAIN_API_CONFIG = {
  ...API_CONFIG,
  BASE_URL: getSubdomainApiUrl(),
  IS_ADMIN: isAdminContext(),
  ADMIN_BASE_URL: import.meta.env.VITE_ADMIN_API_BASE_URL || 'https://admin.faredown.com/api',
  LIVE_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.faredown.com',
};

/**
 * Admin API Client
 * Uses admin subdomain and admin token
 */
export class AdminApiClient extends ApiClient {
  constructor() {
    super({
      ...SUBDOMAIN_API_CONFIG,
      BASE_URL: SUBDOMAIN_API_CONFIG.ADMIN_BASE_URL,
    });
  }

  protected getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    // Use admin-specific token
    const adminToken = typeof window !== 'undefined' 
      ? localStorage.getItem('admin_token') 
      : null;
    
    if (adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
    }

    // Add request ID for tracking
    headers['X-Request-ID'] = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return headers;
  }

  /**
   * Set admin authentication token
   */
  setAdminToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  /**
   * Clear admin authentication token
   */
  clearAdminToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  /**
   * Check if admin is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await this.get('/admin/auth/verify');
      return response.success === true;
    } catch {
      return false;
    }
  }
}

/**
 * Live/Public API Client
 * Uses live subdomain and customer token
 */
export class LiveApiClient extends ApiClient {
  constructor() {
    super({
      ...SUBDOMAIN_API_CONFIG,
      BASE_URL: SUBDOMAIN_API_CONFIG.LIVE_BASE_URL,
    });
  }
}

/**
 * Get appropriate API client based on context
 */
export const getApiClient = (): ApiClient => {
  return isAdminContext() 
    ? new AdminApiClient() 
    : new LiveApiClient();
};

/**
 * Singleton instances
 */
export const adminApiClient = new AdminApiClient();
export const liveApiClient = new LiveApiClient();

/**
 * Context-aware API client (automatically selects admin or live)
 */
export const contextApiClient = getApiClient();

// Export for backward compatibility
export { ApiClient } from './api';
export default contextApiClient;
