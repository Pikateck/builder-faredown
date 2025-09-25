import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/contexts/SearchContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StableBookingCalendar } from "@/components/StableBookingCalendar";
import { format, addDays } from "date-fns";
import { CalendarIcon, Search, Globe } from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { DestinationDropdown } from "@/components/ui/DestinationDropdown";

interface DestinationOption {
  name: string;
  code: string;
  type: 'city' | 'country' | 'region';
}

export function PackagesSearchForm() {
  const navigate = useNavigate();
  const { updateSearchParams } = useSearch();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Destination state using shared component
  const [selectedDestination, setSelectedDestination] = useState<DestinationOption | null>(null);

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

    // Build search parameters
    const searchData: any = {
      departure_date: departureDate ? format(departureDate, "yyyy-MM-dd") : undefined,
      return_date: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      duration,
      budget,
      category,
      module: "packages",
      destination: selectedDestination.name,
      destination_code: selectedDestination.code,
      destination_type: selectedDestination.type,
    };

    // Update search context
    updateSearchParams(searchData);

    // Navigate to results page
    navigate("/packages/results");
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

      {/* Search Form - Matching Sightseeing Layout */}
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
        {/* Main Search Form Row */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">
          
          {/* Smart Destination Search - Matching Sightseeing UX */}
          <div
            className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              Where do you want to go?
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDestinationOpen(!isDestinationOpen)}
                className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-10 w-full hover:border-blue-600 touch-manipulation pr-10"
              >
                <Globe className="w-4 h-4 text-gray-500 mr-2" />
                <div className="flex items-center space-x-2 min-w-0">
                  {selectedDestination ? (
                    <>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {getDestinationCode(selectedDestination)}
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {selectedDestination.label}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium">
                      Search destinations...
                    </span>
                  )}
                </div>
              </button>
              {selectedDestination && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearDestination();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear destination"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Destinations Dropdown - Matching Sightseeing Style */}
            {isDestinationOpen && (
              <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Package destination
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={destinationInputValue}
                      onChange={(e) => handleDestinationInputChange(e.target.value)}
                      placeholder="Search destinations..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {/* Show search results if user is searching */}
                  {destinationInputValue.trim() && (
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
                        searchResults.map((result, index) => (
                          <button
                            key={`${result.type}-${result.id}-${index}`}
                            onClick={() => handleDestinationSelect(result)}
                            className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                {getDestinationIcon(result.type)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {result.label}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 mr-2">
                                    {getTypeLabel(result.type)}
                                  </span>
                                  {result.country && result.country !== result.region && (
                                    <span>{result.country} • </span>
                                  )}
                                  <span>{result.region}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </>
                  )}

                  {/* Show popular destinations when not searching */}
                  {!destinationInputValue.trim() && (
                    <>
                      <div className="text-xs font-semibold text-gray-500 px-3 py-1 mb-1">
                        Popular Destinations
                      </div>
                      {popularDestinations.map((dest, index) => (
                        <button
                          key={index}
                          onClick={() => handleDestinationSelect(dest)}
                          className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                              {getDestinationIcon(dest.type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {dest.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Package destination
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

          {/* Departure Date */}
          <div className="flex-1 lg:max-w-[280px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Package Dates
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-500 hover:border-blue-600 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {departureDate && returnDate ? (
                      <>
                        <span className="hidden md:inline">
                          {format(departureDate, "EEE, MMM d")} to{" "}
                          {format(returnDate, "EEE, MMM d")}
                        </span>
                        <span className="md:hidden">
                          {format(departureDate, "d MMM")} -{" "}
                          {format(returnDate, "d MMM")}
                        </span>
                      </>
                    ) : departureDate ? (
                      <>
                        <span className="hidden md:inline">
                          {format(departureDate, "EEE, MMM d")}
                        </span>
                        <span className="md:hidden">
                          {format(departureDate, "d MMM")}
                        </span>
                      </>
                    ) : (
                      "Select dates"
                    )}
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

          {/* Search Button */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button
              onClick={handleSearch}
              className="h-10 sm:h-12 w-full sm:w-auto bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-bold rounded px-6 sm:px-8 transition-all duration-150"
            >
              <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Search Packages</span>
            </Button>
          </div>
        </div>

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      </div>
    </div>
  );
}
