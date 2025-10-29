import React, { createContext, useContext, useState, useCallback } from "react";

export interface PriceSnapshot {
  // Identifiers
  roomKey: string; // Unique room identifier (e.g., "room-001-standard")
  rateKey: string; // Supplier rate key (e.g., "tbo-rate-123" or "mock-rate")
  supplierCode: string; // Supplier (TBO, HOTELBEDS, RATEHAWK, MOCK)

  // Duration
  checkInDate: string; // ISO date
  checkOutDate: string; // ISO date
  nights: number;

  // Pricing breakdown
  base: number; // Base room price for entire stay
  taxes: number;
  fees: number;
  fxRate: number; // If currency conversion applied
  markupHedge: number; // Hedge markup amount
  moduleMarkup: number; // Module-level markup amount
  discounts: number; // Any applied discounts

  // Modifiers
  promoApplied: {
    code: string;
    discount: number;
    appliedAt: string; // ISO timestamp
  } | null;
  bargainApplied: {
    originalTotal: number;
    bargainedTotal: number;
    discount: number;
    round: number; // Bargain round (1, 2, or 3)
    appliedAt: string; // ISO timestamp
  } | null;

  // Final total
  grandTotal: number;
  currency: string; // ISO currency code (INR, USD, etc.)

  // Room details
  refundability: "refundable" | "non-refundable";
  cancellationRules: string;
  roomType: string;
  mealPlan?: string;

  // Checksum for drift detection
  checksum: string; // SHA256 hash of critical fields

  // Metadata
  createdAt: string; // ISO timestamp when snapshot was created
  lastUpdatedAt: string; // ISO timestamp of last update
}

interface PriceContextType {
  priceSnapshot: PriceSnapshot | null;
  setPriceSnapshot: (snapshot: PriceSnapshot | null) => void;
  updatePrice: (updates: Partial<PriceSnapshot>) => void;
  calculateChecksum: (snapshot: PriceSnapshot) => string;
  verifyChecksum: (snapshot: PriceSnapshot) => boolean;
  clearPrice: () => void;
  hasPrice: () => boolean;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const [priceSnapshot, setPriceSnapshot] = useState<PriceSnapshot | null>(
    null,
  );

  const calculateChecksum = useCallback((snapshot: PriceSnapshot): string => {
    // Create a checksum from critical fields that should not change
    const criticalData = [
      snapshot.roomKey,
      snapshot.rateKey,
      snapshot.supplierCode,
      snapshot.nights,
      snapshot.grandTotal,
      snapshot.currency,
    ].join("|");

    // Simple hash (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < criticalData.length; i++) {
      const char = criticalData.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }, []);

  const verifyChecksum = useCallback(
    (snapshot: PriceSnapshot): boolean => {
      return calculateChecksum(snapshot) === snapshot.checksum;
    },
    [calculateChecksum],
  );

  const updatePrice = useCallback(
    (updates: Partial<PriceSnapshot>) => {
      setPriceSnapshot((prev) => {
        if (!prev) return null;

        // Recalculate grandTotal if base components changed
        let newSnapshot = { ...prev, ...updates };

        if (
          updates.base ||
          updates.taxes ||
          updates.fees ||
          updates.markupHedge ||
          updates.moduleMarkup ||
          updates.discounts
        ) {
          const subtotal =
            (newSnapshot.base || prev.base) +
            (newSnapshot.taxes || prev.taxes) +
            (newSnapshot.fees || prev.fees) +
            (newSnapshot.markupHedge || prev.markupHedge) +
            (newSnapshot.moduleMarkup || prev.moduleMarkup) -
            (newSnapshot.discounts || prev.discounts);

          const promoDiscount = newSnapshot.promoApplied?.discount || 0;
          const bargainDiscount = newSnapshot.bargainApplied?.discount || 0;

          newSnapshot.grandTotal = Math.max(
            0,
            subtotal - promoDiscount - bargainDiscount,
          );
        }

        // Update checksum and timestamp
        newSnapshot.checksum = calculateChecksum(newSnapshot);
        newSnapshot.lastUpdatedAt = new Date().toISOString();

        console.log("[PRICE_PIPELINE] Updated price snapshot:", {
          roomKey: newSnapshot.roomKey,
          rateKey: newSnapshot.rateKey,
          grandTotal: newSnapshot.grandTotal,
          checksum: newSnapshot.checksum,
          updatedFields: Object.keys(updates),
        });

        return newSnapshot;
      });
    },
    [calculateChecksum],
  );

  const clearPrice = useCallback(() => {
    setPriceSnapshot(null);
  }, []);

  const hasPrice = useCallback(() => {
    return priceSnapshot !== null;
  }, [priceSnapshot]);

  return (
    <PriceContext.Provider
      value={{
        priceSnapshot,
        setPriceSnapshot,
        updatePrice,
        calculateChecksum,
        verifyChecksum,
        clearPrice,
        hasPrice,
      }}
    >
      {children}
    </PriceContext.Provider>
  );
}

export function usePriceContext(): PriceContextType {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error("usePriceContext must be used within PriceProvider");
  }
  return context;
}
