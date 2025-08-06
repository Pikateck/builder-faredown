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
    // Wrap everything in a try-catch to prevent provider failure
    try {
      loadUserPreference();

      // Try to refresh rates, but don't block the app if it fails
      setTimeout(() => {
        try {
          refreshRates().catch((error) => {
            console.log(
              "💰 Initial currency rate fetch failed, using static rates:",
              error?.message || "Unknown error",
            );
          });
        } catch (syncError) {
          console.log(
            "💰 Currency rate refresh setup failed, using static rates:",
            syncError?.message || "Unknown error",
          );
        }
      }, 100); // Delay to ensure provider is fully initialized

      // Update rates every 30 minutes (reduced frequency to prevent spam)
      const interval = setInterval(
        () => {
          try {
            refreshRates().catch((error) => {
              // Silent fail for periodic updates
              console.log(
                "💰 Periodic currency rate update failed:",
                error?.message || "Unknown error",
              );
            });
          } catch (syncError) {
            console.log(
              "💰 Periodic currency rate update setup failed:",
              syncError?.message || "Unknown error",
            );
          }
        },
        30 * 60 * 1000,
      );

      return () => clearInterval(interval);
    } catch (globalError) {
      console.error("💰 CurrencyProvider useEffect failed:", globalError);
      // Don't throw - just log and continue with static rates
    }
  }, []);

  const loadUserPreference = () => {
    try {
      const savedCurrency = localStorage.getItem("preferred_currency");
      if (savedCurrency) {
        setCurrencies((currentCurrencies) => {
          const currency = currentCurrencies.find(
            (c) => c.code === savedCurrency,
          );
          if (currency) {
            setSelectedCurrency(currency);
          }
          return currentCurrencies;
        });
      }
    } catch (error) {
      console.log("💰 Failed to load currency preference:", error);
    }
  };

  const setCurrency = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem("preferred_currency", currency.code);
  };

  const refreshRates = async () => {
    try {
      // Additional safety wrapper to prevent any unhandled errors
      await _refreshRatesInternal();
    } catch (error) {
      // Final safety net - never let errors escape from refreshRates
      console.warn("📈 Currency refresh failed with unexpected error:", error);
    }
  };

  const _refreshRatesInternal = async () => {
    try {
      setIsLoading(true);

      // Early exit if fetch is not available (shouldn't happen in modern browsers)
      if (typeof fetch === "undefined") {
        console.log("💰 Fetch API not available, using static rates");
        return;
      }

      // Ensure currencies state is available
      if (!currencies || currencies.length === 0) {
        console.log("💰 Currencies not loaded yet, skipping rate refresh");
        return;
      }

      // Check if the API endpoint is available
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      let response;
      try {
        response = await fetch("/api/currency/rates", {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
      } catch (fetchError: any) {
        // Catch any network errors immediately and handle gracefully
        console.warn(
          "📈 Network error fetching exchange rates:",
          fetchError?.message || "Unknown error",
        );
        throw new Error(
          `Network error: ${fetchError?.message || "Failed to fetch"}`,
        );
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setCurrencies((currentCurrencies) => {
          const updatedCurrencies = currentCurrencies.map((currency) => {
            if (currency.code === "INR") return currency; // INR is base currency

            const rateData = data.data.find((r: any) => r.to === currency.code);
            if (rateData) {
              return { ...currency, rate: rateData.rate };
            }
            return currency;
          });

          // Update selected currency if it was updated
          setSelectedCurrency((currentSelected) => {
            const updatedSelected = updatedCurrencies.find(
              (c) => c.code === currentSelected.code,
            );
            return updatedSelected || currentSelected;
          });

          return updatedCurrencies;
        });

        setLastUpdated(data.lastUpdated);

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
    // Provide a more descriptive error message and ensure it's not a timing issue
    console.error(
      "❌ CurrencyContext is undefined. This usually means either:",
      "\n1. useCurrency hook is called outside of CurrencyProvider",
      "\n2. CurrencyProvider failed to initialize properly",
      "\n3. There's a circular dependency or timing issue",
    );

    // Return a fallback context to prevent app crashes
    console.warn("⚠️ Using fallback currency context with INR defaults");
    return {
      selectedCurrency: CURRENCIES[0], // INR
      currencies: CURRENCIES,
      setCurrency: () =>
        console.warn("Currency change attempted outside provider"),
      convertPrice: (price: number) => price,
      formatPrice: (price: number) => `₹${price.toLocaleString("en-IN")}`,
      isLoading: false,
      lastUpdated: null,
      refreshRates: async () =>
        console.warn("Rate refresh attempted outside provider"),
    };
  }
  return context;
}
