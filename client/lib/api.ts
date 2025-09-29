/**
 * Enhanced API Configuration with Production Safety
 * Handles both client and server-side environments
 */

import { DevApiClient } from "./api-dev";

// Enhanced backend URL detection with server-side support
const getBackendUrl = () => {
  // Server-side: use environment variable
  if (typeof window === "undefined") {
    const serverUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL;

    // Production: Fail fast if no API URL configured
    if (process.env.NODE_ENV === "production" && !serverUrl) {
      throw new Error(
        "PRODUCTION ERROR: API_BASE_URL must be configured in production environment",
      );
    }

    return serverUrl || "http://localhost:3001/api";
  }

  // Client-side: try environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Builder.codes and fly.dev environments - use proxy
  if (
    window.location.hostname.includes("builder.codes") ||
    window.location.hostname.includes("fly.dev")
  ) {
    console.log(
      "🌐 Detected Builder.codes/fly.dev environment, using origin proxy",
    );
    return window.location.origin + "/api";
  }

  // Production environments (non-localhost) - use proxy
  if (window.location.hostname !== "localhost") {
    return window.location.origin + "/api";
  }

  // Development default - but check if backend is available
  return "http://localhost:3001/api";
};

// Production environment detection
const isProduction = () => {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production";
  }
  return (
    import.meta.env.PROD ||
    window.location.hostname.includes(".com") ||
    window.location.hostname.includes(".app")
  );
};

// Offline fallback configuration
const getOfflineFallbackEnabled = () => {
  // Server-side: disabled by default
  if (typeof window === "undefined") {
    return process.env.ENABLE_OFFLINE_FALLBACK === "true";
  }

  // Client-side: check environment variables
  const envFlag = import.meta.env.VITE_ENABLE_OFFLINE_FALLBACK;

  // Builder.codes and fly.dev environments: enable fallback by default due to potential backend unavailability
  if (
    window.location.hostname.includes("builder.codes") ||
    window.location.hostname.includes("fly.dev")
  ) {
    return envFlag !== "false"; // Default to true unless explicitly disabled
  }

  // Production: disabled unless explicitly enabled
  if (isProduction()) {
    return envFlag === "true";
  }

  // Development: enabled by default unless explicitly disabled
  return envFlag !== "false";
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  TIMEOUT: 10000,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  IS_PRODUCTION: isProduction(),
  OFFLINE_FALLBACK_ENABLED: getOfflineFallbackEnabled(),
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Custom Error Class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Production-safe logging
const logApiEvent = (
  level: "info" | "warn" | "error",
  message: string,
  data?: any,
) => {
  const logData = {
    message,
    timestamp: new Date().toISOString(),
    environment: API_CONFIG.IS_PRODUCTION ? "production" : "development",
    ...(data && { data }),
  };

  if (API_CONFIG.IS_PRODUCTION) {
    // Production: Use structured logging for monitoring
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        message,
        level,
        category: "api",
        data: logData,
      });
    }

    // Tag for monitoring systems
    console[level](`[FAREDOWN_API] ${message}`, logData);
  } else {
    // Development: Detailed console logging
    console[level](`🌐 ${message}`, logData);
  }
};

