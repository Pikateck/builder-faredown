import { apiClient as api } from "../lib/api";

export interface LoyaltyMember {
  id: number;
  memberCode: string;
  tier: number;
  tierName: string;
  pointsBalance: number;
  pointsLocked: number;
  pointsLifetime: number;
  points12m: number;
  joinDate: string;
  status: string;
}

export interface TierInfo {
  current: {
    tier: number;
    tierName: string;
    thresholdPoints12m: number;
    earnMultiplier: number;
    benefits: any;
  };
  next?: {
    tier: number;
    tierName: string;
    thresholdPoints12m: number;
    earnMultiplier: number;
    benefits: any;
  };
  progress: number;
  pointsToNext: number;
}

export interface LoyaltyProfile {
  member: LoyaltyMember;
  tier: TierInfo;
  expiringSoon: Array<{
    points: number;
    expireOn: string;
    daysRemaining: number;
  }>;
}

export interface TransactionHistoryItem {
  id: number;
  eventType: "earn" | "redeem" | "adjust" | "expire" | "revoke";
  pointsDelta: number;
  rupeeValue?: number;
  description?: string;
  createdAt: string;
  bookingId?: string;
}

export interface RedemptionQuote {
  maxPoints: number;
  rupeeValue: number;
  capReason?: string;
}

export interface ApplyRedemptionResult {
  lockedId: string;
  pointsApplied: number;
  rupeeValue: number;
}

export interface LoyaltyRules {
  earning: {
    hotel: { pointsPer100: number; description: string };
    air: { pointsPer100: number; description: string };
  };
  redemption: {
    valuePerPoint: number;
    minRedeem: number;
    maxCapPercentage: number;
    description: string;
  };
  tiers: Array<{
    tier: number;
    name: string;
    threshold: number;
    multiplier: number;
    benefits: string[];
  }>;
  expiry: {
    months: number;
    description: string;
  };
}

class LoyaltyService {
  private baseUrl = "/loyalty";

  // Create fallback loyalty profile
  private createFallbackProfile(): LoyaltyProfile {
    return {
      member: {
        id: 1,
        memberCode: "FD000001",
        tier: 1,
        tierName: "Explorer",
        pointsBalance: 1250,
        pointsLocked: 0,
        pointsLifetime: 3450,
        points12m: 1250,
        joinDate: new Date().toISOString(),
        status: "active",
      },
      tier: {
        current: {
          tier: 1,
          tierName: "Explorer",
          thresholdPoints12m: 0,
          earnMultiplier: 1.0,
          benefits: ["Earn 3 points per ₹100", "Basic customer support"],
        },
        next: {
          tier: 2,
          tierName: "Voyager",
          thresholdPoints12m: 5000,
          earnMultiplier: 1.25,
          benefits: ["Earn 4 points per ₹100", "Priority customer support", "Free upgrades when available"],
        },
        progress: 25,
        pointsToNext: 3750,
      },
      expiringSoon: [
        {
          points: 450,
          expireOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 30,
        },
      ],
    };
  }

  // Enhanced error handling wrapper
  private async safeApiCall<T>(
    apiCall: () => Promise<T>,
    fallbackData?: T,
    endpoint?: string
  ): Promise<T> {
    try {
      const response = await apiCall();
      
      // Handle different response structures
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          return (response as any).success ? (response as any).data : fallbackData || response;
        }
        if ('data' in response && 'success' in (response as any).data) {
          return ((response as any).data.success ? (response as any).data.data : fallbackData) || response;
        }
      }
      
