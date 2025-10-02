import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
}

interface AirportSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeAll?: boolean;
  allLabel?: string;
}

export function AirportSelect({
  value,
  onValueChange,
  placeholder = "Select airport...",
  disabled = false,
  className,
  includeAll = true,
  allLabel = "All",
}: AirportSelectProps) {
  const [open, setOpen] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const hasLoadedOnce = useRef(false);

  // Load airports when dropdown opens for the first time
  useEffect(() => {
    if (open && !hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      loadAirports("");
    }
  }, [open]);

  // Debounced search - only trigger on search query changes when dropdown is open
  useEffect(() => {
    if (!open) return; // Don't search when dropdown is closed

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadAirports(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, open]);

  const loadAirports = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: "50",
        offset: "0",
      });

      if (query.trim()) {
        params.append("q", query.trim());
      }

      // Get auth token from localStorage
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.warn("⚠️ No authentication token found. Please log in to the admin panel.");
        setError("Not authenticated. Please log in first.");
        setAirports([]);
        setLoading(false);
        return;
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await fetch(`/api/admin/airports?${params}`, { headers });
      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError(`Error loading airports (HTTP ${response.status})`);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Batch state update to prevent flickering
      setAirports(data.items || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load airports:", error);
      if (!error) {
        setError("Failed to load airports. Please try again.");
      }
      setAirports([]);
      setLoading(false);
    }
  };

  // Memoize display value to prevent unnecessary recalculations
  const displayValue = React.useMemo(() => {
    if (!value || value === "ALL") {
      return value === "ALL" ? allLabel : placeholder;
    }

    const airport = airports.find((a) => a.iata === value);
    if (airport) {
      return `${airport.name} (${airport.iata})`;
    }

    return value; // Fallback to raw value if airport not found
  }, [value, airports, allLabel, placeholder]);

  const formatAirportLabel = (airport: Airport) => {
    return `${airport.name} (${airport.iata})`;
  };

  const formatAirportSubLabel = (airport: Airport) => {
    return `${airport.city}, ${airport.country}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search airports by name, code, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching airports...
              </div>
            ) : error ? (
              <div className="py-6 px-4 text-center">
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <p className="text-xs text-muted-foreground">
                  {error.includes("authenticated") || error.includes("Session")
                    ? "Go to Admin Login to authenticate"
                    : "Try again or contact support"}
                </p>
              </div>
            ) : (
              <CommandGroup>
                {includeAll && (
                  <CommandItem
                    value="ALL"
                    onSelect={() => {
                      onValueChange?.("ALL");
                      setSearchQuery(""); // Reset search
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === "ALL" ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div>
                      <div className="font-medium">{allLabel}</div>
                      <div className="text-sm text-muted-foreground">
                        Apply to all airports
                      </div>
                    </div>
                  </CommandItem>
                )}

                {airports.length === 0 && !loading && !error ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {searchQuery
                      ? "No airports found"
                      : "No airports available"}
                  </div>
                ) : (
                  airports.map((airport) => (
                    <CommandItem
                      key={airport.iata}
                      value={airport.iata}
                      onSelect={() => {
                        onValueChange?.(airport.iata);
                        setSearchQuery(""); // Reset search
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === airport.iata ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div>
                        <div className="font-medium">
                          {formatAirportLabel(airport)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatAirportSubLabel(airport)}
                        </div>
                      </div>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
