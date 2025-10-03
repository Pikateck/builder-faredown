/**
 * Promo Code Service
 * Handles all promo code-related API operations for admin panel
 */

import { apiClient } from "@/lib/api";
import { normalizeCabinClass, type CabinClassValue } from "@/lib/cabinClasses";

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  category: "flight" | "hotel" | "both";
  image?: string;
  discountType: "percentage" | "fixed";
  discountMinValue: number;
  discountMaxValue: number;
  minimumFareAmount: number;
  marketingBudget: number;
  expiryDate: string;
  promoCodeImage: string;
  displayOnHomePage: "yes" | "no";
  status: "pending" | "active";

  // Flight-specific fields
  origin?: string;
  destination?: string;
  carrierCode?: string;
  cabinClass?: CabinClassValue | null;
  flightBy?: string;

  // Hotel-specific fields
  hotelCity?: string;
  hotelName?: string;

  createdOn: string;
  updatedOn: string;
  module: "flight" | "hotel";
  validityType: "unlimited" | "limited";
  usageCount?: number;
  maxUsage?: number;
}

export interface CreatePromoCodeRequest {
  code: string;
  description: string;
  category: "flight" | "hotel" | "both";
  discountType: "percentage" | "fixed";
  discountMinValue: number;
  discountMaxValue: number;
  minimumFareAmount: number;
  marketingBudget: number;
  expiryDate: string;
  promoCodeImage?: string;
  displayOnHomePage: "yes" | "no";
  status: "pending" | "active";

  // Optional fields based on category
  origin?: string;
  destination?: string;
  carrierCode?: string;
  cabinClass?: CabinClassValue | null;
  flightBy?: string;
  hotelCity?: string;
  hotelName?: string;
  validityType: "unlimited" | "limited";
  maxUsage?: number;
}

export interface PromoCodeFilters {
  search?: string;
  module?: string;
  status?: string;
  page?: number;
  limit?: number;
}

class PromoCodeService {
  private baseUrl = "/api/admin/promo";

  /**
   * Get all promo codes with optional filters
   */
  async getPromoCodes(filters: PromoCodeFilters = {}): Promise<{
    promoCodes: PromoCode[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params: Record<string, any> = {};

      if (filters.search) params.search = filters.search;
      if (filters.module && filters.module !== "all")
        params.module = filters.module;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const response = await apiClient.get<any>(this.baseUrl, params);
      return this.normalizePromoCodeResponse(response);
    } catch (error) {
      console.error("Error fetching promo codes:", error);

      if (
        error instanceof Error &&
        (error.message.includes("API server offline") ||
          error.message.includes("API server unavailable") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("Failed to fetch"))
      ) {
        console.log(
          "🔄 Using fallback promo code data due to API unavailability",
        );

        return {
          promoCodes: [
            {
              id: "promo_001",
              code: "FAREDOWNHOTEL",
              description: "Hotel booking discount for loyal customers",
              category: "hotel",
              image:
                "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F57003a8eaa4240e5a35dce05a23e72f5?format=webp&width=800",
              discountType: "percentage",
              discountMinValue: 15,
              discountMaxValue: 5000,
              minimumFareAmount: 10000,
              marketingBudget: 100000,
              expiryDate: "2024-12-31",
              promoCodeImage: "",
              displayOnHomePage: "yes",
              status: "active",
              hotelCity: "ALL",
              hotelName: "",
              createdOn: "2024-01-14 13:31",
              updatedOn: "2024-01-16 13:58",
              module: "hotel",
              validityType: "unlimited",
              usageCount: 67,
              maxUsage: null,
            },
            {
              id: "promo_002",
              code: "FAREDOWNFLIGHT",
              description:
                "Flight discount promo for domestic and international routes",
              category: "flight",
              image:
                "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F8542893d1c0b422f87eee4c35e5441ae?format=webp&width=800",
              discountType: "fixed",
              discountMinValue: 1500,
              discountMaxValue: 3000,
              minimumFareAmount: 8000,
              marketingBudget: 150000,
              expiryDate: "2024-11-30",
              promoCodeImage: "",
              displayOnHomePage: "no",
              status: "active",
              origin: "ALL",
              destination: "ALL",
              carrierCode: "ALL",
              cabinClass: "economy",
              flightBy: "",
              createdOn: "2024-01-10 09:15",
              updatedOn: "2024-01-15 16:45",
              module: "flight",
              validityType: "limited",
              usageCount: 45,
              maxUsage: 100,
            },
          ],
          total: 2,
          page: 1,
          totalPages: 1,
        };
      }

      throw error;
    }
  }

