import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { hotelsService } from "@/services/hotelsService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MobileDatePicker } from "@/components/MobileDropdowns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays } from "date-fns";
import {
  MapPin,
  CalendarIcon,
  Search,
  X,
  Camera,
  Clock,
  Ticket,
  Plane,
  Building2,
  Mountain,
  Landmark,
  Globe,
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
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Debug: Log component initialization
  console.log("🎭 SightseeingSearchForm initialized");
  const [destination, setDestination] = useState("");
  const [destinationCode, setDestinationCode] = useState(""); // Store destination code
  // Separate states for mobile and desktop popovers
  const [isDestinationOpenMobile, setIsDestinationOpenMobile] = useState(false);
  const [isDestinationOpenDesktop, setIsDestinationOpenDesktop] = useState(false);
  const [isCalendarOpenMobile, setIsCalendarOpenMobile] = useState(false);
  const [isCalendarOpenDesktop, setIsCalendarOpenDesktop] = useState(false);

  const [destinationSuggestions, setDestinationSuggestions] = useState<
    DestinationOption[]
  >([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [visitDate, setVisitDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [experienceType, setExperienceType] = useState("any");
  const [duration, setDuration] = useState("any");

  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  const [tripType, setTripType] = useState("single-day");

  // Popular destinations will be loaded from database
  const [popularDestinations, setPopularDestinations] = useState<
    DestinationOption[]
  >([]);
  const [popularDestinationsLoaded, setPopularDestinationsLoaded] =
    useState(false);

  // State to track if user is actively typing (not pre-filled)
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Debounced search function
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

  // Load popular destinations from database on component mount
  useEffect(() => {
    const loadPopularDestinations = async () => {
      try {
        console.log("🎆 Loading popular sightseeing destinations from database...");
        const popular = await hotelsService.searchDestinations("", 8, true); // Get 8 popular destinations
        const formattedPopular = popular.map((dest) => ({
          id: dest.id,
          code: dest.id, // dest.id is the destination code
          name: dest.name,
          country: dest.country,
          type: dest.type as "city" | "region" | "country" | "landmark",
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
        // Static fallback if database fails
        setPopularDestinations([
          {
            id: "DXB",
            code: "DXB",
            name: "Dubai",
            country: "United Arab Emirates",
            type: "city",
            flag: "🇦🇪",
          },
          {
            id: "LON",
            code: "LON",
            name: "London",
            country: "United Kingdom",
            type: "city",
            flag: "🇬🇧",
          },
          {
            id: "BCN",
            code: "BCN",
            name: "Barcelona",
            country: "Spain",
            type: "city",
            flag: "🇪🇸",
          },
          {
            id: "NYC",
            code: "NYC",
            name: "New York",
            country: "United States",
            type: "city",
            flag: "🇺🇸",
          },
          {
            id: "PAR",
            code: "PAR",
            name: "Paris",
            country: "France",
            type: "city",
            flag: "🇫🇷",
          },
          {
            id: "BOM",
            code: "BOM",
            name: "Mumbai",
            country: "India",
            type: "city",
            flag: "🇮🇳",
          },
        ]);
        setPopularDestinationsLoaded(true);
      }
    };

    loadPopularDestinations();
  }, []);

  // Debounced destination search
  const searchDestinations = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setDestinationSuggestions([]);
        return;
      }

      setLoadingDestinations(true);
      try {
        console.log("🔍 Searching sightseeing destinations for:", query);
        const results = await hotelsService.searchDestinations(query, 10);
        const formattedResults = results.map((dest) => ({
          id: dest.id,
          code: dest.id,
          name: dest.name,
          country: dest.country,
          type: dest.type as "city" | "region" | "country" | "landmark",
        }));
        setDestinationSuggestions(formattedResults);
        console.log("✅ Found", formattedResults.length, "sightseeing destinations");
      } catch (error) {
        console.error("⚠️ Error searching destinations:", error);
        setDestinationSuggestions([]);
      } finally {
        setLoadingDestinations(false);
      }
    },
    []
  );

  // Handle destination input change with debouncing
  const handleDestinationChange = (value: string) => {
    setInputValue(value);
    setDestination(value);
    setIsUserTyping(true);

    // Keep the appropriate popover open when typing
    // Only open if neither is already open to avoid conflicts
    if (!isDestinationOpenMobile && !isDestinationOpenDesktop) {
      // Open the appropriate one based on screen size
      if (window.innerWidth < 768) {
        setIsDestinationOpenMobile(true);
      } else {
        setIsDestinationOpenDesktop(true);
      }
    }

    // Clear previous timeout
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
    }

    // Set new timeout for debounced search
    debouncedSearchRef.current = setTimeout(() => {
      searchDestinations(value);
    }, 300);
  };

  // Handle destination selection
  const handleDestinationSelect = (selectedDestination: DestinationOption) => {
    setDestination(selectedDestination.name);
    setDestinationCode(selectedDestination.code);
    setInputValue(selectedDestination.name);
    setIsDestinationOpenMobile(false);
    setIsDestinationOpenDesktop(false);
    setDestinationSuggestions([]);
    setIsUserTyping(false);
  };

  // Handle date selection for mobile calendar
  const handleMobileDateSelect = (date: Date | undefined) => {
    console.log('📅 Mobile date selected:', date);
    setVisitDate(date);
    setIsCalendarOpenMobile(false);
  };

  // Handle date selection for desktop calendar
  const handleDesktopDateSelect = (date: Date | undefined) => {
    console.log('📅 Desktop date selected:', date);
    setVisitDate(date);
    setIsCalendarOpenDesktop(false);
  };


  // Search validation and execution
  const validateAndSearch = () => {
    console.log("🔍 Validating search...", {
      destination,
      inputValue,
      destinationCode,
      visitDate
    });

    // Clear any existing errors
    setShowError(false);
    setErrorMessage("");

    // Validation checks
    if (!destination && !inputValue) {
      console.log("❌ Validation failed: No destination");
      setErrorMessage("Please enter a destination");
      setShowError(true);
      return;
    }

    if (!visitDate) {
      setErrorMessage("Please select a visit date");
      setShowError(true);
      return;
    }

    if (visitDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      setErrorMessage("Visit date cannot be in the past");
      setShowError(true);
      return;
    }


    // Build search parameters
    const searchParams = new URLSearchParams({
      destination: destinationCode || inputValue || destination,
      destinationName: destination || inputValue,
      visitDate: visitDate.toISOString(),
      experienceType,
      duration,
    });

    if (endDate) {
      searchParams.set("endDate", endDate.toISOString());
    }


    console.log("🎭 Searching sightseeing with params:", searchParams.toString());
    console.log("🎭 Navigating to:", `/sightseeing/results?${searchParams.toString()}`);

    try {
      navigate(`/sightseeing/results?${searchParams.toString()}`);
      console.log("✅ Navigation successful");
    } catch (error) {
      console.error("❌ Navigation failed:", error);
      setErrorMessage("Navigation failed. Please try again.");
      setShowError(true);
    }
  };

  const handleSearch = () => {
    console.log("🔍 Search button clicked!", {
      destination,
      destinationCode,
      inputValue,
      visitDate
    });
    validateAndSearch();
  };


  // Format date display
  const formatDateDisplay = () => {
    if (!visitDate) return "Select date";
    
    if (tripType === "multi-day" && endDate) {
      return `${format(visitDate, "MMM d")} - ${format(endDate, "MMM d")}`;
    }
    
    return format(visitDate, "EEE, MMM d");
  };

  const destinationsToShow = isUserTyping
    ? destinationSuggestions
    : popularDestinations;

  // Get appropriate icon for destination type
  const getDestinationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'city':
        return Building2;
      case 'airport':
        return Plane;
      case 'region':
        return Mountain;
      case 'country':
        return Globe;
      case 'landmark':
        return Landmark;
      default:
        return MapPin;
    }
  };

  return (
    <div className="sightseeing-search-form bg-white rounded-xl shadow-xl p-4 sm:p-6">
      {/* Error Banner */}
      {showError && (
        <ErrorBanner
          message={errorMessage}
          onClose={() => setShowError(false)}
        />
      )}

      {/* Mobile: Vertical Layout */}
      <div className="md:hidden space-y-4">
        {/* Destination Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            What would you like to see?
          </label>
          <Popover
            open={isDestinationOpenMobile}
            onOpenChange={(open) => {
              console.log('🎯 Mobile destination popover state changed:', open);
              setIsDestinationOpenMobile(open);
            }}
          >
            <div className="relative w-full">
              <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
              <PopoverTrigger asChild>
                <Input
                  className="pl-10 pr-8 h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-sm touch-manipulation cursor-pointer"
                  placeholder="Enter destination or attraction"
                  value={inputValue}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onFocus={() => {
                    console.log('🎯 Mobile destination input focused');
                    setIsDestinationOpenMobile(true);
                  }}
                  onClick={() => {
                    console.log('🎯 Mobile destination input clicked');
                    setIsDestinationOpenMobile(true);
                  }}
                />
              </PopoverTrigger>
              {inputValue && (
                <span
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputValue("");
                    setDestination("");
                    setDestinationCode("");
                  }}
                >
                  <X className="w-4 h-4" />
                </span>
              )}
            </div>
            <PopoverContent className="w-80 p-0 border border-gray-300 shadow-lg rounded-lg z-[60] bg-white">
              <div className="max-h-80 overflow-y-auto">
                {loadingDestinations ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Searching destinations...</span>
                    </div>
                  </div>
                ) : destinationsToShow.length > 0 ? (
                  <div>
                    {!isUserTyping && (
                      <div className="px-4 py-3 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
                        POPULAR DESTINATIONS
                      </div>
                    )}
                    <div className="py-1">
                      {destinationsToShow.map((dest) => {
                        const IconComponent = getDestinationIcon(dest.type);
                        return (
                          <button
                            key={dest.id}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleDestinationSelect(dest)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconComponent className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-gray-900 text-sm truncate">
                                    {dest.name}
                                  </span>
                                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    {dest.code}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                  {dest.type === 'city' ? `${dest.country}` :
                                   dest.type === 'airport' ? `${dest.name} Airport, ${dest.country}` :
                                   dest.type === 'region' ? `${dest.country}` :
                                   dest.country}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {dest.flag && (
                                  <span className="text-base">{dest.flag}</span>
                                )}
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <span className="text-sm">
                        {isUserTyping && inputValue
                          ? "No destinations found"
                          : "Start typing to search destinations"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            When do you want to visit?
          </label>
          <div className="grid grid-cols-1 gap-2">
            <Popover
              open={isCalendarOpenMobile}
              onOpenChange={(open) => {
                console.log('📅 Mobile calendar popover state changed:', open);
                setIsCalendarOpenMobile(open);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-sm px-3 touch-manipulation"
                  onClick={() => setIsCalendarOpenMobile(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-sm">
                    {formatDateDisplay()}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={visitDate}
                  onSelect={handleMobileDateSelect}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>


        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="h-12 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded px-8 touch-manipulation transition-all duration-150"
        >
          <Search className="mr-2 h-5 w-5" />
          <span className="text-base">Search Experiences</span>
        </Button>
      </div>

      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:flex md:items-end md:space-x-4">
        {/* Destination */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Destination
          </label>
          <Popover
            open={isDestinationOpenDesktop}
            onOpenChange={(open) => {
              console.log('🎯 Desktop destination popover state changed:', open);
              setIsDestinationOpenDesktop(open);
            }}
          >
            <div className="relative w-full">
              <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
              <PopoverTrigger asChild>
                <Input
                  className="pl-10 pr-8 h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-sm cursor-pointer"
                  placeholder="Where do you want to explore?"
                  value={inputValue}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onFocus={() => {
                    console.log('🎯 Desktop destination input focused');
                    setIsDestinationOpenDesktop(true);
                  }}
                  onClick={() => {
                    console.log('🎯 Desktop destination input clicked');
                    setIsDestinationOpenDesktop(true);
                  }}
                />
              </PopoverTrigger>
              {inputValue && (
                <span
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputValue("");
                    setDestination("");
                    setDestinationCode("");
                  }}
                >
                  <X className="w-4 h-4" />
                </span>
              )}
            </div>
            <PopoverContent className="w-[520px] p-0 border border-gray-300 shadow-lg rounded-lg z-[60] bg-white">
              <div className="max-h-80 overflow-y-auto">
                {loadingDestinations ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Searching destinations...</span>
                    </div>
                  </div>
                ) : destinationsToShow.length > 0 ? (
                  <div>
                    {!isUserTyping && (
                      <div className="px-4 py-3 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
                        POPULAR DESTINATIONS
                      </div>
                    )}
                    <div className="py-1">
                      {destinationsToShow.map((dest) => {
                        const IconComponent = getDestinationIcon(dest.type);
                        return (
                          <button
                            key={dest.id}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleDestinationSelect(dest)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconComponent className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-gray-900 text-base truncate">
                                    {dest.name}
                                  </span>
                                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {dest.code}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {dest.type === 'city' ? `${dest.country}` :
                                   dest.type === 'airport' ? `${dest.name} Airport, ${dest.country}` :
                                   dest.type === 'region' ? `${dest.country}` :
                                   dest.country}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {dest.flag && (
                                  <span className="text-lg">{dest.flag}</span>
                                )}
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <span className="text-sm">
                        {isUserTyping && inputValue
                          ? "No destinations found"
                          : "Start typing to search destinations"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Visit Date
          </label>
          <Popover
            open={isCalendarOpenDesktop}
            onOpenChange={(open) => {
              console.log('📅 Desktop calendar popover state changed:', open);
              setIsCalendarOpenDesktop(open);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-sm px-3"
                onClick={() => setIsCalendarOpenDesktop(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate text-sm">
                  {formatDateDisplay()}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={visitDate}
                onSelect={handleDesktopDateSelect}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>


        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="h-12 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded px-8 transition-all duration-150"
        >
          <Search className="mr-2 h-5 w-5" />
          <span className="text-base">Search</span>
        </Button>
      </div>
    </div>
  );
}
