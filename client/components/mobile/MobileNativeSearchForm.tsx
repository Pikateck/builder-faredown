import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Calendar,
  Users,
  Search,
  MapPin,
  Hotel,
  Camera,
  Car,
  Clock,
  Award,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useDateContext } from "@/contexts/DateContext";
import { useSearch } from "@/contexts/SearchContext";
import { saveRecentSearchToLocalStorage } from "../RecentSearches";
import { MobileFullScreenCityInput } from "./MobileFullScreenCityInput";
import { MobileFullScreenDateInput } from "./MobileFullScreenDateInput";
import { MobileFullScreenTravelersInput } from "./MobileFullScreenTravelersInput";
import { MobileFullScreenTimeInput } from "./MobileFullScreenTimeInput";
import { MobileFullScreenTransferTypeInput } from "./MobileFullScreenTransferTypeInput";
import { MobileFullScreenMultiCityInput } from "./MobileFullScreenMultiCityInput";
import { MobileHotelSmartSearch } from "./MobileHotelSmartSearch";
import { MobileClassDropdown } from "../MobileDropdowns";
import { type SearchResult } from "@/lib/hotelSearchData";

interface Travelers {
  adults: number;
  children: number;
  infants?: number;
  rooms?: number;
  childAges?: number[]; // For hotels - child age tracking
}

interface DateRange {
  startDate: Date;
  endDate?: Date;
}

interface FlightLeg {
  id: string;
  from: string;
  fromCode: string;
  fromAirport: string;
  to: string;
  toCode: string;
  toAirport: string;
  date: Date;
}

interface MobileNativeSearchFormProps {
  module: "flights" | "hotels" | "sightseeing" | "transfers";
  transferType?: "airport-taxi" | "car-rentals";
}

// City data - expanded for all modules
const cityData = {
  Mumbai: {
    code: "BOM",
    city: "Mumbai",
    country: "India",
    airport: "Chhatrapati Shivaji Intl",
  },
  Delhi: {
    code: "DEL",
    city: "New Delhi",
    country: "India",
    airport: "Indira Gandhi Intl",
  },
  Dubai: {
    code: "DXB",
    city: "Dubai",
    country: "UAE",
    airport: "Dubai International",
  },
  London: {
    code: "LHR",
    city: "London",
    country: "UK",
    airport: "Heathrow",
  },
  Singapore: {
    code: "SIN",
    city: "Singapore",
    country: "Singapore",
    airport: "Changi",
  },
  Paris: {
    code: "CDG",
    city: "Paris",
    country: "France",
    airport: "Charles de Gaulle",
  },
  Bangkok: {
    code: "BKK",
    city: "Bangkok",
    country: "Thailand",
    airport: "Suvarnabhumi",
  },
  Tokyo: {
    code: "NRT",
    city: "Tokyo",
    country: "Japan",
    airport: "Narita Intl",
  },
};

