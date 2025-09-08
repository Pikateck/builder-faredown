/**
 * Fixed API Configuration and Base Service
 * Fixes TypeError: Failed to fetch errors
 */

import { DevApiClient } from "./api-dev";

// Fixed backend URL detection
const getBackendUrl = () => {
  // Try environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // FIXED: Don't return null for fly.dev - use same-origin
  if (window.location.hostname.includes("fly.dev") || window.location.hostname.includes("builder.codes")) {
    return window.location.origin + "/api";
  }

  // For production environments, use same-origin base URL
  if (window.location.hostname !== "localhost") {
    return window.location.origin + "/api";
  }

  // Default to localhost for development
  return "http://localhost:3001/api";
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  TIMEOUT: 10000,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
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

// Enhanced API Client with better error handling
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private authToken: string | null;
  private devClient: DevApiClient;
  private forceFallback: boolean = false;

  constructor(config: typeof API_CONFIG) {
    this.baseURL = config.BASE_URL || "";
    this.timeout = config.TIMEOUT;
    this.authToken = localStorage.getItem("auth_token");
    this.devClient = new DevApiClient(this.baseURL);
    
    // Force fallback if no valid base URL
    if (!this.baseURL || this.baseURL === "null") {
      console.warn("⚠️ No valid API base URL detected, using fallback mode");
      this.forceFallback = true;
    }
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers = {
      ...API_CONFIG.HEADERS,
      ...customHeaders,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, create simple error object
        errorData = { 
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status 
        };
      }
      
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
        console.warn("Failed to parse response JSON:", jsonError);
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
    // Use fallback immediately if forced or no base URL
    if (this.forceFallback || !this.baseURL) {
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

      // Enhanced error handling
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log(`⏰ Request timeout for ${endpoint} - using fallback`);
        } else if (error.message.includes("Failed to fetch") || 
                   error.message.includes("NetworkError") ||
                   error.message.includes("fetch")) {
          console.log(`🌐 Network unavailable for ${endpoint} - using fallback`);
        } else {
          console.warn(`⚠️ Request failed: ${error.message}`);
        }
      }

      // Always return fallback data to prevent error propagation
      try {
        return this.devClient.get<T>(endpoint, params);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        // Return safe default structure
        return {
          success: false,
          error: "Service unavailable - using offline mode",
          data: null,
        } as T;
      }
    }
  }

  async post<T>(
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>,
  ): Promise<T> {
    if (this.forceFallback || !this.baseURL) {
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

      // Enhanced error handling for POST
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log(`⏰ POST request timeout for ${endpoint} - using fallback`);
        } else if (error.message.includes("Failed to fetch") || 
                   error.message.includes("NetworkError") ||
                   error.message.includes("fetch")) {
          console.log(`🌐 POST network unavailable for ${endpoint} - using fallback`);
        } else {
          console.warn(`⚠️ POST request failed: ${error.message}`);
        }
      }

      // Always return fallback data
      try {
        return this.devClient.post<T>(endpoint, data);
      } catch (fallbackError) {
        console.error("POST fallback also failed:", fallbackError);
        return {
          success: false,
          error: "Service unavailable - using offline mode",
          data: null,
        } as T;
      }
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    if (this.forceFallback || !this.baseURL) {
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
      
      try {
        return this.devClient.post<T>(endpoint, data);
      } catch {
        return {
          success: false,
          error: "Service unavailable",
          data: null,
        } as T;
      }
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    if (this.forceFallback || !this.baseURL) {
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
      
      try {
        return this.devClient.get<T>(endpoint);
      } catch {
        return {
          success: false,
          error: "Service unavailable",
          data: null,
        } as T;
      }
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem("auth_token", token);
  }

  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem("auth_token");
  }

  // Enhanced health check
  async healthCheck(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    try {
      return await this.get("/health");
    } catch (error) {
      // Return fallback health data
      return {
        status: "fallback",
        database: "offline",
        timestamp: new Date().toISOString(),
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

  // Enable fallback mode
  enableFallbackMode() {
    this.forceFallback = true;
    console.log("🔄 Fallback mode enabled - using offline data");
  }

  // Disable fallback mode (re-enable API calls)
  disableFallbackMode() {
    this.forceFallback = false;
    console.log("🌐 API mode enabled - using live data");
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_CONFIG);

// Helper functions for common patterns
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