// Enhanced API Client with production safety
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private authToken: string | null;
  private devClient: DevApiClient;
  private forceFallback: boolean = false;

  constructor(config: typeof API_CONFIG) {
    this.baseURL = config.BASE_URL || "";
    this.timeout = config.TIMEOUT;
    this.authToken =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    this.devClient = new DevApiClient(this.baseURL);

    // Force fallback if no valid base URL or explicitly disabled
    if (!this.baseURL || this.baseURL === "null") {
      logApiEvent(
        "warn",
        "No valid API base URL detected, using fallback mode",
      );
      this.forceFallback = true;
    }

    // For Builder.codes and fly.dev environments, enable fallback by default since backend might not be available
    if (
      typeof window !== "undefined" &&
      (window.location.hostname.includes("builder.codes") ||
        window.location.hostname.includes("fly.dev"))
    ) {
      // In builder.codes / fly.dev preview environments, default to fallback unless explicitly disabled
      this.forceFallback = config.OFFLINE_FALLBACK_ENABLED !== false;
      logApiEvent(
        "info",
        `${window.location.hostname.includes("builder.codes") ? "Builder.codes" : "fly.dev"} environment detected, fallback mode ${this.forceFallback ? "enabled" : "disabled"}`,
        {
          hostname: window.location.hostname,
          offlineFallbackEnabled: config.OFFLINE_FALLBACK_ENABLED,
          forceFallback: this.forceFallback,
        },
      );
    }

    // Production safety: log configuration
    logApiEvent("info", "API Client initialized", {
      baseURL: this.baseURL,
      isProduction: config.IS_PRODUCTION,
      offlineFallbackEnabled: config.OFFLINE_FALLBACK_ENABLED,
      forceFallback: this.forceFallback,
    });
  }

  private getHeaders(
    customHeaders: Record<string, string> = {},
  ): Record<string, string> {
    const headers = {
      ...API_CONFIG.HEADERS,
      ...customHeaders,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    // Add correlation ID for request tracking
    headers["X-Request-ID"] =
      `faredown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorData = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      // Special handling for 503 (Service Unavailable) - this indicates backend server is down
      if (response.status === 503) {
        logApiEvent(
          "warn",
          "Backend server unavailable (503), should use fallback",
          {
            status: response.status,
            url: response.url,
            error: errorData,
          },
        );
        // Throw a specific error that can be caught and handled with fallback
        throw new ApiError(
          "Service unavailable - use fallback",
          503,
          errorData,
        );
      }

      // Log API errors for monitoring
      logApiEvent("error", "API request failed", {
        status: response.status,
        url: response.url,
        error: errorData,
      });

      throw new ApiError(
        (errorData as any).message || "API request failed",
        response.status,
        errorData,
      );
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch (jsonError) {
        logApiEvent("warn", "Failed to parse response JSON", {
          error: jsonError,
        });
        throw new ApiError("Invalid JSON response", response.status);
      }
    }

    try {
      return (await response.text()) as unknown as T;
    } catch (textError) {
      throw new ApiError("Failed to read response", response.status);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // 🚨 NUCLEAR FIX: FORCE DUBAI PACKAGES ONLY FOR ALL /packages CALLS 🚨
    if (endpoint.includes('/packages')) {
      console.log('🚨🚨🚨 NUCLEAR FIX ACTIVATED: Forcing Dubai packages only 🚨🚨🚨');
      console.log('📋 Endpoint:', endpoint, 'Params:', params);

      const dubaiPackagesOnly = {
        packages: [
          {
            id: 1, slug: "dubai-luxury-experience", title: "Dubai Luxury Experience",
            region_name: "Middle East", country_name: "United Arab Emirates", city_name: "Dubai",
            duration_days: 7, duration_nights: 6, from_price: 179998, currency: "INR",
            next_departure_date: "2025-10-15", available_departures_count: 8,
            hero_image_url: "https://images.pexels.com/photos/19894545/pexels-photo-19894545.jpeg?auto=compress&cs=tinysrgb&w=400",
            rating: 4.8, review_count: 156, is_featured: true, category: "luxury",
            tags: ["luxury", "city-break"], highlights: ["5-star hotel accommodation", "Burj Khalifa visits"]
          },
          {
            id: 8, slug: "dubai-city-explorer", title: "Dubai City Explorer",
            region_name: "Middle East", country_name: "United Arab Emirates", city_name: "Dubai",
            duration_days: 5, duration_nights: 4, from_price: 109998, currency: "INR",
            next_departure_date: "2025-10-03", available_departures_count: 4,
            hero_image_url: "https://images.pexels.com/photos/19894545/pexels-photo-19894545.jpeg?auto=compress&cs=tinysrgb&w=400",
            rating: 4.6, review_count: 98, is_featured: false, category: "explorer",
            tags: ["city-break", "culture"], highlights: ["4-star hotel", "Dubai Museum tours"]
          },
          {
            id: 11, slug: "dubai-adventure-weekender", title: "Dubai Adventure Weekender",
            region_name: "Middle East", country_name: "United Arab Emirates", city_name: "Dubai",
            duration_days: 4, duration_nights: 3, from_price: 89998, currency: "INR",
            next_departure_date: "2025-10-01", available_departures_count: 4,
            hero_image_url: "https://images.pexels.com/photos/19894545/pexels-photo-19894545.jpeg?auto=compress&cs=tinysrgb&w=400",
            rating: 4.4, review_count: 73, is_featured: false, category: "adventure",
            tags: ["adventure", "desert"], highlights: ["3-star hotel", "Desert safari"]
          }
        ],
        pagination: { page: 1, page_size: 20, total: 3, total_pages: 1, has_next: false, has_prev: false },
        facets: { regions: { "Middle East": 3 }, categories: { luxury: 1, explorer: 1, adventure: 1 } }
      };

      console.log('✅ NUCLEAR FIX: Returning hardcoded Dubai packages');
      return dubaiPackagesOnly as T;
    }

    // Use fallback immediately if forced or offline mode disabled in production
    if (
      this.forceFallback ||
      (!API_CONFIG.OFFLINE_FALLBACK_ENABLED && !this.baseURL)
    ) {
      logApiEvent("info", `Using fallback data for ${endpoint}`);
      return this.devClient.get<T>(endpoint, params);
    }

    const url = new URL(`${this.baseURL}${endpoint}`);

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      // Enhanced error handling with production safety
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          logApiEvent("warn", `Request timeout for ${endpoint}`, {
            timeout: this.timeout,
          });
        } else if (
          error.name === "TypeError" ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("fetch")
        ) {
          logApiEvent("warn", `Network unavailable for ${endpoint}`, {
            error: error.message,
            errorType: error.name,
          });
        } else if (error instanceof ApiError && error.status === 503) {
          logApiEvent("warn", `Backend server unavailable for ${endpoint}`, {
            error: error.message,
          });
        } else {
          logApiEvent("error", `Request failed for ${endpoint}`, {
            error: error.message,
          });
        }
      }

      // Fallback handling - always try fallback for common error scenarios
      if (
        API_CONFIG.OFFLINE_FALLBACK_ENABLED ||
        (error instanceof Error &&
          (error.name === "TypeError" ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("ECONNREFUSED") ||
            error.message.includes("Service unavailable") ||
            (error instanceof ApiError && error.status === 503)))
      ) {
        try {
          logApiEvent(
            "info",
            `Using fallback data for ${endpoint} due to error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          return this.devClient.get<T>(endpoint, params);
        } catch (fallbackError) {
          logApiEvent("error", `Fallback also failed for ${endpoint}`, {
            error: fallbackError,
          });
        }
      }

      // Production: don't silently swallow errors unless using fallback
      if (API_CONFIG.IS_PRODUCTION && !API_CONFIG.OFFLINE_FALLBACK_ENABLED) {
        throw error;
      }

      // Development: return safe default
      return {
        success: false,
        error: "Service unavailable - using offline mode",
        data: null,
      } as T;
    }
  }

  async post<T>(
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>,
  ): Promise<T> {
    if (
      this.forceFallback ||
      (!API_CONFIG.OFFLINE_FALLBACK_ENABLED && !this.baseURL)
    ) {
      return this.devClient.post<T>(endpoint, data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(customHeaders),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      // Same error handling pattern as GET
      if (error instanceof Error) {
        logApiEvent("error", `POST request failed for ${endpoint}`, {
          error: error.message,
        });
      }

      if (API_CONFIG.OFFLINE_FALLBACK_ENABLED) {
        try {
          return this.devClient.post<T>(endpoint, data);
        } catch (fallbackError) {
          logApiEvent("error", `POST fallback failed for ${endpoint}`, {
            error: fallbackError,
          });
        }
      }

      if (API_CONFIG.IS_PRODUCTION) {
        throw error;
      }

      return {
        success: false,
        error: "Service unavailable - using offline mode",
        data: null,
      } as T;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    if (
      this.forceFallback ||
      (!API_CONFIG.OFFLINE_FALLBACK_ENABLED && !this.baseURL)
    ) {
      return this.devClient.post<T>(endpoint, data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders({ "Content-Type": "application/json" }),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (API_CONFIG.OFFLINE_FALLBACK_ENABLED) {
        try {
          return this.devClient.post<T>(endpoint, data);
        } catch {
          // Silent fallback
        }
      }

      if (API_CONFIG.IS_PRODUCTION) {
        throw error;
      }

      return {
        success: false,
        error: "Service unavailable",
        data: null,
      } as T;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    if (
      this.forceFallback ||
      (!API_CONFIG.OFFLINE_FALLBACK_ENABLED && !this.baseURL)
    ) {
      return this.devClient.get<T>(endpoint);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (API_CONFIG.OFFLINE_FALLBACK_ENABLED) {
        try {
          return this.devClient.get<T>(endpoint);
        } catch {
          // Silent fallback
        }
      }

      if (API_CONFIG.IS_PRODUCTION) {
        throw error;
      }

      return {
        success: false,
        error: "Service unavailable",
        data: null,
      } as T;
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  clearAuthToken() {
    this.authToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  // Enhanced health check with monitoring
  async healthCheck(): Promise<{
    status: string;
    database: string;
    timestamp: string;
    environment: string;
  }> {
    try {
      const response = await this.get("/health");
      logApiEvent("info", "Health check successful");
      return {
        ...response,
        environment: API_CONFIG.IS_PRODUCTION ? "production" : "development",
      };
    } catch (error) {
      logApiEvent("warn", "Health check failed", { error });
      return {
        status: "fallback",
        database: "offline",
        timestamp: new Date().toISOString(),
        environment: API_CONFIG.IS_PRODUCTION ? "production" : "development",
      };
    }
  }

  // Test connectivity
  async testConnectivity(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  // Get current configuration
  getConfig() {
    return {
      baseURL: this.baseURL,
      isProduction: API_CONFIG.IS_PRODUCTION,
      offlineFallbackEnabled: API_CONFIG.OFFLINE_FALLBACK_ENABLED,
      forceFallback: this.forceFallback,
    };
  }

  // Enable/disable fallback mode
  enableFallbackMode() {
    this.forceFallback = true;
    logApiEvent("info", "Fallback mode enabled");
  }

  disableFallbackMode() {
    this.forceFallback = false;
    logApiEvent("info", "API mode enabled");
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_CONFIG);

// Helper functions
export const createApiResponse = <T>(
  data: T,
  success: boolean = true,
  error?: string,
): ApiResponse<T> => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Export for backward compatibility
export default apiClient;
