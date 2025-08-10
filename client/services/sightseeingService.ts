/**
 * Sightseeing API Service
 * Handles sightseeing activities search and destination management using Hotelbeds Activities API
 */

import { apiClient, ApiResponse } from "@/lib/api";

// Types for sightseeing destinations
export interface SightseeingDestination {
  id: string;
  code: string;
  name: string;
  type: "city" | "region" | "country" | "destination";
  country: string;
  countryCode: string;
  popular?: boolean;
}

export interface SightseeingSearchRequest {
  destination: string;
  destinationCode: string;
  visitDate: string;
  endDate?: string;
  adults: number;
  children: number;
  experienceType?: string;
  duration?: string;
}

class SightseeingService {
  /**
   * Search destinations using Hotelbeds Activities API
   */
  async searchDestinations(
    query: string = "",
    limit: number = 10,
    popularOnly: boolean = false
  ): Promise<SightseeingDestination[]> {
    try {
      console.log(`🎯 Searching sightseeing destinations: "${query}"`);

      // Call the backend Hotelbeds Activities API
      const response = await apiClient.post<{
        success: boolean;
        data: { destinations: any[] };
      }>("/api/sightseeing/destinations", {
        query,
        limit,
        popularOnly,
      });

      if (!response.data.success) {
        console.warn("❌ Sightseeing destinations API failed");
        return this.getFallbackDestinations(query, limit);
      }

      const destinations = response.data.data.destinations.map((dest: any) => ({
        id: dest.code,
        code: dest.code,
        name: dest.name,
        type: dest.type || "destination",
        country: dest.countryName || dest.country,
        countryCode: dest.countryCode,
        popular: dest.popular || false,
      }));

      console.log(
        `✅ Found ${destinations.length} sightseeing destinations from API`
      );
      return destinations;
    } catch (error) {
      console.error("❌ Sightseeing destinations search error:", error);
      return this.getFallbackDestinations(query, limit);
    }
  }

  /**
   * Fallback destinations when API fails
   */
  private getFallbackDestinations(
    query: string = "",
    limit: number = 10
  ): SightseeingDestination[] {
    const fallbackDestinations: SightseeingDestination[] = [
      {
        id: "DXB",
        code: "DXB",
        name: "Dubai",
        type: "city",
        country: "United Arab Emirates",
        countryCode: "AE",
        popular: true,
      },
      {
        id: "LON",
        code: "LON",
        name: "London",
        type: "city",
        country: "United Kingdom",
        countryCode: "GB",
        popular: true,
      },
      {
        id: "PAR",
        code: "PAR",
        name: "Paris",
        type: "city",
        country: "France",
        countryCode: "FR",
        popular: true,
      },
      {
        id: "BCN",
        code: "BCN",
        name: "Barcelona",
        type: "city",
        country: "Spain",
        countryCode: "ES",
        popular: true,
      },
      {
        id: "NYC",
        code: "NYC",
        name: "New York",
        type: "city",
        country: "United States",
        countryCode: "US",
        popular: true,
      },
      {
        id: "BOM",
        code: "BOM",
        name: "Mumbai",
        type: "city",
        country: "India",
        countryCode: "IN",
        popular: true,
      },
      {
        id: "SIN",
        code: "SIN",
        name: "Singapore",
        type: "city",
        country: "Singapore",
        countryCode: "SG",
        popular: true,
      },
      {
        id: "BKK",
        code: "BKK",
        name: "Bangkok",
        type: "city",
        country: "Thailand",
        countryCode: "TH",
        popular: true,
      },
    ];

    // Filter based on query if provided
    if (query && query.length > 0) {
      const filtered = fallbackDestinations.filter(
        (dest) =>
          dest.name.toLowerCase().includes(query.toLowerCase()) ||
          dest.country.toLowerCase().includes(query.toLowerCase()) ||
          dest.code.toLowerCase().includes(query.toLowerCase())
      );
      return filtered.slice(0, limit);
    }

    return fallbackDestinations.slice(0, limit);
  }

  /**
   * Search sightseeing activities
   */
  async searchActivities(searchRequest: SightseeingSearchRequest) {
    try {
      console.log("🎯 Searching sightseeing activities:", searchRequest);

      const response = await apiClient.post("/api/sightseeing/search", {
        destination: searchRequest.destinationCode,
        checkIn: searchRequest.visitDate,
        checkOut: searchRequest.endDate,
        adults: searchRequest.adults,
        children: searchRequest.children,
        experienceType: searchRequest.experienceType,
        duration: searchRequest.duration,
      });

      return response.data;
    } catch (error) {
      console.error("❌ Sightseeing search error:", error);
      throw error;
    }
  }
}

export const sightseeingService = new SightseeingService();
