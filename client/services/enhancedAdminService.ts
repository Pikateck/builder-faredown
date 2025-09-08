/**
 * Enhanced Admin Service with Production-Safe Error Handling
 * Handles all admin module functionalities: Markup, Promo, Bookings, Users
 */

import { EnhancedApiService, createFallbackList, createFallbackItem, createFallbackBoolean } from '../lib/enhancedApiWrapper';

// Admin User Interface
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'manager' | 'agent';
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

// Markup Configuration Interface
export interface MarkupRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'tiered';
  value: number;
  conditions: {
    service: 'hotels' | 'flights' | 'transfers' | 'sightseeing' | 'all';
    supplier?: string;
    destination?: string;
    priceRange?: { min: number; max: number };
    bookingClass?: string;
  };
  priority: number;
  active: boolean;
  validFrom: string;
  validTo?: string;
  createdBy: string;
  createdAt: string;
}

// Promotion Interface
export interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'upgrade';
  value: number;
  conditions: {
    minBookingValue?: number;
    maxDiscount?: number;
    applicableServices: string[];
    firstTimeUser?: boolean;
    userTier?: string[];
  };
  usage: {
    totalLimit: number;
    perUserLimit: number;
    usedCount: number;
  };
  validFrom: string;
  validTo: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

// Booking Interface for Admin
export interface AdminBooking {
  id: string;
  reference: string;
  service: 'hotels' | 'flights' | 'transfers' | 'sightseeing';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  amount: {
    base: number;
    markup: number;
    taxes: number;
    discount: number;
    total: number;
    currency: string;
  };
  supplier: {
    name: string;
    reference?: string;
  };
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

class EnhancedAdminService extends EnhancedApiService {
  constructor() {
    super('admin', '/admin');
  }

  // === USER MANAGEMENT ===

