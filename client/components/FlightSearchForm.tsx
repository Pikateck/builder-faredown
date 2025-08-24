import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plane,
  CalendarIcon,
  Users,
  Search,
  X,
  Plus,
  Minus,
  ArrowRight,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/ErrorBanner";

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  popular?: boolean;
}

interface PassengerConfig {
  adults: number;
  children: number;
  infants: number;
}

type TripType = "one-way" | "round-trip" | "multi-city";
type CabinClass = "economy" | "premium-economy" | "business" | "first";

export function FlightSearchForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Trip configuration
  const [tripType, setTripType] = useState<TripType>("round-trip");
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");

  // Airport states
  const [fromAirport, setFromAirport] = useState<Airport | null>(null);
  const [toAirport, setToAirport] = useState<Airport | null>(null);
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [fromSearchValue, setFromSearchValue] = useState("");
  const [toSearchValue, setToSearchValue] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<Airport[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Airport[]>([]);
  const [loadingAirports, setLoadingAirports] = useState(false);

  // Date states
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 8);

  const [departureDate, setDepartureDate] = useState<Date | undefined>(tomorrow);
  const [returnDate, setReturnDate] = useState<Date | undefined>(weekLater);
  const [isDepartureDateOpen, setIsDepartureDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  // Passenger configuration
  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [isPassengerPopoverOpen, setIsPassengerPopoverOpen] = useState(false);

  // Mobile states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);

  // Popular airports data
  const popularAirports: Airport[] = [
    { code: "DXB", name: "Dubai International", city: "Dubai", country: "UAE", popular: true },
    { code: "LHR", name: "Heathrow", city: "London", country: "UK", popular: true },
    { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", popular: true },
    { code: "BCN", name: "Barcelona El Prat", city: "Barcelona", country: "Spain", popular: true },
    { code: "FCO", name: "Leonardo da Vinci", city: "Rome", country: "Italy", popular: true },
    { code: "JFK", name: "John F. Kennedy", city: "New York", country: "USA", popular: true },
    { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "USA", popular: true },
    { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thailand", popular: true },
    { code: "SIN", name: "Changi", city: "Singapore", country: "Singapore", popular: true },
    { code: "NRT", name: "Narita International", city: "Tokyo", country: "Japan", popular: true },
    { code: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Australia", popular: true },
    { code: "BOM", name: "Chhatrapati Shivaji", city: "Mumbai", country: "India", popular: true },
    { code: "DEL", name: "Indira Gandhi International", city: "Delhi", country: "India", popular: true },
    { code: "BLR", name: "Kempegowda International", city: "Bangalore", country: "India", popular: true },
  ];

  // Debounced search ref
  const debouncedSearchRef = useRef<NodeJS.Timeout>();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Search airports function
  const searchAirports = useCallback(
    async (query: string, setResults: (airports: Airport[]) => void) => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current);
      }

      debouncedSearchRef.current = setTimeout(() => {
        setLoadingAirports(true);
        try {
          // Filter popular airports based on search
          const filtered = popularAirports.filter(
            (airport) =>
              airport.name.toLowerCase().includes(query.toLowerCase()) ||
              airport.city.toLowerCase().includes(query.toLowerCase()) ||
              airport.code.toLowerCase().includes(query.toLowerCase()) ||
              airport.country.toLowerCase().includes(query.toLowerCase())
          );
          setResults(filtered.slice(0, 10));
        } catch (error) {
          console.error("Airport search error:", error);
          setResults([]);
        } finally {
          setLoadingAirports(false);
        }
      }, 200);
    },
    []
  );

  // Handle passenger count updates
  const updatePassengerCount = (
    type: keyof PassengerConfig,
    operation: "increment" | "decrement"
  ) => {
    setPassengers((prev) => {
      const newValue =
        operation === "increment" ? prev[type] + 1 : prev[type] - 1;

      // Validation rules
      if (type === "adults" && newValue < 1) return prev;
      if ((type === "children" || type === "infants") && newValue < 0) return prev;
      if (type === "adults" && newValue > 9) return prev;
      if ((type === "children" || type === "infants") && newValue > 9) return prev;

      return {
        ...prev,
        [type]: newValue,
      };
    });
  };

  // Swap airports
  const swapAirports = () => {
    const tempAirport = fromAirport;
    const tempSearch = fromSearchValue;
    
    setFromAirport(toAirport);
    setToAirport(tempAirport);
    setFromSearchValue(toSearchValue);
    setToSearchValue(tempSearch);
  };

  // Handle search
  const handleSearch = () => {
    console.log("🔍 Starting flight search with:", {
      from: fromAirport,
      to: toAirport,
      departureDate,
      returnDate,
      passengers,
      tripType,
      cabinClass,
    });

    // Validate required fields
    if (!fromAirport || !toAirport) {
      setErrorMessage("Please select departure and arrival airports");
      setShowError(true);
      return;
    }

    if (!departureDate) {
      setErrorMessage("Please select departure date");
      setShowError(true);
      return;
    }

    if (tripType === "round-trip" && !returnDate) {
      setErrorMessage("Please select return date for round-trip");
      setShowError(true);
      return;
    }

    if (fromAirport.code === toAirport.code) {
      setErrorMessage("Departure and arrival airports cannot be the same");
      setShowError(true);
      return;
    }

    try {
      const searchParams = new URLSearchParams({
        from: fromAirport.code,
        to: toAirport.code,
        departureDate: departureDate.toISOString(),
        adults: passengers.adults.toString(),
        children: passengers.children.toString(),
        infants: passengers.infants.toString(),
        tripType,
        cabinClass,
        searchType: "live",
        searchId: Date.now().toString(),
      });

      if (tripType === "round-trip" && returnDate) {
        searchParams.set("returnDate", returnDate.toISOString());
      }

      const url = `/flights/results?${searchParams.toString()}`;
      console.log("✈️ Navigating to flight search:", url);
      navigate(url);
    } catch (error) {
      console.error("🚨 Error in flight search:", error);
      setErrorMessage("Search failed. Please try again.");
      setShowError(true);
    }
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

  // Airport dropdown component
  const AirportDropdown = ({
    airport,
    setAirport,
    searchValue,
    setSearchValue,
    suggestions,
    setSuggestions,
    isOpen,
    setIsOpen,
    placeholder,
  }: {
    airport: Airport | null;
    setAirport: (airport: Airport | null) => void;
    searchValue: string;
    setSearchValue: (value: string) => void;
    suggestions: Airport[];
    setSuggestions: (airports: Airport[]) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    placeholder: string;
  }) => (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer">
          <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 z-10" />
          <Input
            type="text"
            value={airport ? `${airport.code} - ${airport.city}` : searchValue}
            onChange={(e) => {
              const value = e.target.value;
              setSearchValue(value);
              if (!airport) {
                searchAirports(value, setSuggestions);
              }
            }}
            onFocus={() => {
              setIsOpen(true);
              if (!airport) {
                setSuggestions(popularAirports.slice(0, 8));
              }
            }}
            onClick={() => setIsOpen(true)}
            className="pl-10 pr-8 h-10 sm:h-12 bg-white border-2 border-blue-400 focus:border-[#003580] rounded font-medium text-xs sm:text-sm"
            placeholder={placeholder}
            autoComplete="off"
          />
          {(airport || searchValue) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAirport(null);
                setSearchValue("");
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-[480px] p-0" align="start">
        <div className="max-h-80 overflow-y-auto">
          {loadingAirports ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Searching airports...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b">
                <span className="text-xs font-medium text-gray-600">
                  {searchValue ? "Search Results" : "Popular Airports"}
                </span>
              </div>
              {suggestions.map((airportOption) => (
                <div
                  key={airportOption.code}
                  className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0"
                  onClick={() => {
                    setAirport(airportOption);
                    setSearchValue("");
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4 shadow-md">
                    <Plane className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {airportOption.city}, {airportOption.country}
                        </div>
                        <div className="text-xs text-gray-500">
                          {airportOption.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {airportOption.code}
                        </div>
                        {airportOption.popular && (
                          <div className="text-xs text-green-600 font-medium">
                            Popular
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchValue ? (
            <div className="p-4 text-center">
              <div className="text-sm text-gray-500 mb-2">
                No airports found for "{searchValue}"
              </div>
              <div className="text-xs text-gray-400">
                Try searching by city or airport code
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <div className="text-sm text-gray-500">
                Start typing to search airports
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <ErrorBanner
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto border border-gray-200">
        {/* Trip Type and Class Selection */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex gap-2">
            {/* Trip Type */}
            <Select value={tripType} onValueChange={(value: TripType) => setTripType(value)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round-trip">Round-trip</SelectItem>
                <SelectItem value="one-way">One-way</SelectItem>
                <SelectItem value="multi-city">Multi-city</SelectItem>
              </SelectContent>
            </Select>

            {/* Cabin Class */}
            <Select value={cabinClass} onValueChange={(value: CabinClass) => setCabinClass(value)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="premium-economy">Premium Economy</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="first">First Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Search Form */}
        <div className="flex flex-col lg:flex-row gap-2 mb-4">
          {/* From Airport */}
          <div className="flex-1 lg:max-w-[280px] relative">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              From
            </label>
            <AirportDropdown
              airport={fromAirport}
              setAirport={setFromAirport}
              searchValue={fromSearchValue}
              setSearchValue={setFromSearchValue}
              suggestions={fromSuggestions}
              setSuggestions={setFromSuggestions}
              isOpen={isFromDropdownOpen}
              setIsOpen={setIsFromDropdownOpen}
              placeholder="From where?"
            />
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center lg:px-2">
            <Button
              variant="outline"
              size="sm"
              onClick={swapAirports}
              className="w-8 h-8 p-0 rounded-full border-blue-400 hover:bg-blue-50"
            >
              <ArrowUpDown className="w-4 h-4 text-blue-600" />
            </Button>
          </div>

          {/* To Airport */}
          <div className="flex-1 lg:max-w-[280px] relative">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              To
            </label>
            <AirportDropdown
              airport={toAirport}
              setAirport={setToAirport}
              searchValue={toSearchValue}
              setSearchValue={setToSearchValue}
              suggestions={toSuggestions}
              setSuggestions={setToSuggestions}
              isOpen={isToDropdownOpen}
              setIsOpen={setIsToDropdownOpen}
              placeholder="To where?"
            />
          </div>

          {/* Departure Date */}
          <div className="flex-1 lg:max-w-[160px]">
            <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
              Departure
            </label>
            <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {departureDate ? format(departureDate, "MMM d") : "Departure"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <BookingCalendar
                  initialRange={{
                    startDate: departureDate || new Date(),
                    endDate: departureDate || new Date(),
                  }}
                  onChange={(range) => {
                    setDepartureDate(range.startDate);
                    setIsDepartureDateOpen(false);
                  }}
                  onClose={() => setIsDepartureDateOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Return Date */}
          {tripType === "round-trip" && (
            <div className="flex-1 lg:max-w-[160px]">
              <label className="text-xs font-medium text-gray-800 mb-1 block sm:hidden">
                Return
              </label>
              <Popover open={isReturnDateOpen} onOpenChange={setIsReturnDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 sm:h-12 justify-start text-left font-medium bg-white border-2 border-blue-400 hover:border-blue-500 rounded text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {returnDate ? format(returnDate, "MMM d") : "Return"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <BookingCalendar
                    initialRange={{
                      startDate: returnDate || addDays(departureDate || new Date(), 7),
                      endDate: returnDate || addDays(departureDate || new Date(), 7),
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
          )}

          {/* Passengers */}
          <div className="flex-1 lg:max-w-[200px]">
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
                  <span className="truncate">
                    {passengers.adults + passengers.children + passengers.infants} passenger{passengers.adults + passengers.children + passengers.infants > 1 ? "s" : ""}
                  </span>
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
              <span className="text-sm sm:text-base">Search Flights</span>
            </Button>
          </div>
        </div>

        {/* Mobile Date Picker */}
        <MobileDatePicker
          isOpen={showMobileDatePicker}
          onClose={() => setShowMobileDatePicker(false)}
          tripType={tripType}
          setTripType={setTripType}
          selectedDepartureDate={departureDate}
          selectedReturnDate={returnDate}
          setSelectedDepartureDate={(date) => setDepartureDate(date)}
          setSelectedReturnDate={(date) => setReturnDate(date)}
          selectingDeparture={true}
          setSelectingDeparture={() => {}}
        />
      </div>
    </>
  );
}
