/**
 * Sightseeing API Service
 * Handles sightseeing activity search, booking, and management
 * Integrated with Hotelbeds Activities API
 */

import { apiClient, ApiResponse, PaginatedResponse } from "@/lib/api";

// Types
export interface SightseeingSearchRequest {
  destination: string;
  dateFrom: string;
  dateTo?: string;
  adults: number;
  children: number;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  duration?: string;
  sortBy?: "price" | "rating" | "duration" | "popularity";
  currencyCode?: string;
  promoCode?: string;
  userId?: string;
}

export interface Activity {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ActivityCategory;
  destination: ActivityDestination;
  location: ActivityLocation;
  duration: ActivityDuration;
  images: ActivityImage[];
  highlights: string[];
  includes: string[];
  excludes: string[];
  importantInfo: string[];
  cancellationPolicy: string;
  rating: number;
  reviewCount: number;
  languages: string[];
  modalities: ActivityModality[];
  pricing: ActivityPricing;
  hotelbedsCode: string;
  hotelbedsData: any; // Store original data for booking
}

export interface ActivityCategory {
  id: string;
  name: string;
  icon: string;
}

export interface ActivityDestination {
  code: string;
  name: string;
  country: string;
}

export interface ActivityLocation {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface ActivityDuration {
  value: number;
  metric: "HOURS" | "DAYS" | "MINUTES";
}

export interface ActivityImage {
  id: string;
  url: string;
  caption: string;
  type: string;
  order: number;
}

export interface ActivityModality {
  id: string;
  code: string;
  name: string;
  description: string;
  duration: ActivityDuration;
  rates: ActivityRate[];
}

export interface ActivityRate {
  id: string;
  rateKey: string;
  rateType: string;
  price: ActivityPrice;
  cancellationPolicies: any[];
  sessions: any[];
}

export interface ActivityPrice {
  amount: number;
  originalAmount: number;
  currency: string;
  breakdown: ActivityPriceBreakdown;
}

export interface ActivityPriceBreakdown {
  basePrice: number;
  taxes: number;
  fees: number;
  markup: number;
  total: number;
}

export interface ActivityPricing {
  originalPrice: number;
  markedUpPrice: number;
  finalPrice: number;
  discount: number;
  currency: string;
  markupApplied: any;
  promoApplied: boolean;
  promoDetails?: any;
}

export interface ActivityBookingRequest {
  activityId: string;
  modalityCode: string;
  rateKey: string;
  participants: Participant[];
  contactInfo: ContactInfo;
  sessionDate: string;
  sessionTime?: string;
}

export interface Participant {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  email?: string;
  phone?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface ActivityBooking {
  id: string;
  bookingRef: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  activity: Activity;
  participants: Participant[];
  totalPrice: ActivityPrice;
  createdAt: string;
  updatedAt: string;
}

// Sightseeing Service Class
export class SightseeingService {
  private readonly baseUrl = "/api/sightseeing-search";

  /**
   * Search for activities using live Hotelbeds Activities API
   */
  async searchActivities(
    searchParams: SightseeingSearchRequest,
  ): Promise<Activity[]> {
    console.log(
      "🎯 Searching activities with Hotelbeds Activities API:",
      searchParams,
    );

    // Map frontend params to backend API format
    const apiParams = {
      destination: searchParams.destination,
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo || searchParams.dateFrom,
      adults: searchParams.adults,
      children: searchParams.children || 0,
      category: searchParams.category,
      promoCode: searchParams.promoCode,
      userId: searchParams.userId,
    };

    const response = await apiClient.get<ApiResponse<Activity[]>>(
      `${this.baseUrl}/search`,
      apiParams,
    );

    // Handle both direct API response and wrapped response
    if (response.success && response.data) {
      console.log(`✅ Found ${response.data.length} activities from API`);
      return response.data;
    } else if (response.data && Array.isArray(response.data)) {
      // Handle case where data is directly an array
      console.log(`✅ Found ${response.data.length} activities from API`);
      return response.data;
    } else if ((response as any).length) {
      // Handle case where response itself is the array
      console.log(`✅ Found ${(response as any).length} activities from API`);
      return response as any;
    }

    console.error("❌ Invalid API response structure:", response);
    throw new Error("Failed to search activities - invalid response structure");
  }

