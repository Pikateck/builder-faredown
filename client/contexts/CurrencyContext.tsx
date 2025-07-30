import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate from INR
  flag: string;
  decimalPlaces: number;
}

export const CURRENCIES: Currency[] = [
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    rate: 1,
    flag: "🇮🇳",
    decimalPlaces: 0,
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rate: 0.012,
    flag: "🇺🇸",
    decimalPlaces: 2,
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rate: 0.011,
    flag: "🇪🇺",
    decimalPlaces: 2,
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rate: 0.0095,
    flag: "🇬🇧",
    decimalPlaces: 2,
  },
  {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    rate: 0.044,
    flag: "🇦🇪",
    decimalPlaces: 2,
  },
  {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    rate: 0.016,
    flag: "🇸🇬",
    decimalPlaces: 2,
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    rate: 1.83,
    flag: "🇯🇵",
    decimalPlaces: 0,
  },
  {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    rate: 0.087,
    flag: "🇨🇳",
    decimalPlaces: 2,
  },
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

    // Try to refresh rates, but don't block the app if it fails
    try {
      refreshRates().catch((error) => {
        console.log("💰 Initial currency rate fetch failed, using static rates:", error?.message || 'Unknown error');
      });
    } catch (syncError) {
      console.log("💰 Currency rate refresh setup failed, using static rates:", syncError?.message || 'Unknown error');
    }

    // Update rates every 30 minutes (reduced frequency to prevent spam)
    const interval = setInterval(
      () => {
        try {
          refreshRates().catch((error) => {
            // Silent fail for periodic updates
            console.log("💰 Periodic currency rate update failed:", error?.message || 'Unknown error');
          });
        } catch (syncError) {
          console.log("💰 Periodic currency rate update setup failed:", syncError?.message || 'Unknown error');
        }
      },
      30 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  const loadUserPreference = () => {
    const savedCurrency = localStorage.getItem("preferred_currency");
    if (savedCurrency) {
      const currency = currencies.find((c) => c.code === savedCurrency);
      if (currency) {
        setSelectedCurrency(currency);
      }
    }
  };

  const setCurrency = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem("preferred_currency", currency.code);
  };

  const refreshRates = async () => {
    try {
      setIsLoading(true);

      // Early exit if fetch is not available (shouldn't happen in modern browsers)
      if (typeof fetch === 'undefined') {
        console.log("💰 Fetch API not available, using static rates");
        return;
      }

      // Check if the API endpoint is available
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch("/api/currency/rates", {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }).catch((fetchError) => {
        // Catch any network errors immediately
        throw new Error(`Network error: ${fetchError.message}`);
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const updatedCurrencies = currencies.map((currency) => {
          if (currency.code === "INR") return currency; // INR is base currency

          const rateData = data.data.find((r: any) => r.to === currency.code);
          if (rateData) {
            return { ...currency, rate: rateData.rate };
          }
          return currency;
        });

        setCurrencies(updatedCurrencies);
        setLastUpdated(data.lastUpdated);

        // Update selected currency if it was updated
        const updatedSelected = updatedCurrencies.find(
          (c) => c.code === selectedCurrency.code,
        );
        if (updatedSelected) {
          setSelectedCurrency(updatedSelected);
        }

        console.log(`💱 Exchange rates updated from ${data.source}`);
      } else {
        console.warn(
          "📈 Exchange rate API returned invalid data, using static rates",
        );
      }
    } catch (error) {
      // Graceful fallback - don't show error to user, just log it
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.warn("📈 Exchange rate fetch timeout, using static rates");
        } else if (error.message.includes("Failed to fetch")) {
          console.warn("📈 Exchange rate API unavailable, using static rates");
        } else {
          console.warn("📈 Exchange rate fetch failed:", error.message);
        }
      } else {
        console.warn("📈 Exchange rate fetch failed with unknown error");
      }

      // Continue with static rates - don't break the app
      console.log("💰 Using static exchange rates for currency conversion");
    } finally {
      setIsLoading(false);
    }
  };

  const convertPrice = (priceInINR: number): number => {
    if (selectedCurrency.code === "INR") return priceInINR;
    return priceInINR * selectedCurrency.rate;
  };

  const formatPrice = (priceInINR: number): string => {
    const convertedPrice = convertPrice(priceInINR);

    if (selectedCurrency.code === "INR") {
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
      return `₹${roundedAmount.toLocaleString("en-IN")}`;
    }
  };

  const value: CurrencyContextType = {
    selectedCurrency,
    currencies,
    setCurrency,
    convertPrice,
    formatPrice,
    isLoading,
    lastUpdated,
    refreshRates,
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