  private normalizePromoCodeResponse(raw: any): {
    promoCodes: PromoCode[];
    total: number;
    page: number;
    totalPages: number;
  } {
    if (!raw) {
      throw new Error("Empty promo code response");
    }

    let payload = raw;
    if (typeof raw === "string") {
      try {
        payload = JSON.parse(raw);
      } catch (parseError) {
        throw new Error("Invalid promo code response format");
      }
    }

    const candidateArrays = [
      payload?.promoCodes,
      payload?.data?.promoCodes,
      payload?.data?.items,
      payload?.items,
    ];
    const promoCodes = candidateArrays.find(Array.isArray) || [];

    if (!Array.isArray(promoCodes)) {
      throw new Error("Promo code response missing items array");
    }

    const normalizedPromoCodes = (promoCodes as any[]).map((code) => ({
      ...code,
      // Handle both cabinClass (frontend) and service_class (database) fields
      cabinClass:
        normalizeCabinClass(code.cabinClass || code.service_class) ?? null,
    }));

    const totalCandidates = [
      payload?.total,
      payload?.data?.total,
      payload?.pagination?.total,
      payload?.data?.pagination?.total,
      typeof payload?.count === "number" ? payload.count : undefined,
    ];
    const total =
      totalCandidates.find((value) => typeof value === "number") ??
      promoCodes.length;

    const pageCandidates = [
      payload?.page,
      payload?.data?.page,
      payload?.pagination?.page,
      payload?.data?.pagination?.page,
    ];
    const page = pageCandidates.find((value) => typeof value === "number") ?? 1;

    const pageSizeCandidates = [
      payload?.limit,
      payload?.data?.limit,
      payload?.pagination?.limit,
      payload?.data?.pagination?.limit,
    ];
    const pageSize =
      pageSizeCandidates.find((value) => typeof value === "number") ?? 10;

    const totalPageCandidates = [
      payload?.totalPages,
      payload?.data?.totalPages,
      payload?.pagination?.pages,
      payload?.data?.pagination?.pages,
    ];
    const totalPages =
      totalPageCandidates.find((value) => typeof value === "number") ??
      Math.max(1, Math.ceil(total / pageSize));

    return {
      promoCodes: normalizedPromoCodes as PromoCode[],
      total,
      page,
      totalPages,
    };
  }

  /**
   * Create a new promo code
   */
  async createPromoCode(promoData: CreatePromoCodeRequest): Promise<PromoCode> {
    try {
      const response = await apiClient.post(this.baseUrl, promoData);

      if (response.ok) {
        return response.data.promoCode;
      } else {
        throw new Error(response.error || "Failed to create promo code");
      }
    } catch (error) {
      console.error("Error creating promo code:", error);
      throw error;
    }
  }

  /**
   * Update an existing promo code
   */
  async updatePromoCode(
    promoId: string,
    promoData: Partial<CreatePromoCodeRequest>,
  ): Promise<PromoCode> {
    try {
      const response = await apiClient.put(
        `${this.baseUrl}/${promoId}`,
        promoData,
      );

      if (response.ok) {
        return response.data.promoCode;
      } else {
        throw new Error(response.error || "Failed to update promo code");
      }
    } catch (error) {
      console.error("Error updating promo code:", error);
      throw error;
    }
  }

  /**
   * Delete a promo code
   */
  async deletePromoCode(promoId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${promoId}`);

      if (!response.ok) {
        throw new Error(response.error || "Failed to delete promo code");
      }
    } catch (error) {
      console.error("Error deleting promo code:", error);
      throw error;
    }
  }

  /**
   * Toggle promo code status (active/pending)
   */
  async togglePromoCodeStatus(promoId: string): Promise<PromoCode> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/${promoId}/toggle-status`,
      );

      if (response.ok) {
        return response.data.promoCode;
      } else {
        throw new Error(response.error || "Failed to toggle promo code status");
      }
    } catch (error) {
      console.error("Error toggling promo code status:", error);
      throw error;
    }
  }

  /**
   * Validate promo code for a specific booking
   */
  async validatePromoCode(
    code: string,
    bookingDetails: {
      amount: number;
      category: "flight" | "hotel";
      origin?: string;
      destination?: string;
      hotelCity?: string;
    },
  ): Promise<{
    valid: boolean;
    discount: number;
    finalAmount: number;
    message: string;
  }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/validate`, {
        code,
        ...bookingDetails,
      });

      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.error || "Failed to validate promo code");
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
      throw error;
    }
  }

  /**
   * Get promo code usage statistics
   */
  async getPromoCodeStats(promoId: string): Promise<{
    totalUsage: number;
    remainingUsage: number;
    totalSavings: number;
    recentUsage: {
      date: string;
      bookingId: string;
      amount: number;
      discount: number;
    }[];
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${promoId}/stats`);

      if (response.ok) {
        return response.data;
      } else {
        throw new Error(
          response.error || "Failed to fetch promo code statistics",
        );
      }
    } catch (error) {
      console.error("Error fetching promo code stats:", error);
      throw error;
    }
  }

  /**
   * Apply promo code to a booking (used in bargain engine)
   */
  async applyPromoCode(
    code: string,
    originalAmount: number,
    bookingDetails: {
      category: "flight" | "hotel";
      origin?: string;
      destination?: string;
      hotelCity?: string;
      minimumMarkupThreshold: number; // Ensure we don't go below minimum markup
    },
  ): Promise<{
    success: boolean;
    discount: number;
    finalAmount: number;
    message: string;
    promoCodeId?: string;
  }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/apply`, {
        code,
        originalAmount,
        ...bookingDetails,
      });

      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.error || "Failed to apply promo code");
      }
    } catch (error) {
      console.error("Error applying promo code:", error);
      throw error;
    }
  }
}

export const promoCodeService = new PromoCodeService();
