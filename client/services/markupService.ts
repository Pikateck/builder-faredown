/**
 * Markup Service
 * Handles all markup-related API operations for admin panel
 */

import { apiClient } from '@/lib/api';

export interface AirMarkup {
  id: string;
  name: string;
  description: string;
  airline: string;
  route: {
    from: string;
    to: string;
  };
  class: "economy" | "business" | "first" | "all";
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range (existing functionality)
  currentFareMin: number; // Min markup percentage for user-visible fare
  currentFareMax: number; // Max markup percentage for user-visible fare
  // New Bargain Fare Range fields
  bargainFareMin: number; // Min acceptable bargain percentage
  bargainFareMax: number; // Max acceptable bargain percentage
  validFrom: string;
  validTo: string;
  status: "active" | "inactive" | "expired";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelMarkup {
  id: string;
  name: string;
  description: string;
  city: string;
  hotelName: string;
  hotelChain: string;
  starRating: string;
  roomCategory: string;
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range (for dynamic pricing display)
  currentFareMin: number; // Min markup percentage for user-visible hotel rates
  currentFareMax: number; // Max markup percentage for user-visible hotel rates
  // Bargain Fare Range (for user-entered price validation)
  bargainFareMin: number; // Min acceptable bargain percentage for hotels
  bargainFareMax: number; // Max acceptable bargain percentage for hotels
  validFrom: string;
  validTo: string;
  seasonType: "Peak Season" | "Off Season" | "Regular";
  applicableDays: string[];
  minStay: number;
  maxStay: number;
  status: "active" | "inactive" | "expired";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAirMarkupRequest {
  name: string;
  description: string;
  airline: string;
  route: {
    from: string;
    to: string;
  };
  class: "economy" | "business" | "first" | "all";
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range fields
  currentFareMin: number; // Min markup percentage for user-visible fare
  currentFareMax: number; // Max markup percentage for user-visible fare
  // Bargain Fare Range fields
  bargainFareMin: number; // Min acceptable bargain percentage
  bargainFareMax: number; // Max acceptable bargain percentage
  validFrom: string;
  validTo: string;
  status: "active" | "inactive";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions?: string;
}

export interface CreateHotelMarkupRequest {
  name: string;
  description: string;
  city: string;
  hotelName: string;
  hotelChain: string;
  starRating: string;
  roomCategory: string;
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range fields
  currentFareMin: number; // Min markup percentage for user-visible hotel rates
  currentFareMax: number; // Max markup percentage for user-visible hotel rates
  // Bargain Fare Range fields
  bargainFareMin: number; // Min acceptable bargain percentage for hotels
  bargainFareMax: number; // Max acceptable bargain percentage for hotels
  validFrom: string;
  validTo: string;
  seasonType: "Peak Season" | "Off Season" | "Regular";
  applicableDays: string[];
  minStay: number;
  maxStay: number;
  status: "active" | "inactive";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions?: string;
}

export interface MarkupFilters {
  search?: string;
  airline?: string;
  class?: string;
  status?: string;
  city?: string;
  starRating?: string;
  page?: number;
  limit?: number;
}

class MarkupService {
  private baseUrl = '/api/markup';

  /**
   * Get all air markups with optional filters
   */
  async getAirMarkups(filters: MarkupFilters = {}): Promise<{
    markups: AirMarkup[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.airline && filters.airline !== 'all') params.append('airline', filters.airline);
      if (filters.class && filters.class !== 'all') params.append('class', filters.class);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}/air?${params.toString()}`);
      
      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch air markups');
      }
    } catch (error) {
      console.error('Error fetching air markups:', error);
      throw error;
    }
  }

  /**
   * Get all hotel markups with optional filters
   */
  async getHotelMarkups(filters: MarkupFilters = {}): Promise<{
    markups: HotelMarkup[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.city && filters.city !== 'all') params.append('city', filters.city);
      if (filters.starRating && filters.starRating !== 'all') params.append('starRating', filters.starRating);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}/hotel?${params.toString()}`);
      
      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch hotel markups');
      }
    } catch (error) {
      console.error('Error fetching hotel markups:', error);
      throw error;
    }
  }

  /**
   * Create a new air markup
   */
  async createAirMarkup(markupData: CreateAirMarkupRequest): Promise<AirMarkup> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/air`, markupData);
      
      if (response.ok) {
        return response.data.markup;
      } else {
        throw new Error(response.error || 'Failed to create air markup');
      }
    } catch (error) {
      console.error('Error creating air markup:', error);
      throw error;
    }
  }

  /**
   * Create a new hotel markup
   */
  async createHotelMarkup(markupData: CreateHotelMarkupRequest): Promise<HotelMarkup> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/hotel`, markupData);
      
      if (response.ok) {
        return response.data.markup;
      } else {
        throw new Error(response.error || 'Failed to create hotel markup');
      }
    } catch (error) {
      console.error('Error creating hotel markup:', error);
      throw error;
    }
  }

  /**
   * Update an existing air markup
   */
  async updateAirMarkup(markupId: string, markupData: Partial<CreateAirMarkupRequest>): Promise<AirMarkup> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/air/${markupId}`, markupData);
      
      if (response.ok) {
        return response.data.markup;
      } else {
        throw new Error(response.error || 'Failed to update air markup');
      }
    } catch (error) {
      console.error('Error updating air markup:', error);
      throw error;
    }
  }

  /**
   * Update an existing hotel markup
   */
  async updateHotelMarkup(markupId: string, markupData: Partial<CreateHotelMarkupRequest>): Promise<HotelMarkup> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/hotel/${markupId}`, markupData);
      
      if (response.ok) {
        return response.data.markup;
      } else {
        throw new Error(response.error || 'Failed to update hotel markup');
      }
    } catch (error) {
      console.error('Error updating hotel markup:', error);
      throw error;
    }
  }

  /**
   * Delete an air markup
   */
  async deleteAirMarkup(markupId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/air/${markupId}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to delete air markup');
      }
    } catch (error) {
      console.error('Error deleting air markup:', error);
      throw error;
    }
  }

  /**
   * Delete a hotel markup
   */
  async deleteHotelMarkup(markupId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/hotel/${markupId}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to delete hotel markup');
      }
    } catch (error) {
      console.error('Error deleting hotel markup:', error);
      throw error;
    }
  }

  /**
   * Toggle markup status (active/inactive)
   */
  async toggleAirMarkupStatus(markupId: string): Promise<AirMarkup> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/air/${markupId}/toggle-status`);
      
      if (response.ok) {
        return response.data.markup;
      } else {
        throw new Error(response.error || 'Failed to toggle air markup status');
      }
    } catch (error) {
      console.error('Error toggling air markup status:', error);
      throw error;
    }
  }

  /**
   * Toggle hotel markup status (active/inactive)
   */
  async toggleHotelMarkupStatus(markupId: string): Promise<HotelMarkup> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/hotel/${markupId}/toggle-status`);
      
      if (response.ok) {
        return response.data.markup;
      } else {
        throw new Error(response.error || 'Failed to toggle hotel markup status');
      }
    } catch (error) {
      console.error('Error toggling hotel markup status:', error);
      throw error;
    }
  }

  /**
   * Calculate markup for a specific booking (used in bargain engine)
   */
  async calculateMarkup(bookingDetails: {
    type: 'air' | 'hotel';
    basePrice: number;
    // Air-specific
    airline?: string;
    route?: { from: string; to: string };
    class?: string;
    // Hotel-specific
    city?: string;
    hotelName?: string;
    starRating?: string;
    userType?: 'b2c' | 'b2b';
  }): Promise<{
    applicableMarkups: (AirMarkup | HotelMarkup)[];
    selectedMarkup: AirMarkup | HotelMarkup;
    markupAmount: number;
    finalPrice: number;
    markupRange: { min: number; max: number };
  }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/calculate`, bookingDetails);
      
      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to calculate markup');
      }
    } catch (error) {
      console.error('Error calculating markup:', error);
      throw error;
    }
  }
}

export const markupService = new MarkupService();
