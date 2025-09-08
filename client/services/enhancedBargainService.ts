/**
 * Enhanced Bargain Engine API Service
 * Handles multi-round bargaining with FOMO logic for all modules
 */

import { apiClient, ApiResponse } from "@/lib/api";

// Enhanced Bargain Types
export interface EnhancedBargainSession {
  session_id: string;
  user_id: string;
  module: 'flights' | 'hotels' | 'sightseeing' | 'transfers';
  supplier_net_rate: number;
  current_round: number;
  max_rounds: number;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  emotional_state: 'optimistic' | 'neutral' | 'urgent' | 'desperate';
  created_at: string;
  expires_at: string;
  final_price?: number;
  savings_amount?: number;
}

export interface EnhancedBargainRound {
  round_number: number;
  user_offer: number;
  ai_response: string;
  price_offered: number;
  is_accepted: boolean;
  round_type: 'opening' | 'negotiation' | 'final';
  emotional_tone: string;
  created_at: string;
}

export interface EnhancedBargainRequest {
  module: 'flights' | 'hotels' | 'sightseeing' | 'transfers';
  supplier_net_rate: number;
  user_context?: {
    location?: string;
    item_name?: string;
    features?: string[];
  };
  promo_code?: string;
}

export interface EnhancedBargainOffer {
  session_id: string;
  user_offer: number;
  round_number: number;
}

export interface EnhancedBargainResponse {
  success: boolean;
  session_id: string;
  current_round: number;
  ai_message: string;
  price_offered: number;
  display_price: number;
  your_savings: number;
  is_price_match: boolean;
  is_final_round: boolean;
  emotional_state: string;
  time_pressure_message?: string;
  hold_expires_at?: string;
}

export interface EnhancedBargainHold {
  hold_id: string;
  session_id: string;
  held_price: number;
  expires_at: string;
  status: 'active' | 'expired' | 'accepted';
}

export interface EnhancedBargainAcceptance {
  session_id: string;
  final_price: number;
  accepted: boolean;
}

// Enhanced Bargain Service Class
export class EnhancedBargainService {
  private readonly baseUrl = "/api/enhanced-bargain";

  /**
   * Start a new enhanced bargain session
   */
  async startSession(request: EnhancedBargainRequest): Promise<EnhancedBargainResponse> {
    try {
      const response = await apiClient.post<ApiResponse<EnhancedBargainResponse>>(
        `${this.baseUrl}/start`,
        request,
      );

      if (response.data) {
        return response.data;
      }

      throw new Error("Failed to start enhanced bargain session");
    } catch (error) {
      console.error("Enhanced bargain start error:", error);
      throw new Error("Failed to connect to bargain engine");
    }
  }

  /**
   * Make an offer in the current session
   */
  async makeOffer(offer: EnhancedBargainOffer): Promise<EnhancedBargainResponse> {
    try {
      const response = await apiClient.post<ApiResponse<EnhancedBargainResponse>>(
        `${this.baseUrl}/offer`,
        offer,
      );

      if (response.data) {
        return response.data;
      }

      throw new Error("Failed to process bargain offer");
    } catch (error) {
      console.error("Enhanced bargain offer error:", error);
      throw new Error("Failed to submit offer");
    }
  }

