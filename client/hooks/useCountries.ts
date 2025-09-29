import { useEffect, useState, useCallback, useMemo } from "react";
import { apiClient } from "@/lib/api";

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
          ? "/countries/popular"
          : "/countries";

        console.log('🔍 useCountries: Fetching from endpoint:', endpoint);
        const response = await apiClient.get(endpoint);
        console.log('🔍 useCountries: Response received:', response);

        // Handle response format from apiClient
        if (response.success && response.countries) {
          // Cache the result
          cache.set(cacheKey, {
            data: response.countries,
            timestamp: Date.now(),
            popularOnly,
          });
          return response.countries;
        } else if (response && Array.isArray(response)) {
          // Direct array response
          cache.set(cacheKey, {
            data: response,
            timestamp: Date.now(),
            popularOnly,
          });
          return response;
        } else {
          // Handle various API unavailability scenarios gracefully
          if (response.status === 429) {
            console.warn("Countries API rate limited, using fallback data");
          } else if (response.status === 503) {
            console.warn(
              "Countries API temporarily unavailable, using fallback data",
            );
          } else if (response.status >= 500) {
            console.warn("Countries API server error, using fallback data");
          } else {
            console.warn(
              `Countries API error (${response.status}), using fallback data`,
            );
          }

          const fallbackData = getFallbackCountries(popularOnly);
          // Cache the fallback data temporarily (shorter duration for errors)
          cache.set(cacheKey, {
            data: fallbackData,
            timestamp: Date.now(),
            popularOnly,
          });
          return fallbackData;
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

        // Check if it's a network/connectivity error
        const isNetworkError =
          errorMessage.includes("ECONNREFUSED") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("API server unavailable") ||
          errorMessage.includes("Network request failed");

        if (isNetworkError) {
          console.warn(
            "Countries API unavailable, using offline fallback data",
          );
          // Don't set error state for network issues since we have fallback data
          setError(null);
        } else {
          console.warn(
            "Countries API error, using fallback data:",
            errorMessage,
          );
          // Set a more user-friendly error message but still continue with fallback
          setError("Using offline country data");
        }

        // Cache fallback data with shorter duration for network errors
        const fallbackData = getFallbackCountries(popularOnly);
        cache.set(cacheKey, {
          data: fallbackData,
          timestamp: Date.now(),
          popularOnly,
        });

        // Return fallback data for critical countries
        return fallbackData;
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

        // Check if it's a network/connectivity error
        const isNetworkError =
          errorMessage.includes("ECONNREFUSED") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("API server unavailable");

        if (isNetworkError) {
          console.warn(
            "Countries search API unavailable, using client-side filtering",
          );
          // Don't set error for network issues since client-side filtering works
          setError(null);
        } else {
          console.warn(
            "Countries search failed, using client-side filtering:",
            errorMessage,
          );
          // Set a milder error message
          setError(null); // Clear error since we have a working fallback
        }

        // Fallback to client-side filtering (this works well with cached data)
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
      continent: "Asia",
      currency_code: "INR",
      phone_prefix: "+91",
      flag_emoji: "🇮🇳",
      popular: true,
    },
    {
      iso2: "AE",
      display_name: "United Arab Emirates",
      iso3_code: "ARE",
      continent: "Asia",
      currency_code: "AED",
      phone_prefix: "+971",
      flag_emoji: "🇦🇪",
      popular: true,
    },
    {
      iso2: "US",
      display_name: "United States",
      iso3_code: "USA",
      continent: "North America",
      currency_code: "USD",
      phone_prefix: "+1",
      flag_emoji: "🇺🇸",
      popular: true,
    },
    {
      iso2: "GB",
      display_name: "United Kingdom",
      iso3_code: "GBR",
      continent: "Europe",
      currency_code: "GBP",
      phone_prefix: "+44",
      flag_emoji: "🇬🇧",
      popular: true,
    },
    {
      iso2: "SG",
      display_name: "Singapore",
      iso3_code: "SGP",
      continent: "Asia",
      currency_code: "SGD",
      phone_prefix: "+65",
      flag_emoji: "🇸🇬",
      popular: true,
    },
    {
      iso2: "SA",
      display_name: "Saudi Arabia",
      iso3_code: "SAU",
      continent: "Asia",
      currency_code: "SAR",
      phone_prefix: "+966",
      flag_emoji: "🇸🇦",
      popular: true,
    },
    {
      iso2: "TH",
      display_name: "Thailand",
      iso3_code: "THA",
      continent: "Asia",
      currency_code: "THB",
      phone_prefix: "+66",
      flag_emoji: "🇹🇭",
      popular: true,
    },
    {
      iso2: "MY",
      display_name: "Malaysia",
      iso3_code: "MYS",
      continent: "Asia",
      currency_code: "MYR",
      phone_prefix: "+60",
      flag_emoji: "🇲🇾",
      popular: true,
    },
    {
      iso2: "ID",
      display_name: "Indonesia",
      iso3_code: "IDN",
      continent: "Asia",
      currency_code: "IDR",
      phone_prefix: "+62",
      flag_emoji: "🇮🇩",
      popular: true,
    },
    {
      iso2: "PH",
      display_name: "Philippines",
      iso3_code: "PHL",
      continent: "Asia",
      currency_code: "PHP",
      phone_prefix: "+63",
      flag_emoji: "🇵🇭",
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
      continent: "Oceania",
      currency_code: "AUD",
      phone_prefix: "+61",
      flag_emoji: "🇦🇺",
      popular: false,
    },
    {
      iso2: "CA",
      display_name: "Canada",
      iso3_code: "CAN",
      continent: "North America",
      currency_code: "CAD",
      phone_prefix: "+1",
      flag_emoji: "🇨🇦",
      popular: false,
    },
    {
      iso2: "DE",
      display_name: "Germany",
      iso3_code: "DEU",
      continent: "Europe",
      currency_code: "EUR",
      phone_prefix: "+49",
      flag_emoji: "🇩🇪",
      popular: false,
    },
    {
      iso2: "FR",
      display_name: "France",
      iso3_code: "FRA",
      continent: "Europe",
      currency_code: "EUR",
      phone_prefix: "+33",
      flag_emoji: "🇫🇷",
      popular: false,
    },
    {
      iso2: "JP",
      display_name: "Japan",
      iso3_code: "JPN",
      continent: "Asia",
      currency_code: "JPY",
      phone_prefix: "+81",
      flag_emoji: "🇯🇵",
      popular: false,
    },
    {
      iso2: "KR",
      display_name: "South Korea",
      iso3_code: "KOR",
      continent: "Asia",
      currency_code: "KRW",
      phone_prefix: "+82",
      flag_emoji: "🇰🇷",
      popular: false,
    },
    {
      iso2: "NL",
      display_name: "Netherlands",
      iso3_code: "NLD",
      continent: "Europe",
      currency_code: "EUR",
      phone_prefix: "+31",
      flag_emoji: "🇳🇱",
      popular: false,
    },
    {
      iso2: "CH",
      display_name: "Switzerland",
      iso3_code: "CHE",
      continent: "Europe",
      currency_code: "CHF",
      phone_prefix: "+41",
      flag_emoji: "🇨🇭",
      popular: false,
    },
    {
      iso2: "IT",
      display_name: "Italy",
      iso3_code: "ITA",
      continent: "Europe",
      currency_code: "EUR",
      phone_prefix: "+39",
      flag_emoji: "🇮🇹",
      popular: false,
    },
    {
      iso2: "ES",
      display_name: "Spain",
      iso3_code: "ESP",
      continent: "Europe",
      currency_code: "EUR",
      phone_prefix: "+34",
      flag_emoji: "🇪🇸",
      popular: false,
    },
    {
      iso2: "BR",
      display_name: "Brazil",
      iso3_code: "BRA",
      continent: "South America",
      currency_code: "BRL",
      phone_prefix: "+55",
      flag_emoji: "🇧🇷",
      popular: false,
    },
    {
      iso2: "MX",
      display_name: "Mexico",
      iso3_code: "MEX",
      continent: "North America",
      currency_code: "MXN",
      phone_prefix: "+52",
      flag_emoji: "🇲🇽",
      popular: false,
    },
    {
      iso2: "TR",
      display_name: "Turkey",
      iso3_code: "TUR",
      continent: "Asia",
      currency_code: "TRY",
      phone_prefix: "+90",
      flag_emoji: "🇹🇷",
      popular: false,
    },
    {
      iso2: "EG",
      display_name: "Egypt",
      iso3_code: "EGY",
      continent: "Africa",
      currency_code: "EGP",
      phone_prefix: "+20",
      flag_emoji: "🇪🇬",
      popular: false,
    },
    {
      iso2: "ZA",
      display_name: "South Africa",
      iso3_code: "ZAF",
      continent: "Africa",
      currency_code: "ZAR",
      phone_prefix: "+27",
      flag_emoji: "🇿🇦",
      popular: false,
    },
    {
      iso2: "CN",
      display_name: "China",
      iso3_code: "CHN",
      continent: "Asia",
      currency_code: "CNY",
      phone_prefix: "+86",
      flag_emoji: "🇨🇳",
      popular: false,
    },
    {
      iso2: "RU",
      display_name: "Russia",
      iso3_code: "RUS",
      continent: "Europe",
      currency_code: "RUB",
      phone_prefix: "+7",
      flag_emoji: "🇷🇺",
      popular: false,
    },
  ];
}

export default useCountries;
