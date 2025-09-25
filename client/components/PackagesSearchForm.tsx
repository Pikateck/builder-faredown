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
          
          {/* Destination Dropdown - Using Shared Component */}
          <DestinationDropdown
            value={selectedDestination}
            onChange={setSelectedDestination}
            placeholder="Where do you want to go?"
            icon={<Globe className="w-4 h-4 text-gray-500 mr-2" />}
            module="packages"
            enableApiSearch={true}
          />

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
