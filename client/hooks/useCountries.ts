import { useEffect, useState, useCallback, useMemo } from "react";

export type CountryOption = {
  iso2: string;
  display_name: string;
  iso3_code?: string;
  continent?: string;
  currency_code?: string;
  phone_prefix?: string;
  flag_emoji?: string;
  popular?: boolean;
};

export type CountriesResponse = {
  success: boolean;
  count: number;
  countries: CountryOption[];
};

export type UseCountriesOptions = {
  /**
   * Whether to fetch only popular countries initially
   * @default false
   */
  popularOnly?: boolean;

  /**
   * Whether to auto-fetch on mount
   * @default true
   */
  autoFetch?: boolean;

  /**
   * Cache duration in milliseconds
   * @default 30 minutes
   */
  cacheDuration?: number;
};

type CacheEntry = {
  data: CountryOption[];
  timestamp: number;
  popularOnly: boolean;
};

// In-memory cache to avoid repeated API calls
const cache = new Map<string, CacheEntry>();

export function useCountries(options: UseCountriesOptions = {}) {
  const {
    popularOnly = false,
    autoFetch = true,
    cacheDuration = 30 * 60 * 1000, // 30 minutes
  } = options;

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate cache key
  const cacheKey = popularOnly ? "popular" : "all";

  // Check cache validity
  const getCachedData = useCallback((): CountryOption[] | null => {
    const cached = cache.get(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cacheDuration;
    if (isExpired) {
      cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }, [cacheKey, cacheDuration]);

  // Fetch countries from API
  const fetchCountries = useCallback(
    async (forceRefresh = false): Promise<CountryOption[]> => {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = getCachedData();
        if (cached) {
          return cached;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const endpoint = popularOnly
          ? "/api/countries/popular"
          : "/api/countries";
        const response = await fetch(endpoint, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          // If rate limited, use fallback data immediately
          if (response.status === 429) {
            console.warn('Countries API rate limited, using fallback data');
            const fallbackData = getFallbackCountries(popularOnly);
            // Cache the fallback data temporarily
            cache.set(cacheKey, {
              data: fallbackData,
              timestamp: Date.now(),
              popularOnly,
            });
            return fallbackData;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: CountriesResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch countries");
        }

        // Cache the result
        cache.set(cacheKey, {
          data: data.countries,
          timestamp: Date.now(),
          popularOnly,
        });

        return data.countries;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        console.error("Failed to fetch countries:", errorMessage);

        setError(errorMessage);

        // Return fallback data for critical countries
        return getFallbackCountries(popularOnly);
      } finally {
        setLoading(false);
      }
    },
    [popularOnly, cacheKey, getCachedData],
  );

  // Search countries
  const searchCountries = useCallback(
    async (query: string): Promise<CountryOption[]> => {
      if (!query.trim()) {
        return countries;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/countries/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to search countries");
        }

        return data.countries;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Search failed";
        console.error("Failed to search countries:", errorMessage);
        setError(errorMessage);

        // Fallback to client-side filtering
        const searchTerm = query.toLowerCase();
        return countries.filter(
          (country) =>
            country.display_name.toLowerCase().includes(searchTerm) ||
            country.iso2.toLowerCase().includes(searchTerm) ||
            (country.iso3_code &&
              country.iso3_code.toLowerCase().includes(searchTerm)),
        );
      } finally {
        setLoading(false);
      }
    },
    [countries],
  );

  // Refresh countries data
  const refresh = useCallback(async () => {
    const data = await fetchCountries(true);
    setCountries(data);
  }, [fetchCountries]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchCountries().then(setCountries);
    }
  }, [autoFetch, fetchCountries]);

  // Memoized popular countries
  const popularCountries = useMemo(() => {
    return countries.filter((country) => country.popular);
  }, [countries]);

  // Memoized countries by continent
  const countriesByContinent = useMemo(() => {
    const grouped: Record<string, CountryOption[]> = {};
    countries.forEach((country) => {
      const continent = country.continent || "Other";
      if (!grouped[continent]) {
        grouped[continent] = [];
      }
      grouped[continent].push(country);
    });

    // Sort countries within each continent
    Object.keys(grouped).forEach((continent) => {
      grouped[continent].sort((a, b) =>
        a.display_name.localeCompare(b.display_name),
      );
    });

    return grouped;
  }, [countries]);

  // Find country by code
  const findCountry = useCallback(
    (code: string): CountryOption | undefined => {
      return countries.find(
        (country) =>
          country.iso2.toLowerCase() === code.toLowerCase() ||
          (country.iso3_code &&
            country.iso3_code.toLowerCase() === code.toLowerCase()),
      );
    },
    [countries],
  );

  return {
    countries,
    popularCountries,
    countriesByContinent,
    loading,
    error,
    searchCountries,
    findCountry,
    refresh,
    // Utility functions
    isLoading: loading,
    hasError: !!error,
    isEmpty: countries.length === 0,
    count: countries.length,
  };
}