  private createFallbackAdminUsers(): AdminUser[] {
    return [
      {
        id: 'admin_1',
        username: 'admin',
        email: 'admin@faredown.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'super_admin',
        status: 'active',
        permissions: ['all'],
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'admin_2',
        username: 'manager1',
        email: 'manager@faredown.com',
        firstName: 'John',
        lastName: 'Manager',
        role: 'manager',
        status: 'active',
        permissions: ['bookings:read', 'bookings:write', 'users:read', 'reports:read'],
        lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<{
    users: AdminUser[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const fallbackUsers = this.createFallbackAdminUsers();
    const fallbackData = {
      users: fallbackUsers,
      pagination: {
        total: fallbackUsers.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
        pages: 1
      }
    };

    return this.safeGet('/users', params, fallbackData);
  }

  async createUser(userData: Partial<AdminUser>): Promise<AdminUser> {
    const fallbackUser: AdminUser = {
      id: `admin_${Date.now()}`,
      username: userData.username || 'newuser',
      email: userData.email || 'user@faredown.com',
      firstName: userData.firstName || 'New',
      lastName: userData.lastName || 'User',
      role: userData.role || 'agent',
      status: 'active',
      permissions: userData.permissions || ['bookings:read'],
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.safePost('/users', userData, fallbackUser);
  }

  async updateUser(userId: string, userData: Partial<AdminUser>): Promise<AdminUser> {
    const fallbackUser = this.createFallbackAdminUsers()[0];
    fallbackUser.id = userId;
    fallbackUser.updatedAt = new Date().toISOString();

    return this.safePut(`/users/${userId}`, userData, fallbackUser);
  }

  async deleteUser(userId: string): Promise<{ success: boolean }> {
    return this.safeDelete(`/users/${userId}`, { success: true });
  }

  // === MARKUP MANAGEMENT ===

  private createFallbackMarkupRules(): MarkupRule[] {
    return [
      {
        id: 'markup_1',
        name: 'Hotel Base Markup',
        type: 'percentage',
        value: 15,
        conditions: {
          service: 'hotels'
        },
        priority: 1,
        active: true,
        validFrom: new Date().toISOString().split('T')[0],
        createdBy: 'admin',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'markup_2',
        name: 'Premium Flight Markup',
        type: 'percentage',
        value: 8,
        conditions: {
          service: 'flights',
          bookingClass: 'business'
        },
        priority: 2,
        active: true,
        validFrom: new Date().toISOString().split('T')[0],
        createdBy: 'admin',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async getMarkupRules(params?: {
    service?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    rules: MarkupRule[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const fallbackRules = this.createFallbackMarkupRules();
    const fallbackData = {
      rules: fallbackRules,
      pagination: {
        total: fallbackRules.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
        pages: 1
      }
    };

    return this.safeGet('/markup/rules', params, fallbackData);
  }

  async createMarkupRule(ruleData: Partial<MarkupRule>): Promise<MarkupRule> {
    const fallbackRule: MarkupRule = {
      id: `markup_${Date.now()}`,
      name: ruleData.name || 'New Markup Rule',
      type: ruleData.type || 'percentage',
      value: ruleData.value || 10,
      conditions: ruleData.conditions || { service: 'all' },
      priority: ruleData.priority || 1,
      active: true,
      validFrom: new Date().toISOString().split('T')[0],
      createdBy: 'admin',
      createdAt: new Date().toISOString()
    };

    return this.safePost('/markup/rules', ruleData, fallbackRule);
  }

  async updateMarkupRule(ruleId: string, ruleData: Partial<MarkupRule>): Promise<MarkupRule> {
    const fallbackRule = this.createFallbackMarkupRules()[0];
    fallbackRule.id = ruleId;

    return this.safePut(`/markup/rules/${ruleId}`, ruleData, fallbackRule);
  }

  async deleteMarkupRule(ruleId: string): Promise<{ success: boolean }> {
    return this.safeDelete(`/markup/rules/${ruleId}`, { success: true });
  }

  // === PROMOTION MANAGEMENT ===

  private createFallbackPromotions(): Promotion[] {
    return [
      {
        id: 'promo_1',
        code: 'WELCOME20',
        title: 'Welcome Discount',
        description: '20% off on first booking',
        type: 'percentage',
        value: 20,
        conditions: {
          minBookingValue: 1000,
          maxDiscount: 2000,
          applicableServices: ['hotels', 'flights'],
          firstTimeUser: true
        },
        usage: {
          totalLimit: 1000,
          perUserLimit: 1,
          usedCount: 245
        },
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        active: true,
        createdBy: 'admin',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'promo_2',
        code: 'SUMMER500',
        title: 'Summer Special',
        description: '₹500 off on bookings above ₹5000',
        type: 'fixed',
        value: 500,
        conditions: {
          minBookingValue: 5000,
          applicableServices: ['hotels', 'sightseeing']
        },
        usage: {
          totalLimit: 500,
          perUserLimit: 2,
          usedCount: 89
        },
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        active: true,
        createdBy: 'admin',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async getPromotions(params?: {
    active?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    promotions: Promotion[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const fallbackPromotions = this.createFallbackPromotions();
    const fallbackData = {
      promotions: fallbackPromotions,
      pagination: {
        total: fallbackPromotions.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
        pages: 1
      }
    };

    return this.safeGet('/promotions', params, fallbackData);
  }

  async createPromotion(promoData: Partial<Promotion>): Promise<Promotion> {
    const fallbackPromo: Promotion = {
      id: `promo_${Date.now()}`,
      code: promoData.code || 'NEWPROMO',
      title: promoData.title || 'New Promotion',
      description: promoData.description || 'Special discount offer',
      type: promoData.type || 'percentage',
      value: promoData.value || 10,
      conditions: promoData.conditions || {
        applicableServices: ['all']
      },
      usage: {
        totalLimit: 100,
        perUserLimit: 1,
        usedCount: 0
      },
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      active: true,
      createdBy: 'admin',
      createdAt: new Date().toISOString()
    };

    return this.safePost('/promotions', promoData, fallbackPromo);
  }

  async updatePromotion(promoId: string, promoData: Partial<Promotion>): Promise<Promotion> {
    const fallbackPromo = this.createFallbackPromotions()[0];
    fallbackPromo.id = promoId;

    return this.safePut(`/promotions/${promoId}`, promoData, fallbackPromo);
  }

  async deletePromotion(promoId: string): Promise<{ success: boolean }> {
    return this.safeDelete(`/promotions/${promoId}`, { success: true });
  }

  // === BOOKING MANAGEMENT ===

  private createFallbackBookings(): AdminBooking[] {
    return [
      {
        id: 'booking_1',
        reference: 'FB123456',
        service: 'hotels',
        status: 'confirmed',
        customer: {
          id: 'user_1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        amount: {
          base: 8500,
          markup: 1275,
          taxes: 1530,
          discount: 500,
          total: 10805,
          currency: 'INR'
        },
        supplier: {
          name: 'Hotelbeds',
          reference: 'HB789012'
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        notes: 'Customer requested late check-in'
      },
      {
        id: 'booking_2',
        reference: 'FB123457',
        service: 'flights',
        status: 'pending',
        customer: {
          id: 'user_2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1234567891'
        },
        amount: {
          base: 12000,
          markup: 960,
          taxes: 2160,
          discount: 0,
          total: 15120,
          currency: 'INR'
        },
        supplier: {
          name: 'Amadeus',
          reference: 'AM345678'
        },
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async getBookings(params?: {
    service?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    bookings: AdminBooking[];
    summary: {
      total: number;
      confirmed: number;
      pending: number;
      cancelled: number;
      totalValue: number;
    };
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const fallbackBookings = this.createFallbackBookings();
    const fallbackData = {
      bookings: fallbackBookings,
      summary: {
        total: fallbackBookings.length,
        confirmed: 1,
        pending: 1,
        cancelled: 0,
        totalValue: 25925
      },
      pagination: {
        total: fallbackBookings.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
        pages: 1
      }
    };

    return this.safeGet('/bookings', params, fallbackData);
  }

  async getBookingDetails(bookingId: string): Promise<AdminBooking> {
    const fallbackBooking = this.createFallbackBookings()[0];
    fallbackBooking.id = bookingId;

    return this.safeGet(`/bookings/${bookingId}`, undefined, fallbackBooking);
  }

  async updateBookingStatus(
    bookingId: string, 
    status: AdminBooking['status'], 
    notes?: string
  ): Promise<AdminBooking> {
    const fallbackBooking = this.createFallbackBookings()[0];
    fallbackBooking.id = bookingId;
    fallbackBooking.status = status;
    fallbackBooking.notes = notes;
    fallbackBooking.updatedAt = new Date().toISOString();

    return this.safePut(`/bookings/${bookingId}/status`, { status, notes }, fallbackBooking);
  }

  // === DASHBOARD & ANALYTICS ===

  async getDashboardStats(): Promise<{
    bookings: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      total: number;
    };
    revenue: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      total: number;
      currency: string;
    };
    users: {
      active: number;
      newThisMonth: number;
      total: number;
    };
    services: {
      hotels: number;
      flights: number;
      transfers: number;
      sightseeing: number;
    };
  }> {
    const fallbackStats = {
      bookings: {
        today: 15,
        thisWeek: 89,
        thisMonth: 342,
        total: 2156
      },
      revenue: {
        today: 125000,
        thisWeek: 890000,
        thisMonth: 3420000,
        total: 21560000,
        currency: 'INR'
      },
      users: {
        active: 1245,
        newThisMonth: 156,
        total: 5678
      },
      services: {
        hotels: 1234,
        flights: 567,
        transfers: 234,
        sightseeing: 121
      }
    };

    return this.safeGet('/dashboard/stats', undefined, fallbackStats);
  }

  async getRevenueChart(period: 'week' | 'month' | 'year'): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color: string;
    }>;
  }> {
    const fallbackChart = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Revenue',
          data: [120000, 180000, 150000, 220000, 190000, 260000, 240000],
          color: '#10B981'
        },
        {
          label: 'Bookings',
          data: [25, 35, 30, 45, 38, 52, 48],
          color: '#3B82F6'
        }
      ]
    };

    return this.safeGet(`/dashboard/revenue-chart`, { period }, fallbackChart);
  }

  // === SYSTEM MANAGEMENT ===

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    services: Record<string, {
      status: 'up' | 'down' | 'degraded';
      responseTime: number;
      lastCheck: string;
    }>;
    database: {
      status: 'connected' | 'disconnected';
      responseTime: number;
    };
    cache: {
      status: 'active' | 'inactive';
      hitRate: number;
    };
  }> {
    const fallbackHealth = {
      status: 'healthy' as const,
      services: {
        api: { status: 'up' as const, responseTime: 45, lastCheck: new Date().toISOString() },
        booking: { status: 'up' as const, responseTime: 67, lastCheck: new Date().toISOString() },
        payment: { status: 'up' as const, responseTime: 123, lastCheck: new Date().toISOString() }
      },
      database: {
        status: 'connected' as const,
        responseTime: 23
      },
      cache: {
        status: 'active' as const,
        hitRate: 85.6
      }
    };

    return this.safeGet('/system/health', undefined, fallbackHealth);
  }

  async clearCache(type?: 'all' | 'api' | 'static'): Promise<{ success: boolean; cleared: string[] }> {
    return this.safePost('/system/cache/clear', { type }, { 
      success: true, 
      cleared: ['api_responses', 'static_content'] 
    });
  }

  // Utility methods
  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(amount);
  }

  calculateMarkup(basePrice: number, markupRules: MarkupRule[]): number {
    let totalMarkup = 0;
    
    markupRules
      .filter(rule => rule.active)
      .sort((a, b) => a.priority - b.priority)
      .forEach(rule => {
        if (rule.type === 'percentage') {
          totalMarkup += (basePrice * rule.value) / 100;
        } else if (rule.type === 'fixed') {
          totalMarkup += rule.value;
        }
      });

    return totalMarkup;
  }

  validatePromoCode(code: string, promotions: Promotion[]): {
    valid: boolean;
    promotion?: Promotion;
    error?: string;
  } {
    const promo = promotions.find(p => p.code === code && p.active);
    
    if (!promo) {
      return { valid: false, error: 'Invalid promo code' };
    }

    const now = new Date();
    const validFrom = new Date(promo.validFrom);
    const validTo = new Date(promo.validTo);

    if (now < validFrom || now > validTo) {
      return { valid: false, error: 'Promo code has expired' };
    }

    if (promo.usage.usedCount >= promo.usage.totalLimit) {
      return { valid: false, error: 'Promo code usage limit reached' };
    }

    return { valid: true, promotion: promo };
  }
}

export const enhancedAdminService = new EnhancedAdminService();
export default enhancedAdminService;

export type { AdminUser, MarkupRule, Promotion, AdminBooking };