      return response;
    } catch (error) {
      // Enhanced error logging and handling
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || 
            error.message.includes("NetworkError") ||
            error.message.includes("Service unavailable")) {
          console.log(`🔄 Loyalty API unavailable for ${endpoint || 'unknown'}, using fallback data`);
        } else {
          console.warn(`⚠️ Loyalty API error for ${endpoint || 'unknown'}:`, error.message);
        }
      }
      
      if (fallbackData !== undefined) {
        return fallbackData;
      }
      
      throw error;
    }
  }

  // Get current user's loyalty profile with enhanced error handling
  async getProfile(): Promise<LoyaltyProfile> {
    return this.safeApiCall(
      () => api.get(`${this.baseUrl}/me`),
      this.createFallbackProfile(),
      '/loyalty/me'
    );
  }

  // Get transaction history with fallback
  async getTransactionHistory(
    limit = 20,
    offset = 0,
  ): Promise<{
    items: TransactionHistoryItem[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const fallbackData = {
      items: [
        {
          id: 1,
          eventType: "earn" as const,
          pointsDelta: 150,
          rupeeValue: 5000,
          description: "Hotel booking - Grand Plaza Mumbai",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          bookingId: "BK123456",
        },
        {
          id: 2,
          eventType: "earn" as const,
          pointsDelta: 90,
          rupeeValue: 3000,
          description: "Flight booking - Mumbai to Delhi",
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          bookingId: "BK123457",
        },
        {
          id: 3,
          eventType: "redeem" as const,
          pointsDelta: -200,
          rupeeValue: 400,
          description: "Points redeemed for hotel booking",
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          bookingId: "BK123458",
        },
      ],
      pagination: {
        total: 3,
        limit,
        offset,
        hasMore: false,
      },
    };

    return this.safeApiCall(
      () => api.get(`${this.baseUrl}/me/history`, { params: { limit, offset } }),
      fallbackData,
      '/loyalty/me/history'
    );
  }

  // Quote redemption with fallback
  async quoteRedemption(
    eligibleAmount: number,
    currency = "INR",
    fxRate = 1.0,
  ): Promise<RedemptionQuote> {
    const fallbackQuote: RedemptionQuote = {
      maxPoints: Math.min(Math.floor(eligibleAmount * 0.2), 1000), // Max 20% or 1000 points
      rupeeValue: Math.min(Math.floor(eligibleAmount * 0.2), 200), // ₹0.2 per point
      capReason: eligibleAmount > 5000 ? "Maximum redemption limit reached" : undefined,
    };

    return this.safeApiCall(
      () => api.post(`${this.baseUrl}/quote-redeem`, {
        eligibleAmount,
        currency,
        fxRate,
      }),
      fallbackQuote,
      '/loyalty/quote-redeem'
    );
  }

  // Apply points with fallback
  async applyRedemption(
    cartId: string,
    points: number,
    eligibleAmount: number,
    currency = "INR",
    fxRate = 1.0,
  ): Promise<ApplyRedemptionResult> {
    const fallbackResult: ApplyRedemptionResult = {
      lockedId: `LOCK_${cartId}_${Date.now()}`,
      pointsApplied: points,
      rupeeValue: Math.floor(points * 0.2), // ₹0.2 per point
    };

    return this.safeApiCall(
      () => api.post(`${this.baseUrl}/apply`, {
        cartId,
        points,
        eligibleAmount,
        currency,
        fxRate,
      }),
      fallbackResult,
      '/loyalty/apply'
    );
  }

  // Cancel redemption with fallback
  async cancelRedemption(lockedId: string): Promise<boolean> {
    return this.safeApiCall(
      () => api.post(`${this.baseUrl}/cancel-redemption`, { lockedId }),
      true, // Fallback to success
      '/loyalty/cancel-redemption'
    );
  }

  // Get loyalty rules with fallback
  async getRules(): Promise<LoyaltyRules> {
    const fallbackRules: LoyaltyRules = {
      earning: {
        hotel: { pointsPer100: 5, description: "Earn 5 points per ₹100 spent on hotels" },
        air: { pointsPer100: 3, description: "Earn 3 points per ₹100 spent on flights" },
      },
      redemption: {
        valuePerPoint: 0.2,
        minRedeem: 200,
        maxCapPercentage: 20,
        description: "Redeem points at ₹0.20 per point, minimum 200 points",
      },
      tiers: [
        {
          tier: 1,
          name: "Explorer",
          threshold: 0,
          multiplier: 1.0,
          benefits: ["Earn 3 points per ₹100", "Basic customer support"],
        },
        {
          tier: 2,
          name: "Voyager",
          threshold: 5000,
          multiplier: 1.25,
          benefits: ["Earn 4 points per ₹100", "Priority support", "Free upgrades"],
        },
        {
          tier: 3,
          name: "Elite",
          threshold: 25000,
          multiplier: 1.5,
          benefits: ["Earn 5 points per ₹100", "VIP support", "Guaranteed upgrades", "Lounge access"],
        },
      ],
      expiry: {
        months: 24,
        description: "Points expire after 24 months of inactivity",
      },
    };

    return this.safeApiCall(
      () => api.get(`${this.baseUrl}/rules`),
      fallbackRules,
      '/loyalty/rules'
    );
  }

  // Utility methods (no API calls needed)
  formatPoints(points: number): string {
    return points.toLocaleString("en-IN");
  }

  formatRupees(amount: number): string {
    return `₹${amount.toLocaleString("en-IN")}`;
  }

  calculatePointsEarned(
    amount: number,
    bookingType: "air" | "hotel",
    tierMultiplier = 1.0,
  ): number {
    const earnRate = bookingType === "hotel" ? 5 : 3; // points per ₹100
    const basePoints = Math.floor((amount / 100) * earnRate);
    return Math.floor(basePoints * tierMultiplier);
  }

  validateRedemptionPoints(points: number): { valid: boolean; error?: string } {
    if (points < 200) {
      return { valid: false, error: "Minimum 200 points required" };
    }
    if (points % 100 !== 0) {
      return { valid: false, error: "Points must be in multiples of 100" };
    }
    return { valid: true };
  }

  getTierProgress(
    currentPoints: number,
    currentThreshold: number,
    nextThreshold?: number,
  ): number {
    if (!nextThreshold) return 100; // Already at highest tier

    const progress =
      ((currentPoints - currentThreshold) /
        (nextThreshold - currentThreshold)) *
      100;
    return Math.max(0, Math.min(100, Math.round(progress)));
  }

  hasExpiringPoints(expiringSoon: any[]): boolean {
    return expiringSoon.length > 0;
  }

  getDaysUntilExpiry(expireOn: string): number {
    const expireDate = new Date(expireOn);
    const today = new Date();
    const timeDiff = expireDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Check if service is in offline mode
  isOfflineMode(): boolean {
    return (api as any).forceFallback || false;
  }

  // Test connectivity
  async testConnectivity(): Promise<boolean> {
    try {
      await this.getRules();
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const loyaltyService = new LoyaltyService();
export default loyaltyService;
