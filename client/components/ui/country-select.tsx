import React, { useState, useMemo, useCallback } from "react";
import { Search, Loader2, AlertCircle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import useCountries, { CountryOption } from "@/hooks/useCountries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CountrySelectProps {
  /**
   * Current selected country code (ISO-2)
   */
  value?: string;

  /**
   * Callback when country selection changes
   */
  onValueChange: (value: string) => void;

  /**
   * Placeholder text when no country is selected
   */
  placeholder?: string;

  /**
   * Whether to show only popular countries initially
   */
  popularOnly?: boolean;

  /**
   * Whether the select is disabled
   */
  disabled?: boolean;

  /**
   * Custom CSS class name
   */
  className?: string;

  /**
   * Whether to show country flags
   */
  showFlags?: boolean;

  /**
   * Whether to show country codes
   */
  showCodes?: boolean;

  /**
   * Whether to enable search functionality
   */
  searchable?: boolean;

  /**
   * Whether to group countries by continent
   */
  groupByContinent?: boolean;

  /**
   * Custom error message
   */
  error?: string;

  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";

  /**
   * Whether to show popular countries at the top
   */
  prioritizePopular?: boolean;
}

/**
 * A comprehensive country selection component with search, grouping, and customization options
 */
export function CountrySelect({
  value = "",
  onValueChange,
  placeholder = "Select country",
  popularOnly = false,
  disabled = false,
  className,
  showFlags = true,
  showCodes = false,
  searchable = true,
  groupByContinent = false,
  error,
  size = "md",
  prioritizePopular = true,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    countries,
    popularCountries,
    countriesByContinent,
    loading,
    error: fetchError,
    searchCountries,
    findCountry,
  } = useCountries({
    popularOnly,
    autoFetch: true,
  });

  // Get the selected country object
  const selectedCountry = useMemo(() => {
    return findCountry(value);
  }, [value, findCountry]);

  // Filter and sort countries based on search query
  const filteredCountries = useMemo(() => {
    let filtered = countries;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = countries.filter(
        (country) =>
          country.display_name.toLowerCase().includes(query) ||
          country.iso2.toLowerCase().includes(query) ||
          (country.iso3_code &&
            country.iso3_code.toLowerCase().includes(query)),
      );
    }

    // Sort: popular countries first, then alphabetically
    if (prioritizePopular && !popularOnly) {
      return filtered.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return a.display_name.localeCompare(b.display_name);
      });
    }

    return filtered.sort((a, b) =>
      a.display_name.localeCompare(b.display_name),
    );
  }, [countries, searchQuery, prioritizePopular, popularOnly]);

  // Handle country selection
  const handleSelect = useCallback(
    (countryCode: string) => {
      onValueChange(countryCode);
      setOpen(false);
      setSearchQuery("");
    },
    [onValueChange],
  );

  // Format country display text
  const formatCountryDisplay = useCallback(
    (country: CountryOption, showCode = showCodes) => {
      const parts = [];

      if (showFlags && country.flag_emoji) {
        parts.push(country.flag_emoji);
      }

      parts.push(country.display_name);

      if (showCode) {
        parts.push(`(${country.iso2})`);
      }

      return parts.join(" ");
    },
    [showFlags, showCodes],
  );

  // Size classes
  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-sm",
    lg: "h-11 text-base",
  };

  // If using simple select without search
  if (!searchable) {
    return (
      <div className="space-y-1">
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled || loading}
        >
          <SelectTrigger
            className={cn(
              sizeClasses[size],
              className,
              error && "border-red-500",
            )}
          >
            <SelectValue placeholder={placeholder}>
              {selectedCountry && formatCountryDisplay(selectedCountry)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading countries...
                </span>
              </div>
            )}

            {(fetchError || error) && (
              <div className="flex items-center justify-center py-4 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span className="ml-2 text-sm">{error || fetchError}</span>
              </div>
            )}

            {!loading && !fetchError && groupByContinent
              ? Object.entries(countriesByContinent).map(
                  ([continent, continentCountries]) => (
                    <div key={continent}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {continent}
                      </div>
                      {continentCountries.map((country) => (
                        <SelectItem key={country.iso2} value={country.iso2}>
                          {formatCountryDisplay(country)}
                        </SelectItem>
                      ))}
                    </div>
                  ),
                )
              : filteredCountries.map((country) => (
                  <SelectItem key={country.iso2} value={country.iso2}>
                    {formatCountryDisplay(country)}
                    {country.popular && prioritizePopular && (
                      <span className="ml-2 text-xs text-blue-600">
                        Popular
                      </span>
                    )}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>

        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  }

  // Searchable country selector using Command/Popover
  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "justify-between font-normal",
              sizeClasses[size],
              className,
              error && "border-red-500",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            disabled={disabled || loading}
          >
            {selectedCountry ? (
              formatCountryDisplay(selectedCountry)
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Globe className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b">
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search countries..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 focus:ring-0"
              />
            </div>

            <CommandList>
              <CommandEmpty>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading countries...</span>
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm">
                    No countries found.
                  </div>
                )}
              </CommandEmpty>

              {(fetchError || error) && (
                <div className="flex items-center justify-center py-4 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="ml-2 text-sm">{error || fetchError}</span>
                </div>
              )}

              {!loading &&
                !fetchError &&
                popularCountries.length > 0 &&
                prioritizePopular &&
                !popularOnly && (
                  <CommandGroup heading="Popular Countries">
                    {popularCountries
                      .filter((country) => {
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          country.display_name.toLowerCase().includes(query) ||
                          country.iso2.toLowerCase().includes(query) ||
                          (country.iso3_code &&
                            country.iso3_code.toLowerCase().includes(query))
                        );
                      })
                      .map((country) => (
                        <CommandItem
                          key={`popular-${country.iso2}`}
                          value={country.iso2}
                          onSelect={handleSelect}
                          className="cursor-pointer"
                        >
                          {formatCountryDisplay(country)}
                          <span className="ml-auto text-xs text-blue-600">
                            Popular
                          </span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

              {!loading && !fetchError && groupByContinent
                ? Object.entries(countriesByContinent)
                    .filter(([, continentCountries]) =>
                      continentCountries.some((country) => {
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          country.display_name.toLowerCase().includes(query) ||
                          country.iso2.toLowerCase().includes(query) ||
                          (country.iso3_code &&
                            country.iso3_code.toLowerCase().includes(query))
                        );
                      }),
                    )
                    .map(([continent, continentCountries]) => (
                      <CommandGroup key={continent} heading={continent}>
                        {continentCountries
                          .filter((country) => {
                            if (!searchQuery.trim()) return true;
                            const query = searchQuery.toLowerCase();
                            return (
                              country.display_name
                                .toLowerCase()
                                .includes(query) ||
                              country.iso2.toLowerCase().includes(query) ||
                              (country.iso3_code &&
                                country.iso3_code.toLowerCase().includes(query))
                            );
                          })
                          .map((country) => (
                            <CommandItem
                              key={country.iso2}
                              value={country.iso2}
                              onSelect={handleSelect}
                              className="cursor-pointer"
                            >
                              {formatCountryDisplay(country)}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    ))
                : !loading &&
                  !fetchError && (
                    <CommandGroup
                      heading={
                        popularOnly ? "Popular Countries" : "All Countries"
                      }
                    >
                      {filteredCountries
                        .filter(
                          (country) =>
                            !prioritizePopular ||
                            popularOnly ||
                            !country.popular ||
                            searchQuery.trim(), // Include popular countries in search results
                        )
                        .map((country) => (
                          <CommandItem
                            key={country.iso2}
                            value={country.iso2}
                            onSelect={handleSelect}
                            className="cursor-pointer"
                          >
                            {formatCountryDisplay(country)}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}

export default CountrySelect;
