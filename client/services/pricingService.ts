/**
 * Dynamic Pricing Service
 * Handles dynamic pricing logic for flights and hotels with filters and bargain validation
 */

import { apiClient } from '@/lib/api';

// Types
export interface PriceRange {
  min: number;
  max: number;
  recommended: number;
  steps: number[];
}

export interface FlightPricingFilters {
  fromCity: string;
  toCity: string;
  airline?: string;
  cabinClass?: string;
  travelDate?: string;
  returnDate?: string;
  passengers?: {
    adults: number;
    children: number;
    infants: number;
  };
}

export interface HotelPricingFilters {
  city: string;
  hotel?: string;
  roomCategory?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: {
    adults: number;
    children: number;
  };
  rooms?: number;
}

export interface MarkupConfig {
  from: number;
  to: number;
  type: 'percent' | 'fixed';
}

export interface PromoDiscount {
  from: number;
  to: number;
  type: 'percent' | 'fixed';
  code: string;
  name: string;
}

export interface PricingContext {
  basePrice: number;
  type: 'flight' | 'hotel';
  category?: string; // domestic/international for flights, budget/luxury/premium for hotels
  markup?: MarkupConfig;
  promo?: PromoDiscount;
  filters: FlightPricingFilters | HotelPricingFilters;
}

export interface BargainValidationResult {
  isValid: boolean;
  status: 'matched' | 'counter' | 'rejected';
  finalPrice?: number;
  counterOffer?: number;
  message: string;
  sessionId?: string;
  priceBreakdown?: {
    basePrice: number;
    markup: number;
    originalPrice: number;
    discount?: number;
    finalPrice: number;
    savings?: number;
    savingsPercent?: string;
  };
}

export interface DynamicPricingResult {
  originalPriceRange: PriceRange;
  discountedPriceRange?: PriceRange;
  bargainRange: PriceRange;
  priceSteps: number[];
  markup: MarkupConfig;
  promo?: PromoDiscount;
  savings?: {
    min: number;
    max: number;
    minPercent: string;
    maxPercent: string;
  };
}

// Markup configurations for different categories
const MARKUP_CONFIGS = {
  flights: {
    domestic: { from: 8, to: 15, type: 'percent' as const },
    international: { from: 12, to: 20, type: 'percent' as const },
    business: { from: 15, to: 25, type: 'percent' as const },
    first: { from: 20, to: 30, type: 'percent' as const }
  },
  hotels: {
    budget: { from: 10, to: 18, type: 'percent' as const },
    luxury: { from: 15, to: 25, type: 'percent' as const },
    premium: { from: 20, to: 30, type: 'percent' as const },
    resort: { from: 25, to: 35, type: 'percent' as const }
  }
};

// Route-based pricing rules for flights
const FLIGHT_ROUTE_PRICING = {
  'Mumbai-Dubai': { category: 'international', demandMultiplier: 1.2, popularRoute: true },
  'Delhi-London': { category: 'international', demandMultiplier: 1.15, popularRoute: true },
  'Mumbai-Delhi': { category: 'domestic', demandMultiplier: 0.9, popularRoute: true },
  'Bangalore-Goa': { category: 'domestic', demandMultiplier: 1.1, popularRoute: true },
  'Chennai-Singapore': { category: 'international', demandMultiplier: 1.05, popularRoute: false },
};

// Hotel-based pricing rules
const HOTEL_PRICING_RULES = {
  'Dubai': {
    'Atlantis The Palm': { category: 'premium', demandMultiplier: 1.3, starRating: 5 },
    'Burj Al Arab': { category: 'premium', demandMultiplier: 1.5, starRating: 7 },
    'Address Dubai Mall': { category: 'luxury', demandMultiplier: 1.2, starRating: 5 }
  },
  'Singapore': {
    'Marina Bay Sands': { category: 'premium', demandMultiplier: 1.4, starRating: 5 },
    'Raffles Singapore': { category: 'luxury', demandMultiplier: 1.25, starRating: 5 }
  },
  'Mumbai': {
    'The Taj Mahal Palace': { category: 'luxury', demandMultiplier: 1.1, starRating: 5 },
    'The Oberoi Mumbai': { category: 'luxury', demandMultiplier: 1.05, starRating: 5 }
  }
};

class PricingService {
  private apiUrl = '/api/promo';

