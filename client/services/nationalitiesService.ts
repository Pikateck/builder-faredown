/**
 * Nationalities Service
 *
 * Handles fetching and managing nationality data for hotel search dropdowns
 */

import { apiClient } from '@/lib/api';

export interface Nationality {
  isoCode: string;
  countryName: string;
}

export interface NationalitiesResponse {
  success: boolean;
  nationalities: Nationality[];
  count: number;
}

/**
 * Fetch all active nationalities for dropdown selection
 * Cached on first load for performance
 */
let nationalitiesCache: Nationality[] | null = null;

export async function getNationalities(): Promise<Nationality[]> {
  try {
    // Return cached data if available
    if (nationalitiesCache) {
      console.log('📍 Using cached nationalities');
      return nationalitiesCache;
    }

    console.log('📍 Fetching nationalities from API');

    const response = await apiClient.get<NationalitiesResponse>('/meta/nationalities');
    
    if (response.success && response.nationalities) {
      nationalitiesCache = response.nationalities;
      console.log(`✅ Loaded ${response.count} nationalities`);
      return response.nationalities;
    }

    console.error('❌ Invalid nationalities response:', response);
    return getDefaultNationalities();
  } catch (error) {
    console.error('❌ Error fetching nationalities:', error);
    return getDefaultNationalities();
  }
}

/**
 * Get nationality details by ISO code
 */
export async function getNationalityByCode(isoCode: string): Promise<Nationality | null> {
  try {
    const nationalities = await getNationalities();
    return nationalities.find(n => n.isoCode === isoCode) || null;
  } catch (error) {
    console.error('❌ Error finding nationality:', error);
    return null;
  }
}

/**
 * Clear cached nationalities (force refresh)
 */
export function clearNationalitiesCache(): void {
  nationalitiesCache = null;
}

/**
 * Fallback nationalities for offline/error scenarios
 * Top priority countries only
 */
function getDefaultNationalities(): Nationality[] {
  return [
    { isoCode: 'IN', countryName: 'India' },
    { isoCode: 'AE', countryName: 'United Arab Emirates' },
    { isoCode: 'GB', countryName: 'United Kingdom' },
    { isoCode: 'US', countryName: 'United States' },
    { isoCode: 'SG', countryName: 'Singapore' },
    { isoCode: 'AU', countryName: 'Australia' },
    { isoCode: 'CA', countryName: 'Canada' },
    { isoCode: 'SA', countryName: 'Saudi Arabia' },
    { isoCode: 'QA', countryName: 'Qatar' },
    { isoCode: 'KW', countryName: 'Kuwait' },
    { isoCode: 'BH', countryName: 'Bahrain' },
    { isoCode: 'OM', countryName: 'Oman' },
    { isoCode: 'FR', countryName: 'France' },
    { isoCode: 'DE', countryName: 'Germany' },
    { isoCode: 'IT', countryName: 'Italy' },
    { isoCode: 'ES', countryName: 'Spain' },
    { isoCode: 'NL', countryName: 'Netherlands' },
    { isoCode: 'CH', countryName: 'Switzerland' },
    { isoCode: 'MY', countryName: 'Malaysia' },
    { isoCode: 'TH', countryName: 'Thailand' },
  ];
}

/**
 * Get user's saved nationality from auth context
 * Returns null if not authenticated or not set
 */
export function getUserNationality(user: any): string | null {
  return user?.nationality_iso || user?.nationalityIso || null;
}

/**
 * Get default nationality for search
 * Priority: user's saved nationality > India (IN)
 */
export function getDefaultNationality(user: any): string {
  const userNationality = getUserNationality(user);
  return userNationality || 'IN';
}
