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
import { format, addDays } from "date-fns";
import {
  Plane,
  CalendarIcon,
  Users,
  Search,
  ArrowUpDown,
  Plus,
  Minus,
  MapPin,
  Clock,
  Star,
  Zap,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ErrorBanner } from "@/components/ErrorBanner";

interface PassengerConfig {
  adults: number;
  children: number;
  infants: number;
}

interface Airport {
  code: string;
  city: string;
  country: string;
  popular?: boolean;
}

export function FlightSearchForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Trip configuration
  const [tripType, setTripType] = useState("round-trip");
  const [cabinClass, setCabinClass] = useState("economy");

  // Airports with enhanced data
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<Airport[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Airport[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 8);

  const [departureDate, setDepartureDate] = useState<Date | undefined>(tomorrow);
  const [returnDate, setReturnDate] = useState<Date | undefined>(nextWeek);
  const [isDepartureDateOpen, setIsDepartureDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  // Passengers
  const [passengers, setPassengers] = useState<PassengerConfig>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [isPassengerPopoverOpen, setIsPassengerPopoverOpen] = useState(false);

  // UI States
  const [isMobile, setIsMobile] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Enhanced airports data
  const airportsData: Airport[] = [
    { code: "DXB", city: "Dubai", country: "UAE", popular: true },
    { code: "LHR", city: "London", country: "UK", popular: true },
    { code: "CDG", city: "Paris", country: "France", popular: true },
    { code: "BCN", city: "Barcelona", country: "Spain", popular: true },
    { code: "FCO", city: "Rome", country: "Italy", popular: true },
    { code: "JFK", city: "New York", country: "USA", popular: true },
    { code: "LAX", city: "Los Angeles", country: "USA", popular: true },
    { code: "BKK", city: "Bangkok", country: "Thailand", popular: true },
    { code: "SIN", city: "Singapore", country: "Singapore", popular: true },
    { code: "NRT", city: "Tokyo", country: "Japan", popular: true },
    { code: "SYD", city: "Sydney", country: "Australia", popular: true },
    { code: "BOM", city: "Mumbai", country: "India", popular: true },
    { code: "DEL", city: "Delhi", country: "India", popular: true },
    { code: "BLR", city: "Bangalore", country: "India", popular: true },
    { code: "MAD", city: "Madrid", country: "Spain" },
    { code: "AMS", city: "Amsterdam", country: "Netherlands" },
    { code: "FRA", city: "Frankfurt", country: "Germany" },
    { code: "ZUR", city: "Zurich", country: "Switzerland" },
    { code: "VIE", city: "Vienna", country: "Austria" },
    { code: "MUC", city: "Munich", country: "Germany" },
  ];

  // Form validation
  useEffect(() => {
    const errors: Record<string, string> = {};
    
    if (!fromCity) errors.from = "Departure city is required";
    if (!toCity) errors.to = "Destination city is required";
    if (fromCity === toCity && fromCity) errors.same = "Departure and destination cannot be the same";
    if (!departureDate) errors.departure = "Departure date is required";
    if (tripType === "round-trip" && !returnDate) errors.return = "Return date is required";
    if (departureDate && returnDate && departureDate >= returnDate) {
      errors.dates = "Return date must be after departure date";
    }

    setValidationErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  }, [fromCity, toCity, departureDate, returnDate, tripType]);

  // Enhanced airport search
  const searchAirports = (query: string): Airport[] => {
    if (!query || query.length < 2) return airportsData.filter(a => a.popular);
    
    return airportsData.filter(airport =>
      airport.city.toLowerCase().includes(query.toLowerCase()) ||
      airport.code.toLowerCase().includes(query.toLowerCase()) ||
      airport.country.toLowerCase().includes(query.toLowerCase())
    ).sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    });
  };

  const handleFromCityChange = (value: string) => {
    setFromCity(value);
    setFromSuggestions(searchAirports(value));
    setShowFromSuggestions(true);
  };

  const handleToCityChange = (value: string) => {
    setToCity(value);
    setToSuggestions(searchAirports(value));
    setShowToSuggestions(true);
  };

  const selectAirport = (airport: Airport, isFrom: boolean) => {
    const formattedValue = `${airport.city} (${airport.code})`;
    if (isFrom) {
      setFromCity(formattedValue);
      setShowFromSuggestions(false);
    } else {
      setToCity(formattedValue);
      setShowToSuggestions(false);
    }
  };

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

  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleSearch = async () => {
    if (!isFormValid) {
      setErrorMessage(Object.values(validationErrors)[0]);
      setShowError(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setShowError(false);

    try {
      const searchParams = new URLSearchParams({
        from: fromCity,
        to: toCity,
        departureDate: departureDate!.toISOString(),
        adults: passengers.adults.toString(),
        children: passengers.children.toString(),
        infants: passengers.infants.toString(),
        tripType,
        cabinClass,
      });

      if (tripType === "round-trip" && returnDate) {
        searchParams.set("returnDate", returnDate.toISOString());
      }

      // Simulate AI optimization delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      navigate(`/flights/results?${searchParams.toString()}`);
    } catch (error) {
      console.error("Flight search error:", error);
      setErrorMessage("Search failed. Please try again.");
      setShowError(true);
    } finally {
      setIsLoading(false);
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
      
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-gray-100 max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Flight Search</h3>
              <p className="text-sm text-gray-600">AI-powered flight discovery</p>
            </div>
          </div>
          
          {/* Live Status Indicator */}
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Live Prices</span>
          </div>
        </div>

        {/* Trip Type and Class Selection */}
        <div className="grid grid-cols-2 md:flex md:space-x-4 gap-3 mb-6">
          <Select value={tripType} onValueChange={setTripType}>
            <SelectTrigger className="h-12 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round-trip">
                <div className="flex items-center space-x-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Round Trip</span>
                </div>
              </SelectItem>
              <SelectItem value="one-way">
                <div className="flex items-center space-x-2">
                  <Plane className="w-4 h-4" />
                  <span>One Way</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={cabinClass} onValueChange={setCabinClass}>
            <SelectTrigger className="h-12 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
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

        {/* Main Search Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* From City */}
          <div className="lg:col-span-3 relative">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              From
            </label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5 z-10" />
              <Input
                type="text"
                value={fromCity}
                onChange={(e) => handleFromCityChange(e.target.value)}
                onFocus={() => setShowFromSuggestions(true)}
                className={`pl-12 h-14 bg-gray-50 border-2 focus:border-blue-500 rounded-xl font-medium transition-all ${
                  validationErrors.from ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="Departure city"
                autoComplete="off"
              />
              
              {/* From City Suggestions */}
              {showFromSuggestions && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 mt-1 max-h-64 overflow-y-auto">
                  {fromSuggestions.map((airport) => (
                    <button
                      key={airport.code}
                      onClick={() => selectAirport(airport, true)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{airport.city}</div>
                        <div className="text-sm text-gray-600">{airport.country}</div>
                      </div>
                      <div className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded group-hover:bg-blue-100">
                        {airport.code}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {validationErrors.from && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.from}</p>
            )}
          </div>

          {/* Swap Button */}
          <div className="lg:col-span-1 flex items-end justify-center pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={swapCities}
              className="w-12 h-12 p-0 rounded-full border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-all"
            >
              <ArrowUpDown className="w-5 h-5 text-blue-600" />
            </Button>
          </div>

          {/* To City */}
          <div className="lg:col-span-3 relative">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              To
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5 z-10" />
              <Input
                type="text"
                value={toCity}
                onChange={(e) => handleToCityChange(e.target.value)}
                onFocus={() => setShowToSuggestions(true)}
                className={`pl-12 h-14 bg-gray-50 border-2 focus:border-blue-500 rounded-xl font-medium transition-all ${
                  validationErrors.to ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="Destination city"
                autoComplete="off"
              />
              
              {/* To City Suggestions */}
              {showToSuggestions && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 mt-1 max-h-64 overflow-y-auto">
                  {toSuggestions.map((airport) => (
                    <button
                      key={airport.code}
                      onClick={() => selectAirport(airport, false)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{airport.city}</div>
                        <div className="text-sm text-gray-600">{airport.country}</div>
                      </div>
                      <div className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded group-hover:bg-blue-100">
                        {airport.code}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {validationErrors.to && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.to}</p>
            )}
          </div>

          {/* Departure Date */}
          <div className="lg:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Departure
            </label>
            <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full h-14 justify-start text-left font-medium bg-gray-50 border-2 hover:border-blue-400 rounded-xl transition-all ${
                    validationErrors.departure ? 'border-red-400' : 'border-gray-200'
                  }`}
                >
                  <CalendarIcon className="mr-3 h-5 w-5 text-blue-600" />
                  <span className="truncate">
                    {departureDate ? format(departureDate, "MMM d, yyyy") : "Select date"}
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
            {validationErrors.departure && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.departure}</p>
            )}
          </div>

          {/* Return Date */}
          {tripType === "round-trip" && (
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Return
              </label>
              <Popover open={isReturnDateOpen} onOpenChange={setIsReturnDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full h-14 justify-start text-left font-medium bg-gray-50 border-2 hover:border-blue-400 rounded-xl transition-all ${
                      validationErrors.return ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-blue-600" />
                    <span className="truncate">
                      {returnDate ? format(returnDate, "MMM d, yyyy") : "Select date"}
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
              {validationErrors.return && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.return}</p>
              )}
            </div>
          )}

          {/* Passengers */}
          <div className="lg:col-span-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Passengers
            </label>
            <Popover
              open={isPassengerPopoverOpen}
              onOpenChange={setIsPassengerPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start text-left font-medium bg-gray-50 border-2 border-gray-200 hover:border-blue-400 rounded-xl transition-all"
                >
                  <Users className="mr-3 h-5 w-5 text-blue-600" />
                  <span className="truncate">{passengerSummary()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900">Select Passengers</h4>
                    <p className="text-sm text-gray-600">Choose the number of travelers</p>
                  </div>

                  {/* Adults */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Adults</div>
                      <div className="text-sm text-gray-600">12+ years</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-full"
                        onClick={() => updatePassengerCount("adults", "decrement")}
                        disabled={passengers.adults <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-bold text-lg">
                        {passengers.adults}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-full"
                        onClick={() => updatePassengerCount("adults", "increment")}
                        disabled={passengers.adults >= 9}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Children</div>
                      <div className="text-sm text-gray-600">2-11 years</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-full"
                        onClick={() => updatePassengerCount("children", "decrement")}
                        disabled={passengers.children <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-bold text-lg">
                        {passengers.children}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-full"
                        onClick={() => updatePassengerCount("children", "increment")}
                        disabled={passengers.children >= 9}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Infants</div>
                      <div className="text-sm text-gray-600">Under 2 years</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-full"
                        onClick={() => updatePassengerCount("infants", "decrement")}
                        disabled={passengers.infants <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-bold text-lg">
                        {passengers.infants}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-full"
                        onClick={() => updatePassengerCount("infants", "increment")}
                        disabled={passengers.infants >= 9}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsPassengerPopoverOpen(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Validation Errors */}
        {(validationErrors.same || validationErrors.dates) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">
              {validationErrors.same || validationErrors.dates}
            </span>
          </div>
        )}

        {/* Enhanced Search Button */}
        <div className="flex flex-col space-y-4">
          <Button
            onClick={handleSearch}
            disabled={!isFormValid || isLoading}
            className={`h-16 w-full font-bold text-lg rounded-xl transition-all duration-300 ${
              isFormValid && !isLoading
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>AI is finding best deals...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Search className="w-6 h-6" />
                <span>Search Flights</span>
                <Zap className="w-5 h-5" />
              </div>
            )}
          </Button>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure Booking</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Best Price Guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside handlers */}
      {(showFromSuggestions || showToSuggestions) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowFromSuggestions(false);
            setShowToSuggestions(false);
          }}
        />
      )}
    </>
  );
}
