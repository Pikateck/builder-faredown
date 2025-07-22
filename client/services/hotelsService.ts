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
   * Search for hotels
   */
  async searchHotels(searchParams: HotelSearchRequest): Promise<Hotel[]> {
    const response = await apiClient.get<ApiResponse<Hotel[]>>(
      `${this.baseUrl}/search`,
      searchParams,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to search hotels");
  }

  /**
   * Get hotel details by ID
   */
  async getHotelDetails(hotelId: string): Promise<Hotel> {
    const response = await apiClient.get<ApiResponse<Hotel>>(
      `${this.baseUrl}/${hotelId}`,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get hotel details");
  }

  /**
   * Get room availability and pricing
   */
  async getRoomAvailability(
    hotelId: string,
    checkIn: string,
    checkOut: string,
    rooms: number,
    adults: number,
    children: number,
  ): Promise<RoomType[]> {
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

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get room availability");
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
   * Search destinations
   */
  async searchDestinations(query: string): Promise<
    {
      id: string;
      name: string;
      type: "city" | "region" | "country" | "landmark";
      country: string;
    }[]
  > {
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

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to search destinations");
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
}

// Export singleton instance
export const hotelsService = new HotelsService();
export default hotelsService;
