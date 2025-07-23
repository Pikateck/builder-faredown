/**
 * Development API Client with Offline Fallbacks
 * Used when the API server is not available
 */

import type { ApiResponse } from './api';

export class DevApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async quickConnectivityCheck(): Promise<boolean> {
    // For development mode, assume server is always offline to avoid fetch errors
    // This method exists for future enhancement but currently returns false
    // to force fallback mode and avoid any network requests
    return false;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // DevApiClient always uses fallback data to avoid fetch errors
    console.log(`🔄 FALLBACK: ${endpoint} (Live API unavailable - using mock data)`);
    return this.getFallbackData(endpoint, params) as T;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    // DevApiClient always uses fallback data to avoid fetch errors
    console.log(`🔄 FALLBACK POST: ${endpoint} (Live API unavailable - using mock data)`);
    return this.getFallbackData(endpoint, data) as T;
  }

  private getFallbackData(endpoint: string, params?: any): any {
    // Health check
    if (endpoint.includes('/health')) {
      return {
        status: 'development',
        database: 'offline (fallback mode)',
        timestamp: new Date().toISOString()
      };
    }

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
