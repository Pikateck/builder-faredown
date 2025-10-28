/**
 * TBO Search Service
 * Builds and executes TBO hotel searches with filter mapping
 */

import {
  HotelSearchFilters,
  buildTboFilterPayload,
} from "@/lib/tboFilterMap";

export interface TboSearchParams {
  cityId: string;
  countryCode: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
  rooms?: number;
  filters?: HotelSearchFilters;
}

/**
 * Build query parameters for TBO hotel search API
 * Includes filter state serialization for URL
 */
export function buildTboSearchUrl(
  baseUrl: string,
  params: TboSearchParams,
): string {
  const queryParams = new URLSearchParams();

  // Required parameters
  queryParams.append("cityId", params.cityId);
  queryParams.append("countryCode", params.countryCode);
  queryParams.append("checkIn", params.checkIn);
  queryParams.append("checkOut", params.checkOut);
  queryParams.append("adults", String(params.adults));
  queryParams.append("children", String(params.children));

  if (params.rooms) {
    queryParams.append("rooms", String(params.rooms));
  }

  // Add filters if present
  if (params.filters) {
    const filterPayload = buildTboFilterPayload(params.filters);

    // Add each filter to query params
    Object.entries(filterPayload).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // For arrays, append each item
        value.forEach((item) => {
          queryParams.append(key, String(item));
        });
      } else if (value !== undefined && value !== null) {
        // For scalar values, append once
        queryParams.append(key, String(value));
      }
    });
  }

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Serialize filter state to URL query string
 * Allows round-tripping of selected filters
 */
export function serializeFiltersToUrl(filters: HotelSearchFilters): string {
  const params = new URLSearchParams();

  if (filters.qPropertyName) {
    params.append("qPropertyName", filters.qPropertyName);
  }
  if (filters.qAddress) {
    params.append("qAddress", filters.qAddress);
  }
  if (filters.qRoomName) {
    params.append("qRoomName", filters.qRoomName);
  }

  // Star ratings
  if (filters.stars && filters.stars.length > 0) {
    filters.stars.forEach((star) => {
      params.append("stars", String(star));
    });
  }

  // Price range
  if (filters.priceMin !== undefined) {
    params.append("priceMin", String(filters.priceMin));
  }
  if (filters.priceMax !== undefined) {
    params.append("priceMax", String(filters.priceMax));
  }

  // Meal plans
  if (filters.mealPlans && filters.mealPlans.length > 0) {
    filters.mealPlans.forEach((meal) => {
      params.append("mealPlans", meal);
    });
  }

  // Cancellation policies
  if (filters.cancellation && filters.cancellation.length > 0) {
    filters.cancellation.forEach((cancel) => {
      params.append("cancellation", cancel);
    });
  }

  // Amenities
  if (filters.amenities && filters.amenities.length > 0) {
    filters.amenities.forEach((amenity) => {
      params.append("amenities", amenity);
    });
  }

  // Property types
  if (filters.propertyTypes && filters.propertyTypes.length > 0) {
    filters.propertyTypes.forEach((type) => {
      params.append("propertyTypes", type);
    });
  }

  // Locations
  if (filters.locations && filters.locations.length > 0) {
    filters.locations.forEach((loc) => {
      params.append("locations", loc);
    });
  }

  // Guest ratings
  if (filters.guestRating && filters.guestRating.length > 0) {
    filters.guestRating.forEach((rating) => {
      params.append("guestRating", rating);
    });
  }

  // Brands
  if (filters.brands && filters.brands.length > 0) {
    filters.brands.forEach((brand) => {
      params.append("brands", brand);
    });
  }

  return params.toString();
}

/**
 * Deserialize filter state from URL query string
 * Restores selected filters after page reload
 */
