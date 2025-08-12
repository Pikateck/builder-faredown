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
type AirportDirection = "airport-to-hotel" | "hotel-to-airport" | "return";

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  // Mode state - Airport taxi (default) | Car rentals
  const [transferMode, setTransferMode] = useState<TransferMode>("airport");
  
  // Airport taxi states
  const [airportDirection, setAirportDirection] = useState<AirportDirection>("airport-to-hotel");
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
  const [airportSuggestions, setAirportSuggestions] = useState<TransferDestination[]>([]);
  const [hotelSuggestions, setHotelSuggestions] = useState<TransferDestination[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<TransferDestination[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<TransferDestination[]>([]);
  const [loadingAirportDestinations, setLoadingAirportDestinations] = useState(false);
  const [loadingHotelDestinations, setLoadingHotelDestinations] = useState(false);
  const [loadingPickupDestinations, setLoadingPickupDestinations] = useState(false);
  const [loadingDropoffDestinations, setLoadingDropoffDestinations] = useState(false);
  
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
  const [dropoffDate, setDropoffDate] = useState<Date | undefined>(returnDefault);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropoffTime, setDropoffTime] = useState("14:00");
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState("14:00");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
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

  // Search destinations (debounced)
  const searchDestinations = useCallback(
    async (
      query: string,
      type: "airport" | "hotel" | "pickup" | "dropoff"
    ) => {
      if (query.length < 2) return;

      const setLoading = type === "airport" ? setLoadingAirportDestinations :
                       type === "hotel" ? setLoadingHotelDestinations :
                       type === "pickup" ? setLoadingPickupDestinations :
                       setLoadingDropoffDestinations;

      const setSuggestions = type === "airport" ? setAirportSuggestions :
                            type === "hotel" ? setHotelSuggestions :
                            type === "pickup" ? setPickupSuggestions :
                            setDropoffSuggestions;

      try {
        setLoading(true);
        const results = await transfersService.searchDestinations(query);
        
        // Filter results based on type
        const filteredResults = results.filter(dest => {
          if (type === "airport") return dest.type === "airport";
          if (type === "hotel") return dest.type === "hotel" || dest.type === "city";
          return true; // pickup/dropoff can be any type
        });
        
        setSuggestions(filteredResults);
      } catch (error) {
        console.error("Error searching destinations:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search functions
  const debouncedAirportSearch = useCallback((query: string) => {
    if (debouncedAirportSearchRef.current) {
      clearTimeout(debouncedAirportSearchRef.current);
    }
    debouncedAirportSearchRef.current = setTimeout(() => {
      searchDestinations(query, "airport");
    }, 150);
  }, [searchDestinations]);

  const debouncedHotelSearch = useCallback((query: string) => {
    if (debouncedHotelSearchRef.current) {
      clearTimeout(debouncedHotelSearchRef.current);
    }
    debouncedHotelSearchRef.current = setTimeout(() => {
      searchDestinations(query, "hotel");
    }, 150);
  }, [searchDestinations]);

  const debouncedPickupSearch = useCallback((query: string) => {
    if (debouncedPickupSearchRef.current) {
      clearTimeout(debouncedPickupSearchRef.current);
    }
    debouncedPickupSearchRef.current = setTimeout(() => {
      searchDestinations(query, "pickup");
    }, 150);
  }, [searchDestinations]);

  const debouncedDropoffSearch = useCallback((query: string) => {
    if (debouncedDropoffSearchRef.current) {
      clearTimeout(debouncedDropoffSearchRef.current);
    }
    debouncedDropoffSearchRef.current = setTimeout(() => {
      searchDestinations(query, "dropoff");
    }, 150);
  }, [searchDestinations]);

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
      parts.push(`${passengers.children} child${passengers.children > 1 ? "ren" : ""}`);
    }
    if (passengers.infants > 0) {
      parts.push(`${passengers.infants} infant${passengers.infants > 1 ? "s" : ""}`);
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
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
        {/* Mode Segmented Control - using same chip styles as Hotels */}
        <div className="flex bg-slate-50 rounded-lg p-1 mb-4 w-fit">
          <button
            onClick={() => setTransferMode("airport")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              transferMode === "airport"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Airport taxi
          </button>
          <button
            onClick={() => setTransferMode("rental")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              transferMode === "rental"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Car rentals
          </button>
        </div>

        {/* Airport Taxi Mode */}
        {transferMode === "airport" && (
          <>
            {/* Direction Toggles - using same chip styles as Hotels Round trip/One way */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setAirportDirection("airport-to-hotel")}
                className={cn(
                  "px-3 py-2 rounded-full text-xs font-medium border transition-colors",
                  airportDirection === "airport-to-hotel"
                    ? "bg-slate-50 text-slate-700 border-slate-200"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                )}
              >
                Airport → Hotel
              </button>
              <button
                onClick={() => setAirportDirection("hotel-to-airport")}
                className={cn(
                  "px-3 py-2 rounded-full text-xs font-medium border transition-colors",
                  airportDirection === "hotel-to-airport"
                    ? "bg-slate-50 text-slate-700 border-slate-200"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                )}
              >
                Hotel → Airport
              </button>
              <button
                onClick={() => setAirportDirection("return")}
                className={cn(
                  "px-3 py-2 rounded-full text-xs font-medium border transition-colors",
                  airportDirection === "return"
                    ? "bg-slate-50 text-slate-700 border-slate-200"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                )}
              >
                Return
              </button>
            </div>

            {/* Main Search Form - exact styling as Hotels */}
            <div className="flex flex-col lg:flex-row gap-2 mb-4">
              {/* Airport Field */}
              <div className="flex-1 lg:max-w-[280px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                  {airportDirection === "airport-to-hotel" ? "Airport" : airportDirection === "hotel-to-airport" ? "Airport" : "Airport"}
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
                          if (!isAirportOpen) {
                            setIsAirportOpen(true);
                          }
                          debouncedAirportSearch(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          setIsAirportOpen(true);
                          if (!isAirportUserTyping && airport) {
                            setAirportInputValue(airport);
                            setIsAirportUserTyping(true);
                          }
                        }}
                        onMouseDown={() => {
                          if (!isAirportOpen) {
                            setIsAirportOpen(true);
                          }
                        }}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm touch-manipulation relative z-10"
                        placeholder="Departure airport"
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
                  <PopoverContent
                    className="w-80 p-0 border shadow-lg z-50"
                    align="start"
                    side="bottom"
                    sideOffset={5}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {loadingAirportDestinations ? (
                        <div className="p-4 text-center text-gray-500">Searching...</div>
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
                                  <Plane className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{dest.name}</div>
                                  <div className="text-sm text-gray-500">{dest.code} • {dest.type}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isAirportUserTyping && airportInputValue.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">No airports found</div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">Start typing to search airports...</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Hotel/Address Field */}
              <div className="flex-1 lg:max-w-[280px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
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
                          if (!isHotelOpen) {
                            setIsHotelOpen(true);
                          }
                          debouncedHotelSearch(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          setIsHotelOpen(true);
                          if (!isHotelUserTyping && hotel) {
                            setHotelInputValue(hotel);
                            setIsHotelUserTyping(true);
                          }
                        }}
                        onMouseDown={() => {
                          if (!isHotelOpen) {
                            setIsHotelOpen(true);
                          }
                        }}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm touch-manipulation relative z-10"
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
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-0 border shadow-lg z-50"
                    align="start"
                    side="bottom"
                    sideOffset={5}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {loadingHotelDestinations ? (
                        <div className="p-4 text-center text-gray-500">Searching...</div>
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
                                  <Hotel className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{dest.name}</div>
                                  <div className="text-sm text-gray-500">{dest.type}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isHotelUserTyping && hotelInputValue.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">No locations found</div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">Start typing to search...</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Field */}
              <div className="flex-1 lg:max-w-[200px]">
                <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                  Date
                </label>
                
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                      <Input
                        type="text"
                        value={pickupDate ? format(pickupDate, "MMM d") : ""}
                        readOnly
                        className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm cursor-pointer touch-manipulation"
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
                      disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Field */}
              <div className="flex-1 lg:max-w-[120px]">
                <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                  Time
                </label>
                
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-blue-600 mr-2" />
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
              <div className="flex-1 lg:max-w-[200px]">
                <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                  Passengers
                </label>
                
                <Popover
                  open={isPassengerPopoverOpen}
                  onOpenChange={setIsPassengerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                      <Input
                        type="text"
                        value={passengerSummary()}
                        readOnly
                        className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm cursor-pointer touch-manipulation"
                        placeholder="Passengers"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Passengers</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">Adults</div>
                              <div className="text-xs text-gray-500">Age 18+</div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (passengers.adults > 1) {
                                    setPassengers({ ...passengers, adults: passengers.adults - 1 });
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
                                    setPassengers({ ...passengers, adults: passengers.adults + 1 });
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
                              <div className="text-sm font-medium text-gray-900">Children</div>
                              <div className="text-xs text-gray-500">Age 2-17</div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (passengers.children > 0) {
                                    const newChildrenAges = [...passengers.childrenAges];
                                    newChildrenAges.pop();
                                    setPassengers({ 
                                      ...passengers, 
                                      children: passengers.children - 1,
                                      childrenAges: newChildrenAges
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
                                      childrenAges: [...passengers.childrenAges, 10]
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
                              <div className="text-sm font-medium text-gray-900">Infants</div>
                              <div className="text-xs text-gray-500">Under 2</div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (passengers.infants > 0) {
                                    setPassengers({ ...passengers, infants: passengers.infants - 1 });
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
                                    setPassengers({ ...passengers, infants: passengers.infants + 1 });
                                  }
                                }}
                                disabled={passengers.infants >= passengers.adults}
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
            </div>

            {/* Optional Flight Number */}
            <div className="mb-4">
              <div className="flex-1 lg:max-w-[280px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block">
                  Flight Number (Optional)
                </label>
                <div className="relative">
                  <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                  <Input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm touch-manipulation"
                    placeholder="e.g. AI 102"
                  />
                </div>
              </div>
            </div>

            {/* Return Trip Fields (if return is selected) */}
            {airportDirection === "return" && (
              <div className="border-t pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Return Journey</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 sm:max-w-[200px]">
                    <label className="text-xs font-medium text-gray-800 mb-1 block">
                      Return Date
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                      <Input
                        type="text"
                        value={returnDate ? format(returnDate, "MMM d") : ""}
                        readOnly
                        className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm cursor-pointer touch-manipulation"
                        placeholder="Return date"
                        onClick={() => {
                          // Add return date picker logic here
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 sm:max-w-[120px]">
                    <label className="text-xs font-medium text-gray-800 mb-1 block">
                      Return Time
                    </label>
                    <Select value={returnTime} onValueChange={setReturnTime}>
                      <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-blue-600 mr-2" />
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
          <div className="flex flex-col lg:flex-row gap-2 mb-4">
            {/* Pick-up Location */}
            <div className="flex-1 lg:max-w-[280px] relative">
              <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
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
                        if (!isPickupOpen) {
                          setIsPickupOpen(true);
                        }
                        debouncedPickupSearch(value);
                      }}
                      onFocus={(e) => {
                        e.stopPropagation();
                        setIsPickupOpen(true);
                        if (!isPickupUserTyping && pickupLocation) {
                          setPickupInputValue(pickupLocation);
                          setIsPickupUserTyping(true);
                        }
                      }}
                      onMouseDown={() => {
                        if (!isPickupOpen) {
                          setIsPickupOpen(true);
                        }
                      }}
                      className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm touch-manipulation relative z-10"
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
                <PopoverContent
                  className="w-80 p-0 border shadow-lg z-50"
                  align="start"
                  side="bottom"
                  sideOffset={5}
                >
                  <div className="max-h-64 overflow-y-auto">
                    {loadingPickupDestinations ? (
                      <div className="p-4 text-center text-gray-500">Searching...</div>
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
                                <MapPin className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{dest.name}</div>
                                <div className="text-sm text-gray-500">{dest.type}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : isPickupUserTyping && pickupInputValue.length >= 2 ? (
                      <div className="p-4 text-center text-gray-500">No locations found</div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">Start typing to search...</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Drop-off Location (conditional) */}
            {!sameAsPickup && (
              <div className="flex-1 lg:max-w-[280px] relative">
                <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
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
                          if (!isDropoffOpen) {
                            setIsDropoffOpen(true);
                          }
                          debouncedDropoffSearch(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          setIsDropoffOpen(true);
                          if (!isDropoffUserTyping && dropoffLocation) {
                            setDropoffInputValue(dropoffLocation);
                            setIsDropoffUserTyping(true);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDropoffOpen(true);
                        }}
                        className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm touch-manipulation relative z-10"
                        placeholder="Drop-off location"
                        autoComplete="off"
                      />
                      {(dropoffLocation || (isDropoffUserTyping && dropoffInputValue)) && (
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
                  <PopoverContent
                    className="w-80 p-0 border shadow-lg z-50"
                    align="start"
                    side="bottom"
                    sideOffset={5}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {loadingDropoffDestinations ? (
                        <div className="p-4 text-center text-gray-500">Searching...</div>
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
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{dest.name}</div>
                                  <div className="text-sm text-gray-500">{dest.type}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isDropoffUserTyping && dropoffInputValue.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">No locations found</div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">Start typing to search...</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Pick-up Date */}
            <div className="flex-1 lg:max-w-[160px]">
              <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                Pick-up date
              </label>
              
              <div className="relative cursor-pointer">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                <Input
                  type="text"
                  value={pickupDate ? format(pickupDate, "MMM d") : ""}
                  readOnly
                  className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm cursor-pointer touch-manipulation"
                  placeholder="Pick-up date"
                />
              </div>
            </div>

            {/* Pick-up Time */}
            <div className="flex-1 lg:max-w-[120px]">
              <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                Pick-up time
              </label>
              
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-blue-600 mr-2" />
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
            <div className="flex-1 lg:max-w-[160px]">
              <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                Drop-off date
              </label>
              
              <div className="relative cursor-pointer">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
                <Input
                  type="text"
                  value={dropoffDate ? format(dropoffDate, "MMM d") : ""}
                  readOnly
                  className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm cursor-pointer touch-manipulation"
                  placeholder="Drop-off date"
                />
              </div>
            </div>

            {/* Drop-off Time */}
            <div className="flex-1 lg:max-w-[120px]">
              <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                Drop-off time
              </label>
              
              <Select value={dropoffTime} onValueChange={setDropoffTime}>
                <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-blue-600 rounded font-medium text-xs sm:text-sm">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-blue-600 mr-2" />
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
        )}

        {/* Additional Options Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Same as pickup checkbox for car rentals */}
          {transferMode === "rental" && (
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
          )}

          {/* Driver age for car rentals */}
          {transferMode === "rental" && (
            <div className="flex-1 sm:max-w-[200px]">
              <Select value={driverAge} onValueChange={setDriverAge}>
                <SelectTrigger className="h-10 bg-white border border-gray-300 rounded text-sm">
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
          )}

          {/* Vehicle type for car rentals */}
          {transferMode === "rental" && (
            <div className="flex-1 sm:max-w-[200px]">
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="h-10 bg-white border border-gray-300 rounded text-sm">
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
          )}
        </div>

        {/* Search Button - exact same styling as Hotels */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Button
            onClick={handleSearch}
            className="h-10 sm:h-12 w-full sm:w-auto bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded px-6 sm:px-8 touch-manipulation transition-all duration-150"
            title={`Search ${transferMode === "airport" ? "transfers" : "car rentals"}`}
          >
            <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">
              Search {transferMode === "airport" ? "Transfers" : "Car Rentals"}
            </span>
          </Button>
        </div>
      </div>
    </>
  );
}
