/**
 * BargainEngine Service
 * Centralized bargain logic for ALL modules: Hotels, Flights, Transfers, Packages, Add-ons
 * Ensures identical behavior across the entire platform
 */

import { ChatAnalyticsService } from "./chatAnalyticsService";

export interface BargainProduct {
  id: string;
  type: "hotel" | "flight" | "transfer" | "package" | "addon";
  name: string;
  basePrice: number;
  currency: string;
  city?: string;
  supplierId?: string;
  // Allow flexible additional properties per product
  [key: string]: any;
}

export interface BargainRound {
  round: number;
  userWishPrice: number;
  systemOffer: number;
  isMatched: boolean;
  timestamp: number;
  acceptanceChance: number;
}

export interface BargainSession {
  sessionId: string;
  product: BargainProduct;
  basePrice: number;
  round1?: BargainRound;
  round2?: BargainRound;
  selectedPrice: number | null;
  selectedRound: 1 | 2 | null;
  createdAt: number;
  expiresAt: number;
  timerDuration: number; // 30 seconds for all rounds
}

export class BargainEngine {
  private chatAnalytics: ChatAnalyticsService;
  private sessions: Map<string, BargainSession> = new Map();
  private readonly TIMER_DURATION = 30; // 30 seconds for both Round 1 and Round 2
  private readonly MAX_ROUNDS = 2;

  constructor(chatAnalyticsService: ChatAnalyticsService) {
    this.chatAnalytics = chatAnalyticsService;
  }

  /**
   * Initialize a bargain session for any product type
   */
  initSession(product: BargainProduct, basePrice: number): BargainSession {
    const sessionId = `bargain_${product.id}_${Date.now()}`;
    const session: BargainSession = {
      sessionId,
      product,
      basePrice,
      selectedPrice: null,
      selectedRound: null,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.TIMER_DURATION * 1000,
      timerDuration: this.TIMER_DURATION,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Process Round 1 bargain: User submits wish price
   */
  processRound1(sessionId: string, userWishPrice: number): BargainRound {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const acceptanceChance = Math.random();
    const isMatched = acceptanceChance > 0.5; // 50% chance user price is matched

    let systemOffer: number;
    if (isMatched) {
      // Matched: offer user's wished price or slightly lower
      systemOffer = Math.max(
        session.basePrice * 0.7, // Don't go below 70% of base
        userWishPrice,
      );
    } else {
      // Counter: offer between base and user price (but closer to user)
      const discount = session.basePrice * 0.15; // 15% counter discount
      systemOffer = session.basePrice - discount;
      // Ensure counter is better than user's wish but not matched
      systemOffer = Math.min(systemOffer, userWishPrice * 1.05);
    }

    const round: BargainRound = {
      round: 1,
      userWishPrice,
      systemOffer,
      isMatched,
      timestamp: Date.now(),
      acceptanceChance,
    };

    session.round1 = round;

    // Track analytics
    this.trackEvent("bargain_round1_completed", {
      sessionId,
      productType: session.product.type,
      productId: session.product.id,
      productName: session.product.name,
      city: session.product.city,
      originalPrice: session.basePrice,
      userWishPrice,
      systemOffer,
      isMatched,
      currency: session.product.currency,
    });

    return round;
  }

  /**
   * Process Round 2 bargain: User submits new wish price
   */
  processRound2(sessionId: string, userWishPrice: number): BargainRound {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    if (!session.round1)
      throw new Error(`Round 1 not completed for session: ${sessionId}`);

    const acceptanceChance = Math.random();
    // Round 2 is riskier: lower acceptance chance (40%)
    const isMatched = acceptanceChance > 0.6;

    let systemOffer: number;
    if (isMatched) {
      // Matched: offer user's price or slightly lower
      systemOffer = Math.max(
        session.basePrice * 0.65, // Don't go below 65% for Round 2
        userWishPrice,
      );
    } else {
      // Counter: offer between Round 1 and user price
      const round1Offer = session.round1.systemOffer;
      const betweenPrice = (round1Offer + userWishPrice) / 2;
      systemOffer = Math.max(
        session.basePrice * 0.65,
        Math.min(betweenPrice, userWishPrice * 1.02),
      );
    }

    const round: BargainRound = {
      round: 2,
      userWishPrice,
      systemOffer,
      isMatched,
      timestamp: Date.now(),
      acceptanceChance,
    };

    session.round2 = round;

    // Track analytics
    this.trackEvent("bargain_round2_triggered", {
      sessionId,
      productType: session.product.type,
      productId: session.product.id,
      productName: session.product.name,
      city: session.product.city,
      originalPrice: session.basePrice,
      round1SafePrice: session.round1.systemOffer,
      round2UserWish: userWishPrice,
      round2FinalOffer: systemOffer,
      currency: session.product.currency,
    });

    return round;
  }

  /**
   * User selects a price (Round 1 or Round 2)
   */
  selectPrice(sessionId: string, selectedRound: 1 | 2): number {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    if (selectedRound === 1 && !session.round1) {
      throw new Error(`Round 1 not available for session: ${sessionId}`);
    }
    if (selectedRound === 2 && !session.round2) {
      throw new Error(`Round 2 not available for session: ${sessionId}`);
    }

    const round = selectedRound === 1 ? session.round1! : session.round2!;
    session.selectedPrice = round.systemOffer;
    session.selectedRound = selectedRound;

    // Track analytics
    this.trackEvent("bargain_price_selected", {
      sessionId,
      productType: session.product.type,
      productId: session.product.id,
      productName: session.product.name,
      city: session.product.city,
      originalPrice: session.basePrice,
      selectedPrice: round.systemOffer,
      selectedRound,
      safeDealPrice: session.round1?.systemOffer,
      finalOfferPrice: session.round2?.systemOffer,
      savings: session.basePrice - round.systemOffer,
      savingsPercent: Math.round(
        ((session.basePrice - round.systemOffer) / session.basePrice) * 100,
      ),
      currency: session.product.currency,
    });

    return round.systemOffer;
  }

  /**
   * User abandons bargain (timer expires or user exits)
   */
  abandonBargain(
    sessionId: string,
    reason: "timer_expired" | "user_exit" | "unknown",
  ): number {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Track analytics
    this.trackEvent("bargain_abandoned", {
      sessionId,
      productType: session.product.type,
      productId: session.product.id,
      productName: session.product.name,
      city: session.product.city,
      originalPrice: session.basePrice,
      reason,
      round1Offered: session.round1?.systemOffer,
      round2Offered: session.round2?.systemOffer,
      currency: session.product.currency,
    });

    // Return original price
    return session.basePrice;
  }

  /**
   * Get current session
   */
  getSession(sessionId: string): BargainSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get Round 1 safe deal price
   */
  getSafeDealPrice(sessionId: string): number | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.round1) return null;
    return session.round1.systemOffer;
  }

