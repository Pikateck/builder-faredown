/**
 * Admin Bargain Service
 * API client for bargain settings management
 */

import { apiClient } from '@/lib/api';

export interface BargainSettings {
  id: number;
  module: 'hotels' | 'flights' | 'sightseeing' | 'transfers' | 'packages' | 'addons';
  enabled: boolean;
  attempts: number;
  r1_timer_sec: number;
  r2_timer_sec: number;
  discount_min_pct: number;
  discount_max_pct: number;
  show_recommended_badge: boolean;
  recommended_label: string;
  show_standard_price_on_expiry: boolean;
  price_match_enabled: boolean;
  copy_json: {
    r1_primary?: string;
    r1_secondary?: string;
    r2_card_low?: string;
    r2_card_high?: string;
    expiry_text?: string;
    expiry_cta?: string;
    recommended_label?: string;
  };
  experiment_flags: Record<string, any>;
  updated_at: string;
  updated_by?: string;
}

export interface MarketRule {
  id: number;
  module: string;
  country_code?: string;
  city?: string;
  attempts?: number;
  r1_timer_sec?: number;
  r2_timer_sec?: number;
  discount_min_pct?: number;
  discount_max_pct?: number;
  copy_json?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  module: string;
  total_sessions: number;
  booked: number;
  expired: number;
  abandoned: number;
  avg_discount_pct: number;
  avg_time_to_r1_sec: number;
}

class AdminBargainService {
  private baseUrl = '/api/admin/bargain';

  /**
   * Get all module settings
   */
  async getAllSettings(): Promise<BargainSettings[]> {
    const response = await apiClient.get(`${this.baseUrl}/settings`);
    return response.data.settings;
  }

  /**
   * Get settings for specific module
   */
  async getModuleSettings(module: string): Promise<BargainSettings> {
    const response = await apiClient.get(`${this.baseUrl}/settings/${module}`);
    return response.data.settings;
  }

  /**
   * Update settings for specific module
   */
  async updateModuleSettings(
    module: string,
    updates: Partial<Omit<BargainSettings, 'id' | 'module' | 'updated_at'>>,
    updatedBy?: string
  ): Promise<BargainSettings> {
    const response = await apiClient.put(`${this.baseUrl}/settings/${module}`, {
      ...updates,
      updated_by: updatedBy
    });
    return response.data.settings;
  }

  /**
   * Get all market rules
   */
  async getMarketRules(module?: string): Promise<MarketRule[]> {
    const params = module ? { module } : {};
    const response = await apiClient.get(`${this.baseUrl}/market-rules`, { params });
    return response.data.rules;
  }

  /**
   * Create or update market rule
   */
  async saveMarketRule(rule: Partial<MarketRule>): Promise<MarketRule> {
    const response = await apiClient.post(`${this.baseUrl}/market-rules`, rule);
    return response.data.rule;
  }

  /**
   * Delete market rule
   */
  async deleteMarketRule(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/market-rules/${id}`);
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(module?: string, days: number = 7): Promise<{
    summary: AnalyticsSummary[];
    period_days: number;
  }> {
    const params: any = { days };
    if (module) {
      params.module = module;
    }
    const response = await apiClient.get(`${this.baseUrl}/analytics/summary`, { params });
    return {
      summary: response.data.summary,
      period_days: response.data.period_days
    };
  }

  /**
   * Validate copy JSON structure
   */
  validateCopyJson(copy: Record<string, string>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredKeys = [
      'r1_primary',
      'r1_secondary',
      'expiry_text',
      'expiry_cta',
      'recommended_label'
    ];

    requiredKeys.forEach(key => {
      if (!copy[key] || copy[key].trim() === '') {
        errors.push(`Missing required copy key: ${key}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default copy for module
   */
  getDefaultCopy(module: string): Record<string, string> {
    const defaults: Record<string, Record<string, string>> = {
      hotels: {
        r1_primary: 'Book ₹{price}',
        r1_secondary: 'Try Final Bargain',
        r2_card_low: 'Book ₹{price} (Best price)',
        r2_card_high: 'Book ₹{price}',
        expiry_text: "⌛ Time's up. This price is no longer available.",
        expiry_cta: 'Book at Standard Price ₹{base}',
        recommended_label: 'Recommended'
      },
      flights: {
        r1_primary: 'Book ₹{price}',
        r1_secondary: 'Skip bargain',
        r2_card_low: '',
        r2_card_high: '',
        expiry_text: "⌛ Time's up. This price is no longer available.",
        expiry_cta: 'Book at Standard Price ₹{base}',
        recommended_label: 'Best deal'
      },
      sightseeing: {
        r1_primary: 'Book ₹{price}',
        r1_secondary: 'Try one more time',
        r2_card_low: 'Book ₹{price}',
        r2_card_high: 'Book ₹{price}',
        expiry_text: "⌛ Time's up. This price is no longer available.",
        expiry_cta: 'Book at Standard Price ₹{base}',
        recommended_label: 'Recommended'
      },
      transfers: {
        r1_primary: 'Book ₹{price}',
        r1_secondary: 'Try one more time',
        r2_card_low: 'Book ₹{price}',
        r2_card_high: 'Book ₹{price}',
        expiry_text: "⌛ Time's up. This price is no longer available.",
        expiry_cta: 'Book at Standard Price ₹{base}',
        recommended_label: 'Recommended'
      },
      packages: {
        r1_primary: 'Request better price',
        r1_secondary: 'Book now',
        r2_card_low: '',
        r2_card_high: '',
        expiry_text: 'Your request has been submitted.',
        expiry_cta: 'View standard package',
        recommended_label: 'Best value'
      },
      addons: {
        r1_primary: '',
        r1_secondary: '',
        r2_card_low: '',
        r2_card_high: '',
        expiry_text: '',
        expiry_cta: '',
        recommended_label: ''
      }
    };

    return defaults[module] || defaults.hotels;
  }
}

export const adminBargainService = new AdminBargainService();