  /**
   * Get activity details by code
   */
  async getActivityDetails(activityCode: string): Promise<Activity> {
    console.log(`🎯 Getting activity details for: ${activityCode}`);

    const response = await apiClient.get<ApiResponse<Activity>>(
      `${this.baseUrl}/details/${activityCode}`,
    );

    console.log("✅ Activity details response:", response);

    // Handle both wrapped response and direct response
    if (response && response.success && response.data) {
      return response.data;
    } else if (response && response.data) {
      // Handle case where data is directly the activity object
      return response.data;
    } else if (response && typeof response === "object" && response.id) {
      // Handle case where response itself is the activity object
      return response as Activity;
    }

    console.error("❌ Invalid activity details response:", response);
    throw new Error("Failed to get activity details");
  }

  /**
   * Get available sessions for an activity
   */
  async getActivitySessions(
    activityCode: string,
    modalityCode: string,
    date: string,
  ): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `${this.baseUrl}/${activityCode}/sessions`,
      {
        modalityCode,
        date,
      },
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get activity sessions");
  }

  /**
   * Get activity prices for multiple dates
   */
  async getActivityPrices(
    activityCode: string,
    modalityCode: string,
    dateRange: string[],
  ): Promise<Record<string, number>> {
    const response = await apiClient.get<ApiResponse<Record<string, number>>>(
      `${this.baseUrl}/${activityCode}/prices`,
      {
        modalityCode,
        dates: dateRange.join(","),
      },
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get activity prices");
  }

  /**
   * Book an activity
   */
  async bookActivity(
    bookingRequest: ActivityBookingRequest,
  ): Promise<ActivityBooking> {
    console.log("🎯 Booking activity:", bookingRequest);

    const response = await apiClient.post<ApiResponse<ActivityBooking>>(
      `${this.baseUrl}/book`,
      bookingRequest,
    );

    if (response.data) {
      console.log("✅ Activity booked successfully");
      return response.data;
    }

    throw new Error("Failed to book activity");
  }

  /**
   * Get booking details
   */
  async getBookingDetails(bookingRef: string): Promise<ActivityBooking> {
    const response = await apiClient.get<ApiResponse<ActivityBooking>>(
      `${this.baseUrl}/bookings/${bookingRef}`,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get booking details");
  }

  /**
   * Cancel activity booking
   */
  async cancelBooking(bookingRef: string, reason?: string): Promise<boolean> {
    console.log(`🎯 Cancelling activity booking: ${bookingRef}`);

    const response = await apiClient.delete<ApiResponse<boolean>>(
      `${this.baseUrl}/bookings/${bookingRef}`,
      { reason },
    );

    if (response.success) {
      console.log("✅ Activity booking cancelled successfully");
      return true;
    }

    throw new Error("Failed to cancel booking");
  }

  /**
   * Get user's activity bookings
   */
  async getUserBookings(userId: string): Promise<ActivityBooking[]> {
    const response = await apiClient.get<ApiResponse<ActivityBooking[]>>(
      `${this.baseUrl}/users/${userId}/bookings`,
    );

    if (response.data) {
      return response.data;
    }

    return [];
  }

  /**
   * Search activities by category
   */
  async searchByCategory(
    destination: string,
    category: string,
    date: string,
  ): Promise<Activity[]> {
    return this.searchActivities({
      destination,
      dateFrom: date,
      adults: 2,
      children: 0,
      category,
    });
  }

  /**
   * Get popular activities for a destination
   */
  async getPopularActivities(destination: string): Promise<Activity[]> {
    const response = await apiClient.get<ApiResponse<Activity[]>>(
      `${this.baseUrl}/popular`,
      { destination },
    );

    if (response.data) {
      return response.data;
    }

    return [];
  }

  /**
   * Get activity categories for a destination
   */
  async getCategories(destination: string): Promise<ActivityCategory[]> {
    const response = await apiClient.get<ApiResponse<ActivityCategory[]>>(
      `${this.baseUrl}/categories`,
      { destination },
    );

    if (response.data) {
      return response.data;
    }

    return [];
  }

  /**
   * Apply promo code to activity pricing
   */
  async applyPromoCode(
    activityId: string,
    modalityCode: string,
    promoCode: string,
    userId?: string,
  ): Promise<{
    success: boolean;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    promoDetails?: any;
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      `${this.baseUrl}/promo/apply`,
      {
        activityId,
        modalityCode,
        promoCode,
        userId,
      },
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to apply promo code");
  }

  /**
   * Get activity reviews
   */
  async getActivityReviews(activityCode: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `${this.baseUrl}/${activityCode}/reviews`,
    );

    if (response.data) {
      return response.data;
    }

    return [];
  }

  /**
   * Get static mock activities for fallback
   */
  getStaticMockActivities(searchParams: SightseeingSearchRequest): Activity[] {
    return [
      {
        id: "mock_activity_1",
        code: "CITY_TOUR_001",
        name: "Historic City Walking Tour",
        description: "Explore the historic center with a professional guide",
        category: {
          id: "TOURS",
          name: "City Tours",
          icon: "map",
        },
        destination: {
          code: searchParams.destination,
          name: searchParams.destination,
          country: "UAE",
        },
        location: {
          address: "City Center",
          coordinates: {
            latitude: 25.2048,
            longitude: 55.2708,
          },
        },
        duration: {
          value: 3,
          metric: "HOURS",
        },
        images: [
          {
            id: "img_1",
            url: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fsightseeing-placeholder",
            caption: "City Tour",
            type: "main",
            order: 1,
          },
        ],
        highlights: [
          "Professional local guide",
          "Small group experience",
          "Historic landmarks",
          "Photo opportunities",
        ],
        includes: ["Professional guide", "Walking tour", "Historical insights"],
        excludes: ["Food and beverages", "Transportation", "Entrance fees"],
        importantInfo: [
          "Comfortable walking shoes recommended",
          "Weather dependent",
        ],
        cancellationPolicy: "Free cancellation up to 24 hours before",
        rating: 4.5,
        reviewCount: 128,
        languages: ["English", "Arabic"],
        modalities: [
          {
            id: "mod_1",
            code: "STANDARD",
            name: "Standard Tour",
            description: "Regular walking tour",
            duration: {
              value: 3,
              metric: "HOURS",
            },
            rates: [
              {
                id: "rate_1",
                rateKey: "STD_RATE",
                rateType: "PER_PERSON",
                price: {
                  amount: 5000,
                  originalAmount: 4000,
                  currency: "INR",
                  breakdown: {
                    basePrice: 4000,
                    taxes: 600,
                    fees: 400,
                    markup: 1000,
                    total: 5000,
                  },
                },
                cancellationPolicies: [],
                sessions: [],
              },
            ],
          },
        ],
        pricing: {
          originalPrice: 4000,
          markedUpPrice: 5000,
          finalPrice: 5000,
          discount: 0,
          currency: "INR",
          markupApplied: { markup_percentage: 25.0 },
          promoApplied: false,
        },
        hotelbedsCode: "CITY_TOUR_001",
        hotelbedsData: {},
      },
    ];
  }
}

// Create and export service instance
export const sightseeingService = new SightseeingService();

// Export types for use in components
export type {
  SightseeingSearchRequest,
  Activity,
  ActivityCategory,
  ActivityBookingRequest,
  ActivityBooking,
  Participant,
  ContactInfo,
};
