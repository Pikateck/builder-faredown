import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { qp, saveLastSearch, getLastSearch } from "@/lib/searchParams";
import { Button } from "@/components/ui/button";
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
  X,
  Clock,
} from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { RecentSearches } from "./RecentSearches";

interface PassengerConfig {
  adults: number;
  children: number;
  infants: number;
}

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Service and trip configuration
  const [serviceType, setServiceType] = useState("airport-taxi");
  const [tripType, setTripType] = useState("one-way");

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDropoffOpen, setIsDropoffOpen] = useState(false);
  const [pickupInputValue, setPickupInputValue] = useState("");
  const [dropoffInputValue, setDropoffInputValue] = useState("");

  // Set default dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const [pickupDate, setPickupDate] = useState<Date | undefined>(tomorrow);
  const [returnDate, setReturnDate] = useState<Date | undefined>(dayAfter);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [isPickupDateOpen, setIsPickupDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  // Car rental specific fields
  const [driverAge, setDriverAge] = useState("30");

  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 2,
    children: 0,
    infants: 0,
  });
  const [isPassengerPopoverOpen, setIsPassengerPopoverOpen] = useState(false);

  // Initialize form with URL params or sessionStorage data
  useEffect(() => {
    const location = window.location;
    const urlParams = qp.parse(location.search);
    const lastSearch = getLastSearch();

    // Use URL params if available, otherwise fallback to sessionStorage
    const sourceData =
      Object.keys(urlParams).length > 0 ? urlParams : lastSearch;

    if (sourceData) {
      // Set pickup and dropoff locations
      if (sourceData.pickup || sourceData.fromLat) {
        setPickupLocation(
          sourceData.pickup || `${sourceData.fromLat},${sourceData.fromLng}`,
        );
        setPickupInputValue(
          sourceData.pickup || `${sourceData.fromLat},${sourceData.fromLng}`,
        );
      }

      if (sourceData.dropoff || sourceData.toLat) {
        setDropoffLocation(
          sourceData.dropoff || `${sourceData.toLat},${sourceData.toLng}`,
        );
        setDropoffInputValue(
          sourceData.dropoff || `${sourceData.toLat},${sourceData.toLng}`,
        );
      }

      // Set pickup date and time
      if (sourceData.pickupDate || sourceData.date) {
        const pickupDateStr = sourceData.pickupDate || sourceData.date;
        const pickupDateFromSource = new Date(pickupDateStr);
        if (!isNaN(pickupDateFromSource.getTime())) {
          setPickupDate(pickupDateFromSource);
        }
      }

      if (sourceData.pickupTime) {
        setPickupTime(sourceData.pickupTime);
      }

      // Set return date and time
      if (sourceData.returnDate) {
        const returnDateFromSource = new Date(sourceData.returnDate);
        if (!isNaN(returnDateFromSource.getTime())) {
          setReturnDate(returnDateFromSource);
        }
      }

      if (sourceData.returnTime) {
        setReturnTime(sourceData.returnTime);
      }

      // Set passenger counts
      const adults = parseInt(sourceData.adults) || 2;
      const children = parseInt(sourceData.children) || 0;
      const infants = parseInt(sourceData.infants) || 0;

      setPassengers({ adults, children, infants });

      // Set service and trip types
      if (sourceData.serviceType) {
        setServiceType(sourceData.serviceType);
      }

      if (sourceData.tripType) {
        setTripType(sourceData.tripType);
      }

      if (sourceData.driverAge) {
        setDriverAge(sourceData.driverAge);
      }
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsPickupOpen(false);
      setIsDropoffOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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

  // Driver age options
  const driverAges = Array.from({ length: 70 }, (_, i) => (i + 18).toString());

  const updatePassengerCount = (
    type: keyof PassengerConfig,
    operation: "increment" | "decrement",
  ) => {
    setPassengers((prev) => {
      const newValue =
        operation === "increment" ? prev[type] + 1 : prev[type] - 1;

      if (type === "adults" && newValue < 1) return prev;
      if ((type === "children" || type === "infants") && newValue < 0)
        return prev;
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

    if (serviceType === "car-rentals" && !returnDate) {
      setErrorMessage("Please select drop-off date for car rental");
      setShowError(true);
      return;
    }

    if (tripType === "return" && !returnDate) {
      setErrorMessage("Please select return date for round-trip");
      setShowError(true);
      return;
    }

    try {
      // Prepare data for sessionStorage (normalized format)
      const searchData = {
        fromLat: pickupLocation.split(",")[0] || "",
        fromLng: pickupLocation.split(",")[1] || "",
        toLat: dropoffLocation.split(",")[0] || "",
        toLng: dropoffLocation.split(",")[1] || "",
        date: pickupDate.toISOString().split("T")[0],
        adults: passengers.adults.toString(),
        bags: "0",
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        pickupTime,
        serviceType,
        tripType,
      };

      if (serviceType === "car-rentals") {
        searchData.dropoffDate = returnDate!.toISOString().split("T")[0];
        searchData.dropoffTime = returnTime;
        searchData.driverAge = driverAge;
      } else {
        searchData.children = passengers.children.toString();
        searchData.infants = passengers.infants.toString();

        if (tripType === "return" && returnDate) {
          searchData.returnDate = returnDate.toISOString().split("T")[0];
          searchData.returnTime = returnTime;
        }
      }

      // Save to sessionStorage for persistence
      saveLastSearch(searchData);

      const searchParams = new URLSearchParams({
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        pickupDate: pickupDate.toISOString(),
        pickupTime,
        serviceType,
        searchType: "live",
        searchId: Date.now().toString(),
      });

      if (serviceType === "car-rentals") {
        searchParams.set("dropoffDate", returnDate!.toISOString());
        searchParams.set("dropoffTime", returnTime);
        searchParams.set("driverAge", driverAge);
      } else {
        searchParams.set("adults", passengers.adults.toString());
        searchParams.set("children", passengers.children.toString());
        searchParams.set("infants", passengers.infants.toString());
        searchParams.set("tripType", tripType);

        if (tripType === "return" && returnDate) {
          searchParams.set("returnDate", returnDate.toISOString());
          searchParams.set("returnTime", returnTime);
        }
      }

      const url = `/transfers/results?${searchParams.toString()}`;
      navigate(url);
    } catch (error) {
      console.error("Transfer search error:", error);
      setErrorMessage("Search failed. Please try again.");
      setShowError(true);
    }
  };

  const passengerSummary = () => {
    const total = passengers.adults + passengers.children + passengers.infants;
    return `${total} passenger${total > 1 ? "s" : ""}`;
  };

  const renderLocationDropdown = (
    type: "pickup" | "dropoff",
    location: string,
    setLocation: (value: string) => void,
    isOpen: boolean,
    setIsOpen: (value: boolean) => void,
    inputValue: string,
    setInputValue: (value: string) => void,
    label: string,
    placeholder: string,
    code: string,
    height: "h-10" | "h-12" = "h-10",
  ) => (
    <div
      className="relative flex-1 w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 ${height} w-full hover:border-blue-600 touch-manipulation pr-10`}
        >
          <Car className="w-4 h-4 text-gray-500 mr-2" />
          <div className="flex items-center space-x-2 min-w-0">
            {location ? (
              <>
                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                  {code}
                </div>
                <span className="text-sm text-gray-700 font-medium truncate">
                  {location}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500 font-medium">
                {placeholder}
              </span>
            )}
          </div>
        </button>
        {location && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const defaultLocation =
                type === "pickup"
                  ? "Dubai International Airport (DXB)"
                  : "Dubai Downtown";
              setLocation(defaultLocation);
              setInputValue("");
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            title={`Reset ${type} location to default`}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {label}
            </h3>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search locations..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            {popularLocations
              .filter((loc) =>
                loc.toLowerCase().includes((inputValue || "").toLowerCase()),
              )
              .slice(0, 8)
              .map((loc, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setLocation(loc);
                    setIsOpen(false);
                    setInputValue("");
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                      <Car className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {loc}
                      </div>
                      <div className="text-xs text-gray-500">
                        {serviceType === "car-rentals"
                          ? "Car rental location"
                          : "Transfer location"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
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
        {/* Service Type Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setServiceType("airport-taxi")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              serviceType === "airport-taxi"
                ? "bg-[#003580] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            }`}
          >
            <Car className="w-4 h-4 inline mr-2" />
            Airport Taxi
          </button>
          <button
            onClick={() => setServiceType("car-rentals")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              serviceType === "car-rentals"
                ? "bg-[#003580] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            }`}
          >
            <Car className="w-4 h-4 inline mr-2" />
            Car Rentals
          </button>
        </div>

        {serviceType === "car-rentals" ? (
          // Car Rentals Layout (Booking.com style)
          <div className="flex flex-col lg:flex-row gap-2 mb-4">
            {/* Pick-up Location */}
            {renderLocationDropdown(
              "pickup",
              pickupLocation,
              setPickupLocation,
              isPickupOpen,
              setIsPickupOpen,
              pickupInputValue,
              setPickupInputValue,
              "Pick-up location",
              "Pick-up location",
              "PKP",
              "h-12",
            )}

            {/* Drop-off Location */}
            {renderLocationDropdown(
              "dropoff",
              dropoffLocation,
              setDropoffLocation,
              isDropoffOpen,
              setIsDropoffOpen,
              dropoffInputValue,
              setDropoffInputValue,
              "Drop-off location",
              "Drop-off location",
              "DRP",
              "h-12",
            )}

            {/* Pick-up Date */}
            <div className="relative flex-1 lg:max-w-[140px]">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                Pick-up date
              </label>
              <Popover
                open={isPickupDateOpen}
                onOpenChange={setIsPickupDateOpen}
              >
                <PopoverTrigger asChild>
                  <button className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-12 w-full hover:border-blue-600 touch-manipulation">
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                    <span className="truncate text-xs sm:text-sm">
                      {pickupDate
                        ? format(pickupDate, "MMM d")
                        : "Pick-up date"}
                    </span>
                  </button>
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

            {/* Pick-up Time */}
            <div className="relative w-24">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                Time
              </label>
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger className="w-full h-12 text-xs border-2 border-blue-500">
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

            {/* Drop-off Date */}
            <div className="relative flex-1 lg:max-w-[140px]">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                Drop-off date
              </label>
              <Popover
                open={isReturnDateOpen}
                onOpenChange={setIsReturnDateOpen}
              >
                <PopoverTrigger asChild>
                  <button className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-12 w-full hover:border-blue-600 touch-manipulation">
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                    <span className="truncate text-xs sm:text-sm">
                      {returnDate
                        ? format(returnDate, "MMM d")
                        : "Drop-off date"}
                    </span>
                  </button>
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

            {/* Drop-off Time */}
            <div className="relative w-24">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                Time
              </label>
              <Select value={returnTime} onValueChange={setReturnTime}>
                <SelectTrigger className="w-full h-12 text-xs border-2 border-blue-500">
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

            {/* Driver Age */}
            <div className="relative w-32">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                Driver's age
              </label>
              <Select value={driverAge} onValueChange={setDriverAge}>
                <SelectTrigger className="w-full h-12 text-xs border-2 border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {driverAges.map((age) => (
                    <SelectItem key={age} value={age}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <div className="w-full sm:w-auto">
              <Button
                onClick={handleSearch}
                className="h-12 w-full sm:w-auto bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-bold rounded px-6 sm:px-8 transition-all duration-150"
              >
                <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Search</span>
              </Button>
            </div>
          </div>
        ) : (
          // Airport Taxi Layout (Booking.com style horizontal)
          <>
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

            {/* Airport Taxi Horizontal Layout */}
            <div className="flex flex-col lg:flex-row gap-2 mb-4">
              {/* From pick-up location */}
              {renderLocationDropdown(
                "pickup",
                pickupLocation,
                setPickupLocation,
                isPickupOpen,
                setIsPickupOpen,
                pickupInputValue,
                setPickupInputValue,
                "From pick-up location",
                "From pick-up location",
                "PKP",
                "h-12",
              )}

              {/* Enter destination */}
              {renderLocationDropdown(
                "dropoff",
                dropoffLocation,
                setDropoffLocation,
                isDropoffOpen,
                setIsDropoffOpen,
                dropoffInputValue,
                setDropoffInputValue,
                "Enter destination",
                "Enter destination",
                "DRP",
                "h-12",
              )}

              {/* Pick-up Date */}
              <div className="relative flex-1 lg:max-w-[140px]">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                  Pick-up date
                </label>
                <Popover
                  open={isPickupDateOpen}
                  onOpenChange={setIsPickupDateOpen}
                >
                  <PopoverTrigger asChild>
                    <button className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-12 w-full hover:border-blue-600 touch-manipulation">
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                      <span className="truncate text-xs sm:text-sm">
                        {pickupDate
                          ? format(pickupDate, "MMM d")
                          : "Pick-up date"}
                      </span>
                    </button>
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

              {/* Pick-up Time */}
              <div className="relative w-24">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                  Time
                </label>
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger className="w-full h-12 text-xs border-2 border-blue-500">
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
                  <div className="relative flex-1 lg:max-w-[140px]">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                      Drop-off date
                    </label>
                    <Popover
                      open={isReturnDateOpen}
                      onOpenChange={setIsReturnDateOpen}
                    >
                      <PopoverTrigger asChild>
                        <button className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-12 w-full hover:border-blue-600 touch-manipulation">
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                          <span className="truncate text-xs sm:text-sm">
                            {returnDate
                              ? format(returnDate, "MMM d")
                              : "Drop-off date"}
                          </span>
                        </button>
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

                  <div className="relative w-24">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                      Time
                    </label>
                    <Select value={returnTime} onValueChange={setReturnTime}>
                      <SelectTrigger className="w-full h-12 text-xs border-2 border-blue-500">
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
              <div className="relative w-32">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
                  Passengers
                </label>
                <Popover
                  open={isPassengerPopoverOpen}
                  onOpenChange={setIsPassengerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <button className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-12 w-full hover:border-blue-600 touch-manipulation">
                      <Users className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                      <span className="truncate text-xs sm:text-sm">
                        {passengerSummary()}
                      </span>
                    </button>
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
                            onClick={() =>
                              updatePassengerCount("adults", "decrement")
                            }
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
                            onClick={() =>
                              updatePassengerCount("adults", "increment")
                            }
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
                          <div className="text-sm text-gray-500">
                            2-11 years
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 rounded-full"
                            onClick={() =>
                              updatePassengerCount("children", "decrement")
                            }
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
                            onClick={() =>
                              updatePassengerCount("children", "increment")
                            }
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
                          <div className="text-sm text-gray-500">
                            Under 2 years
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 rounded-full"
                            onClick={() =>
                              updatePassengerCount("infants", "decrement")
                            }
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
                            onClick={() =>
                              updatePassengerCount("infants", "increment")
                            }
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
              <div className="w-full sm:w-auto">
                <Button
                  onClick={handleSearch}
                  className="h-12 w-full sm:w-auto bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-bold rounded px-6 sm:px-8 transition-all duration-150"
                >
                  <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Search</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
