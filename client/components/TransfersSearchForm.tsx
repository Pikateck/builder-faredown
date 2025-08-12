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
  
  // Car rental states (for future implementation)
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
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const totalMinutes = i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    return {
      value: timeString,
      label: timeString,
    };
  });

  // Passenger text
  const passengersText = `${passengers.adults} adult${passengers.adults !== 1 ? "s" : ""}${
    passengers.children > 0 ? `, ${passengers.children} child${passengers.children !== 1 ? "ren" : ""}` : ""
  }${passengers.infants > 0 ? `, ${passengers.infants} infant${passengers.infants !== 1 ? "s" : ""}` : ""}`;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load popular destinations on mount
  useEffect(() => {
    const loadPopularDestinations = async () => {
      try {
        const destinations = await transfersService.searchDestinations("");
        setPopularDestinations(destinations);
        setPopularDestinationsLoaded(true);
      } catch (error) {
        console.error("Failed to load popular destinations:", error);
        setPopularDestinationsLoaded(true);
      }
    };

    loadPopularDestinations();
  }, []);

  // Debounced search functions
  const searchPickupDestinations = useCallback(async (query: string) => {
    if (debouncedPickupSearchRef.current) {
      clearTimeout(debouncedPickupSearchRef.current);
    }

    debouncedPickupSearchRef.current = setTimeout(async () => {
      if (query.length === 0) {
        setPickupSuggestions(popularDestinations);
        return;
      }

      setLoadingPickupDestinations(true);
      try {
        const destinations = await transfersService.searchDestinations(query);
        setPickupSuggestions(destinations);
      } catch (error) {
        console.error("Pickup destinations search failed:", error);
        setPickupSuggestions(popularDestinations);
      } finally {
        setLoadingPickupDestinations(false);
      }
    }, 150);
  }, [popularDestinations]);

  const searchDropoffDestinations = useCallback(async (query: string) => {
    if (debouncedDropoffSearchRef.current) {
      clearTimeout(debouncedDropoffSearchRef.current);
    }

    debouncedDropoffSearchRef.current = setTimeout(async () => {
      if (query.length === 0) {
        setDropoffSuggestions(popularDestinations);
        return;
      }

      setLoadingDropoffDestinations(true);
      try {
        const destinations = await transfersService.searchDestinations(query);
        setDropoffSuggestions(destinations);
      } catch (error) {
        console.error("Dropoff destinations search failed:", error);
        setDropoffSuggestions(popularDestinations);
      } finally {
        setLoadingDropoffDestinations(false);
      }
    }, 150);
  }, [popularDestinations]);

  const searchAirportDestinations = useCallback(async (query: string) => {
    if (debouncedAirportSearchRef.current) {
      clearTimeout(debouncedAirportSearchRef.current);
    }

    debouncedAirportSearchRef.current = setTimeout(async () => {
      if (query.length === 0) {
        setAirportSuggestions(popularDestinations.filter(dest => dest.type === "airport"));
        return;
      }

      setLoadingAirportDestinations(true);
      try {
        const destinations = await transfersService.searchDestinations(query);
        setAirportSuggestions(destinations.filter(dest => dest.type === "airport"));
      } catch (error) {
        console.error("Airport destinations search failed:", error);
        setAirportSuggestions(popularDestinations.filter(dest => dest.type === "airport"));
      } finally {
        setLoadingAirportDestinations(false);
      }
    }, 150);
  }, [popularDestinations]);

  const searchHotelDestinations = useCallback(async (query: string) => {
    if (debouncedHotelSearchRef.current) {
      clearTimeout(debouncedHotelSearchRef.current);
    }

    debouncedHotelSearchRef.current = setTimeout(async () => {
      if (query.length === 0) {
        setHotelSuggestions(popularDestinations.filter(dest => dest.type === "city" || dest.type === "hotel"));
        return;
      }

      setLoadingHotelDestinations(true);
      try {
        const destinations = await transfersService.searchDestinations(query);
        setHotelSuggestions(destinations.filter(dest => dest.type === "city" || dest.type === "hotel"));
      } catch (error) {
        console.error("Hotel destinations search failed:", error);
        setHotelSuggestions(popularDestinations.filter(dest => dest.type === "city" || dest.type === "hotel"));
      } finally {
        setLoadingHotelDestinations(false);
      }
    }, 150);
  }, [popularDestinations]);

  // Initialize dropdown suggestions when opened
  useEffect(() => {
    if (isPickupOpen && pickupSuggestions.length === 0) {
      setPickupSuggestions(popularDestinations);
    }
  }, [isPickupOpen, pickupSuggestions.length, popularDestinations]);

  useEffect(() => {
    if (isDropoffOpen && dropoffSuggestions.length === 0) {
      setDropoffSuggestions(popularDestinations);
    }
  }, [isDropoffOpen, dropoffSuggestions.length, popularDestinations]);

  useEffect(() => {
    if (isAirportOpen && airportSuggestions.length === 0) {
      setAirportSuggestions(popularDestinations.filter(dest => dest.type === "airport"));
    }
  }, [isAirportOpen, airportSuggestions.length, popularDestinations]);

  useEffect(() => {
    if (isHotelOpen && hotelSuggestions.length === 0) {
      setHotelSuggestions(popularDestinations.filter(dest => dest.type === "city" || dest.type === "hotel"));
    }
  }, [isHotelOpen, hotelSuggestions.length, popularDestinations]);

  // Handle form submission
  const handleSearch = () => {
    setShowError(false);

    if (transferMode === "airport") {
      // Airport transport validation
      if (!airport.trim()) {
        setErrorMessage("Please select an airport");
        setShowError(true);
        return;
      }

      if (!hotel.trim()) {
        setErrorMessage("Please select a hotel or destination");
        setShowError(true);
        return;
      }

      if (!pickupDate) {
        setErrorMessage("Please select a date and time");
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
      // Car rental validation (placeholder for future implementation)
      setErrorMessage("Car rental feature coming soon!");
      setShowError(true);
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
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(dest);
              }}
              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                {dest.type === "airport" ? (
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-md flex items-center justify-center">
                    <Plane className="w-3 h-3 text-white" />
                  </div>
                ) : dest.type === "city" ? (
                  <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-md flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                ) : dest.type === "hotel" ? (
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md flex items-center justify-center">
                    <Hotel className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-md flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {dest.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {dest.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div>
          <div className="px-4 py-2 bg-gray-50 border-b">
            <span className="text-xs font-medium text-gray-600">🌟 Popular Destinations</span>
          </div>
          {suggestions.slice(0, 8).map((dest) => (
            <div
              key={dest.id}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(dest);
              }}
              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                {dest.type === "airport" ? (
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-md flex items-center justify-center">
                    <Plane className="w-3 h-3 text-white" />
                  </div>
                ) : dest.type === "city" ? (
                  <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-md flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                ) : dest.type === "hotel" ? (
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md flex items-center justify-center">
                    <Hotel className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-md flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {dest.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {dest.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <div className="text-gray-500 text-sm">No destinations found</div>
          <div className="text-xs text-gray-400 mt-1">Try a different search term</div>
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
      <div className="bg-white rounded-lg p-2 sm:p-3 shadow-lg max-w-6xl mx-auto border border-gray-200">
        {/* Sub-tabs for Transfer Mode */}
        <div className="flex items-center space-x-4 mb-3 border-b border-gray-200 pb-2">
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
            {/* Direction toggles */}
            <div className="flex items-center space-x-2 mb-3">
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
            <div className="flex flex-col lg:flex-row gap-2 mb-3">
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
                        className="pl-10 pr-8 h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation"
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
                      (dest) => {
                        setAirport(dest.name);
                        setAirportCode(dest.code);
                        setAirportInputValue(dest.name);
                        setIsAirportUserTyping(false);
                        setIsAirportOpen(false);
                      }
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Hotel Field */}
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
                        className="pl-10 pr-8 h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation"
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
                      (dest) => {
                        setHotel(dest.name);
                        setHotelCode(dest.code);
                        setHotelInputValue(dest.name);
                        setIsHotelUserTyping(false);
                        setIsHotelOpen(false);
                      }
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date */}
              <div className="flex-1 lg:max-w-[140px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Date
                </label>
                {isMobile ? (
                  <button
                    onClick={() => setShowMobileDatePicker(true)}
                    className="w-full h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="truncate">
                      {pickupDate ? format(pickupDate, "dd MMM") : "Date"}
                    </span>
                  </button>
                ) : (
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button className="w-full h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left">
                        <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="truncate">
                          {pickupDate ? format(pickupDate, "dd MMM") : "Date"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <BookingCalendar
                        mode="single"
                        selected={pickupDate}
                        onSelect={(date) => {
                          setPickupDate(date);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        numberOfMonths={1}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Time */}
              <div className="flex-1 lg:max-w-[100px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
                  Time
                </label>
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger className="h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation">
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
                    <button className="w-full h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left">
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
                            onClick={() => setPassengers({ ...passengers, children: Math.max(0, passengers.children - 1) })}
                            disabled={passengers.children <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{passengers.children}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPassengers({ ...passengers, children: passengers.children + 1 })}
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
                      <Button
                        onClick={() => setIsPassengerPopoverOpen(false)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Done
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search Button */}
              <div className="flex-shrink-0">
                <Button
                  onClick={handleSearch}
                  className="h-9 sm:h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded touch-manipulation transition-colors"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Return Date Row (only for round trip) */}
            {isRoundTrip && (
              <div className="flex flex-col lg:flex-row gap-2 mb-3">
                <div className="flex-1 lg:max-w-[240px]">
                  <label className="text-xs font-medium text-gray-800 mb-1 block">
                    Return Date
                  </label>
                  {isMobile ? (
                    <button
                      onClick={() => setShowMobileDatePicker(true)}
                      className="w-full h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="truncate">
                        {returnDate ? format(returnDate, "dd MMM") : "Return Date"}
                      </span>
                    </button>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation flex items-center justify-center text-left">
                          <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="truncate">
                            {returnDate ? format(returnDate, "dd MMM") : "Return Date"}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <BookingCalendar
                          mode="single"
                          selected={returnDate}
                          onSelect={setReturnDate}
                          initialFocus
                          disabled={(date) => !pickupDate || date <= pickupDate}
                          numberOfMonths={1}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="flex-1 lg:max-w-[100px]">
                  <label className="text-xs font-medium text-gray-800 mb-1 block">
                    Return Time
                  </label>
                  <Select value={returnTime} onValueChange={setReturnTime}>
                    <SelectTrigger className="h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation">
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
              </div>
            )}

            {/* Flight Number (Optional) */}
            <div className="flex flex-col lg:flex-row gap-2">
              <div className="flex-1 lg:max-w-[240px]">
                <label className="text-xs font-medium text-gray-800 mb-1 block">
                  Flight Number (Optional)
                </label>
                <Input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="h-9 sm:h-10 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation"
                  placeholder="e.g. AI 131"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Car Rental Coming Soon */}
            <div className="text-center py-8">
              <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Car Rentals Coming Soon
              </h3>
              <p className="text-gray-600 mb-4">
                We're working on adding car rental services to our platform
              </p>
              <Button
                onClick={() => setTransferMode("airport")}
                variant="outline"
                className="text-blue-600 border-blue-600"
              >
                Try Airport Transport
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Date Picker */}
      {showMobileDatePicker && (
        <MobileDatePicker
          selectedDate={pickupDate}
          onDateSelect={(date) => {
            setPickupDate(date);
            setShowMobileDatePicker(false);
          }}
          onClose={() => setShowMobileDatePicker(false)}
          title="Select Travel Date"
        />
      )}
    </>
  );
}
