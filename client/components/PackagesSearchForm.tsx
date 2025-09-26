import React, { useState, useEffect, useCallback } from "react";
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
import { CalendarIcon, Search, Globe, AlertCircle, Users, Minus, Plus } from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { DestinationDropdown } from "@/components/ui/DestinationDropdown";
import { z } from "zod";

interface DestinationOption {
  name: string;
  code: string;
  type: 'city' | 'country' | 'region';
}

// Form validation schema
const packagesSearchSchema = z.object({
  destination: z.object({
    name: z.string().min(1, "Destination is required"),
    code: z.string().min(1, "Destination code is required"),
    type: z.enum(['city', 'country', 'region'])
  }, { required_error: "Please select a destination" }),
  departureDate: z.date().optional(),
  returnDate: z.date().optional(),
  duration: z.string(),
  budget: z.string(),
  category: z.string(),
  adults: z.number().min(1, "At least 1 adult required"),
  children: z.number().min(0, "Children cannot be negative")
});

type PackagesSearchFormData = z.infer<typeof packagesSearchSchema>;

export function PackagesSearchForm() {
  const navigate = useNavigate();
  const { updateSearchParams } = useSearch();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Pax selection
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isPaxOpen, setIsPaxOpen] = useState(false);

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

  // Analytics tracking
  const trackSearchAttempt = useCallback((valid: boolean, missingFields: string[] = []) => {
    try {
      // Track analytics event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'search_cta_click', {
          module: 'packages',
          form_valid: valid,
          missing_fields: missingFields.join(','),
          destination_type: selectedDestination?.type || 'none'
        });
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [selectedDestination]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    // Clear previous errors
    setShowError(false);
    setErrorMessage("");

    // Validate form using Zod schema
    const formData = {
      destination: selectedDestination,
      departureDate,
      returnDate,
      duration,
      budget,
      category,
      adults,
      children
    };

    const validation = packagesSearchSchema.safeParse(formData);
    
    if (!validation.success) {
      const missingFields = [];
      if (!selectedDestination) missingFields.push('destination');
      
      setErrorMessage(validation.error.errors[0]?.message || "Please select a destination");
      setShowError(true);
      trackSearchAttempt(false, missingFields);
      return;
    }

    setIsSubmitting(true);
    trackSearchAttempt(true);

    try {
      // Build search parameters
      const searchData: any = {
        departure_date: departureDate ? format(departureDate, "yyyy-MM-dd") : undefined,
        return_date: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
        duration,
        budget,
        category,
        adults,
        children,
        module: "packages",
        destination: selectedDestination!.name,
        destination_code: selectedDestination!.code,
        destination_type: selectedDestination!.type,
      };

      // Update search context
      updateSearchParams(searchData);

      // Navigate to results page
      navigate("/packages/results");
    } catch (error) {
      console.error('Search navigation failed:', error);
      setErrorMessage("Search failed. Please try again.");
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDestination, departureDate, returnDate, duration, budget, category, updateSearchParams, navigate, isSubmitting, trackSearchAttempt]);

  // Handle Enter key submission
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

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

      {/* Search Form - All fields in one row, button below */}
      <form
        onSubmit={handleSearch}
        onKeyDown={handleKeyDown}
        className="bg-white rounded p-6 sm:p-8 shadow-xl max-w-7xl mx-auto border-2 border-gray-200"
        role="search"
        aria-label="Search packages form"
      >
        {/* Form Fields - Two Row Layout with Even Spacing */}
        <div className="space-y-6 mb-8">

          {/* First Row - Main Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Destination Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Destination
              </label>
              <DestinationDropdown
                value={selectedDestination}
                onChange={setSelectedDestination}
                placeholder="Where do you want to go?"
                icon={<Globe className="w-4 h-4 text-gray-500 mr-2" />}
                module="packages"
                enableApiSearch={true}
              />
            </div>

            {/* Departure Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Travel Dates
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 justify-start text-left font-medium bg-white border-2 border-blue-500 hover:border-blue-600 focus:border-blue-600 rounded text-sm px-3 py-2 transition-colors"
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
          </div>

          {/* Second Row - Filter Boxes with Even Spacing */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">

            {/* Duration Filter */}
            <div className="space-y-2">
              <label htmlFor="duration-select" className="text-sm font-semibold text-gray-700 block">
                Duration
              </label>
              <select
                id="duration-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-10 px-3 py-2 border-2 border-blue-500 hover:border-blue-600 focus:border-blue-600 rounded text-sm focus:outline-none transition-colors bg-white"
              >
                <option value="any">Any Duration</option>
                <option value="1-5">1-5 Days</option>
                <option value="6-10">6-10 Days</option>
                <option value="11-15">11-15 Days</option>
                <option value="16+">16+ Days</option>
              </select>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label htmlFor="budget-select" className="text-sm font-semibold text-gray-700 block">
                Budget
              </label>
              <select
                id="budget-select"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full h-10 px-3 py-2 border-2 border-blue-500 hover:border-blue-600 focus:border-blue-600 rounded text-sm focus:outline-none transition-colors bg-white"
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
            <div className="space-y-2">
              <label htmlFor="category-select" className="text-sm font-semibold text-gray-700 block">
                Package Type
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 py-2 border-2 border-blue-500 hover:border-blue-600 focus:border-blue-600 rounded text-sm focus:outline-none transition-colors bg-white"
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

            {/* Passengers */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Travelers
              </label>
              <Popover open={isPaxOpen} onOpenChange={setIsPaxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 justify-start text-left font-medium bg-white border-2 border-blue-500 hover:border-blue-600 focus:border-blue-600 rounded text-sm px-3 py-2 transition-colors"
                  >
                    <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">
                      {adults + children === 1 ? '1 Traveler' : `${adults + children} Travelers`}
                      <span className="hidden md:inline text-gray-500 ml-1">
                        • {adults} Adult{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}
                      </span>
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Travelers</h4>

                    {/* Adults */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Adults</div>
                        <div className="text-sm text-gray-600">Ages 18+</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          disabled={adults <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{adults}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAdults(Math.min(8, adults + 1))}
                          disabled={adults >= 8}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Children</div>
                        <div className="text-sm text-gray-600">Ages 0-17</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          disabled={children <= 0}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{children}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setChildren(Math.min(6, children + 1))}
                          disabled={children >= 6}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setIsPaxOpen(false)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Done
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Search Button Row - Prominent and centered */}
        <div className="flex justify-center pt-2">
          <Button
            type="submit"
            onClick={handleSearch}
            disabled={isSubmitting}
            className="h-12 px-16 bg-gradient-to-r from-[#febb02] to-[#f4b601] hover:from-[#e6a602] hover:to-[#e09f00] active:from-[#d19900] active:to-[#c99100] text-black font-bold rounded text-lg transition-all duration-200 min-w-[240px] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Search className="mr-3 h-6 w-6" />
            <span>{isSubmitting ? 'Searching...' : 'Search Packages'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
