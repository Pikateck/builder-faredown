import React, { useState, useEffect } from "react";
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
import { MapPin, CalendarIcon, Search, X, Users, Globe } from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";

export function PackagesSearchForm() {
  const navigate = useNavigate();
  const { updateSearchParams, getDisplayData, searchParams } = useSearch();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Search state
  const [destination, setDestination] = useState("");
  const [destinationCode, setDestinationCode] = useState("");
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

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

  // Mock destinations - replace with API call
  const destinations = [
    { code: "EUR", name: "Europe", type: "region" },
    { code: "ASIA", name: "Asia", type: "region" },
    { code: "ES", name: "Spain", type: "country" },
    { code: "FR", name: "France", type: "country" },
    { code: "TH", name: "Thailand", type: "country" },
    { code: "JP", name: "Japan", type: "country" },
    { code: "PAR", name: "Paris", type: "city" },
    { code: "BCN", name: "Barcelona", type: "city" },
    { code: "BKK", name: "Bangkok", type: "city" },
    { code: "TYO", name: "Tokyo", type: "city" },
  ];

  const filteredDestinations = destinations.filter((dest) =>
    dest.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleDestinationSelect = (dest: any) => {
    setDestination(dest.name);
    setDestinationCode(dest.code);
    setInputValue(dest.name);
    setIsDestinationOpen(false);
  };

  const handleSearch = () => {
    // Validate form
    if (!destination.trim()) {
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

    // Build search parameters
    const searchData = {
      destination: destination,
      destination_code: destinationCode,
      departure_date: departureDate ? format(departureDate, "yyyy-MM-dd") : undefined,
      return_date: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      duration,
      budget,
      category,
      module: "packages"
    };

    // Update search context
    updateSearchParams(searchData);

    // Navigate to results page
    navigate("/packages/results");
  };

  const handleClearDestination = () => {
    setDestination("");
    setDestinationCode("");
    setInputValue("");
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Destination */}
          <div className="md:col-span-2">
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
                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      {destination ? (
                        <span className="text-gray-900 truncate">{destination}</span>
                      ) : (
                        <span className="text-gray-500 truncate">
                          Search destinations, countries, regions...
                        </span>
                      )}
                    </div>
                    {destination && (
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
                      placeholder="Search destinations..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {filteredDestinations.map((dest) => (
                      <button
                        key={dest.code}
                        onClick={() => handleDestinationSelect(dest)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center"
                      >
                        <Globe className="mr-3 h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {dest.name}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {dest.type}
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredDestinations.length === 0 && inputValue && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No destinations found
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
                    {departureDate ? (
                      format(departureDate, "MMM d, yyyy")
                    ) : (
                      "Select date"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <StableBookingCalendar
                  bookingType="packages"
                  initialRange={{
                    startDate: departureDate || new Date(),
                    endDate: returnDate || addDays(departureDate || new Date(), 7),
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
              className="w-full h-10 sm:h-12 px-3 border-2 border-blue-400 rounded text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
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