  /**
   * Get dynamic price range for flights or hotels
   */
  async getDynamicPricing(context: PricingContext): Promise<DynamicPricingResult> {
    try {
      // Determine category and markup
      const category = this.determineCategory(context);
      const markup = context.markup || this.getMarkupConfig(context.type, category);
      
      // Calculate base pricing
      const basePrice = context.basePrice;
      const minMarkupAmount = this.calculateMarkupAmount(basePrice, markup.from, markup.type);
      const maxMarkupAmount = this.calculateMarkupAmount(basePrice, markup.to, markup.type);
      
      const originalMinPrice = basePrice + minMarkupAmount;
      const originalMaxPrice = basePrice + maxMarkupAmount;
      
      // Apply demand-based pricing adjustments
      const demandMultiplier = this.getDemandMultiplier(context);
      const adjustedMinPrice = originalMinPrice * demandMultiplier;
      const adjustedMaxPrice = originalMaxPrice * demandMultiplier;
      
      let result: DynamicPricingResult = {
        originalPriceRange: {
          min: Math.round(adjustedMinPrice),
          max: Math.round(adjustedMaxPrice),
          recommended: Math.round((adjustedMinPrice + adjustedMaxPrice) / 2),
          steps: this.generatePriceSteps(adjustedMinPrice, adjustedMaxPrice, 5)
        },
        bargainRange: {
          min: Math.round(adjustedMinPrice * 0.95), // 5% below minimum
          max: Math.round(adjustedMinPrice * 1.05), // 5% above minimum
          recommended: Math.round(adjustedMinPrice),
          steps: this.generatePriceSteps(adjustedMinPrice * 0.95, adjustedMinPrice * 1.05, 3)
        },
        priceSteps: this.generatePriceSteps(adjustedMinPrice, adjustedMaxPrice, 8),
        markup
      };
      
      // Apply promo code if provided
      if (context.promo) {
        const promoResult = this.applyPromoDiscount(result.originalPriceRange, context.promo);
        result.discountedPriceRange = promoResult.discountedRange;
        result.savings = promoResult.savings;
        result.promo = context.promo;
        
        // Update bargain range to be based on discounted prices
        result.bargainRange = {
          min: Math.round(promoResult.discountedRange.min * 0.98),
          max: Math.round(promoResult.discountedRange.max * 1.02),
          recommended: Math.round((promoResult.discountedRange.min + promoResult.discountedRange.max) / 2),
          steps: this.generatePriceSteps(
            promoResult.discountedRange.min * 0.98, 
            promoResult.discountedRange.max * 1.02, 
            3
          )
        };
      }
      
      return result;
      
    } catch (error) {
      console.error('Dynamic pricing error:', error);
      throw new Error('Failed to calculate dynamic pricing');
    }
  }

  /**
   * Validate bargain price
   */
  async validateBargainPrice(
    userPrice: number,
    context: PricingContext,
    promoCode?: string
  ): Promise<BargainValidationResult> {
    try {
      const requestBody = {
        userInputPrice: userPrice,
        baseNetPrice: context.basePrice,
        discountRange: context.promo ? {
          from: context.promo.from,
          to: context.promo.to,
          type: context.promo.type
        } : {
          from: 5,
          to: 15,
          type: 'percent'
        },
        promoCode,
        type: context.type,
        markup: context.markup
      };

      const response = await apiClient.post(`${this.apiUrl}/check`, requestBody);
      
      if (response.data?.success) {
        return {
          isValid: true,
          status: response.data.status,
          finalPrice: response.data.finalPrice,
          counterOffer: response.data.counterOffer,
          message: response.data.message,
          sessionId: response.data.sessionId,
          priceBreakdown: response.data.priceBreakdown
        };
      } else {
        return {
          isValid: false,
          status: 'rejected',
          message: response.data?.message || 'Bargain validation failed'
        };
      }
      
    } catch (error) {
      console.error('Bargain validation error:', error);
      return {
        isValid: false,
        status: 'rejected',
        message: 'Failed to validate bargain price'
      };
    }
  }

  /**
   * Apply promo code to get discount range
   */
  async applyPromoCode(
    promoCode: string,
    filters: FlightPricingFilters | HotelPricingFilters,
    type: 'flight' | 'hotel'
  ): Promise<{ isValid: boolean; promo?: PromoDiscount; message: string }> {
    try {
      const requestBody = {
        promoCode,
        type,
        ...filters
      };

      const response = await apiClient.post(`${this.apiUrl}/apply`, requestBody);
      
      if (response.data?.success && response.data.status === 'valid') {
        return {
          isValid: true,
          promo: {
            from: response.data.discountFrom,
            to: response.data.discountTo,
            type: response.data.type,
            code: promoCode,
            name: response.data.promoDetails.name
          },
          message: response.data.message
        };
      } else {
        return {
          isValid: false,
          message: response.data?.message || 'Invalid promo code'
        };
      }
      
    } catch (error) {
      console.error('Promo code application error:', error);
      return {
        isValid: false,
        message: 'Failed to apply promo code'
      };
    }
  }

