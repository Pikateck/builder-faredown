import { createContext, useContext, useState, ReactNode } from "react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate to USD
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.85 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.73 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 82.5 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.35 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.52 },
];

interface CurrencyContextType {
  currentCurrency: Currency;
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
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(
    CURRENCIES[0],
  ); // Default to USD

  const setCurrency = (currency: Currency) => {
    setCurrentCurrency(currency);
  };

  const convertPrice = (priceInUSD: number): number => {
    return priceInUSD * currentCurrency.rate;
  };

  const formatPrice = (priceInUSD: number): string => {
    const convertedPrice = convertPrice(priceInUSD);
    return `${currentCurrency.symbol}${convertedPrice.toFixed(2)}`;
  };

  const value: CurrencyContextType = {
    currentCurrency,
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