  /**
   * Accept a bargain offer and complete the session
   */
  async acceptOffer(acceptance: EnhancedBargainAcceptance): Promise<{
    success: boolean;
    final_price: number;
    total_savings: number;
    congratulations_message: string;
  }> {
    try {
      const response = await apiClient.post<ApiResponse<{
        success: boolean;
        final_price: number;
        total_savings: number;
        congratulations_message: string;
      }>>(
        `${this.baseUrl}/accept`,
        acceptance,
      );

      if (response.data) {
        return response.data;
      }

      throw new Error("Failed to accept bargain offer");
    } catch (error) {
      console.error("Enhanced bargain accept error:", error);
      throw new Error("Failed to accept offer");
    }
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<{
    session: EnhancedBargainSession;
    rounds: EnhancedBargainRound[];
    current_hold?: EnhancedBargainHold;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        session: EnhancedBargainSession;
        rounds: EnhancedBargainRound[];
        current_hold?: EnhancedBargainHold;
      }>>(
        `${this.baseUrl}/session/${sessionId}`,
      );

      if (response.data) {
        return response.data;
      }

      throw new Error("Failed to get session details");
    } catch (error) {
      console.error("Enhanced bargain session error:", error);
      throw new Error("Failed to retrieve session");
    }
  }

  /**
   * Get AI suggestions for optimal bargaining
   */
  async getAISuggestions(
    module: 'flights' | 'hotels' | 'sightseeing' | 'transfers',
    originalPrice: number,
    userContext?: any
  ): Promise<{
    suggested_opening_offer: number;
    suggested_final_offer: number;
    confidence_level: number;
    market_analysis: string;
    negotiation_tips: string[];
    optimal_strategy: string;
  }> {
    try {
      const response = await apiClient.post<ApiResponse<{
        suggested_opening_offer: number;
        suggested_final_offer: number;
        confidence_level: number;
        market_analysis: string;
        negotiation_tips: string[];
        optimal_strategy: string;
      }>>(
        `${this.baseUrl}/suggestions`,
        { module, original_price: originalPrice, user_context: userContext }
      );

      if (response.data) {
        return response.data;
      }

      throw new Error("Failed to get AI suggestions");
    } catch (error) {
      console.error("Enhanced bargain suggestions error:", error);
      throw new Error("Failed to get suggestions");
    }
  }

  /**
   * Validate if item is eligible for bargaining
   */
  async validateEligibility(
    module: 'flights' | 'hotels' | 'sightseeing' | 'transfers',
    itemId: string,
    price: number
  ): Promise<{
    eligible: boolean;
    reason?: string;
    max_discount_percentage?: number;
    estimated_savings?: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        eligible: boolean;
        reason?: string;
        max_discount_percentage?: number;
        estimated_savings?: number;
      }>>(
        `${this.baseUrl}/validate`,
        { module, item_id: itemId, price }
      );

      if (response.data) {
        return response.data;
      }

      throw new Error("Failed to validate eligibility");
    } catch (error) {
      console.error("Enhanced bargain validation error:", error);
      // Return default eligibility for graceful degradation
      return {
        eligible: true,
        max_discount_percentage: 15,
        estimated_savings: price * 0.1
      };
    }
  }

  /**
   * Cancel an active session
   */
  async cancelSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/session/${sessionId}`);
    } catch (error) {
      console.error("Enhanced bargain cancel error:", error);
      throw new Error("Failed to cancel session");
    }
  }

  /**
   * Get user's bargain history and statistics
   */
  async getUserStatistics(): Promise<{
    total_sessions: number;
    successful_bargains: number;
    total_savings: number;
    average_discount: number;
    success_rate: number;
    recent_sessions: EnhancedBargainSession[];
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        total_sessions: number;
        successful_bargains: number;
        total_savings: number;
        average_discount: number;
        success_rate: number;
        recent_sessions: EnhancedBargainSession[];
      }>>(
        `${this.baseUrl}/statistics`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error("Failed to get user statistics");
    } catch (error) {
      console.error("Enhanced bargain statistics error:", error);
      throw new Error("Failed to retrieve statistics");
    }
  }

  /**
   * Report feedback on bargain experience
   */
  async reportFeedback(
    sessionId: string,
    feedback: {
      satisfaction_rating: number; // 1-5
      experience_rating: number; // 1-5
      would_recommend: boolean;
      comments?: string;
    }
  ): Promise<void> {
    try {
      await apiClient.post(
        `${this.baseUrl}/feedback`,
        { session_id: sessionId, ...feedback }
      );
    } catch (error) {
      console.error("Enhanced bargain feedback error:", error);
      // Don't throw for feedback - it's not critical
    }
  }

  /**
   * Get hold countdown for price lock
   */
  getHoldCountdown(expiresAt: string): number {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((expiry - now) / 1000));
  }

  /**
   * Format prices with currency
   */
  formatPrice(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Calculate savings percentage
   */
  calculateSavingsPercentage(originalPrice: number, finalPrice: number): number {
    return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  }

  /**
   * Get emotional state display text
   */
  getEmotionalStateText(state: string): string {
    const stateMap: Record<string, string> = {
      'optimistic': '😊 Feeling good about this deal!',
      'neutral': '🤔 Let\'s see what we can do...',
      'urgent': '⏰ Time is running out!',
      'desperate': '🔥 Last chance for savings!'
    };
    return stateMap[state] || stateMap['neutral'];
  }

  /**
   * Get round-specific messaging
   */
  getRoundMessage(roundNumber: number, emotionalState: string): string {
    const messages = {
      1: {
        optimistic: "Great choice! Let's start with your best offer - I'm confident we can make a deal! 💪",
        neutral: "Welcome to our AI bargain engine! What's your target price? 🎯",
        urgent: "Quick! What's your best offer? Limited time deals are flying off the shelf! ⚡",
        desperate: "URGENT: Prices are about to increase! What's your absolute maximum budget? 🚨"
      },
      2: {
        optimistic: "Nice negotiating! But I think we can do even better. What's your next move? 🎲",
        neutral: "Interesting offer. The supplier is considering... What's your counter-offer? 🤝",
        urgent: "ALERT: This deal might disappear soon! Can you improve your offer? ⏰",
        desperate: "FINAL WARNING: Only minutes left! This is your last chance to secure savings! 🔥"
      },
      3: {
        optimistic: "Final round! Give me your absolute best offer - let's close this deal! 🏆",
        neutral: "Last chance to negotiate. What's your final offer? 🎯",
        urgent: "LAST ROUND: The clock is ticking! Your final offer? ⌛",
        desperate: "FINAL OPPORTUNITY: Secure your savings NOW or pay full price! 💥"
      }
    };

    return messages[roundNumber]?.[emotionalState] || messages[1]['neutral'];
  }
}

// Export singleton instance
export const enhancedBargainService = new EnhancedBargainService();
export default enhancedBargainService;
