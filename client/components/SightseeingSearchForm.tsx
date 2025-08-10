import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sightseeingService } from "@/services/sightseeingService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookingCalendar } from "@/components/BookingCalendar";
import { MobileDatePicker } from "@/components/MobileDropdowns";
import { format, addDays } from "date-fns";
import {
  MapPin,
  CalendarIcon,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/ErrorBanner";

interface DestinationOption {
  id: string;
  code: string;
  name: string;
  country: string;
  type: string;
  flag?: string;
  popular?: boolean;
}

export function SightseeingSearchForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // EXACT HOTELS STATE PATTERN
  const [destination, setDestination] = useState("");
  const [destinationCode, setDestinationCode] = useState("");
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [destinationSuggestions, setDestinationSuggestions] = useState<DestinationOption[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Set default dates to future dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const visitDefault = new Date();
  visitDefault.setDate(visitDefault.getDate() + 4);

  const [visitDate, setVisitDate] = useState<Date | undefined>(tomorrow);
  const [endDate, setEndDate] = useState<Date | undefined>(visitDefault);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  const [tripType, setTripType] = useState("round-trip");

  // Popular destinations will be loaded from database
  const [popularDestinations, setPopularDestinations] = useState<DestinationOption[]>([]);
  const [popularDestinationsLoaded, setPopularDestinationsLoaded] = useState(false);

  // State to track if user is actively typing (not pre-filled) - EXACT HOTELS PATTERN
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Debounced search function - EXACT HOTELS PATTERN
  const debouncedSearchRef = useRef<NodeJS.Timeout>();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load popular destinations from database on component mount - EXACT HOTELS PATTERN
  useEffect(() => {
    const loadPopularDestinations = async () => {
      try {
        console.log("🎆 Loading popular sightseeing destinations from database...");
        const popular = await sightseeingService.searchDestinations(""); // Empty query for popular
        const formattedPopular = popular.map((dest) => ({
          id: dest.code,
          code: dest.code,
          name: dest.name,
          country: dest.country,
          type: dest.type,
          popular: dest.popular,
        }));
        setPopularDestinations(formattedPopular);
        setPopularDestinationsLoaded(true);
        console.log(
          "✅ Loaded",
          formattedPopular.length,
          "popular sightseeing destinations from database",
        );
      } catch (error) {
        console.error(
          "⚠️ Failed to load popular destinations, using fallback:",
          error,
        );
        // Static fallback if database fails - EXACT HOTELS PATTERN
        setPopularDestinations([
          {
            id: "DXB",
            code: "DXB",
            name: "Dubai",
            country: "United Arab Emirates",
            type: "city",
            flag: "🇦🇪",
            popular: true,
          },
          {
            id: "LON",
            code: "LON",
            name: "London",
            country: "United Kingdom",
            type: "city",
            flag: "🇬🇧",
            popular: true,
          },
          {
            id: "BCN",
            code: "BCN",
            name: "Barcelona",
            country: "Spain",
            type: "city",
            flag: "🇪🇸",
            popular: true,
          },
          {
            id: "NYC",
            code: "NYC",
            name: "New York",
            country: "United States",
            type: "city",
            flag: "🇺🇸",
            popular: true,
          },
          {
            id: "PAR",
            code: "PAR",
            name: "Paris",
            country: "France",
            type: "city",
            flag: "🇫🇷",
            popular: true,
          },
          {
            id: "BOM",
            code: "BOM",
            name: "Mumbai",
            country: "India",
            type: "city",
            flag: "🇮🇳",
            popular: true,
          },
        ]);
        setPopularDestinationsLoaded(true);
      }
    };

    loadPopularDestinations();
  }, []);

  // EXACT HOTELS SEARCH PATTERN with debouncing
  const searchDestinations = useCallback(
    async (query: string) => {
      // Show suggestions immediately like Booking.com (min 3 characters)
      if (query.length < 3) {
        setDestinationSuggestions([]);
        return;
      }

      // Clear previous timeout
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current);
      }

      // 300ms debounce as specified
      debouncedSearchRef.current = setTimeout(async () => {
        try {
          setLoadingDestinations(true);
          console.log(`🔍 Real-time sightseeing search: "${query}"`);

          // Get search results using single query parameter
          const results = await sightseeingService.searchDestinations(query);

          const formattedResults = results.map((dest) => ({
            id: dest.code,
            code: dest.code,
            name: dest.name,
            country: dest.country,
            type: dest.type,
            popular: dest.popular || false,
          }));

          setDestinationSuggestions(formattedResults);
          console.log(
            `✅ Real-time sightseeing results: ${formattedResults.length} destinations`,
          );
        } catch (error) {
          console.error("⚠️ Real-time sightseeing search failed:", error);

          // Enhanced fallback with popular destinations filter - EXACT HOTELS PATTERN
          const fallbackDestinations = popularDestinations.filter(
            (dest) =>
              dest.name.toLowerCase().includes(query.toLowerCase()) ||
              dest.country.toLowerCase().includes(query.toLowerCase()) ||
              dest.code.toLowerCase().includes(query.toLowerCase()),
          );

          setDestinationSuggestions(fallbackDestinations.slice(0, 8));
          console.log(
            `🔄 Fallback sightseeing results: ${fallbackDestinations.length} destinations`,
          );
        } finally {
          setLoadingDestinations(false);
        }
      }, 300); // 300ms debounce as specified
    },
    [popularDestinations],
  );

  // Handle destination search only when user actively types - EXACT HOTELS PATTERN
  useEffect(() => {
    if (popularDestinationsLoaded && isDestinationOpen && isUserTyping) {
      if (inputValue && inputValue.length >= 3) {
        // Search immediately as user types (min 3 chars enforced)
        searchDestinations(inputValue);
      } else {
        // Clear search results when input is too short
        setDestinationSuggestions([]);
      }
    }
  }, [
    inputValue,
    searchDestinations,
    popularDestinationsLoaded,
    isDestinationOpen,
    isUserTyping,
  ]);

  // Handle destination selection - FIXED with proper state management
  const handleDestinationSelect = (d: DestinationOption) => {
    const label = `${d.name}, ${d.country}`;
    console.log("🎯 Destination selected:", {
      label,
      code: d.code,
      destination: label,
      destinationCode: d.code
    });

    setDestination(label);
    setDestinationCode(d.code);
    setInputValue("");          // we can clear this ONLY because value uses destination when !isUserTyping
    setIsUserTyping(false);
    setIsDestinationOpen(false);

    console.log("✅ State updated:", {
      destination: label,
      destinationCode: d.code,
      inputValue: "",
      isUserTyping: false
    });
  };

  // Handle search validation and execution - FIXED to use destinationCode
  const handleSearch = () => {
    console.log("🔍 Starting sightseeing search with:", {
      destination,
      destinationCode,
      visitDate,
      endDate,
    });

    // Clear any existing errors
    setShowError(false);
    setErrorMessage("");

    // Validate destination CODE is set
    if (!destinationCode) {
      console.log("❌ Validation failed: No destination code");
      setErrorMessage("Please select a destination");
      setShowError(true);
      return;
    }

    // Validate visit date
    if (!visitDate) {
      console.log("❌ Validation failed: No visit date");
      setErrorMessage("Please select a visit date");
      setShowError(true);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (visitDate < today) {
      console.log("❌ Validation failed: Date in past");
      setErrorMessage("Visit date cannot be in the past");
      setShowError(true);
      return;
    }

    console.log("✅ Validation passed, proceeding with sightseeing search");

    // Build search parameters - USE DESTINATION CODE
    const currentSearchParams = new URLSearchParams(window.location.search);
    const searchParamsObj = new URLSearchParams({
      dest: destinationCode, // MUST use destinationCode
      destinationName: destination,
      visitDate: visitDate.toISOString(),
      adults: currentSearchParams.get("adults") || "2",
      children: currentSearchParams.get("children") || "0",
    });

    if (endDate && endDate.getTime() !== visitDate!.getTime()) {
      searchParamsObj.set("endDate", endDate.toISOString());
    }

    console.log(
      "🎭 Searching sightseeing with params:",
      searchParamsObj.toString(),
    );

    try {
      const url = `/sightseeing/results?${searchParamsObj.toString()}`;
      console.log("🎭 Navigating to:", url);
      navigate(url);
      console.log("✅ Navigation successful");
    } catch (error) {
      console.error("❌ Navigation failed:", error);
      setErrorMessage("Navigation failed. Please try again.");
      setShowError(true);
    }
  };

  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
        {/* Main Search Form - EXACT HOTELS RESPONSIVE STRUCTURE */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">
          {/* Destination - EXACT HOTELS PATTERN */}
          <div className="flex-1 lg:max-w-[320px] relative destination-container">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Destination
            </label>

            <Popover
              open={isDestinationOpen}
              onOpenChange={setIsDestinationOpen}
            >
              <PopoverTrigger asChild>
                <div className="relative cursor-pointer">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <Input
                    type="text"
                    value={isUserTyping ? inputValue : destination || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInputValue(value);
                      setIsUserTyping(true);
                      // Auto-open dropdown when user starts typing
                      if (!isDestinationOpen) {
                        setIsDestinationOpen(true);
                      }
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      setIsDestinationOpen(true);
                      // Set inputValue to current destination when focusing for editing
                      if (!isUserTyping && destination) {
                        setInputValue(destination);
                        setIsUserTyping(true);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDestinationOpen(true);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                    }}
                    readOnly={false}
                    disabled={false}
                    className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation relative z-10"
                    placeholder="Where do you want to explore?"
                    autoComplete="off"
                    data-destination-input="true"
                  />
                  {(destination || (isUserTyping && inputValue)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDestination("");
                        setInputValue("");
                        setIsUserTyping(false);
                        setDestinationCode("");
                        setIsDestinationOpen(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                      title="Clear destination"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 sm:w-[480px] p-0 border border-gray-200 shadow-2xl rounded-lg"
                align="start"
              >
                <div className="max-h-80 overflow-y-auto">
                  {!popularDestinationsLoaded ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-600">
                        Loading destinations...
                      </span>
                    </div>
                  ) : loadingDestinations ? (
                    <div className="flex items-center justify-center p-3">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-xs text-gray-600">
                        🔍 Searching...
                      </span>
                    </div>
                  ) : isUserTyping &&
                    inputValue.length >= 3 &&
                    destinationSuggestions.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <span className="text-xs font-medium text-gray-600">
                          🔍 Search Results
                        </span>
                      </div>
                      {destinationSuggestions.map((dest, index) => (
                        <div
                          key={dest.id || index}
                          className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 group"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleDestinationSelect(dest);
                          }}
                        >
                          {/* Elegant search result icon */}
                          <div className="flex items-center justify-center w-8 h-8 mr-3 flex-shrink-0">
                            <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                              <svg
                                className="w-3.5 h-3.5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"
                                />
                              </svg>
                            </div>
                          </div>

                          {/* Main content area */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                {/* City name and popular badge */}
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 text-sm truncate">
                                    {dest.name}
                                  </span>
                                  {dest.popular && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                      Popular
                                    </span>
                                  )}
                                </div>

                                {/* Country and region info */}
                                <div className="text-xs text-gray-500">
                                  <span className="capitalize">
                                    {dest.type}
                                  </span>
                                  {dest.country && (
                                    <span> in {dest.country}</span>
                                  )}
                                </div>
                              </div>

                              {/* City code aligned right */}
                              <div className="flex-shrink-0 ml-3">
                                <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">
                                  {dest.code || dest.id}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isUserTyping &&
                    inputValue.length >= 3 &&
                    !loadingDestinations ? (
                    <div className="p-4 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        No destinations found for "{inputValue}"
                      </div>
                      <div className="text-xs text-gray-400">
                        Try a different city or country name
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Popular Sightseeing Destinations */}
                      <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                        <span className="text-sm font-semibold text-blue-800">
                          🎯 Popular Sightseeing Destinations
                        </span>
                        <div className="text-xs text-blue-600 mt-1">
                          Choose from popular tourist destinations
                        </div>
                      </div>
                      {popularDestinations.map((dest, index) => (
                        <div
                          key={dest.id || index}
                          className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 group"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleDestinationSelect(dest);
                          }}
                        >
                          {/* Elegant location icon */}
                          <div className="flex items-center justify-center w-8 h-8 mr-3 flex-shrink-0">
                            <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                              <svg
                                className="w-3.5 h-3.5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"
                                />
                              </svg>
                            </div>
                          </div>

                          {/* Main content area */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                {/* City name and popular badge */}
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 text-sm truncate">
                                    {dest.name}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    Popular
                                  </span>
                                </div>

                                {/* Country info */}
                                <div className="text-xs text-gray-500">
                                  <span className="capitalize">
                                    {dest.type}
                                  </span>
                                  {dest.country && (
                                    <span> in {dest.country}</span>
                                  )}
                                </div>
                              </div>

                              {/* City code aligned right */}
                              <div className="flex-shrink-0 ml-3">
                                <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">
                                  {dest.code}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="px-4 py-2 border-t bg-gray-50">
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          <span>🔍</span>
                          <span>
                            Type 3+ characters to search destinations
                          </span>
                        </p>
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <span>💡</span>
                          <span>
                            Use the cities above for testing live Hotelbeds Activities data
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Visit Date - EXACT HOTELS PATTERN */}
          <div className="flex-1 lg:max-w-[280px]">
            {isMobile ? (
              <Button
                variant="outline"
                className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3 touch-manipulation"
                onClick={() => setShowMobileDatePicker(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate text-xs sm:text-sm">
                  <span className="sm:hidden text-xs">
                    {visitDate && endDate ? (
                      <>
                        {format(visitDate, "dd-MMM-yyyy")} -{" "}
                        {format(endDate, "dd-MMM-yyyy")}
                      </>
                    ) : (
                      "Dates"
                    )}
                  </span>
                </span>
              </Button>
            ) : (
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3 touch-manipulation"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">
                      <span className="hidden md:inline">
                        {visitDate && endDate ? (
                          <>
                            {format(visitDate, "d-MMM-yyyy")} to{" "}
                            {format(endDate, "d-MMM-yyyy")}
                          </>
                        ) : (
                          "Visit Date"
                        )}
                      </span>
                      <span className="hidden sm:inline md:hidden">
                        {visitDate && endDate ? (
                          <>
                            {format(visitDate, "d MMM")} -{" "}
                            {format(endDate, "d MMM")}
                          </>
                        ) : (
                          "Select dates"
                        )}
                      </span>
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex flex-col">
                    <BookingCalendar
                      initialRange={{
                        startDate: visitDate || new Date(),
                        endDate:
                          endDate || addDays(visitDate || new Date(), 3),
                      }}
                      onChange={(range) => {
                        console.log("Booking calendar range selected:", range);
                        setVisitDate(range.startDate);
                        setEndDate(range.endDate);
                      }}
                      onClose={() => setIsCalendarOpen(false)}
                      className="w-full"
                      bookingType="sightseeing"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Search Button - EXACT HOTELS PATTERN */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button
              onClick={handleSearch}
              disabled={!destinationCode}
              className={cn(
                "h-10 sm:h-12 w-full sm:w-auto font-bold rounded px-6 sm:px-8 touch-manipulation transition-all duration-150",
                destinationCode
                  ? "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
              title={destinationCode ? "Search sightseeing activities" : "Please select a destination first"}
            >
              <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Search</span>
            </Button>
          </div>
        </div>

        {/* Mobile Date Picker - EXACT HOTELS PATTERN */}
        <MobileDatePicker
          isOpen={showMobileDatePicker}
          onClose={() => setShowMobileDatePicker(false)}
          tripType={tripType}
          setTripType={setTripType}
          selectedDepartureDate={visitDate}
          selectedReturnDate={endDate}
          setSelectedDepartureDate={(date) => setVisitDate(date)}
          setSelectedReturnDate={(date) => setEndDate(date)}
          selectingDeparture={true}
          setSelectingDeparture={() => {}}
          bookingType="hotels" // Use hotels type for check-in/check-out style
        />
      </div>
    </>
  );
}
