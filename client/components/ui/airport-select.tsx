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
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load initial airports on mount
  useEffect(() => {
    loadAirports("");
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadAirports(searchQuery);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const loadAirports = async (query: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "50",
        offset: "0",
      });

      if (query.trim()) {
        params.append("q", query.trim());
      }

      const response = await fetch(`/api/admin/airports?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setAirports(data.items || []);
    } catch (error) {
      console.error("Failed to load airports:", error);
      setAirports([]);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayValue = () => {
    if (!value) {
      return placeholder;
    }

    if (value === "ALL") {
      return allLabel;
    }

    const airport = airports.find((a) => a.iata === value);
    if (airport) {
      return `${airport.name} (${airport.iata})`;
    }

    return value; // Fallback to raw value if airport not found
  };

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
          <span className="truncate">{getDisplayValue()}</span>
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
            ) : (
              <CommandGroup>
                {includeAll && (
                  <CommandItem
                    value="ALL"
                    onSelect={() => {
                      onValueChange?.("ALL");
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

                {airports.length === 0 && !loading ? (
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
