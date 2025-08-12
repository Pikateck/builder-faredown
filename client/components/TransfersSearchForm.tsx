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

interface PassengerConfig {
  adults: number;
  children: number;
  childrenAges: number[];
  infants: number;
}

interface DestinationOption {
  id: string;
  code: string;
  name: string;
  country: string;
  type: string;
  flag?: string;
  popular?: boolean;
}

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  // Location states
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDropoffOpen, setIsDropoffOpen] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<DestinationOption[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<DestinationOption[]>([]);
  
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

  // Mock destinations data
  const destinations: DestinationOption[] = [
    { id: "1", code: "DEL", name: "Delhi Airport", country: "India", type: "Airport" },
    { id: "2", code: "BOM", name: "Mumbai Airport", country: "India", type: "Airport" },
    { id: "3", code: "BLR", name: "Bangalore Airport", country: "India", type: "Airport" },
    { id: "4", code: "MAA", name: "Chennai Airport", country: "India", type: "Airport" },
    { id: "5", code: "CCU", name: "Kolkata Airport", country: "India", type: "Airport" },
    { id: "6", code: "HYD", name: "Hyderabad Airport", country: "India", type: "Airport" },
    { id: "7", code: "GOI", name: "Goa Airport", country: "India", type: "Airport" },
    { id: "8", code: "PNQ", name: "Pune Airport", country: "India", type: "Airport" },
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (sameAsPickup) {
      setDropoffLocation(pickupLocation);
    }
  }, [sameAsPickup, pickupLocation]);

  useEffect(() => {
    if (isRoundTrip && !returnDate) {
      setReturnDate(returnDefault);
    }
  }, [isRoundTrip]);

  const filterDestinations = useCallback((query: string) => {
    if (!query.trim()) return destinations.slice(0, 8);
    return destinations.filter(dest =>
      dest.name.toLowerCase().includes(query.toLowerCase()) ||
      dest.code.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
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
                    value={pickupLocation}
                    onChange={(e) => {
                      setPickupLocation(e.target.value);
                      setIsPickupOpen(true);
                    }}
                    onFocus={() => setIsPickupOpen(true)}
                    className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation"
                    placeholder="Pickup location"
                    autoComplete="off"
                  />
                  {pickupLocation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickupLocation("");
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
                <div className="max-h-80 overflow-y-auto">
                  {filterDestinations(pickupLocation).map((dest) => (
                    <button
                      key={dest.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPickupLocation(`${dest.name}, ${dest.country}`);
                        setIsPickupOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{dest.name}</div>
                      <div className="text-sm text-gray-600">{dest.type}, {dest.country}</div>
                    </button>
                  ))}
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
                    value={dropoffLocation}
                    onChange={(e) => {
                      setDropoffLocation(e.target.value);
                      setIsDropoffOpen(true);
                      if (sameAsPickup) setSameAsPickup(false);
                    }}
                    onFocus={() => setIsDropoffOpen(true)}
                    disabled={sameAsPickup}
                    className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm touch-manipulation disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder={sameAsPickup ? "Same as pickup" : "Drop-off location"}
                    autoComplete="off"
                  />
                  {dropoffLocation && !sameAsPickup && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropoffLocation("");
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
                  <div className="max-h-80 overflow-y-auto">
                    {filterDestinations(dropoffLocation).map((dest) => (
                      <button
                        key={dest.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDropoffLocation(`${dest.name}, ${dest.country}`);
                          setIsDropoffOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{dest.name}</div>
                        <div className="text-sm text-gray-600">{dest.type}, {dest.country}</div>
                      </button>
                    ))}
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
