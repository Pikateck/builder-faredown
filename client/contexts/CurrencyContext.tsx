import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate from INR
  flag: string;
  decimalPlaces: number;
}

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 1, flag: "🇮🇳", decimalPlaces: 0 },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 0.012, flag: "🇺🇸", decimalPlaces: 2 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.011, flag: "🇪🇺", decimalPlaces: 2 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.0095, flag: "🇬🇧", decimalPlaces: 2 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 0.044, flag: "🇦🇪", decimalPlaces: 2 },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", rate: 0.016, flag: "🇸🇬", decimalPlaces: 2 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 1.83, flag: "🇯🇵", decimalPlaces: 0 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 0.087, flag: "🇨🇳", decimalPlaces: 2 },
];

interface CurrencyContextType {
  selectedCurrency: Currency;
  currencies: Currency[];
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    CURRENCIES[3],
  ); // Default to INR

  const setCurrency = (currency: Currency) => {
    setSelectedCurrency(currency);
  };

  const convertPrice = (priceInUSD: number): number => {
    return priceInUSD * selectedCurrency.rate;
  };

  const formatPrice = (priceInUSD: number): string => {
    const convertedPrice = Math.round(convertPrice(priceInUSD));
    return `${selectedCurrency.symbol}${convertedPrice.toLocaleString()}`;
  };

  const value: CurrencyContextType = {
    selectedCurrency,
    currencies: CURRENCIES,
    setCurrency,
    convertPrice,
    formatPrice,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
