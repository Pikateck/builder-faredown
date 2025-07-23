/**
 * Hotels API Service
 * Handles hotel search, booking, and management
 */

import { apiClient, ApiResponse, PaginatedResponse } from "@/lib/api";

// Types
export interface HotelSearchRequest {
  destination: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  priceRange?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  rating?: number;
  sortBy?: "price" | "rating" | "distance" | "popularity";
  currencyCode?: string;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: Address;
  location: Location;
  rating: number;
  starRating: number;
  reviewCount: number;
  images: HotelImage[];
  amenities: Amenity[];
  roomTypes: RoomType[];
  policies: HotelPolicies;
  contact: ContactInfo;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  landmarks: Landmark[];
}

export interface Landmark {
  name: string;
  distance: number;
  type: "airport" | "attraction" | "shopping" | "restaurant" | "transport";
}

export interface HotelImage {
  id: string;
  url: string;
  caption: string;
  type: "exterior" | "interior" | "room" | "amenity" | "dining";
  order: number;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: "general" | "business" | "wellness" | "dining" | "entertainment";
  available: boolean;
  fee?: number;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  size: string;
  bedTypes: string[];
  amenities: string[];
  images: string[];
  pricePerNight: number;
  availability: number;
  features: RoomFeature[];
}

export interface RoomFeature {
  name: string;
  icon: string;
  included: boolean;
}

export interface HotelPolicies {
  checkIn: string;
  checkOut: string;
  cancellation: string;
  children: string;
  pets: string;
  smoking: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  website?: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
}

export interface HotelBookingRequest {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  rooms: BookingRoom[];
  guestDetails: GuestDetails;
  specialRequests?: string;
  addOns?: BookingAddOn[];
}

export interface BookingRoom {
  roomTypeId: string;
  adults: number;
  children: number;
  childrenAges?: number[];
}

export interface GuestDetails {
  primaryGuest: Guest;
  additionalGuests?: Guest[];
  contactInfo: ContactInfo;
}

export interface Guest {
  title: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface BookingAddOn {
  type: "breakfast" | "spa" | "parking" | "wifi" | "airport_transfer";
  id: string;
  quantity: number;
  price: number;
}

export interface HotelBooking {
  id: string;
  bookingRef: string;
  status:
    | "pending"
    | "confirmed"
    | "cancelled"
    | "completed"
    | "checked_in"
    | "checked_out";
  hotel: Hotel;
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  rooms: BookingRoom[];
  guests: Guest[];
  totalPrice: {
    subtotal: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
  };
  specialRequests?: string;
  addOns: BookingAddOn[];
  createdAt: string;
  updatedAt: string;
}

export interface HotelReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  roomType?: string;
  stayDate: string;
  createdAt: string;
  helpful: number;
}

// Hotels Service Class
export class HotelsService {
  private readonly baseUrl = "/api/hotels";

  /**
   * Search for hotels using Hotelbeds integration (tries live data first, then fallback)
   */
  async searchHotels(searchParams: HotelSearchRequest): Promise<Hotel[]> {
    try {
      // First try live API
      const liveResults = await this.searchHotelsLive(searchParams);
      if (liveResults.length > 0) {
        console.log('✅ Using live Hotelbeds data:', liveResults.length, 'hotels');
        return liveResults;
      }

      // If no live results, fall back to regular API (which may use mock data)
      console.log('⚠️ No live data available, using fallback');
      return await this.searchHotelsFallback(searchParams);
    } catch (error) {
      console.error('Hotel search error:', error);
      return [];
    }
  }

  /**
   * Search hotels using live API endpoint (bypasses production fallback)
   */
  async searchHotelsLive(searchParams: HotelSearchRequest): Promise<Hotel[]> {
    try {
      const queryParams = {
        destination: searchParams.destination,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        rooms: searchParams.rooms || 1,
        adults: searchParams.adults || 2,
        children: searchParams.children || 0,
        currency: searchParams.currencyCode || 'INR'
      };

      // Check if we're in production environment
      const isProduction = window.location.hostname !== "localhost";

      if (isProduction) {
        // In production, skip live API calls to avoid errors
        console.log('🚫 Skipping live API in production environment');
        return [];
      }

      // Direct fetch to bypass API client fallback mode (only in development)
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/hotels-live/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.isLiveData) {
          console.log('🔴 Live Hotelbeds data received:', data.data.length, 'hotels');
          return data.data;
        }
      }