  /**
   * Get price range for display
   */
  async getPriceRange(
    basePrice: number,
    type: 'flight' | 'hotel',
    category?: string,
    promoCode?: string
  ): Promise<DynamicPricingResult> {
    try {
      const params = {
        basePrice,
        type,
        category,
        promoCode
      };

      const response = await apiClient.get(`${this.apiUrl}/price-range`, { params });
      
      if (response.data?.success) {
        const data = response.data.data;
        return {
          originalPriceRange: {
            min: data.originalPriceRange.min,
            max: data.originalPriceRange.max,
            recommended: data.recommendedBargainRange.max,
            steps: data.priceSteps
          },
          discountedPriceRange: data.discountedPriceRange ? {
            min: data.discountedPriceRange.min,
            max: data.discountedPriceRange.max,
            recommended: (data.discountedPriceRange.min + data.discountedPriceRange.max) / 2,
            steps: data.priceSteps
          } : undefined,
          bargainRange: {
            min: data.recommendedBargainRange.min,
            max: data.recommendedBargainRange.max,
            recommended: (data.recommendedBargainRange.min + data.recommendedBargainRange.max) / 2,
            steps: data.priceSteps.slice(0, 3)
          },
          priceSteps: data.priceSteps,
          markup: data.markup,
          promo: data.promo ? {
            from: data.promo.discountFrom,
            to: data.promo.discountTo,
            type: data.promo.type,
            code: data.promo.code,
            name: data.promo.name
          } : undefined,
          savings: data.savings
        };
      } else {
        throw new Error('Failed to get price range');
      }
      
    } catch (error) {
      console.error('Get price range error:', error);
      throw new Error('Failed to get price range');
    }
  }

  /**
   * Private helper methods
   */
  
  private determineCategory(context: PricingContext): string {
    if (context.category) return context.category;
    
    if (context.type === 'flight') {
      const filters = context.filters as FlightPricingFilters;
      const routeKey = `${filters.fromCity}-${filters.toCity}`;
      const routeInfo = FLIGHT_ROUTE_PRICING[routeKey];
      
      if (routeInfo) {
        return routeInfo.category;
      }
      
      // Determine based on cabin class
      if (filters.cabinClass) {
        switch (filters.cabinClass.toLowerCase()) {
          case 'business': return 'business';
          case 'first': return 'first';
          default: return 'international'; // default for economy
        }
      }
      
      return 'international'; // default
    } else {
      const filters = context.filters as HotelPricingFilters;
      const cityRules = HOTEL_PRICING_RULES[filters.city];
      
      if (cityRules && filters.hotel && cityRules[filters.hotel]) {
        return cityRules[filters.hotel].category;
      }
      
      // Determine based on price
      if (context.basePrice < 5000) return 'budget';
      if (context.basePrice < 15000) return 'luxury';
      return 'premium';
    }
  }
  
  private getMarkupConfig(type: 'flight' | 'hotel', category: string): MarkupConfig {
    if (type === 'flight') {
      return MARKUP_CONFIGS.flights[category] || MARKUP_CONFIGS.flights.international;
    } else {
      return MARKUP_CONFIGS.hotels[category] || MARKUP_CONFIGS.hotels.luxury;
    }
  }
  
  private calculateMarkupAmount(basePrice: number, markup: number, type: 'percent' | 'fixed'): number {
    if (type === 'percent') {
      return (basePrice * markup) / 100;
    } else {
      return markup;
    }
  }
  
  private getDemandMultiplier(context: PricingContext): number {
    if (context.type === 'flight') {
      const filters = context.filters as FlightPricingFilters;
      const routeKey = `${filters.fromCity}-${filters.toCity}`;
      const routeInfo = FLIGHT_ROUTE_PRICING[routeKey];
      
      if (routeInfo) {
        return routeInfo.demandMultiplier;
      }
    } else {
      const filters = context.filters as HotelPricingFilters;
      const cityRules = HOTEL_PRICING_RULES[filters.city];
      
      if (cityRules && filters.hotel && cityRules[filters.hotel]) {
        return cityRules[filters.hotel].demandMultiplier;
      }
    }
    
    return 1.0; // neutral
  }
  
  private generatePriceSteps(minPrice: number, maxPrice: number, steps: number): number[] {
    const stepSize = (maxPrice - minPrice) / (steps - 1);
    const priceSteps = [];
    
    for (let i = 0; i < steps; i++) {
      priceSteps.push(Math.round(minPrice + (stepSize * i)));
    }
    
    return priceSteps;
  }
  
  private applyPromoDiscount(
    originalRange: PriceRange, 
    promo: PromoDiscount
  ): { discountedRange: PriceRange; savings: any } {
    let discountedMin, discountedMax;
    
    if (promo.type === 'percent') {
      discountedMax = originalRange.max * (1 - promo.from / 100);
      discountedMin = originalRange.max * (1 - promo.to / 100);
    } else {
      discountedMax = originalRange.max - promo.from;
      discountedMin = originalRange.max - promo.to;
    }
    
    // Ensure minimum doesn't go too low
    discountedMin = Math.max(discountedMin, originalRange.min * 0.7);
    
    const discountedRange: PriceRange = {
      min: Math.round(discountedMin),
      max: Math.round(discountedMax),
      recommended: Math.round((discountedMin + discountedMax) / 2),
      steps: this.generatePriceSteps(discountedMin, discountedMax, 5)
    };
    
    const savings = {
      min: Math.round(originalRange.max - discountedMax),
      max: Math.round(originalRange.max - discountedMin),
      minPercent: (((originalRange.max - discountedMax) / originalRange.max) * 100).toFixed(1),
      maxPercent: (((originalRange.max - discountedMin) / originalRange.max) * 100).toFixed(1)
    };
    
    return { discountedRange, savings };
  }
}

// Singleton instance
export const pricingService = new PricingService();
export default pricingService;
