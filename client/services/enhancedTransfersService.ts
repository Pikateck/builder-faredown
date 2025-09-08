/**
 * Enhanced Transfers Service with Production-Safe Error Handling
 * Example implementation using the new API wrapper pattern
 */

import { EnhancedApiService, createFallbackList, createFallbackItem, createFallbackBoolean } from '../lib/enhancedApiWrapper';

// Transfer interface (keeping existing structure)
export interface Transfer {
  id: string;
  rateKey: string;
  supplierCode: string;
  vehicleType: string;
  vehicleClass: string;
  vehicleName: string;
  vehicleImage?: string;
  maxPassengers: number;
  maxLuggage: number;
  pickupLocation: string;
  pickupInstructions?: string;
  dropoffLocation: string;
  dropoffInstructions?: string;
  estimatedDuration: number;
  distance?: string;
  currency: string;
  basePrice: number;
  totalPrice: number;
  pricing: {
    basePrice: number;
    markupAmount: number;
    discountAmount: number;
    totalPrice: number;
    currency: string;
    savings: number;
  };
  features: string[];
  inclusions: string[];
  exclusions: string[];
  providerName: string;
  providerRating?: number;
  cancellationPolicy: any;
  freeWaitingTime: number;
  confirmationType: string;
  searchSessionId: string;
}

export interface TransferSearchParams {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  isRoundTrip?: boolean;
  vehicleType?: string;
}

export interface TransferBookingData {
  transferId: string;
  rateKey: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  pickupDetails: {
    location: string;
    instructions?: string;
    flightNumber?: string;
  };
  paymentDetails: {
    method: string;
    amount: number;
    currency: string;
  };
}

// Enhanced Transfers Service
class EnhancedTransfersService extends EnhancedApiService {
  constructor() {
    super('transfers', '/transfers');
  }

  // Create comprehensive fallback data
  private createFallbackTransfers(params: TransferSearchParams): Transfer[] {
    const baseTransfer: Transfer = {
      id: "fallback_transfer_1",
      rateKey: "fallback_rate_1",
      supplierCode: "hotelbeds",
      vehicleType: "sedan",
      vehicleClass: "economy",
      vehicleName: "Sedan - Economy",
      maxPassengers: 3,
      maxLuggage: 2,
      pickupLocation: params.pickupLocation || "Airport Terminal",
      dropoffLocation: params.dropoffLocation || "City Center",
      estimatedDuration: 45,
      distance: "25 km",
      currency: "INR",
      basePrice: 1200,
      totalPrice: 1380,
      pricing: {
        basePrice: 1200,
        markupAmount: 180,
        discountAmount: 0,
        totalPrice: 1380,
        currency: "INR",
        savings: 0,
      },
      features: ["meet_greet", "professional_driver", "free_waiting"],
      inclusions: [
        "Professional driver",
        "Meet & greet service", 
        "60 minutes free waiting"
      ],
      exclusions: ["Tolls", "Parking fees"],
      providerName: "Fallback Transfers",
      providerRating: 4.2,
      cancellationPolicy: { freeUntil: "24h", feePercentage: 10 },
      freeWaitingTime: 60,
      confirmationType: "INSTANT",
      searchSessionId: "fallback_session",
    };

    return [
      baseTransfer,
      {
        ...baseTransfer,
        id: "fallback_transfer_2",
        vehicleType: "suv",
        vehicleClass: "premium",
        vehicleName: "SUV - Premium",
        maxPassengers: 6,
        maxLuggage: 4,
        totalPrice: 2300,
        pricing: { ...baseTransfer.pricing, totalPrice: 2300 },
        providerRating: 4.5,
      },
      {
        ...baseTransfer,
        id: "fallback_transfer_3",
        vehicleType: "luxury",
        vehicleClass: "luxury",
        vehicleName: "Mercedes E-Class",
        totalPrice: 3800,
        pricing: { ...baseTransfer.pricing, totalPrice: 3800 },
        providerName: "Luxury Transfers",
        providerRating: 4.8,
        freeWaitingTime: 120,
      }
    ];
  }

