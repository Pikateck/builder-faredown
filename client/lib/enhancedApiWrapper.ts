/**
 * Enhanced API Wrapper for All Modules
 * Provides consistent error handling and fallback across the entire application
 */

import { apiClient } from "./api";
import { API_CONFIG } from "./api";

// Generic API service class that all modules can extend
export abstract class EnhancedApiService {
  protected serviceName: string;
  protected baseEndpoint: string;

  constructor(serviceName: string, baseEndpoint: string) {
    this.serviceName = serviceName;
    this.baseEndpoint = baseEndpoint;
  }

  // Production-safe logging for this service
  protected logServiceEvent(
    level: "info" | "warn" | "error",
    message: string,
    data?: any,
  ) {
    const logData = {
      service: this.serviceName,
      message,
      timestamp: new Date().toISOString(),
      environment: API_CONFIG.IS_PRODUCTION ? "production" : "development",
      ...(data && { data }),
    };

    if (API_CONFIG.IS_PRODUCTION) {
      // Production: structured logging for monitoring
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.addBreadcrumb({
          message: `[${this.serviceName}] ${message}`,
          level,
          category: "api_service",
          data: logData,
        });
      }

      console[level](
        `[FAREDOWN_${this.serviceName.toUpperCase()}] ${message}`,
        logData,
      );
    } else {
      // Development: detailed console logging
      console[level](`🔧 [${this.serviceName}] ${message}`, logData);
    }
  }

  // Safe API call wrapper with consistent error handling
  protected async safeApiCall<T>(
    apiCall: () => Promise<T>,
    fallbackData?: T,
    endpoint?: string,
    operation?: string,
  ): Promise<T> {
    const operationDesc = operation || endpoint || "unknown operation";

    try {
      const response = await apiCall();

      // Handle different response structures
      if (response && typeof response === "object") {
        if ("success" in response && "data" in response) {
          if ((response as any).success) {
            this.logServiceEvent("info", `${operationDesc} successful`);
            return (response as any).data;
          } else {
            this.logServiceEvent(
              "warn",
              `${operationDesc} returned success=false`,
              response,
            );
            return fallbackData || response;
          }
        }

        if (
          "data" in response &&
          typeof (response as any).data === "object" &&
          "success" in (response as any).data
        ) {
          const innerData = (response as any).data;
          if (innerData.success) {
            this.logServiceEvent(
              "info",
              `${operationDesc} successful (nested)`,
            );
            return innerData.data;
          } else {
            this.logServiceEvent(
              "warn",
              `${operationDesc} nested success=false`,
              response,
            );
            return fallbackData || response;
          }
        }
      }

      this.logServiceEvent("info", `${operationDesc} successful (direct)`);
      return response;
    } catch (error) {
      // Enhanced error categorization
      if (error instanceof Error) {
        if (
          error.name === "TypeError" ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("Service unavailable")
        ) {
          this.logServiceEvent(
            "warn",
            `${operationDesc} - network unavailable, using fallback`,
            {
              error: error.message,
              hasFallback: fallbackData !== undefined,
            },
          );

          if (fallbackData !== undefined) {
            return fallbackData;
          }
        } else {
          this.logServiceEvent("error", `${operationDesc} failed`, {
            error: error.message,
            stack: API_CONFIG.IS_PRODUCTION ? undefined : error.stack,
          });
        }
      }

      // Production: don't silently swallow non-network errors
      if (API_CONFIG.IS_PRODUCTION && fallbackData === undefined) {
        throw error;
      }

      // Development or has fallback: return safe default
      if (fallbackData !== undefined) {
        return fallbackData;
      }

      throw error;
    }
  }

  // GET request with enhanced error handling
  protected async safeGet<T>(
    endpoint: string,
    params?: Record<string, any>,
    fallbackData?: T,
  ): Promise<T> {
    return this.safeApiCall(
      () => apiClient.get<T>(`${this.baseEndpoint}${endpoint}`, params),
      fallbackData,
      `GET ${this.baseEndpoint}${endpoint}`,
    );
  }

  // POST request with enhanced error handling
  protected async safePost<T>(
    endpoint: string,
    data?: any,
    fallbackData?: T,
    customHeaders?: Record<string, string>,
  ): Promise<T> {
    return this.safeApiCall(
      () =>
        apiClient.post<T>(
          `${this.baseEndpoint}${endpoint}`,
          data,
          customHeaders,
        ),
      fallbackData,
      `POST ${this.baseEndpoint}${endpoint}`,
    );
  }

  // PUT request with enhanced error handling
  protected async safePut<T>(
    endpoint: string,
    data?: any,
    fallbackData?: T,
  ): Promise<T> {
    return this.safeApiCall(
      () => apiClient.put<T>(`${this.baseEndpoint}${endpoint}`, data),
      fallbackData,
      `PUT ${this.baseEndpoint}${endpoint}`,
    );
  }

  // DELETE request with enhanced error handling
  protected async safeDelete<T>(
    endpoint: string,
    fallbackData?: T,
  ): Promise<T> {
    return this.safeApiCall(
      () => apiClient.delete<T>(`${this.baseEndpoint}${endpoint}`),
      fallbackData,
      `DELETE ${this.baseEndpoint}${endpoint}`,
    );
  }

  // Health check for this service
  async checkHealth(): Promise<boolean> {
    try {
      await this.safeGet("/health");
      return true;
    } catch {
      return false;
    }
  }

  // Get service configuration
  getServiceInfo() {
    return {
      serviceName: this.serviceName,
      baseEndpoint: this.baseEndpoint,
      isProduction: API_CONFIG.IS_PRODUCTION,
      offlineFallbackEnabled: API_CONFIG.OFFLINE_FALLBACK_ENABLED,
    };
  }
}

