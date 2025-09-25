import React, { useState, useEffect } from "react";
import { MapPin, Search, X, Camera, Globe, Building2 } from "lucide-react";

interface DestinationOption {
  name: string;
  code: string;
  type: 'city' | 'country' | 'region';
}

interface SearchResult {
  type: 'city' | 'country' | 'region';
  id: string;
  label: string;
  display_name: string;
  region: string;
  country?: string;
  code: string;
  score: number;
  source: string;
}

interface DestinationDropdownProps {
  value?: DestinationOption;
  onChange: (destination: DestinationOption | null) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  module: 'packages' | 'sightseeing';
  popularDestinations?: DestinationOption[];
  enableApiSearch?: boolean;
}

// Default popular destinations matching Sightseeing pattern
const defaultPopularDestinations: DestinationOption[] = [
  { name: "Dubai, United Arab Emirates", code: "DXB", type: "city" },
  { name: "London, United Kingdom", code: "LON", type: "city" },
  { name: "Paris, France", code: "PAR", type: "city" },
  { name: "Rome, Italy", code: "ROM", type: "city" },
  { name: "Barcelona, Spain", code: "BCN", type: "city" },
  { name: "New York, United States", code: "NYC", type: "city" },
  { name: "Bangkok, Thailand", code: "BKK", type: "city" },
  { name: "Singapore", code: "SIN", type: "city" },
  { name: "Tokyo, Japan", code: "TYO", type: "city" },
  { name: "Sydney, Australia", code: "SYD", type: "city" },
  { name: "Istanbul, Turkey", code: "IST", type: "city" },
  { name: "Mumbai, India", code: "BOM", type: "city" },
];

export function DestinationDropdown({
  value,
  onChange,
  placeholder = "Search destinations...",
  icon,
  module,
  popularDestinations = defaultPopularDestinations,
  enableApiSearch = false
}: DestinationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Debounced search for API
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const performApiSearch = async (query: string) => {
    if (!enableApiSearch || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      const response = await fetch(`/api/destinations/search?q=${encodeURIComponent(query)}&limit=12`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(Array.isArray(results) ? results : []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Destination search error:", error);
      setSearchResults([]);
    }
    setLoadingSearch(false);
  };

  const handleInputChange = (inputValue: string) => {
    setInputValue(inputValue);
    setIsUserTyping(true);

    if (enableApiSearch) {
      // Clear existing timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Set new timeout for debounced search
      debounceTimeout.current = setTimeout(() => {
        setIsUserTyping(false);
        performApiSearch(inputValue);
      }, 250);
    } else {
      setIsUserTyping(false);
    }
  };

  const handleDestinationSelect = (destination: DestinationOption) => {
    onChange(destination);
    setIsOpen(false);
    setInputValue("");
    setSearchResults([]);
    setIsUserTyping(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setInputValue("");
    setSearchResults([]);
  };

  // Convert API result to DestinationOption
  const convertApiResult = (result: SearchResult): DestinationOption => {
    // Generate a code based on result data
    let code = result.code;
    if (!code) {
      // Fallback code generation
      if (result.type === 'city') {
        code = result.display_name.substring(0, 3).toUpperCase();
      } else if (result.type === 'country') {
        code = result.display_name.substring(0, 2).toUpperCase();
      } else {
        code = result.display_name.substring(0, 3).toUpperCase();
      }
    }

    return {
      name: result.label,
      code,
      type: result.type
    };
  };

  // Get icon for destination type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'city':
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'country':
        return <MapPin className="w-4 h-4 text-green-500" />;
      case 'region':
        return <Globe className="w-4 h-4 text-purple-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  // Filter popular destinations based on input
  const filteredPopular = popularDestinations.filter((dest) =>
    dest.name.toLowerCase().includes((inputValue || "").toLowerCase())
  ).slice(0, 8);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div
      className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
        {placeholder}
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-10 w-full hover:border-blue-600 touch-manipulation pr-10"
        >
          {icon || <Camera className="w-4 h-4 text-gray-500 mr-2" />}
          <div className="flex items-center space-x-2 min-w-0">
            {value ? (
              <>
                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                  {value.code}
                </div>
                <span className="text-sm text-gray-700 font-medium truncate">
                  {value.name}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500 font-medium">
                {placeholder}
              </span>
            )}
          </div>
        </button>
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Clear destination"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Destinations Dropdown */}
      {isOpen && (
        <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {module === 'sightseeing' ? 'Sightseeing destination' : 'Package destination'}
            </h3>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search destinations..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            {/* API Search Results (if enabled and searching) */}
            {enableApiSearch && inputValue.trim() && (
              <>
                {loadingSearch || isUserTyping ? (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    Searching destinations...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    No destinations found. Try searching for a city, country, or region.
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-gray-500 px-3 py-1 mb-1">
                      Search Results
                    </div>
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}-${index}`}
                        onClick={() => handleDestinationSelect(convertApiResult(result))}
                        className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                            {getTypeIcon(result.type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {result.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                              {result.region && ` • ${result.region}`}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}

            {/* Popular destinations (when not searching or API disabled) */}
            {(!enableApiSearch || !inputValue.trim()) && (
              <>
                <div className="text-xs font-semibold text-gray-500 px-3 py-1 mb-1">
                  Popular Destinations
                </div>
                {filteredPopular.map((dest, index) => (
                  <button
                    key={index}
                    onClick={() => handleDestinationSelect(dest)}
                    className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                        {getTypeIcon(dest.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {dest.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {module === 'sightseeing' ? 'Sightseeing destination' : 'Package destination'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
