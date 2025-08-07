/**
 * Bargain Pricing Service - Phase 1 Implementation
 * Handles Base Price + Markup (randomized within range) + Counter-offers
 * Integrates with Promo Codes while respecting minimum markup thresholds
 */

import { markupService } from './markupService';
import { promoCodeService } from './promoCodeService';
import { apiClient } from '@/lib/api';

export interface BargainPricingRequest {
  type: 'flight' | 'hotel';
  itemId: string;
  basePrice: number;
  userType: 'b2c' | 'b2b';
  // Flight specific
  airline?: string;
  route?: { from: string; to: string };
  class?: string;
  // Hotel specific
  city?: string;
  hotelName?: string;
  starRating?: string;
  roomCategory?: string;
  // User preferences
  promoCode?: string;
  userLocation?: string;
  deviceType?: 'mobile' | 'desktop';
}

export interface BargainPricingResult {
  originalPrice: number;
  markedUpPrice: number;
  finalPrice: number;
  markupDetails: {
    applicableMarkups: any[];
    selectedMarkup: any;
    markupPercentage: number;
    markupAmount: number;
    markupRange: { min: number; max: number };
    randomizedMarkup: number;
  };
  promoDetails?: {
    code: string;
    discountAmount: number;
    discountPercentage: number;
    isValid: boolean;
    appliedAfterMarkup: boolean;
  };
  bargainRange: {
    minimumAcceptable: number; // Respects minimum markup after promo
    maximumCounterOffer: number;
    recommendedTarget: number;
    savingsOpportunity: number;
  };
  phase1Logic: {
    baseCalculation: string;
    markupLogic: string;
    promoApplication: string;
    counterOfferStrategy: string;
  };
}

export interface CounterOfferRequest {
  sessionId: string;
  originalPrice: number;
  userOfferPrice: number;
  currentMarkedUpPrice: number;
  markupDetails: any;
  promoDetails?: any;
}

export interface CounterOfferResponse {
  accepted: boolean;
  counterOffer?: number;
  reasoning: string;
  negotiationStrategy: 'accept' | 'counter' | 'reject';
  finalPrice?: number;
  savingsAmount?: number;
  savingsPercentage?: number;
  nextRecommendation?: string;
}

class BargainPricingService {
  private readonly baseUrl = '/api/bargain-pricing';

