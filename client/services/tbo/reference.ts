/**
 * TBO Reference Data Service
 * Fetches and caches amenities, brands, areas, and property types
 * with 24-hour TTL
 */

import { ReferenceItem } from "@/lib/tboFilterMap";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class TboReferenceCache {
  private amenitiesCache: CacheEntry<ReferenceItem[]> | null = null;
  private brandsCache: CacheEntry<ReferenceItem[]> | null = null;
  private areasCache: CacheEntry<ReferenceItem[]> | null = null;
  private propertyTypesCache: CacheEntry<ReferenceItem[]> | null = null;

  private isExpired(entry: CacheEntry<any> | null): boolean {
    if (!entry) return true;
    return Date.now() - entry.timestamp > CACHE_TTL;
  }

  /**
   * Get amenities list
   * Falls back to static list if API unavailable
   */
  async getAmenities(): Promise<ReferenceItem[]> {
    if (!this.isExpired(this.amenitiesCache) && this.amenitiesCache) {
      return this.amenitiesCache.data;
    }

    const fallbackAmenities: ReferenceItem[] = [
      { code: 'wifi', name: 'Free WiFi', count: 3421 },
      { code: 'parking', name: 'Parking', count: 5444 },
      { code: '24h-front-desk', name: '24-hour Front Desk', count: 2021 },
      { code: 'swimming-pool', name: 'Swimming Pool', count: 5244 },
      { code: 'fitness-center', name: 'Fitness Centre', count: 3388 },
      { code: 'restaurant', name: 'Restaurant', count: 876 },
      { code: 'bar', name: 'Bar', count: 1845 },
      { code: 'spa', name: 'Spa', count: 1256 },
      { code: 'business-center', name: 'Business Center', count: 897 },
      { code: 'concierge', name: 'Concierge Service', count: 567 },
      // Extended list for "View more" modal
      { code: 'room-service', name: 'Room Service', count: 800 },
      { code: 'laundry-service', name: 'Laundry Service', count: 1234 },
      { code: 'airport-shuttle', name: 'Airport Shuttle', count: 234 },
      { code: 'pet-friendly', name: 'Pet Friendly', count: 945 },
      { code: 'non-smoking', name: 'Non-smoking Rooms', count: 2341 },
    ];

    try {
      // Optional: Call TBO API for fresh amenities
      // const response = await fetch('/api/tbo-hotels/reference/amenities');
      // if (!response.ok) throw new Error('Failed to fetch amenities');
      // const data = await response.json();
      // this.amenitiesCache = { data, timestamp: Date.now() };
      // return data;

      // For now, use fallback
      this.amenitiesCache = { data: fallbackAmenities, timestamp: Date.now() };
      return fallbackAmenities;
    } catch (error) {
      console.warn('Failed to fetch amenities, using fallback:', error);
      return fallbackAmenities;
    }
  }

  /**
   * Get brands list
   * Falls back to static list if API unavailable
   */
  async getBrands(): Promise<ReferenceItem[]> {
    if (!this.isExpired(this.brandsCache) && this.brandsCache) {
      return this.brandsCache.data;
    }

    const fallbackBrands: ReferenceItem[] = [
      { code: 'millennium', name: 'Millennium Hotels', count: 15 },
      { code: 'jumeirah', name: 'Jumeirah', count: 12 },
      { code: 'rove-hotels', name: 'ROVE Hotels', count: 10 },
      { code: 'address', name: 'The Address Hotels and Resorts', count: 8 },
      { code: 'oyo-rooms', name: 'OYO Rooms', count: 8 },
      { code: 'movenpick', name: 'Mövenpick', count: 8 },
      { code: 'premier-inn', name: 'Premier Inn', count: 7 },
      { code: 'rotana', name: 'Rotana Hotels & Resorts', count: 7 },
      { code: 'marriott', name: 'Marriott Hotels & Resorts', count: 6 },
      { code: 'belvilla', name: 'Belvilla', count: 6 },
      // Extended list for "View more"
      { code: 'hilton', name: 'Hilton Hotels', count: 5 },
      { code: 'hyatt', name: 'Hyatt Hotels', count: 4 },
      { code: 'sheraton', name: 'Sheraton Hotels', count: 4 },
      { code: 'best-western', name: 'Best Western', count: 3 },
      { code: 'accor', name: 'Accor Hotels', count: 3 },
    ];

    try {
      // Optional: Call TBO API for fresh brands
      // const response = await fetch('/api/tbo-hotels/reference/brands');
      // if (!response.ok) throw new Error('Failed to fetch brands');
      // const data = await response.json();
      // this.brandsCache = { data, timestamp: Date.now() };
      // return data;

      this.brandsCache = { data: fallbackBrands, timestamp: Date.now() };
      return fallbackBrands;
    } catch (error) {
      console.warn('Failed to fetch brands, using fallback:', error);
      return fallbackBrands;
    }
  }

  /**
   * Get areas/locations list
   * Falls back to static list if API unavailable
   */
  async getAreas(): Promise<ReferenceItem[]> {
    if (!this.isExpired(this.areasCache) && this.areasCache) {
      return this.areasCache.data;
    }

    const fallbackAreas: ReferenceItem[] = [
      { code: 'beach-coast', name: 'Beach & Coast', count: 2108 },
      { code: 'downtown-dubai', name: 'Downtown Dubai', count: 1069 },
      { code: 'dubai-marina', name: 'Dubai Marina', count: 769 },
      { code: 'sheikh-zayed-road', name: 'Sheikh Zayed Road', count: 601 },
      { code: 'jumeirah-beach', name: 'Jumeirah Beach Residence', count: 341 },
      { code: 'palm-jumeirah', name: 'Palm Jumeirah', count: 440 },
      { code: 'bur-dubai', name: 'Bur Dubai', count: 337 },
      { code: 'deira', name: 'Deira', count: 217 },
      { code: 'old-dubai', name: 'Old Dubai', count: 114 },
      { code: 'guests-favorite', name: 'Guests\' Favorite Area', count: 1084 },
    ];

    try {
      // Optional: Call TBO API for fresh areas
      // const response = await fetch('/api/tbo-hotels/reference/areas');
      // if (!response.ok) throw new Error('Failed to fetch areas');
      // const data = await response.json();
      // this.areasCache = { data, timestamp: Date.now() };
      // return data;

      this.areasCache = { data: fallbackAreas, timestamp: Date.now() };
      return fallbackAreas;
    } catch (error) {
      console.warn('Failed to fetch areas, using fallback:', error);
      return fallbackAreas;
    }
  }

  /**
   * Get property types list
   * TBO canonical types only
   */
  async getPropertyTypes(): Promise<ReferenceItem[]> {
    if (!this.isExpired(this.propertyTypesCache) && this.propertyTypesCache) {
      return this.propertyTypesCache.data;
    }

    const propertyTypes: ReferenceItem[] = [
      { code: 'HOTEL', name: 'Hotel', count: 656 },
      { code: 'APARTMENT', name: 'Apartment', count: 5060 },
      { code: 'APARTHOTEL', name: 'Aparthotel', count: 2500 },
      { code: 'RESORT', name: 'Resort', count: 59 },
      { code: 'VILLA', name: 'Villa', count: 104 },
    ];

    this.propertyTypesCache = { data: propertyTypes, timestamp: Date.now() };
    return propertyTypes;
  }

  /**
   * Clear all caches manually
   */
  clearCache(): void {
    this.amenitiesCache = null;
    this.brandsCache = null;
    this.areasCache = null;
    this.propertyTypesCache = null;
  }
}

// Singleton instance
const tboReferenceCache = new TboReferenceCache();

/**
 * Public API
 */
export async function getTboAmenities(): Promise<ReferenceItem[]> {
  return tboReferenceCache.getAmenities();
}

export async function getTboBrands(): Promise<ReferenceItem[]> {
  return tboReferenceCache.getBrands();
}

export async function getTboAreas(): Promise<ReferenceItem[]> {
  return tboReferenceCache.getAreas();
}

export async function getTboPropertyTypes(): Promise<ReferenceItem[]> {
  return tboReferenceCache.getPropertyTypes();
}

export function clearTboReferenceCache(): void {
  tboReferenceCache.clearCache();
}
