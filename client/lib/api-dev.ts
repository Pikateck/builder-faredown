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

    // Default fallback
    return {
      success: false,
      error: "API server offline",
      data: null,
      message: "Development mode - API server not available",
    };
  }
}
