/**
 * API Configuration and Base Service
 * Centralized API client for Faredown backend integration
 */

import { DevApiClient } from "./api-dev";

// Auto-detect backend URL based on environment
const getBackendUrl = () => {
  // Try environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // On fly.dev preview without explicit API, don't guess – use fallback
  if (window.location.hostname.includes("fly.dev")) {
    return null as unknown as string;
  }

  // For production environments, use same-origin base URL (no hardcoded port)
  if (window.location.hostname !== "localhost") {
    return window.location.origin;
  }

  // Default to localhost for development
  return "http://localhost:3001";
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
    totalPages: number;
  };
}

// Error Types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// HTTP Client Class
class ApiClient {
  private baseURL: string | null;
  private timeout: number;
  private authToken: string | null = null;
  private devClient: DevApiClient;
  private forceFallback: boolean;
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL as string | null;
    this.timeout = API_CONFIG.TIMEOUT;
    this.devClient = new DevApiClient(this.baseURL || "");
    this.loadAuthToken();
    const isFly =
      typeof window !== "undefined" &&
      window.location.hostname.includes("fly.dev");
    this.forceFallback = !this.baseURL || isFly;
  }

  private loadAuthToken() {
    this.authToken = localStorage.getItem("auth_token");
  }

  private getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
    const headers: HeadersInit = {
      ...API_CONFIG.HEADERS,
      ...customHeaders,
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (jsonError) {
        // Don't log AbortErrors in JSON parsing
        if (!(jsonError instanceof Error && jsonError.name === "AbortError")) {
          console.warn("Failed to parse error response JSON:", jsonError);
        }
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
        // Don't log AbortErrors in JSON parsing
        if (jsonError instanceof Error && jsonError.name === "AbortError") {
          throw jsonError; // Re-throw to be handled by calling method
        } else {
          console.warn("Failed to parse response JSON:", jsonError);
          throw new ApiError("Invalid JSON response", response.status);
        }
      }
    }

    try {
      return (await response.text()) as unknown as T;
    } catch (textError) {
      if (textError instanceof Error && textError.name === "AbortError") {
        throw textError; // Re-throw to be handled by calling method
      }
      throw new ApiError("Failed to read response", response.status);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    if (this.forceFallback) {
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
      console.log(`🌐 API GET: ${url.toString()}`);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`�� API Response: ${response.status}`);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle specific error types gracefully
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log(`⏰ Request timeout for ${endpoint} - using fallback`);
        } else if (error.message.includes("Failed to fetch")) {
          console.log(
            `🌐 Network unavailable for ${endpoint} - using fallback`,
          );
        } else {
          console.warn(`⚠️ Request failed: ${error.message}`);
        }
      }

      // Always return fallback data to prevent error propagation
      try {
        return this.devClient.get<T>(endpoint, params);
      } catch (fallbackError) {
        // If even fallback fails, return safe default but don't log AbortErrors
        if (
          !(
            fallbackError instanceof Error &&
            fallbackError.name === "AbortError"
          )
        ) {
          console.error("Fallback also failed:", fallbackError);
        }
        return {
          success: false,
          error: "Service unavailable",
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
    if (this.forceFallback) {
      return this.devClient.post<T>(endpoint, data);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`🌐 API POST: ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(customHeaders),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`✅ API POST Response: ${response.status}`);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle specific error types gracefully
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log(
            `⏰ POST request timeout for ${endpoint} - using fallback`,
          );
        } else if (error.message.includes("Failed to fetch")) {
          console.log(
            `🌐 POST network unavailable for ${endpoint} - using fallback`,
          );
        } else {
          console.warn(`⚠️ POST request failed: ${error.message}`);
        }
      }

      // Always return fallback data to prevent error propagation
      try {
        return this.devClient.post<T>(endpoint, data);
      } catch (fallbackError) {
        // If even fallback fails, return safe default but don't log AbortErrors
        if (
          !(
            fallbackError instanceof Error &&
            fallbackError.name === "AbortError"
          )
        ) {
          console.error("POST fallback also failed:", fallbackError);
        }
        return {
          success: false,
          error: "Service unavailable",
          data: null,
        } as T;
      }
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    if (this.forceFallback) {
      return this.devClient.post<T>(endpoint, data);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      console.log(`🌐 API PUT: ${this.baseURL}${endpoint}`);
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
        throw error as any;
      }
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    if (this.forceFallback) {
      return this.devClient.get<T>(endpoint);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      console.log(`🌐 API DELETE: ${this.baseURL}${endpoint}`);
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
        throw error as any;
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

  // Health check
  async healthCheck(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    try {
      console.log("🌐 Health check: Trying live API");
      return await this.get("/health");
    } catch (error) {
      console.warn("⚠️ Health check failed, using fallback");

      // Ensure fallback always works
      try {
        return this.devClient.get("/health");
      } catch (fallbackError) {
        // Ultimate fallback - return mock health data
        return {
          status: "fallback",
          database: "mock (API unavailable)",
          timestamp: new Date().toISOString(),
        };
      }
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for convenience
export default apiClient;