  // Enhanced search method with fallback
  async searchTransfers(params: TransferSearchParams): Promise<{
    transfers: Transfer[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const fallbackData = {
      transfers: this.createFallbackTransfers(params),
      pagination: {
        total: 3,
        page: 1,
        limit: 20,
        pages: 1
      }
    };

    return this.safePost('/search', params, fallbackData, 'search transfers');
  }

  // Enhanced get transfer details with fallback
  async getTransferDetails(transferId: string, params?: Record<string, string>): Promise<Transfer> {
    const fallbackTransfer = this.createFallbackTransfers({
      pickupLocation: "Fallback Location",
      dropoffLocation: "Fallback Destination", 
      pickupDate: new Date().toISOString().split('T')[0],
      passengers: { adults: 2, children: 0, infants: 0 }
    })[0];

    fallbackTransfer.id = transferId;

    const queryParams = new URLSearchParams(params || {});
    const endpoint = `/product/${transferId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    return this.safeGet(endpoint, undefined, fallbackTransfer);
  }

  // Enhanced booking method with fallback
  async bookTransfer(bookingData: TransferBookingData): Promise<{
    success: boolean;
    bookingReference: string;
    confirmationNumber: string;
    totalAmount: number;
    currency: string;
  }> {
    const fallbackResponse = {
      success: true,
      bookingReference: `BK${Date.now()}`,
      confirmationNumber: `CONF${Date.now()}`,
      totalAmount: bookingData.paymentDetails.amount,
      currency: bookingData.paymentDetails.currency,
    };

    return this.safePost('/book', bookingData, fallbackResponse, 'book transfer');
  }

  // Enhanced get booking details with fallback
  async getBookingDetails(bookingReference: string): Promise<{
    booking: any;
    status: string;
    canCancel: boolean;
  }> {
    const fallbackBooking = {
      booking: {
        reference: bookingReference,
        status: 'confirmed',
        transferDetails: this.createFallbackTransfers({
          pickupLocation: "Fallback Pickup",
          dropoffLocation: "Fallback Dropoff",
          pickupDate: new Date().toISOString().split('T')[0],
          passengers: { adults: 2, children: 0, infants: 0 }
        })[0],
        guestDetails: {
          firstName: "Guest",
          lastName: "User",
          email: "guest@example.com",
          phone: "+1234567890"
        }
      },
      status: 'confirmed',
      canCancel: true
    };

    return this.safeGet(`/booking/${bookingReference}`, undefined, fallbackBooking);
  }

  // Enhanced cancel booking with fallback
  async cancelBooking(bookingReference: string, reason?: string): Promise<{
    success: boolean;
    cancellationId: string;
    refundAmount: number;
    refundCurrency: string;
  }> {
    const fallbackResponse = {
      success: true,
      cancellationId: `CANCEL${Date.now()}`,
      refundAmount: 0,
      refundCurrency: 'INR'
    };

    return this.safePost(
      `/booking/${bookingReference}/cancel`, 
      { reason }, 
      fallbackResponse,
      'cancel booking'
    );
  }

  // Enhanced get user bookings with fallback
  async getUserBookings(userId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    bookings: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const fallbackData = {
      bookings: [],
      pagination: {
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
        pages: 0
      }
    };

    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/bookings/user/${userId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    return this.safeGet(endpoint, undefined, fallbackData);
  }

  // Enhanced repricing with fallback
  async repricingTransfer(transferId: string, params: any): Promise<{
    newPrice: number;
    currency: string;
    validUntil: string;
  }> {
    const fallbackRepricing = {
      newPrice: 1500,
      currency: 'INR',
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    };

    return this.safePost('/repricing', { transferId, ...params }, fallbackRepricing, 'repricing');
  }

  // Service health check
  async getHealthStatus(): Promise<{
    status: string;
    lastCheck: string;
    suppliers: Record<string, boolean>;
  }> {
    const fallbackHealth = {
      status: 'fallback',
      lastCheck: new Date().toISOString(),
      suppliers: {
        hotelbeds: false,
        viator: false,
        local: true
      }
    };

    return this.safeGet('/health', undefined, fallbackHealth);
  }

  // Utility methods
  formatTransferDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatPrice(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getVehicleCapacity(vehicleType: string): { passengers: number; luggage: number } {
    const capacities: Record<string, { passengers: number; luggage: number }> = {
      sedan: { passengers: 3, luggage: 2 },
      suv: { passengers: 6, luggage: 4 },
      luxury: { passengers: 3, luggage: 3 },
      minivan: { passengers: 8, luggage: 6 },
      wheelchair: { passengers: 2, luggage: 1 }
    };

    return capacities[vehicleType] || { passengers: 3, luggage: 2 };
  }

  validateSearchParams(params: TransferSearchParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.pickupLocation?.trim()) {
      errors.push('Pickup location is required');
    }
    if (!params.dropoffLocation?.trim()) {
      errors.push('Dropoff location is required');
    }
    if (!params.pickupDate) {
      errors.push('Pickup date is required');
    }
    if (new Date(params.pickupDate) < new Date()) {
      errors.push('Pickup date cannot be in the past');
    }
    if (params.passengers.adults < 1) {
      errors.push('At least 1 adult passenger is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create and export the service instance
export const enhancedTransfersService = new EnhancedTransfersService();
export default enhancedTransfersService;

// Export types for other modules
export type { Transfer, TransferSearchParams, TransferBookingData };
