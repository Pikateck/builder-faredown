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
import {
  transfersService,
  TransferDestination,
} from "@/services/transfersService";

interface PassengerConfig {
  adults: number;
  children: number;
  childrenAges: number[];
  infants: number;
}

type TransferMode = "airport" | "rental";
type AirportDirection = "airport-to-hotel" | "hotel-to-airport" | "return";

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Mode state - Airport taxi (default) | Car rentals
  const [transferMode, setTransferMode] = useState<TransferMode>("airport");

  // Airport taxi states
  const [airportDirection, setAirportDirection] =
    useState<AirportDirection>("airport-to-hotel");
  const [airport, setAirport] = useState("Mumbai Airport (BOM)");
  const [airportCode, setAirportCode] = useState("");
  const [hotel, setHotel] = useState("Hotel Taj Mahal Palace");
  const [hotelCode, setHotelCode] = useState("");
  const [flightNumber, setFlightNumber] = useState("");

  // Car rental states
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupLocationCode, setPickupLocationCode] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [dropoffLocationCode, setDropoffLocationCode] = useState("");
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [driverAge, setDriverAge] = useState("any");
  const [vehicleType, setVehicleType] = useState("any");

  // Location dropdown states
  const [isAirportOpen, setIsAirportOpen] = useState(false);
  const [isHotelOpen, setIsHotelOpen] = useState(false);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDropoffOpen, setIsDropoffOpen] = useState(false);
  const [airportSuggestions, setAirportSuggestions] = useState<
    TransferDestination[]
  >([]);
  const [hotelSuggestions, setHotelSuggestions] = useState<
    TransferDestination[]
  >([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<
    TransferDestination[]
  >([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<
    TransferDestination[]
  >([]);
  const [loadingAirportDestinations, setLoadingAirportDestinations] =
    useState(false);
  const [loadingHotelDestinations, setLoadingHotelDestinations] =
    useState(false);
  const [loadingPickupDestinations, setLoadingPickupDestinations] =
    useState(false);
  const [loadingDropoffDestinations, setLoadingDropoffDestinations] =
    useState(false);

  // User typing states
  const [isAirportUserTyping, setIsAirportUserTyping] = useState(false);
  const [isHotelUserTyping, setIsHotelUserTyping] = useState(false);
  const [isPickupUserTyping, setIsPickupUserTyping] = useState(false);
  const [isDropoffUserTyping, setIsDropoffUserTyping] = useState(false);
  const [airportInputValue, setAirportInputValue] = useState("");
  const [hotelInputValue, setHotelInputValue] = useState("");
  const [pickupInputValue, setPickupInputValue] = useState("");
  const [dropoffInputValue, setDropoffInputValue] = useState("");

  // Date and time states
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const returnDefault = new Date();
  returnDefault.setDate(returnDefault.getDate() + 4);
  returnDefault.setHours(14, 0, 0, 0);

  const [pickupDate, setPickupDate] = useState<Date | undefined>(tomorrow);
  const [dropoffDate, setDropoffDate] = useState<Date | undefined>(
    returnDefault,
  );
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropoffTime, setDropoffTime] = useState("14:00");
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState("14:00");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isPickupDateOpen, setIsPickupDateOpen] = useState(false);
  const [isDropoffDateOpen, setIsDropoffDateOpen] = useState(false);
  const [calendarRange, setCalendarRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  // Passenger states
  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 2,
    children: 0,
    childrenAges: [],
    infants: 0,
  });
  const [isPassengerPopoverOpen, setIsPassengerPopoverOpen] = useState(false);

  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);

  // Debounced search refs
  const debouncedAirportSearchRef = useRef<NodeJS.Timeout>();
  const debouncedHotelSearchRef = useRef<NodeJS.Timeout>();
  const debouncedPickupSearchRef = useRef<NodeJS.Timeout>();
  const debouncedDropoffSearchRef = useRef<NodeJS.Timeout>();

  // Time options
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    return { value: time, label: time };
  });

  // Vehicle type options for car rentals
  const vehicleOptions = [
    { value: "any", label: "Any vehicle type" },
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "minivan", label: "Minivan" },
    { value: "luxury", label: "Luxury Car" },
  ];

  // Driver age options
  const driverAgeOptions = [
    { value: "any", label: "Select age" },
    { value: "25-29", label: "25-29" },
    { value: "30-65", label: "30-65" },
    { value: "65+", label: "65+" },
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

  // Popular destinations for initial display
  const popularAirports = [
    { id: "BOM", code: "BOM", name: "Mumbai Airport", type: "airport" },
    { id: "DEL", code: "DEL", name: "Delhi Airport", type: "airport" },
    { id: "BLR", code: "BLR", name: "Bangalore Airport", type: "airport" },
    { id: "MAA", code: "MAA", name: "Chennai Airport", type: "airport" },
    { id: "HYD", code: "HYD", name: "Hyderabad Airport", type: "airport" },
    { id: "CCU", code: "CCU", name: "Kolkata Airport", type: "airport" },
  ];

  const popularHotels = [
    {
      id: "mumbai-taj",
      code: "mumbai-taj",
      name: "Hotel Taj Mahal Palace",
      type: "hotel",
    },
    {
      id: "mumbai-oberoi",
      code: "mumbai-oberoi",
      name: "The Oberoi Mumbai",
      type: "hotel",
    },
    {
      id: "mumbai-trident",
      code: "mumbai-trident",
      name: "Trident Hotel Mumbai",
      type: "hotel",
    },
    {
      id: "mumbai-city",
      code: "mumbai-city",
      name: "Mumbai City Center",
      type: "city",
    },
    {
      id: "mumbai-bandra",
      code: "mumbai-bandra",
      name: "Bandra West",
      type: "city",
    },
    {
      id: "mumbai-andheri",
      code: "mumbai-andheri",
      name: "Andheri East",
      type: "city",
    },
  ];

  // Search destinations (debounced)
  const searchDestinations = useCallback(
    async (query: string, type: "airport" | "hotel" | "pickup" | "dropoff") => {
      const setSuggestions =
        type === "airport"
          ? setAirportSuggestions
          : type === "hotel"
            ? setHotelSuggestions
            : type === "pickup"
              ? setPickupSuggestions
              : setDropoffSuggestions;

      const setLoading =
        type === "airport"
          ? setLoadingAirportDestinations
          : type === "hotel"
            ? setLoadingHotelDestinations
            : type === "pickup"
              ? setLoadingPickupDestinations
              : setLoadingDropoffDestinations;

      // If no query or very short, show popular destinations
      if (query.length < 2) {
        if (type === "airport") {
          setSuggestions(popularAirports);
        } else if (type === "hotel") {
          setSuggestions(popularHotels);
        } else {
          setSuggestions([...popularAirports, ...popularHotels]);
        }
        return;
      }

      try {
        setLoading(true);
        const results = await transfersService.searchDestinations(query);

        // Filter results based on type
        const filteredResults = results.filter((dest) => {
          if (type === "airport") return dest.type === "airport";
          if (type === "hotel")
            return dest.type === "hotel" || dest.type === "city";
          return true; // pickup/dropoff can be any type
        });

        setSuggestions(filteredResults);
      } catch (error) {
        console.error("Error searching destinations:", error);
        // Show popular destinations as fallback
        if (type === "airport") {
          setSuggestions(popularAirports);
        } else if (type === "hotel") {
          setSuggestions(popularHotels);
        } else {
          setSuggestions([...popularAirports, ...popularHotels]);
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounced search functions
  const debouncedAirportSearch = useCallback(
    (query: string) => {
      if (debouncedAirportSearchRef.current) {
        clearTimeout(debouncedAirportSearchRef.current);
      }
      debouncedAirportSearchRef.current = setTimeout(() => {
        searchDestinations(query, "airport");
      }, 150);
    },
    [searchDestinations],
  );

  const debouncedHotelSearch = useCallback(
    (query: string) => {
      if (debouncedHotelSearchRef.current) {
        clearTimeout(debouncedHotelSearchRef.current);
      }
      debouncedHotelSearchRef.current = setTimeout(() => {
        searchDestinations(query, "hotel");
      }, 150);
    },
    [searchDestinations],
  );

  const debouncedPickupSearch = useCallback(
    (query: string) => {
      if (debouncedPickupSearchRef.current) {
        clearTimeout(debouncedPickupSearchRef.current);
      }
      debouncedPickupSearchRef.current = setTimeout(() => {
        searchDestinations(query, "pickup");
      }, 150);
    },
    [searchDestinations],
  );

  const debouncedDropoffSearch = useCallback(
    (query: string) => {
      if (debouncedDropoffSearchRef.current) {
        clearTimeout(debouncedDropoffSearchRef.current);
      }
      debouncedDropoffSearchRef.current = setTimeout(() => {
        searchDestinations(query, "dropoff");
      }, 150);
    },
    [searchDestinations],
  );

  // Handle calendar date selection (similar to booking.com)
  const handleDateSelect = (date: Date, isStart: boolean = true) => {
    if (isStart) {
      // First click - set start date
      setPickupDate(date);
      setCalendarRange({ start: date, end: null });

      // For car rentals, automatically set end date to 3 days later
      if (transferMode === "rental") {
        const endDate = addDays(date, 3);
        setDropoffDate(endDate);
        setCalendarRange({ start: date, end: endDate });
        setIsPickupDateOpen(false);
        setIsDropoffDateOpen(false);
      } else {
        // For airport taxi, just set the date and close
        setIsPickupDateOpen(false);
      }
    } else {
      // Second click - set end date
      setDropoffDate(date);
      setCalendarRange(prev => ({ ...prev, end: date }));
      setIsDropoffDateOpen(false);
    }
  };

  const handlePickupDateClick = () => {
    setIsPickupDateOpen(!isPickupDateOpen);
    setIsDropoffDateOpen(false);
    if (pickupDate) {
      setCalendarRange({ start: pickupDate, end: dropoffDate || null });
    }
  };

  const handleDropoffDateClick = () => {
    setIsDropoffDateOpen(!isDropoffDateOpen);
    setIsPickupDateOpen(false);
    if (pickupDate) {
      setCalendarRange({ start: pickupDate, end: dropoffDate || null });
    }
  };

  // Handle search submission
  const handleSearch = () => {
    if (transferMode === "airport") {
      if (!airport || !hotel) {
        setErrorMessage("Please select both airport and hotel/address");
        setShowError(true);
        return;
      }
    } else {
      if (!pickupLocation || (!sameAsPickup && !dropoffLocation)) {
        setErrorMessage("Please select pickup and drop-off locations");
        setShowError(true);
        return;
      }
    }

    if (!pickupDate) {
      setErrorMessage("Please select a date");
      setShowError(true);
      return;
    }

    navigate("/transfer-results");
  };

  // Passenger summary
  const passengerSummary = () => {
    const parts = [];
    parts.push(`${passengers.adults} adult${passengers.adults > 1 ? "s" : ""}`);
    if (passengers.children > 0) {
      parts.push(
        `${passengers.children} child${passengers.children > 1 ? "ren" : ""}`,
      );
    }
    if (passengers.infants > 0) {
      parts.push(
        `${passengers.infants} infant${passengers.infants > 1 ? "s" : ""}`,
      );
    }
    return parts.join(" • ");
  };

  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      {/* Container matching Hotels exactly - px-3 py-3 (desktop), px-2 py-2 (mobile) */}
      <div className="w-full mx-auto rounded-2xl bg-white shadow-md border border-slate-200 px-2 py-2 md:px-3 md:py-3 max-w-screen-xl">
        {/* Mode Segmented Control - h-8, text-sm, px-3, mb-2 */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setTransferMode("airport")}
            className={cn(
              "h-8 text-xs sm:text-sm px-3 rounded-md font-medium transition-colors",
              transferMode === "airport"
                ? "bg-blue-600 text-white border border-blue-600"
                : "text-slate-600 hover:text-slate-900 border border-transparent",
            )}
          >
            Airport taxi
          </button>
          <button
            onClick={() => setTransferMode("rental")}
            className={cn(
              "h-8 text-xs sm:text-sm px-3 rounded-md font-medium transition-colors",
              transferMode === "rental"
                ? "bg-blue-600 text-white border border-blue-600"
                : "text-slate-600 hover:text-slate-900 border border-transparent",
            )}
          >
            Car rentals
          </button>
        </div>

        {/* Airport Taxi Mode */}
        {transferMode === "airport" && (
          <>
            {/* Direction Toggles - h-8, text-sm, px-3, mb-2 */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setAirportDirection("airport-to-hotel")}
                className={cn(
                  "h-8 text-xs sm:text-sm px-3 rounded-full font-medium border transition-colors",
                  airportDirection === "airport-to-hotel"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400",
                )}
              >
                Airport → Hotel
              </button>
              <button
                onClick={() => setAirportDirection("hotel-to-airport")}
                className={cn(
                  "h-8 text-xs sm:text-sm px-3 rounded-full font-medium border transition-colors",
                  airportDirection === "hotel-to-airport"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400",
                )}
              >
                Hotel → Airport
              </button>
              <button
                onClick={() => setAirportDirection("return")}
                className={cn(
                  "h-8 text-xs sm:text-sm px-3 rounded-full font-medium border transition-colors",
                  airportDirection === "return"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400",
                )}
              >
                Return
              </button>
            </div>

            {/* Main Search Form - gap-2 (mobile) / gap-3 (md+) */}
            <div className="flex flex-col lg:flex-row gap-2 md:gap-3">
              {/* Airport Field */}
              <div className="flex-1 lg:max-w-[200px] relative">
                <Popover open={isAirportOpen} onOpenChange={setIsAirportOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                      <Input
                        type="text"
                        value={
                          isAirportUserTyping
                            ? airportInputValue
                            : airport || ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setAirportInputValue(value);
                          setIsAirportUserTyping(true);
                          if (!isAirportOpen) {
                            setIsAirportOpen(true);
                          }
                          debouncedAirportSearch(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          if (!isAirportUserTyping && airport) {
                            setAirportInputValue(airport);
                            setIsAirportUserTyping(true);
                          }
                          // Show popular destinations on focus
                          if (airportSuggestions.length === 0) {
                            searchDestinations("", "airport");
                          }
                          setIsAirportOpen(true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAirportOpen) {
                            setIsAirportOpen(true);
                            // Show popular destinations when opening
                            if (airportSuggestions.length === 0) {
                              searchDestinations("", "airport");
                            }
                          }
                        }}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm touch-manipulation relative z-10"
                        placeholder="Departure airport"
                        autoComplete="off"
                      />
                      {(airport ||
                        (isAirportUserTyping && airportInputValue)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAirport("");
                            setAirportInputValue("");
                            setIsAirportUserTyping(false);
                            setAirportCode("");
                            setIsAirportOpen(false);
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-0 border shadow-lg z-50"
                    align="start"
                    side="bottom"
                    sideOffset={5}
                    onInteractOutside={(e) => {
                      // Only close if clicking outside, not on the input
                      if (
                        !e.target?.closest(
                          "[data-radix-popper-content-wrapper]",
                        )
                      ) {
                        setIsAirportOpen(false);
                      }
                    }}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {loadingAirportDestinations ? (
                        <div className="p-4 text-center text-gray-500">
                          Searching...
                        </div>
                      ) : airportSuggestions.length > 0 ? (
                        <div className="py-2">
                          {airportSuggestions.map((dest) => (
                            <div
                              key={dest.id}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                const fullName = `${dest.name} (${dest.code})`;
                                setAirport(fullName);
                                setAirportCode(dest.code);
                                setIsAirportUserTyping(false);
                                setAirportInputValue("");
                                setIsAirportOpen(false);
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Plane className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {dest.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {dest.code} • {dest.type}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isAirportUserTyping &&
                        airportInputValue.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">
                          No airports found
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {airportSuggestions.length === 0
                            ? "Loading popular airports..."
                            : "Start typing to search airports..."}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Hotel/Address Field */}
              <div className="flex-1 lg:max-w-[200px] relative">
                <Popover open={isHotelOpen} onOpenChange={setIsHotelOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <Hotel className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                      <Input
                        type="text"
                        value={
                          isHotelUserTyping ? hotelInputValue : hotel || ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setHotelInputValue(value);
                          setIsHotelUserTyping(true);
                          if (!isHotelOpen) {
                            setIsHotelOpen(true);
                          }
                          debouncedHotelSearch(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          if (!isHotelUserTyping && hotel) {
                            setHotelInputValue(hotel);
                            setIsHotelUserTyping(true);
                          }
                          // Show popular destinations on focus
                          if (hotelSuggestions.length === 0) {
                            searchDestinations("", "hotel");
                          }
                          setIsHotelOpen(true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isHotelOpen) {
                            setIsHotelOpen(true);
                            // Show popular destinations when opening
                            if (hotelSuggestions.length === 0) {
                              searchDestinations("", "hotel");
                            }
                          }
                        }}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm touch-manipulation relative z-10"
                        placeholder="Hotel or address"
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
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-0 border shadow-lg z-50"
                    align="start"
                    side="bottom"
                    sideOffset={5}
                    onInteractOutside={(e) => {
                      // Only close if clicking outside, not on the input
                      if (
                        !e.target?.closest(
                          "[data-radix-popper-content-wrapper]",
                        )
                      ) {
                        setIsHotelOpen(false);
                      }
                    }}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {loadingHotelDestinations ? (
                        <div className="p-4 text-center text-gray-500">
                          Searching...
                        </div>
                      ) : hotelSuggestions.length > 0 ? (
                        <div className="py-2">
                          {hotelSuggestions.map((dest) => (
                            <div
                              key={dest.id}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setHotel(dest.name);
                                setHotelCode(dest.code);
                                setIsHotelUserTyping(false);
                                setHotelInputValue("");
                                setIsHotelOpen(false);
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Hotel className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {dest.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {dest.type}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isHotelUserTyping && hotelInputValue.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">
                          No locations found
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {hotelSuggestions.length === 0
                            ? "Loading popular destinations..."
                            : "Start typing to search..."}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Field */}
              <div className="flex-1 lg:max-w-[140px]">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                      <Input
                        type="text"
                        value={pickupDate ? format(pickupDate, "MMM d") : ""}
                        readOnly
                        className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm cursor-pointer touch-manipulation"
                        placeholder="Select date"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <BookingCalendar
                      mode="single"
                      selected={pickupDate}
                      onSelect={setPickupDate}
                      className="rounded-md border"
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Field */}
              <div className="flex-1 lg:max-w-[100px]">
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-600 mr-2" />
                      <SelectValue placeholder="Time" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Passengers Field */}
              <div className="flex-1 lg:max-w-[140px]">
                <Popover
                  open={isPassengerPopoverOpen}
                  onOpenChange={setIsPassengerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                      <Input
                        type="text"
                        value={passengerSummary()}
                        readOnly
                        className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm cursor-pointer touch-manipulation"
                        placeholder="Passengers"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          Passengers
                        </h4>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Adults
                              </div>
                              <div className="text-xs text-gray-500">
                                Age 18+
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (passengers.adults > 1) {
                                    setPassengers({
                                      ...passengers,
                                      adults: passengers.adults - 1,
                                    });
                                  }
                                }}
                                disabled={passengers.adults <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">
                                {passengers.adults}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (passengers.adults < 8) {
                                    setPassengers({
                                      ...passengers,
                                      adults: passengers.adults + 1,
                                    });
                                  }
                                }}
                                disabled={passengers.adults >= 8}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Children
                              </div>
                              <div className="text-xs text-gray-500">
                                Age 2-17
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (passengers.children > 0) {
                                    const newChildrenAges = [
                                      ...passengers.childrenAges,
                                    ];
                                    newChildrenAges.pop();
                                    setPassengers({
                                      ...passengers,
                                      children: passengers.children - 1,
                                      childrenAges: newChildrenAges,
                                    });
                                  }
                                }}
                                disabled={passengers.children <= 0}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">
                                {passengers.children}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (passengers.children < 6) {
                                    setPassengers({
                                      ...passengers,
                                      children: passengers.children + 1,
                                      childrenAges: [
                                        ...passengers.childrenAges,
                                        10,
                                      ],
                                    });
                                  }
                                }}
                                disabled={passengers.children >= 6}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Infants
                              </div>
                              <div className="text-xs text-gray-500">
                                Under 2
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (passengers.infants > 0) {
                                    setPassengers({
                                      ...passengers,
                                      infants: passengers.infants - 1,
                                    });
                                  }
                                }}
                                disabled={passengers.infants <= 0}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">
                                {passengers.infants}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (passengers.infants < passengers.adults) {
                                    setPassengers({
                                      ...passengers,
                                      infants: passengers.infants + 1,
                                    });
                                  }
                                }}
                                disabled={
                                  passengers.infants >= passengers.adults
                                }
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search Button - h-10 sm:h-12 px-5 */}
              <div className="flex-shrink-0">
                <Button
                  onClick={handleSearch}
                  className="h-10 sm:h-12 px-5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded transition-all duration-150"
                  title={`Search ${transferMode === "airport" ? "transfers" : "car rentals"}`}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span className="text-xs sm:text-sm">
                    Search{" "}
                    {transferMode === "airport" ? "Transfers" : "Car Rentals"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Optional Flight Number */}
            {(flightNumber || airportDirection === "return") && (
              <div className="mt-2">
                <div className="flex-1 lg:max-w-[200px] relative">
                  <div className="relative">
                    <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                    <Input
                      type="text"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                      className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm touch-manipulation"
                      placeholder="Flight number (optional)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Return Trip Fields (if return is selected) */}
            {airportDirection === "return" && (
              <div className="border-t pt-2 mt-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Return Journey
                </h4>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <div className="flex-1 sm:max-w-[140px]">
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                      <Input
                        type="text"
                        value={returnDate ? format(returnDate, "MMM d") : ""}
                        readOnly
                        className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm cursor-pointer touch-manipulation"
                        placeholder="Return date"
                      />
                    </div>
                  </div>
                  <div className="flex-1 sm:max-w-[100px]">
                    <Select value={returnTime} onValueChange={setReturnTime}>
                      <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-blue-600 mr-2" />
                          <SelectValue placeholder="Time" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {timeOptions.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Car Rentals Mode */}
        {transferMode === "rental" && (
          <div className="flex flex-col lg:flex-row gap-2 md:gap-3">
            {/* Pick-up Location */}
            <div className="flex-1 lg:max-w-[200px] relative">
              <Popover open={isPickupOpen} onOpenChange={setIsPickupOpen}>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                    <Input
                      type="text"
                      value={
                        isPickupUserTyping
                          ? pickupInputValue
                          : pickupLocation || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setPickupInputValue(value);
                        setIsPickupUserTyping(true);
                        if (!isPickupOpen) {
                          setIsPickupOpen(true);
                        }
                        debouncedPickupSearch(value);
                      }}
                      onFocus={(e) => {
                        e.stopPropagation();
                        if (!isPickupUserTyping && pickupLocation) {
                          setPickupInputValue(pickupLocation);
                          setIsPickupUserTyping(true);
                        }
                        // Show popular destinations on focus
                        if (pickupSuggestions.length === 0) {
                          searchDestinations("", "pickup");
                        }
                        setIsPickupOpen(true);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isPickupOpen) {
                          setIsPickupOpen(true);
                          // Show popular destinations when opening
                          if (pickupSuggestions.length === 0) {
                            searchDestinations("", "pickup");
                          }
                        }
                      }}
                      className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm touch-manipulation relative z-10"
                      placeholder="Pick-up location"
                      autoComplete="off"
                    />
                    {(pickupLocation ||
                      (isPickupUserTyping && pickupInputValue)) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickupLocation("");
                          setPickupInputValue("");
                          setIsPickupUserTyping(false);
                          setPickupLocationCode("");
                          setIsPickupOpen(false);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 border shadow-lg z-50"
                  align="start"
                  side="bottom"
                  sideOffset={5}
                  onInteractOutside={(e) => {
                    // Only close if clicking outside, not on the input
                    if (
                      !e.target?.closest("[data-radix-popper-content-wrapper]")
                    ) {
                      setIsPickupOpen(false);
                    }
                  }}
                >
                  <div className="max-h-64 overflow-y-auto">
                    {loadingPickupDestinations ? (
                      <div className="p-4 text-center text-gray-500">
                        Searching...
                      </div>
                    ) : pickupSuggestions.length > 0 ? (
                      <div className="py-2">
                        {pickupSuggestions.map((dest) => (
                          <div
                            key={dest.id}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              setPickupLocation(dest.name);
                              setPickupLocationCode(dest.code);
                              setIsPickupUserTyping(false);
                              setPickupInputValue("");
                              setIsPickupOpen(false);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {dest.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {dest.type}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : isPickupUserTyping && pickupInputValue.length >= 2 ? (
                      <div className="p-4 text-center text-gray-500">
                        No locations found
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Start typing to search...
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Drop-off Location (conditional) */}
            {!sameAsPickup && (
              <div className="flex-1 lg:max-w-[200px] relative">
                <Popover open={isDropoffOpen} onOpenChange={setIsDropoffOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                      <Input
                        type="text"
                        value={
                          isDropoffUserTyping
                            ? dropoffInputValue
                            : dropoffLocation || ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setDropoffInputValue(value);
                          setIsDropoffUserTyping(true);
                          if (!isDropoffOpen) {
                            setIsDropoffOpen(true);
                          }
                          debouncedDropoffSearch(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          if (!isDropoffUserTyping && dropoffLocation) {
                            setDropoffInputValue(dropoffLocation);
                            setIsDropoffUserTyping(true);
                          }
                          // Show popular destinations on focus
                          if (dropoffSuggestions.length === 0) {
                            searchDestinations("", "dropoff");
                          }
                          setIsDropoffOpen(true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDropoffOpen) {
                            setIsDropoffOpen(true);
                            // Show popular destinations when opening
                            if (dropoffSuggestions.length === 0) {
                              searchDestinations("", "dropoff");
                            }
                          }
                        }}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm touch-manipulation relative z-10"
                        placeholder="Drop-off location"
                        autoComplete="off"
                      />
                      {(dropoffLocation ||
                        (isDropoffUserTyping && dropoffInputValue)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropoffLocation("");
                            setDropoffInputValue("");
                            setIsDropoffUserTyping(false);
                            setDropoffLocationCode("");
                            setIsDropoffOpen(false);
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-0 border shadow-lg z-50"
                    align="start"
                    side="bottom"
                    sideOffset={5}
                    onInteractOutside={(e) => {
                      // Only close if clicking outside, not on the input
                      if (
                        !e.target?.closest(
                          "[data-radix-popper-content-wrapper]",
                        )
                      ) {
                        setIsDropoffOpen(false);
                      }
                    }}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {loadingDropoffDestinations ? (
                        <div className="p-4 text-center text-gray-500">
                          Searching...
                        </div>
                      ) : dropoffSuggestions.length > 0 ? (
                        <div className="py-2">
                          {dropoffSuggestions.map((dest) => (
                            <div
                              key={dest.id}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setDropoffLocation(dest.name);
                                setDropoffLocationCode(dest.code);
                                setIsDropoffUserTyping(false);
                                setDropoffInputValue("");
                                setIsDropoffOpen(false);
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {dest.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {dest.type}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isDropoffUserTyping &&
                        dropoffInputValue.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">
                          No locations found
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          Start typing to search...
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Pick-up Date */}
            <div className="flex-1 lg:max-w-[140px]">
              <div className="relative cursor-pointer">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                <Input
                  type="text"
                  value={pickupDate ? format(pickupDate, "MMM d") : ""}
                  readOnly
                  className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm cursor-pointer touch-manipulation"
                  placeholder="Pick-up date"
                />
              </div>
            </div>

            {/* Pick-up Time */}
            <div className="flex-1 lg:max-w-[100px]">
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <SelectValue placeholder="Time" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drop-off Date */}
            <div className="flex-1 lg:max-w-[140px]">
              <div className="relative cursor-pointer">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                <Input
                  type="text"
                  value={dropoffDate ? format(dropoffDate, "MMM d") : ""}
                  readOnly
                  className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm cursor-pointer touch-manipulation"
                  placeholder="Drop-off date"
                />
              </div>
            </div>

            {/* Drop-off Time */}
            <div className="flex-1 lg:max-w-[100px]">
              <Select value={dropoffTime} onValueChange={setDropoffTime}>
                <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded text-xs sm:text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <SelectValue placeholder="Time" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
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
              <Button
                onClick={handleSearch}
                className="h-10 sm:h-12 px-5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded transition-all duration-150"
                title="Search car rentals"
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="text-xs sm:text-sm">Search Car Rentals</span>
              </Button>
            </div>
          </div>
        )}

        {/* Additional Options Row for Car Rentals */}
        {transferMode === "rental" && (
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            {/* Same as pickup checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="same-as-pickup"
                checked={sameAsPickup}
                onCheckedChange={setSameAsPickup}
              />
              <label
                htmlFor="same-as-pickup"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Same as pick-up
              </label>
            </div>

            {/* Driver age */}
            <div className="flex-1 sm:max-w-[150px]">
              <Select value={driverAge} onValueChange={setDriverAge}>
                <SelectTrigger className="h-8 bg-white border border-gray-300 rounded text-xs sm:text-sm">
                  <SelectValue placeholder="Driver age" />
                </SelectTrigger>
                <SelectContent>
                  {driverAgeOptions.map((age) => (
                    <SelectItem key={age.value} value={age.value}>
                      {age.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle type */}
            <div className="flex-1 sm:max-w-[150px]">
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="h-8 bg-white border border-gray-300 rounded text-xs sm:text-sm">
                  <SelectValue placeholder="Vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleOptions.map((vehicle) => (
                    <SelectItem key={vehicle.value} value={vehicle.value}>
                      {vehicle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
