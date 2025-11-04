/**
 * Bargain Settings Service
 * Public API for fetching module-specific bargain settings
 */

import { apiClient } from '@/lib/api';

export interface BargainModuleSettings {
  enabled: boolean;
  attempts: number;
  r1_timer_sec: number;
  r2_timer_sec: number;
  show_recommended_badge: boolean;
  recommended_label: string;
  show_standard_price_on_expiry: boolean;
  copy: {
    r1_primary?: string;
    r1_secondary?: string;
    r2_card_low?: string;
    r2_card_high?: string;
    expiry_text?: string;
    expiry_cta?: string;
    recommended_label?: string;
  };
}

export type ModuleType = 'hotels' | 'flights' | 'sightseeing' | 'transfers' | 'packages' | 'addons';

class BargainSettingsService {
  private cache: Map<string, { settings: BargainModuleSettings; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Get settings for a module
   * @param module - Module name
   * @param options - Optional country/city for market overrides
   * @returns Module settings
   */
  async getSettings(
    module: ModuleType,
    options?: { country_code?: string; city?: string }
  ): Promise<BargainModuleSettings> {
    const cacheKey = `${module}_${options?.country_code || ''}_${options?.city || ''}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.settings;
    }

    try {
      const params: any = { module };
      if (options?.country_code) params.country_code = options.country_code;
      if (options?.city) params.city = options.city;

      const response = await apiClient.get('/bargain/settings', { params });
      const settings = response.data;

      // Cache the result
      this.cache.set(cacheKey, {
        settings,
        timestamp: Date.now()
      });

      return settings;
    } catch (error) {
      console.error('Error fetching bargain settings:', error);
      
      // Return default settings as fallback
      return this.getDefaultSettings(module);
    }
  }

  /**
   * Get default settings for a module (used as fallback)
   */
  private getDefaultSettings(module: ModuleType): BargainModuleSettings {
    const defaults: Record<ModuleType, BargainModuleSettings> = {
      hotels: {
        enabled: true,
        attempts: 2,
        r1_timer_sec: 30,
        r2_timer_sec: 30,
        show_recommended_badge: true,
        recommended_label: 'Recommended',
        show_standard_price_on_expiry: true,
        copy: {
          r1_primary: 'Book ₹{price}',
          r1_secondary: 'Try Final Bargain',
          r2_card_low: 'Book ₹{price} (Best price)',
          r2_card_high: 'Book ₹{price}',
          expiry_text: "⌛ Time's up. This price is no longer available.",
          expiry_cta: 'Book at Standard Price ₹{base}',
          recommended_label: 'Recommended'
        }
      },
      flights: {
        enabled: true,
        attempts: 1,
        r1_timer_sec: 15,
        r2_timer_sec: 0,
        show_recommended_badge: true,
        recommended_label: 'Best deal',
        show_standard_price_on_expiry: true,
        copy: {
          r1_primary: 'Book ₹{price}',
          r1_secondary: 'Skip bargain',
          r2_card_low: '',
          r2_card_high: '',
          expiry_text: "⌛ Time's up. This price is no longer available.",
          expiry_cta: 'Book at Standard Price ₹{base}',
          recommended_label: 'Best deal'
        }
      },
      sightseeing: {
        enabled: true,
        attempts: 1,
        r1_timer_sec: 20,
        r2_timer_sec: 20,
        show_recommended_badge: true,
        recommended_label: 'Recommended',
        show_standard_price_on_expiry: true,
        copy: {
          r1_primary: 'Book ₹{price}',
          r1_secondary: 'Try one more time',
          r2_card_low: 'Book ₹{price}',
          r2_card_high: 'Book ₹{price}',
          expiry_text: "⌛ Time's up. This price is no longer available.",
          expiry_cta: 'Book at Standard Price ₹{base}',
          recommended_label: 'Recommended'
        }
      },
      transfers: {
        enabled: true,
        attempts: 1,
        r1_timer_sec: 20,
        r2_timer_sec: 20,
        show_recommended_badge: true,
        recommended_label: 'Recommended',
        show_standard_price_on_expiry: true,
        copy: {
          r1_primary: 'Book ₹{price}',
          r1_secondary: 'Try one more time',
          r2_card_low: 'Book ₹{price}',
          r2_card_high: 'Book ₹{price}',
          expiry_text: "⌛ Time's up. This price is no longer available.",
          expiry_cta: 'Book at Standard Price ₹{base}',
          recommended_label: 'Recommended'
        }
      },
      packages: {
        enabled: false,
        attempts: 0,
        r1_timer_sec: 30,
        r2_timer_sec: 0,
        show_recommended_badge: false,
        recommended_label: 'Best value',
        show_standard_price_on_expiry: false,
        copy: {
          r1_primary: 'Request better price',
          r1_secondary: 'Book now',
          r2_card_low: '',
          r2_card_high: '',
          expiry_text: 'Your request has been submitted.',
          expiry_cta: 'View standard package',
          recommended_label: 'Best value'
        }
      },
      addons: {
        enabled: false,
        attempts: 0,
        r1_timer_sec: 0,
        r2_timer_sec: 0,
        show_recommended_badge: false,
        recommended_label: '',
        show_standard_price_on_expiry: false,
        copy: {
          r1_primary: '',
          r1_secondary: '',
          r2_card_low: '',
          r2_card_high: '',
          expiry_text: '',
          expiry_cta: '',
          recommended_label: ''
        }
      }
    };

    return defaults[module];
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Format copy text with price placeholders
   * @param template - Copy template with {price} and {base} placeholders
   * @param price - Price to substitute for {price}
   * @param basePrice - Base price to substitute for {base}
   * @returns Formatted string
   */
  formatCopy(template: string, price?: number, basePrice?: number): string {
    if (!template) return '';
    
    let result = template;
    
    if (price !== undefined) {
      result = result.replace(/\{price\}/g, price.toString());
    }
    
    if (basePrice !== undefined) {
      result = result.replace(/\{base\}/g, basePrice.toString());
    }
    
    return result;
  }
}

export const bargainSettingsService = new BargainSettingsService();
