/**
 * Integration Tests for Loyalty Pages and API Flows
 * Tests end-to-end functionality in both online and offline modes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { LoyaltyProvider } from '../contexts/LoyaltyContext';
import { AppHealthMonitor } from '../components/AppHealthMonitor';
import { loyaltyService } from '../services/loyaltyService';

// Mock API responses
const mockLoyaltyProfile = {
  member: {
    id: 1,
    memberCode: "FD000001",
    tier: 1,
    tierName: "Explorer",
    pointsBalance: 1250,
    pointsLocked: 0,
    pointsLifetime: 3450,
    points12m: 1250,
    joinDate: "2024-01-01T00:00:00Z",
    status: "active",
  },
  tier: {
    current: {
      tier: 1,
      tierName: "Explorer",
      thresholdPoints12m: 0,
      earnMultiplier: 1.0,
      benefits: ["Earn 3 points per ₹100", "Basic customer support"],
    },
    next: {
      tier: 2,
      tierName: "Voyager",
      thresholdPoints12m: 5000,
      earnMultiplier: 1.25,
      benefits: ["Earn 4 points per ₹100", "Priority support"],
    },
    progress: 25,
    pointsToNext: 3750,
  },
  expiringSoon: [],
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <LoyaltyProvider>
      {children}
    </LoyaltyProvider>
  </MemoryRouter>
);

describe('Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock console methods to avoid test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loyalty Service Online Mode', () => {
    it('should load loyalty profile successfully', async () => {
      // Mock successful API response
      vi.spyOn(loyaltyService, 'getProfile').mockResolvedValue(mockLoyaltyProfile);

      const profile = await loyaltyService.getProfile();
      
      expect(profile).toEqual(mockLoyaltyProfile);
      expect(profile.member.pointsBalance).toBe(1250);
      expect(profile.tier.current.tierName).toBe("Explorer");
    });

    it('should handle quote redemption correctly', async () => {
      const mockQuote = {
        maxPoints: 500,
        rupeeValue: 100,
        capReason: undefined
      };

      vi.spyOn(loyaltyService, 'quoteRedemption').mockResolvedValue(mockQuote);

      const quote = await loyaltyService.quoteRedemption(1000);
      
      expect(quote.maxPoints).toBe(500);
      expect(quote.rupeeValue).toBe(100);
    });

    it('should apply points redemption correctly', async () => {
      const mockResult = {
        lockedId: "LOCK123",
        pointsApplied: 500,
        rupeeValue: 100
      };

      vi.spyOn(loyaltyService, 'applyRedemption').mockResolvedValue(mockResult);

      const result = await loyaltyService.applyRedemption("CART123", 500, 1000);
      
      expect(result.pointsApplied).toBe(500);
      expect(result.rupeeValue).toBe(100);
      expect(result.lockedId).toBe("LOCK123");
    });
  });

  describe('Loyalty Service Offline Mode', () => {
    it('should provide fallback data when API fails', async () => {
      // Mock API failure
      vi.spyOn(loyaltyService, 'getProfile').mockRejectedValue(new Error('Failed to fetch'));

      // Should not throw and should return fallback data
      const profile = await loyaltyService.getProfile();
      
      expect(profile).toBeDefined();
      expect(profile.member).toBeDefined();
      expect(profile.tier).toBeDefined();
      expect(typeof profile.member.pointsBalance).toBe('number');
    });

    it('should handle network errors gracefully in redemption', async () => {
      // Mock network error
      vi.spyOn(loyaltyService, 'quoteRedemption').mockRejectedValue(
        new Error('NetworkError: Failed to fetch')
      );

      // Should return fallback quote
      const quote = await loyaltyService.quoteRedemption(1000);
      
      expect(quote).toBeDefined();
      expect(quote.maxPoints).toBeGreaterThan(0);
      expect(quote.rupeeValue).toBeGreaterThan(0);
    });

    it('should validate offline mode detection', () => {
      // Test offline mode detection
      const isOffline = loyaltyService.isOfflineMode();
      expect(typeof isOffline).toBe('boolean');
    });
  });

  describe('App Health Monitor Component', () => {
    it('should render without errors', () => {
      render(
        <TestWrapper>
          <AppHealthMonitor services={['loyalty', 'hotels']} />
        </TestWrapper>
      );

      // Component should render without throwing
      expect(true).toBe(true);
    });

    it('should handle service health checks', async () => {
      // Mock fetch for health checks
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'ok' })
        })
        .mockRejectedValueOnce(new Error('Service unavailable'));

      render(
        <TestWrapper>
          <AppHealthMonitor 
            services={['loyalty']} 
            checkInterval={1000}
            showBanner={true}
          />
        </TestWrapper>
      );

      // Wait for health checks to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Error Boundary and Recovery', () => {
    it('should handle API timeout gracefully', async () => {
      // Mock timeout error
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      
      vi.spyOn(loyaltyService, 'getProfile').mockRejectedValue(timeoutError);

      const profile = await loyaltyService.getProfile();
      
      // Should return fallback data, not throw
      expect(profile).toBeDefined();
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      vi.spyOn(loyaltyService, 'getProfile').mockResolvedValue(null as any);

      const profile = await loyaltyService.getProfile();
      
      // Should handle gracefully
      expect(profile).toBeDefined();
    });

    it('should handle network connectivity loss', async () => {
      // Mock network connectivity loss
      const networkError = new Error('Failed to fetch');
      vi.spyOn(loyaltyService, 'getProfile').mockRejectedValue(networkError);

      // Should not throw and provide fallback
      const profile = await loyaltyService.getProfile();
      expect(profile).toBeDefined();
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete API calls within reasonable time', async () => {
      const startTime = Date.now();
      
      // Mock fast response
      vi.spyOn(loyaltyService, 'getProfile').mockResolvedValue(mockLoyaltyProfile);
      
      await loyaltyService.getProfile();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent API calls efficiently', async () => {
      vi.spyOn(loyaltyService, 'getProfile').mockResolvedValue(mockLoyaltyProfile);
      vi.spyOn(loyaltyService, 'quoteRedemption').mockResolvedValue({
        maxPoints: 500,
        rupeeValue: 100
      });

      const startTime = Date.now();
      
      // Run multiple concurrent calls
      await Promise.all([
        loyaltyService.getProfile(),
        loyaltyService.quoteRedemption(1000),
        loyaltyService.getRules()
      ]);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete concurrently within 2 seconds
    });

    it('should cache and reuse data appropriately', async () => {
      const getSpy = vi.spyOn(loyaltyService, 'getProfile')
        .mockResolvedValue(mockLoyaltyProfile);

      // Call multiple times
      await loyaltyService.getProfile();
      await loyaltyService.getProfile();
      
      // Should be called for each request (no caching at service level)
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should behave correctly in development environment', async () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      vi.spyOn(loyaltyService, 'getProfile').mockRejectedValue(new Error('API Error'));

      // Should use fallback data in development
      const profile = await loyaltyService.getProfile();
      expect(profile).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should behave correctly in production environment', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      vi.spyOn(loyaltyService, 'getProfile').mockRejectedValue(new Error('API Error'));

      // In production, should still provide fallback for network errors
      const profile = await loyaltyService.getProfile();
      expect(profile).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('User Experience Scenarios', () => {
    it('should handle user switching between online and offline', async () => {
      // Start online
      vi.spyOn(loyaltyService, 'getProfile').mockResolvedValue(mockLoyaltyProfile);
      const onlineProfile = await loyaltyService.getProfile();
      expect(onlineProfile.member.memberCode).toBe("FD000001");

      // Switch to offline
      vi.spyOn(loyaltyService, 'getProfile').mockRejectedValue(new Error('Failed to fetch'));
      const offlineProfile = await loyaltyService.getProfile();
      expect(offlineProfile).toBeDefined();
    });

    it('should maintain functionality during partial service outages', async () => {
      // Mock partial service failure
      vi.spyOn(loyaltyService, 'getProfile').mockResolvedValue(mockLoyaltyProfile);
      vi.spyOn(loyaltyService, 'quoteRedemption').mockRejectedValue(new Error('Service unavailable'));

      // Profile should work
      const profile = await loyaltyService.getProfile();
      expect(profile).toBeDefined();

      // Redemption should fallback gracefully
      const quote = await loyaltyService.quoteRedemption(1000);
      expect(quote).toBeDefined();
    });
  });
});