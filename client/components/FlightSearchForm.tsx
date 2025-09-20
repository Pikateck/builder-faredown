import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/contexts/SearchContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StableBookingCalendar } from "@/components/StableBookingCalendar";
import { format, addDays } from "date-fns";
import {
  Plane,
  CalendarIcon,
  Users,
  Search,
  ArrowUpDown,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";

interface PassengerConfig {
  adults: number;
  children: number;
  infants: number;
}

export function FlightSearchForm() {
  const navigate = useNavigate();
  const { updateSearchParams, getDisplayData, searchParams } = useSearch();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Airports
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [fromInputValue, setFromInputValue] = useState("");
  const [toInputValue, setToInputValue] = useState("");

  // Dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 8);

  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    tomorrow,
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(nextWeek);
  const [isDepartureDateOpen, setIsDepartureDateOpen] = useState(false);

  // Passengers
  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [isPassengerPopoverOpen, setIsPassengerPopoverOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsFromOpen(false);
      setIsToOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Popular airports for quick selection
  const popularAirports = [
    "Dubai (DXB)",
    "London (LHR)",
    "Paris (CDG)",
    "Barcelona (BCN)",
    "Rome (FCO)",
    "New York (JFK)",
    "Los Angeles (LAX)",
    "Bangkok (BKK)",
    "Singapore (SIN)",
    "Tokyo (NRT)",
    "Sydney (SYD)",
    "Mumbai (BOM)",
    "Delhi (DEL)",
    "Bangalore (BLR)",
  ];

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

  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleSearch = () => {
    // Basic validation
    if (!fromCity || !toCity) {
      setErrorMessage("Please enter departure and arrival cities");
      setShowError(true);
      return;
    }

    if (!departureDate) {
      setErrorMessage("Please select departure date");
      setShowError(true);
      return;
    }

    try {
      // Update SearchContext with the search parameters
      updateSearchParams({
        destination: `${fromCity} to ${toCity}`,
        destinationName: `${fromCity} to ${toCity}`,
        departureDate: departureDate.toISOString(),
        returnDate: returnDate?.toISOString(),
        checkIn: departureDate.toISOString(),
        checkOut: returnDate?.toISOString() || departureDate.toISOString(),
        passengers: {
          adults: passengers.adults,
          children: passengers.children,
          infants: passengers.infants,
        },
        guests: {
          adults: passengers.adults,
          children: passengers.children,
        },
        rooms: 1,
        module: "flights",
        tripType: returnDate ? "round-trip" : "one-way",
        searchTimestamp: new Date().toISOString(),
      });

      const searchParams = new URLSearchParams({
        from: fromCity,
        to: toCity,
        departureDate: departureDate.toISOString(),
        adults: passengers.adults.toString(),
        children: passengers.children.toString(),
        infants: passengers.infants.toString(),
      });

      if (returnDate) {
        searchParams.set("returnDate", returnDate.toISOString());
      }

      navigate(`/flights/results?${searchParams.toString()}`);
    } catch (error) {
      console.error("Flight search error:", error);
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
        {/* Main Search Form */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">
          {/* From City */}
          <div
            className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              From where?
            </label>
            <div className="relative">
              <button
                onClick={() => setIsFromOpen(!isFromOpen)}
                className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-10 w-full hover:border-blue-600 touch-manipulation pr-10"
              >
                <Plane className="w-4 h-4 text-gray-500 mr-2" />
                <div className="flex items-center space-x-2 min-w-0">
                  {fromCity ? (
                    <>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        DEP
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {fromCity}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium">
                      From where?
                    </span>
                  )}
                </div>
              </button>
              {fromCity && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFromCity("");
                    setFromInputValue("");
                    setIsFromOpen(false);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear departure city"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* From Cities Dropdown */}
            {isFromOpen && (
              <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Departure city
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={fromInputValue}
                      onChange={(e) => setFromInputValue(e.target.value)}
                      placeholder="Search airports..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {popularAirports
                    .filter((airport) =>
                      airport
                        .toLowerCase()
                        .includes((fromInputValue || "").toLowerCase()),
                    )
                    .slice(0, 8)
                    .map((airport, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setFromCity(airport);
                          setIsFromOpen(false);
                          setFromInputValue("");
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                            <Plane className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {airport}
                            </div>
                            <div className="text-xs text-gray-500">Airport</div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center lg:px-2">
            <Button
              variant="outline"
              size="sm"
              onClick={swapCities}
              className="w-8 h-8 p-0 rounded-full border-blue-400 hover:bg-blue-50"
            >
              <ArrowUpDown className="w-4 h-4 text-blue-600" />
            </Button>
          </div>

          {/* To City */}
          <div
            className="relative flex-1 lg:min-w-[280px] lg:max-w-[320px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium z-10">
              To where?
            </label>
            <div className="relative">
              <button
                onClick={() => setIsToOpen(!isToOpen)}
                className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-10 w-full hover:border-blue-600 touch-manipulation pr-10"
              >
                <Plane className="w-4 h-4 text-gray-500 mr-2" />
                <div className="flex items-center space-x-2 min-w-0">
                  {toCity ? (
                    <>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        ARR
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {toCity}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium">
                      To where?
                    </span>
                  )}
                </div>
              </button>
              {toCity && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setToCity("");
                    setToInputValue("");
                    setIsToOpen(false);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear arrival city"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* To Cities Dropdown */}
            {isToOpen && (
              <div className="absolute top-14 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 z-50 w-full sm:w-96 max-h-80 overflow-y-auto">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Arrival city
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={toInputValue}
                      onChange={(e) => setToInputValue(e.target.value)}
                      placeholder="Search airports..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {popularAirports
                    .filter((airport) =>
                      airport
                        .toLowerCase()
                        .includes((toInputValue || "").toLowerCase()),
                    )
                    .slice(0, 8)
                    .map((airport, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setToCity(airport);
                          setIsToOpen(false);
                          setToInputValue("");
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                            <Plane className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {airport}
                            </div>
                            <div className="text-xs text-gray-500">Airport</div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Departure Date */}
          <div className="flex-1 lg:max-w-[280px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Travel dates
            </label>
            <Popover
              open={isDepartureDateOpen}
              onOpenChange={setIsDepartureDateOpen}
            >
              <PopoverTrigger asChild>
                <button className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-10 w-full hover:border-blue-600 touch-manipulation">
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
                  <span className="truncate text-xs sm:text-sm">
                    <span className="hidden md:inline">
                      {departureDate && returnDate
                        ? `${format(departureDate, "MMM d")} - ${format(returnDate, "MMM d")}`
                        : departureDate
                          ? format(departureDate, "MMM d")
                          : "Travel dates"}
                    </span>
                    <span className="md:hidden">
                      {departureDate && returnDate
                        ? `${format(departureDate, "d MMM")} - ${format(returnDate, "d MMM")}`
                        : departureDate
                          ? format(departureDate, "d MMM")
                          : "Dates"}
                    </span>
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <StableBookingCalendar
                  initialRange={{
                    startDate: departureDate || new Date(),
                    endDate:
                      returnDate || addDays(departureDate || new Date(), 7),
                  }}
                  onChange={(range) => {
                    setDepartureDate(range.startDate);
                    setReturnDate(range.endDate);
                    setIsDepartureDateOpen(false);
                  }}
                  onClose={() => setIsDepartureDateOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Passengers */}
          <div className="flex-1 lg:max-w-[280px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Passengers
            </label>
            <Popover
              open={isPassengerPopoverOpen}
              onOpenChange={setIsPassengerPopoverOpen}
            >
              <PopoverTrigger asChild>
                <button className="flex items-center bg-white rounded border-2 border-blue-500 px-3 py-2 h-10 w-full hover:border-blue-600 touch-manipulation">
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
                      <div className="text-sm text-gray-500">2-11 years</div>
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
                      <div className="text-sm text-gray-500">Under 2 years</div>
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
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button
              onClick={handleSearch}
              className="h-10 w-full sm:w-auto bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-bold rounded px-6 sm:px-8 transition-all duration-150"
            >
              <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Search Flights</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
