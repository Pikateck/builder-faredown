import { PriceSnapshot } from "@/contexts/PriceContext";

/**
 * Unified price calculation service
 * All pages must use these functions to ensure consistent rounding and computation
 */

export interface PriceComponents {
  basePrice: number; // Base room price for entire stay
  taxes: number;
  fees: number;
  markupHedge?: number;
  moduleMarkup?: number;
  promoDiscount?: number;
  bargainDiscount?: number;
  nights: number;
  currency: string;
  fxRate?: number; // For currency conversion
}

const ROUND_DECIMAL_PLACES = 2;

/**
 * Round a number to 2 decimal places (final rounding after all calculations)
 */
export function roundPrice(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate grand total from components
 * Order: base + taxes + fees + markups - discounts
 */
export function calculateGrandTotal(components: PriceComponents): number {
  const {
    basePrice,
    taxes,
    fees,
    markupHedge = 0,
    moduleMarkup = 0,
    promoDiscount = 0,
    bargainDiscount = 0,
  } = components;

  const subtotal = basePrice + taxes + fees + markupHedge + moduleMarkup;
  const totalDiscounts = promoDiscount + bargainDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscounts);

  return roundPrice(grandTotal);
}

/**
 * Calculate per-night price (for display purposes only)
 */
export function calculatePerNightPrice(
  components: PriceComponents,
  grandTotal: number,
): number {
  const { nights } = components;
  if (nights <= 0) return grandTotal;
  return roundPrice(grandTotal / nights);
}

/**
 * Create a price snapshot from raw data
 * This is the primary function to use when creating a new price snapshot
 */
export function createPriceSnapshot(
  roomKey: string,
  rateKey: string,
  supplierCode: string,
  checkInDate: string,
  checkOutDate: string,
  components: PriceComponents,
  refundability: "refundable" | "non-refundable",
  cancellationRules: string,
  roomType: string,
  mealPlan?: string,
  promoCode?: { code: string; discount: number },
  bargainData?: {
    originalTotal: number;
    bargainedTotal: number;
    round: number;
  },
): PriceSnapshot {
  const nights = components.nights;
  const grandTotal = calculateGrandTotal(components);

  const snapshot: PriceSnapshot = {
    roomKey,
    rateKey,
    supplierCode,
    checkInDate,
    checkOutDate,
    nights,
    base: roundPrice(components.basePrice),
    taxes: roundPrice(components.taxes),
    fees: roundPrice(components.fees),
    fxRate: components.fxRate || 1,
    markupHedge: roundPrice(components.markupHedge || 0),
    moduleMarkup: roundPrice(components.moduleMarkup || 0),
    discounts: roundPrice(
      (components.promoDiscount || 0) + (components.bargainDiscount || 0),
    ),
    promoApplied: promoCode
      ? {
          code: promoCode.code,
          discount: roundPrice(promoCode.discount),
          appliedAt: new Date().toISOString(),
        }
      : null,
    bargainApplied: bargainData
      ? {
          originalTotal: roundPrice(bargainData.originalTotal),
          bargainedTotal: roundPrice(bargainData.bargainedTotal),
          discount: roundPrice(
            bargainData.originalTotal - bargainData.bargainedTotal,
          ),
          round: bargainData.round,
          appliedAt: new Date().toISOString(),
        }
      : null,
    grandTotal,
    currency: components.currency,
    refundability,
    cancellationRules,
    roomType,
    mealPlan,
    checksum: "", // Will be calculated by context
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };

  return snapshot;
}

/**
 * Format price for display
 * e.g., "₹2,456" or "₹2,456 per night"
 */
export function formatPriceDisplay(
  amount: number,
  currency: string,
  perNight: boolean = false,
  nights: number = 1,
): string {
  const currencySymbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const symbol = currencySymbols[currency] || currency;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (perNight && nights > 0) {
    return `${symbol}${formatted} per night`;
  }
  return `${symbol}${formatted}`;
}

/**
 * Verify price integrity - check if a new total matches expected calculation
 * Used at Book/Invoice stage to prevent discrepancies
 */
export function verifyPriceIntegrity(
  snapshot: PriceSnapshot,
  recalculatedTotal: number,
): { isValid: boolean; drift: number } {
  const drift = Math.abs(snapshot.grandTotal - recalculatedTotal);
  const isValid = drift < 0.01; // Allow 1 paisa drift due to rounding

  if (!isValid) {
    console.error("[PRICE_PIPELINE] Price drift detected:", {
      original: snapshot.grandTotal,
      recalculated: recalculatedTotal,
      drift,
      roomKey: snapshot.roomKey,
    });
  }

  return { isValid, drift };
}

/**
 * Log price pipeline for debugging
 */
export function logPricePipeline(
  stage: "SEARCH" | "DETAILS" | "BARGAIN" | "BOOK" | "INVOICE",
  snapshot: PriceSnapshot,
): void {
  const perNight =
    snapshot.nights > 0
      ? roundPrice(snapshot.grandTotal / snapshot.nights)
      : snapshot.grandTotal;

  console.log(`[PRICE_PIPELINE] ${stage}:`, {
    roomKey: snapshot.roomKey,
    rateKey: snapshot.rateKey,
    supplier: snapshot.supplierCode,
    nights: snapshot.nights,
    basePrice: snapshot.base,
    taxes: snapshot.taxes,
    fees: snapshot.fees,
    markups: snapshot.markupHedge + snapshot.moduleMarkup,
    totalDiscounts: snapshot.discounts,
    promoApplied: snapshot.promoApplied?.code || null,
    bargainRound: snapshot.bargainApplied?.round || null,
    grandTotal: snapshot.grandTotal,
    perNight,
    currency: snapshot.currency,
    checksum: snapshot.checksum,
    refundability: snapshot.refundability,
  });
}