  /**
   * Phase 1: Calculate initial pricing with randomized markup
   */
  async calculateInitialPricing(request: BargainPricingRequest): Promise<BargainPricingResult> {
    try {
      // Step 1: Get applicable markups for the item
      const markupResult = await markupService.calculateMarkup({
        type: request.type,
        basePrice: request.basePrice,
        airline: request.airline,
        route: request.route,
        class: request.class,
        city: request.city,
        hotelName: request.hotelName,
        starRating: request.starRating,
        userType: request.userType,
      });

      // Step 2: Randomize markup within Current Fare Range (user-visible pricing)
      const currentFareMin = markupResult.selectedMarkup?.currentFareMin || markupResult.markupRange.min;
      const currentFareMax = markupResult.selectedMarkup?.currentFareMax || markupResult.markupRange.max;

      const randomizedMarkup = this.randomizeMarkupInRange(
        currentFareMin,
        currentFareMax
      );

      // Calculate marked up price with randomized markup
      const markupAmount = request.basePrice * (randomizedMarkup / 100);
      const markedUpPrice = request.basePrice + markupAmount;

      // Step 3: Apply promo code if provided (after markup but respecting minimum)
      let promoDetails = null;
      let finalPrice = markedUpPrice;

      if (request.promoCode) {
        try {
          // Calculate minimum acceptable price based on minimum markup
          const minimumPrice = this.calculateMinimumPrice(request.basePrice, markupResult.markupRange.min);

          // Apply promo code with minimum markup threshold protection
          const promoApplication = await promoCodeService.applyPromoCode(
            request.promoCode,
            markedUpPrice,
            {
              category: request.type,
              origin: request.route?.from || request.userLocation,
              destination: request.route?.to || request.city,
              hotelCity: request.city,
              minimumMarkupThreshold: minimumPrice,
            }
          );

          if (promoApplication.success) {
            finalPrice = promoApplication.finalAmount;
            promoDetails = {
              code: request.promoCode,
              discountAmount: promoApplication.discount,
              discountPercentage: (promoApplication.discount / markedUpPrice) * 100,
              isValid: true,
              appliedAfterMarkup: true,
            };
          } else {
            console.warn('Promo code application failed:', promoApplication.message);
          }
        } catch (error) {
          console.warn('Promo code validation failed:', error);

          // Fallback validation if API fails
          try {
            const promoValidation = await promoCodeService.validatePromoCode(request.promoCode, {
              amount: markedUpPrice,
              category: request.type,
              origin: request.route?.from || request.userLocation,
              destination: request.route?.to || request.city,
              hotelCity: request.city,
            });

            if (promoValidation.valid) {
              const minimumPrice = this.calculateMinimumPrice(request.basePrice, markupResult.markupRange.min);
              const proposedFinalPrice = markedUpPrice - promoValidation.discount;

              if (proposedFinalPrice >= minimumPrice) {
                finalPrice = proposedFinalPrice;
                promoDetails = {
                  code: request.promoCode,
                  discountAmount: promoValidation.discount,
                  discountPercentage: (promoValidation.discount / markedUpPrice) * 100,
                  isValid: true,
                  appliedAfterMarkup: true,
                };
              } else {
                // Promo would violate minimum markup, adjust discount to respect threshold
                const adjustedDiscount = markedUpPrice - minimumPrice;
                finalPrice = minimumPrice;
                promoDetails = {
                  code: request.promoCode,
                  discountAmount: adjustedDiscount,
                  discountPercentage: (adjustedDiscount / markedUpPrice) * 100,
                  isValid: true,
                  appliedAfterMarkup: true,
                };
              }
            }
          } catch (fallbackError) {
            console.warn('Fallback promo validation also failed:', fallbackError);
          }
        }
      }

      // Step 4: Calculate bargain range for counter-offers
      const bargainRange = this.calculateBargainRange(
        request.basePrice,
        markupResult.markupRange,
        promoDetails?.discountAmount || 0
      );

      return {
        originalPrice: request.basePrice,
        markedUpPrice,
        finalPrice,
        markupDetails: {
          applicableMarkups: markupResult.applicableMarkups,
          selectedMarkup: markupResult.selectedMarkup,
          markupPercentage: randomizedMarkup,
          markupAmount,
          markupRange: markupResult.markupRange,
          randomizedMarkup,
        },
        promoDetails,
        bargainRange,
        phase1Logic: {
          baseCalculation: `Base Price (₹${request.basePrice}) from supplier/inventory`,
          markupLogic: `Applied randomized markup of ${randomizedMarkup.toFixed(2)}% (range: ${markupResult.markupRange.min}%-${markupResult.markupRange.max}%)`,
          promoApplication: promoDetails 
            ? `Promo "${request.promoCode}" applied after markup, respecting ${markupResult.markupRange.min}% minimum markup`
            : 'No promo code applied',
          counterOfferStrategy: `Bargain range: ₹${bargainRange.minimumAcceptable} - ₹${bargainRange.maximumCounterOffer}`,
        },
      };
    } catch (error) {
      console.error('Error calculating initial pricing:', error);
      throw error;
    }
  }