// Factory function to create enhanced API services
export function createEnhancedApiService<T extends Record<string, any>>(
  serviceName: string,
  baseEndpoint: string,
  serviceImplementation: (baseClass: EnhancedApiService) => T,
): T & EnhancedApiService {
  const baseService = new (class extends EnhancedApiService {
    constructor() {
      super(serviceName, baseEndpoint);
    }
  })();

  const implementation = serviceImplementation(baseService);

  // Merge the base service methods with the implementation
  return Object.assign(baseService, implementation) as T & EnhancedApiService;
}

// Common fallback data generators
export const createFallbackList = <T>(items: T[] = [], total: number = 0) => ({
  success: true,
  data: items,
  pagination: {
    page: 1,
    limit: 20,
    total,
    pages: Math.ceil(total / 20),
  },
  timestamp: new Date().toISOString(),
});

export const createFallbackItem = <T>(item: T) => ({
  success: true,
  data: item,
  timestamp: new Date().toISOString(),
});

export const createFallbackBoolean = (value: boolean = true) => ({
  success: value,
  timestamp: new Date().toISOString(),
});

// Error boundary for API components
export class ApiErrorBoundary extends Error {
  constructor(
    message: string,
    public service: string,
    public endpoint: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "ApiErrorBoundary";
  }
}

// Hook for API service health monitoring
export function useApiHealth(services: string[]) {
  const [healthStatus, setHealthStatus] = React.useState<
    Record<string, boolean>
  >({});
  const [isChecking, setIsChecking] = React.useState(false);

  const checkAllServices = React.useCallback(async () => {
    setIsChecking(true);
    const results: Record<string, boolean> = {};

    for (const service of services) {
      try {
        const response = await apiClient.get(`/${service}/health`);
        results[service] = response?.success || false;
      } catch {
        results[service] = false;
      }
    }

    setHealthStatus(results);
    setIsChecking(false);
  }, [services]);

  React.useEffect(() => {
    checkAllServices();

    // Check health every 5 minutes
    const interval = setInterval(checkAllServices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAllServices]);

  return { healthStatus, isChecking, recheckHealth: checkAllServices };
}

// React import for the hook (this would normally be at the top)
import React from "react";
