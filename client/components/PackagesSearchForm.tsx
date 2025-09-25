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
import { CalendarIcon, Search, Globe, AlertCircle } from "lucide-react";
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
  category: z.string()
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
      category
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
        className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200"
        role="search"
        aria-label="Search packages form"
      >
        {/* All Form Fields Row */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">

          {/* Destination Dropdown */}
          <div className="flex-1">
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
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Package Dates
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
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

          {/* Duration Filter */}
          <div className="flex-1">
            <label htmlFor="duration-select" className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Duration
            </label>
            <select
              id="duration-select"
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
          <div className="flex-1">
            <label htmlFor="budget-select" className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Budget (per person)
            </label>
            <select
              id="budget-select"
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
          <div className="lg:col-span-1">
            <label htmlFor="category-select" className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Package Type
            </label>
            <select
              id="category-select"
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

        {/* Search Button Row - Separate row, always active */}
        <div className="flex justify-center mt-4">
          <Button
            type="submit"
            onClick={handleSearch}
            className="h-12 px-12 bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-bold rounded-lg text-base transition-all duration-150 min-w-[200px]"
          >
            <Search className="mr-2 h-5 w-5" />
            <span>{isSubmitting ? 'Searching...' : 'Search Packages'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
