/**
 * TBO Hotel Filter Mapping
 * Maps UI filter selections to TBO API payload structure
 */

export interface HotelSearchFilters {
  // Search/text filters
  qPropertyName?: string; // Property name (debounced text search)
  qAddress?: string; // Address/area (debounced text search)
  qRoomName?: string; // Room name (pass-through)

  // Multi-select filters
  stars?: number[]; // [5, 4, 3, 2, 1]
  priceMin?: number; // Display currency
  priceMax?: number;

  // TBO canonical filters
  mealPlans?: MealPlan[]; // 'RO' | 'BB' | 'HB' | 'FB' | 'DN'
  cancellation?: CancellationPolicy[]; // 'NR' | 'PR' | 'FC'

  // Reference data filters (via TBO codes)
  amenities?: string[]; // TBO amenity codes
  propertyTypes?: PropertyType[]; // 'HOTEL' | 'APARTMENT' | 'APARTHOTEL' | 'RESORT' | 'VILLA'
  locations?: string[]; // TBO area codes (e.g., 'deira', 'sheikh-zayed-road')
  guestRating?: GuestRating[]; // 'EXCELLENT' | 'VERY_GOOD' | 'GOOD'
  brands?: string[]; // TBO brand codes
}

// Type definitions for canonical filters
export type MealPlan = 'RO' | 'BB' | 'HB' | 'FB' | 'DN';
export type CancellationPolicy = 'NR' | 'PR' | 'FC';
export type PropertyType = 'HOTEL' | 'APARTMENT' | 'APARTHOTEL' | 'RESORT' | 'VILLA';
export type GuestRating = 'EXCELLENT' | 'VERY_GOOD' | 'GOOD';

// UI Label → TBO Code Mappings
export const MEAL_PLAN_MAP: Record<string, MealPlan> = {
  'Room Only': 'RO',
  'Breakfast': 'BB',
  'Half Board': 'HB',
  'Full Board': 'FB',
  'Dinner': 'DN',
} as const;

export const CANCELLATION_MAP: Record<string, CancellationPolicy> = {
  'Non-Refundable': 'NR',
  'Partially-Refundable': 'PR',
  'Free Cancellation': 'FC',
} as const;

export const GUEST_RATING_MAP: Record<string, GuestRating> = {
  'Excellent': 'EXCELLENT',
  'Very Good': 'VERY_GOOD',
  'Good': 'GOOD',
} as const;

export const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  'Hotel': 'HOTEL',
  'Apartment': 'APARTMENT',
  'Aparthotel': 'APARTHOTEL',
  'Resort': 'RESORT',
  'Villa': 'VILLA',
} as const;

// Reverse mappings (for display)
export const MEAL_PLAN_LABELS = Object.fromEntries(
  Object.entries(MEAL_PLAN_MAP).map(([label, code]) => [code, label])
);

export const CANCELLATION_LABELS = Object.fromEntries(
  Object.entries(CANCELLATION_MAP).map(([label, code]) => [code, label])
);

export const GUEST_RATING_LABELS = Object.fromEntries(
  Object.entries(GUEST_RATING_MAP).map(([label, code]) => [code, label])
);

export const PROPERTY_TYPE_LABELS = Object.fromEntries(
  Object.entries(PROPERTY_TYPE_MAP).map(([label, code]) => [code, label])
);

/**
 * Reference data types for amenities, brands, and locations
 */
export interface ReferenceItem {
  code: string;
  name: string;
  count?: number;
}

/**
 * Build TBO search payload from selected filters
 * Maps HotelSearchFilters to TBO API structure
 */
export function buildTboFilterPayload(filters: HotelSearchFilters): Record<string, any> {
  const payload: Record<string, any> = {};

  // Text searches
  if (filters.qPropertyName) {
    payload.qPropertyName = filters.qPropertyName;
  }
  if (filters.qAddress) {
    payload.qAddress = filters.qAddress;
  }
  if (filters.qRoomName) {
    payload.qRoomName = filters.qRoomName;
  }

  // Star ratings (OR within: 4★ OR 5★)
  if (filters.stars && filters.stars.length > 0) {
    payload.stars = filters.stars;
  }

  // Price range
  if (filters.priceMin !== undefined) {
    payload.priceMin = filters.priceMin;
  }
  if (filters.priceMax !== undefined) {
    payload.priceMax = filters.priceMax;
  }

  // Meal plans (OR within: Breakfast OR Half Board)
  if (filters.mealPlans && filters.mealPlans.length > 0) {
    payload.mealPlans = filters.mealPlans;
  }

  // Cancellation policies (OR within: Free Cancellation OR Partially-Refundable)
  if (filters.cancellation && filters.cancellation.length > 0) {
    payload.cancellation = filters.cancellation;
  }

  // Amenities (OR within: WiFi OR Pool)
  if (filters.amenities && filters.amenities.length > 0) {
    payload.amenities = filters.amenities;
  }

  // Property types (OR within: Hotel OR Resort)
  if (filters.propertyTypes && filters.propertyTypes.length > 0) {
    payload.propertyTypes = filters.propertyTypes;
  }

  // Locations (OR within: Deira OR Sheikh Zayed Road)
  if (filters.locations && filters.locations.length > 0) {
    payload.locations = filters.locations;
  }

  // Guest ratings (OR within: Excellent OR Very Good)
  if (filters.guestRating && filters.guestRating.length > 0) {
    payload.guestRating = filters.guestRating;
  }

  // Brands (OR within: Marriott OR Hilton)
  if (filters.brands && filters.brands.length > 0) {
    payload.brands = filters.brands;
  }

  return payload;
}
