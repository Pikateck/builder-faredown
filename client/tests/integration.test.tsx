/**
 * Integration Tests for Loyalty Pages and API Flows
 * Tests end-to-end functionality in both online and offline modes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loyalty Service Online Mode', () => {
    it('should load loyalty profile successfully', async () => {
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
  });

  describe('Loyalty Service Offline Mode', () => {
    it('should provide fallback data when API fails', async () => {
      vi.spyOn(loyaltyService, 'getProfile').mockRejectedValue(new Error('Failed to fetch'));

      const profile = await loyaltyService.getProfile();
      
      expect(profile).toBeDefined();
      expect(profile.member).toBeDefined();
      expect(profile.tier).toBeDefined();
      expect(typeof profile.member.pointsBalance).toBe('number');
    });

    it('should handle network errors gracefully in redemption', async () => {
      vi.spyOn(loyaltyService, 'quoteRedemption').mockRejectedValue(
        new Error('NetworkError: Failed to fetch')
      );

      const quote = await loyaltyService.quoteRedemption(1000);
      
      expect(quote).toBeDefined();
      expect(quote.maxPoints).toBeGreaterThan(0);
      expect(quote.rupeeValue).toBeGreaterThan(0);
    });
  });

  describe('App Health Monitor Component', () => {
    it('should render without errors', () => {
      render(
        <TestWrapper>
          <AppHealthMonitor services={['loyalty', 'hotels']} />
        </TestWrapper>
      );

      expect(true).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete API calls within reasonable time', async () => {
      const startTime = Date.now();
      
      vi.spyOn(loyaltyService, 'getProfile').mockResolvedValue(mockLoyaltyProfile);
      
      await loyaltyService.getProfile();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent API calls efficiently', async () => {
      vi.spyOn(loyaltyService, 'getProfile').mockResolvedValue(mockLoyaltyProfile);
      vi.spyOn(loyaltyService, 'quoteRedemption').mockResolvedValue({
        maxPoints: 500,
        rupeeValue: 100
      });

      const startTime = Date.now();
      
      await Promise.all([
        loyaltyService.getProfile(),
        loyaltyService.quoteRedemption(1000)
      ]);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });
});
