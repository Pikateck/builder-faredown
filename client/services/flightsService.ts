/**
 * Flights API Service
 * Handles flight search, booking, and management
 */

import { apiClient, ApiResponse, PaginatedResponse } from "@/lib/api";

// Types
export interface FlightSearchRequest {
  departure: string;
  arrival: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants?: number;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  tripType: "one_way" | "round_trip" | "multi_city";
  currencyCode?: string;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: Airport;
  arrival: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft: string;
  stops: number;
  price: Price;
  amenities: string[];
  baggage: BaggageInfo;
  seatMap?: SeatMap;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  terminal?: string;
}

export interface Price {
  amount: number;
  currency: string;
  breakdown: PriceBreakdown;
}

export interface PriceBreakdown {
  baseFare: number;
  taxes: number;
  fees: number;
  total: number;
}

export interface BaggageInfo {
  carryOn: {
    weight: string;
    dimensions: string;
    included: boolean;
  };
  checked: {
    weight: string;
    count: number;
    fee?: number;
  };
}

export interface SeatMap {
  aircraft: string;
  layout: string;
  rows: SeatRow[];
}

export interface SeatRow {
  number: number;
  seats: Seat[];
}

export interface Seat {
  id: string;
  number: string;
  type: "economy" | "premium" | "business" | "first";
  available: boolean;
  price?: number;
  features: string[];
}

export interface FlightBookingRequest {
  flightId: string;
  passengers: Passenger[];
  contactInfo: ContactInfo;
  seatSelections?: Record<string, string>; // passengerId -> seatId
  addOns?: BookingAddOn[];
}

export interface Passenger {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "F";
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
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

export interface BookingAddOn {
  type: "insurance" | "lounge" | "meal" | "baggage";
  id: string;
  quantity: number;
}

export interface Booking {
  id: string;
  bookingRef: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  flight: Flight;
  passengers: Passenger[];
  totalPrice: Price;
  createdAt: string;
  updatedAt: string;
}

// Flights Service Class
export class FlightsService {
  private readonly baseUrl = "/api/airlines";

  /**
   * Search for flights
   */
  async searchFlights(searchParams: FlightSearchRequest): Promise<Flight[]> {
    const response = await apiClient.get<ApiResponse<Flight[]>>(
      `${this.baseUrl}/search`,
      searchParams,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to search flights");
  }

  /**
   * Get flight details by ID
   */
  async getFlightDetails(flightId: string): Promise<Flight> {
    const response = await apiClient.get<ApiResponse<Flight>>(
      `${this.baseUrl}/flights/${flightId}`,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get flight details");
  }

  /**
   * Get seat map for a flight
   */
  async getSeatMap(flightId: string): Promise<SeatMap> {
    const response = await apiClient.get<ApiResponse<SeatMap>>(
      `${this.baseUrl}/flights/${flightId}/seatmap`,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get seat map");
  }

  /**
   * Get flight prices for multiple dates
   */
  async getFlightPrices(
    departure: string,
    arrival: string,
    dateRange: string[],
  ): Promise<Record<string, number>> {
    const response = await apiClient.get<ApiResponse<Record<string, number>>>(
      `${this.baseUrl}/prices`,
      {
        departure,
        arrival,
        dates: dateRange.join(","),
      },
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get flight prices");
  }

  /**
   * Book a flight
   */
  async bookFlight(bookingData: FlightBookingRequest): Promise<Booking> {
    const response = await apiClient.post<ApiResponse<Booking>>(
      `${this.baseUrl}/book`,
      bookingData,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to book flight");
  }

  /**
   * Get user's flight bookings
   */
  async getUserBookings(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Booking>> {
    return apiClient.get<PaginatedResponse<Booking>>(
      `${this.baseUrl}/bookings`,
      { page, limit },
    );
  }

  /**
   * Get booking details by reference
   */
  async getBookingDetails(bookingRef: string): Promise<Booking> {
    const response = await apiClient.get<ApiResponse<Booking>>(
      `${this.baseUrl}/bookings/${bookingRef}`,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get booking details");
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingRef: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/bookings/${bookingRef}`);
  }

  /**
   * Get popular destinations
   */
  async getPopularDestinations(): Promise<Airport[]> {
    const response = await apiClient.get<ApiResponse<Airport[]>>(
      `${this.baseUrl}/destinations/popular`,
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get popular destinations");
  }

  /**
   * Search airports
   */
  async searchAirports(query: string): Promise<Airport[]> {
    const response = await apiClient.get<ApiResponse<Airport[]>>(
      `${this.baseUrl}/airports/search`,
      { q: query },
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to search airports");
  }

  /**
   * Get airline information
   */
  async getAirlineInfo(airlineCode: string): Promise<{
    code: string;
    name: string;
    logo: string;
    country: string;
  }> {
    const response = await apiClient.get<
      ApiResponse<{
        code: string;
        name: string;
        logo: string;
        country: string;
      }>
    >(`${this.baseUrl}/airlines/${airlineCode}`);

    if (response.data) {
      return response.data;
    }

    throw new Error("Failed to get airline info");
  }
}

// Export singleton instance
export const flightsService = new FlightsService();
export default flightsService;
