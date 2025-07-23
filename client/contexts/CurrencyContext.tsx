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
  convertPrice: (priceInINR: number) => number;
  formatPrice: (priceInINR: number) => string;
  isLoading: boolean;
  lastUpdated: string | null;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    CURRENCIES[0], // Default to INR (index 0)
  );
  const [currencies, setCurrencies] = useState<Currency[]>(CURRENCIES);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load user preference and live rates on mount
  useEffect(() => {
    loadUserPreference();
    refreshRates();

    // Update rates every 15 minutes
    const interval = setInterval(refreshRates, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUserPreference = () => {
    const savedCurrency = localStorage.getItem('preferred_currency');
    if (savedCurrency) {
      const currency = currencies.find(c => c.code === savedCurrency);
      if (currency) {
        setSelectedCurrency(currency);
      }
    }
  };

  const setCurrency = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem('preferred_currency', currency.code);
  };

  const refreshRates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/currency/rates');
      const data = await response.json();

      if (data.success && data.data) {
        const updatedCurrencies = currencies.map(currency => {
          if (currency.code === 'INR') return currency; // INR is base currency

          const rateData = data.data.find((r: any) => r.to === currency.code);
          if (rateData) {
            return { ...currency, rate: rateData.rate };
          }
          return currency;
        });

        setCurrencies(updatedCurrencies);
        setLastUpdated(data.lastUpdated);

        // Update selected currency if it was updated
        const updatedSelected = updatedCurrencies.find(c => c.code === selectedCurrency.code);
        if (updatedSelected) {
          setSelectedCurrency(updatedSelected);
        }

        console.log(`💱 Exchange rates updated from ${data.source}`);
      }
    } catch (error) {
      console.error('Failed to refresh exchange rates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const convertPrice = (priceInINR: number): number => {
    if (selectedCurrency.code === 'INR') return priceInINR;
    return priceInINR * selectedCurrency.rate;
  };

  const formatPrice = (priceInINR: number): string => {
    const convertedPrice = convertPrice(priceInINR);

    if (selectedCurrency.code === 'INR') {
      return formatINR(convertedPrice);
    }

    const formatted = convertedPrice.toFixed(selectedCurrency.decimalPlaces);
    return `${selectedCurrency.symbol}${formatted}`;
  };

  const formatINR = (amount: number): string => {
    const roundedAmount = Math.round(amount);

    if (roundedAmount >= 10000000) {
      const crores = roundedAmount / 10000000;
      return `₹${crores.toFixed(2)} Cr`;
    } else if (roundedAmount >= 100000) {
      const lakhs = roundedAmount / 100000;
      return `₹${lakhs.toFixed(2)} L`;
    } else {
      return `₹${roundedAmount.toLocaleString('en-IN')}`;
    }
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