  /**
   * Phase 1: Handle user counter-offers with intelligent responses
   */
  async processCounterOffer(request: CounterOfferRequest): Promise<CounterOfferResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/counter-offer`, request);
      
      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to process counter offer');
      }
    } catch (error) {
      console.error('Error processing counter offer:', error);
      
      // Fallback local logic for counter-offers
      return this.processCounterOfferLocally(request);
    }
  }

  /**
   * Get bargain recommendations based on market analysis
   */
  async getBargainRecommendations(
    type: 'flight' | 'hotel',
    itemId: string,
    originalPrice: number,
    markedUpPrice: number
  ): Promise<{
    suggestedTargetPrice: number;
    confidence: number;
    reasoning: string;
    negotiationTips: string[];
    marketAnalysis: {
      averagePrice: number;
      priceRange: { min: number; max: number };
      demandLevel: 'low' | 'medium' | 'high';
      savingsOpportunity: string;
    };
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/recommendations`, {
        type,
        itemId,
        originalPrice,
        markedUpPrice,
      });
      
      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error getting bargain recommendations:', error);
      
      // Fallback recommendations
      return this.generateFallbackRecommendations(originalPrice, markedUpPrice);
    }
  }

  /**
   * Randomize markup within configured range (Phase 1 core logic)
   */
  private randomizeMarkupInRange(minMarkup: number, maxMarkup: number): number {
    // Use decimal precision for more granular pricing
    const range = maxMarkup - minMarkup;
    const randomFactor = Math.random();
    
    // Apply some bias towards the middle of the range for better conversion
    const biasedFactor = Math.pow(randomFactor, 0.8);
    
    const randomizedMarkup = minMarkup + (range * biasedFactor);
    
    // Round to 2 decimal places for precision (e.g., 5.15%, 5.25%)
    return Math.round(randomizedMarkup * 100) / 100;
  }

  /**
   * Calculate minimum acceptable price respecting markup thresholds
   */
  private calculateMinimumPrice(basePrice: number, minimumMarkupPercent: number): number {
    return basePrice * (1 + minimumMarkupPercent / 100);
  }

  /**
   * Calculate bargain range for counter-offer negotiations
   */
  private calculateBargainRange(
    basePrice: number,
    markupRange: { min: number; max: number },
    promoDiscount: number = 0
  ): BargainPricingResult['bargainRange'] {
    const minimumAcceptable = this.calculateMinimumPrice(basePrice, markupRange.min) - promoDiscount;
    const maximumCounterOffer = basePrice * (1 + markupRange.max / 100) - promoDiscount;
    
    // Recommended target is slightly above minimum for better margins
    const recommendedTarget = minimumAcceptable + ((maximumCounterOffer - minimumAcceptable) * 0.3);
    
    const savingsOpportunity = maximumCounterOffer - minimumAcceptable;

    return {
      minimumAcceptable: Math.round(minimumAcceptable),
      maximumCounterOffer: Math.round(maximumCounterOffer),
      recommendedTarget: Math.round(recommendedTarget),
      savingsOpportunity: Math.round(savingsOpportunity),
    };
  }

  /**
   * Local counter-offer processing logic (fallback)
   */
  private processCounterOfferLocally(request: CounterOfferRequest): CounterOfferResponse {
    const { userOfferPrice, currentMarkedUpPrice, markupDetails } = request;
    const minimumAcceptable = markupDetails.markupRange.min;
    const maximumPrice = currentMarkedUpPrice;
    
    // Calculate acceptable range
    const discountRequested = currentMarkedUpPrice - userOfferPrice;
    const discountPercentage = (discountRequested / currentMarkedUpPrice) * 100;

    // Phase 1 counter-offer logic
    if (userOfferPrice >= minimumAcceptable) {
      // Accept the offer
      return {
        accepted: true,
        negotiationStrategy: 'accept',
        finalPrice: userOfferPrice,
        savingsAmount: discountRequested,
        savingsPercentage: discountPercentage,
        reasoning: `Offer accepted! Price of ₹${userOfferPrice.toLocaleString()} meets our minimum threshold and provides good value.`,
        nextRecommendation: 'Proceed to booking confirmation.',
      };
    } else if (userOfferPrice >= minimumAcceptable * 0.9) {
      // Make a counter-offer
      const counterOffer = Math.round(minimumAcceptable + (userOfferPrice - minimumAcceptable) * 0.5);
      
      return {
        accepted: false,
        counterOffer,
        negotiationStrategy: 'counter',
        savingsAmount: currentMarkedUpPrice - counterOffer,
        savingsPercentage: ((currentMarkedUpPrice - counterOffer) / currentMarkedUpPrice) * 100,
        reasoning: `Your offer is close! How about ₹${counterOffer.toLocaleString()}? This gives you significant savings while ensuring quality service.`,
        nextRecommendation: 'Consider our counter-offer for the best balance of price and value.',
      };
    } else {
      // Reject the offer but suggest alternatives
      const suggestedPrice = Math.round(minimumAcceptable * 1.05);
      
      return {
        accepted: false,
        counterOffer: suggestedPrice,
        negotiationStrategy: 'reject',
        reasoning: `We appreciate your interest, but ₹${userOfferPrice.toLocaleString()} is below our minimum threshold. Our best offer is ₹${suggestedPrice.toLocaleString()}.`,
        nextRecommendation: 'Try our suggested price for guaranteed booking confirmation.',
      };
    }
  }

  /**
   * Generate fallback recommendations when API is unavailable
   */
  private generateFallbackRecommendations(
    originalPrice: number,
    markedUpPrice: number
  ): {
    suggestedTargetPrice: number;
    confidence: number;
    reasoning: string;
    negotiationTips: string[];
    marketAnalysis: {
      averagePrice: number;
      priceRange: { min: number; max: number };
      demandLevel: 'low' | 'medium' | 'high';
      savingsOpportunity: string;
    };
  } {
    const potentialSavings = markedUpPrice - originalPrice;
    const suggestedTargetPrice = Math.round(originalPrice + (potentialSavings * 0.4));
    
    return {
      suggestedTargetPrice,
      confidence: 75,
      reasoning: 'Based on typical market patterns and pricing flexibility, this target offers good savings potential.',
      negotiationTips: [
        'Be prepared to negotiate - start lower than your maximum budget',
        'Mention competitor prices if you have found better deals',
        'Show genuine interest but be willing to walk away',
        'Ask about package deals or additional inclusions',
      ],
      marketAnalysis: {
        averagePrice: Math.round(originalPrice * 1.15),
        priceRange: { 
          min: Math.round(originalPrice * 1.05), 
          max: Math.round(originalPrice * 1.25) 
        },
        demandLevel: 'medium',
        savingsOpportunity: `Up to ₹${Math.round(potentialSavings * 0.7).toLocaleString()} savings possible`,
      },
    };
  }
}

export const bargainPricingService = new BargainPricingService();
export default bargainPricingService;
