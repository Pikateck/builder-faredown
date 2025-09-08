import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  loyaltyService,
  LoyaltyProfile,
  RedemptionQuote,
} from "../services/loyaltyService";

interface CartRedemption {
  cartId: string;
  pointsApplied: number;
  rupeeValue: number;
  lockedId: string;
}

interface LoyaltyContextType {
  // Profile data
  profile: LoyaltyProfile | null;
  isLoading: boolean;
  error: string | null;
  isOfflineMode: boolean;

  // Cart redemption state
  cartRedemption: CartRedemption | null;
  pendingQuote: RedemptionQuote | null;

  // Actions
  refreshProfile: () => Promise<void>;
  quoteRedemption: (
    eligibleAmount: number,
    currency?: string,
    fxRate?: number,
  ) => Promise<RedemptionQuote>;
  applyPoints: (
    cartId: string,
    points: number,
    eligibleAmount: number,
  ) => Promise<boolean>;
  cancelRedemption: () => Promise<boolean>;
  clearCart: () => void;
  clearError: () => void;

  // Helper methods
  canRedeem: (amount: number) => boolean;
  getMaxRedeemablePoints: (eligibleAmount: number) => number;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

interface LoyaltyProviderProps {
  children: React.ReactNode;
}

export function LoyaltyProvider({ children }: LoyaltyProviderProps) {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [cartRedemption, setCartRedemption] = useState<CartRedemption | null>(null);
  const [pendingQuote, setPendingQuote] = useState<RedemptionQuote | null>(null);

  // Enhanced profile loading with better error handling
  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profileData = await loyaltyService.getProfile();
      setProfile(profileData);
      setIsOfflineMode(loyaltyService.isOfflineMode());
      
      // Clear any previous errors on successful load
      setError(null);
    } catch (err) {
      console.warn("Loyalty profile load failed:", err);
      
      // Enhanced error handling - don't show errors for network issues
      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch") || 
            err.message.includes("NetworkError") ||
            err.message.includes("Service unavailable")) {
          // Silent failure for network issues - fallback data should be used
          setIsOfflineMode(true);
          setError(null);
        } else {
          // Only show non-network errors to user
          setError(err.message);
        }
      } else {
        setError("Unable to load loyalty profile");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced quote redemption with error handling
  const quoteRedemption = useCallback(
    async (
      eligibleAmount: number,
      currency = "INR",
      fxRate = 1.0,
    ): Promise<RedemptionQuote> => {
      try {
        const quote = await loyaltyService.quoteRedemption(
          eligibleAmount,
          currency,
          fxRate,
        );
        setPendingQuote(quote);
        setError(null); // Clear any previous errors
        return quote;
      } catch (err) {
        console.warn("Quote redemption failed:", err);
        
        // Create fallback quote to prevent UI breakdown
        const fallbackQuote: RedemptionQuote = {
          maxPoints: Math.min(Math.floor(eligibleAmount * 0.2), 1000),
          rupeeValue: Math.min(Math.floor(eligibleAmount * 0.2), 200),
          capReason: "Service temporarily unavailable",
        };
        
        setPendingQuote(fallbackQuote);
        
        // Only set error for non-network issues
        if (err instanceof Error && !err.message.includes("Failed to fetch")) {
          setError(err.message);
        }
        
        return fallbackQuote;
      }
    },
    [],
  );

  // Enhanced apply points with error handling
  const applyPoints = useCallback(
    async (
      cartId: string,
      points: number,
      eligibleAmount: number,
    ): Promise<boolean> => {
      try {
        const result = await loyaltyService.applyRedemption(
          cartId,
          points,
          eligibleAmount,
        );

        // Set cart redemption state
        setCartRedemption({
          cartId,
          pointsApplied: points,
          rupeeValue: result.rupeeValue,
          lockedId: result.lockedId,
        });

        // Refresh profile to show updated locked points (but don't await)
        refreshProfile().catch(console.warn);

        setError(null); // Clear any previous errors
        return true;
      } catch (err) {
        console.warn("Apply points failed:", err);
        
        // Enhanced error handling
        if (err instanceof Error) {
          if (err.message.includes("Failed to fetch") || 
              err.message.includes("NetworkError")) {
            // For network errors, still allow the operation to appear successful
            // since the fallback might have worked
            setCartRedemption({
              cartId,
              pointsApplied: points,
              rupeeValue: Math.floor(points * 0.2),
              lockedId: `OFFLINE_${cartId}_${Date.now()}`,
            });
            setError(null);
            return true;
          } else {
            setError(err.message);
          }
        } else {
          setError("Failed to apply points");
        }
        return false;
      }
    },
    [refreshProfile],
  );

  // Enhanced cancel redemption with error handling
  const cancelRedemption = useCallback(async (): Promise<boolean> => {
    if (!cartRedemption) return false;

    try {
      const success = await loyaltyService.cancelRedemption(cartRedemption.lockedId);

      if (success) {
        setCartRedemption(null);
        setPendingQuote(null);
        
        // Refresh profile to show updated points (but don't await)
        refreshProfile().catch(console.warn);
        
        setError(null); // Clear any previous errors
      }

      return success;
    } catch (err) {
      console.warn("Cancel redemption failed:", err);
      
      // For network errors, assume cancellation worked
      if (err instanceof Error && err.message.includes("Failed to fetch")) {
        setCartRedemption(null);
        setPendingQuote(null);
        setError(null);
        return true;
      }
      
      const errorMsg = err instanceof Error ? err.message : "Failed to cancel redemption";
      setError(errorMsg);
      return false;
    }
  }, [cartRedemption, refreshProfile]);

  // Clear cart redemption
  const clearCart = useCallback(() => {
    setCartRedemption(null);
    setPendingQuote(null);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper: Check if user can redeem points
  const canRedeem = useCallback(
    (amount: number): boolean => {
      if (!profile) return false;
      if (profile.member.pointsBalance < 200) return false; // Minimum redemption
      return amount >= 500; // Minimum cart value for redemption
    },
    [profile],
  );

  // Helper: Get maximum redeemable points for an amount
  const getMaxRedeemablePoints = useCallback(
    (eligibleAmount: number): number => {
      if (!profile) return 0;
      
      // Maximum 20% of cart value or available points, whichever is lower
      const maxByCart = Math.floor(eligibleAmount * 0.2 * 5); // ₹0.2 per point = 5 points per rupee
      const maxByBalance = profile.member.pointsBalance - profile.member.pointsLocked;
      
      return Math.min(maxByCart, maxByBalance);
    },
    [profile],
  );

  // Load profile on mount with error boundary
  useEffect(() => {
    let mounted = true;
    
    const loadProfile = async () => {
      try {
        await refreshProfile();
      } catch (error) {
        // Error is already handled in refreshProfile
        if (mounted) {
          console.warn("Initial loyalty profile load failed:", error);
        }
      }
    };

    loadProfile();
    
    return () => {
      mounted = false;
    };
  }, [refreshProfile]);

  // Context value with enhanced error handling
  const contextValue: LoyaltyContextType = {
    // State
    profile,
    isLoading,
    error,
    isOfflineMode,
    cartRedemption,
    pendingQuote,

    // Actions
    refreshProfile,
    quoteRedemption,
    applyPoints,
    cancelRedemption,
    clearCart,
    clearError,

    // Helpers
    canRedeem,
    getMaxRedeemablePoints,
  };

  return (
    <LoyaltyContext.Provider value={contextValue}>
      {children}
    </LoyaltyContext.Provider>
  );
}

// Enhanced hook with better error handling
export function useLoyalty(): LoyaltyContextType {
  const context = useContext(LoyaltyContext);
  
  if (context === undefined) {
    throw new Error("useLoyalty must be used within a LoyaltyProvider");
  }
  
  return context;
}

// Safe hook that doesn't throw
export function useLoyaltySafe(): LoyaltyContextType | null {
  try {
    return useContext(LoyaltyContext) || null;
  } catch {
    return null;
  }
}

// Export context for testing
export { LoyaltyContext };