// Fallback countries for offline/error scenarios
function getFallbackCountries(popularOnly: boolean): CountryOption[] {
  const fallbackCountries: CountryOption[] = [
    {
      iso2: "IN",
      display_name: "India",
      iso3_code: "IND",
      currency_code: "INR",
      flag_emoji: "🇮🇳",
      popular: true,
    },
    {
      iso2: "AE",
      display_name: "United Arab Emirates",
      iso3_code: "ARE",
      currency_code: "AED",
      flag_emoji: "🇦🇪",
      popular: true,
    },
    {
      iso2: "US",
      display_name: "United States",
      iso3_code: "USA",
      currency_code: "USD",
      flag_emoji: "🇺🇸",
      popular: true,
    },
    {
      iso2: "GB",
      display_name: "United Kingdom",
      iso3_code: "GBR",
      currency_code: "GBP",
      flag_emoji: "🇬🇧",
      popular: true,
    },
    {
      iso2: "SG",
      display_name: "Singapore",
      iso3_code: "SGP",
      currency_code: "SGD",
      flag_emoji: "🇸🇬",
      popular: true,
    },
    {
      iso2: "SA",
      display_name: "Saudi Arabia",
      iso3_code: "SAU",
      currency_code: "SAR",
      flag_emoji: "🇸🇦",
      popular: true,
    },
    {
      iso2: "TH",
      display_name: "Thailand",
      iso3_code: "THA",
      currency_code: "THB",
      flag_emoji: "🇹🇭",
      popular: true,
    },
  ];

  if (popularOnly) {
    return fallbackCountries.filter((country) => country.popular);
  }

  // Add more fallback countries for complete list
  return [
    ...fallbackCountries,
    {
      iso2: "AU",
      display_name: "Australia",
      iso3_code: "AUS",
      currency_code: "AUD",
      flag_emoji: "🇦🇺",
      popular: false,
    },
    {
      iso2: "CA",
      display_name: "Canada",
      iso3_code: "CAN",
      currency_code: "CAD",
      flag_emoji: "🇨🇦",
      popular: false,
    },
    {
      iso2: "DE",
      display_name: "Germany",
      iso3_code: "DEU",
      currency_code: "EUR",
      flag_emoji: "🇩🇪",
      popular: false,
    },
    {
      iso2: "FR",
      display_name: "France",
      iso3_code: "FRA",
      currency_code: "EUR",
      flag_emoji: "🇫🇷",
      popular: false,
    },
    {
      iso2: "JP",
      display_name: "Japan",
      iso3_code: "JPN",
      currency_code: "JPY",
      flag_emoji: "🇯🇵",
      popular: false,
    },
    {
      iso2: "KR",
      display_name: "South Korea",
      iso3_code: "KOR",
      currency_code: "KRW",
      flag_emoji: "🇰🇷",
      popular: false,
    },
    {
      iso2: "NL",
      display_name: "Netherlands",
      iso3_code: "NLD",
      currency_code: "EUR",
      flag_emoji: "🇳🇱",
      popular: false,
    },
    {
      iso2: "CH",
      display_name: "Switzerland",
      iso3_code: "CHE",
      currency_code: "CHF",
      flag_emoji: "🇨🇭",
      popular: false,
    },
  ];
}

export default useCountries;
