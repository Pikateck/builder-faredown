import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookingCalendar } from "@/components/BookingCalendar";
import { format } from "date-fns";
import {
  MapPin,
  CalendarIcon,
  Users,
  Search,
  Car,
  Plus,
  Minus,
  ArrowUpDown,
} from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";

interface PassengerConfig {
  adults: number;
  children: number;
  infants: number;
}

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const [tripType, setTripType] = useState("one-way");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");

  // Set default dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pickupDate, setPickupDate] = useState<Date | undefined>(tomorrow);
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [pickupTime, setPickupTime] = useState("12:00");
  const [returnTime, setReturnTime] = useState("12:00");
  const [isPickupDateOpen, setIsPickupDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 2,
    children: 0,
    infants: 0,
  });
  const [isPassengerPopoverOpen, setIsPassengerPopoverOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Popular transfer locations
  const popularLocations = [
    "Dubai International Airport (DXB)",
    "London Heathrow Airport (LHR)",
    "Paris Charles de Gaulle (CDG)",
    "New York JFK Airport (JFK)",
    "Bangkok Suvarnabhumi (BKK)",
    "Singapore Changi Airport (SIN)",
    "Dubai Downtown",
    "London City Centre",
    "Paris City Centre",
    "New York Manhattan",
    "Bangkok City Centre",
    "Singapore Marina Bay",
  ];

  // Time slots
  const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  });

  const updatePassengerCount = (
    type: keyof PassengerConfig,
    operation: "increment" | "decrement"
  ) => {
    setPassengers((prev) => {
      const newValue =
        operation === "increment" ? prev[type] + 1 : prev[type] - 1;

      if (type === "adults" && newValue < 1) return prev;
      if ((type === "children" || type === "infants") && newValue < 0) return prev;
      if (newValue > 9) return prev;

      return {
        ...prev,
        [type]: newValue,
      };
    });
  };

  const swapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  const handleSearch = () => {
    console.log("🔍 Starting transfer search with:", {
      tripType,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      passengers,
    });

    // Basic validation
    if (!pickupLocation || !dropoffLocation) {
      setErrorMessage("Please enter pickup and drop-off locations");
      setShowError(true);
      return;
    }

    if (!pickupDate) {
      setErrorMessage("Please select pickup date");
      setShowError(true);
      return;
    }

    if (tripType === "return" && !returnDate) {
      setErrorMessage("Please select return date for round-trip");
      setShowError(true);
      return;
    }

    try {
      const searchParams = new URLSearchParams({
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        pickupDate: pickupDate.toISOString(),
        pickupTime,
        adults: passengers.adults.toString(),
        children: passengers.children.toString(),
        infants: passengers.infants.toString(),
        tripType,
        searchType: "live",
        searchId: Date.now().toString(),
      });

      if (tripType === "return" && returnDate) {
        searchParams.set("returnDate", returnDate.toISOString());
        searchParams.set("returnTime", returnTime);
      }

      const url = `/transfers/results?${searchParams.toString()}`;
      console.log("🚗 Navigating to transfer search:", url);
      navigate(url);
    } catch (error) {
      console.error("🚨 Error in transfer search:", error);
      setErrorMessage("Search failed. Please try again.");
      setShowError(true);
    }
  };

  const passengerSummary = () => {
    const total = passengers.adults + passengers.children + passengers.infants;
    return `${total} passenger${total > 1 ? "s" : ""}`;
  };

  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
        {/* Trip Type Selection */}
        <div className="flex gap-2 mb-4">
          <Select value={tripType} onValueChange={setTripType}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-way">One-way</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Search Form */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">
          {/* Pickup Location */}
          <div className="flex-1 lg:max-w-[200px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Pickup
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4" />
              <Input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm"
                placeholder="Pickup location"
                autoComplete="off"
                list="pickup-locations"
              />
              <datalist id="pickup-locations">
                {popularLocations.map((location, index) => (
                  <option key={index} value={location} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center lg:px-2">
            <Button
              variant="outline"
              size="sm"
              onClick={swapLocations}
              className="w-8 h-8 p-0 rounded-full border-blue-400 hover:bg-blue-50"
            >
              <ArrowUpDown className="w-4 h-4 text-blue-600" />
            </Button>
          </div>

          {/* Drop-off Location */}
          <div className="flex-1 lg:max-w-[200px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Drop-off
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4" />
              <Input
                type="text"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                className="pl-10 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm"
                placeholder="Drop-off location"
                autoComplete="off"
                list="dropoff-locations"
              />
              <datalist id="dropoff-locations">
                {popularLocations.map((location, index) => (
                  <option key={index} value={location} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Pickup Date & Time */}
          <div className="flex-1 lg:max-w-[140px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Pickup Date
            </label>
            <Popover open={isPickupDateOpen} onOpenChange={setIsPickupDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {pickupDate ? format(pickupDate, "MMM d") : "Pickup Date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <BookingCalendar
                  initialRange={{
                    startDate: pickupDate || new Date(),
                    endDate: pickupDate || new Date(),
                  }}
                  onChange={(range) => {
                    setPickupDate(range.startDate);
                    setIsPickupDateOpen(false);
                  }}
                  onClose={() => setIsPickupDateOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Pickup Time */}
          <div className="flex-1 lg:max-w-[100px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Time
            </label>
            <Select value={pickupTime} onValueChange={setPickupTime}>
              <SelectTrigger className="w-full h-10 sm:h-12 text-xs sm:text-sm border-2 border-blue-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Return Date & Time (if return trip) */}
          {tripType === "return" && (
            <>
              <div className="flex-1 lg:max-w-[140px]">
                <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                  Return Date
                </label>
                <Popover open={isReturnDateOpen} onOpenChange={setIsReturnDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {returnDate ? format(returnDate, "MMM d") : "Return Date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <BookingCalendar
                      initialRange={{
                        startDate: returnDate || new Date(),
                        endDate: returnDate || new Date(),
                      }}
                      onChange={(range) => {
                        setReturnDate(range.startDate);
                        setIsReturnDateOpen(false);
                      }}
                      onClose={() => setIsReturnDateOpen(false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 lg:max-w-[100px]">
                <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                  Return Time
                </label>
                <Select value={returnTime} onValueChange={setReturnTime}>
                  <SelectTrigger className="w-full h-10 sm:h-12 text-xs sm:text-sm border-2 border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Passengers */}
          <div className="flex-1 lg:max-w-[140px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Passengers
            </label>
            <Popover
              open={isPassengerPopoverOpen}
              onOpenChange={setIsPassengerPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{passengerSummary()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Adults</div>
                      <div className="text-sm text-gray-500">12+ years</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full"
                        onClick={() => updatePassengerCount("adults", "decrement")}
                        disabled={passengers.adults <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {passengers.adults}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full"
                        onClick={() => updatePassengerCount("adults", "increment")}
                        disabled={passengers.adults >= 9}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Children</div>
                      <div className="text-sm text-gray-500">2-11 years</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full"
                        onClick={() => updatePassengerCount("children", "decrement")}
                        disabled={passengers.children <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {passengers.children}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full"
                        onClick={() => updatePassengerCount("children", "increment")}
                        disabled={passengers.children >= 9}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Infants</div>
                      <div className="text-sm text-gray-500">Under 2 years</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full"
                        onClick={() => updatePassengerCount("infants", "decrement")}
                        disabled={passengers.infants <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {passengers.infants}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full"
                        onClick={() => updatePassengerCount("infants", "increment")}
                        disabled={passengers.infants >= 9}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsPassengerPopoverOpen(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button
              onClick={handleSearch}
              className="h-10 sm:h-12 w-full sm:w-auto bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded px-6 sm:px-8 transition-all duration-150"
            >
              <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Search Transfers</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
