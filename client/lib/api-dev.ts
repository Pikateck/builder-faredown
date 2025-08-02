/**
 * Development API Client with Offline Fallbacks
 * Used when the API server is not available
 */

import type { ApiResponse } from "./api";

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
    console.log(
      `🔄 FALLBACK: ${endpoint} (Live API unavailable - using mock data)`,
    );
    return this.getFallbackData(endpoint, params) as T;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    // DevApiClient always uses fallback data to avoid fetch errors
    console.log(
      `🔄 FALLBACK POST: ${endpoint} (Live API unavailable - using mock data)`,
    );
    return this.getFallbackData(endpoint, data) as T;
  }

  private getFallbackData(endpoint: string, params?: any): any {
    // Health check
    if (endpoint.includes("/health")) {
      return {
        status: "development",
        database: "offline (fallback mode)",
        timestamp: new Date().toISOString(),
      };
    }

    // Destinations search
    if (endpoint.includes("/destinations/search")) {
      const query = params?.q?.toLowerCase() || "";
      const destinations = [
        {
          id: "DXB",
          name: "Dubai",
          type: "city",
          country: "United Arab Emirates",
        },
        {
          id: "DXB-DT",
          name: "Downtown Dubai",
          type: "district",
          country: "Dubai, United Arab Emirates",
        },
        {
          id: "DXB-MAR",
          name: "Dubai Marina",
          type: "district",
          country: "Dubai, United Arab Emirates",
        },
        { id: "LON", name: "London", type: "city", country: "United Kingdom" },
        { id: "NYC", name: "New York", type: "city", country: "United States" },
        { id: "PAR", name: "Paris", type: "city", country: "France" },
        { id: "TOK", name: "Tokyo", type: "city", country: "Japan" },
        { id: "BOM", name: "Mumbai", type: "city", country: "India" },
        { id: "DEL", name: "Delhi", type: "city", country: "India" },
        { id: "BLR", name: "Bangalore", type: "city", country: "India" },
        { id: "MAA", name: "Chennai", type: "city", country: "India" },
        { id: "HYD", name: "Hyderabad", type: "city", country: "India" },
      ];

      const filtered = query
        ? destinations.filter(
            (d) =>
              d.name.toLowerCase().includes(query) ||
              d.country.toLowerCase().includes(query),
          )
        : destinations.slice(0, 5);

      return {
        success: true,
        data: filtered,
        message: "Fallback destinations (API offline)",
      };
    }

    // Hotel search
    if (endpoint.includes("/hotels/search")) {
      return {
        success: true,
        data: [],
        message: "API server offline - using fallback data in HotelResults",
        totalResults: 0,
      };
    }

    // Flight search
    if (endpoint.includes("/flights/search")) {
      return {
        success: true,
        data: [
          {
            id: "fallback_flight_1",
            airline: "Emirates",
            airlineCode: "EK",
            flightNumber: "EK 500",
            departure: {
              code: "BOM",
              name: "Chhatrapati Shivaji Maharaj International Airport",
              city: "Mumbai",
              country: "India",
              terminal: "2",
            },
            arrival: {
              code: "DXB",
              name: "Dubai International Airport",
              city: "Dubai",
              country: "UAE",
              terminal: "3",
            },
            departureTime: "10:15",
            arrivalTime: "11:45",
            duration: "3h 30m",
            aircraft: "Boeing 777-300ER",
            stops: 0,
            price: {
              amount: 25890,
              currency: "INR",
              breakdown: {
                baseFare: 20712,
                taxes: 3890,
                fees: 1288,
                total: 25890,
              },
            },
            amenities: ["WiFi", "Entertainment System", "Premium Meals"],
            baggage: {
              carryOn: {
                weight: "7kg",
                dimensions: "55x40x20cm",
                included: true,
              },
              checked: {
                weight: "20kg",
                count: 1,
                fee: 0,
              },
            },
            fareClass: "ECONOMY",
            // Return flight information
            returnDepartureTime: "13:00",
            returnArrivalTime: "17:40",
            returnDuration: "4h 40m",
            returnAirline: "Emirates",
            returnFlightNumber: "EK 501",
            returnAircraft: "Boeing 777-200LR",
            returnStops: 0,
          },
          {
            id: "fallback_flight_2",
            airline: "IndiGo",
            airlineCode: "6E",
            flightNumber: "6E 1407",
            departure: {
              code: "BOM",
              name: "Chhatrapati Shivaji Maharaj International Airport",
              city: "Mumbai",
              country: "India",
              terminal: "2",
            },
            arrival: {
              code: "DXB",
              name: "Dubai International Airport",
              city: "Dubai",
              country: "UAE",
              terminal: "2",
            },
            departureTime: "14:30",
            arrivalTime: "16:00",
            duration: "3h 30m",
            aircraft: "Airbus A320",
            stops: 0,
            price: {
              amount: 22650,
              currency: "INR",
              breakdown: {
                baseFare: 18120,
                taxes: 3400,
                fees: 1130,
                total: 22650,
              },
            },
            amenities: ["Seat Selection", "Onboard Refreshments"],
            baggage: {
              carryOn: {
                weight: "7kg",
                dimensions: "55x40x20cm",
                included: true,
              },
              checked: {
                weight: "15kg",
                count: 1,
                fee: 0,
              },
            },
            fareClass: "ECONOMY",
            // Return flight information
            returnDepartureTime: "18:45",
            returnArrivalTime: "23:15",
            returnDuration: "4h 30m",
            returnAirline: "IndiGo",
            returnFlightNumber: "6E 1408",
            returnAircraft: "Airbus A320",
            returnStops: 0,
          },
          {
            id: "fallback_flight_3",
            airline: "Air India",
            airlineCode: "AI",
            flightNumber: "AI 131",
            departure: {
              code: "BOM",
              name: "Chhatrapati Shivaji Maharaj International Airport",
              city: "Mumbai",
              country: "India",
              terminal: "2",
            },
            arrival: {
              code: "DXB",
              name: "Dubai International Airport",
              city: "Dubai",
              country: "UAE",
              terminal: "1",
            },
            departureTime: "18:45",
            arrivalTime: "20:15",
            duration: "3h 30m",
            aircraft: "Boeing 787-8",
            stops: 0,
            price: {
              amount: 24100,
              currency: "INR",
              breakdown: {
                baseFare: 19280,
                taxes: 3620,
                fees: 1200,
                total: 24100,
              },
            },
            amenities: ["WiFi", "Entertainment System", "Meals"],
            baggage: {
              carryOn: {
                weight: "8kg",
                dimensions: "55x40x20cm",
                included: true,
              },
              checked: {
                weight: "23kg",
                count: 1,
                fee: 0,
              },
            },
            fareClass: "ECONOMY",
            // Return flight information
            returnDepartureTime: "20:15",
            returnArrivalTime: "01:45+1",
            returnDuration: "5h 30m",
            returnAirline: "Air India",
            returnFlightNumber: "AI 132",
            returnAircraft: "Boeing 787-8",
            returnStops: 0,
          },
        ],
        meta: {
          total: 3,
          currency: "INR",
          searchParams: params,
        },
        message: "Fallback flight data (Live Amadeus API unavailable)",
      };
    }

    // Loyalty profile endpoint
    if (endpoint.includes("/loyalty/me") && !endpoint.includes("/history")) {
      return {
        success: true,
        data: {
          member: {
            id: 1,
            memberCode: "FD123456",
            tier: 1,
            tierName: "Silver",
            pointsBalance: 2500,
            pointsLocked: 0,
            pointsLifetime: 5000,
            points12m: 2500,
            joinDate: "2024-01-15",
            status: "active",
          },
          tier: {
            current: {
              tier: 1,
              tierName: "Silver",
              thresholdPoints12m: 0,
              earnMultiplier: 1.0,
              benefits: ["Base earning rate", "Standard support"],
            },
            next: {
              tier: 2,
              tierName: "Gold",
              thresholdPoints12m: 5000,
              earnMultiplier: 1.5,
              benefits: [
                "1.5x earning rate",
                "Priority support",
                "Free cancellation",
              ],
            },
            progress: 50,
            pointsToNext: 2500,
          },
          expiringSoon: [
            {
              points: 500,
              expireOn: "2024-09-15",
              daysRemaining: 30,
            },
          ],
        },
        message: "Fallback loyalty profile (API offline)",
      };
    }

    // Loyalty transaction history
    if (endpoint.includes("/loyalty/me/history")) {
      return {
        success: true,
        data: {
          items: [
            {
              id: 1,
              eventType: "earn",
              pointsDelta: 250,
              rupeeValue: 5000,
              description: "Hotel booking at Dubai Marina Resort",
              createdAt: "2024-07-15T10:30:00Z",
              bookingId: "FD12345",
            },
            {
              id: 2,
              eventType: "redeem",
              pointsDelta: -200,
              rupeeValue: 200,
              description: "Points redemption on flight booking",
              createdAt: "2024-07-10T14:20:00Z",
              bookingId: "FD12340",
            },
          ],
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        },
        message: "Fallback loyalty history (API offline)",
      };
    }

    // Loyalty rules endpoint
    if (endpoint.includes("/loyalty/rules")) {
      return {
        success: true,
        data: {
          earning: {
            hotel: {
              pointsPer100: 5,
              description: "Earn 5 points per ₹100 spent on hotels",
            },
            air: {
              pointsPer100: 3,
              description: "Earn 3 points per ₹100 spent on flights",
            },
          },
          redemption: {
            valuePerPoint: 0.1,
            minRedeem: 200,
            maxCapPercentage: 20,
            description: "Redeem 100 points = ₹10, max 20% of booking value",
          },
          tiers: [
            {
              tier: 1,
              name: "Silver",
              threshold: 0,
              multiplier: 1.0,
              benefits: ["Base earning rate"],
            },
            {
              tier: 2,
              name: "Gold",
              threshold: 5000,
              multiplier: 1.5,
              benefits: ["1.5x earning", "Priority support"],
            },
            {
              tier: 3,
              name: "Platinum",
              threshold: 15000,
              multiplier: 2.0,
              benefits: ["2x earning", "Free upgrades"],
            },
          ],
          expiry: {
            months: 24,
            description: "Points expire after 24 months of inactivity",
          },
        },
        message: "Fallback loyalty rules (API offline)",
      };
    }

    // Default fallback
    return {
      success: false,
      error: "API server offline",
      data: null,
      message: "Development mode - API server not available",
    };
  }
}