export function MobileNativeSearchForm({
  module,
  transferType: initialTransferType,
}: MobileNativeSearchFormProps) {
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  // Global state contexts
  const dateContext = useDateContext();
  const searchContext = useSearch();

  // Form states
  const [tripType, setTripType] = useState<
    "round-trip" | "one-way" | "multi-city"
  >(
    module === "hotels"
      ? "round-trip" // Hotels always need check-in AND check-out dates
      : module === "sightseeing" || module === "transfers"
        ? "one-way"
        : "round-trip",
  );

  // Transfers specific state
  const [transferType, setTransferType] = useState<
    "airport-taxi" | "car-rentals"
  >(initialTransferType || "airport-taxi");
  const [transferTripType, setTransferTripType] = useState<
    "one-way" | "return"
  >("one-way");

  // Location states - start blank by default
  const [fromCity, setFromCity] = useState("");
  const [fromCode, setFromCode] = useState("");
  const [toCity, setToCity] = useState("");
  const [toCode, setToCode] = useState("");

  // Use context for dates instead of local state - memoized to prevent unnecessary re-renders
  const dateRange = useMemo(() => ({
    startDate: dateContext.departureDate || addDays(new Date(), 1),
    endDate: dateContext.returnDate || ((tripType === "round-trip" || module === "hotels") ? addDays(new Date(), 8) : undefined),
  }), [dateContext.departureDate, dateContext.returnDate, tripType, module]);

  // Time states (for transfers)
  const [pickupTime, setPickupTime] = useState("12:00");
  const [returnTime, setReturnTime] = useState("12:00");

  // Multi-city states (for flights)
  const [multiCityLegs, setMultiCityLegs] = useState<FlightLeg[]>([]);

  // Travelers state
  const [travelers, setTravelers] = useState<Travelers>({
    adults: 1,
    children: 0,
    infants: 0,
    rooms: 1,
    childAges: [], // For hotel child ages
  });

  // Flight class state (for flights only)
  const [selectedClass, setSelectedClass] = useState("Economy");

  // UI states for full-screen inputs
  const [showFromInput, setShowFromInput] = useState(false);
  const [showToInput, setShowToInput] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);
  const [showTravelersInput, setShowTravelersInput] = useState(false);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [showTransferTypeInput, setShowTransferTypeInput] = useState(false);
  const [showMultiCityInput, setShowMultiCityInput] = useState(false);
  const [showClassInput, setShowClassInput] = useState(false);
  const [showHotelSmartSearch, setShowHotelSmartSearch] = useState(false);

  // Helper function to close all inputs before opening a new one
  const closeAllInputs = () => {
    setShowFromInput(false);
    setShowToInput(false);
    setShowDateInput(false);
    setShowTravelersInput(false);
    setShowTimeInput(false);
    setShowTransferTypeInput(false);
    setShowMultiCityInput(false);
    setShowClassInput(false);
    setShowHotelSmartSearch(false);
  };
  const [selectedHotelResult, setSelectedHotelResult] =
    useState<SearchResult | null>(null);

  // Validation states
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync trip type changes with DateContext
  useEffect(() => {
    dateContext.setTripType(tripType);
    // Clear return date if switching to one-way (but not for hotels)
    if (tripType === "one-way" && module !== "hotels" && dateContext.returnDate) {
      dateContext.setReturnDate(null);
    }
  }, [tripType, module, dateContext]);

  // Load initial data from URL parameters on mount
  useEffect(() => {
    if (urlSearchParams.toString()) {
      dateContext.loadDatesFromParams(urlSearchParams);
      searchContext.loadFromUrlParams(urlSearchParams);
    }
  }, []);

  // Handle city selection
  const handleFromCitySelect = (city: string, code: string) => {
    // Debug logging for airport selection
    console.log("From airport selected:", {
      city,
      code,
      airport: cityData[city]?.airport,
    });
    setFromCity(city);
    setFromCode(code);
  };

  const handleToCitySelect = (city: string, code: string) => {
    // Debug logging for airport selection
    console.log("To airport selected:", {
      city,
      code,
      airport: cityData[city]?.airport,
    });
    setToCity(city);
    setToCode(code);
  };

  // Handle date selection with proper state management
  const handleDateSelect = useCallback((range: DateRange) => {
    console.log('datesChanged', {
      start: range.startDate?.toISOString(),
      end: range.endDate?.toISOString(),
      tripType,
      module,
      currentModule: module // Ensure we stay in the same module
    });

    // Update DateContext
    dateContext.setDepartureDate(range.startDate);
    // Hotels always need both check-in and check-out dates
    if (module === "hotels" || tripType === "round-trip") {
      dateContext.setReturnDate(range.endDate || null);
    } else {
      dateContext.setReturnDate(null);
    }
    dateContext.setTripType(tripType);

    // Update SearchContext
    searchContext.updateSearchParams({
      departureDate: range.startDate?.toISOString() || "",
      returnDate: range.endDate?.toISOString() || "",
      checkIn: range.startDate?.toISOString() || "",
      checkOut: range.endDate?.toISOString() || "",
      tripType,
      module,
    });

    // Update URL parameters
    const newParams = new URLSearchParams(urlSearchParams);
    if (range.startDate) {
      newParams.set("departureDate", range.startDate.toISOString());
      newParams.set("checkIn", range.startDate.toISOString());
    }
    if (range.endDate && (tripType === "round-trip" || module === "hotels")) {
      newParams.set("returnDate", range.endDate.toISOString());
      newParams.set("checkOut", range.endDate.toISOString());
    } else {
      newParams.delete("returnDate");
      newParams.delete("checkOut");
    }
    newParams.set("tripType", tripType);
    setUrlSearchParams(newParams, { replace: true });

    // Save to recent searches (non-blocking) with localStorage fallback
    try {
      const recentSearchData = {
        tripType,
        module,
        dates: {
          depart: range.startDate?.toISOString() || "",
          return: range.endDate?.toISOString() || "",
        },
        from: { code: fromCode, name: fromCity },
        to: { code: toCode, name: toCity },
        timestamp: new Date().toISOString(),
      };

      // Try API first
      fetch("/api/recent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ module, query: recentSearchData }),
      }).catch(apiError => {
        console.warn("API save failed, using localStorage fallback:", apiError);
        // Fallback to localStorage if API fails
        saveRecentSearchToLocalStorage(module, recentSearchData);
      });

      // Also save to localStorage as backup
      saveRecentSearchToLocalStorage(module, recentSearchData);
    } catch (error) {
      console.error("Failed to save recent search:", error);
      // Try localStorage as final fallback
      try {
        const fallbackData = {
          tripType,
          module,
          dates: {
            depart: range.startDate?.toISOString() || "",
            return: range.endDate?.toISOString() || "",
          },
          from: { code: fromCode, name: fromCity },
          to: { code: toCode, name: toCity },
          timestamp: new Date().toISOString(),
        };
        saveRecentSearchToLocalStorage(module, fallbackData);
      } catch (fallbackError) {
        console.error("Even localStorage fallback failed:", fallbackError);
      }
    }

    // Console log current URL for debugging
    console.log('Current URL with updated params:', window.location.href);

    // Emit custom event for other components
    window.dispatchEvent(new CustomEvent('datesChanged', {
      detail: { start: range.startDate, end: range.endDate, tripType, module }
    }));
  }, [tripType, module, dateContext, searchContext, urlSearchParams, setUrlSearchParams, fromCode, fromCity, toCode, toCity]);

  // Handle travelers selection
  const handleTravelersSelect = (newTravelers: Travelers) => {
    setTravelers(newTravelers);
  };

  // Handle time selection
  const handleTimeSelect = (time: string, type: "pickup" | "return") => {
    if (type === "pickup") {
      setPickupTime(time);
    } else {
      setReturnTime(time);
    }
  };

  // Handle transfer type selection
  const handleTransferTypeSelect = (
    type: "airport-taxi" | "car-rentals",
    tripType: "one-way" | "return",
  ) => {
    setTransferType(type);
    setTransferTripType(tripType);
  };

  // Handle multi-city selection
  const handleMultiCitySelect = (legs: FlightLeg[]) => {
    setMultiCityLegs(legs);
  };

  // Handle flight class selection
  const handleClassSelect = (classType: string) => {
    setSelectedClass(classType);
  };

  // Handle recent search click - populate form with selected search data
  const handleRecentSearchClick = (searchData: any) => {
    try {
      // Set cities
      if (searchData.from) {
        const fromMatch = Object.entries(cityData).find(
          ([name, data]) =>
            searchData.from.code === data.code ||
            searchData.from.name === name ||
            name === searchData.from.name,
        );
        if (fromMatch) {
          setFromCity(fromMatch[0]);
          setFromCode(fromMatch[1].code);
        }
      }

      if (searchData.to) {
        const toMatch = Object.entries(cityData).find(
          ([name, data]) =>
            searchData.to.code === data.code ||
            searchData.to.name === name ||
            name === searchData.to.name,
        );
        if (toMatch) {
          setToCity(toMatch[0]);
          setToCode(toMatch[1].code);
        }
      }

      // Set dates using context
      if (searchData.dates?.depart) {
        const depDate = new Date(searchData.dates.depart);
        if (!isNaN(depDate.getTime())) {
          dateContext.setDepartureDate(depDate);
        }
      }

      if (searchData.dates?.return) {
        const retDate = new Date(searchData.dates.return);
        if (!isNaN(retDate.getTime())) {
          dateContext.setReturnDate(retDate);
        }
      }

      // Set travelers
      if (searchData.adults || searchData.children || searchData.rooms || searchData.childAges) {
        setTravelers((prev) => ({
          ...prev,
          adults: searchData.adults || 1,
          children: searchData.children || 0,
          rooms: searchData.rooms || (module === "hotels" ? 1 : prev.rooms),
          childAges: searchData.childAges || [],
        }));
      }

      // Set trip type
      if (searchData.tripType && module === "flights") {
        setTripType(searchData.tripType);
      }
    } catch (error) {
      console.error("Error loading recent search:", error);
    }
  };

  // Format date display using context dates
  const formatDateDisplay = () => {
    const startDate = dateContext.departureDate;
    const endDate = dateContext.returnDate;

    if (module === "flights" && tripType === "multi-city") {
      if (multiCityLegs.length > 0) {
        const cities = multiCityLegs
          .map((leg) => leg.fromCode)
          .concat(multiCityLegs[multiCityLegs.length - 1].toCode);
        return `${cities.join(" → ")} (${multiCityLegs.length} flights)`;
      }
      return "Add multiple destinations";
    }

    if (!startDate) return "Select dates";

    if (module === "hotels") {
      const checkIn = format(startDate, "MMM d");
      const checkOut = endDate
        ? format(endDate, "MMM d")
        : "Check-out";
      return `${checkIn} - ${checkOut}`;
    }

    if (tripType === "one-way" || module === "transfers") {
      return format(startDate, "MMM d");
    }

    if (endDate) {
      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
    }

    return format(startDate, "MMM d") + " - Return";
  };

  // Format travelers display
  const formatTravelersDisplay = () => {
    const parts = [];

    if (travelers.adults > 0) {
      parts.push(`${travelers.adults} adult${travelers.adults > 1 ? "s" : ""}`);
    }

    if (travelers.children && travelers.children > 0) {
      parts.push(
        `${travelers.children} child${travelers.children > 1 ? "ren" : ""}`,
      );
    }

    if (module === "hotels" && travelers.rooms && travelers.rooms > 0) {
      parts.push(`${travelers.rooms} room${travelers.rooms > 1 ? "s" : ""}`);
    }

    // Add child age summary for hotels if there are children
    if (module === "hotels" && travelers.children && travelers.children > 0 && travelers.childAges && travelers.childAges.length > 0) {
      const ageText = travelers.childAges.length === 1 ? `age ${travelers.childAges[0]}` : `ages ${travelers.childAges.join(", ")}`;
      // Replace the children part to include ages
      const childIndex = parts.findIndex(part => part.includes("child"));
      if (childIndex !== -1) {
        parts[childIndex] = `${travelers.children} child${travelers.children > 1 ? "ren" : ""} (${ageText})`;
      }
    }

    return parts.join(", ") || "1 adult";
  };

  // Get appropriate icon for module
  const getModuleIcon = () => {
    switch (module) {
      case "flights":
        return Plane;
      case "hotels":
        return Hotel;
      case "sightseeing":
        return Camera;
      case "transfers":
        return Car;
      default:
        return Plane;
    }
  };

  // Get field labels based on module
  const getFieldLabels = () => {
    switch (module) {
      case "flights":
        return {
          from: "Leaving from",
          to: "Going to",
          dates:
            tripType === "one-way"
              ? "Departure"
              : tripType === "multi-city"
                ? "Travel dates"
                : "Travel dates",
        };
      case "hotels":
        return {
          from: "Destination",
          to: null, // Hotels don't have "to"
          dates: "Check-in - Check-out",
        };
      case "sightseeing":
        return {
          from: "Destination",
          to: null,
          dates: "Activity date",
        };
      case "transfers":
        return {
          from:
            transferType === "airport-taxi"
              ? "Pickup location"
              : "Pickup location",
          to:
            transferType === "airport-taxi"
              ? "Drop-off location"
              : "Drop-off location",
          dates: "Transfer date",
        };
      default:
        return {
          from: "From",
          to: "To",
          dates: "Dates",
        };
    }
  };

  const fieldLabels = getFieldLabels();
  const ModuleIcon = getModuleIcon();

  // Enhanced validation for all searches
  const validateSearch = (): { isValid: boolean; error?: string } => {
    // Check if From city is selected
    if (!fromCity || !fromCode) {
      return {
        isValid: false,
        error: "Please select a departure location",
      };
    }

    // Check if To city is selected (except for hotels and sightseeing)
    if (
      module !== "hotels" &&
      module !== "sightseeing" &&
      (!toCity || !toCode)
    ) {
      return {
        isValid: false,
        error: "Please select a destination",
      };
    }

    // Check if From and To are the same
    if (
      module !== "hotels" &&
      module !== "sightseeing" &&
      fromCode === toCode
    ) {
      return {
        isValid: false,
        error: "Departure and destination cannot be the same",
      };
    }

    // Multi-city validation
    if (module === "flights" && tripType === "multi-city") {
      if (multiCityLegs.length < 2) {
        return {
          isValid: false,
          error: "Add at least 2 flight segments for multi-city travel",
        };
      }

      // Check if all legs have valid destinations
      for (let i = 0; i < multiCityLegs.length; i++) {
        const leg = multiCityLegs[i];
        if (!leg.from || !leg.fromCode || !leg.to || !leg.toCode) {
          return {
            isValid: false,
            error: `Complete destinations for Flight ${i + 1}`,
          };
        }
        if (leg.fromCode === leg.toCode) {
          return {
            isValid: false,
            error: `Departure and destination cannot be the same for Flight ${i + 1}`,
          };
        }
        if (!leg.date) {
          return {
            isValid: false,
            error: `Select date for Flight ${i + 1}`,
          };
        }
      }
    }

    // Check if dates are selected using context
    if (!dateContext.departureDate) {
      return {
        isValid: false,
        error: "Please select travel dates",
      };
    }

    // Check return date for round-trip
    if (tripType === "round-trip" && !dateContext.returnDate) {
      return {
        isValid: false,
        error: "Please select a return date",
      };
    }

    // Check return date for hotels
    if (module === "hotels" && !dateContext.returnDate) {
      return {
        isValid: false,
        error: "Please select check-out date",
      };
    }

    // Check if child ages are provided for hotels when children are present
    if (module === "hotels" && travelers.children && travelers.children > 0) {
      if (!travelers.childAges || travelers.childAges.length !== travelers.children) {
        return {
          isValid: false,
          error: "Please specify ages for all children",
        };
      }
    }

    // Check if at least one room is selected for hotels
    if (module === "hotels" && (!travelers.rooms || travelers.rooms < 1)) {
      return {
        isValid: false,
        error: "Please select at least one room",
      };
    }

    return { isValid: true };
  };

  // Handle search
  const handleSearch = () => {
    // Clear previous validation errors
    setValidationError(null);

    // Validate search before proceeding
    const validation = validateSearch();
    if (!validation.isValid) {
      setValidationError(validation.error!);
      return;
    }

    // Debug logging for search payload
    console.log("Mobile search initiated:", {
      module,
      from: { city: fromCity, code: fromCode },
      to: { city: toCity, code: toCode },
      dateRange: {
        startDate: dateContext.departureDate,
        endDate: dateContext.returnDate,
      },
      travelers,
      tripType,
      selectedClass: module === "flights" ? selectedClass : undefined,
      transferType: module === "transfers" ? transferType : undefined,
      multiCityLegs:
        module === "flights" && tripType === "multi-city"
          ? multiCityLegs.length
          : undefined,
      timestamp: new Date().toISOString(),
    });

    const searchParams = new URLSearchParams({
      from: fromCode,
      to: toCode,
      departureDate: dateContext.departureDate!.toISOString(),
      adults: travelers.adults.toString(),
      children: (travelers.children || 0).toString(),
      tripType,
    });

    // Add multi-city legs data
    if (module === "flights" && tripType === "multi-city") {
      searchParams.set("multiCityLegs", JSON.stringify(multiCityLegs));
    }

    if (
      dateContext.returnDate &&
      (tripType === "round-trip" || module === "hotels")
    ) {
      searchParams.set("returnDate", dateContext.returnDate.toISOString());
    }

    if (module === "hotels" && travelers.rooms) {
      searchParams.set("rooms", travelers.rooms.toString());
      // Add child ages for hotels
      if (travelers.childAges && travelers.childAges.length > 0) {
        searchParams.set("childAges", JSON.stringify(travelers.childAges));
      }
    }

    if (module === "transfers") {
      searchParams.set("transferType", transferType);
      searchParams.set("transferTripType", transferTripType);
      searchParams.set("pickupTime", pickupTime);
      if (transferTripType === "return") {
        searchParams.set("returnTime", returnTime);
      }
    }

    if (module === "flights" && travelers.infants) {
      searchParams.set("infants", travelers.infants.toString());
    }

    if (module === "flights") {
      searchParams.set("class", selectedClass);
    }

    // Store in recent searches API (non-blocking)
    const recentSearchData = {
      tripType,
      from: {
        code: fromCode,
        name: fromCity,
      },
      to: {
        code: toCode,
        name: toCity,
      },
      dates: {
        depart: dateContext.departureDate!.toISOString(),
        return: dateContext.returnDate ? dateContext.returnDate.toISOString() : null,
      },
      adults: travelers.adults,
      children: travelers.children || 0,
      rooms: module === "hotels" ? travelers.rooms : undefined,
      childAges: module === "hotels" ? travelers.childAges : undefined,
      directOnly: false,
    };

    // Non-blocking API call to store recent search
    fetch("/api/recent-searches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        module: module,
        query: recentSearchData,
      }),
    }).catch((error) => {
      console.error("Failed to save recent search:", error);
    });

    navigate(`/${module}/results?${searchParams.toString()}`);
  };

  return (
    <div>
      {/* Blue Header Section */}
      <div className="py-6 md:py-8" style={{ backgroundColor: "#003580" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Upgrade. Bargain. Book.
            </h2>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight opacity-95">
              {module === "flights" &&
                "Turn your fare into an upgrade with live AI bargaining."}
              {module === "hotels" &&
                "Control your price with AI-powered hotel upgrades."}
              {module === "sightseeing" &&
                "Explore attractions & experiences with AI that bargains for you."}
              {module === "transfers" &&
                "Ride in comfort for less — AI secures your best deal on every trip."}
            </h1>
          </div>
        </div>
      </div>

      {/* Native Mobile Search Panel */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
          {/* Trip Type Selection (for flights only) */}
          {module === "flights" && (
            <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-100">
              <button
                onClick={() => setTripType("round-trip")}
                className={`flex items-center space-x-2 ${
                  tripType === "round-trip" ? "text-[#003580]" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    tripType === "round-trip"
                      ? "bg-[#003580] border-[#003580]"
                      : "border-gray-300"
                  }`}
                ></div>
                <span className="text-sm font-medium">Round trip</span>
              </button>

              <button
                onClick={() => setTripType("one-way")}
                className={`flex items-center space-x-2 ${
                  tripType === "one-way" ? "text-[#003580]" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    tripType === "one-way"
                      ? "bg-[#003580] border-[#003580]"
                      : "border-gray-300"
                  }`}
                ></div>
                <span className="text-sm font-medium">One way</span>
              </button>

              <button
                onClick={() => setTripType("multi-city")}
                className={`flex items-center space-x-2 ${
                  tripType === "multi-city" ? "text-[#003580]" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    tripType === "multi-city"
                      ? "bg-[#003580] border-[#003580]"
                      : "border-gray-300"
                  }`}
                ></div>
                <span className="text-sm font-medium">Multi-city</span>
              </button>
            </div>
          )}

          {/* Transfer Type Selection (for transfers only) */}
          {module === "transfers" && (
            <button
              onClick={() => setShowTransferTypeInput(true)}
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580] mb-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    Transfer type
                  </div>
                  <div className="font-semibold text-gray-900 text-base">
                    {transferType === "airport-taxi"
                      ? "Airport Taxi"
                      : "Car Rentals"}{" "}
                    • {transferTripType === "one-way" ? "One-way" : "Return"}
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Search Fields */}
          <div className="space-y-3">
            {/* From Field - Use Smart Search for Hotels */}
            <button
              onClick={() => {
                if (module === "hotels") {
                  setShowHotelSmartSearch(true);
                } else {
                  setShowFromInput(true);
                }
              }}
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#003580] rounded-lg flex items-center justify-center">
                  <ModuleIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    {fieldLabels.from}
                  </div>
                  {module === "hotels" && selectedHotelResult ? (
                    <div>
                      <div className="font-semibold text-gray-900 text-base">
                        {selectedHotelResult.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedHotelResult.description} •{" "}
                        {selectedHotelResult.location}
                      </div>
                    </div>
                  ) : (
                    <div className="font-semibold text-gray-900 text-base">
                      {module === "hotels" && !selectedHotelResult
                        ? "Search hotels, cities, landmarks..."
                        : `${fromCity} (${fromCode})`}
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* To Field (if applicable) */}
            {fieldLabels.to && (
              <button
                onClick={() => setShowToInput(true)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {fieldLabels.to}
                    </div>
                    <div className="font-semibold text-gray-900 text-base">
                      {toCity} ({toCode})
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Dates Field */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Dates button clicked - preventing multiple opens');

                // Close all inputs first
                closeAllInputs();

                // Add small delay to ensure state is clean
                setTimeout(() => {
                  if (module === "flights" && tripType === "multi-city") {
                    setShowMultiCityInput(true);
                  } else {
                    setShowDateInput(true);
                  }
                }, 50);
              }}
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    module === "flights" && tripType === "multi-city"
                      ? "bg-orange-500"
                      : "bg-emerald-500"
                  }`}
                >
                  {module === "flights" && tripType === "multi-city" ? (
                    <Plane className="w-5 h-5 text-white" />
                  ) : (
                    <Calendar className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    {module === "flights" && tripType === "multi-city"
                      ? "Multi-city flights"
                      : fieldLabels.dates}
                  </div>
                  <div className="font-semibold text-gray-900 text-base">
                    {formatDateDisplay()}
                  </div>
                  {module === "flights" && tripType === "multi-city" && (
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      Tap to add flights →
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Time Field (for transfers only) */}
            {module === "transfers" && (
              <button
                onClick={() => setShowTimeInput(true)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {transferTripType === "return"
                        ? "Pickup & return time"
                        : "Pickup time"}
                    </div>
                    <div className="font-semibold text-gray-900 text-base">
                      {transferTripType === "return"
                        ? `${pickupTime} - ${returnTime}`
                        : pickupTime}
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Travelers Field */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeAllInputs();
                setTimeout(() => {
                  setShowTravelersInput(true);
                }, 50);
              }}
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    {module === "hotels" ? "Guests & rooms" : "Travelers"}
                  </div>
                  <div className="font-semibold text-gray-900 text-base">
                    {formatTravelersDisplay()}
                  </div>
                </div>
              </div>
            </button>

            {/* Flight Class Field (for flights only) */}
            {module === "flights" && (
              <button
                onClick={() => setShowClassInput(true)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-[#003580] transition-colors focus:outline-none focus:border-[#003580]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Travel class</div>
                    <div className="font-semibold text-gray-900 text-base">
                      {selectedClass}
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Validation Error Display */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-700 text-sm font-medium">
                    {validationError}
                  </p>
                </div>
              </div>
            )}

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center space-x-2 mt-6 transition-all duration-150 ${
                !validateSearch().isValid
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black"
              }`}
              disabled={!validateSearch().isValid}
            >
              <Search className="w-5 h-5" />
              <span>
                {!validateSearch().isValid
                  ? "Complete Required Fields"
                  : module === "flights" && tripType === "multi-city"
                    ? multiCityLegs.length < 2
                      ? "Add Flight Segments"
                      : "Search Multi-City"
                    : "Search"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Smart Search for Hotels */}
      {showHotelSmartSearch && (
        <MobileHotelSmartSearch
          isOpen={showHotelSmartSearch}
          onClose={() => setShowHotelSmartSearch(false)}
          onSelect={(result) => {
            setSelectedHotelResult(result);
            setFromCity(result.location.split(",")[0]?.trim() || result.name);
            setFromCode(result.code || "HTL");
          }}
          initialValue={fromCity}
        />
      )}

      {/* Full-Screen Input Components */}
      {showFromInput && (
        <MobileFullScreenCityInput
          title={fieldLabels.from || "Select location"}
          placeholder="Search cities, airports..."
          selectedValue={`${fromCity} (${fromCode})`}
          onSelect={handleFromCitySelect}
          onBack={() => setShowFromInput(false)}
          cities={cityData}
        />
      )}

      {showToInput && fieldLabels.to && (
        <MobileFullScreenCityInput
          title={fieldLabels.to}
          placeholder="Search cities, airports..."
          selectedValue={`${toCity} (${toCode})`}
          onSelect={handleToCitySelect}
          onBack={() => setShowToInput(false)}
          cities={cityData}
        />
      )}

      {showDateInput && (() => {
        const pickerTripType = module === "transfers" ? transferTripType : tripType;
        console.log('Rendering MobileFullScreenDateInput with props:', {
          title: fieldLabels.dates || "Select dates",
          tripType: pickerTripType,
          initialRange: dateRange,
          context: {
            departureDate: dateContext.departureDate,
            returnDate: dateContext.returnDate,
            contextTripType: dateContext.tripType
          }
        });

        return (
          <MobileFullScreenDateInput
            title={fieldLabels.dates || "Select dates"}
            tripType={pickerTripType}
            module={module}
            initialRange={dateRange}
            onSelect={handleDateSelect}
            onBack={() => setShowDateInput(false)}
          />
        );
      })()}

      {showTravelersInput && (
        <MobileFullScreenTravelersInput
          title={module === "hotels" ? "Guests & rooms" : "Travelers"}
          bookingType={module === "hotels" ? "hotel" : module === "flights" ? "flight" : module === "sightseeing" ? "sightseeing" : "transfer"}
          initialTravelers={travelers}
          onSelect={handleTravelersSelect}
          onBack={() => setShowTravelersInput(false)}
        />
      )}

      {showTimeInput && module === "transfers" && (
        <MobileFullScreenTimeInput
          title="Select time"
          transferTripType={transferTripType}
          initialPickupTime={pickupTime}
          initialReturnTime={returnTime}
          onSelect={handleTimeSelect}
          onBack={() => setShowTimeInput(false)}
        />
      )}

      {showTransferTypeInput && module === "transfers" && (
        <MobileFullScreenTransferTypeInput
          title="Transfer type"
          initialTransferType={transferType}
          initialTripType={transferTripType}
          onSelect={handleTransferTypeSelect}
          onBack={() => setShowTransferTypeInput(false)}
        />
      )}

      {showMultiCityInput &&
        module === "flights" &&
        tripType === "multi-city" && (
          <MobileFullScreenMultiCityInput
            title="Multi-city flights"
            initialLegs={multiCityLegs}
            onSelect={handleMultiCitySelect}
            onBack={() => setShowMultiCityInput(false)}
            cities={cityData}
          />
        )}

      {/* Flight Class Selection (for flights only) */}
      {showClassInput && module === "flights" && (
        <MobileClassDropdown
          isOpen={showClassInput}
          onClose={() => setShowClassInput(false)}
          selectedClass={selectedClass}
          onSelectClass={handleClassSelect}
        />
      )}

    </div>
  );
}
