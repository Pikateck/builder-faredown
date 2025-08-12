import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Users,
  Search,
  X,
  Plus,
  Minus,
  Clock,
  Car,
  Plane,
  Hotel,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/ErrorBanner";
import { transfersService, TransferDestination } from "@/services/transfersService";

interface PassengerConfig {
  adults: number;
  children: number;
  childrenAges: number[];
  infants: number;
}

type TransferMode = "airport" | "rental";
type AirportDirection = "airport-to-hotel" | "hotel-to-airport";

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  // Sub-module state
  const [transferMode, setTransferMode] = useState<TransferMode>("airport");
  
  // Airport transport specific states
  const [airportDirection, setAirportDirection] = useState<AirportDirection>("airport-to-hotel");
  const [airport, setAirport] = useState("");
  const [airportCode, setAirportCode] = useState("");
  const [hotel, setHotel] = useState("");
  const [hotelCode, setHotelCode] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  
  // Car rental states (existing pickup/dropoff logic)
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupLocationCode, setPickupLocationCode] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [dropoffLocationCode, setDropoffLocationCode] = useState("");
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [driverAge, setDriverAge] = useState("");
  
  // Shared location states
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDropoffOpen, setIsDropoffOpen] = useState(false);
  const [isAirportOpen, setIsAirportOpen] = useState(false);
  const [isHotelOpen, setIsHotelOpen] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<TransferDestination[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<TransferDestination[]>([]);
  const [airportSuggestions, setAirportSuggestions] = useState<TransferDestination[]>([]);
  const [hotelSuggestions, setHotelSuggestions] = useState<TransferDestination[]>([]);
  const [loadingPickupDestinations, setLoadingPickupDestinations] = useState(false);
  const [loadingDropoffDestinations, setLoadingDropoffDestinations] = useState(false);
  const [loadingAirportDestinations, setLoadingAirportDestinations] = useState(false);
  const [loadingHotelDestinations, setLoadingHotelDestinations] = useState(false);
  
  // Popular destinations state
  const [popularDestinations, setPopularDestinations] = useState<TransferDestination[]>([]);
  const [popularDestinationsLoaded, setPopularDestinationsLoaded] = useState(false);
  
  // User typing states
  const [isPickupUserTyping, setIsPickupUserTyping] = useState(false);
  const [isDropoffUserTyping, setIsDropoffUserTyping] = useState(false);
  const [isAirportUserTyping, setIsAirportUserTyping] = useState(false);
  const [isHotelUserTyping, setIsHotelUserTyping] = useState(false);
  const [pickupInputValue, setPickupInputValue] = useState("");
  const [dropoffInputValue, setDropoffInputValue] = useState("");
  const [airportInputValue, setAirportInputValue] = useState("");
  const [hotelInputValue, setHotelInputValue] = useState("");
  
  // Date and time states
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const returnDefault = new Date();
  returnDefault.setDate(returnDefault.getDate() + 4);
  returnDefault.setHours(14, 0, 0, 0);

  const [pickupDate, setPickupDate] = useState<Date | undefined>(tomorrow);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState("14:00");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Passenger states
  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 2,
    children: 0,
    childrenAges: [],
    infants: 0,
  });
  const [isPassengerPopoverOpen, setIsPassengerPopoverOpen] = useState(false);
  
  // Vehicle type filter
  const [vehicleType, setVehicleType] = useState("");
  
  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);

  // Debounced search refs
  const debouncedPickupSearchRef = useRef<NodeJS.Timeout>();
  const debouncedDropoffSearchRef = useRef<NodeJS.Timeout>();
  const debouncedAirportSearchRef = useRef<NodeJS.Timeout>();
  const debouncedHotelSearchRef = useRef<NodeJS.Timeout>();

  // Options for transfers
  const transferOptions = [
    { value: "any", label: "Any vehicle type" },
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "minivan", label: "Minivan" },
    { value: "luxury", label: "Luxury Car" },
    { value: "wheelchair", label: "Wheelchair Accessible" },
    { value: "bus", label: "Bus" },
  ];

  // Time options
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return {
      value: `${hour}:00`,
      label: `${hour}:00`,
    };
  });

  // Driver age options
  const driverAgeOptions = [
    { value: "18-24", label: "18-24 years" },
    { value: "25-29", label: "25-29 years" },
    { value: "30+", label: "30+ years" },
  ];

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load popular destinations from Hotelbeds API on component mount
  useEffect(() => {
    const loadPopularDestinations = async () => {
      try {
        console.log("🎆 Loading popular transfer destinations from Hotelbeds...");
        const popular = await transfersService.searchDestinations("");
        setPopularDestinations(popular);
        setPopularDestinationsLoaded(true);
        console.log("✅ Loaded", popular.length, "popular transfer destinations");
      } catch (error) {
        console.error("⚠️ Failed to load popular destinations:", error);
        setPopularDestinationsLoaded(true);
      }
    };

    loadPopularDestinations();
  }, []);

  // Auto-sync locations when switching between airport directions
  useEffect(() => {
    if (transferMode === "airport") {
      if (sameAsPickup) {
        setDropoffLocation(pickupLocation);
        setDropoffLocationCode(pickupLocationCode);
      }
    }
  }, [transferMode, sameAsPickup, pickupLocation, pickupLocationCode]);

  useEffect(() => {
    if (isRoundTrip && !returnDate) {
      setReturnDate(returnDefault);
    }
  }, [isRoundTrip]);

  // Search functions for different destination types
  const searchPickupDestinations = useCallback(async (query: string) => {
    if (query.length < 1) {
      setPickupSuggestions([]);
      return;
    }

    if (debouncedPickupSearchRef.current) {
      clearTimeout(debouncedPickupSearchRef.current);
    }

    debouncedPickupSearchRef.current = setTimeout(async () => {
      try {
        setLoadingPickupDestinations(true);
        const results = await transfersService.searchDestinations(query);
        setPickupSuggestions(results);
      } catch (error) {
        console.error("❌ Pickup search error:", error);
        setPickupSuggestions([]);
      } finally {
        setLoadingPickupDestinations(false);
      }
    }, 150);
  }, []);

  const searchDropoffDestinations = useCallback(async (query: string) => {
    if (query.length < 1) {
      setDropoffSuggestions([]);
      return;
    }

    if (debouncedDropoffSearchRef.current) {
      clearTimeout(debouncedDropoffSearchRef.current);
    }

    debouncedDropoffSearchRef.current = setTimeout(async () => {
      try {
        setLoadingDropoffDestinations(true);
        const results = await transfersService.searchDestinations(query);
        setDropoffSuggestions(results);
      } catch (error) {
        console.error("❌ Dropoff search error:", error);
        setDropoffSuggestions([]);
      } finally {
        setLoadingDropoffDestinations(false);
      }
    }, 150);
  }, []);

  const searchAirportDestinations = useCallback(async (query: string) => {
    if (query.length < 1) {
      setAirportSuggestions([]);
      return;
    }

    if (debouncedAirportSearchRef.current) {
      clearTimeout(debouncedAirportSearchRef.current);
    }

    debouncedAirportSearchRef.current = setTimeout(async () => {
      try {
        setLoadingAirportDestinations(true);
        const results = await transfersService.searchDestinations(query);
        // Filter to airports only
        const airports = results.filter(dest => dest.type === "airport");
        setAirportSuggestions(airports);
      } catch (error) {
        console.error("❌ Airport search error:", error);
        setAirportSuggestions([]);
      } finally {
        setLoadingAirportDestinations(false);
      }
    }, 150);
  }, []);

  const searchHotelDestinations = useCallback(async (query: string) => {
    if (query.length < 1) {
      setHotelSuggestions([]);
      return;
    }

    if (debouncedHotelSearchRef.current) {
      clearTimeout(debouncedHotelSearchRef.current);
    }

    debouncedHotelSearchRef.current = setTimeout(async () => {
      try {
        setLoadingHotelDestinations(true);
        const results = await transfersService.searchDestinations(query);
        // Include cities and hotels
        const hotels = results.filter(dest => dest.type === "city" || dest.type === "hotel");
        setHotelSuggestions(hotels);
      } catch (error) {
        console.error("❌ Hotel search error:", error);
        setHotelSuggestions([]);
      } finally {
        setLoadingHotelDestinations(false);
      }
    }, 150);
  }, []);

  // Get icon component for destination type
  const getDestinationIcon = (type: string) => {
    if (type === "airport") {
      return (
        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm">
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </div>
      );
    } else if (type === "city") {
      return (
        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
      );
    } else {
      return (
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
      );
    }
  };

  // Destination selection handlers
  const selectPickupDestination = useCallback((dest: TransferDestination) => {
    const fullName = `${dest.name}, ${dest.country}`;
    setPickupLocation(fullName);
    setPickupLocationCode(dest.code);
    setIsPickupUserTyping(false);
    setPickupInputValue("");
    setIsPickupOpen(false);
  }, []);

  const selectDropoffDestination = useCallback((dest: TransferDestination) => {
    const fullName = `${dest.name}, ${dest.country}`;
    setDropoffLocation(fullName);
    setDropoffLocationCode(dest.code);
    setIsDropoffUserTyping(false);
    setDropoffInputValue("");
    setIsDropoffOpen(false);
  }, []);

  const selectAirportDestination = useCallback((dest: TransferDestination) => {
    const fullName = `${dest.name}, ${dest.country}`;
    setAirport(fullName);
    setAirportCode(dest.code);
    setIsAirportUserTyping(false);
    setAirportInputValue("");
    setIsAirportOpen(false);
  }, []);

  const selectHotelDestination = useCallback((dest: TransferDestination) => {
    const fullName = `${dest.name}, ${dest.country}`;
    setHotel(fullName);
    setHotelCode(dest.code);
    setIsHotelUserTyping(false);
    setHotelInputValue("");
    setIsHotelOpen(false);
  }, []);

  const passengersText = `${passengers.adults} adult${passengers.adults > 1 ? 's' : ''}${passengers.children > 0 ? `, ${passengers.children} child${passengers.children > 1 ? 'ren' : ''}` : ''}${passengers.infants > 0 ? `, ${passengers.infants} infant${passengers.infants > 1 ? 's' : ''}` : ''}`;

  const handleChildrenChange = (newChildren: number) => {
    const currentAges = passengers.childrenAges;
    if (newChildren > currentAges.length) {
      const newAges = [...currentAges];
      for (let i = currentAges.length; i < newChildren; i++) {
        newAges.push(10);
      }
      setPassengers({ ...passengers, children: newChildren, childrenAges: newAges });
    } else {
      setPassengers({ 
        ...passengers, 
        children: newChildren, 
        childrenAges: currentAges.slice(0, newChildren) 
      });
    }
  };

  const handleSearch = () => {
    if (transferMode === "airport") {
      // Airport transport validation
      if (!airport.trim()) {
        setErrorMessage("Please select an airport");
        setShowError(true);
        return;
      }
      
      if (!hotel.trim()) {
        setErrorMessage("Please select a hotel or address");
        setShowError(true);
        return;
      }
      
      if (!pickupDate) {
        setErrorMessage("Please select a date");
        setShowError(true);
        return;
      }

      if (isRoundTrip && !returnDate) {
        setErrorMessage("Please select a return date");
        setShowError(true);
        return;
      }

      // Build airport transport search parameters
      const searchParams = new URLSearchParams({
        mode: "airport",
        airport,
        airportCode,
        hotel,
        hotelCode,
        direction: airportDirection,
        date: pickupDate.toISOString().split('T')[0],
        time: pickupTime,
        adults: passengers.adults.toString(),
        children: passengers.children.toString(),
        infants: passengers.infants.toString(),
        ...(flightNumber && { flightNumber }),
        ...(isRoundTrip && returnDate && {
          returnDate: returnDate.toISOString().split('T')[0],
          returnTime,
        }),
      });

      navigate(`/transfer-results?${searchParams.toString()}`);
    } else {
      // Car rental validation
      if (!pickupLocation.trim()) {
        setErrorMessage("Please select a pickup location");
        setShowError(true);
        return;
      }

      if (!sameAsPickup && !dropoffLocation.trim()) {
        setErrorMessage("Please select a drop-off location");
        setShowError(true);
        return;
      }

      if (!pickupDate) {
        setErrorMessage("Please select pickup date and time");
        setShowError(true);
        return;
      }

      if (!returnDate) {
        setErrorMessage("Please select drop-off date and time");
        setShowError(true);
        return;
      }

      // Build car rental search parameters
      const searchParams = new URLSearchParams({
        mode: "rental",
        pickupLocation,
        dropoffLocation: sameAsPickup ? pickupLocation : dropoffLocation,
        pickupDate: pickupDate.toISOString().split('T')[0],
        pickupTime,
        dropoffDate: returnDate.toISOString().split('T')[0],
        dropoffTime: returnTime,
        adults: passengers.adults.toString(),
        ...(driverAge && { driverAge }),
        ...(vehicleType && vehicleType !== "any" && { vehicleType }),
      });

      navigate(`/transfer-results?${searchParams.toString()}`);
    }
  };

  // Render destination dropdown content
  const renderDestinationDropdown = (
    suggestions: TransferDestination[],
    loading: boolean,
    isUserTyping: boolean,
    inputValue: string,
    onSelect: (dest: TransferDestination) => void
  ) => (
    <div className="max-h-80 overflow-y-auto">
      {!popularDestinationsLoaded ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Loading destinations...</span>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center p-3">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-xs text-gray-600">🔍 Searching...</span>
        </div>
      ) : isUserTyping && inputValue.length > 0 && suggestions.length > 0 ? (
        <div>
          <div className="px-4 py-2 bg-gray-50 border-b">
            <span className="text-xs font-medium text-gray-600">🔍 Search Results</span>
          </div>
          {suggestions.map((dest) => (
            <div
              key={dest.id}
              className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 group"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(dest);
              }}
            >
              <div className="flex items-center justify-center w-8 h-8 mr-3 flex-shrink-0">
                {getDestinationIcon(dest.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm truncate">{dest.name}</span>
                      {dest.popular && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Popular
                        </span>
                      )}
                      {dest.type === "airport" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                          Airport
                        </span>
                      )}
                      {dest.type === "city" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          City
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="capitalize">{dest.type === "airport" ? "Airport" : dest.type}</span>
                      {dest.country && <span> in {dest.country}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">{dest.code}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="px-4 py-2 bg-gray-50 border-b">
            <span className="text-xs font-medium text-gray-600">✈️ Popular Destinations</span>
          </div>
          {popularDestinations.slice(0, 8).map((dest) => (
            <div
              key={dest.id}
              className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 group"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(dest);
              }}
            >
              <div className="flex items-center justify-center w-8 h-8 mr-3 flex-shrink-0">
                {getDestinationIcon(dest.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm truncate">{dest.name}</span>
                      {dest.popular && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Popular
                        </span>
                      )}
                      {dest.type === "airport" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                          Airport
                        </span>
                      )}
                      {dest.type === "city" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          City
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="capitalize">{dest.type === "airport" ? "Airport" : dest.type}</span>
                      {dest.country && <span> in {dest.country}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">{dest.code}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
        {/* Sub-tabs for Transfer Mode */}
        <div className="flex items-center space-x-4 mb-4 border-b border-gray-200 pb-3">
          <button
            onClick={() => setTransferMode("airport")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              transferMode === "airport"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>Airport transport</span>
          </button>
          <button
            onClick={() => setTransferMode("rental")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              transferMode === "rental"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Car rentals</span>
          </button>
        </div>

        {transferMode === "airport" ? (
          <>
            {/* Airport Transport Quick Toggles */}
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => setAirportDirection("airport-to-hotel")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  airportDirection === "airport-to-hotel"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <Plane className="w-4 h-4" />
                <ArrowRightLeft className="w-3 h-3" />
                <Hotel className="w-4 h-4" />
                <span>Airport → Hotel</span>
              </button>
              <button
                onClick={() => setAirportDirection("hotel-to-airport")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  airportDirection === "hotel-to-airport"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <Hotel className="w-4 h-4" />
                <ArrowRightLeft className="w-3 h-3" />
                <Plane className="w-4 h-4" />
                <span>Hotel → Airport</span>
              </button>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isRoundTrip}
                  onChange={(e) => setIsRoundTrip(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-800">Return</span>
              </label>
            </div>

            {/* Airport Transport Search Form */}
            <div className="flex flex-col lg:flex-row gap-2 mb-4">
              {/* Airport Field */}
              <div className="flex-1 lg:max-w-[240px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Airport
                </label>
                <Popover open={isAirportOpen} onOpenChange={setIsAirportOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                      <Input
                        type="text"
                        value={isAirportUserTyping ? airportInputValue : airport || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAirportInputValue(value);
                          setIsAirportUserTyping(true);
                          if (!isAirportOpen) setIsAirportOpen(true);
                          searchAirportDestinations(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          setIsAirportOpen(true);
                          if (!isAirportUserTyping && airport) {
                            setAirportInputValue(airport);
                            setIsAirportUserTyping(true);
                          }
                        }}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation"
                        placeholder="Airport"
                        autoComplete="off"
                      />
                      {(airport || (isAirportUserTyping && airportInputValue)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAirport("");
                            setAirportInputValue("");
                            setIsAirportUserTyping(false);
                            setAirportCode("");
                            setIsAirportOpen(false);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 sm:w-[480px] p-0 border border-gray-200 shadow-2xl rounded-lg" align="start">
                    {renderDestinationDropdown(
                      airportSuggestions,
                      loadingAirportDestinations,
                      isAirportUserTyping,
                      airportInputValue,
                      selectAirportDestination
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Hotel/Address Field */}
              <div className="flex-1 lg:max-w-[240px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Hotel / Address
                </label>
                <Popover open={isHotelOpen} onOpenChange={setIsHotelOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <Hotel className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                      <Input
                        type="text"
                        value={isHotelUserTyping ? hotelInputValue : hotel || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setHotelInputValue(value);
                          setIsHotelUserTyping(true);
                          if (!isHotelOpen) setIsHotelOpen(true);
                          searchHotelDestinations(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          setIsHotelOpen(true);
                          if (!isHotelUserTyping && hotel) {
                            setHotelInputValue(hotel);
                            setIsHotelUserTyping(true);
                          }
                        }}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation"
                        placeholder="Hotel / address"
                        autoComplete="off"
                      />
                      {(hotel || (isHotelUserTyping && hotelInputValue)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setHotel("");
                            setHotelInputValue("");
                            setIsHotelUserTyping(false);
                            setHotelCode("");
                            setIsHotelOpen(false);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 sm:w-[480px] p-0 border border-gray-200 shadow-2xl rounded-lg" align="start">
                    {renderDestinationDropdown(
                      hotelSuggestions,
                      loadingHotelDestinations,
                      isHotelUserTyping,
                      hotelInputValue,
                      selectHotelDestination
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Picker */}
              <div className="flex-1 lg:max-w-[160px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  {isRoundTrip ? "Dates" : "Date"}
                </label>
                {isMobile ? (
                  <button
                    onClick={() => setShowMobileDatePicker(true)}
                    className="w-full h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="truncate">
                      {pickupDate ? format(pickupDate, "dd MMM") : "Select date"}
                      {isRoundTrip && returnDate && ` - ${format(returnDate, "dd MMM")}`}
                    </span>
                  </button>
                ) : (
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button className="w-full h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left">
                        <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="truncate">
                          {pickupDate ? format(pickupDate, "dd MMM") : "Select date"}
                          {isRoundTrip && returnDate && ` - ${format(returnDate, "dd MMM")}`}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <BookingCalendar
                        mode="single"
                        selected={pickupDate}
                        onSelect={setPickupDate}
                        disabled={(date) => date < new Date()}
                      />
                      {isRoundTrip && (
                        <div className="p-3 border-t">
                          <BookingCalendar
                            mode="single"
                            selected={returnDate}
                            onSelect={setReturnDate}
                            disabled={(date) => date < new Date() || (pickupDate && date <= pickupDate)}
                          />
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Time Picker */}
              <div className="flex-1 lg:max-w-[100px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Time
                </label>
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Passengers */}
              <div className="flex-1 lg:max-w-[160px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Passengers
                </label>
                <Popover open={isPassengerPopoverOpen} onOpenChange={setIsPassengerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left">
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="truncate">{passengersText}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Adults</label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPassengers({ ...passengers, adults: Math.max(1, passengers.adults - 1) })}
                            disabled={passengers.adults <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{passengers.adults}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPassengers({ ...passengers, adults: passengers.adults + 1 })}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Children (2-11 years)</label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChildrenChange(Math.max(0, passengers.children - 1))}
                            disabled={passengers.children <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{passengers.children}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChildrenChange(passengers.children + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Infants (0-2 years)</label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPassengers({ ...passengers, infants: Math.max(0, passengers.infants - 1) })}
                            disabled={passengers.infants <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{passengers.infants}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPassengers({ ...passengers, infants: passengers.infants + 1 })}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search Button */}
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden invisible">
                  Search
                </label>
                <Button
                  onClick={handleSearch}
                  className="w-full lg:w-auto h-10 sm:h-12 bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 font-bold text-xs sm:text-sm touch-manipulation"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Flight Number (Optional) */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-xs">
                <Input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="Flight number (optional)"
                  className="h-8 border-gray-300 text-sm"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Car Rental Search Form */}
            <div className="flex flex-col lg:flex-row gap-2 mb-4">
              {/* Pickup Location */}
              <div className="flex-1 lg:max-w-[240px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Pick-up location
                </label>
                <Popover open={isPickupOpen} onOpenChange={setIsPickupOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                      <Input
                        type="text"
                        value={isPickupUserTyping ? pickupInputValue : pickupLocation || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPickupInputValue(value);
                          setIsPickupUserTyping(true);
                          if (!isPickupOpen) setIsPickupOpen(true);
                          searchPickupDestinations(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          setIsPickupOpen(true);
                          if (!isPickupUserTyping && pickupLocation) {
                            setPickupInputValue(pickupLocation);
                            setIsPickupUserTyping(true);
                          }
                        }}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation"
                        placeholder="Pick-up location"
                        autoComplete="off"
                      />
                      {(pickupLocation || (isPickupUserTyping && pickupInputValue)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickupLocation("");
                            setPickupInputValue("");
                            setIsPickupUserTyping(false);
                            setPickupLocationCode("");
                            setIsPickupOpen(false);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 sm:w-[480px] p-0 border border-gray-200 shadow-2xl rounded-lg" align="start">
                    {renderDestinationDropdown(
                      pickupSuggestions,
                      loadingPickupDestinations,
                      isPickupUserTyping,
                      pickupInputValue,
                      selectPickupDestination
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Drop-off Location */}
              <div className="flex-1 lg:max-w-[240px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Drop-off location
                </label>
                <Popover open={isDropoffOpen} onOpenChange={setIsDropoffOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                      <Input
                        type="text"
                        value={isDropoffUserTyping ? dropoffInputValue : dropoffLocation || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDropoffInputValue(value);
                          setIsDropoffUserTyping(true);
                          if (sameAsPickup) setSameAsPickup(false);
                          if (!isDropoffOpen) setIsDropoffOpen(true);
                          searchDropoffDestinations(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          if (!sameAsPickup) {
                            setIsDropoffOpen(true);
                            if (!isDropoffUserTyping && dropoffLocation) {
                              setDropoffInputValue(dropoffLocation);
                              setIsDropoffUserTyping(true);
                            }
                          }
                        }}
                        disabled={sameAsPickup}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder={sameAsPickup ? "Same as pick-up" : "Drop-off location"}
                        autoComplete="off"
                      />
                      {(dropoffLocation || (isDropoffUserTyping && dropoffInputValue)) && !sameAsPickup && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropoffLocation("");
                            setDropoffInputValue("");
                            setIsDropoffUserTyping(false);
                            setDropoffLocationCode("");
                            setIsDropoffOpen(false);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </PopoverTrigger>
                  {!sameAsPickup && (
                    <PopoverContent className="w-80 sm:w-[480px] p-0 border border-gray-200 shadow-2xl rounded-lg" align="start">
                      {renderDestinationDropdown(
                        dropoffSuggestions,
                        loadingDropoffDestinations,
                        isDropoffUserTyping,
                        dropoffInputValue,
                        selectDropoffDestination
                      )}
                    </PopoverContent>
                  )}
                </Popover>
              </div>

              {/* Pickup Date & Time */}
              <div className="flex-1 lg:max-w-[160px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Pick-up date
                </label>
                {isMobile ? (
                  <button
                    onClick={() => setShowMobileDatePicker(true)}
                    className="w-full h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="truncate">
                      {pickupDate ? format(pickupDate, "dd MMM") : "Pick-up date"}
                    </span>
                  </button>
                ) : (
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button className="w-full h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left">
                        <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="truncate">
                          {pickupDate ? format(pickupDate, "dd MMM") : "Pick-up date"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <BookingCalendar
                        mode="single"
                        selected={pickupDate}
                        onSelect={setPickupDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Drop-off Date & Time */}
              <div className="flex-1 lg:max-w-[160px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Drop-off date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="truncate">
                        {returnDate ? format(returnDate, "dd MMM") : "Drop-off date"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <BookingCalendar
                      mode="single"
                      selected={returnDate}
                      onSelect={setReturnDate}
                      disabled={(date) => date < new Date() || (pickupDate && date <= pickupDate)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Times */}
              <div className="flex-1 lg:max-w-[100px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Time
                </label>
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden invisible">
                  Search
                </label>
                <Button
                  onClick={handleSearch}
                  className="w-full lg:w-auto h-10 sm:h-12 bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 font-bold text-xs sm:text-sm touch-manipulation"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Additional Options Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Same as pickup checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="same-as-pickup"
                  checked={sameAsPickup}
                  onCheckedChange={(checked) => setSameAsPickup(!!checked)}
                />
                <label htmlFor="same-as-pickup" className="text-sm text-gray-700">
                  Drop-off at same location
                </label>
              </div>

              {/* Driver Age */}
              <div className="flex-1 max-w-xs">
                <Select value={driverAge} onValueChange={setDriverAge}>
                  <SelectTrigger className="h-8 border-gray-300 text-sm">
                    <Users className="w-4 h-4 mr-2 text-gray-600" />
                    <SelectValue placeholder="Driver age (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {driverAgeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Type */}
              <div className="flex-1 max-w-xs">
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="h-8 border-gray-300 text-sm">
                    <Car className="w-4 h-4 mr-2 text-gray-600" />
                    <SelectValue placeholder="Vehicle type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {transferOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Date Picker */}
      {showMobileDatePicker && (
        <MobileDatePicker
          isOpen={showMobileDatePicker}
          onClose={() => setShowMobileDatePicker(false)}
          tripType={isRoundTrip ? "round-trip" : "one-way"}
          setTripType={(type: string) => setIsRoundTrip(type === "round-trip")}
          selectedDepartureDate={pickupDate}
          selectedReturnDate={returnDate}
          setSelectedDepartureDate={setPickupDate}
          setSelectedReturnDate={setReturnDate}
          selectingDeparture={true}
          setSelectingDeparture={() => {}}
          bookingType="transfers"
        />
      )}
    </>
  );
}
