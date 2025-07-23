/**
 * Development API Client with Offline Fallbacks
 * Used when the API server is not available
 */

import type { ApiResponse } from './api';

export class DevApiClient {
  private baseUrl: string;
  private serverAvailable: boolean | null = null;
  private lastCheck: number = 0;
  private checkInterval: number = 30000; // Check every 30 seconds

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async quickConnectivityCheck(): Promise<boolean> {
    const now = Date.now();

    // Use cached result if checked recently
    if (this.serverAvailable !== null && (now - this.lastCheck) < this.checkInterval) {
      return this.serverAvailable;
    }

    try {
      // Quick health check with very short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'HEAD', // Faster than GET
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.serverAvailable = response.ok;
      this.lastCheck = now;
      return this.serverAvailable;
    } catch {
      this.serverAvailable = false;
      this.lastCheck = now;
      return false;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // Quick connectivity check - if server is known to be down, skip the API call
    const isServerAvailable = await this.quickConnectivityCheck();

    if (!isServerAvailable) {
      console.log(`🔄 DevApiClient: Server offline, using fallback for ${endpoint}`);
      return this.getFallbackData(endpoint, params) as T;
    }

    try {
      // Try real API call
      const url = new URL(endpoint, this.baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      // Create timeout manually for better browser support
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Mark server as unavailable and use fallback
      this.serverAvailable = false;
      this.lastCheck = Date.now();

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`API call failed, using fallback data for ${endpoint}: ${errorMessage}`);

      return this.getFallbackData(endpoint, params) as T;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      // Create timeout manually for better browser support
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`API POST failed, using fallback for ${endpoint}: ${errorMessage}`);
      return this.getFallbackData(endpoint, data) as T;
    }
  }

  private getFallbackData(endpoint: string, params?: any): any {
    // Destinations search
    if (endpoint.includes('/destinations/search')) {
      const query = params?.q?.toLowerCase() || '';
      const destinations = [
        { id: "DXB", name: "Dubai", type: "city", country: "United Arab Emirates" },
        { id: "DXB-DT", name: "Downtown Dubai", type: "district", country: "Dubai, United Arab Emirates" },
        { id: "DXB-MAR", name: "Dubai Marina", type: "district", country: "Dubai, United Arab Emirates" },
        { id: "LON", name: "London", type: "city", country: "United Kingdom" },
        { id: "NYC", name: "New York", type: "city", country: "United States" },
        { id: "PAR", name: "Paris", type: "city", country: "France" },
        { id: "TOK", name: "Tokyo", type: "city", country: "Japan" },
        { id: "BOM", name: "Mumbai", type: "city", country: "India" },
        { id: "DEL", name: "Delhi", type: "city", country: "India" },
        { id: "BLR", name: "Bangalore", type: "city", country: "India" },
        { id: "MAA", name: "Chennai", type: "city", country: "India" },
        { id: "HYD", name: "Hyderabad", type: "city", country: "India" }
      ];

      const filtered = query 
        ? destinations.filter(d => 
            d.name.toLowerCase().includes(query) || 
            d.country.toLowerCase().includes(query)
          )
        : destinations.slice(0, 5);

      return {
        success: true,
        data: filtered,
        message: 'Fallback destinations (API offline)'
      };
    }

    // Hotel search
    if (endpoint.includes('/hotels/search')) {
      return {
        success: true,
        data: [],
        message: 'API server offline - using fallback data in HotelResults',
        totalResults: 0
      };
    }

    // Default fallback
    return {
      success: false,
      error: 'API server offline',
      data: null,
      message: 'Development mode - API server not available'
    };
  }
}
