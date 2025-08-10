import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { hotelsService } from "@/services/hotelsService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookingCalendar } from "@/components/BookingCalendar";
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
  Palmtree,
  Gamepad2,
  ShoppingBag,
  Sparkles,
  Crown,
  Trees,
  Fish,
  Home,
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

  // Debug: Log component initialization
  console.log("🎭 SightseeingSearchForm initialized");
  const [destination, setDestination] = useState("Dubai");
  const [destinationCode, setDestinationCode] = useState("DXB"); // Store destination code
  // Unified states for responsive layout
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [destinationSuggestions, setDestinationSuggestions] = useState<
    DestinationOption[]
  >([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  // Set default dates to future dates (tomorrow and 3 days later)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 4); // 3-day trip by default

  const [visitDate, setVisitDate] = useState<Date | undefined>(tomorrow);
  const [endDate, setEndDate] = useState<Date | undefined>(dayAfterTomorrow);
  const [experienceType, setExperienceType] = useState("any");
  const [duration, setDuration] = useState("any");

  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  const [tripType, setTripType] = useState("multi-day");

  // Popular destinations will be loaded from database
  const [popularDestinations, setPopularDestinations] = useState<
    DestinationOption[]
  >([]);
  const [popularDestinationsLoaded, setPopularDestinationsLoaded] =
    useState(false);

  // State to track if user is actively typing (not pre-filled)
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [inputValue, setInputValue] = useState("Dubai");

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
        console.log(
          "🎆 Loading popular sightseeing destinations from database...",
        );
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

  // Initialize form state from URL parameters
  useEffect(() => {
    console.log(
      "🔄 Initializing form from URL parameters:",
      searchParams.toString(),
    );

    // Initialize destination
    const urlDestination = searchParams.get("destination");
    const urlDestinationName = searchParams.get("destinationName");

    if (urlDestination && urlDestinationName) {
      setDestination(urlDestinationName);
      setDestinationCode(urlDestination);
      setInputValue(urlDestinationName);
      console.log(
        "✅ Set destination from URL:",
        urlDestinationName,
        "->",
        urlDestination,
      );
    }

    // Initialize visit date
    const urlVisitDate = searchParams.get("visitDate");
    if (urlVisitDate) {
      try {
        // Handle both ISO string and simple date formats
        const parsedDate = new Date(decodeURIComponent(urlVisitDate));
        if (!isNaN(parsedDate.getTime())) {
          // Ensure we use the date part only (no time zone issues)
          const localDate = new Date(
            parsedDate.getFullYear(),
            parsedDate.getMonth(),
            parsedDate.getDate(),
          );
          setVisitDate(localDate);
          console.log(
            "✅ Set visit date from URL:",
            localDate,
            "from",
            urlVisitDate,
          );
        } else {
          console.warn("⚠️ Invalid visit date format in URL:", urlVisitDate);
        }
      } catch (error) {
        console.error("❌ Error parsing visit date from URL:", error);
      }
    }

    // Initialize end date
    const urlEndDate = searchParams.get("endDate");
    if (urlEndDate) {
      try {
        // Handle both ISO string and simple date formats
        const parsedEndDate = new Date(decodeURIComponent(urlEndDate));
        if (!isNaN(parsedEndDate.getTime())) {
          // Ensure we use the date part only (no time zone issues)
          const localEndDate = new Date(
            parsedEndDate.getFullYear(),
            parsedEndDate.getMonth(),
            parsedEndDate.getDate(),
          );
          setEndDate(localEndDate);
          setTripType("multi-day");
          console.log(
            "✅ Set end date from URL:",
            localEndDate,
            "from",
            urlEndDate,
          );
        } else {
          console.warn("⚠️ Invalid end date format in URL:", urlEndDate);
        }
      } catch (error) {
        console.error("❌ Error parsing end date from URL:", error);
      }
    }

    // Initialize experience type
    const urlExperienceType = searchParams.get("experienceType");
    if (urlExperienceType) {
      setExperienceType(urlExperienceType);
      console.log("✅ Set experience type from URL:", urlExperienceType);
    }

    // Initialize duration
    const urlDuration = searchParams.get("duration");
    if (urlDuration) {
      setDuration(urlDuration);
      console.log("✅ Set duration from URL:", urlDuration);
    }

    // Get adults and children from URL for consistent pricing (stored for use in search)
    const urlAdults = searchParams.get("adults") || "2";
    const urlChildren = searchParams.get("children") || "0";
    console.log(
      "✅ Read adults/children from URL:",
      urlAdults,
      "/",
      urlChildren,
    );
  }, [searchParams]);

  // Get Dubai-specific attractions when searching for Dubai
  const getDubaiAttractions = (): DestinationOption[] => {
    return [
      // Main Dubai destinations
      {
        id: "DXB-CITY",
        code: "DXB",
        name: "Dubai",
        country: "United Arab Emirates",
        type: "city",
        flag: "🇦🇪",
        popular: true,
      },
      {
        id: "DXB-MARINA",
        code: "DXB-MARINA",
        name: "Dubai Marina",
        country: "United Arab Emirates",
        type: "district",
        flag: "🇦🇪",
      },
      {
        id: "DXB-DOWNTOWN",
        code: "DXB-DOWNTOWN",
        name: "Downtown Dubai",
        country: "United Arab Emirates",
        type: "district",
        flag: "🇦🇪",
      },
      {
        id: "DXB-JBR",
        code: "DXB-JBR",
        name: "JBR - Jumeirah Beach Residence",
        country: "United Arab Emirates",
        type: "district",
        flag: "🇦🇪",
      },
      // Top attractions
      {
        id: "DUBAI-FOUNTAIN",
        code: "DUBAI-FOUNTAIN",
        name: "The Dubai Fountain",
        country: "United Arab Emirates",
        type: "attraction",
        flag: "🇦🇪",
      },
      {
        id: "BURJ-KHALIFA",
        code: "BURJ-KHALIFA",
        name: "Burj Khalifa",
        country: "United Arab Emirates",
        type: "attraction",
        flag: "🇦🇪",
      },
      {
        id: "DUBAI-MALL",
        code: "DUBAI-MALL",
        name: "The Dubai Mall",
        country: "United Arab Emirates",
        type: "attraction",
        flag: "🇦🇪",
      },
      {
        id: "DUBAI-FRAME",
        code: "DUBAI-FRAME",
        name: "Dubai Frame",
        country: "United Arab Emirates",
        type: "attraction",
        flag: "🇦🇪",
      },
      {
        id: "ATLANTIS-PALM",
        code: "ATLANTIS-PALM",
        name: "Atlantis The Palm",
        country: "United Arab Emirates",
        type: "attraction",
        flag: "🇦🇪",
      },
      {
        id: "DUBAI-MIRACLE-GARDEN",
        code: "DUBAI-MIRACLE-GARDEN",
        name: "Dubai Miracle Garden",
        country: "United Arab Emirates",
        type: "attraction",
        flag: "🇦🇪",
      },
      {
        id: "GOLD-SOUKS",
        code: "GOLD-SOUKS",
        name: "Gold & Spice Souks",
        country: "United Arab Emirates",
        type: "attraction",
        flag: "🇦🇪",
      },
      {
        id: "LEGOLAND-DUBAI",
        code: "LEGOLAND-DUBAI",
        name: "Legoland Dubai",
        country: "United Arab Emirates",
        type: "theme-park",
        flag: "🇦🇪",
      },
      {
        id: "IMG-WORLDS",
        code: "IMG-WORLDS",
        name: "IMG Worlds of Adventure",
        country: "United Arab Emirates",
        type: "theme-park",
        flag: "🇦🇪",
      },
      {
        id: "DUBAI-AQUARIUM",
        code: "DUBAI-AQUARIUM",
        name: "Dubai Aquarium & Underwater Zoo",
        country: "United Arab Emirates",
        type: "attraction",
        flag: "���������",
      },
    ];
  };

  // Debounced destination search
  const searchDestinations = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setDestinationSuggestions([]);
      return;
    }

    setLoadingDestinations(true);
    try {
      console.log("🔍 Searching sightseeing destinations for:", query);

      // Check if searching for Dubai - show specific attractions
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes("dubai") || lowerQuery.includes("dxb")) {
        const dubaiAttractions = getDubaiAttractions();
        // Filter attractions based on query
        const filteredAttractions = dubaiAttractions.filter(
          (attraction) =>
            attraction.name.toLowerCase().includes(lowerQuery) ||
            attraction.country.toLowerCase().includes(lowerQuery),
        );
        setDestinationSuggestions(filteredAttractions);
        console.log(
          "✅ Found",
          filteredAttractions.length,
          "Dubai sightseeing destinations",
        );
        return;
      }

      // Fallback to regular search
      const results = await hotelsService.searchDestinations(query, 10);
      const formattedResults = results.map((dest) => ({
        id: dest.id,
        code: dest.id,
        name: dest.name,
        country: dest.country,
        type: dest.type as "city" | "region" | "country" | "landmark",
      }));
      setDestinationSuggestions(formattedResults);
      console.log(
        "✅ Found",
        formattedResults.length,
        "sightseeing destinations",
      );
    } catch (error) {
      console.error("⚠️ Error searching destinations:", error);
      setDestinationSuggestions([]);
    } finally {
      setLoadingDestinations(false);
    }
  }, []);

  // Handle destination input change with debouncing
  const handleDestinationChange = (value: string) => {
    setInputValue(value);
    setDestination(value);
    setIsUserTyping(true);

    // Only open desktop popover if not already open to prevent conflicts
    // Mobile uses manual modal opening, so don't auto-open
    if (window.innerWidth >= 768) {
      if (!isDestinationOpenDesktop) {
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
  const handleDestinationSelect = (
    selectedDestination: DestinationOption,
    event?: React.MouseEvent,
  ) => {
    console.log("🎯 Destination selected:", selectedDestination.name);

    // Prevent event propagation to avoid conflicts
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Update state immediately - direct and simple
    setInputValue(selectedDestination.name);
    setDestination(selectedDestination.name);
    setDestinationCode(selectedDestination.code);
    setDestinationSuggestions([]);
    setIsUserTyping(false);
    setIsDestinationOpenMobile(false);
    setIsDestinationOpenDesktop(false);

    console.log("🎯 Updated inputValue to:", selectedDestination.name);
  };

  // Handle date selection for mobile calendar (don't close calendar here)
  const handleMobileDateSelect = (range: {
    startDate: Date;
    endDate: Date;
  }) => {
    console.log("📅 Mobile date range selected:", range);
    setVisitDate(range.startDate);
    setEndDate(range.endDate);
    // Don't close calendar here - let Apply button handle it
  };

  // Handle date selection for desktop calendar (don't close calendar here)
  const handleDesktopDateSelect = (range: {
    startDate: Date;
    endDate: Date;
  }) => {
    console.log("📅 Desktop date range selected:", range);
    setVisitDate(range.startDate);
    setEndDate(range.endDate);
    // Don't close calendar here - let Apply button handle it
  };

  // Search validation and execution
  const validateAndSearch = () => {
    console.log("🔍 Validating search...", {
      destination,
      inputValue,
      destinationCode,
      visitDate,
      endDate,
    });

    // Clear any existing errors
    setShowError(false);
    setErrorMessage("");

    // Validation checks
    console.log("🔍 Validating search:");
    console.log("  - destination:", destination);
    console.log("  - inputValue:", inputValue);
    console.log("  - visitDate:", visitDate);

    if (!destination && !inputValue) {
      console.log("❌ Validation failed: No destination");
      setErrorMessage("Please enter a destination");
      setShowError(true);
      return;
    }

    if (!visitDate) {
      console.log("��� Validation failed: No visit date");
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

    console.log("✅ Validation passed, proceeding with search");

    // Build search parameters
    const currentSearchParams = new URLSearchParams(window.location.search);
    const searchParams = new URLSearchParams({
      destination: destinationCode || inputValue || destination,
      destinationName: destination || inputValue,
      visitDate: visitDate.toISOString(),
      experienceType,
      duration,
      adults: currentSearchParams.get("adults") || "2", // Preserve current adults count
      children: currentSearchParams.get("children") || "0", // Preserve current children count
    });

    if (endDate && endDate.getTime() !== visitDate!.getTime()) {
      searchParams.set("endDate", endDate.toISOString());
    }

    console.log(
      "🎭 Searching sightseeing with params:",
      searchParams.toString(),
    );
    console.log(
      "🎭 Navigating to:",
      `/sightseeing/results?${searchParams.toString()}`,
    );

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
      visitDate,
      endDate,
    });

    // Additional debugging
    console.log("🔍 Validation check:");
    console.log("  - Has destination?", !!(destination || inputValue));
    console.log("  - Has visitDate?", !!visitDate);
    console.log(
      "  - Date is future?",
      visitDate
        ? visitDate >= new Date(new Date().setHours(0, 0, 0, 0))
        : false,
    );

    validateAndSearch();
  };

  // Format date display
  const formatDateDisplay = () => {
    if (!visitDate) return "Select visit date";

    // If we have both start and end dates and they're different, show range
    if (endDate && visitDate && endDate.getTime() !== visitDate.getTime()) {
      return `${format(visitDate, "d-MMM-yyyy")} to ${format(endDate, "d-MMM-yyyy")}`;
    }

    // Single date format like hotel calendar: "8-Aug-2025"
    return format(visitDate, "d-MMM-yyyy");
  };

  const destinationsToShow = isUserTyping
    ? destinationSuggestions
    : popularDestinations;

  // Get appropriate icon for destination type with specific Dubai attraction icons
  const getDestinationIcon = (type: string, name?: string) => {
    // Specific icons for Dubai attractions
    if (name) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes("fountain")) return Sparkles;
      if (lowerName.includes("burj khalifa")) return Crown;
      if (lowerName.includes("mall")) return ShoppingBag;
      if (lowerName.includes("frame")) return Camera;
      if (lowerName.includes("atlantis") || lowerName.includes("palm"))
        return Palmtree;
      if (lowerName.includes("miracle garden") || lowerName.includes("garden"))
        return Trees;
      if (lowerName.includes("legoland") || lowerName.includes("img worlds"))
        return Gamepad2;
      if (lowerName.includes("aquarium") || lowerName.includes("underwater"))
        return Fish;
      if (lowerName.includes("souks") || lowerName.includes("souk"))
        return ShoppingBag;
      if (lowerName.includes("marina")) return Palmtree;
      if (lowerName.includes("jbr") || lowerName.includes("jumeirah"))
        return Home;
    }

    // General type-based icons
    switch (type.toLowerCase()) {
      case "city":
        return Building2;
      case "district":
        return Building2;
      case "airport":
        return Plane;
      case "region":
        return Mountain;
      case "country":
        return Globe;
      case "landmark":
        return Landmark;
      case "attraction":
        return Camera;
      case "theme-park":
        return Gamepad2;
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

      {/* Main Search Form - EXACT HOTELS RESPONSIVE STRUCTURE */}
      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        {/* Destination */}
        <div className="flex-1 lg:max-w-[320px] relative destination-container">
          <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
            Destination
          </label>

          <Popover
            open={isDestinationOpenMobile}
            onOpenChange={setIsDestinationOpenMobile}
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
                    if (!isDestinationOpenMobile) {
                      setIsDestinationOpenMobile(true);
                    }
                    handleDestinationChange(value);
                  }}
                  onFocus={(e) => {
                    e.stopPropagation();
                    setIsDestinationOpenMobile(true);
                    if (!isUserTyping && destination) {
                      setInputValue(destination);
                      setIsUserTyping(true);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDestinationOpenMobile(true);
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
                      setIsDestinationOpenMobile(false);
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
                  inputValue.length > 0 &&
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
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const fullName = `${dest.name}, ${dest.country}`;
                          console.log("🎯 Destination selected:", {
                            name: fullName,
                            code: dest.code || dest.id,
                            type: dest.type,
                            popular: (dest as any).popular,
                          });
                          setDestination(fullName);
                          setDestinationCode(dest.code || dest.id);
                          setInputValue("");
                          setIsUserTyping(false);
                          setIsDestinationOpenMobile(false);
                        }}
                      >
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm truncate">
                                  {dest.name}
                                </span>
                                {(dest as any).popular && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="capitalize">
                                  {dest.type}
                                </span>
                                {dest.country && (
                                  <span> in {dest.country}</span>
                                )}
                              </div>
                            </div>
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
                  inputValue.length > 0 &&
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
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const fullName = `${dest.name}, ${dest.country}`;
                          console.log("🎯 Destination selected:", {
                            name: fullName,
                            code: dest.code || dest.id,
                            type: dest.type,
                            popular: (dest as any).popular,
                          });
                          setDestination(fullName);
                          setDestinationCode(dest.code || dest.id);
                          setInputValue("");
                          setIsUserTyping(false);
                          setIsDestinationOpenMobile(false);
                        }}
                      >
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm truncate">
                                  {dest.name}
                                </span>
                                {(dest as any).popular && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="capitalize">
                                  {dest.type}
                                </span>
                                {dest.country && (
                                  <span> in {dest.country}</span>
                                )}
                              </div>
                            </div>
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
            <Button
              variant="outline"
              className="w-full h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-sm px-3 touch-manipulation"
              onClick={() => setShowMobileDatePicker(true)}
            >
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate text-sm">
                <span className="hidden md:inline">
                  {visitDate &&
                  endDate &&
                  visitDate.getTime() !== endDate.getTime()
                    ? `${format(visitDate, "d-MMM-yyyy")} to ${format(endDate, "d-MMM-yyyy")}`
                    : visitDate
                      ? format(visitDate, "d-MMM-yyyy")
                      : "Select visit date"}
                </span>
                <span className="hidden sm:inline md:hidden">
                  {visitDate &&
                  endDate &&
                  visitDate.getTime() !== endDate.getTime()
                    ? `${format(visitDate, "d MMM")} - ${format(endDate, "d MMM")}`
                    : visitDate
                      ? format(visitDate, "d MMM")
                      : "Select date"}
                </span>
                <span className="sm:hidden">
                  {visitDate &&
                  endDate &&
                  visitDate.getTime() !== endDate.getTime()
                    ? `${format(visitDate, "d MMM")} - ${format(endDate, "d MMM")}`
                    : visitDate
                      ? format(visitDate, "d MMM")
                      : "Date"}
                </span>
              </span>
            </Button>
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



    </div>
  );
}
