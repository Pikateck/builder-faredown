/**
 * Sightseeing Service - Handles API calls and price calculations
 * Ensures consistent pricing across all components
 */

export interface SightseeingAttraction {
  id: string;
  name: string;
  location: string;
  images: string[];
  rating: number;
  reviews: number;
  originalPrice: number;
  currentPrice: number;
  description: string;
  category: string;
  duration: string;
  ticketTypes: {
    name: string;
    price: number;
    features: string[];
    refundable: boolean;
    cancellationPolicy: string;
  }[];
}

export interface PriceCalculation {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  breakdown: {
    adults: { count: number; price: number; total: number };
    children: { count: number; price: number; total: number };
    infants: { count: number; price: number; total: number };
  };
}

export class SightseeingService {
  private readonly TAX_RATE = 0.18; // 18% tax

  /**
   * Calculate price including tax for given passengers and ticket
   */
  calculatePrice(
    ticketPrice: number,
    adults: number = 0,
    children: number = 0,
    infants: number = 0
  ): PriceCalculation {
    const adultsTotal = ticketPrice * adults;
    const childrenTotal = ticketPrice * 0.5 * children; // Children 50% price
    const infantsTotal = 0; // Infants free

    const basePrice = adultsTotal + childrenTotal + infantsTotal;
    const taxAmount = basePrice * this.TAX_RATE;
    const totalPrice = basePrice + taxAmount;

    return {
      basePrice,
      taxAmount,
      totalPrice,
      breakdown: {
        adults: { count: adults, price: ticketPrice, total: adultsTotal },
        children: { count: children, price: ticketPrice * 0.5, total: childrenTotal },
        infants: { count: infants, price: 0, total: infantsTotal }
      }
    };
  }

  /**
   * Get attraction details by ID
   */
  async getAttractionDetails(attractionId: string): Promise<SightseeingAttraction> {
    try {
      const response = await fetch(`/api/sightseeing/details/${attractionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch attraction: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.activity) {
        return this.transformApiDataToAttraction(data.activity, attractionId);
      } else {
        throw new Error(data.message || "Failed to load attraction data");
      }
    } catch (error) {
      console.error("Error fetching attraction:", error);
      // Return fallback data
      return this.getFallbackAttraction(attractionId);
    }
  }

  /**
   * Transform API data to component format
   */
  private transformApiDataToAttraction(apiData: any, attractionId: string): SightseeingAttraction {
    return {
      id: apiData.activity_code || attractionId,
      name: apiData.activity_name || apiData.name || "Unknown Activity",
      location: `${apiData.city || "Unknown"}, ${apiData.country || ""}`,
      images: apiData.gallery_images || [apiData.main_image_url || ""],
      rating: apiData.rating || 4.5,
      reviews: apiData.reviews_count || 100,
      originalPrice: apiData.original_price || apiData.base_price || 149,
      currentPrice: apiData.current_price || apiData.base_price || 149,
      description: apiData.activity_description || apiData.description || "",
      category: apiData.category || "tour",
      duration: apiData.duration_text || "2-3 hours",
      ticketTypes: apiData.ticket_types || [
        {
          name: "Standard Admission",
          price: apiData.base_price || 149,
          refundable: false,
          cancellationPolicy: "Non-refundable",
          features: ["Standard access", "Basic facilities"]
        },
        {
          name: "Premium Experience", 
          price: (apiData.base_price || 149) * 1.3,
          refundable: true,
          cancellationPolicy: "Free cancellation up to 24 hours before visit",
          features: ["Premium access", "Enhanced facilities", "Priority service"]
        }
      ]
    };
  }

  /**
   * Fallback attraction data when API is unavailable
   */
  private getFallbackAttraction(attractionId: string): SightseeingAttraction {
    const fallbackData: Record<string, SightseeingAttraction> = {
      "burj-khalifa": {
        id: "burj-khalifa",
        name: "Burj Khalifa: Floors 124 and 125",
        location: "Dubai, UAE",
        images: [
          "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F31c1e4a8ae8d4a1ab766aa8a4417f49e?format=webp&width=800",
        ],
        rating: 4.6,
        reviews: 45879,
        originalPrice: 189,
        currentPrice: 149,
        description: "Skip the line and enjoy breathtaking views from the world's tallest building.",
        category: "landmark",
        duration: "1-2 hours",
        ticketTypes: [
          {
            name: "Standard Admission",
            price: 149,
            refundable: false,
            cancellationPolicy: "Non-refundable",
            features: ["Floors 124 & 125", "Skip-the-line access", "Outdoor deck", "Welcome drink"]
          },
          {
            name: "Prime Time",
            price: 199,
            refundable: true,
            cancellationPolicy: "Free cancellation up to 24 hours before visit",
            features: ["Floors 124 & 125", "Skip-the-line access", "Prime viewing times", "Premium refreshments"]
          },
          {
            name: "VIP Experience",
            price: 299,
            refundable: true,
            cancellationPolicy: "Free cancellation up to 48 hours before visit",
            features: ["Floors 124, 125 & 148", "Private elevator", "VIP lounge access", "Premium refreshments"]
          }
        ]
      }
    };

    return fallbackData[attractionId] || fallbackData["burj-khalifa"];
  }

  /**
   * Create booking
   */
  async createBooking(bookingData: any): Promise<any> {
    try {
      const response = await fetch('/api/sightseeing/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error(`Booking failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  }
}

// Create instance for default export
export const sightseeingService = new SightseeingService();
export default sightseeingService;