  /**
   * Get Round 2 final offer price
   */
  getFinalOfferPrice(sessionId: string): number | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.round2) return null;
    return session.round2.systemOffer;
  }

  /**
   * Get timer duration (30 seconds for all rounds)
   */
  getTimerDuration(): number {
    return this.TIMER_DURATION;
  }

  /**
   * Get max rounds allowed
   */
  getMaxRounds(): number {
    return this.MAX_ROUNDS;
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return true;
    return Date.now() > session.expiresAt;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, session] of this.sessions.entries()) {
      if (now > session.expiresAt + 60000) {
        // Keep for 1 minute after expiry
        expiredIds.push(id);
      }
    }

    expiredIds.forEach((id) => this.sessions.delete(id));
  }

  /**
   * Track analytics event
   */
  private trackEvent(eventName: string, properties: Record<string, any>): void {
    this.chatAnalytics
      .trackEvent(eventName, properties)
      .catch((err) =>
        console.warn(`Analytics tracking failed for ${eventName}:`, err),
      );
  }
}

/**
 * Global singleton instance
 */
let bargainEngineInstance: BargainEngine | null = null;

export function initializeBargainEngine(
  chatAnalyticsService: ChatAnalyticsService,
): BargainEngine {
  if (!bargainEngineInstance) {
    bargainEngineInstance = new BargainEngine(chatAnalyticsService);
  }
  return bargainEngineInstance;
}

export function getBargainEngine(): BargainEngine {
  if (!bargainEngineInstance) {
    throw new Error(
      "BargainEngine not initialized. Call initializeBargainEngine first.",
    );
  }
  return bargainEngineInstance;
}
