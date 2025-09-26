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
    // Try to check if the real API server is available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // Server is not available, use fallback
      return false;
    }
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

    // Hotel search (legacy path)
    if (endpoint.includes("/hotels/search")) {
      return {
        success: true,
        data: [],
        message: "API server offline - using fallback data in HotelResults",
        totalResults: 0,
      };
    }

    // Live Hotelbeds search (enhanced path)
    if (endpoint.includes("/hotels-live/search")) {
      const destination = params?.destination || "DXB";
      const hotels = [
        {
          id: `live-fallback-${destination}-001`,
          code: `LFB${destination}001`,
          name: `Grand ${destination} City Hotel`,
          description: `Premium hotel in ${destination} with excellent amenities and service.`,
          currentPrice: 120,
          originalPrice: 160,
          currency: "EUR",
          rating: 4.5,
          reviewScore: 9.1,
          reviewCount: 312,
          address: {
            street: "1 Hotel Street",
            city: destination,
            country: "United Arab Emirates",
            zipCode: `${destination}12345`,
          },
          images: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          amenities: [
            "Free WiFi",
            "Pool",
            "Restaurant",
            "Spa",
            "Gym",
            "Airport Shuttle",
          ],
          rooms: [
            { name: "Standard Room", price: 120, currency: "EUR", features: ["City View", "Free WiFi"] },
            { name: "Deluxe Room", price: 160, currency: "EUR", features: ["Sea View", "Breakfast Included"] },
          ],
          isLiveData: false,
          supplier: "fallback-system",
        },
        {
          id: `live-fallback-${destination}-002`,
          code: `LFB${destination}002`,
          name: `${destination} Marina Resort`,
          description: `Beachfront resort in ${destination} with stunning views and top amenities.`,
          currentPrice: 140,
          originalPrice: 190,
          currency: "EUR",
          rating: 4.3,
          reviewScore: 8.7,
          reviewCount: 221,
          address: {
            street: "2 Beach Road",
            city: destination,
            country: "United Arab Emirates",
            zipCode: `${destination}12346`,
          },
          images: [
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          amenities: [
            "Beach Access",
            "Pool",
            "Spa",
            "Restaurant",
            "Bar",
            "Free Parking",
          ],
          rooms: [
            { name: "Garden View", price: 140, currency: "EUR", features: ["Garden View", "King Bed"] },
            { name: "Ocean View", price: 185, currency: "EUR", features: ["Ocean View", "Balcony"] },
          ],
          isLiveData: false,
          supplier: "fallback-system",
        },
      ];

      return {
        success: true,
        data: hotels,
        totalResults: hotels.length,
        isLiveData: false,
        source: "Fallback System (Live API unavailable)",
        message: "Live hotels API offline - using fallback data",
      };
    }

    // Live Hotelbeds details
    if (endpoint.includes("/hotels-live/hotel/")) {
      const code = endpoint.split("/hotels-live/hotel/")[1] || "00001";
      return {
        success: true,
        data: {
          id: code,
          code,
          name: `Hotel ${code}`,
          description: "Detailed hotel info (fallback)",
          rating: 4.4,
          images: [
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&q=80&auto=format&fit=crop",
          ],
          amenities: ["WiFi", "Pool", "Restaurant"],
          rooms: [
            { name: "Standard", price: 120, currency: "EUR" },
            { name: "Deluxe", price: 160, currency: "EUR" },
          ],
          address: { city: "Dubai", country: "United Arab Emirates" },
        },
        message: "Live hotel details API offline - using fallback data",
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

    // Loyalty redemption endpoints
    if (endpoint.includes("/loyalty/quote-redeem")) {
      return {
        success: true,
        data: {
          maxPoints: 2000,
          rupeeValue: 200,
          capReason: "20% of booking value limit",
        },
        message: "Fallback redemption quote (API offline)",
      };
    }

    if (endpoint.includes("/loyalty/apply")) {
      return {
        success: true,
        data: {
          lockedId: `lock_${Date.now()}`,
          pointsApplied: params?.points || 1000,
          rupeeValue: (params?.points || 1000) * 0.1,
        },
        message: "Fallback redemption application (API offline)",
      };
    }

    if (endpoint.includes("/loyalty/cancel-redemption")) {
      return {
        success: true,
        message: "Fallback redemption cancellation (API offline)",
      };
    }

    // Flight details endpoint
    if (endpoint.includes("/flights/") && !endpoint.includes("/search")) {
      const flightId = endpoint.split("/flights/")[1];
      console.log(`🔍 Getting fallback flight details for: ${flightId}`);

      // Return detailed flight information based on flightId
      let flightDetails;

      if (
        flightId.includes("emirates") ||
        flightId.includes("EK") ||
        flightId.includes("fallback_flight_1")
      ) {
        flightDetails = {
          id: flightId,
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
          amenities: [
            "WiFi",
            "Entertainment System",
            "Premium Meals",
            "Lounge Access",
          ],
          baggage: {
            carryOn: {
              weight: "7kg",
              dimensions: "55x40x20cm",
              included: true,
            },
            checked: {
              weight: "25kg",
              count: 1,
              fee: 0,
            },
          },
          fareClass: "ECONOMY",
          segments: [
            {
              departure: {
                code: "BOM",
                time: "10:15",
                terminal: "2",
              },
              arrival: {
                code: "DXB",
                time: "11:45",
                terminal: "3",
              },
              airline: "Emirates",
              flightNumber: "EK 500",
              aircraft: "Boeing 777-300ER",
              duration: "3h 30m",
            },
          ],
        };
      } else if (
        flightId.includes("indigo") ||
        flightId.includes("6E") ||
        flightId.includes("fallback_flight_2")
      ) {
        flightDetails = {
          id: flightId,
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
          segments: [
            {
              departure: {
                code: "BOM",
                time: "14:30",
                terminal: "2",
              },
              arrival: {
                code: "DXB",
                time: "16:00",
                terminal: "2",
              },
              airline: "IndiGo",
              flightNumber: "6E 1407",
              aircraft: "Airbus A320",
              duration: "3h 30m",
            },
          ],
        };
      } else {
        // Default flight details for any unknown ID
        flightDetails = {
          id: flightId,
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
          segments: [
            {
              departure: {
                code: "BOM",
                time: "18:45",
                terminal: "2",
              },
              arrival: {
                code: "DXB",
                time: "20:15",
                terminal: "1",
              },
              airline: "Air India",
              flightNumber: "AI 131",
              aircraft: "Boeing 787-8",
              duration: "3h 30m",
            },
          ],
        };
      }

      return {
        success: true,
        data: flightDetails,
        message: "Fallback flight details (Live API unavailable)",
      };
    }

    // Unified Markups - List
    if (endpoint.includes("/markups") && !endpoint.includes("test-apply") && (!params || params.module)) {
      const module = params?.module || "air";
      if (module === "air") {
        const items = [
          {
            id: 1,
            module: "air",
            rule_name: "Mumbai-Dubai Economy Markup",
            description: "Standard markup for Mumbai to Dubai economy flights",
            airline_code: "EK",
            route_from: "BOM",
            route_to: "DXB",
            booking_class: "economy",
            m_type: "percentage",
            m_value: 5.5,
            current_min_pct: 10.0,
            current_max_pct: 12.0,
            bargain_min_pct: 5.0,
            bargain_max_pct: 15.0,
            valid_from: "2024-01-01",
            valid_to: "2024-12-31",
            is_active: true,
            priority: 1,
            user_type: "all",
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-20T15:30:00Z",
          },
          {
            id: 2,
            module: "air",
            rule_name: "Amadeus Emirates BOM-DXB Economy",
            description:
              "Airline Markup for BOM to DXB route with Emirates via Amadeus",
            airline_code: "EK",
            route_from: "BOM",
            route_to: "DXB",
            booking_class: "economy",
            m_type: "percentage",
            m_value: 12.0,
            current_min_pct: 10.0,
            current_max_pct: 12.0,
            bargain_min_pct: 5.0,
            bargain_max_pct: 15.0,
            valid_from: "2025-01-01",
            valid_to: "2025-12-31",
            is_active: true,
            priority: 1,
            user_type: "all",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        return { success: true, items, total: items.length, page: 1, pageSize: items.length };
      }
      if (module === "hotel") {
        const items = [
          {
            id: 1,
            module: "hotel",
            rule_name: "Mumbai Luxury Hotels Markup",
            description: "Standard markup for luxury hotels in Mumbai",
            hotel_city: "Mumbai",
            hotel_star_min: 5,
            hotel_star_max: 5,
            m_type: "percentage",
            m_value: 8.5,
            current_min_pct: 10.0,
            current_max_pct: 15.0,
            bargain_min_pct: 5.0,
            bargain_max_pct: 15.0,
            valid_from: "2024-01-01",
            valid_to: "2024-12-31",
            is_active: true,
            priority: 1,
            user_type: "all",
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-20T15:30:00Z",
          },
          {
            id: 2,
            module: "hotel",
            rule_name: "Hotelbeds Taj Mahal Palace Mumbai",
            description: "Hotel Markup for Taj Mahal Palace Mumbai via Hotelbeds",
            hotel_city: "Mumbai",
            hotel_star_min: 5,
            hotel_star_max: 5,
            m_type: "percentage",
            m_value: 12.0,
            current_min_pct: 10.0,
            current_max_pct: 12.0,
            bargain_min_pct: 10.0,
            bargain_max_pct: 20.0,
            valid_from: "2025-01-01",
            valid_to: "2025-12-31",
            is_active: true,
            priority: 1,
            user_type: "all",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        return { success: true, items, total: items.length, page: 1, pageSize: items.length };
      }
    }

    // Unified Markups - Create
    if (endpoint.endsWith("/markups") && params && params.module) {
      const now = new Date().toISOString();
      const item = { id: Math.floor(Math.random() * 10000), created_at: now, updated_at: now, ...params };
      return { success: true, item } as ApiResponse<any>;
    }

    // Unified Markups - Update
    if (endpoint.includes("/markups/") && params && !endpoint.endsWith("/status") && !endpoint.includes("test-apply")) {
      const id = endpoint.split("/markups/")[1];
      const now = new Date().toISOString();
      const item = { id, updated_at: now, ...params };
      return { success: true, item } as ApiResponse<any>;
    }

    // Unified Markups - Toggle Status
    if (endpoint.endsWith("/status")) {
      const id = endpoint.split("/").slice(-2)[0];
      return { success: true, item: { id, is_active: true, updated_at: new Date().toISOString() } } as ApiResponse<any>;
    }

    // Unified Markups - Delete
    if (endpoint.includes("/markups/") && !params && !endpoint.endsWith("/status") && !endpoint.includes("test-apply")) {
      return { success: true } as ApiResponse<any>;
    }

    // Test apply (pricing snapshot)
    if (endpoint.includes("/markups/test-apply")) {
      const base = Number(params?.base_amount || 0);
      const markup_value = 10;
      const final = base + (base * markup_value) / 100;
      return {
        success: true,
        matched_rule_id: "mock_rule",
        base_amount: base,
        markup_type: "percentage",
        markup_value,
        final_amount: final,
        currency: "INR",
        quote_id: "mock-quote-id",
      };
    }

    // Markup endpoints - Air Markups (legacy fallback)
    if (endpoint.includes("/markup/air")) {
      return {
        success: true,
        markups: [
          {
            id: "1",
            name: "Mumbai-Dubai Economy Markup",
            description: "Standard markup for Mumbai to Dubai economy flights",
            airline: "EK",
            route: { from: "BOM", to: "DXB" },
            class: "economy",
            markupType: "percentage",
            markupValue: 5.5,
            minAmount: 500,
            maxAmount: 2000,
            currentFareMin: 10.0,
            currentFareMax: 12.0,
            bargainFareMin: 5.0,
            bargainFareMax: 15.0,
            validFrom: "2024-01-01",
            validTo: "2024-12-31",
            status: "active",
            priority: 1,
            userType: "all",
            specialConditions: "Valid for advance bookings only",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-20T15:30:00Z",
          },
          {
            id: "2",
            name: "Amadeus Emirates BOM-DXB Economy",
            description:
              "Airline Markup for BOM to DXB route with Emirates via Amadeus",
            airline: "EK",
            route: { from: "BOM", to: "DXB" },
            class: "economy",
            markupType: "percentage",
            markupValue: 12.0,
            minAmount: 500,
            maxAmount: 5000,
            highFareMin: 20.0,
            highFareMax: 25.0,
            lowFareMin: 15.0,
            lowFareMax: 20.0,
            currentFareMin: 10.0,
            currentFareMax: 12.0,
            bargainFareMin: 5.0,
            bargainFareMax: 15.0,
            validFrom: "2025-01-01",
            validTo: "2025-12-31",
            status: "active",
            priority: 1,
            userType: "all",
            specialConditions:
              "Sample data as per Zubin's specifications for Amadeus Emirates route",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
        message: "Fallback air markup data (API offline)",
      };
    }

    // Markup endpoints - Hotel Markups (legacy fallback)
    if (endpoint.includes("/markup/hotel")) {
      return {
        success: true,
        markups: [
          {
            id: "1",
            name: "Mumbai Luxury Hotels Markup",
            description: "Standard markup for luxury hotels in Mumbai",
            city: "Mumbai",
            hotelName: "Taj Hotel",
            hotelChain: "Taj Hotels",
            starRating: 5,
            roomCategory: "deluxe",
            markupType: "percentage",
            markupValue: 8.5,
            minAmount: 1000,
            maxAmount: 5000,
            currentFareMin: 10.0,
            currentFareMax: 15.0,
            bargainFareMin: 5.0,
            bargainFareMax: 15.0,
            validFrom: "2024-01-01",
            validTo: "2024-12-31",
            checkInDays: ["friday", "saturday", "sunday"],
            applicableDays: ["friday", "saturday", "sunday"],
            minStay: 1,
            maxStay: 7,
            status: "active",
            priority: 1,
            userType: "all",
            seasonType: "Peak Season",
            specialConditions: "Valid for weekend bookings only",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-20T15:30:00Z",
          },
          {
            id: "2",
            name: "Hotelbeds Taj Mahal Palace Mumbai",
            description:
              "Hotel Markup for Taj Mahal Palace Mumbai via Hotelbeds",
            city: "Mumbai",
            hotelName: "Taj Mahal Palace",
            hotelChain: "Taj Hotels",
            starRating: 5,
            roomCategory: "deluxe",
            markupType: "percentage",
            markupValue: 12.0,
            minAmount: 1000,
            maxAmount: 8000,
            hotelCode: "53331",
            highFareMin: 20.0,
            highFareMax: 25.0,
            lowFareMin: 15.0,
            lowFareMax: 20.0,
            currentFareMin: 10.0,
            currentFareMax: 12.0,
            bargainFareMin: 10.0,
            bargainFareMax: 20.0,
            validFrom: "2025-01-01",
            validTo: "2025-12-31",
            checkInDays: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
            applicableDays: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
            minStay: 1,
            maxStay: 30,
            status: "active",
            priority: 1,
            userType: "all",
            seasonType: "Regular",
            specialConditions:
              "Sample data as per Zubin's specifications for Hotelbeds Taj Mahal Palace",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
        message: "Fallback hotel markup data (API offline)",
      };
    }

    // Promo Code endpoints
    if (
      endpoint.includes("/promo/admin/all") ||
      endpoint.includes("/promo/logs")
    ) {
      return {
        success: true,
        data: [
          {
            id: "promo_001",
            code: "FLYHIGH100",
            name: "Fly High Discount",
            type: "percent",
            discountFrom: 5,
            discountTo: 15,
            applicableTo: "flights",
            filters: {
              fromCity: "Mumbai",
              toCity: "Dubai",
              airlines: ["Emirates", "Air India"],
              cabinClass: ["Economy", "Business"],
            },
            travelPeriod: {
              from: "2025-02-01",
              to: "2025-12-31",
            },
            validity: {
              startDate: "2025-01-15",
              endDate: "2025-12-31",
            },
            marketingBudget: 100000,
            budgetUsed: 15750,
            status: "active",
            usageCount: 157,
            createdAt: "2025-01-15T00:00:00Z",
            createdBy: "admin",
          },
          {
            id: "promo_004",
            code: "FAREDOWNBONUS",
            name: "FAREDOWNBONUS Flight Discount",
            type: "fixed",
            discountFrom: 2000,
            discountTo: 5000,
            applicableTo: "flights",
            filters: {
              minFare: 10500,
            },
            travelPeriod: {
              from: "2025-01-01",
              to: "2025-12-31",
            },
            validity: {
              startDate: "2025-01-01",
              endDate: "2025-12-31",
            },
            marketingBudget: 100000,
            budgetUsed: 0,
            status: "active",
            usageCount: 0,
            createdAt: new Date().toISOString(),
            createdBy: "admin",
          },
          {
            id: "promo_005",
            code: "FAREDOWNBONUS",
            name: "FAREDOWNBONUS Hotel Discount",
            type: "fixed",
            discountFrom: 2000,
            discountTo: 5000,
            applicableTo: "hotels",
            filters: {
              minFare: 10500,
            },
            travelPeriod: {
              from: "2025-01-01",
              to: "2025-12-31",
            },
            validity: {
              startDate: "2025-01-01",
              endDate: "2025-12-31",
            },
            marketingBudget: 100000,
            budgetUsed: 0,
            status: "active",
            usageCount: 0,
            createdAt: new Date().toISOString(),
            createdBy: "admin",
          },
        ],
        message: "Fallback promo code data (API offline)",
      };
    }

    // Package details endpoint
    if (endpoint.includes("/packages/") && !endpoint.includes("search") && !endpoint.includes("?")) {
      const slug = endpoint.split("/packages/")[1];
      console.log(`🔍 Getting fallback package details for: ${slug}`);

      // Return detailed package information based on slug
      let packageDetails;

      if (slug === "dubai-luxury-package") {
        packageDetails = {
          id: 1,
          slug: "dubai-luxury-package",
          title: "Dubai Luxury Experience",
          region_name: "Middle East",
          country_name: "United Arab Emirates",
          city_name: "Dubai",
          duration_days: 7,
          duration_nights: 6,
          overview: "Experience the ultimate luxury in Dubai with this comprehensive package that combines modern marvels with traditional Arabian hospitality.",
          description: "Immerse yourself in the glitz and glamour of Dubai, where cutting-edge architecture meets timeless desert beauty. This luxury package includes stays at the finest hotels, visits to iconic landmarks, and unforgettable experiences that showcase the best of this dynamic city. From the towering Burj Khalifa to the bustling Gold Souk, from desert adventures to world-class shopping, this package offers a perfect blend of excitement and relaxation.",
          highlights: [
            "5-star hotel accommodation at Burj Al Arab",
            "Skip-the-line access to Burj Khalifa",
            "Premium desert safari with falcon show",
            "Dubai Marina luxury yacht cruise",
            "Personal shopping guide at Dubai Mall",
            "Helicopter tour over Palm Jumeirah",
            "Fine dining at Michelin-starred restaurants"
          ],
          base_price_pp: 89999,
          currency: "INR",
          hero_image_url: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F7456191e08dd4de1a7a13f9d335b9417?format=webp&width=800",
          gallery_images: [
            "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F7456191e08dd4de1a7a13f9d335b9417?format=webp&width=800",
            "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&h=600&fit=crop&auto=format",
            "https://images.unsplash.com/photo-1569197388202-9efe60c9e512?w=800&h=600&fit=crop&auto=format"
          ],
          rating: 4.8,
          review_count: 156,
          is_featured: true,
          category: "luxury",
          themes: ["luxury", "city-break", "shopping", "culture", "desert"],
          inclusions: [
            "6 nights accommodation in 5-star hotels",
            "Daily breakfast and 3 dinners",
            "Airport transfers in luxury vehicles",
            "All sightseeing as per itinerary",
            "English-speaking guide",
            "Desert safari with BBQ dinner",
            "Dubai Marina cruise",
            "Burj Khalifa tickets (Level 124 & 125)"
          ],
          exclusions: [
            "International flights",
            "Visa fees",
            "Personal expenses",
            "Additional meals not mentioned",
            "Tips and gratuities",
            "Travel insurance"
          ],
          terms_conditions: "All bookings are subject to availability. Prices may vary during peak seasons. Cancellation charges apply as per our policy.",
          cancellation_policy: "Free cancellation up to 15 days before departure. 50% charges for 7-15 days. No refund for cancellations within 7 days.",
          visa_required: true,
          passport_required: true,
          minimum_age: 0,
          maximum_group_size: 20,
          itinerary: [
            {
              day_number: 1,
              title: "Arrival in Dubai",
              description: "Arrive at Dubai International Airport. Meet and greet by our representative. Transfer to your luxury hotel. Evening at leisure to explore nearby areas.",
              cities: "Dubai",
              meals_included: "Dinner",
              accommodation: "Burj Al Arab",
              activities: ["Airport transfer", "Hotel check-in", "Welcome dinner"],
              transport: "Luxury vehicle"
            },
            {
              day_number: 2,
              title: "Dubai City Tour",
              description: "Full day Dubai city tour including Burj Khalifa, Dubai Mall, and traditional souks. Experience the contrast between modern and traditional Dubai.",
              cities: "Dubai",
              meals_included: "Breakfast, Lunch",
              accommodation: "Burj Al Arab",
              activities: ["Burj Khalifa visit", "Dubai Mall shopping", "Gold Souk", "Spice Souk"],
              transport: "Air-conditioned coach"
            },
            {
              day_number: 3,
              title: "Desert Safari Adventure",
              description: "Thrilling desert safari with dune bashing, camel riding, falcon show, and traditional BBQ dinner under the stars.",
              cities: "Dubai Desert",
              meals_included: "Breakfast, BBQ Dinner",
              accommodation: "Burj Al Arab",
              activities: ["Dune bashing", "Camel riding", "Falcon show", "Henna painting", "BBQ dinner"],
              transport: "4x4 vehicles"
            }
          ],
          departures: [
            {
              id: 101,
              departure_city_code: "BOM",
              departure_city_name: "Mumbai",
              departure_date: "2025-10-15",
              return_date: "2025-10-21",
              price_per_person: 89999,
              single_supplement: 25000,
              child_price: 67499,
              currency: "INR",
              available_seats: 12,
              total_seats: 20,
              is_guaranteed: true,
              early_bird_discount: 5000,
              early_bird_deadline: "2025-09-15"
            },
            {
              id: 102,
              departure_city_code: "DEL",
              departure_city_name: "Delhi",
              departure_date: "2025-10-22",
              return_date: "2025-10-28",
              price_per_person: 92999,
              single_supplement: 25000,
              child_price: 69749,
              currency: "INR",
              available_seats: 8,
              total_seats: 20,
              is_guaranteed: true
            }
          ],
          tags: ["luxury", "city-break", "shopping", "culture", "desert"],
          media: [
            {
              url: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F7456191e08dd4de1a7a13f9d335b9417?format=webp&width=800",
              type: "image",
              title: "Dubai Skyline",
              alt_text: "Dubai luxury skyline with Burj Khalifa"
            }
          ],
          reviews_summary: {
            total_reviews: 156,
            average_rating: 4.8,
            five_star: 89,
            four_star: 45,
            three_star: 15,
            two_star: 5,
            one_star: 2
          },
          recent_reviews: [
            {
              rating: 5,
              title: "Amazing luxury experience",
              review_text: "Everything was perfect from start to finish. The hotel was incredible and the desert safari was unforgettable.",
              reviewer_name: "Priya S.",
              reviewer_location: "Mumbai",
              travel_date: "2024-03-15",
              traveler_type: "Couple",
              created_at: "2024-03-20T10:30:00Z"
            }
          ]
        };
      } else if (slug === "paris-romance-package") {
        packageDetails = {
          id: 2,
          slug: "paris-romance-package",
          title: "Paris Romantic Getaway",
          region_name: "Europe",
          country_name: "France",
          city_name: "Paris",
          duration_days: 5,
          duration_nights: 4,
          overview: "Fall in love with the City of Light on this romantic getaway designed for couples seeking an unforgettable Parisian experience.",
          description: "Experience the romance and charm of Paris with this specially curated package for couples. From intimate Seine river cruises to world-class museums, from charming bistros to luxury shopping, this package captures the essence of Parisian romance.",
          highlights: [
            "Boutique hotel in historic Marais district",
            "Private Eiffel Tower dinner experience",
            "Seine river sunset cruise",
            "Skip-the-line Louvre and Musée d'Orsay",
            "Day trip to Palace of Versailles",
            "French cuisine cooking class for two"
          ],
          base_price_pp: 67500,
          currency: "INR",
          hero_image_url: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F2ae9fcf39c73428481176753547bfc64?format=webp&width=800",
          gallery_images: [
            "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F2ae9fcf39c73428481176753547bfc64?format=webp&width=800",
            "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&h=600&fit=crop&auto=format"
          ],
          rating: 4.6,
          review_count: 89,
          is_featured: false,
          category: "honeymoon",
          themes: ["romance", "culture", "city-break", "museums", "cuisine"],
          inclusions: [
            "4 nights in boutique hotel",
            "Daily breakfast",
            "Seine river cruise",
            "Museum passes",
            "Versailles day trip",
            "Cooking class"
          ],
          exclusions: [
            "International flights",
            "Visa fees",
            "Most meals",
            "Personal expenses"
          ],
          terms_conditions: "Standard booking terms apply.",
          cancellation_policy: "Free cancellation up to 10 days before departure.",
          visa_required: false,
          passport_required: true,
          minimum_age: 0,
          maximum_group_size: 16,
          itinerary: [
            {
              day_number: 1,
              title: "Arrival in Paris",
              description: "Arrive in the City of Light and check into your charming boutique hotel in the Marais district.",
              cities: "Paris",
              meals_included: "Welcome dinner",
              accommodation: "Boutique Hotel Marais",
              activities: ["Airport transfer", "Hotel check-in", "Welcome dinner"]
            }
          ],
          departures: [
            {
              id: 201,
              departure_city_code: "BOM",
              departure_city_name: "Mumbai",
              departure_date: "2025-10-22",
              return_date: "2025-10-26",
              price_per_person: 67500,
              single_supplement: 18000,
              child_price: 50625,
              currency: "INR",
              available_seats: 15,
              total_seats: 16,
              is_guaranteed: true
            }
          ],
          tags: ["romance", "culture", "city-break", "museums"],
          media: [
            {
              url: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F2ae9fcf39c73428481176753547bfc64?format=webp&width=800",
              type: "image",
              title: "Eiffel Tower",
              alt_text: "Romantic view of Eiffel Tower"
            }
          ],
          reviews_summary: {
            total_reviews: 89,
            average_rating: 4.6,
            five_star: 56,
            four_star: 25,
            three_star: 6,
            two_star: 2,
            one_star: 0
          },
          recent_reviews: [
            {
              rating: 5,
              title: "Perfect honeymoon",
              review_text: "Paris was magical! The hotel was perfectly located and the experiences were unforgettable.",
              reviewer_name: "Raj & Anjali",
              reviewer_location: "Delhi",
              travel_date: "2024-02-14",
              traveler_type: "Couple",
              created_at: "2024-02-20T15:45:00Z"
            }
          ]
        };
      } else {
        // Default fallback for any unknown slug
        packageDetails = {
          id: 999,
          slug: slug,
          title: `Package: ${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          region_name: "International",
          country_name: "Various",
          city_name: "Multiple Cities",
          duration_days: 5,
          duration_nights: 4,
          overview: "Discover amazing destinations with this thoughtfully crafted travel package.",
          description: "Experience the best of travel with our carefully designed package that offers a perfect blend of sightseeing, culture, and relaxation.",
          highlights: [
            "Comfortable accommodation",
            "Guided sightseeing tours",
            "Cultural experiences",
            "Local cuisine tasting",
            "Professional guide services"
          ],
          base_price_pp: 45999,
          currency: "INR",
          hero_image_url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format",
          gallery_images: [
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format"
          ],
          rating: 4.3,
          review_count: 45,
          is_featured: false,
          category: "cultural",
          themes: ["culture", "sightseeing", "relaxation"],
          inclusions: [
            "4 nights accommodation",
            "Daily breakfast",
            "Sightseeing tours",
            "Local guide",
            "Airport transfers"
          ],
          exclusions: [
            "International flights",
            "Visa fees",
            "Personal expenses",
            "Tips and gratuities"
          ],
          terms_conditions: "Standard booking terms apply.",
          cancellation_policy: "Free cancellation up to 7 days before departure.",
          visa_required: true,
          passport_required: true,
          minimum_age: 0,
          maximum_group_size: 25,
          itinerary: [
            {
              day_number: 1,
              title: "Arrival",
              description: "Arrive at destination and check into hotel.",
              cities: "Destination City",
              meals_included: "Dinner",
              accommodation: "3-star Hotel",
              activities: ["Airport transfer", "Hotel check-in"]
            }
          ],
          departures: [
            {
              id: 901,
              departure_city_code: "BOM",
              departure_city_name: "Mumbai",
              departure_date: "2025-11-01",
              return_date: "2025-11-05",
              price_per_person: 45999,
              single_supplement: 12000,
              child_price: 34499,
              currency: "INR",
              available_seats: 20,
              total_seats: 25,
              is_guaranteed: false
            }
          ],
          tags: ["culture", "sightseeing"],
          media: [
            {
              url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format",
              type: "image",
              title: "Travel Destination",
              alt_text: "Beautiful travel destination"
            }
          ],
          reviews_summary: {
            total_reviews: 45,
            average_rating: 4.3,
            five_star: 22,
            four_star: 15,
            three_star: 6,
            two_star: 2,
            one_star: 0
          },
          recent_reviews: [
            {
              rating: 4,
              title: "Good experience",
              review_text: "Overall a nice package with good value for money.",
              reviewer_name: "Traveler",
              reviewer_location: "India",
              travel_date: "2024-01-15",
              traveler_type: "Solo",
              created_at: "2024-01-20T12:00:00Z"
            }
          ]
        };
      }

      return {
        success: true,
        data: packageDetails,
        message: "Fallback package details (Live API unavailable)",
      };
    }

    // Packages search endpoint
    if (endpoint.includes("/packages")) {
      return {
        packages: [
          {
            id: 1,
            slug: "dubai-luxury-package",
            title: "Dubai Luxury Experience",
            region_name: "Middle East",
            country_name: "United Arab Emirates",
            duration_days: 7,
            duration_nights: 6,
            from_price: 89999,
            currency: "INR",
            next_departure_date: "2025-10-15",
            available_departures_count: 8,
            hero_image_url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format",
            rating: 4.8,
            review_count: 156,
            is_featured: true,
            tags: ["luxury", "city-break", "shopping", "culture"],
            highlights: [
              "5-star hotel accommodation",
              "Burj Khalifa and Dubai Mall visits",
              "Desert safari with BBQ dinner",
              "Dubai Marina cruise",
              "Shopping at Gold Souk"
            ],
            category: "luxury"
          },
          {
            id: 2,
            slug: "paris-romance-package",
            title: "Paris Romantic Getaway",
            region_name: "Europe",
            country_name: "France",
            duration_days: 5,
            duration_nights: 4,
            from_price: 67500,
            currency: "INR",
            next_departure_date: "2025-10-22",
            available_departures_count: 12,
            hero_image_url: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop&auto=format",
            rating: 4.6,
            review_count: 89,
            is_featured: false,
            tags: ["romance", "culture", "city-break", "museums"],
            highlights: [
              "Boutique hotel in Marais district",
              "Eiffel Tower and Louvre Museum",
              "Seine river cruise",
              "Versailles day trip",
              "French cuisine experiences"
            ],
            category: "honeymoon"
          },
          {
            id: 3,
            slug: "bali-family-adventure",
            title: "Bali Family Adventure",
            region_name: "Southeast Asia",
            country_name: "Indonesia",
            duration_days: 8,
            duration_nights: 7,
            from_price: 54999,
            currency: "INR",
            next_departure_date: "2025-11-05",
            available_departures_count: 15,
            hero_image_url: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop&auto=format",
            rating: 4.5,
            review_count: 203,
            is_featured: true,
            tags: ["family", "beach", "adventure", "culture"],
            highlights: [
              "Family-friendly resort with kids club",
              "Ubud rice terraces and monkey forest",
              "Tanah Lot temple visit",
              "Water sports at Nusa Dua",
              "Traditional Balinese cultural show"
            ],
            category: "family"
          },
          {
            id: 4,
            slug: "kerala-backwaters-culture",
            title: "Kerala Backwaters & Culture",
            region_name: "South India",
            country_name: "India",
            duration_days: 6,
            duration_nights: 5,
            from_price: 28999,
            currency: "INR",
            next_departure_date: "2025-10-30",
            available_departures_count: 20,
            hero_image_url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop&auto=format",
            rating: 4.7,
            review_count: 124,
            is_featured: false,
            tags: ["culture", "nature", "ayurveda", "backwaters"],
            highlights: [
              "Houseboat stay in Alleppey",
              "Ayurvedic spa treatments",
              "Periyar wildlife sanctuary",
              "Spice plantation tours",
              "Kathakali dance performance"
            ],
            category: "cultural"
          },
          {
            id: 5,
            slug: "maldives-beach-paradise",
            title: "Maldives Beach Paradise",
            region_name: "Indian Ocean",
            country_name: "Maldives",
            duration_days: 4,
            duration_nights: 3,
            from_price: 125000,
            currency: "INR",
            next_departure_date: "2025-11-10",
            available_departures_count: 6,
            hero_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format",
            rating: 4.9,
            review_count: 78,
            is_featured: true,
            tags: ["beach", "luxury", "honeymoon", "water-sports"],
            highlights: [
              "Overwater villa accommodation",
              "Snorkeling and diving",
              "Sunset dolphin cruise",
              "Spa treatments",
              "Private beach dining"
            ],
            category: "beach"
          },
          {
            id: 6,
            slug: "himachal-adventure",
            title: "Himachal Adventure Trek",
            region_name: "North India",
            country_name: "India",
            duration_days: 10,
            duration_nights: 9,
            from_price: 35999,
            currency: "INR",
            next_departure_date: "2025-11-20",
            available_departures_count: 10,
            hero_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format",
            rating: 4.4,
            review_count: 92,
            is_featured: false,
            tags: ["adventure", "mountains", "trekking", "nature"],
            highlights: [
              "Guided mountain trekking",
              "Stay in mountain lodges",
              "Visit to Rohtang Pass",
              "River rafting in Kullu",
              "Local Himachali cuisine"
            ],
            category: "adventure"
          }
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 6,
          total_pages: 1,
          has_next: false,
          has_prev: false
        },
        facets: {
          regions: {
            "Middle East": 1,
            "Europe": 1,
            "Southeast Asia": 1,
            "South India": 1,
            "Indian Ocean": 1,
            "North India": 1
          },
          categories: {
            "luxury": 2,
            "honeymoon": 2,
            "family": 1,
            "cultural": 1,
            "beach": 1,
            "adventure": 1
          },
          tags: {
            "culture": 3,
            "luxury": 3,
            "beach": 2,
            "adventure": 2,
            "honeymoon": 2,
            "family": 1,
            "nature": 2
          },
          price_ranges: {
            min: 28999,
            max: 125000,
            avg: 67082
          }
        },
        filters: params || {}
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
