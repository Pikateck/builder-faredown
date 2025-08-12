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

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  // Location states - EXACT HOTELS/SIGHTSEEING PATTERN
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupLocationCode, setPickupLocationCode] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [dropoffLocationCode, setDropoffLocationCode] = useState("");
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDropoffOpen, setIsDropoffOpen] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<TransferDestination[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<TransferDestination[]>([]);
  const [loadingPickupDestinations, setLoadingPickupDestinations] = useState(false);
  const [loadingDropoffDestinations, setLoadingDropoffDestinations] = useState(false);

  // Popular destinations state
  const [popularDestinations, setPopularDestinations] = useState<TransferDestination[]>([]);
  const [popularDestinationsLoaded, setPopularDestinationsLoaded] = useState(false);

  // User typing states
  const [isPickupUserTyping, setIsPickupUserTyping] = useState(false);
  const [isDropoffUserTyping, setIsDropoffUserTyping] = useState(false);
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

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load popular destinations from Hotelbeds API on component mount - EXACT HOTELS/SIGHTSEEING PATTERN
  useEffect(() => {
    const loadPopularDestinations = async () => {
      try {
        console.log("🎆 Loading popular transfer destinations from Hotelbeds...");
        const popular = await transfersService.searchDestinations(""); // Empty query for popular
        const formattedPopular = popular.map((dest) => ({
          id: dest.code,
          code: dest.code,
          name: dest.name,
          country: dest.country,
          countryCode: dest.countryCode,
          type: dest.type,
          popular: dest.popular || false,
        }));
        setPopularDestinations(formattedPopular);
        setPopularDestinationsLoaded(true);
        console.log("✅ Loaded", formattedPopular.length, "popular transfer destinations from Hotelbeds");
      } catch (error) {
        console.error("⚠️ Failed to load popular destinations:", error);
        setPopularDestinationsLoaded(true);
      }
    };

    loadPopularDestinations();
  }, []);

  useEffect(() => {
    if (sameAsPickup) {
      setDropoffLocation(pickupLocation);
      setDropoffLocationCode(pickupLocationCode);
    }
  }, [sameAsPickup, pickupLocation, pickupLocationCode]);

  useEffect(() => {
    if (isRoundTrip && !returnDate) {
      setReturnDate(returnDefault);
    }
  }, [isRoundTrip]);

  // EXACT HOTELS/SIGHTSEEING SEARCH PATTERN
  const searchPickupDestinations = useCallback(
    async (query: string) => {
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
          console.log(`🔍 Real-time pickup search: "${query}"`);

          const results = await transfersService.searchDestinations(query);
          setPickupSuggestions(results);
          console.log(`✅ Real-time pickup results: ${results.length} destinations`);
        } catch (error) {
          console.error("❌ Pickup search error:", error);
          setPickupSuggestions([]);
        } finally {
          setLoadingPickupDestinations(false);
        }
      }, 150); // Ultra-fast response time like Booking.com
    },
    [],
  );

  const searchDropoffDestinations = useCallback(
    async (query: string) => {
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
          console.log(`🔍 Real-time dropoff search: "${query}"`);

          const results = await transfersService.searchDestinations(query);
          setDropoffSuggestions(results);
          console.log(`✅ Real-time dropoff results: ${results.length} destinations`);
        } catch (error) {
          console.error("❌ Dropoff search error:", error);
          setDropoffSuggestions([]);
        } finally {
          setLoadingDropoffDestinations(false);
        }
      }, 150);
    },
    [],
  );

  // Destination selection handlers
  const selectPickupDestination = useCallback((dest: TransferDestination) => {
    const fullName = `${dest.name}, ${dest.country}`;
    console.log("🎯 Pickup destination selected:", fullName);

    setPickupLocation(fullName);
    setPickupLocationCode(dest.code);
    setIsPickupUserTyping(false);
    setPickupInputValue("");
    setIsPickupOpen(false);
  }, []);

  const selectDropoffDestination = useCallback((dest: TransferDestination) => {
    const fullName = `${dest.name}, ${dest.country}`;
    console.log("🎯 Dropoff destination selected:", fullName);

    setDropoffLocation(fullName);
    setDropoffLocationCode(dest.code);
    setIsDropoffUserTyping(false);
    setDropoffInputValue("");
    setIsDropoffOpen(false);
  }, []);

  const passengersText = `${passengers.adults} adult${passengers.adults > 1 ? 's' : ''}${passengers.children > 0 ? `, ${passengers.children} child${passengers.children > 1 ? 'ren' : ''}` : ''}${passengers.infants > 0 ? `, ${passengers.infants} infant${passengers.infants > 1 ? 's' : ''}` : ''}`;

  const handleChildrenChange = (newChildren: number) => {
    const currentAges = passengers.childrenAges;
    if (newChildren > currentAges.length) {
      // Add default ages for new children
      const newAges = [...currentAges];
      for (let i = currentAges.length; i < newChildren; i++) {
        newAges.push(10);
      }
      setPassengers({ ...passengers, children: newChildren, childrenAges: newAges });
    } else {
      // Remove ages for removed children
      setPassengers({ 
        ...passengers, 
        children: newChildren, 
        childrenAges: currentAges.slice(0, newChildren) 
      });
    }
  };

  const handleSearch = () => {
    // Validation
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
      setErrorMessage("Please select a pickup date");
      setShowError(true);
      return;
    }

    if (isRoundTrip && !returnDate) {
      setErrorMessage("Please select a return date");
      setShowError(true);
      return;
    }

    // Build search parameters
    const searchParams = new URLSearchParams({
      pickupLocation,
      dropoffLocation: sameAsPickup ? pickupLocation : dropoffLocation,
      pickupDate: pickupDate.toISOString().split('T')[0],
      pickupTime,
      adults: passengers.adults.toString(),
      children: passengers.children.toString(),
      infants: passengers.infants.toString(),
      ...(isRoundTrip && returnDate && {
        returnDate: returnDate.toISOString().split('T')[0],
        returnTime,
      }),
      ...(vehicleType && vehicleType !== "any" && { vehicleType }),
    });

    navigate(`/transfer-results?${searchParams.toString()}`);
  };

  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
        {/* Trip Type Toggle */}
        <div className="flex items-center space-x-6 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={!isRoundTrip}
              onChange={() => setIsRoundTrip(false)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-800">One way</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={isRoundTrip}
              onChange={() => setIsRoundTrip(true)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-800">Round trip</span>
          </label>
        </div>

        {/* Main Search Form */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">
          {/* Pickup Location */}
          <div className="flex-1 lg:max-w-[240px] relative">
            <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
              From
            </label>
            <Popover open={isPickupOpen} onOpenChange={setIsPickupOpen}>
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
                      d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"
                    />
                  </svg>
                  <Input
                    type="text"
                    value={isPickupUserTyping ? pickupInputValue : pickupLocation || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPickupInputValue(value);
                      setIsPickupUserTyping(true);
                      // Auto-open dropdown when user starts typing
                      if (!isPickupOpen) {
                        setIsPickupOpen(true);
                      }
                      // Search destinations
                      searchPickupDestinations(value);
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      setIsPickupOpen(true);
                      // Set inputValue to current destination when focusing for editing
                      if (!isPickupUserTyping && pickupLocation) {
                        setPickupInputValue(pickupLocation);
                        setIsPickupUserTyping(true);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPickupOpen(true);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                    }}
                    readOnly={false}
                    disabled={false}
                    className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation relative z-10"
                    placeholder="Pickup location"
                    autoComplete="off"
                    data-destination-input="true"
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
                      title="Clear pickup location"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-[480px] p-0 border border-gray-200 shadow-2xl rounded-lg" align="start">
                <div className="max-h-80 overflow-y-auto">
                  {!popularDestinationsLoaded ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-600">
                        Loading destinations...
                      </span>
                    </div>
                  ) : loadingPickupDestinations ? (
                    <div className="flex items-center justify-center p-3">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-xs text-gray-600">
                        🔍 Searching...
                      </span>
                    </div>
                  ) : isPickupUserTyping &&
                    pickupInputValue.length > 0 &&
                    pickupSuggestions.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <span className="text-xs font-medium text-gray-600">
                          🔍 Search Results
                        </span>
                      </div>
                      {pickupSuggestions.map((dest, index) => (
                        <button
                          key={dest.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectPickupDestination(dest);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{dest.name}</div>
                          <div className="text-sm text-gray-600">{dest.type}, {dest.country}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <span className="text-xs font-medium text-gray-600">
                          ✈️ Popular Destinations
                        </span>
                      </div>
                      {popularDestinations.slice(0, 8).map((dest, index) => (
                        <button
                          key={dest.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectPickupDestination(dest);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{dest.name}</div>
                          <div className="text-sm text-gray-600">{dest.type}, {dest.country}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Drop-off Location */}
          <div className="flex-1 lg:max-w-[240px] relative">
            <label className="text-xs font-medium text-gray-800 mb-1 block lg:hidden">
              To
            </label>
            <Popover open={isDropoffOpen} onOpenChange={setIsDropoffOpen}>
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
                      d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"
                    />
                  </svg>
                  <Input
                    type="text"
                    value={isDropoffUserTyping ? dropoffInputValue : dropoffLocation || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDropoffInputValue(value);
                      setIsDropoffUserTyping(true);
                      if (sameAsPickup) setSameAsPickup(false);
                      // Auto-open dropdown when user starts typing
                      if (!isDropoffOpen) {
                        setIsDropoffOpen(true);
                      }
                      // Search destinations
                      searchDropoffDestinations(value);
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      if (!sameAsPickup) {
                        setIsDropoffOpen(true);
                        // Set inputValue to current destination when focusing for editing
                        if (!isDropoffUserTyping && dropoffLocation) {
                          setDropoffInputValue(dropoffLocation);
                          setIsDropoffUserTyping(true);
                        }
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!sameAsPickup) {
                        setIsDropoffOpen(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                    }}
                    readOnly={false}
                    disabled={sameAsPickup}
                    className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation disabled:bg-gray-100 disabled:text-gray-500 relative z-10"
                    placeholder={sameAsPickup ? "Same as pickup" : "Drop-off location"}
                    autoComplete="off"
                    data-destination-input="true"
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
                      title="Clear dropoff location"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </PopoverTrigger>
              {!sameAsPickup && (
                <PopoverContent className="w-80 sm:w-[480px] p-0 border border-gray-200 shadow-2xl rounded-lg" align="start">
                  <div className="max-h-80 overflow-y-auto">
                    {!popularDestinationsLoaded ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm text-gray-600">
                          Loading destinations...
                        </span>
                      </div>
                    ) : loadingDropoffDestinations ? (
                      <div className="flex items-center justify-center p-3">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-xs text-gray-600">
                          🔍 Searching...
                        </span>
                      </div>
                    ) : isDropoffUserTyping &&
                      dropoffInputValue.length > 0 &&
                      dropoffSuggestions.length > 0 ? (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b">
                          <span className="text-xs font-medium text-gray-600">
                            🔍 Search Results
                          </span>
                        </div>
                        {dropoffSuggestions.map((dest, index) => (
                          <button
                            key={dest.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              selectDropoffDestination(dest);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{dest.name}</div>
                            <div className="text-sm text-gray-600">{dest.type}, {dest.country}</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b">
                          <span className="text-xs font-medium text-gray-600">
                            ✈️ Popular Destinations
                          </span>
                        </div>
                        {popularDestinations.slice(0, 8).map((dest, index) => (
                          <button
                            key={dest.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              selectDropoffDestination(dest);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{dest.name}</div>
                            <div className="text-sm text-gray-600">{dest.type}, {dest.country}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              )}
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
