import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/contexts/SearchContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StableBookingCalendar } from "@/components/StableBookingCalendar";
import { format, addDays } from "date-fns";
import { MapPin, CalendarIcon, Search, X, Globe, Building2 } from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";

interface DestinationSearchResult {
  type: 'region' | 'country' | 'city';
  id: string;
  label: string;
  region: string;
  country?: string;
  score?: number;
}

interface SelectedDestination {
  type: 'region' | 'country' | 'city';
  id: string;
  label: string;
  region: string;
  country?: string;
}

export function PackagesSearchForm() {
  const navigate = useNavigate();
  const { updateSearchParams } = useSearch();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Smart search state
  const [selectedDestination, setSelectedDestination] = useState<SelectedDestination | null>(null);
  const [destinationInputValue, setDestinationInputValue] = useState("");
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<DestinationSearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Dates
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Filters
  const [duration, setDuration] = useState("any");
  const [budget, setBudget] = useState("any");
  const [category, setCategory] = useState("any");

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Debounced search function
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      const response = await fetch(`/api/destinations/search?q=${encodeURIComponent(query)}&limit=15`, {
        credentials: "include",
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(Array.isArray(results) ? results : []);
      } else {
        console.error("Search failed:", response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching destinations:", error);
      setSearchResults([]);
    }
    setLoadingSearch(false);
  }, []);

  // Handle destination input change with debouncing
  const handleDestinationInputChange = (value: string) => {
    setDestinationInputValue(value);
    setIsUserTyping(true);

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout for debounced search
    debounceTimeout.current = setTimeout(() => {
      setIsUserTyping(false);
      performSearch(value);
    }, 300); // 300ms debounce
  };

  // Handle destination selection
  const handleDestinationSelect = (destination: DestinationSearchResult) => {
    const selected: SelectedDestination = {
      type: destination.type,
      id: destination.id,
      label: destination.label,
      region: destination.region,
      country: destination.country,
    };

    setSelectedDestination(selected);
    setDestinationInputValue(destination.label);
    setIsDestinationOpen(false);
    setSearchResults([]);
  };

  // Clear destination selection
  const handleClearDestination = () => {
    setSelectedDestination(null);
    setDestinationInputValue("");
    setSearchResults([]);
  };

  // Get icon for destination type
  const getDestinationIcon = (type: string) => {
    switch (type) {
      case 'city':
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case 'country':
        return <MapPin className="h-4 w-4 text-green-500" />;
      case 'region':
        return <Globe className="h-4 w-4 text-purple-500" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get type label for display
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'city':
        return 'City';
      case 'country':
        return 'Country';
      case 'region':
        return 'Region';
      default:
        return '';
    }
  };

  const handleSearch = () => {
    // Validate form
    if (!selectedDestination) {
      setErrorMessage("Please select a destination");
      setShowError(true);
      return;
    }

    if (!departureDate) {
      setErrorMessage("Please select departure date");
      setShowError(true);
      return;
    }

    // Clear any existing errors
    setShowError(false);
    setErrorMessage("");

    // Build search parameters based on destination type
    const searchData: any = {
      departure_date: departureDate ? format(departureDate, "yyyy-MM-dd") : undefined,
      return_date: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      duration,
      budget,
      category,
      module: "packages",
    };

    // Set destination data based on type
    if (selectedDestination.type === 'city') {
      searchData.city_id = selectedDestination.id;
      searchData.city_name = selectedDestination.label;
      searchData.region_name = selectedDestination.region;
      searchData.country_name = selectedDestination.country;
    } else if (selectedDestination.type === 'country') {
      searchData.country_id = selectedDestination.id;
      searchData.country_name = selectedDestination.label;
      searchData.region_name = selectedDestination.region;
    } else if (selectedDestination.type === 'region') {
      searchData.region_id = selectedDestination.id;
      searchData.region_name = selectedDestination.label;
    }

    // Update search context
    updateSearchParams(searchData);

    // Navigate to results page
    navigate("/packages/results");
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      {/* Error Banner */}
      {showError && (
        <div className="mb-4">
          <ErrorBanner
            message={errorMessage}
            onClose={() => setShowError(false)}
          />
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Smart Destination Search */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Where do you want to go?
            </label>
            <Popover open={isDestinationOpen} onOpenChange={setIsDestinationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-500 hover:border-blue-600 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <div className="flex items-center w-full">
                    <Search className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      {selectedDestination ? (
                        <div className="flex items-center">
                          {getDestinationIcon(selectedDestination.type)}
                          <span className="ml-2 text-gray-900 truncate">
                            {selectedDestination.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 truncate">
                          Search destinations...
                        </span>
                      )}
                    </div>
                    {selectedDestination && (
                      <X
                        className="ml-2 h-4 w-4 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearDestination();
                        }}
                      />
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Type region, country, or city..."
                      value={destinationInputValue}
                      onChange={(e) => handleDestinationInputChange(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {loadingSearch || isUserTyping ? (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        Searching destinations...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        {destinationInputValue.trim() 
                          ? "No destinations found. Try searching for a city, country, or region."
                          : "Start typing to search destinations..."}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {searchResults.map((result, index) => (
                          <button
                            key={`${result.type}-${result.id}-${index}`}
                            onClick={() => handleDestinationSelect(result)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center group"
                          >
                            <div className="mr-3 flex-shrink-0">
                              {getDestinationIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {result.label}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 mr-2">
                                  {getTypeLabel(result.type)}
                                </span>
                                {result.country && result.country !== result.region && (
                                  <span>{result.country} • </span>
                                )}
                                <span>{result.region}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure Date
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-500 hover:border-blue-600 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {departureDate
                      ? format(departureDate, "MMM d, yyyy")
                      : "Select date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <StableBookingCalendar
                  bookingType="packages"
                  initialRange={{
                    startDate: departureDate || new Date(),
                    endDate:
                      returnDate || addDays(departureDate || new Date(), 7),
                  }}
                  onChange={(range) => {
                    setDepartureDate(range.startDate);
                    setReturnDate(range.endDate);
                    setIsCalendarOpen(false);
                  }}
                  onClose={() => setIsCalendarOpen(false)}
                  className="w-full"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Duration Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full h-10 sm:h-12 px-3 border-2 border-blue-500 rounded text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="any">Any Duration</option>
              <option value="1-5">1-5 Days</option>
              <option value="6-10">6-10 Days</option>
              <option value="11-15">11-15 Days</option>
              <option value="16+">16+ Days</option>
            </select>
          </div>
        </div>

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget (per person)
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full h-10 sm:h-12 px-3 border-2 border-blue-500 rounded text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="any">Any Budget</option>
              <option value="0-50000">Under ₹50,000</option>
              <option value="50000-100000">₹50,000 - ₹1,00,000</option>
              <option value="100000-200000">₹1,00,000 - ₹2,00,000</option>
              <option value="200000-500000">₹2,00,000 - ₹5,00,000</option>
              <option value="500000+">Above ₹5,00,000</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 sm:h-12 px-3 border-2 border-blue-500 rounded text-xs sm:text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="any">All Types</option>
              <option value="cultural">Cultural & Heritage</option>
              <option value="beach">Beach & Islands</option>
              <option value="adventure">Adventure</option>
              <option value="honeymoon">Honeymoon</option>
              <option value="family">Family</option>
              <option value="luxury">Luxury</option>
              <option value="budget">Budget</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              className="w-full h-10 sm:h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-sm sm:text-base px-4 sm:px-6 flex items-center justify-center"
            >
              <Search className="mr-2 h-4 w-4" />
              Search Packages
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