export function deserializeFiltersFromUrl(
  params: URLSearchParams,
): HotelSearchFilters {
  const filters: HotelSearchFilters = {};

  // Text filters
  if (params.has("qPropertyName")) {
    filters.qPropertyName = params.get("qPropertyName") || undefined;
  }
  if (params.has("qAddress")) {
    filters.qAddress = params.get("qAddress") || undefined;
  }
  if (params.has("qRoomName")) {
    filters.qRoomName = params.get("qRoomName") || undefined;
  }

  // Star ratings
  const stars = params.getAll("stars").map((s) => parseInt(s));
  if (stars.length > 0) {
    filters.stars = stars;
  }

  // Price range
  if (params.has("priceMin")) {
    filters.priceMin = parseInt(params.get("priceMin") || "0");
  }
  if (params.has("priceMax")) {
    filters.priceMax = parseInt(params.get("priceMax") || "999999");
  }

  // Meal plans
  const mealPlans = params.getAll("mealPlans");
  if (mealPlans.length > 0) {
    filters.mealPlans = mealPlans as any[];
  }

  // Cancellation policies
  const cancellations = params.getAll("cancellation");
  if (cancellations.length > 0) {
    filters.cancellation = cancellations as any[];
  }

  // Amenities
  const amenities = params.getAll("amenities");
  if (amenities.length > 0) {
    filters.amenities = amenities;
  }

  // Property types
  const propertyTypes = params.getAll("propertyTypes");
  if (propertyTypes.length > 0) {
    filters.propertyTypes = propertyTypes as any[];
  }

  // Locations
  const locations = params.getAll("locations");
  if (locations.length > 0) {
    filters.locations = locations;
  }

  // Guest ratings
  const guestRatings = params.getAll("guestRating");
  if (guestRatings.length > 0) {
    filters.guestRating = guestRatings as any[];
  }

  // Brands
  const brands = params.getAll("brands");
  if (brands.length > 0) {
    filters.brands = brands;
  }

  return filters;
}

/**
 * Convert ComprehensiveFilters format (Record<string, string[]>)
 * to HotelSearchFilters format for TBO API
 */
export function convertComprehensiveFiltersToTbo(
  comprehensiveFilters: Record<string, string[]>,
  priceRange?: [number, number],
): HotelSearchFilters {
  const tboFilters: HotelSearchFilters = {};

  // Handle price range
  if (priceRange && priceRange.length === 2) {
    tboFilters.priceMin = priceRange[0];
    tboFilters.priceMax = priceRange[1];
  }

  // Handle each filter category
  Object.entries(comprehensiveFilters).forEach(([categoryId, selectedIds]) => {
    if (!selectedIds || selectedIds.length === 0) return;

    switch (categoryId) {
      case "property-rating":
        // Star ratings: 1-star, 2-stars, etc.
        tboFilters.stars = selectedIds
          .map((id) => {
            const match = id.match(/(\d+)-star/);
            return match ? parseInt(match[1]) : null;
          })
          .filter((n): n is number => n !== null);
        break;

      case "meal-plans":
        // Meal plans: RO, BB, HB, FB, DN
        tboFilters.mealPlans = selectedIds as any[];
        break;

      case "cancellation":
        // Cancellation: FC, PR, NR
        tboFilters.cancellation = selectedIds as any[];
        break;

      case "amenities":
        // Amenities: wifi, parking, etc.
        tboFilters.amenities = selectedIds;
        break;

      case "property-type":
        // Property types: HOTEL, APARTMENT, etc.
        tboFilters.propertyTypes = selectedIds as any[];
        break;

      case "neighborhood":
        // Locations: deira, sheikh-zayed-road, etc.
        tboFilters.locations = selectedIds;
        break;

      case "guest-rating":
        // Guest ratings: EXCELLENT, VERY_GOOD, GOOD
        tboFilters.guestRating = selectedIds as any[];
        break;

      case "brands":
        // Brands: marriott, hilton, etc.
        tboFilters.brands = selectedIds;
        break;

      default:
        // Ignore unknown categories
        break;
    }
  });

  return tboFilters;
}
