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
        console.log(
          "✅ Using live Hotelbeds data:",
          liveResults.length,
          "hotels",
        );
        return liveResults;
      }

      // If no live results, fall back to regular API (which may use mock data)
      console.log("⚠️ No live data available, using fallback");
      return await this.searchHotelsFallback(searchParams);
    } catch (error) {
      // Handle AbortError specifically to avoid console noise
      if (error instanceof Error && error.name === "AbortError") {
        console.log("⏰ Hotel search was aborted, returning empty results");
        return [];
      }
      console.error("Hotel search error:", error);
      return [];
    }
  }

  /**
   * Search hotels using database-cached live API endpoint
   */
  async searchHotelsLive(searchParams: HotelSearchRequest): Promise<Hotel[]> {
    try {
      // Check if we're in development environment
      const isDevelopment =
        typeof window !== "undefined" &&
        (window.location.hostname.includes("localhost") ||
          window.location.hostname.includes("127.0.0.1") ||
          window.location.hostname.includes(".dev") ||
          window.location.hostname.includes(".local") ||
          window.location.port !== "");

      if (isDevelopment) {
        console.log(
          "🔧 Development mode - skipping hotel search API call, using fallback",
        );
        return this.searchHotelsFallback(searchParams);
      }

      const queryParams = {
        destination: searchParams.destination,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        rooms: searchParams.rooms || 1,
        adults: searchParams.adults || 2,
        children: searchParams.children || 0,
        currency: searchParams.currencyCode || "INR",
      };

      console.log(
        "🔴 Searching live Hotelbeds API with database caching:",
        queryParams,
      );

      // Direct fetch with enhanced error handling and AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("⏰ Hotel search API request timeout - aborting");
        controller.abort();
      }, 10000); // 10 second timeout for hotel search

      try {
        const params = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });

        const response = await fetch(`/api/hotels-live/search?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (response.ok) {
          // Check if response is JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            let data;
            try {
              data = await response.json();
            } catch (jsonError) {
              if (
                jsonError instanceof Error &&
                jsonError.name === "AbortError"
              ) {
                console.log("⏰ Hotel search JSON parsing was aborted");
                return []; // Return empty array immediately on abort
              } else {
                console.warn(
                  "⚠️ Failed to parse JSON response:",
                  jsonError instanceof Error
                    ? jsonError.message
                    : "Unknown error",
                );
                return [];
              }
            }
            if (data.success && data.data) {
              const cacheStatus = data.isCached ? "Cached" : "Fresh";
              const dbStatus = data.searchMeta?.databaseConnected
                ? "Database"
                : "Fallback";

              console.log(
                `✅ ${cacheStatus} Hotelbeds data received (${dbStatus}):`,
                data.data.length,
                "hotels",
              );
              console.log(`   Source: ${data.source}`);
              console.log(
                `   Processing time: ${data.searchMeta?.processingTime}`,
              );

              return data.data;
            }
          } else {
            console.warn(
              "���️ Live API returned non-JSON response (likely HTML error page)",
            );
          }
        } else {
          console.warn(`⚠️ Live API returned status ${response.status}`);
        }
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          console.log("⏰ Hotel search API request was aborted");
          return []; // Return empty array immediately on abort
        } else {
          console.warn(
            "⚠️ Live hotel API fetch failed:",
            fetchError instanceof Error ? fetchError.message : "Unknown error",
          );
        }
      } finally {
        clearTimeout(timeoutId);
      }

      return [];
    } catch (error) {
      console.warn("Live hotel search failed:", error);
      return [];
    }
  }

  /**
   * Fallback hotel search using regular API
   */
  async searchHotelsFallback(
    searchParams: HotelSearchRequest,
  ): Promise<Hotel[]> {
    try {
      const queryParams = {
        destination: searchParams.destination,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        rooms: searchParams.rooms || 1,
        adults: searchParams.adults || 2,
        children: searchParams.children || 0,
        currency: searchParams.currencyCode || "INR",
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
      console.error("Fallback hotel search error:", error);
      return [];
    }
  }

  /**
   * Get hotel details by ID with Hotelbeds integration
   */
  async getHotelDetails(
    hotelId: string,
    searchParams?: {
      checkIn?: string;
      checkOut?: string;
      rooms?: number;
      adults?: number;
      children?: number;
    },
  ): Promise<Hotel> {
    try {
      const queryParams = searchParams || {};
      const response = await apiClient.get<ApiResponse<Hotel>>(
        `${this.baseUrl}/${hotelId}`,
        queryParams,
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error("Hotel not found");
    } catch (error) {
      console.error("Hotel details error:", error);
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
      console.error("Room availability error:", error);
      throw new Error("Failed to get room availability");
    }
  }

  /**
   * Book a hotel
   */
  async bookHotel(bookingData: HotelBookingRequest): Promise<HotelBooking> {
    try {
      const response = await apiClient.post<ApiResponse<HotelBooking>>(
        `${this.baseUrl}/book`,
        bookingData,
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error("Failed to book hotel");
    } catch (error) {
      console.error("Hotel booking error:", error);
      throw new Error("Failed to book hotel");
    }
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
      // First try live API with enhanced results
      let liveResults: any[] = [];
      try {
        liveResults = await this.searchDestinationsLive(query);
      } catch (liveError) {
        if (
          liveError instanceof Error &&
          (liveError.message.includes("Failed to fetch") ||
            liveError.name === "TypeError")
        ) {
          console.log(
            `🌐 Live API network error - continuing to fallback for query: "${query}"`,
          );
        } else if (
          liveError instanceof Error &&
          liveError.name === "AbortError"
        ) {
          console.log(`⏰ Live API aborted for query: "${query}"`);
          return [];
        } else {
          console.warn("Live API error:", liveError);
        }
        // Continue to fallback
        liveResults = [];
      }

      if (liveResults.length > 0) {
        console.log(
          "✅ Using live destination data:",
          liveResults.length,
          "destinations",
        );
        return liveResults;
      }

      // Fall back to regular API
      console.log("⚠️ No live destination data, using fallback API");
      try {
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
      } catch (apiError) {
        if (
          apiError instanceof Error &&
          (apiError.message.includes("Failed to fetch") ||
            apiError.name === "TypeError")
        ) {
          console.log(
            `🌐 Fallback API also failed - using hardcoded destinations for query: "${query}"`,
          );
        } else if (
          apiError instanceof Error &&
          apiError.name === "AbortError"
        ) {
          console.log(`⏰ Fallback API aborted for query: "${query}"`);
          return [];
        } else {
          console.warn("Fallback API error:", apiError);
        }
      }

      // Return empty array and let outer catch handle with basic destinations
      return [];
    } catch (error) {
      // Handle network errors gracefully
      if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch") ||
          error.name === "TypeError")
      ) {
        console.log(
          `🌐 All network requests failed - using emergency destinations for query: "${query}"`,
        );
      } else if (error instanceof Error && error.name === "AbortError") {
        console.log(`⏰ Destination search was aborted for query: "${query}"`);
        return [];
      } else {
        console.error("Destination search error:", error);
      }
      // Enhanced fallback with database-style format
      return [
        {
          id: "DXB",
          name: "Dubai",
          type: "city",
          country: "United Arab Emirates",
          code: "DXB",
          popular: true,
        },
        {
          id: "LON",
          name: "London",
          type: "city",
          country: "United Kingdom",
          code: "LON",
          popular: true,
        },
        {
          id: "NYC",
          name: "New York",
          type: "city",
          country: "United States",
          code: "NYC",
          popular: true,
        },
        {
          id: "PAR",
          name: "Paris",
          type: "city",
          country: "France",
          code: "PAR",
          popular: true,
        },
        {
          id: "TYO",
          name: "Tokyo",
          type: "city",
          country: "Japan",
          code: "TYO",
          popular: true,
        },
        {
          id: "BOM",
          name: "Mumbai",
          type: "city",
          country: "India",
          code: "BOM",
          popular: true,
        },
        {
          id: "DEL",
          name: "Delhi",
          type: "city",
          country: "India",
          code: "DEL",
          popular: true,
        },
        {
          id: "BLR",
          name: "Bangalore",
          type: "city",
          country: "India",
          code: "BLR",
          popular: true,
        },
        {
          id: "BCN",
          name: "Barcelona",
          type: "city",
          country: "Spain",
          code: "BCN",
          popular: true,
        },
        {
          id: "MAD",
          name: "Madrid",
          type: "city",
          country: "Spain",
          code: "MAD",
          popular: true,
        },
      ].filter((dest) => dest.name.toLowerCase().includes(query.toLowerCase()));
    }
  }

  /**
   * Search destinations using database-backed API endpoint with comprehensive fallbacks
   */
  async searchDestinationsLive(query: string): Promise<
    {
      id: string;
      name: string;
      type: "city" | "region" | "country" | "landmark";
      country: string;
      code?: string;
      flag?: string;
      popular?: boolean;
    }[]
  > {
    // Fallback destination data for production environments
    const fallbackDestinations = [
      {
        id: "DEL",
        name: "Delhi",
        type: "city" as const,
        country: "India",
        code: "DEL",
        flag: "🇮🇳",
        popular: true,
      },
      {
        id: "BOM",
        name: "Mumbai",
        type: "city" as const,
        country: "India",
        code: "BOM",
        flag: "🇮🇳",
        popular: true,
      },
      {
        id: "BLR",
        name: "Bangalore",
        type: "city" as const,
        country: "India",
        code: "BLR",
        flag: "🇮���",
        popular: true,
      },
      {
        id: "MAA",
        name: "Chennai",
        type: "city" as const,
        country: "India",
        code: "MAA",
        flag: "🇮🇳",
        popular: true,
      },
      {
        id: "CCU",
        name: "Kolkata",
        type: "city" as const,
        country: "India",
        code: "CCU",
        flag: "🇮🇳",
        popular: true,
      },
      {
        id: "HYD",
        name: "Hyderabad",
        type: "city" as const,
        country: "India",
        code: "HYD",
        flag: "��🇳",
        popular: true,
      },
      {
        id: "PNQ",
        name: "Pune",
        type: "city" as const,
        country: "India",
        code: "PNQ",
        flag: "🇮🇳",
      },
      {
        id: "AMD",
        name: "Ahmedabad",
        type: "city" as const,
        country: "India",
        code: "AMD",
        flag: "🇮🇳",
      },
      {
        id: "COK",
        name: "Kochi",
        type: "city" as const,
        country: "India",
        code: "COK",
        flag: "🇮🇳",
      },
      {
        id: "GOI",
        name: "Goa",
        type: "city" as const,
        country: "India",
        code: "GOI",
        flag: "🇮🇳",
        popular: true,
      },
      {
        id: "JAI",
        name: "Jaipur",
        type: "city" as const,
        country: "India",
        code: "JAI",
        flag: "🇮🇳",
      },
      {
        id: "LKO",
        name: "Lucknow",
        type: "city" as const,
        country: "India",
        code: "LKO",
        flag: "🇮🇳",
      },
      {
        id: "SXR",
        name: "Kashmir",
        type: "region" as const,
        country: "India",
        code: "SXR",
        flag: "🇮🇳",
      },
      {
        id: "IXM",
        name: "Madurai",
        type: "city" as const,
        country: "India",
        code: "IXM",
        flag: "🇮🇳",
      },
      {
        id: "NAG",
        name: "Nagpur",
        type: "city" as const,
        country: "India",
        code: "NAG",
        flag: "🇮🇳",
      },
      {
        id: "BBI",
        name: "Bhubaneswar",
        type: "city" as const,
        country: "India",
        code: "BBI",
        flag: "🇮🇳",
      },
      {
        id: "RPR",
        name: "Raipur",
        type: "city" as const,
        country: "India",
        code: "RPR",
        flag: "🇮🇳",
      },
      {
        id: "VNS",
        name: "Varanasi",
        type: "city" as const,
        country: "India",
        code: "VNS",
        flag: "🇮🇳",
      },
      {
        id: "IXC",
        name: "Chandigarh",
        type: "city" as const,
        country: "India",
        code: "IXC",
        flag: "🇮🇳",
      },
      {
        id: "GAU",
        name: "Guwahati",
        type: "city" as const,
        country: "India",
        code: "GAU",
        flag: "🇮🇳",
      },
      {
        id: "IMP",
        name: "Imphal",
        type: "city" as const,
        country: "India",
        code: "IMP",
        flag: "🇮🇳",
      },
      {
        id: "IMF",
        name: "Agartala",
        type: "city" as const,
        country: "India",
        code: "IMF",
        flag: "🇮��",
      },
      {
        id: "SHL",
        name: "Shillong",
        type: "city" as const,
        country: "India",
        code: "SHL",
        flag: "🇮🇳",
      },
      {
        id: "DXB",
        name: "Dubai",
        type: "city" as const,
        country: "UAE",
        code: "DXB",
        flag: "🇦🇪",
        popular: true,
      },
      {
        id: "AUH",
        name: "Abu Dhabi",
        type: "city" as const,
        country: "UAE",
        code: "AUH",
        flag: "🇦🇪",
      },
      {
        id: "DOH",
        name: "Doha",
        type: "city" as const,
        country: "Qatar",
        code: "DOH",
        flag: "����🇦",
      },
      {
        id: "KWI",
        name: "Kuwait City",
        type: "city" as const,
        country: "Kuwait",
        code: "KWI",
        flag: "🇰🇼",
      },
      {
        id: "RUH",
        name: "Riyadh",
        type: "city" as const,
        country: "Saudi Arabia",
        code: "RUH",
        flag: "🇸🇦",
      },
      {
        id: "JED",
        name: "Jeddah",
        type: "city" as const,
        country: "Saudi Arabia",
        code: "JED",
        flag: "����🇦",
      },
      {
        id: "LHR",
        name: "London",
        type: "city" as const,
        country: "United Kingdom",
        code: "LHR",
        flag: "🇬🇧",
        popular: true,
      },
      {
        id: "CDG",
        name: "Paris",
        type: "city" as const,
        country: "France",
        code: "CDG",
        flag: "����🇷",
        popular: true,
      },
      {
        id: "FRA",
        name: "Frankfurt",
        type: "city" as const,
        country: "Germany",
        code: "FRA",
        flag: "🇩🇪",
      },
      {
        id: "AMS",
        name: "Amsterdam",
        type: "city" as const,
        country: "Netherlands",
        code: "AMS",
        flag: "🇳🇱",
      },
      {
        id: "ZUR",
        name: "Zurich",
        type: "city" as const,
        country: "Switzerland",
        code: "ZUR",
        flag: "🇨🇭",
      },
      {
        id: "VIE",
        name: "Vienna",
        type: "city" as const,
        country: "Austria",
        code: "VIE",
        flag: "🇦🇹",
      },
      {
        id: "BRU",
        name: "Brussels",
        type: "city" as const,
        country: "Belgium",
        code: "BRU",
        flag: "🇧🇪",
      },
      {
        id: "CPH",
        name: "Copenhagen",
        type: "city" as const,
        country: "Denmark",
        code: "CPH",
        flag: "🇩🇰",
      },
      {
        id: "ARN",
        name: "Stockholm",
        type: "city" as const,
        country: "Sweden",
        code: "ARN",
        flag: "🇸🇪",
      },
      {
        id: "OSL",
        name: "Oslo",
        type: "city" as const,
        country: "Norway",
        code: "OSL",
        flag: "🇳🇴",
      },
      {
        id: "HEL",
        name: "Helsinki",
        type: "city" as const,
        country: "Finland",
        code: "HEL",
        flag: "����🇮",
      },
      {
        id: "JFK",
        name: "New York",
        type: "city" as const,
        country: "United States",
        code: "JFK",
        flag: "🇺🇸",
        popular: true,
      },
      {
        id: "LAX",
        name: "Los Angeles",
        type: "city" as const,
        country: "United States",
        code: "LAX",
        flag: "🇺🇸",
        popular: true,
      },
      {
        id: "ORD",
        name: "Chicago",
        type: "city" as const,
        country: "United States",
        code: "ORD",
        flag: "🇺🇸",
      },
      {
        id: "MIA",
        name: "Miami",
        type: "city" as const,
        country: "United States",
        code: "MIA",
        flag: "🇺🇸",
      },
      {
        id: "SFO",
        name: "San Francisco",
        type: "city" as const,
        country: "United States",
        code: "SFO",
        flag: "🇺🇸",
      },
      {
        id: "YYZ",
        name: "Toronto",
        type: "city" as const,
        country: "Canada",
        code: "YYZ",
        flag: "🇨🇦",
      },
      {
        id: "YVR",
        name: "Vancouver",
        type: "city" as const,
        country: "Canada",
        code: "YVR",
        flag: "🇨🇦",
      },
      {
        id: "SYD",
        name: "Sydney",
        type: "city" as const,
        country: "Australia",
        code: "SYD",
        flag: "🇦🇺",
        popular: true,
      },
      {
        id: "MEL",
        name: "Melbourne",
        type: "city" as const,
        country: "Australia",
        code: "MEL",
        flag: "🇦🇺",
      },
      {
        id: "PER",
        name: "Perth",
        type: "city" as const,
        country: "Australia",
        code: "PER",
        flag: "🇦🇺",
      },
      {
        id: "BNE",
        name: "Brisbane",
        type: "city" as const,
        country: "Australia",
        code: "BNE",
        flag: "🇦🇺",
      },
      {
        id: "AKL",
        name: "Auckland",
        type: "city" as const,
        country: "New Zealand",
        code: "AKL",
        flag: "🇳🇿",
      },
      {
        id: "NRT",
        name: "Tokyo",
        type: "city" as const,
        country: "Japan",
        code: "NRT",
        flag: "🇯🇵",
        popular: true,
      },
      {
        id: "KIX",
        name: "Osaka",
        type: "city" as const,
        country: "Japan",
        code: "KIX",
        flag: "🇯🇵",
      },
      {
        id: "ICN",
        name: "Seoul",
        type: "city" as const,
        country: "South Korea",
        code: "ICN",
        flag: "🇰🇷",
      },
      {
        id: "TPE",
        name: "Taipei",
        type: "city" as const,
        country: "Taiwan",
        code: "TPE",
        flag: "🇹🇼",
      },
      {
        id: "HKG",
        name: "Hong Kong",
        type: "city" as const,
        country: "Hong Kong",
        code: "HKG",
        flag: "🇭🇰",
        popular: true,
      },
      {
        id: "SIN",
        name: "Singapore",
        type: "city" as const,
        country: "Singapore",
        code: "SIN",
        flag: "🇸🇬",
        popular: true,
      },
      {
        id: "KUL",
        name: "Kuala Lumpur",
        type: "city" as const,
        country: "Malaysia",
        code: "KUL",
        flag: "🇲🇾",
      },
      {
        id: "BKK",
        name: "Bangkok",
        type: "city" as const,
        country: "Thailand",
        code: "BKK",
        flag: "🇹🇭",
        popular: true,
      },
      {
        id: "CGK",
        name: "Jakarta",
        type: "city" as const,
        country: "Indonesia",
        code: "CGK",
        flag: "🇮🇩",
      },
      {
        id: "MNL",
        name: "Manila",
        type: "city" as const,
        country: "Philippines",
        code: "MNL",
        flag: "🇵🇭",
      },
      {
        id: "PEK",
        name: "Beijing",
        type: "city" as const,
        country: "China",
        code: "PEK",
        flag: "🇨🇳",
      },
      {
        id: "PVG",
        name: "Shanghai",
        type: "city" as const,
        country: "China",
        code: "PVG",
        flag: "🇨🇳",
      },
      {
        id: "CAN",
        name: "Guangzhou",
        type: "city" as const,
        country: "China",
        code: "CAN",
        flag: "🇨🇳",
      },
      {
        id: "HND",
        name: "Haneda",
        type: "city" as const,
        country: "Japan",
        code: "HND",
        flag: "🇯🇵",
      },
    ];

    try {
      // Determine if we're in development environment
      const isDevelopment =
        typeof window !== "undefined" &&
        (window.location.hostname.includes("localhost") ||
          window.location.hostname.includes("127.0.0.1") ||
          window.location.hostname.includes(".dev") ||
          window.location.hostname.includes(".local") ||
          window.location.port !== "");

      let apiResults: any[] = [];
      let apiSuccess = false;

      // Skip API calls entirely in development mode to prevent "Failed to fetch" errors
      if (!isDevelopment) {
        // Try API only in production environments
        try {
          const apiUrl = `/api/hotels-live/destinations/search?q=${encodeURIComponent(query)}&limit=15`;
          console.log(
            `🔍 Searching destinations via production API: "${query}"`,
          );

          const controller = new AbortController();
          let isAborted = false;
          const timeoutId = setTimeout(() => {
            console.log("⏰ API request timeout - aborting");
            isAborted = true;
            controller.abort();
          }, 5000); // 5 second timeout

          let response;
          try {
            response = await fetch(apiUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              signal: controller.signal,
            }).catch((fetchErr) => {
              // Immediately catch any fetch errors to prevent unhandled promise rejections
              console.log(
                `🌐 Fetch promise rejected for query: "${query}":`,
                fetchErr.message,
              );
              throw fetchErr; // Re-throw to be handled by outer catch
            });

            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                try {
                  const data = await response.json();
                  if (data.success && data.data && Array.isArray(data.data)) {
                    apiResults = data.data;
                    apiSuccess = true;
                    console.log(
                      `✅ API destination data received: ${apiResults.length} destinations`,
                    );
                  }
                } catch (jsonError) {
                  if (
                    jsonError instanceof Error &&
                    jsonError.name === "AbortError"
                  ) {
                    console.log(
                      `⏰ JSON parsing was aborted for query: "${query}"`,
                    );
                    return []; // Return empty array immediately on abort
                  } else {
                    console.warn(
                      `⚠️ Failed to parse JSON response:`,
                      jsonError instanceof Error
                        ? jsonError.message
                        : "Unknown error",
                    );
                  }
                }
              }
            }
          } catch (fetchError) {
            if (
              fetchError instanceof Error &&
              fetchError.name === "AbortError"
            ) {
              if (isAborted) {
                console.log(
                  `⏰ API request was aborted (timeout) for query: "${query}"`,
                );
              } else {
                console.log(
                  `⏰ API request was aborted (cancelled) for query: "${query}"`,
                );
              }
              return []; // Return empty array immediately on abort
            } else if (
              fetchError instanceof Error &&
              (fetchError.message.includes("Failed to fetch") ||
                fetchError.name === "TypeError")
            ) {
              console.log(
                `🌐 Network connectivity issue - using fallback data for query: "${query}"`,
              );
              // Don't return here - let it fall through to use fallback data
            } else {
              console.warn(
                `⚠️ API fetch failed:`,
                fetchError instanceof Error
                  ? fetchError.message
                  : "Unknown error",
              );
            }
          } finally {
            clearTimeout(timeoutId);
          }
        } catch (fetchError) {
          if (fetchError instanceof Error && fetchError.name === "AbortError") {
            console.log(
              `⏰ API request was aborted (timeout or cancelled) for query: "${query}"`,
            );
            return []; // Return empty array immediately on abort
          } else if (
            fetchError instanceof Error &&
            (fetchError.message.includes("Failed to fetch") ||
              fetchError.name === "TypeError")
          ) {
            console.log(
              `���� Network connectivity issue (outer) - using fallback data for query: "${query}"`,
            );
            // Don't return here - let it fall through to use fallback data
          } else {
            console.warn(
              `⚠️ API fetch failed:`,
              fetchError instanceof Error
                ? fetchError.message
                : "Unknown error",
            );
          }
        }
      } else {
        console.log(
          `🔧 Development mode detected - skipping API call for query: "${query}"`,
        );
      }

      // Filter fallback data based on query
      const queryLower = query.toLowerCase().trim();
      let filteredResults: any[] = [];

      if (queryLower.length >= 1) {
        // Filter fallback destinations that match the query
        filteredResults = fallbackDestinations.filter(
          (dest) =>
            dest.name.toLowerCase().includes(queryLower) ||
            dest.country.toLowerCase().includes(queryLower) ||
            (dest.code && dest.code.toLowerCase().includes(queryLower)),
        );

        // Sort results: popular first, then alphabetically
        filteredResults.sort((a, b) => {
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return a.name.localeCompare(b.name);
        });

        // Limit to 15 results
        filteredResults = filteredResults.slice(0, 15);
      }

      // Use API results if available and successful, otherwise use filtered fallback
      const finalResults =
        apiSuccess && apiResults.length > 0 ? apiResults : filteredResults;

      if (!apiSuccess && filteredResults.length > 0) {
        console.log(
          `📦 Using fallback data: ${filteredResults.length} destinations found for "${query}"`,
        );
      }

      // Transform results to consistent format
      return finalResults.map((dest: any) => ({
        id:
          dest.code || dest.id || dest.name.replace(/\s+/g, "-").toLowerCase(),
        name: dest.name,
        type: (dest.type || "city") as
          | "city"
          | "region"
          | "country"
          | "landmark",
        country: dest.countryName || dest.country || "",
        code: dest.code,
        flag: dest.flag,
        popular: dest.popular || false,
      }));
    } catch (error) {
      // Handle AbortError specifically
      if (error instanceof Error && error.name === "AbortError") {
        console.log(`⏰ Main search was aborted for query: "${query}"`);
        return [];
      }

      // Handle network errors specifically to avoid noisy "Failed to fetch" errors
      if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch") ||
          error.name === "TypeError")
      ) {
        console.log(
          `🌐 Network error in searchDestinationsLive - using emergency fallback for query: "${query}"`,
        );
      } else {
        console.warn("Destination search encountered error:", error);
      }

      // Even in case of complete failure, return some popular destinations if query matches
      const queryLower = query.toLowerCase().trim();
      if (queryLower.length >= 1) {
        const emergencyResults = fallbackDestinations
          .filter(
            (dest) =>
              dest.name.toLowerCase().includes(queryLower) && dest.popular,
          )
          .slice(0, 5)
          .map((dest) => ({
            id: dest.code || dest.id,
            name: dest.name,
            type: dest.type,
            country: dest.country,
            code: dest.code,
            flag: dest.flag,
            popular: dest.popular,
          }));

        if (emergencyResults.length > 0) {
          console.log(
            `🚨 Emergency fallback: ${emergencyResults.length} popular destinations`,
          );
          return emergencyResults;
        }
      }

      return [];
    }
  }

  /**
   * Get hotel amenities list
   */
  async getAmenities(): Promise<Amenity[]> {
    try {
      const response = await apiClient.get<ApiResponse<Amenity[]>>(
        `${this.baseUrl}/amenities`,
      );

      if (response && response.data) {
        return response.data;
      }

      // Return default amenities if API fails
      return this.getDefaultAmenities();
    } catch (error) {
      // Handle AbortError specifically to avoid console noise
      if (error instanceof Error && error.name === "AbortError") {
        console.log("⏰ Amenities request was aborted, using defaults");
      } else {
        console.warn(
          "Failed to fetch amenities, using defaults:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
      return this.getDefaultAmenities();
    }
  }

  /**
   * Get default amenities list as fallback
   */
  private getDefaultAmenities(): Amenity[] {
    return [
      { id: "wifi", name: "Free WiFi", icon: "wifi" },
      { id: "parking", name: "Free Parking", icon: "parking" },
      { id: "pool", name: "Swimming Pool", icon: "pool" },
      { id: "gym", name: "Fitness Center", icon: "gym" },
      { id: "spa", name: "Spa", icon: "spa" },
      { id: "restaurant", name: "Restaurant", icon: "restaurant" },
      { id: "breakfast", name: "Free Breakfast", icon: "breakfast" },
      { id: "aircon", name: "Air Conditioning", icon: "aircon" },
    ];
  }

  /**
   * Sync hotel content for destinations (Admin only)
   */
  async syncHotelContent(
    destinationCodes: string[],
    forceSync = false,
  ): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `${this.baseUrl}/sync`,
        { destinationCodes, forceSync },
      );

      if (response.success) {
        return response.data;
      }

      throw new Error("Sync failed");
    } catch (error) {
      console.error("Hotel sync error:", error);
      throw new Error("Failed to sync hotel content");
    }
  }

  /**
   * Get cache statistics (Admin only)
   */
  async getCacheStats(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${this.baseUrl}/cache/stats`,
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {};
    } catch (error) {
      console.error("Cache stats error:", error);
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
      console.error("Clear cache error:", error);
      throw new Error("Failed to clear cache");
    }
  }
}

// Export singleton instance
export const hotelsService = new HotelsService();
export default hotelsService;
