/**
 * API Configuration and Base Service
 * Centralized API client for Faredown backend integration
 */

import { DevApiClient } from './api-dev';

// Auto-detect backend URL based on environment
const getBackendUrl = () => {
  // Try environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // In production, try common backend URLs
  if (window.location.hostname !== "localhost") {
    const currentDomain = window.location.origin;
    // Try backend subdomain
    const backendUrl = currentDomain.replace("https://", "https://api-");
    return backendUrl;
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
  private baseURL: string;
  private timeout: number;
  private authToken: string | null = null;
  private devClient: DevApiClient;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.devClient = new DevApiClient(this.baseURL);
    this.loadAuthToken();
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
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || "API request failed",
        response.status,
        errorData,
      );
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
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

      // Check if this is a connection error (API server not running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('API server not available, using development fallback');
        return this.devClient.get<T>(endpoint, params);
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }
      throw error;
    }
  }

  async post<T>(
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>,
  ): Promise<T> {
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

      // Check if this is a connection error (API server not running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('API server not available, using development fallback for POST');
        return this.devClient.post<T>(endpoint, data);
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
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
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }
      throw error;
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
    return this.get("/health");
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for convenience
export default apiClient;