      return [];
    } catch (error) {
      console.warn('Live hotel search failed:', error);
      return [];
    }
  }

  /**
   * Fallback hotel search using regular API
   */
  async searchHotelsFallback(searchParams: HotelSearchRequest): Promise<Hotel[]> {
    try {
      const queryParams = {
        destination: searchParams.destination,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        rooms: searchParams.rooms || 1,
        adults: searchParams.adults || 2,
        children: searchParams.children || 0,
        currency: searchParams.currencyCode || 'INR'
      };

      const response = await apiClient.get<ApiResponse<Hotel[]>>(
        `${this.baseUrl}/search`,
        queryParams,
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Fallback hotel search error:', error);
      return [];
    }
  }

  /**
   * Get hotel details by ID with Hotelbeds integration
   */
  async getHotelDetails(hotelId: string, searchParams?: {
    checkIn?: string;
    checkOut?: string;
    rooms?: number;
    adults?: number;
    children?: number;
  }): Promise<Hotel> {
    try {
      const queryParams = searchParams || {};
      const response = await apiClient.get<ApiResponse<Hotel>>(
        `${this.baseUrl}/${hotelId}`,
        queryParams
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error("Hotel not found");
    } catch (error) {
      console.error('Hotel details error:', error);
      throw new Error("Failed to get hotel details");
    }
  }

  /**
   * Get room availability and pricing with Hotelbeds integration
   */
  async getRoomAvailability(
    hotelId: string,
    checkIn: string,
    checkOut: string,
    rooms: number,
    adults: number,
    children: number,
  ): Promise<RoomType[]> {
    try {
      const response = await apiClient.get<ApiResponse<RoomType[]>>(
        `${this.baseUrl}/${hotelId}/availability`,
        {
          checkIn,
          checkOut,
          rooms,
          adults,
          children,
        },
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Room availability error:', error);
      throw new Error("Failed to get room availability");
    }
  }

  /**
   * Book a hotel
   */
  async bookHotel(bookingData: HotelBookingRequest): Promise<HotelBooking> {
    const response = await apiClient.post<ApiResponse<HotelBooking>>(
      `${this.baseUrl}/book`,
      bookingData,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to book hotel");
  }

  /**
   * Get user's hotel bookings
   */
  async getUserBookings(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<HotelBooking>> {
    return apiClient.get<PaginatedResponse<HotelBooking>>(
      `${this.baseUrl}/bookings`,
      { page, limit },
    );
  }

  /**
   * Get booking details by reference
   */
  async getBookingDetails(bookingRef: string): Promise<HotelBooking> {
    const response = await apiClient.get<ApiResponse<HotelBooking>>(
      `${this.baseUrl}/bookings/${bookingRef}`,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get booking details");
  }

  /**
   * Cancel a hotel booking
   */
  async cancelBooking(bookingRef: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/bookings/${bookingRef}`);
  }

  /**
   * Get hotel reviews
   */
  async getHotelReviews(
    hotelId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<HotelReview>> {
    return apiClient.get<PaginatedResponse<HotelReview>>(
      `${this.baseUrl}/${hotelId}/reviews`,
      { page, limit },
    );
  }

  /**
   * Submit a hotel review
   */
  async submitReview(
    hotelId: string,
    review: {
      rating: number;
      title: string;
      comment: string;
      pros?: string[];
      cons?: string[];
      roomType?: string;
    },
  ): Promise<HotelReview> {
    const response = await apiClient.post<ApiResponse<HotelReview>>(
      `${this.baseUrl}/${hotelId}/reviews`,
      review,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to submit review");
  }

  /**
   * Get popular destinations
   */
  async getPopularDestinations(): Promise<
    {
      id: string;
      name: string;
      country: string;
      image: string;
      hotelCount: number;
    }[]
  > {
    const response = await apiClient.get<
      ApiResponse<
        {
          id: string;
          name: string;
          country: string;
          image: string;
          hotelCount: number;
        }[]
      >
    >(`${this.baseUrl}/destinations/popular`);

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get popular destinations");
  }

  /**
   * Search destinations with Hotelbeds integration
   */
  async searchDestinations(query: string): Promise<
    {
      id: string;
      name: string;
      type: "city" | "region" | "country" | "landmark";
      country: string;
    }[]
  > {
    try {
      // First try live API
      const liveResults = await this.searchDestinationsLive(query);
      if (liveResults.length > 0) {
        console.log('✅ Using live destination data:', liveResults.length, 'destinations');
        return liveResults;
      }

      // Fall back to regular API
      console.log('⚠️ No live destination data, using fallback');
      const response = await apiClient.get<
        ApiResponse<
          {
            id: string;
            name: string;
            type: "city" | "region" | "country" | "landmark";
            country: string;
          }[]
        >
      >(`${this.baseUrl}/destinations/search`, { q: query });

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Destination search error:', error);
      // Return popular destinations as fallback instead of throwing
      return [
        { id: "DXB", name: "Dubai", type: "city", country: "United Arab Emirates" },
        { id: "LON", name: "London", type: "city", country: "United Kingdom" },
        { id: "NYC", name: "New York", type: "city", country: "United States" },
        { id: "PAR", name: "Paris", type: "city", country: "France" },
        { id: "TOK", name: "Tokyo", type: "city", country: "Japan" },
        { id: "BOM", name: "Mumbai", type: "city", country: "India" },
        { id: "DEL", name: "Delhi", type: "city", country: "India" },
        { id: "BLR", name: "Bangalore", type: "city", country: "India" }
      ].filter(dest => dest.name.toLowerCase().includes(query.toLowerCase()));
    }
  }

  /**
   * Search destinations using live API endpoint
   */
  async searchDestinationsLive(query: string): Promise<
    {
      id: string;
      name: string;
      type: "city" | "region" | "country" | "landmark";
      country: string;
    }[]
  > {
    try {
      // Check if we're in production environment
      const isProduction = window.location.hostname !== "localhost";

      if (isProduction) {
        // In production, skip live API calls to avoid errors
        console.log('🚫 Skipping live destination API in production environment');
        return [];
      }

      // Direct fetch to bypass API client fallback mode (only in development)
      const response = await fetch(`/api/hotels-live/destinations/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.isLiveData) {
          console.log('🔴 Live destination data received:', data.data.length, 'destinations');
          return data.data;
        }
      }

      return [];
    } catch (error) {
      console.warn('Live destination search failed:', error);
      return [];
    }
  }

  /**
   * Get hotel amenities list
   */
  async getAmenities(): Promise<Amenity[]> {
    const response = await apiClient.get<ApiResponse<Amenity[]>>(
      `${this.baseUrl}/amenities`,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get amenities");
  }

  /**
   * Sync hotel content for destinations (Admin only)
   */
  async syncHotelContent(destinationCodes: string[], forceSync = false): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/sync`,
        { destinationCodes, forceSync }
      );

      if (response.success) {
        return response.data;
      }

      throw new Error("Sync failed");
    } catch (error) {
      console.error('Hotel sync error:', error);
      throw new Error("Failed to sync hotel content");
    }
  }

  /**
   * Get cache statistics (Admin only)
   */
  async getCacheStats(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.baseUrl}/cache/stats`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {};
    } catch (error) {
      console.error('Cache stats error:', error);
      throw new Error("Failed to get cache statistics");
    }
  }

  /**
   * Clear hotel cache (Admin only)
   */
  async clearCache(): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/cache`);
    } catch (error) {
      console.error('Clear cache error:', error);
      throw new Error("Failed to clear cache");
    }
  }
}

// Export singleton instance
export const hotelsService = new HotelsService();
export default hotelsService;
