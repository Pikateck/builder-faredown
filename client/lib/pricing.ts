import { Currency, CURRENCIES } from "@/contexts/CurrencyContext";

export interface PriceBreakdown {
  basePrice: number;
  taxes: number;
  fees: number;
  total: number;
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function calculateTotalPrice(
  basePricePerNight: number,
  nights: number,
  rooms: number = 1,
  extraFees: number = 0,
): PriceBreakdown {
  const basePrice = basePricePerNight * nights * rooms;
  const taxes = basePrice * 0.12; // 12% tax rate
  const fees = 25 * rooms + extraFees; // $25 booking fee per room + extra fees
  const total = basePrice + taxes + fees;

  return {
    basePrice,
    taxes,
    fees,
    total,
  };
}

export function formatPriceWithSymbol(
  priceInUSD: number,
  currencyOrCode: Currency | string,
): string {
  // Handle both Currency object and currency code string
  let currency: Currency;

  if (typeof currencyOrCode === "string") {
    // Find currency by code
    const foundCurrency = CURRENCIES.find((c) => c.code === currencyOrCode);
    currency = foundCurrency || CURRENCIES[0]; // Default to USD if not found
  } else {
    currency = currencyOrCode;
  }

  const convertedPrice = Math.round(priceInUSD * currency.rate);
  return `${currency.symbol}${convertedPrice.toLocaleString()}`;
}

export function formatPrice(
  priceInUSD: number,
  currencyCode: string = "USD",
): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  });
  return formatter.format(priceInUSD);
}

export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercentage: number,
): number {
  return originalPrice * (1 - discountPercentage / 100);
}

export function calculateBargainPrice(
  originalPrice: number,
  bargainPercentage: number,
): number {
  const maxDiscount = 0.3; // Maximum 30% discount through bargaining
  const actualDiscount = Math.min(bargainPercentage / 100, maxDiscount);
  return originalPrice * (1 - actualDiscount);
}

export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  currency: Currency,
): string {
  const minFormatted = formatPriceWithSymbol(minPrice, currency);
  const maxFormatted = formatPriceWithSymbol(maxPrice, currency);
  return `${minFormatted} - ${maxFormatted}`;
}

export function calculatePricePerNight(
  totalPrice: number,
  nights: number,
  rooms: number = 1,
): number {
  return totalPrice / (nights * rooms);
}
