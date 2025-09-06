/**
 * Pricing API utilities with Price Echo integration
 * Handles all pricing-related API calls with journey tracking
 */

import { getJourneyId, type JourneyStep, isValidJourneyStep } from './journey';

/**
 * Pricing quote parameters
 */
export interface PricingQuoteParams {
  module: 'air' | 'hotel' | 'sightseeing' | 'transfer';
  origin?: string;
  destination?: string;
  serviceClass?: string;
  hotelCategory?: string;
  serviceType?: string;
  airlineCode?: string;
  userType?: 'all' | 'b2c' | 'b2b';
  currency: string;
  baseFare: number;
  debug?: boolean;
  extras?: {
    promoCode?: string;
    pax?: number;
    nights?: number;
    rooms?: number;
    [key: string]: any;
  };
}

/**
 * Pricing quote result
 */
export interface PricingQuoteResult {
  baseFare: number;
  markup: number;
  discount: number;
  tax: number;
  totalFare: number;
  taxableAmount: number;
  currency: string;
  breakdown?: {
    steps: Array<{
      label: string;
      value: number;
      rule?: any;
      promo?: any;
      policy?: any;
    }>;
  };
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Fetch with journey tracking headers
 * @param step - Journey step identifier
 * @param input - Fetch input
 * @param init - Fetch init options
 * @returns Promise<Response>
 */
export async function fetchWithJourneyTracking(
  step: JourneyStep,
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  if (!isValidJourneyStep(step)) {
    throw new Error(`Invalid journey step: ${step}`);
  }

  const headers = new Headers(init.headers || {});
  
  // Add journey tracking headers
  headers.set('x-fd-journey', getJourneyId());
  headers.set('x-fd-step', step);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

/**
 * Get pricing quote with journey tracking
 * @param step - Journey step identifier
 * @param params - Pricing parameters
 * @returns Promise<PricingQuoteResult>
 */
export async function getPricingQuote(
  step: JourneyStep,
  params: PricingQuoteParams
): Promise<PricingQuoteResult> {
  const response = await fetchWithJourneyTracking(step, '/api/pricing/quote', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  const result: ApiResponse<PricingQuoteResult> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Pricing calculation failed');
  }

  return result.data;
}

/**
 * Preview pricing rules (for admin/debugging)
 * @param params - Pricing parameters
 * @returns Promise<any>
 */
export async function previewPricingRules(
  params: Partial<PricingQuoteParams>
): Promise<any> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/pricing/rules/preview?${queryParams}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result: ApiResponse<any> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Rules preview failed');
  }

  return result.data;
}

/**
 * Get price difference analysis for a journey
 * @param journeyId - Journey ID to analyze
 * @returns Promise<any>
 */
export async function getPriceDiff(journeyId?: string): Promise<any> {
  const targetJourneyId = journeyId || getJourneyId();
  
  const response = await fetch(`/api/pricing/diff?journeyId=${encodeURIComponent(targetJourneyId)}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result: ApiResponse<any> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Price diff analysis failed');
  }

  return result;
}

/**
 * Validate pricing parameters
 * @param params - Parameters to validate
 * @returns Promise<any>
 */
export async function validatePricingParams(
  params: PricingQuoteParams
): Promise<{ isValid: boolean; errors: string[] }> {
  const response = await fetch('/api/pricing/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result: ApiResponse<{ isValid: boolean; errors: string[] }> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Validation failed');
  }

  return result.data;
}

/**
 * Convenience methods for specific journey steps
 */
export const pricingApi = {
  /**
   * Search results pricing
   */
  searchResults: (params: PricingQuoteParams) => 
    getPricingQuote('search_results', params),

  /**
   * View details pricing
   */
  viewDetails: (params: PricingQuoteParams) => 
    getPricingQuote('view_details', params),

  /**
   * Pre-bargain pricing
   */
  bargainPre: (params: PricingQuoteParams) => 
    getPricingQuote('bargain_pre', params),

  /**
   * Post-bargain pricing
   */
  bargainPost: (params: PricingQuoteParams) => 
    getPricingQuote('bargain_post', params),

  /**
   * Booking page pricing
   */
  book: (params: PricingQuoteParams) => 
    getPricingQuote('book', params),

  /**
   * Payment pricing
   */
  payment: (params: PricingQuoteParams) => 
    getPricingQuote('payment', params),

  /**
   * Invoice pricing
   */
  invoice: (params: PricingQuoteParams) => 
    getPricingQuote('invoice', params),

  /**
   * My trips pricing
   */
  myTrips: (params: PricingQuoteParams) => 
    getPricingQuote('my_trips', params),
};

/**
 * React hook for pricing API calls (if using React)
 */
export function usePricingApi() {
  return {
    pricingApi,
    getPricingQuote,
    previewPricingRules,
    getPriceDiff,
    validatePricingParams,
  };
}

/**
 * Error types for better error handling
 */
export class PricingApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'PricingApiError';
  }
}

/**
 * Helper to create pricing parameters from search/booking data
 */
export function createPricingParams(
  module: PricingQuoteParams['module'],
  searchData: any,
  baseFare: number,
  options: Partial<PricingQuoteParams> = {}
): PricingQuoteParams {
  return {
    module,
    origin: searchData.origin || searchData.from,
    destination: searchData.destination || searchData.to,
    serviceClass: searchData.class || searchData.cabinClass,
    hotelCategory: searchData.starRating || searchData.category,
    serviceType: searchData.transferType || searchData.serviceType,
    airlineCode: searchData.airline || searchData.airlineCode,
    userType: 'b2c', // Default to B2C
    currency: searchData.currency || 'USD',
    baseFare,
    extras: {
      pax: searchData.adults || searchData.passengers || 1,
      nights: searchData.nights,
      rooms: searchData.rooms || 1,
      promoCode: searchData.promoCode,
      ...options.extras,
    },
    ...options,
  };
}
